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
function editTextMessage({ newText, message, options = {} }, bot) {
  const { caption } = message;

  if (caption) {
    bot.editMessageCaption(newText, {
      chat_id: message.chat.id,
      message_id: message.message_id,
      ...options,
    });
  } else {
    bot.editMessageText(newText, {
      chat_id: message.chat.id,
      message_id: message.message_id,
      ...options,
    });
  }
}

/**
 * Standard reply markup for bill processing
 */
const BILL_REPLY_MARKUP = {
  inline_keyboard: [
    [
      {
        text: "Re Calculate",
        callback_data: "re-calculate",
      },
      {
        text: "Add to Database",
        callback_data: "add-to-database",
      },
    ],
  ],
};

module.exports = {
  editTextMessage,
  BILL_REPLY_MARKUP,
};
