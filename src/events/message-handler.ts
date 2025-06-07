/**
 * Message handler for processing photos and text messages
 */

import * as textChain from "../text-chain";
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

    // Check if message contains numeric ID format for field editing: "100 25.50"
    const text = msg.text;
    if (text) {
      const inputMatch = text.match(/^(\d{3,})\s+(.+)$/);

      if (inputMatch) {
        const transactionId = parseInt(inputMatch[1]);
        const inputValue = inputMatch[2].trim();

        console.log(
          `Processing field update for transaction #${transactionId}: ${inputValue}`
        );

        try {
          // Get transaction data from TempBills
          const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
          if (!tempBill || !tempBill.transactionData) {
            // Send error message and track it for cleanup
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
          let updateSuccess = false;
          let updateMessage = "";

          // Determine what field to update based on input value
          if (inputValue.match(/^\d+(\.\d{1,2})?$/)) {
            // Numeric input - could be amount, exchange rate, or fee
            const numericValue = parseFloat(inputValue);

            // Check if this is likely an exchange rate (between 0.1 and 10)
            if (
              numericValue >= 0.1 &&
              numericValue <= 10 &&
              transactionData.transaction_type === "transfer"
            ) {
              // Update exchange rate and recalculate destination amount
              transactionData.exchange_rate = inputValue;
              const sourceAmount = parseFloat(
                transactionData.total_price || transactionData.amount || "0"
              );
              transactionData.destination_amount = (
                sourceAmount / numericValue
              ).toFixed(2);
              updateMessage = `Exchange rate updated to ${inputValue}`;
              updateSuccess = true;
            } else if (
              numericValue >= 0 &&
              numericValue <= 1000 &&
              transactionData.transaction_type === "transfer"
            ) {
              // Could be a fee (small amount)
              transactionData.fee = numericValue;
              updateMessage =
                numericValue === 0
                  ? "Transfer fee removed"
                  : `Transfer fee set to ${getCurrencySymbol(
                      transactionData.currency_code || "USD"
                    )}${numericValue}`;
              updateSuccess = true;
            } else {
              // Update amount
              transactionData.total_price = numericValue;
              transactionData.amount = numericValue;
              updateMessage = `Amount updated to ${getCurrencySymbol(
                transactionData.currency_code || "USD"
              )}${numericValue}`;
              updateSuccess = true;
            }
          } else {
            // Text input - could be category, account, etc.
            // For now, treat as category update
            transactionData.category = inputValue;
            updateMessage = `Category updated to "${inputValue}"`;
            updateSuccess = true;
          }

          if (updateSuccess) {
            // Update TempBills with new data
            await googleSheetsAdapter.updateTempBill(transactionId, {
              transactionData: transactionData,
              userInputMessageId: msg.message_id, // Track for cleanup
            });

            // Clean up guide messages and user input
            if (
              tempBill.guideMessageIds &&
              tempBill.guideMessageIds.length > 0
            ) {
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
            const transactionType =
              transactionData.transaction_type || "expense";
            let keyboard;

            switch (transactionType) {
              case "income":
                keyboard = createIncomeKeyboard(transactionId, transactionData);
                break;
              case "transfer":
                keyboard = createTransferKeyboard(
                  transactionId,
                  transactionData
                );
                break;
              default:
                keyboard = createExpenseKeyboard(
                  transactionId,
                  transactionData
                );
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
                `Transaction #${transactionId} updated: ${updateMessage}`
              );
            } catch (error) {
              console.error(`Error updating transaction message:`, error);
              // Send a new message if editing fails and track it
              await sendAndTrackMessage(
                bot,
                chatId,
                `✅ ${updateMessage}\n\n${messageText}`,
                transactionId,
                { reply_markup: keyboard },
                "processing"
              );
            }
          }
        } catch (error) {
          console.error(
            `Error processing field update for transaction #${transactionId}:`,
            error
          );
          // Send error message and track it for cleanup
          await sendAndTrackMessage(
            bot,
            chatId,
            `❌ Error updating transaction #${transactionId}. Please try again.`,
            transactionId,
            {},
            "error"
          );
        }

        return; // Don't process as regular message
      }
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
