/**
 * Add command handler for processing transactions
 * Handles /add command with photo or text
 */

import { getReceiptDetail } from "../../utils/receipt-processor";
import * as textChain from "../../text-chain";
import { createExpenseKeyboard } from "../../keyboards/bill-keyboards";
import IDManager from "../../managers/id-manager";

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

      // Generate sequential numeric transaction ID starting from 100
      const transactionId = await IDManager.generateTransactionID();

      // Create transaction message with expense keyboard
      const transactionMessage = formatTransactionMessage(
        "expense",
        transactionId,
        billDetail
      );
      const keyboard = createExpenseKeyboard(transactionId, billDetail);

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
        const billDetail = await textChain.generateBillInfo(description);

        // Generate sequential numeric transaction ID starting from 100
        const transactionId = await IDManager.generateTransactionID();

        // Create transaction message with expense keyboard
        const transactionMessage = formatTransactionMessage(
          "expense",
          transactionId,
          billDetail
        );
        const keyboard = createExpenseKeyboard(transactionId, billDetail);

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
  billDetail: any
): string {
  const typeEmoji = getTransactionTypeEmoji(type);
  const typeName = getTransactionTypeName(type);

  return `💰 Amount: $${billDetail.total_price || billDetail.amount || "25.50"}
📅 Date: ${formatDate(billDetail.date)}
📂 Category: ${billDetail.category || "Other"}
💳 Account: ${billDetail.account || "Main Card"}

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
 * Format date for display
 */
function formatDate(date: any): string {
  if (!date) return new Date().toLocaleDateString();
  if (typeof date === "string") return new Date(date).toLocaleDateString();
  return date.toLocaleDateString();
}

export { registerAddCommand };
