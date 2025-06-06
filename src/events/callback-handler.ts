/**
 * Callback query handler for inline keyboard interactions
 */

import * as textChain from "../text-chain";
import googleSheetsAdapter from "../adapters/google-sheets";
import { getReceiptDetail } from "../utils/receipt-processor";
import { editTextMessage, BILL_REPLY_MARKUP } from "../utils/helpers";
import {
  createExpenseKeyboard,
  createIncomeKeyboard,
  createTransferKeyboard,
  createCancelConfirmationKeyboard,
  createTransactionTypeKeyboard,
  createCategoryKeyboard,
  createAccountKeyboard,
  handlePlaceholderButton,
} from "../keyboards/bill-keyboards";

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
  const category = transactionData?.category || "Other";
  const account = transactionData?.account || "Main Card";

  return `💰 Amount: $${amount}
📅 Date: ${date}
📂 Category: ${category}
💳 Account: ${account}

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

/**
 * Register callback query handler
 * @param {Object} bot - Telegram bot instance
 */
function registerCallbackHandler(bot: any) {
  bot.on("callback_query", async (query: any) => {
    const { data: callback_data, message } = query;
    const chatId = message.chat.id;

    // Handle placeholder buttons (non-implemented features)
    const placeholderFeatures = [
      // Phase 3 features
      "edit_amount",
      "edit_date",
      "edit_details",
      "new_category",
      "new_account",
      "submit",

      // Phase 4 features
      "edit_from",
      "edit_to",
      "edit_exchange",
      "edit_source",

      // Phase 5 features
      "edit_contact",
      "edit_purpose",
      "debt_payment",

      // Phase 6 features
      "analytics",
      "export",
      "recurring",
      "notifications",
    ];

    if (
      placeholderFeatures.some((feature) => callback_data.includes(feature))
    ) {
      const placeholderMessage = handlePlaceholderButton(callback_data);

      // Send temporary notification message with phase information
      const notificationMsg = await bot.sendMessage(
        chatId,
        placeholderMessage,
        {
          parse_mode: "Markdown",
        }
      );

      // Auto-delete notification after 8 seconds (longer for detailed messages)
      setTimeout(() => {
        bot.deleteMessage(chatId, notificationMsg.message_id).catch(() => {});
      }, 8000);

      // Answer callback query to remove loading state
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle copy ID functionality
    if (callback_data.startsWith("copy_id_")) {
      const transactionIdMatch = callback_data.match(/copy_id_(\d+)$/);
      const transactionId = transactionIdMatch ? transactionIdMatch[1] : null;

      if (transactionId) {
        // Send a message with the copyable transaction ID
        const copyMessage = await bot.sendMessage(
          chatId,
          `📋 **Transaction ID:** \`#${transactionId}\`\n\n✨ *Tap to select and copy the ID above*`,
          { parse_mode: "Markdown" }
        );

        // Auto-delete the copy message after 10 seconds
        setTimeout(() => {
          bot.deleteMessage(chatId, copyMessage.message_id).catch(() => {});
        }, 10000);

        bot.answerCallbackQuery(query.id, {
          text: `Transaction ID #${transactionId} sent below - tap to copy!`,
        });
        return;
      }
    }

    // Extract transaction ID from callback data
    const transactionIdMatch = callback_data.match(/_(\d+)$/);
    const transactionId = transactionIdMatch
      ? parseInt(transactionIdMatch[1])
      : null;

    // Handle keyboard navigation
    if (callback_data.startsWith("edit_type_") && transactionId) {
      const keyboard = createTransactionTypeKeyboard(transactionId);
      const messageText = `🔄 Change Transaction Type for #${transactionId}`;

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });

      bot.answerCallbackQuery(query.id);
      return;
    }

    if (callback_data.startsWith("edit_category_") && transactionId) {
      const keyboard = await createCategoryKeyboard(transactionId);
      const messageText = `📂 Select Category for Transaction #${transactionId}`;

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });

      bot.answerCallbackQuery(query.id);
      return;
    }

    if (callback_data.startsWith("edit_account_") && transactionId) {
      const keyboard = await createAccountKeyboard(transactionId);
      const messageText = `💳 Select Account for Transaction #${transactionId}`;

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });

      bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle category selections
    if (callback_data.startsWith("cat_") && transactionId) {
      const categoryParts = callback_data.split("_");
      const categoryId = categoryParts.slice(1, -1).join("_"); // Remove "cat_" and transaction ID
      const categoryName = await getCategoryName(categoryId);

      // TODO: Update transaction data with new category
      // For now, show success message and return to main keyboard
      bot.answerCallbackQuery(query.id, {
        text: `Category changed to ${categoryName}`,
      });

      // Return to main transaction keyboard with updated category
      const transactionData = { category: categoryName };
      const keyboard = createExpenseKeyboard(transactionId, transactionData);
      const messageText = formatTransactionMessage(
        "expense",
        transactionId,
        transactionData
      );

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });
      return;
    }

    // Handle account selections
    if (callback_data.startsWith("acc_") && transactionId) {
      // Extract account key by removing "acc_" prefix and transaction ID suffix
      const parts = callback_data.split("_");
      // Remove first part ("acc") and last part (transaction ID)
      const accountParts = parts.slice(1, -1);
      const accountId = accountParts.join("_"); // Use underscore for IDs
      const accountName = await getAccountName(accountId);

      // TODO: Update transaction data with new account
      // For now, show success message and return to main keyboard
      bot.answerCallbackQuery(query.id, {
        text: `Account changed to ${accountName}`,
      });

      // Return to main transaction keyboard with updated account
      const transactionData = { account: accountName };
      const keyboard = createExpenseKeyboard(transactionId, transactionData);
      const messageText = formatTransactionMessage(
        "expense",
        transactionId,
        transactionData
      );

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });
      return;
    }

    // Handle transaction type selections
    if (callback_data.startsWith("type_") && transactionId) {
      const typeMatch = callback_data.match(/^type_([^_]+)_/);
      const selectedType = typeMatch ? typeMatch[1] : "expense";

      // Get the appropriate keyboard and message for the selected type
      let keyboard;
      let typeEmoji;
      let typeName;

      switch (selectedType) {
        case "income":
          keyboard = createIncomeKeyboard(transactionId, {});
          typeEmoji = "💰";
          typeName = "Income";
          break;
        case "transfer":
          keyboard = createTransferKeyboard(transactionId, {});
          typeEmoji = "🔄";
          typeName = "Transfer";
          break;
        case "lend":
          // For now, use expense keyboard (will be enhanced in Phase 5)
          keyboard = createExpenseKeyboard(transactionId, {});
          typeEmoji = "🤝";
          typeName = "Lend Money";
          break;
        case "borrow":
          // For now, use expense keyboard (will be enhanced in Phase 5)
          keyboard = createExpenseKeyboard(transactionId, {});
          typeEmoji = "🙏";
          typeName = "Borrow Money";
          break;
        case "debt_payment":
          // For now, use expense keyboard (will be enhanced in Phase 5)
          keyboard = createExpenseKeyboard(transactionId, {});
          typeEmoji = "💳";
          typeName = "Debt Payment";
          break;
        case "debt_received":
          // For now, use expense keyboard (will be enhanced in Phase 5)
          keyboard = createExpenseKeyboard(transactionId, {});
          typeEmoji = "💵";
          typeName = "Debt Received";
          break;
        default: // expense
          keyboard = createExpenseKeyboard(transactionId, {});
          typeEmoji = "💸";
          typeName = "Expense";
      }

      // Update the message with the new transaction type
      const transactionData = {};
      const messageText = formatTransactionMessage(
        selectedType,
        transactionId,
        transactionData
      );

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });

      bot.answerCallbackQuery(query.id, {
        text: `Transaction type changed to ${typeName}`,
      });
      return;
    }

    // Handle cancel button - show confirmation
    if (callback_data.startsWith("cancel_") && transactionId) {
      const keyboard = createCancelConfirmationKeyboard(transactionId);
      const messageText = `⚠️ Cancel Transaction #${transactionId}?
      
This will permanently delete this transaction. This action cannot be undone.

---
MENU: Cancellation Confirmation 👇`;

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });

      bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle cancel confirmation
    if (callback_data.startsWith("confirm_cancel_") && transactionId) {
      // TODO: In Phase 3, remove from TempBills sheet
      // For now, just delete the message

      bot.deleteMessage(chatId, message.message_id).catch(() => {
        // If deletion fails, edit the message instead
        bot.editMessageText(
          `❌ Transaction #${transactionId} has been cancelled and deleted.`,
          {
            chat_id: chatId,
            message_id: message.message_id,
          }
        );
      });

      bot.answerCallbackQuery(query.id, {
        text: `Transaction #${transactionId} cancelled`,
      });
      return;
    }

    // Handle back to transaction navigation
    if (callback_data.startsWith("back_transaction_") && transactionId) {
      // Return to main transaction keyboard
      const transactionData = {};
      const keyboard = createExpenseKeyboard(transactionId, transactionData);
      const messageText = formatTransactionMessage(
        "expense",
        transactionId,
        transactionData
      );

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });

      bot.answerCallbackQuery(query.id);
      return;
    }

    // Legacy callback handling for old keyboard
    //
    // Recalculate the bill
    //
    if (query.data === "re-calculate" && query.message) {
      if (query.message.photo) {
        editTextMessage(
          {
            newText: "Reprocessing your photo...",
            message: query.message,
          },
          bot
        );

        const imageId =
          query.message?.photo[3]?.file_id || query.message?.photo[2]?.file_id;

        const billDetail = await getReceiptDetail(imageId, "", bot);

        editTextMessage(
          {
            newText: JSON.stringify(billDetail, null, "\t"),
            message: query.message,
            options: {
              reply_markup: BILL_REPLY_MARKUP,
            },
          },
          bot
        );
      } else {
        editTextMessage(
          {
            newText: "Reprocessing your bill...",
            message: query.message,
          },
          bot
        );

        const billDetail = await textChain.generateBillInfo(query.message.text);

        editTextMessage(
          {
            newText: JSON.stringify(billDetail, null, "\t"),
            message: query.message,
            options: {
              reply_markup: BILL_REPLY_MARKUP,
            },
          },
          bot
        );
      }
    }

    //
    // Add to database
    //
    if (query.data === "add-to-database" && query.message) {
      const stringData = query.message.caption || query.message.text;
      // remove inline keyboard
      editTextMessage(
        {
          newText: stringData,
          message: query.message,
        },
        bot
      );

      let billRecord = null;
      try {
        billRecord = JSON.parse(stringData || "{}");
      } catch (error) {
        console.error("Error parsing bill record:", error);
      }

      if (!billRecord) return;

      const { title, total_price, currency_code, date, description } =
        billRecord;

      try {
        await googleSheetsAdapter.addItem(
          title,
          total_price,
          currency_code,
          date,
          description
        );

        const caption = stringData + "\n\n✅ Added to Google Sheets database";
        editTextMessage(
          {
            newText: caption,
            message: query.message,
          },
          bot
        );
      } catch (error: any) {
        console.error("Error adding to Google Sheets:", error);
        bot.sendMessage(
          query.message.chat.id,
          "❌ Error adding to database:\n" +
            error.message +
            "\n\nMake sure your Google Sheets is properly configured."
        );

        editTextMessage(
          {
            newText: stringData,
            message: query.message,
            options: { reply_markup: BILL_REPLY_MARKUP },
          },
          bot
        );
      }
    }
  });
}

