/**
 * Bill Processing Keyboards
 * Enhanced keyboard layouts for transaction management
 */

import {
  CallbackActions,
  CallbackDataGenerator,
  PLACEHOLDER_FEATURES,
  isPlaceholderFeature,
} from "../types/callback.types";

/**
 * Create expense transaction keyboard
 */
function createExpenseKeyboard(transactionId: number, transactionData: any) {
  const amount =
    transactionData?.total_price || transactionData?.amount || "25.50";
  const date = formatDateForButton(transactionData?.date);
  const category = transactionData?.category || "Other";
  const account = transactionData?.account || "Main Card";

  // Encode currency in callback data if available
  const currency = transactionData?.currency_code || "";
  const accountCallback = CallbackDataGenerator.forAccountEdit(
    transactionId,
    currency
  );

  return {
    inline_keyboard: [
      [
        {
          text: "🏷️ Type: Expense",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_TYPE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `💰 Amount: $${amount}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_AMOUNT,
            transactionId
          ),
        },
        {
          text: `📅 Date: ${date}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_DATE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `📂 Category: ${category}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_CATEGORY,
            transactionId
          ),
        },
      ],
      [
        {
          text: `💳 Account: ${account}`,
          callback_data: accountCallback,
        },
      ],
      [
        {
          text: `📋 Copy ID: #${transactionId}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.COPY_ID,
            transactionId
          ),
        },
        {
          text: "❌ Cancel",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.CANCEL,
            transactionId
          ),
        },
        {
          text: "✅ Submit",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.SUBMIT,
            transactionId
          ),
        },
      ],
    ],
  };
}

/**
 * Create income transaction keyboard
 */
function createIncomeKeyboard(transactionId: number, transactionData: any) {
  const amount =
    transactionData?.total_price || transactionData?.amount || "500.00";
  const date = formatDateForButton(transactionData?.date);
  const source = transactionData?.source || "Salary";
  const account = transactionData?.account || "Main Card";

  // Encode currency in callback data if available
  const currency = transactionData?.currency_code || "";
  const accountCallback = CallbackDataGenerator.forAccountEdit(
    transactionId,
    currency
  );

  return {
    inline_keyboard: [
      [
        {
          text: "🏷️ Type: Income",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_TYPE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `💰 Amount: $${amount}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_AMOUNT,
            transactionId
          ),
        },
        {
          text: `📅 Date: ${date}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_DATE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `📤 Source: ${source}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_SOURCE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `💳 Account: ${account}`,
          callback_data: accountCallback,
        },
      ],
      [
        {
          text: `📋 Copy ID: #${transactionId}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.COPY_ID,
            transactionId
          ),
        },
        {
          text: "❌ Cancel",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.CANCEL,
            transactionId
          ),
        },
        {
          text: "✅ Submit",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.SUBMIT,
            transactionId
          ),
        },
      ],
    ],
  };
}

/**
 * Create transfer transaction keyboard
 */
function createTransferKeyboard(transactionId: number, transactionData: any) {
  const amount =
    transactionData?.total_price || transactionData?.amount || "100.00";
  const date = formatDateForButton(transactionData?.date);
  const fromAccount =
    transactionData?.account || transactionData?.from_account || "Main Card";
  const toAccount =
    transactionData?.destination_account ||
    transactionData?.to_account ||
    "Cash";
  const exchangeRate = transactionData?.exchange_rate || "1.0";

  return {
    inline_keyboard: [
      [
        {
          text: "🏷️ Type: Transfer",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_TYPE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `💰 Amount: $${amount}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_AMOUNT,
            transactionId
          ),
        },
        {
          text: `📅 Date: ${date}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_DATE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `📤 From: ${fromAccount}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_FROM,
            transactionId
          ),
        },
        {
          text: `📥 To: ${toAccount}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_TO,
            transactionId
          ),
        },
      ],
      [
        {
          text: `💱 Rate: ${exchangeRate}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_EXCHANGE,
            transactionId
          ),
        },
      ],
      [
        {
          text: `📋 Copy ID: #${transactionId}`,
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.COPY_ID,
            transactionId
          ),
        },
        {
          text: "❌ Cancel",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.CANCEL,
            transactionId
          ),
        },
        {
          text: "✅ Submit",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.SUBMIT,
            transactionId
          ),
        },
      ],
    ],
  };
}

