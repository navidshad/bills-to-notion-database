/**
 * Utility functions for the Telegram bot
 */
/**
 * Edit a Telegram message (either text or caption)
 * @param {Object} params - Parameters object
 * @param {string} params.newText - New text content
 * @param {Object} params.message - Telegram message object
 * @param {Object} params.options - Additional options (like reply_markup)
 * @param {Object} bot - Telegram bot instance
 */
declare function editTextMessage({ newText, message, options, }: {
    newText: string;
    message: any;
    options?: any;
}, bot: any): void;
/**
 * Standard reply markup for bill processing
 */
declare const BILL_REPLY_MARKUP: {
    inline_keyboard: {
        text: string;
        callback_data: string;
    }[][];
};
export { editTextMessage, BILL_REPLY_MARKUP };
//# sourceMappingURL=helpers.d.ts.map