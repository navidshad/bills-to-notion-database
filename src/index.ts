/**
 * Personal Finance Telegram Bot
 * Main entry point - imports and registers all event handlers
 */

import TelegramBot from "node-telegram-bot-api";

// Import event handlers
import { registerInitCommand } from "./events/commands/init-command";
import { registerHelpCommand } from "./events/commands/help-command";
import { registerAddCommand } from "./events/commands/add-command";
import { registerTransferCommand } from "./events/commands/transfer-command";
import registerPendingCommand from "./events/commands/pending-command";
import { registerUpdateCommand } from "./events/commands/update-command";
import { registerMessageHandler } from "./events/message-handler";
import { registerCallbackHandler } from "./events/callback-handler";

// Replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN || "";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Register all event handlers
registerInitCommand(bot);
registerHelpCommand(bot);
registerAddCommand(bot);
registerTransferCommand(bot);
registerPendingCommand(bot);
registerUpdateCommand(bot);
registerMessageHandler(bot);
registerCallbackHandler(bot);

console.log("🤖 Personal Finance Bot started successfully!");
console.log("Available commands:");
console.log("  /init - Initialize Google Sheets workbook");
console.log("  /help - Show help information");
console.log("  /add - Add new transaction (followed by photo/text)");
console.log("  /transfer - Add transfer transaction (followed by photo/text)");
console.log("  /pending - List all pending transactions");
console.log(
  "  /update - Update dashboard layout based on reference sheet changes"
);
console.log("Use /add or /transfer commands to process transactions.");