/**
 * Create cancellation confirmation keyboard
 */
function createCancelConfirmationKeyboard(transactionId: number) {
  return {
    inline_keyboard: [
      [
        {
          text: "✅ Yes, Cancel Transaction",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.CONFIRM_CANCEL,
            transactionId
          ),
        },
      ],
      [
        {
          text: "← No, Go Back",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.BACK_TRANSACTION,
            transactionId
          ),
        },
      ],
    ],
  };
}

/**
 * Create transaction type selection keyboard
 */
function createTransactionTypeKeyboard(transactionId: number) {
  return {
    inline_keyboard: [
      [
        {
          text: "💸 Expense",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.TYPE_EXPENSE,
            transactionId
          ),
        },
        {
          text: "💰 Income",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.TYPE_INCOME,
            transactionId
          ),
        },
      ],
      [
        {
          text: "🔄 Transfer",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.TYPE_TRANSFER,
            transactionId
          ),
        },
        {
          text: "🤝 Lend Money",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.TYPE_LEND,
            transactionId
          ),
        },
      ],
      [
        {
          text: "🙏 Borrow",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.TYPE_BORROW,
            transactionId
          ),
        },
        {
          text: "💳 Debt Payment",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.TYPE_DEBT_PAYMENT,
            transactionId
          ),
        },
      ],
      [
        {
          text: "💵 Debt Received",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.TYPE_DEBT_RECEIVED,
            transactionId
          ),
        },
      ],
      [
        {
          text: "← Back to Transaction",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.BACK_TRANSACTION,
            transactionId
          ),
        },
      ],
    ],
  };
}

/**
 * Create category selection keyboard
 */
async function createCategoryKeyboard(transactionId: number) {
  const googleSheetsAdapter = (await import("../adapters/google-sheets"))
    .default;
  const categories = await googleSheetsAdapter.getCategories();

  // Create rows of 2 categories each
  const categoryRows = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];

    // First category in the row
    if (categories[i]) {
      row.push({
        text: `${categories[i].emoji} ${categories[i].name}`,
        callback_data: CallbackDataGenerator.forCategorySelect(
          categories[i].id,
          transactionId
        ),
      });
    }

    // Second category in the row (if exists)
    if (categories[i + 1]) {
      row.push({
        text: `${categories[i + 1].emoji} ${categories[i + 1].name}`,
        callback_data: CallbackDataGenerator.forCategorySelect(
          categories[i + 1].id,
          transactionId
        ),
      });
    }

    categoryRows.push(row);
  }

  // Add create new category and back buttons
  categoryRows.push([
    {
      text: "➕ Create New Category",
      callback_data: CallbackDataGenerator.forTransaction(
        CallbackActions.NEW_CATEGORY,
        transactionId
      ),
    },
  ]);

  categoryRows.push([
    {
      text: "← Back to Transaction",
      callback_data: CallbackDataGenerator.forTransaction(
        CallbackActions.BACK_TRANSACTION,
        transactionId
      ),
    },
  ]);

  return {
    inline_keyboard: categoryRows,
  };
}

/**
 * Create account selection keyboard
 */
