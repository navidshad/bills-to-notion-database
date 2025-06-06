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
  createSubmittedBillKeyboard,
  formatSubmittedBillMessage,
} from "../keyboards/bill-keyboards";
import {
  CallbackActions,
  CallbackDataParser,
  PLACEHOLDER_FEATURES,
  isPlaceholderFeature,
} from "../types/callback.types";
import BillManager, { BillState } from "../managers/bill-manager";

/**
 * Format transaction message with details for display
 */
function formatTransactionMessage(
  type: string,
  transactionId: number,
  transactionData: any,
  warning?: string
): string {
  const typeEmoji = getTransactionTypeEmoji(type);
  const typeName = getTransactionTypeName(type);
  const amount =
    transactionData?.total_price || transactionData?.amount || "25.50";
  const date = formatDate(transactionData?.date);
  const category = transactionData?.category || "Other";
  const account = transactionData?.account || "Main Card";
  const currencySymbol = getCurrencySymbol(
    transactionData?.currency_code || "USD"
  );

  // Only show warning if provided (no warning means currency is supported)
  const warningText = warning ? `\n\n⚠️ ${warning}` : "";

  return `💰 Amount: ${currencySymbol}${amount}
📅 Date: ${date}
📂 Category: ${category}
💳 Account: ${account}${warningText}

---
MENU: ${typeEmoji} ${typeName} Transaction #${transactionId} 👇`;
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
 * Register callback query handler
 * @param {Object} bot - Telegram bot instance
 */
function registerCallbackHandler(bot: any) {
  bot.on("callback_query", async (query: any) => {
    const { data: callback_data, message } = query;
    const chatId = message.chat.id;

    // Handle placeholder buttons (non-implemented features)
    if (isPlaceholderFeature(callback_data)) {
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
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.COPY_ID
      )
    ) {
      const transactionId =
        CallbackDataParser.extractTransactionId(callback_data);

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
    const transactionId =
      CallbackDataParser.extractTransactionId(callback_data);

    // Handle keyboard navigation
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.EDIT_TYPE
      ) &&
      transactionId
    ) {
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

    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.EDIT_CATEGORY
      ) &&
      transactionId
    ) {
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

    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.EDIT_ACCOUNT
      ) &&
      transactionId
    ) {
      // Extract currency from callback data if present
      const currency = CallbackDataParser.extractCurrency(callback_data);

      const keyboard = await createAccountKeyboard(
        transactionId,
        currency || undefined
      );
      const messageText = currency
        ? `💳 Select ${currency} Account for Transaction #${transactionId}`
        : `💳 Select Account for Transaction #${transactionId}`;

      bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: keyboard,
      });

      bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle category selections
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.CATEGORY_SELECT
      ) &&
      transactionId
    ) {
      const categoryId = CallbackDataParser.extractCategoryId(callback_data);
      if (!categoryId) return;

      const categoryName = await getCategoryName(categoryId);

      // Retrieve existing transaction data from TempBills and update category
      let transactionData = {};
      try {
        const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
        if (tempBill && tempBill.transactionData) {
          // Preserve all existing data and only update category
          transactionData = {
            ...tempBill.transactionData,
            category: categoryName,
          };

          // Update TempBills with the new category information
          await googleSheetsAdapter.updateTempBill(transactionId, {
            transactionData: transactionData,
          });
        } else {
          // Fallback if TempBill not found (shouldn't happen)
          console.warn(
            `TempBill not found for transaction ${transactionId}, using minimal data`
          );
          transactionData = { category: categoryName };
        }
      } catch (error) {
        console.error("Error retrieving transaction data:", error);
        // Fallback to minimal data
        transactionData = { category: categoryName };
      }

      bot.answerCallbackQuery(query.id, {
        text: `Category changed to ${categoryName}`,
      });

      // Return to main transaction keyboard with updated category
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
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.ACCOUNT_SELECT
      ) &&
      transactionId
    ) {
      const accountId = CallbackDataParser.extractAccountId(callback_data);
      if (!accountId) return;

      // Check if this is a temporary account
      const isTemporary = accountId.startsWith("temp_cash_");
      let accountName: string;

      if (isTemporary) {
        // Extract currency from temp account ID (e.g., temp_cash_eur -> EUR)
        const currency = accountId.replace("temp_cash_", "").toUpperCase();
        accountName = `Cash (${currency})`;

        // Create the account in Google Sheets
        try {
          await googleSheetsAdapter.createAccount(
            accountId,
            accountName,
            "💰",
            currency,
            `Cash account for ${currency} transactions`
          );
          console.log(`Created temporary account: ${accountName}`);
        } catch (error) {
          console.error("Error creating temporary account:", error);
        }
      } else {
        accountName = await getAccountName(accountId);
      }

      // TODO: Update transaction data with new account
      // For now, show success message and return to main keyboard
      bot.answerCallbackQuery(query.id, {
        text: isTemporary
          ? `Account "${accountName}" created and selected`
          : `Account changed to ${accountName}`,
      });

      // Get account details to extract currency
      let accountCurrency = "USD"; // Default fallback
      try {
        const accounts = await googleSheetsAdapter.getAccounts();
        const selectedAccount = accounts.find(
          (acc: any) => acc.id === accountId
        );
        if (selectedAccount) {
          accountCurrency = selectedAccount.currency;
        }
      } catch (error) {
        console.warn("Error getting account currency:", error);
      }

      // Retrieve existing transaction data from TempBills to preserve all fields
      let transactionData = {};
      try {
        const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
        if (tempBill && tempBill.transactionData) {
          // Preserve all existing data and only update account/currency
          transactionData = {
            ...tempBill.transactionData,
            account: accountName,
            currency_code: accountCurrency,
          };

          // Update TempBills with the new account information
          await googleSheetsAdapter.updateTempBill(transactionId, {
            transactionData: transactionData,
          });
        } else {
          // Fallback if TempBill not found (shouldn't happen)
          console.warn(
            `TempBill not found for transaction ${transactionId}, using minimal data`
          );
          transactionData = {
            account: accountName,
            currency_code: accountCurrency,
          };
        }
      } catch (error) {
        console.error("Error retrieving transaction data:", error);
        // Fallback to minimal data
        transactionData = {
          account: accountName,
          currency_code: accountCurrency,
        };
      }

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
    if (
      transactionId &&
      (CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.TYPE_EXPENSE
      ) ||
        CallbackDataParser.startsWithAction(
          callback_data,
          CallbackActions.TYPE_INCOME
        ) ||
        CallbackDataParser.startsWithAction(
          callback_data,
          CallbackActions.TYPE_TRANSFER
        ) ||
        // PHASE 5: Debt transaction types disabled until proper implementation
        /*
        CallbackDataParser.startsWithAction(
          callback_data,
          CallbackActions.TYPE_LEND
        ) ||
        CallbackDataParser.startsWithAction(
          callback_data,
          CallbackActions.TYPE_BORROW
        ) ||
        CallbackDataParser.startsWithAction(
          callback_data,
          CallbackActions.TYPE_DEBT_PAYMENT
        ) ||
        CallbackDataParser.startsWithAction(
          callback_data,
          CallbackActions.TYPE_DEBT_RECEIVED
        ) ||
        */
        false)
    ) {
      const action = CallbackDataParser.extractAction(callback_data);

      // Map callback actions to transaction types
      const typeMap = {
        [CallbackActions.TYPE_EXPENSE]: "expense",
        [CallbackActions.TYPE_INCOME]: "income",
        [CallbackActions.TYPE_TRANSFER]: "transfer",
        // PHASE 5: Debt types disabled until proper implementation
        /*
        [CallbackActions.TYPE_LEND]: "lend",
        [CallbackActions.TYPE_BORROW]: "borrow",
        [CallbackActions.TYPE_DEBT_PAYMENT]: "debt_payment",
        [CallbackActions.TYPE_DEBT_RECEIVED]: "debt_received",
        */
      };

      const selectedType = typeMap[action as keyof typeof typeMap] || "expense";

      // Retrieve existing transaction data from TempBills to preserve all fields
      let transactionData = {};
      try {
        const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
        if (tempBill && tempBill.transactionData) {
          // Preserve all existing data and only update transaction type
          transactionData = {
            ...tempBill.transactionData,
            transaction_type: selectedType,
          };

          // Update TempBills with the new transaction type
          await googleSheetsAdapter.updateTempBill(transactionId, {
            transactionData: transactionData,
          });
        } else {
          // Fallback if TempBill not found (shouldn't happen)
          console.warn(
            `TempBill not found for transaction ${transactionId}, using minimal data`
          );
          transactionData = { transaction_type: selectedType };
        }
      } catch (error) {
        console.error("Error retrieving transaction data:", error);
        // Fallback to minimal data
        transactionData = { transaction_type: selectedType };
      }

      // Get the appropriate keyboard and message for the selected type
      let keyboard;
      let typeEmoji;
      let typeName;

      switch (selectedType) {
        case "income":
          keyboard = createIncomeKeyboard(transactionId, transactionData);
          typeEmoji = "💰";
          typeName = "Income";
          break;
        case "transfer":
          keyboard = createTransferKeyboard(transactionId, transactionData);
          typeEmoji = "🔄";
          typeName = "Transfer";
          break;
        // PHASE 5 FEATURES - Debt Management (Not yet implemented)
        // TODO: Implement proper debt management keyboards in Phase 5
        // These transaction types currently disabled until proper implementation
        /*
        case "lend":
          keyboard = createLendKeyboard(transactionId, transactionData);
          typeEmoji = "🤝";
          typeName = "Lend Money";
          break;
        case "borrow":
          keyboard = createBorrowKeyboard(transactionId, transactionData);
          typeEmoji = "🙏";
          typeName = "Borrow Money";
          break;
        case "debt_payment":
          keyboard = createDebtPaymentKeyboard(transactionId, transactionData);
          typeEmoji = "💳";
          typeName = "Debt Payment";
          break;
        case "debt_received":
          keyboard = createDebtReceivedKeyboard(transactionId, transactionData);
          typeEmoji = "💵";
          typeName = "Debt Received";
          break;
        */
        default: // expense
          keyboard = createExpenseKeyboard(transactionId, transactionData);
          typeEmoji = "💸";
          typeName = "Expense";
      }

      // Update the message with the new transaction type
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

    // Handle submit button - Phase 3 Implementation
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.SUBMIT
      ) &&
      transactionId
    ) {
      console.log(`Processing submit for transaction #${transactionId}`);

      try {
        // Check if this is a resubmission (editing flow) or initial submission
        const billState = await BillManager.getBillState(transactionId);
        let submitResult;

        if (billState === BillState.EDITING) {
          // This is a resubmission - update existing bill in yearly sheet
          submitResult = await BillManager.resubmitEditedBill(transactionId);
        } else {
          // This is initial submission - move from TempBills to yearly sheet
          submitResult = await BillManager.submitBill(transactionId);
        }

        if (submitResult.success) {
          // Get the final bill data for display
          let finalBillData;
          if (billState === BillState.EDITING) {
            // For resubmissions, get the updated data from yearly sheet
            finalBillData = await googleSheetsAdapter.getBillFromYearlySheet(
              transactionId
            );
          } else {
            // For initial submissions, use the returned data
            finalBillData = (submitResult as any).submittedBill;
          }

          if (finalBillData) {
            // Update message to show submitted bill format
            const submittedBillMessage =
              formatSubmittedBillMessage(finalBillData);
            const submittedBillKeyboard =
              createSubmittedBillKeyboard(transactionId);

            bot.editMessageText(submittedBillMessage, {
              chat_id: chatId,
              message_id: message.message_id,
              reply_markup: submittedBillKeyboard,
            });

            const actionText =
              billState === BillState.EDITING ? "updated" : "submitted";
            bot.answerCallbackQuery(query.id, {
              text: `Transaction #${transactionId} ${actionText} successfully!`,
            });

            console.log(
              `Transaction #${transactionId} ${actionText} and message updated`
            );
          } else {
            bot.answerCallbackQuery(query.id, {
              text: "Transaction processed but display error occurred",
              show_alert: true,
            });
          }
        } else {
          // Handle submission error
          bot.answerCallbackQuery(query.id, {
            text: `Error submitting transaction: ${submitResult.error}`,
            show_alert: true,
          });

          console.error(
            `Error submitting transaction #${transactionId}:`,
            submitResult.error
          );
        }
      } catch (error) {
        console.error(
          `Error in submit handler for transaction #${transactionId}:`,
          error
        );
        bot.answerCallbackQuery(query.id, {
          text: "An unexpected error occurred while submitting",
          show_alert: true,
        });
      }

      return;
    }

    // Handle edit transaction button for submitted bills - Phase 3 Implementation
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.EDIT_TRANSACTION
      ) &&
      transactionId
    ) {
      console.log(
        `Starting edit flow for submitted transaction #${transactionId}`
      );

      try {
        const userId = query.from.id.toString();
        const originalMessageId = message.message_id;

        // Start edit flow using BillManager
        const editResult = await BillManager.startEditFlow(
          transactionId,
          userId,
          originalMessageId
        );

        if (editResult.success) {
          // Get the transaction data from TempBills to show edit keyboard
          const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
          if (tempBill && tempBill.transactionData) {
            const transactionData = tempBill.transactionData;
            const transactionType =
              transactionData.transaction_type || "expense";

            // Create the appropriate keyboard based on transaction type
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
              default: // expense and other types
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

            bot.editMessageText(messageText, {
              chat_id: chatId,
              message_id: message.message_id,
              reply_markup: keyboard,
            });

            bot.answerCallbackQuery(query.id, {
              text: `Editing transaction #${transactionId}`,
            });

            console.log(`Transaction #${transactionId} edit flow started`);
          } else {
            bot.answerCallbackQuery(query.id, {
              text: "Error loading transaction data for editing",
              show_alert: true,
            });
          }
        } else {
          bot.answerCallbackQuery(query.id, {
            text: `Error starting edit: ${editResult.error}`,
            show_alert: true,
          });

          console.error(
            `Error starting edit flow for transaction #${transactionId}:`,
            editResult.error
          );
        }
      } catch (error) {
        console.error(
          `Error in edit transaction handler for #${transactionId}:`,
          error
        );
        bot.answerCallbackQuery(query.id, {
          text: "An unexpected error occurred while starting edit",
          show_alert: true,
        });
      }

      return;
    }

    // Handle cancel button - show confirmation
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.CANCEL
      ) &&
      transactionId
    ) {
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

    // Handle cancel confirmation - Phase 3 Enhanced
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.CONFIRM_CANCEL
      ) &&
      transactionId
    ) {
      console.log(
        `Processing cancel confirmation for transaction #${transactionId}`
      );

      try {
        // Check if this bill is being edited (from yearly sheet)
        const billState = await BillManager.getBillState(transactionId);

        if (billState === BillState.EDITING) {
          // Cancel edit flow and restore to submitted state
          const cancelResult = await BillManager.cancelEditFlow(transactionId);

          if (cancelResult.success) {
            // Get the original bill data from yearly sheet to restore message
            const originalBill =
              await googleSheetsAdapter.getBillFromYearlySheet(transactionId);

            if (originalBill) {
              const submittedBillMessage =
                formatSubmittedBillMessage(originalBill);
              const submittedBillKeyboard =
                createSubmittedBillKeyboard(transactionId);

              bot.editMessageText(submittedBillMessage, {
                chat_id: chatId,
                message_id: message.message_id,
                reply_markup: submittedBillKeyboard,
              });

              bot.answerCallbackQuery(query.id, {
                text: `Edit cancelled. Transaction #${transactionId} restored.`,
              });

              console.log(
                `Edit flow cancelled for transaction #${transactionId}, restored to submitted state`
              );
            } else {
              // Fallback if original bill not found
              bot.editMessageText(
                `❌ Edit cancelled for transaction #${transactionId}.`,
                {
                  chat_id: chatId,
                  message_id: message.message_id,
                }
              );
            }
          } else {
            bot.answerCallbackQuery(query.id, {
              text: `Error cancelling edit: ${cancelResult.error}`,
              show_alert: true,
            });
          }
        } else {
          // Regular temp bill cancellation (original behavior)
          await googleSheetsAdapter.deleteTempBill(transactionId);
          console.log(`Transaction #${transactionId} deleted from TempBills`);

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
        }
      } catch (error) {
        console.error(
          `Error in cancel confirmation for transaction #${transactionId}:`,
          error
        );
        bot.answerCallbackQuery(query.id, {
          text: "An error occurred while cancelling",
          show_alert: true,
        });
      }

      return;
    }

    // Handle back to transaction navigation
    if (
      CallbackDataParser.startsWithAction(
        callback_data,
        CallbackActions.BACK_TRANSACTION
      ) &&
      transactionId
    ) {
      // Retrieve existing transaction data from TempBills
      let transactionData = {};
      let transactionType = "expense"; // default
      try {
        const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
        if (tempBill && tempBill.transactionData) {
          transactionData = tempBill.transactionData;
          transactionType =
            (transactionData as any).transaction_type || "expense";
        } else {
          console.warn(`TempBill not found for transaction ${transactionId}`);
        }
      } catch (error) {
        console.error("Error retrieving transaction data:", error);
      }

      // Create the appropriate keyboard based on transaction type
      let keyboard;
      switch (transactionType) {
        case "income":
          keyboard = createIncomeKeyboard(transactionId, transactionData);
          break;
        case "transfer":
          keyboard = createTransferKeyboard(transactionId, transactionData);
          break;
        default: // expense and other types
          keyboard = createExpenseKeyboard(transactionId, transactionData);
      }

      const messageText = formatTransactionMessage(
        transactionType,
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
    if (query.data === CallbackActions.RE_CALCULATE && query.message) {
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

        // Get supported currencies, accounts, and categories for AI hint
        let supportedCurrencies: string[] = ["USD", "EUR"];
        let availableAccounts: any[] = [];
        let availableCategories: any[] = [];

        try {
          supportedCurrencies =
            await googleSheetsAdapter.getSupportedCurrencies();
          availableAccounts = await googleSheetsAdapter.getAccounts();
          availableCategories = await googleSheetsAdapter.getCategories();
        } catch (error) {
          console.warn(
            "Failed to get data from Google Sheets for callback:",
            error
          );
        }

        const billDetail = await textChain.generateBillInfo(
          query.message.text,
          supportedCurrencies,
          availableAccounts,
          availableCategories
        );

        // Validate currency and get warnings
        const currencyValidation = await googleSheetsAdapter.validateCurrency(
          billDetail.currency_code
        );

        // Use validated currency
        billDetail.currency_code = currencyValidation.currency;

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
    if (query.data === CallbackActions.ADD_TO_DATABASE && query.message) {
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
