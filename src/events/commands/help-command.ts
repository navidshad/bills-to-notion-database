/**
 * /help command handler
 * Provides help information to users
 */

/**
 * Handle /help command
 * @param {Object} bot - Telegram bot instance
 */
function registerHelpCommand(bot: any) {
  bot.onText(/\/help/, async (msg: any) => {
    const chatId = msg.chat.id;

    const helpMessage = `🤖 **Personal Finance Bot Help**

**Commands:**
• \`/init\` - Set up a new Google Sheets workbook for tracking
• \`/add\` - Add new transaction (followed by photo or text)
• \`/help\` - Show this help message

**How to use:**
1. Use \`/add\` command followed by a photo or description
2. Review and edit the transaction details using the keyboard
3. Select category, account, and transaction type
4. Click "Submit" to save to your Google Sheets

**Examples:**
• \`/add\` [then send photo of receipt]
• \`/add Spent $15 on lunch at McDonald's\`
• \`/add Got $500 salary payment\`

**Features:**
✅ Smart AI processing of receipts and text
✅ Interactive keyboards for easy editing
✅ Multiple transaction types (expense, income, transfer)
✅ Category and account management
✅ Direct Google Sheets integration

The bot will extract amount, date, merchant, and suggest categories automatically.`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
  });
}

export { registerHelpCommand };