async function createAccountKeyboard(
  transactionId: number,
  targetCurrency?: string
) {
  const googleSheetsAdapter = (await import("../adapters/google-sheets"))
    .default;
  let accounts = await googleSheetsAdapter.getAccounts();

  // If a target currency is specified, filter accounts by that currency
  if (targetCurrency) {
    const currencyUppercase = targetCurrency.toUpperCase();
    const matchingAccounts = accounts.filter(
      (account: any) => account.currency === currencyUppercase
    );

    // If no accounts exist for this currency, create a temporary cash account
    if (matchingAccounts.length === 0) {
      const tempCashAccount = {
        id: `temp_cash_${currencyUppercase.toLowerCase()}`,
        name: `Cash (${currencyUppercase})`,
        emoji: "💰",
        currency: currencyUppercase,
        description: `Temporary cash account for ${currencyUppercase}`,
        isTemporary: true,
      };
      matchingAccounts.push(tempCashAccount);
    }

    accounts = matchingAccounts;
  }

  // Create rows of 2 accounts each
  const accountRows = [];
  for (let i = 0; i < accounts.length; i += 2) {
    const row = [];

    // First account in the row
    if (accounts[i]) {
      const accountLabel = accounts[i].isTemporary
        ? `${accounts[i].emoji} ${accounts[i].name} (new, will add after submit)`
        : `${accounts[i].emoji} ${accounts[i].name}`;

      row.push({
        text: accountLabel,
        callback_data: CallbackDataGenerator.forAccountSelect(
          accounts[i].id,
          transactionId
        ),
      });
    }

    // Second account in the row (if exists)
    if (accounts[i + 1]) {
      const accountLabel = accounts[i + 1].isTemporary
        ? `${accounts[i + 1].emoji} ${
            accounts[i + 1].name
          } (new, will add after submit)`
        : `${accounts[i + 1].emoji} ${accounts[i + 1].name}`;

      row.push({
        text: accountLabel,
        callback_data: CallbackDataGenerator.forAccountSelect(
          accounts[i + 1].id,
          transactionId
        ),
      });
    }

    accountRows.push(row);
  }

  // Add create new account and back buttons
  accountRows.push([
    {
      text: "➕ Create New Account",
      callback_data: CallbackDataGenerator.forTransaction(
        CallbackActions.NEW_ACCOUNT,
        transactionId
      ),
    },
  ]);

  accountRows.push([
    {
      text: "← Back to Transaction",
      callback_data: CallbackDataGenerator.forTransaction(
        CallbackActions.BACK_TRANSACTION,
        transactionId
      ),
    },
  ]);

  return {
    inline_keyboard: accountRows,
  };
}

/**
 * Create confirmation keyboard
 */
function createConfirmationKeyboard(transactionId: number) {
  return {
    inline_keyboard: [
      [
        {
          text: "✅ Confirm",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.CONFIRM,
            transactionId
          ),
        },
        {
          text: "❌ Cancel",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.CANCEL,
            transactionId
          ),
        },
      ],
      [
        {
          text: "✏️ Edit Details",
          callback_data: CallbackDataGenerator.forTransaction(
            CallbackActions.EDIT_DETAILS,
            transactionId
          ),
        },
      ],
    ],
  };
}

/**
 * Placeholder message responses for non-implemented features
 */
