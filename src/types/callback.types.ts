/**
 * Callback Data Constants and Utilities
 * Centralized management of all keyboard callback data
 */

/**
 * Base callback action types
 */
export enum CallbackActions {
  // Transaction editing actions
  EDIT_TYPE = "edit-type",
  EDIT_CATEGORY = "edit-category",
  EDIT_ACCOUNT = "edit-account",
  EDIT_SOURCE = "edit-source",
  EDIT_FROM = "edit-from",
  EDIT_TO = "edit-to",
  EDIT_CONTACT = "edit-contact",
  EDIT_PURPOSE = "edit-purpose",
  EDIT_DETAILS = "edit-details",
  EDIT_MORE = "edit-more", // Template-based multi-field editing

  // Transaction type selections
  TYPE_EXPENSE = "type-expense",
  TYPE_INCOME = "type-income",
  TYPE_TRANSFER = "type-transfer",
  TYPE_LEND = "type-lend",
  TYPE_BORROW = "type-borrow",
  TYPE_DEBT_PAYMENT = "type-debt-payment",
  TYPE_DEBT_RECEIVED = "type-debt-received",

  // Category and account selections
  CATEGORY_SELECT = "select-category",
  ACCOUNT_SELECT = "select-account",
  NEW_CATEGORY = "new-category",
  NEW_ACCOUNT = "new-account",

  // Transaction actions
  CANCEL = "cancel",
  SUBMIT = "submit",
  CONFIRM = "confirm",
  CONFIRM_CANCEL = "confirm-cancel",
  EDIT_TRANSACTION = "edit-transaction", // Phase 3: Edit submitted bills

  // Navigation
  BACK_TRANSACTION = "back-transaction",

  // Legacy actions (for backward compatibility)
  RE_CALCULATE = "re-calculate",
  ADD_TO_DATABASE = "add-to-database",

  // Phase 4+ features (placeholders)
  ANALYTICS = "analytics",
  EXPORT = "export",
  RECURRING = "recurring",
  NOTIFICATIONS = "notifications",
}

/**
 * Utility class for generating callback data strings
 */
export class CallbackDataGenerator {
  /**
   * Generate callback data for transaction-specific actions
   */
  static forTransaction(
    action: CallbackActions,
    transactionId: number
  ): string {
    return `${action}_${transactionId}`;
  }

  /**
   * Generate callback data for category selection
   */
  static forCategorySelect(categoryId: string, transactionId: number): string {
    return `${CallbackActions.CATEGORY_SELECT}_${categoryId}_${transactionId}`;
  }

  /**
   * Generate callback data for account selection
   */
  static forAccountSelect(accountId: string, transactionId: number): string {
    return `${CallbackActions.ACCOUNT_SELECT}_${accountId}_${transactionId}`;
  }

  /**
   * Generate callback data for account editing with currency
   */
  static forAccountEdit(transactionId: number, currency?: string): string {
    return currency
      ? `${CallbackActions.EDIT_ACCOUNT}_${transactionId}_${currency}`
      : `${CallbackActions.EDIT_ACCOUNT}_${transactionId}`;
  }

  /**
   * Generate callback data for simple actions (no transaction ID)
   */
  static forAction(action: CallbackActions): string {
    return action;
  }
}

/**
 * Utility class for parsing callback data
 */
export class CallbackDataParser {
  /**
   * Extract transaction ID from callback data
   */
  static extractTransactionId(callbackData: string): number | null {
    // Match digits that are either at the end or followed by underscore + non-digits
    const match = callbackData.match(/_(\d+)(?:_[^_]*)?$/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Extract action from callback data
   */
  static extractAction(callbackData: string): string {
    const parts = callbackData.split("_");
    return parts[0];
  }

  /**
   * Extract category ID from category selection callback
   */
  static extractCategoryId(callbackData: string): string | null {
    const match = callbackData.match(/^select-category_(.+)_\d+$/);
    return match ? match[1] : null;
  }

  /**
   * Extract account ID from account selection callback
   */
  static extractAccountId(callbackData: string): string | null {
    const match = callbackData.match(/^select-account_(.+)_\d+$/);
    return match ? match[1] : null;
  }

  /**
   * Extract currency from account edit callback
   */
  static extractCurrency(callbackData: string): string | null {
    const parts = callbackData.split("_");
    if (parts.length > 2 && parts[0] === CallbackActions.EDIT_ACCOUNT) {
      return parts[2];
    }
    return null;
  }

  /**
   * Check if callback data starts with specific action
   */
  static startsWithAction(
    callbackData: string,
    action: CallbackActions
  ): boolean {
    return callbackData.startsWith(action);
  }

  /**
   * Check if callback data is for a specific action pattern
   */
  static matchesPattern(callbackData: string, pattern: string): boolean {
    return callbackData.startsWith(pattern);
  }
}

/**
 * Placeholder features list for Phase 3+ development
 */
export const PLACEHOLDER_FEATURES = [
  // Phase 3 features (SUBMIT removed - now implemented)
  CallbackActions.EDIT_DETAILS, // Advanced details editing
  CallbackActions.NEW_CATEGORY,
  CallbackActions.NEW_ACCOUNT,

  // Phase 4 features - EDIT_MORE replaces individual field editing
  // Legacy individual field edits moved to legacy section above
  // All field editing now handled via template-based EDIT_MORE system

  // Phase 4 account switchers - IMPLEMENTED
  // CallbackActions.EDIT_FROM,
  // CallbackActions.EDIT_TO,
  // CallbackActions.EDIT_SOURCE, (now handled by template system)

  // Phase 5 features
  CallbackActions.EDIT_CONTACT,
  CallbackActions.EDIT_PURPOSE,
  CallbackActions.TYPE_DEBT_PAYMENT,

  // Phase 6 features
  CallbackActions.ANALYTICS,
  CallbackActions.EXPORT,
  CallbackActions.RECURRING,
  CallbackActions.NOTIFICATIONS,
];

/**
 * Check if a callback action is a placeholder feature
 */
export function isPlaceholderFeature(callbackData: string): boolean {
  return PLACEHOLDER_FEATURES.some((feature) => callbackData.includes(feature));
}
