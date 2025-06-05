"use strict";
/**
 * Personal Finance Telegram Bot
 * Main entry point - imports and registers all event handlers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
// Import event handlers
const init_command_1 = require("./events/commands/init-command");
const help_command_1 = require("./events/commands/help-command");
const message_handler_1 = require("./events/message-handler");
const callback_handler_1 = require("./events/callback-handler");
// Replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN || "";
// Create a bot that uses 'polling' to fetch new updates
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
// Register all event handlers
(0, init_command_1.registerInitCommand)(bot);
(0, help_command_1.registerHelpCommand)(bot);
(0, message_handler_1.registerMessageHandler)(bot);
(0, callback_handler_1.registerCallbackHandler)(bot);
console.log("🤖 Personal Finance Bot started successfully!");
console.log("Available commands:");
console.log("  /init - Initialize Google Sheets workbook");
console.log("  /help - Show help information");
console.log("Send photos or text to process bills and expenses.");
//# sourceMappingURL=index.js.map