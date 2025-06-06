/**
 * Message handler for processing photos and text messages
 */

import * as textChain from "../text-chain";
import { getReceiptDetail } from "../utils/receipt-processor";
import { BILL_REPLY_MARKUP } from "../utils/helpers";

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

    // Skip processing messages that don't use /add command
    // Direct photos/text are no longer processed automatically
    if (!msg.text?.startsWith("/add")) {
      bot.sendMessage(
        chatId,
        "📸 Use /add command to process transactions\n\nExamples:\n• /add [then send photo]\n• /add Spent $15 on coffee\n\nUse /help for more information."
      );
      return;
    }

    // All transaction processing is now handled by /add command
    // This ensures users use the explicit command structure
  });
}

export { registerMessageHandler };
