/**
 * Personal Finance Telegram Bot
 * Main entry point - imports and registers all event handlers
 */

import TelegramBot from "node-telegram-bot-api";

// Import event handlers
import { registerInitCommand } from "./events/commands/init-command";
import { registerHelpCommand } from "./events/commands/help-command";
import { registerMessageHandler } from "./events/message-handler";
import { registerCallbackHandler } from "./events/callback-handler";

// Replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN || "";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Register all event handlers
registerInitCommand(bot);
registerHelpCommand(bot);
registerMessageHandler(bot);
registerCallbackHandler(bot);

console.log("🤖 Personal Finance Bot started successfully!");
console.log("Available commands:");
console.log("  /init - Initialize Google Sheets workbook");
console.log("  /help - Show help information");
console.log("Send photos or text to process bills and expenses.");
