/**
 * Callback Validation Utilities
 * Ensures all keyboard callback keys have corresponding handlers
 */

import { CallbackActions } from "./callback.types";

/**
 * List of all callback actions that should have handlers
 */
export const REQUIRED_HANDLERS = [
  // Transaction editing actions
  CallbackActions.EDIT_TYPE,
  CallbackActions.EDIT_CATEGORY,
  CallbackActions.EDIT_ACCOUNT,
  CallbackActions.EDIT_SOURCE,
  CallbackActions.EDIT_FROM,
  CallbackActions.EDIT_TO,
  CallbackActions.EDIT_CONTACT,
  CallbackActions.EDIT_PURPOSE,
  CallbackActions.EDIT_DETAILS,
  CallbackActions.EDIT_MORE,

  // Transaction type selections
  CallbackActions.TYPE_EXPENSE,
  CallbackActions.TYPE_INCOME,
  CallbackActions.TYPE_TRANSFER,
  CallbackActions.TYPE_LEND,
  CallbackActions.TYPE_BORROW,
  CallbackActions.TYPE_DEBT_PAYMENT,
  CallbackActions.TYPE_DEBT_RECEIVED,

  // Category and account selections
  CallbackActions.CATEGORY_SELECT,
  CallbackActions.ACCOUNT_SELECT,
  CallbackActions.NEW_CATEGORY,
  CallbackActions.NEW_ACCOUNT,

  // Transaction actions
  CallbackActions.CANCEL,
  CallbackActions.SUBMIT,
  CallbackActions.CONFIRM,
  CallbackActions.CONFIRM_CANCEL,

  // Navigation
  CallbackActions.BACK_TRANSACTION,

  // Legacy actions
  CallbackActions.RE_CALCULATE,
  CallbackActions.ADD_TO_DATABASE,
];

/**
 * Actions that are implemented (have handlers)
 */
export const IMPLEMENTED_HANDLERS = [
  // Currently implemented in callback-handler.ts
  CallbackActions.EDIT_TYPE,
  CallbackActions.EDIT_CATEGORY,
  CallbackActions.EDIT_ACCOUNT,
  CallbackActions.EDIT_MORE,
  CallbackActions.CATEGORY_SELECT,
  CallbackActions.ACCOUNT_SELECT,
  CallbackActions.TYPE_EXPENSE,
  CallbackActions.TYPE_INCOME,
  CallbackActions.TYPE_TRANSFER,
  // PHASE 5: Debt transaction types moved to placeholders until proper implementation
  // CallbackActions.TYPE_LEND,
  // CallbackActions.TYPE_BORROW,
  // CallbackActions.TYPE_DEBT_PAYMENT,
  // CallbackActions.TYPE_DEBT_RECEIVED,
  CallbackActions.CANCEL,
  CallbackActions.CONFIRM_CANCEL,
  CallbackActions.BACK_TRANSACTION,
  CallbackActions.RE_CALCULATE,
  CallbackActions.ADD_TO_DATABASE,
];

/**
 * Actions that are placeholders (show placeholder messages)
 */
export const PLACEHOLDER_HANDLERS = [
  // Phase 3 features
  CallbackActions.EDIT_DETAILS,
  CallbackActions.NEW_CATEGORY,
  CallbackActions.NEW_ACCOUNT,
  CallbackActions.SUBMIT,
  CallbackActions.CONFIRM,

  // Phase 4 features
  CallbackActions.EDIT_FROM,
  CallbackActions.EDIT_TO,
  CallbackActions.EDIT_SOURCE,

  // Phase 5 features
  CallbackActions.EDIT_CONTACT,
  CallbackActions.EDIT_PURPOSE,
  CallbackActions.TYPE_LEND,
  CallbackActions.TYPE_BORROW,
  CallbackActions.TYPE_DEBT_PAYMENT,
  CallbackActions.TYPE_DEBT_RECEIVED,

  // Phase 6 features
  CallbackActions.ANALYTICS,
  CallbackActions.EXPORT,
  CallbackActions.RECURRING,
  CallbackActions.NOTIFICATIONS,
];