/**
 * Helper function to get display name for category from Google Sheets
 */
async function getCategoryName(categoryId: string): Promise<string> {
  try {
    const categories = await googleSheetsAdapter.getCategories();
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "Other";
  } catch (error) {
    console.error("Error getting category name:", error);
    // Fallback to hardcoded mapping
    const categoryMap: Record<string, string> = {
      food: "Food",
      transport: "Transport",
      housing: "Housing",
      utilities: "Utilities",
      shopping: "Shopping",
      entertainment: "Entertainment",
      healthcare: "Healthcare",
      education: "Education",
    };
    return categoryMap[categoryId] || "Other";
  }
}

/**
 * Helper function to get display name for account from Google Sheets
 */
async function getAccountName(accountId: string): Promise<string> {
  try {
    const accounts = await googleSheetsAdapter.getAccounts();
    const account = accounts.find((acc: any) => acc.id === accountId);
    return account ? account.name : "Main Card";
  } catch (error) {
    console.error("Error getting account name:", error);
    // Fallback to hardcoded mapping
    const accountMap: Record<string, string> = {
      main_card: "Main Card",
      "main card": "Main Card",
      checking: "Checking",
      cash: "Cash",
      credit: "Credit Card",
      savings: "Savings",
      digital: "Digital Wallet",
    };
    return accountMap[accountId] || "Main Card";
  }
}

export { registerCallbackHandler };