const PLACEHOLDER_MESSAGES = {
  // Phase 3 features - Input Collection & Field Edit
  edit_amount:
    "💰 **Phase 3 Feature**\n\nDirect amount editing coming in Phase 3!\n\nCurrent Phase 2 Status:\n• You can edit transaction fields via selection keyboards\n• Advanced input collection will be implemented next",

  edit_date:
    "📅 **Phase 3 Feature**\n\nDirect date editing coming in Phase 3!\n\nCurrent Phase 2 Status:\n• Date selection via keyboard coming soon\n• For now, date is auto-detected from receipt/text",

  edit_details:
    "✨ **Phase 3 Feature**\n\nAdvanced editing features coming in Phase 3!\n\nCurrent Phase 2 Status:\n• Edit individual fields using selection buttons\n• Advanced input collection and TempBills system coming next",

  new_category:
    "🆕 **Phase 3 Feature**\n\nCustom category creation coming in Phase 3!\n\nCurrent Phase 2 Status:\n• Select from existing categories for now\n• Dynamic category management will be implemented next",

  new_account:
    "🆕 **Phase 3 Feature**\n\nCustom account creation coming in Phase 3!\n\nCurrent Phase 2 Status:\n• Select from existing accounts for now\n• Dynamic account management will be implemented next",

  submit:
    "✅ **Phase 3 Feature**\n\nTransaction submission coming in Phase 3!\n\nCurrent Phase 2 Status:\n• TempBills system and submission logic will be implemented next\n• For now, transactions are auto-saved for testing",

  // Phase 4 features - Transfer & Exchange
  edit_from:
    "📤 **Phase 4 Feature**\n\nTransfer source editing coming in Phase 4!\n\nUpcoming:\n• Full transfer functionality between accounts\n• Multi-currency support\n• Exchange rate management",

  edit_to:
    "📥 **Phase 4 Feature**\n\nTransfer destination editing coming in Phase 4!\n\nUpcoming:\n• Full transfer functionality between accounts\n• Multi-currency support\n• Balance tracking",

  edit_exchange:
    "💱 **Phase 4 Feature**\n\nExchange rate editing coming in Phase 4!\n\nUpcoming:\n• Real-time exchange rates\n• Multi-currency calculations\n• Currency conversion tracking",

  edit_source:
    "💰 **Phase 4 Feature**\n\nIncome source editing coming in Phase 4!\n\nUpcoming:\n• Income source management\n• Recurring income detection\n• Advanced income categorization",

  // Phase 5 features - Debt Management
  edit_contact:
    "👤 **Phase 5 Feature**\n\nContact management coming in Phase 5!\n\nUpcoming:\n• Personal debt tracking\n• Contact management system\n• Lending relationship history",

  edit_purpose:
    "📝 **Phase 5 Feature**\n\nDebt purpose editing coming in Phase 5!\n\nUpcoming:\n• Detailed debt descriptions\n• Lending reason tracking\n• Payment history management",

  debt_payment:
    "💳 **Phase 5 Feature**\n\nDebt payment tracking coming in Phase 5!\n\nUpcoming:\n• Track payments to/from friends & family\n• Payment history and balance management\n• Interest calculations",

  // Phase 6 features - Advanced & Polish
  analytics:
    "📊 **Phase 6 Feature**\n\nFinancial analytics dashboard coming in Phase 6!\n\nUpcoming:\n• Spending trends and insights\n• Category breakdown analysis\n• Monthly/yearly summaries",

  export:
    "📤 **Phase 6 Feature**\n\nData export features coming in Phase 6!\n\nUpcoming:\n• CSV, PDF, and Excel export\n• Custom report generation\n• Backup and restore functionality",

  recurring:
    "🔄 **Phase 6 Feature**\n\nRecurring transaction detection coming in Phase 6!\n\nUpcoming:\n• Automatic recurring bill detection\n• Smart categorization suggestions\n• Predictive transaction features",

  notifications:
    "🔔 **Phase 6 Feature**\n\nSmart notifications coming in Phase 6!\n\nUpcoming:\n• Spending alerts and budgets\n• Debt payment reminders\n• Financial goal tracking",

  // General fallback
  coming_soon:
    "🚧 **Feature Coming Soon**\n\nThis feature is planned for a future phase.\n\nCurrent Status:\n• Phase 2 (Enhanced Keyboards) - ✅ Complete\n• Phase 3 (Input Collection) - 🚧 Next\n• Phase 4 (Transfers) - ⏳ Planned\n• Phase 5 (Debt Management) - ⏳ Planned\n• Phase 6 (Advanced Features) - ⏳ Planned",
};

/**
 * Handle placeholder button responses
 */
function handlePlaceholderButton(callback_data: string): string {
  // Use the centralized placeholder checking
  if (isPlaceholderFeature(callback_data)) {
    const feature = Object.keys(PLACEHOLDER_MESSAGES).find((key) =>
      callback_data.includes(key)
    );
    return (
      PLACEHOLDER_MESSAGES[feature as keyof typeof PLACEHOLDER_MESSAGES] ||
      "🚧 This feature is not yet implemented.\n\nStay tuned for updates!"
    );
  }

  return "🚧 This feature is not yet implemented.\n\nStay tuned for updates!";
}

/**
 * Format date for button display
 */
function formatDateForButton(date: any): string {
  if (!date)
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  if (typeof date === "string")
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export {
  createExpenseKeyboard,
  createIncomeKeyboard,
  createTransferKeyboard,
  createCancelConfirmationKeyboard,
  createTransactionTypeKeyboard,
  createCategoryKeyboard,
  createAccountKeyboard,
  createConfirmationKeyboard,
  handlePlaceholderButton,
  formatDateForButton,
  PLACEHOLDER_MESSAGES,
};
