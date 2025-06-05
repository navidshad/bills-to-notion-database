"use strict";
/**
 * Message handler for processing photos and text messages
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMessageHandler = registerMessageHandler;
const textChain = __importStar(require("../text-chain"));
const receipt_processor_1 = require("../utils/receipt-processor");
const helpers_1 = require("../utils/helpers");
/**
 * Register message handler
 * @param {Object} bot - Telegram bot instance
 */
function registerMessageHandler(bot) {
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        // Skip if it's a command (starts with /)
        if (msg.text && msg.text.startsWith("/")) {
            return;
        }
        if (!msg.photo && !msg.text) {
            bot.sendMessage(chatId, "Please send a photo/text about your bill or use /help for commands");
            return;
        }
        const hasText = !!msg.text;
        const hasPhoto = !!msg.photo && (!!msg.photo[3]?.file_id || msg.photo[2]?.file_id);
        // Process the image text
        if (hasPhoto) {
            // Process Image and get the receipt detail
            const imageId = msg.photo[3]?.file_id || msg.photo[2]?.file_id;
            // send a message to the chat acknowledging receipt of their message
            const previewMessage = await bot.sendPhoto(chatId, imageId, {
                caption: "Processing your photo...",
            });
            // calculate the receipt
            const billDetail = await (0, receipt_processor_1.getReceiptDetail)(imageId, msg.text, bot);
            // send back the calculated receipt
            bot.editMessageCaption(JSON.stringify(billDetail, null, "\t"), {
                chat_id: chatId,
                message_id: previewMessage.message_id,
                reply_markup: helpers_1.BILL_REPLY_MARKUP,
            });
        }
        // Process text message
        else if (hasText) {
            // send a message to the chat acknowledging receipt of their message
            const previewMessage = await bot.sendMessage(chatId, "Processing your message...");
            // calculate the receipt
            const { intent, general } = await textChain.interpretUserMessage(msg.text);
            if (intent == "general") {
                bot.sendMessage(chatId, general);
                bot.deleteMessage(chatId, previewMessage.message_id);
                return;
            }
            else if (intent == "add-bill") {
                // calculate the receipt
                const billDetail = await textChain.generateBillInfo(msg.text);
                // send back the calculated receipt
                bot.editMessageText(JSON.stringify(billDetail, null, "\t"), {
                    chat_id: chatId,
                    message_id: previewMessage.message_id,
                    reply_markup: helpers_1.BILL_REPLY_MARKUP,
                });
                return;
            }
            //
            else {
                bot.sendMessage(chatId, "Can't understand your intent. Use /help for guidance.");
                bot.deleteMessage(chatId, previewMessage.message_id);
                return;
            }
        }
        // delete the message
        bot.deleteMessage(chatId, msg.message_id);
    });
}
//# sourceMappingURL=message-handler.js.map