/**
 * Validate that all required handlers are either implemented or have placeholders
 */
export function validateCallbackHandlers(): {
  isValid: boolean;
  missingHandlers: string[];
  summary: string;
} {
  const allHandled = [...IMPLEMENTED_HANDLERS, ...PLACEHOLDER_HANDLERS];
  const missingHandlers = REQUIRED_HANDLERS.filter(
    (action) => !allHandled.includes(action)
  );

  const isValid = missingHandlers.length === 0;

  const summary = `
Callback Handler Validation Summary:
- Total Required: ${REQUIRED_HANDLERS.length}
- Implemented: ${IMPLEMENTED_HANDLERS.length}
- Placeholders: ${PLACEHOLDER_HANDLERS.length}
- Missing: ${missingHandlers.length}
${
  missingHandlers.length > 0
    ? `\nMissing Handlers:\n${missingHandlers
        .map((h) => `  - ${h}`)
        .join("\n")}`
    : ""
}
`;

  return {
    isValid,
    missingHandlers,
    summary,
  };
}

/**
 * Get development status for a callback action
 */
export function getActionStatus(
  action: CallbackActions
): "implemented" | "placeholder" | "missing" {
  if (IMPLEMENTED_HANDLERS.includes(action)) {
    return "implemented";
  }
  if (PLACEHOLDER_HANDLERS.includes(action)) {
    return "placeholder";
  }
  return "missing";
}

/**
 * Development phase mapping
 */
export const PHASE_MAPPING = {
  // Phase 2 (Current) - Enhanced Keyboards
  phase2: [
    CallbackActions.EDIT_TYPE,
    CallbackActions.EDIT_CATEGORY,
    CallbackActions.EDIT_ACCOUNT,
    CallbackActions.EDIT_MORE,
    CallbackActions.CATEGORY_SELECT,
    CallbackActions.ACCOUNT_SELECT,
    CallbackActions.TYPE_EXPENSE,
    CallbackActions.TYPE_INCOME,
    CallbackActions.TYPE_TRANSFER,
    // PHASE 5: Debt transaction types moved to Phase 5
    // CallbackActions.TYPE_LEND,
    // CallbackActions.TYPE_BORROW,
    // CallbackActions.TYPE_DEBT_PAYMENT,
    // CallbackActions.TYPE_DEBT_RECEIVED,
    CallbackActions.CANCEL,
    CallbackActions.CONFIRM_CANCEL,
    CallbackActions.BACK_TRANSACTION,
    CallbackActions.RE_CALCULATE,
    CallbackActions.ADD_TO_DATABASE,
  ],

  // Phase 3 - Input Collection & Field Edit
  phase3: [
    CallbackActions.EDIT_DETAILS,
    CallbackActions.NEW_CATEGORY,
    CallbackActions.NEW_ACCOUNT,
    CallbackActions.SUBMIT,
    CallbackActions.CONFIRM,
  ],

  // Phase 4 - Transfer & Exchange
  phase4: [
    CallbackActions.EDIT_FROM,
    CallbackActions.EDIT_TO,
    CallbackActions.EDIT_SOURCE,
  ],

  // Phase 5 - Debt Management
  phase5: [
    CallbackActions.EDIT_CONTACT,
    CallbackActions.EDIT_PURPOSE,
    CallbackActions.TYPE_LEND,
    CallbackActions.TYPE_BORROW,
    CallbackActions.TYPE_DEBT_PAYMENT,
    CallbackActions.TYPE_DEBT_RECEIVED,
  ],

  // Phase 6 - Advanced Features
  phase6: [
    CallbackActions.ANALYTICS,
    CallbackActions.EXPORT,
    CallbackActions.RECURRING,
    CallbackActions.NOTIFICATIONS,
  ],
};

/**
 * Get the development phase for a callback action
 */
export function getActionPhase(action: CallbackActions): string {
  for (const [phase, actions] of Object.entries(PHASE_MAPPING)) {
    if (actions.includes(action)) {
      return phase;
    }
  }
  return "unknown";
}
