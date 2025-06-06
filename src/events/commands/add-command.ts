/**
 * Add command handler for processing transactions
 * Handles /add command with photo or text
 */

import { getReceiptDetail } from "../../utils/receipt-processor";
import * as textChain from "../../text-chain";
import { createExpenseKeyboard } from "../../keyboards/bill-keyboards";
import IDManager from "../../managers/id-manager";
import GoogleSheetsAdapter from "../../adapters/google-sheets";

/**
 * Register /add command
 * @param {Object} bot - Telegram bot instance
 */
function registerAddCommand(bot: any) {
  bot.onText(/\/add/, async (msg: any) => {
    const chatId = msg.chat.id;

    // Check if photo or text follows the command
    const hasPhoto =
      !!msg.photo && (!!msg.photo[3]?.file_id || msg.photo[2]?.file_id);
    const hasText = !!msg.text && msg.text.length > 4; // More than just "/add"

    if (hasPhoto) {
      // Process photo with /add command
      const imageId = msg.photo[3]?.file_id || msg.photo[2]?.file_id;

      // Send processing message
      const previewMessage = await bot.sendPhoto(chatId, imageId, {
        caption: "Processing your receipt...",
      });

      // Extract receipt data
      const billDetail = await getReceiptDetail(imageId, msg.caption, bot);

      // Validate bill data (account and category existence)
      const validation = await GoogleSheetsAdapter.validateBillData(billDetail);

      // Use corrected data (removes invalid accounts/categories)
      const validatedBillDetail = validation.correctedData;

      // Validate currency and get warnings with fallback
      let currencyValidation: {
        isValid: boolean;
        currency: string;
        warning?: string;
        supportedCurrencies: string[];
      } = {
        isValid: true,
        currency: validatedBillDetail.currency_code || "USD",
        supportedCurrencies: ["USD", "EUR"],
      };

      try {
        currencyValidation = await GoogleSheetsAdapter.validateCurrency(
          validatedBillDetail.currency_code
        );
        // Use validated currency
        validatedBillDetail.currency_code = currencyValidation.currency;
      } catch (error) {
        console.warn(
          "Failed to validate currency for photo, using extracted value:",
          error
        );
        // Use extracted currency or default to USD
        validatedBillDetail.currency_code =
          validatedBillDetail.currency_code || "USD";
      }

      // Add validation errors to warning if any
      if (!validation.isValid) {
        const validationWarning = validation.errors.join(". ");
        currencyValidation.warning = currencyValidation.warning
          ? `${currencyValidation.warning} ${validationWarning}`
          : validationWarning;
      }

      // Generate sequential numeric transaction ID starting from 100
      const transactionId = await IDManager.generateTransactionID();

      // Create transaction message with expense keyboard
      const transactionMessage = formatTransactionMessage(
        "expense",
        transactionId,
        validatedBillDetail,
        currencyValidation.warning
      );
      const keyboard = createExpenseKeyboard(
        transactionId,
        validatedBillDetail
      );

      // Update the message with transaction details and keyboard
      bot.editMessageCaption(transactionMessage, {
        chat_id: chatId,
        message_id: previewMessage.message_id,
        reply_markup: keyboard,
      });
    } else if (hasText) {
      // Process text with /add command
      const description = msg.text.substring(4).trim(); // Remove "/add" prefix

      if (!description) {
        bot.sendMessage(
          chatId,
          "📸 Send me a photo of your receipt or describe your expense after /add"
        );
        return;
      }

      // Send processing message
      const previewMessage = await bot.sendMessage(
        chatId,
        "Processing your transaction..."
      );

      // Process text description
      const { intent, general } = await textChain.interpretUserMessage(
        description
      );

      if (intent === "add-bill") {
        // Get supported currencies for AI hint with fallback
        let supportedCurrencies: string[] = ["USD", "EUR"];
        let currencyValidation: {
          isValid: boolean;
          currency: string;
          warning?: string;
          supportedCurrencies: string[];
        } = {
          isValid: true,
          currency: "USD",
          supportedCurrencies: ["USD", "EUR"],
        };

        let availableAccounts: any[] = [];
        let availableCategories: any[] = [];

        try {
          supportedCurrencies =
            await GoogleSheetsAdapter.getSupportedCurrencies();
          availableAccounts = await GoogleSheetsAdapter.getAccounts();
          availableCategories = await GoogleSheetsAdapter.getCategories();
        } catch (error) {
          console.warn(
            "Failed to get data from Google Sheets, using defaults:",
            error
          );
        }

        const billDetail = await textChain.generateBillInfo(
          description,
          supportedCurrencies,
          availableAccounts,
          availableCategories
        );

        // Validate bill data (account and category existence)
        const validation = await GoogleSheetsAdapter.validateBillData(
          billDetail
        );

        // Use corrected data (removes invalid accounts/categories)
        const validatedBillDetail = validation.correctedData;

        // Validate currency and get warnings with fallback
        try {
          currencyValidation = await GoogleSheetsAdapter.validateCurrency(
            validatedBillDetail.currency_code
          );
          // Use validated currency
          validatedBillDetail.currency_code = currencyValidation.currency;
        } catch (error) {
          console.warn(
            "Failed to validate currency, using extracted value:",
            error
          );
          // Use extracted currency or default to USD
          validatedBillDetail.currency_code =
            validatedBillDetail.currency_code || "USD";
        }

        // Add validation errors to warning if any
        if (!validation.isValid) {
          const validationWarning = validation.errors.join(". ");
          currencyValidation.warning = currencyValidation.warning
            ? `${currencyValidation.warning} ${validationWarning}`
            : validationWarning;
        }

        // Generate sequential numeric transaction ID starting from 100
        const transactionId = await IDManager.generateTransactionID();

        // Create transaction message with expense keyboard
        const transactionMessage = formatTransactionMessage(
          "expense",
          transactionId,
          validatedBillDetail,
          currencyValidation.warning
        );
        const keyboard = createExpenseKeyboard(
          transactionId,
          validatedBillDetail
        );

        // Update the message with transaction details and keyboard
        bot.editMessageText(transactionMessage, {
          chat_id: chatId,
          message_id: previewMessage.message_id,
          reply_markup: keyboard,
        });
      } else {
        bot.editMessageText(
          general ||
            "I couldn't understand your transaction. Please try again with more details.",
          {
            chat_id: chatId,
            message_id: previewMessage.message_id,
          }
        );
      }
    } else {
      // No photo or text provided
      bot.sendMessage(
        chatId,
        "📸 Send me a photo of your receipt or describe your expense\n\nExample:\n• /add [photo]\n• /add Spent $15 on coffee at Starbucks"
      );
    }
  });
}

