/**
 * Application Constants
 * Centralized source of truth for all application constants
 */

/**
 * Transaction Types Constants (Internal Values)
 * These match the Zod schema in bill.types.ts
 */
export const TRANSACTION_TYPE_VALUES = {
  EXPENSE: "expense",
  INCOME: "income",
  TRANSFER: "transfer",
  LEND: "lend",
  BORROW: "borrow",
  DEBT_PAYMENT: "debt_payment",
  DEBT_RECEIVED: "debt_received",
} as const;

/**
 * Transaction Types Constants (Display Names)
 * Used for Google Sheets formulas and UI display
 */
export const TRANSACTION_TYPES = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
  LEND: "Lend Money",
  BORROW: "Borrow Money",
  DEBT_PAYMENT: "Debt Payment",
  DEBT_RECEIVED: "Debt Received",
} as const;

/**
 * Transaction Type Display Names
 * Used for UI display and Google Sheets formulas
 */
export const TRANSACTION_TYPE_DISPLAY_NAMES = {
  [TRANSACTION_TYPE_VALUES.EXPENSE]: "Expense",
  [TRANSACTION_TYPE_VALUES.INCOME]: "Income",
  [TRANSACTION_TYPE_VALUES.TRANSFER]: "Transfer",
  [TRANSACTION_TYPE_VALUES.LEND]: "Lend Money",
  [TRANSACTION_TYPE_VALUES.BORROW]: "Borrow Money",
  [TRANSACTION_TYPE_VALUES.DEBT_PAYMENT]: "Debt Payment",
  [TRANSACTION_TYPE_VALUES.DEBT_RECEIVED]: "Debt Received",
} as const;

/**
 * Transaction Type Emojis
 * Used for UI display
 */
export const TRANSACTION_TYPE_EMOJIS = {
  [TRANSACTION_TYPE_VALUES.EXPENSE]: "💸",
  [TRANSACTION_TYPE_VALUES.INCOME]: "💰",
  [TRANSACTION_TYPE_VALUES.TRANSFER]: "🔄",
  [TRANSACTION_TYPE_VALUES.LEND]: "🤝",
  [TRANSACTION_TYPE_VALUES.BORROW]: "🙏",
  [TRANSACTION_TYPE_VALUES.DEBT_PAYMENT]: "💳",
  [TRANSACTION_TYPE_VALUES.DEBT_RECEIVED]: "💵",
} as const;

/**
 * Type helpers
 */
export type TransactionTypeValue =
  (typeof TRANSACTION_TYPE_VALUES)[keyof typeof TRANSACTION_TYPE_VALUES];
export type TransactionType =
  (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];
export type TransactionTypeDisplayName =
  (typeof TRANSACTION_TYPE_DISPLAY_NAMES)[TransactionTypeValue];
export type TransactionTypeEmoji =
  (typeof TRANSACTION_TYPE_EMOJIS)[TransactionTypeValue];

/**
 * Utility functions for transaction types
 */
export const TransactionTypeUtils = {
  /**
   * Get display name for transaction type value
   */
  getDisplayName(type: TransactionTypeValue): TransactionTypeDisplayName {
    return (
      TRANSACTION_TYPE_DISPLAY_NAMES[type] ||
      TRANSACTION_TYPE_DISPLAY_NAMES[TRANSACTION_TYPE_VALUES.EXPENSE]
    );
  },

  /**
   * Get emoji for transaction type value
   */
  getEmoji(type: TransactionTypeValue): TransactionTypeEmoji {
    return (
      TRANSACTION_TYPE_EMOJIS[type] ||
      TRANSACTION_TYPE_EMOJIS[TRANSACTION_TYPE_VALUES.EXPENSE]
    );
  },

  /**
   * Get all transaction type values
   */
  getAllValues(): TransactionTypeValue[] {
    return Object.values(TRANSACTION_TYPE_VALUES);
  },

  /**
   * Get all display names
   */
  getAllDisplayNames(): TransactionTypeDisplayName[] {
    return Object.values(TRANSACTION_TYPE_DISPLAY_NAMES);
  },

  /**
   * Check if transaction type value is valid
   */
  isValid(type: string): type is TransactionTypeValue {
    return Object.values(TRANSACTION_TYPE_VALUES).includes(
      type as TransactionTypeValue
    );
  },

  /**
   * Convert display name to value
   */
  displayNameToValue(displayName: string): TransactionTypeValue | null {
    const entry = Object.entries(TRANSACTION_TYPE_DISPLAY_NAMES).find(
      ([_, name]) => name === displayName
    );
    return entry ? (entry[0] as TransactionTypeValue) : null;
  },
};
