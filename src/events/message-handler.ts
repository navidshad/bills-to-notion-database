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

    // Skip if it's a command (starts with /)
    if (msg.text && msg.text.startsWith("/")) {
      return;
    }

    if (!msg.photo && !msg.text) {
      bot.sendMessage(
        chatId,
        "Please send a photo/text about your bill or use /help for commands"
      );
      return;
    }

    const hasText = !!msg.text;
    const hasPhoto =
      !!msg.photo && (!!msg.photo[3]?.file_id || msg.photo[2]?.file_id);

    // Process the image text
    if (hasPhoto) {
      // Process Image and get the receipt detail
      const imageId = msg.photo[3]?.file_id || msg.photo[2]?.file_id;

      // send a message to the chat acknowledging receipt of their message
      const previewMessage = await bot.sendPhoto(chatId, imageId, {
        caption: "Processing your photo...",
      });

      // calculate the receipt
      const billDetail = await getReceiptDetail(imageId, msg.text, bot);

      // send back the calculated receipt
      bot.editMessageCaption(JSON.stringify(billDetail, null, "\t"), {
        chat_id: chatId,
        message_id: previewMessage.message_id,
        reply_markup: BILL_REPLY_MARKUP,
      });
    }

    // Process text message
    else if (hasText) {
      // send a message to the chat acknowledging receipt of their message
      const previewMessage = await bot.sendMessage(
        chatId,
        "Processing your message..."
      );

      // calculate the receipt
      const { intent, general } = await textChain.interpretUserMessage(
        msg.text
      );

      if (intent == "general") {
        bot.sendMessage(chatId, general);
        bot.deleteMessage(chatId, previewMessage.message_id);
        return;
      } else if (intent == "add-bill") {
        // calculate the receipt
        const billDetail = await textChain.generateBillInfo(msg.text);

        // send back the calculated receipt
        bot.editMessageText(JSON.stringify(billDetail, null, "\t"), {
          chat_id: chatId,
          message_id: previewMessage.message_id,
          reply_markup: BILL_REPLY_MARKUP,
        });
        return;
      }
      //
      else {
        bot.sendMessage(
          chatId,
          "Can't understand your intent. Use /help for guidance."
        );
        bot.deleteMessage(chatId, previewMessage.message_id);
        return;
      }
    }

    // delete the message
    bot.deleteMessage(chatId, msg.message_id);
  });
}

export { registerMessageHandler };
