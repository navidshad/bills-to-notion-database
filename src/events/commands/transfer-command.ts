/**
 * Transfer command handler for processing transfer transactions
 * Handles /transfer command with photo or text
 */

import { getReceiptDetail } from "../../utils/receipt-processor";
import * as textChain from "../../text-chain";
import { createTransferKeyboard } from "../../keyboards/bill-keyboards";
import IDManager from "../../managers/id-manager";
import GoogleSheetsAdapter from "../../adapters/google-sheets";
import {
  sendAndTrackMessage,
  sendTemporaryMessage,
  trackMessageForTransaction,
} from "../../utils/message-tracker";
import {
  TransferRecord,
  transferToBillRecord,
  billToTransferRecord,
} from "../../types/transfer.types";

/**
 * Register /transfer command
 * @param {Object} bot - Telegram bot instance
 */
function registerTransferCommand(bot: any) {
  bot.onText(/\/transfer/, async (msg: any) => {
    const chatId = msg.chat.id;

    // Check if photo or text follows the command
    const hasPhoto =
      !!msg.photo && (!!msg.photo[3]?.file_id || msg.photo[2]?.file_id);
    const hasText = !!msg.text && msg.text.length > 9; // More than just "/transfer"

    if (hasPhoto) {
      // Process photo with /transfer command
      const imageId = msg.photo[3]?.file_id || msg.photo[2]?.file_id;

      // Send processing message
      const previewMessage = await bot.sendPhoto(chatId, imageId, {
        caption: "Processing your transfer receipt...",
      });

      // Extract receipt data with transfer context
      const billDetail = await getReceiptDetail(imageId, msg.caption, bot);

      // Force transaction type to transfer
      billDetail.transaction_type = "transfer";

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
          "Failed to validate currency for transfer photo, using extracted value:",
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

      // Save transaction data to TempBills sheet for persistence
      await GoogleSheetsAdapter.saveTempBill(
        transactionId,
        msg.from.id.toString(), // Telegram user ID
        validatedBillDetail,
        previewMessage.message_id,
        [] // No guide messages yet
      );

      // Track the processing message as it will become the transaction message
      await trackMessageForTransaction(
        transactionId,
        previewMessage.message_id,
        "processing"
      );

      // Create transaction message with transfer keyboard
      const transactionMessage = formatTransferMessage(
        transactionId,
        validatedBillDetail,
        currencyValidation.warning
      );
      const keyboard = await createTransferKeyboard(
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
      // Process text with /transfer command
      const description = msg.text.substring(9).trim(); // Remove "/transfer" prefix

      if (!description) {
        // Send temporary instruction message
        await sendTemporaryMessage(
          bot,
          chatId,
          "💸 Describe your transfer or send a photo\n\nExample:\n• /transfer Transfer $100 from savings to checking\n• /transfer Move €50 from main card to cash wallet",
          8000 // Auto-delete after 8 seconds
        );
        return;
      }

      // Send processing message
      const previewMessage = await bot.sendMessage(
        chatId,
        "Processing your transfer..."
      );

      // Get supported currencies and accounts for AI hint with fallback
      let supportedCurrencies: string[] = [];
      let availableAccounts: any[] = [];

      try {
        supportedCurrencies =
          await GoogleSheetsAdapter.getSupportedCurrencies();
        availableAccounts = await GoogleSheetsAdapter.getAccounts();
      } catch (error) {
        console.warn(
          "Failed to get data from Google Sheets, using defaults:",
          error
        );
      }

      // Process text description for transfer intent
      const { intent, general } = await textChain.interpretTransferMessage(
        description
      );

      if (intent === "transfer") {
        // Generate transfer-specific info using the new transfer chain
        const transferData = await textChain.generateTransferInfo(
          description,
          supportedCurrencies,
          availableAccounts
        );

        // Convert transfer data to bill format for compatibility with existing systems
        const billDetail = transferToBillRecord(transferData);

        // Validate bill data (account and category existence)
        const validation = await GoogleSheetsAdapter.validateBillData(
          billDetail
        );

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
            "Failed to validate currency for transfer, using extracted value:",
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

        // Save transaction data to TempBills sheet for persistence
        await GoogleSheetsAdapter.saveTempBill(
          transactionId,
          msg.from.id.toString(), // Telegram user ID
          validatedBillDetail,
          previewMessage.message_id,
          [] // No guide messages yet
        );

        // Track the processing message as it will become the transaction message
        await trackMessageForTransaction(
          transactionId,
          previewMessage.message_id,
          "processing"
        );

        // Create transaction message with transfer keyboard
        const transactionMessage = formatTransferMessage(
          transactionId,
          validatedBillDetail,
          currencyValidation.warning
        );
        const keyboard = await createTransferKeyboard(
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
            "I couldn't understand your transfer request. Please try again with more details.",
          {
            chat_id: chatId,
            message_id: previewMessage.message_id,
          }
        );
      }
    } else {
      // No photo or text provided - send temporary instruction
      await sendTemporaryMessage(
        bot,
        chatId,
        "🔄 Send me a photo of your transfer receipt or describe your transfer\n\nExample:\n• /transfer [photo]\n• /transfer Move $100 from savings to checking account",
        8000 // Auto-delete after 8 seconds
      );
    }
  });
}

/**
 * Format transfer transaction message for display
 */
function formatTransferMessage(
  transactionId: number,
  billDetail: any,
  warning?: string
): string {
  const amount = billDetail.total_price || billDetail.amount || "100.00";
  const date = formatDate(billDetail.date);
  const fromAccount = billDetail.account || billDetail.from_account || "none";
  const toAccount =
    billDetail.destination_account || billDetail.to_account || "Cash";
  const fromCurrency = billDetail.currency_code || "USD";
  const toCurrency = billDetail.destination_currency || fromCurrency;
  const exchangeRate = billDetail.exchange_rate || "1.0";
  const destinationAmount =
    billDetail.destination_amount ||
    (parseFloat(amount) / parseFloat(exchangeRate)).toFixed(2);
  const fee = billDetail.fee || 0;

  const fromSymbol = getCurrencySymbol(fromCurrency);
  const toSymbol = getCurrencySymbol(toCurrency);
  const totalDeducted =
    fee > 0 ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : amount;

  const warningText = warning ? `\n\n⚠️ ${warning}` : "";

  let transferText = `📤 From: ${fromSymbol}${amount} ${fromCurrency} (${fromAccount})
📥 To: ${toSymbol}${destinationAmount} ${toCurrency} (${toAccount})
💱 Rate: ${exchangeRate} ${fromCurrency}/${toCurrency}
📅 Date: ${date}`;

  if (fee > 0) {
    transferText += `\n💸 Fee: ${fromSymbol}${fee} ${fromCurrency}
💰 Total Deducted: ${fromSymbol}${totalDeducted} ${fromCurrency}`;
  }

  return `${transferText}${warningText}

---
MENU: 🔄 Transfer Transaction #${transactionId} 👇`;
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

export { registerTransferCommand };