/**
 * Format transaction message for display
 */
function formatTransactionMessage(
  type: string,
  transactionId: number,
  billDetail: any,
  warning?: string
): string {
  const typeEmoji = getTransactionTypeEmoji(type);
  const typeName = getTransactionTypeName(type);

  const currencySymbol = getCurrencySymbol(billDetail.currency_code);
  const warningText = warning ? `\n\n⚠️ ${warning}` : "";

  return `💰 Amount: ${currencySymbol}${
    billDetail.total_price || billDetail.amount || "25.50"
  }
📅 Date: ${formatDate(billDetail.date)}
📂 Category: ${billDetail.category || "Other"}
💳 Account: ${billDetail.account || "Main Card"}${warningText}

---
MENU: ${typeEmoji} ${typeName} Transaction #${transactionId} 👇`;
}

/**
 * Get emoji for transaction type
 */
function getTransactionTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    expense: "💸",
    income: "💰",
    transfer: "🔄",
    lend: "🤝",
    borrow: "🙏",
    debt_payment: "💳",
    debt_received: "💵",
  };
  return emojis[type] || "💸";
}

/**
 * Get name for transaction type
 */
function getTransactionTypeName(type: string): string {
  const names: Record<string, string> = {
    expense: "Expense",
    income: "Income",
    transfer: "Transfer",
    lend: "Lend Money",
    borrow: "Borrow Money",
    debt_payment: "Debt Payment",
    debt_received: "Debt Received",
  };
  return names[type] || "Expense";
}

/**
 * Get currency symbol for display
 */
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    GEL: "₾",
    CAD: "C$",
    AUD: "A$",
  };
  return symbols[currencyCode] || currencyCode + " ";
}

/**
 * Format date for display
 */
function formatDate(date: any): string {
  if (!date) return new Date().toLocaleDateString();
  if (typeof date === "string") return new Date(date).toLocaleDateString();
  return date.toLocaleDateString();
}

export { registerAddCommand };
