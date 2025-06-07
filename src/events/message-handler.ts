/**
 * Message handler for processing photos and text messages
 */

import * as textChain from "../text-chain";
import { parseTemplateEdit } from "../template-edit-chain";
import { getReceiptDetail } from "../utils/receipt-processor";
import { BILL_REPLY_MARKUP } from "../utils/helpers";
import googleSheetsAdapter from "../adapters/google-sheets";
import {
  createTransferKeyboard,
  createExpenseKeyboard,
  createIncomeKeyboard,
  formatSubmittedBillMessage,
} from "../keyboards/bill-keyboards";
import {
  sendAndTrackMessage,
  sendTemporaryMessage,
} from "../utils/message-tracker";

/**
 * Format transaction message with details for display
 */
function formatTransactionMessage(
  type: string,
  transactionId: number,
  transactionData: any
): string {
  const typeEmoji = getTransactionTypeEmoji(type);
  const typeName = getTransactionTypeName(type);
  const amount =
    transactionData?.total_price || transactionData?.amount || "25.50";
  const date = formatDate(transactionData?.date);
  const currencySymbol = getCurrencySymbol(
    transactionData?.currency_code || "USD"
  );

  // Handle different transaction types with specific formatting
  if (type === "transfer") {
    const fromAccount =
      transactionData?.account || transactionData?.from_account || "Main Card";
    const toAccount =
      transactionData?.destination_account ||
      transactionData?.to_account ||
      "Cash";
    const fromCurrency = transactionData?.currency_code || "USD";
    const toCurrency = transactionData?.destination_currency || fromCurrency;
    const exchangeRate = transactionData?.exchange_rate || "1.0";
    const destinationAmount =
      transactionData?.destination_amount ||
      (parseFloat(amount) / parseFloat(exchangeRate)).toFixed(2);
    const fee = transactionData?.fee || 0;

    const fromSymbol = getCurrencySymbol(fromCurrency);
    const toSymbol = getCurrencySymbol(toCurrency);
    const totalDeducted =
      fee > 0 ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : amount;

    let transferText = `📤 From: ${fromSymbol}${amount} ${fromCurrency} (${fromAccount})
📥 To: ${toSymbol}${destinationAmount} ${toCurrency} (${toAccount})
💱 Rate: ${exchangeRate} ${fromCurrency}/${toCurrency}
📅 Date: ${date}`;

    if (fee > 0) {
      transferText += `\n💸 Fee: ${fromSymbol}${fee} ${fromCurrency}
💰 Total Deducted: ${fromSymbol}${totalDeducted} ${fromCurrency}`;
    }

    return `${transferText}

---
MENU: ${typeEmoji} ${typeName} Transaction #${transactionId} 👇`;
  } else {
    // For expense and income transactions
    const category = transactionData?.category || "Other";
    const account = transactionData?.account || "Main Card";

    return `💰 Amount: ${currencySymbol}${amount}
📅 Date: ${date}
📂 Category: ${category}
💳 Account: ${account}

---
MENU: ${typeEmoji} ${typeName} Transaction #${transactionId} 👇`;
  }
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

/**
 * Register message handler
 * @param {Object} bot - Telegram bot instance
 */
function registerMessageHandler(bot: any) {
  bot.on("message", async (msg: any) => {
    const chatId = msg.chat.id;

    // Skip if it's a command (starts with /) - commands are handled separately
    if (msg.text && msg.text.startsWith("/")) {
      return;
    }

    // Check if message contains template edit format: "/edit 103\n\namount: 150.00\nrate: 1.18"
    const text = msg.text;
    if (text && text.includes("/edit")) {
      try {
        // Use AI to parse the template
        const parseResult = await parseTemplateEdit(text);

        if (!parseResult.success || parseResult.transaction_id === 0) {
          // Send error message with specific parsing error
          await sendAndTrackMessage(
            bot,
            chatId,
            `❌ Could not parse edit template: ${
              parseResult.error_message || "Invalid format"
            }`,
            0, // No specific transaction ID for error
            { parse_mode: "Markdown" },
            "error"
          );
          return;
        }

        const transactionId = parseResult.transaction_id;
        const fieldsToUpdate = parseResult.fields;

        console.log(
          `Processing template edit for transaction #${transactionId}:`,
          fieldsToUpdate
        );

        // Get transaction data from TempBills
        const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
        if (!tempBill || !tempBill.transactionData) {
          await sendAndTrackMessage(
            bot,
            chatId,
            `❌ Transaction #${transactionId} not found. Use /pending to see active transactions.`,
            transactionId,
            {},
            "error"
          );
          return;
        }

        let transactionData = { ...tempBill.transactionData };
        const updatedFields: string[] = [];

        // Apply field updates
        if (fieldsToUpdate.amount !== undefined) {
          transactionData.total_price = fieldsToUpdate.amount;
          transactionData.amount = fieldsToUpdate.amount;
          updatedFields.push(
            `amount: ${getCurrencySymbol(
              transactionData.currency_code || "USD"
            )}${fieldsToUpdate.amount}`
          );
        }

        if (fieldsToUpdate.date !== undefined) {
          transactionData.date = fieldsToUpdate.date;
          updatedFields.push(`date: ${fieldsToUpdate.date}`);
        }

        if (fieldsToUpdate.rate !== undefined) {
          transactionData.exchange_rate = fieldsToUpdate.rate.toString();
          // Recalculate destination amount if we have source amount
          if (transactionData.total_price || transactionData.amount) {
            const sourceAmount = parseFloat(
              transactionData.total_price || transactionData.amount
            );
            transactionData.destination_amount = (
              sourceAmount / fieldsToUpdate.rate
            ).toFixed(2);
          }
          updatedFields.push(`rate: ${fieldsToUpdate.rate}`);
        }

        if (fieldsToUpdate.fee !== undefined) {
          transactionData.fee = fieldsToUpdate.fee;
          if (fieldsToUpdate.fee === 0) {
            updatedFields.push("fee: removed");
          } else {
            updatedFields.push(
              `fee: ${getCurrencySymbol(
                transactionData.currency_code || "USD"
              )}${fieldsToUpdate.fee}`
            );
          }
        }

        // Update TempBills with new data
        await googleSheetsAdapter.updateTempBill(transactionId, {
          transactionData: transactionData,
          userInputMessageId: msg.message_id, // Track for cleanup
        });

        // Clean up guide messages and user input
        if (tempBill.guideMessageIds && tempBill.guideMessageIds.length > 0) {
          for (const messageId of tempBill.guideMessageIds) {
            try {
              await bot.deleteMessage(chatId, messageId);
            } catch (error) {
              console.warn(
                `Could not delete guide message ${messageId}:`,
                error
              );
            }
          }
        }

        // Delete user's input message
        try {
          await bot.deleteMessage(chatId, msg.message_id);
        } catch (error) {
          console.warn(`Could not delete user input message:`, error);
        }

        // Clear guide message tracking
        await googleSheetsAdapter.updateTempBill(transactionId, {
          guideMessageIds: [],
          userInputMessageId: undefined,
        });

        // Update the original transaction message with new data
        const transactionType = transactionData.transaction_type || "expense";
        let keyboard;

        switch (transactionType) {
          case "income":
            keyboard = createIncomeKeyboard(transactionId, transactionData);
            break;
          case "transfer":
            keyboard = createTransferKeyboard(transactionId, transactionData);
            break;
          default:
            keyboard = createExpenseKeyboard(transactionId, transactionData);
        }

        const messageText = formatTransactionMessage(
          transactionType,
          transactionId,
          transactionData
        );

        // Update the original message
        try {
          await bot.editMessageText(messageText, {
            chat_id: chatId,
            message_id: tempBill.originalMessageId,
            reply_markup: keyboard,
          });

          console.log(
            `Transaction #${transactionId} updated: ${updatedFields.join(", ")}`
          );
        } catch (error) {
          console.error(`Error updating transaction message:`, error);
          // Send a new message if editing fails and track it
          await sendAndTrackMessage(
            bot,
            chatId,
            `✅ Updated: ${updatedFields.join(", ")}\n\n${messageText}`,
            transactionId,
            { reply_markup: keyboard },
            "processing"
          );
        }
      } catch (error) {
        console.error(`Error processing template edit:`, error);
        await sendAndTrackMessage(
          bot,
          chatId,
          `❌ Error processing template edit. Please try again.`,
          0, // No specific transaction ID for error
          {},
          "error"
        );
      }

      return; // Don't process as regular message
    }

    // Skip processing messages that don't use /add command
    // Direct photos/text are no longer processed automatically
    if (!msg.text?.startsWith("/add")) {
      // Send instruction message (temporary, no tracking needed)
      await sendTemporaryMessage(
        bot,
        chatId,
        "📸 Use /add command to process transactions\n\nExamples:\n• /add [then send photo]\n• /add Spent $15 on coffee\n• 100 25.50 (to edit transaction #100)\n\nUse /help for more information.",
        8000 // Auto-delete after 8 seconds
      );
      return;
    }

    // All transaction processing is now handled by /add command
    // This ensures users use the explicit command structure
  });
}

export { registerMessageHandler };
