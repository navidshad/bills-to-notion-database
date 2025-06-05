"use strict";
/**
 * /help command handler
 * Provides help information to users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHelpCommand = registerHelpCommand;
/**
 * Handle /help command
 * @param {Object} bot - Telegram bot instance
 */
function registerHelpCommand(bot) {
    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        const helpMessage = `🤖 **Personal Finance Bot Help**

**Commands:**
• \`/init\` - Set up a new Google Sheets workbook for tracking
• \`/help\` - Show this help message

**How to use:**
1. Send a photo of your receipt/bill
2. Or type a description of your expense
3. Review the processed information  
4. Click "Add to Database" to save it

**Examples:**
• Send a photo of a restaurant receipt
• Type: "Spent $15 on lunch at McDonald's"

The bot will automatically extract amount, date, and merchant information from your input.`;
        bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
    });
}
//# sourceMappingURL=help-command.js.map