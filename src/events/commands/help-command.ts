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

    const helpMessage = `🤖 **Personal Finance Bot Help - Phase 3**

**Commands:**
• \`/init\` - Set up a new Google Sheets workbook for tracking
• \`/add\` - Add new transaction (followed by photo or text)
• \`/pending\` - List all pending transactions
• \`/help\` - Show this help message

**How to use:**
1. Use \`/add\` command followed by a photo or description
2. Review and edit the transaction details using the keyboard
3. Select category, account, and transaction type
4. Click "✅ Submit" to save to your yearly Google Sheet
5. Use "✏️ Edit Transaction" to modify submitted bills

**Examples:**
• \`/add\` [then send photo of receipt]
• \`/add Spent $15 on lunch at McDonald's\`
• \`/add Got $500 salary payment\`

**Phase 3 Features:**
✅ Smart AI processing of receipts and text
✅ Interactive keyboards for easy editing
✅ Multiple transaction types (expense, income, transfer)
✅ Category and account management
✅ **NEW:** Submit to yearly sheets (Bills_2024, Bills_2025, etc.)
✅ **NEW:** Edit submitted transactions with clean message history
✅ **NEW:** Simplified interface for submitted bills
✅ **NEW:** Seamless edit-resubmit cycle

**Transaction Flow:**
1. **Temp State:** Edit freely with full keyboards
2. **Submit:** Move to yearly sheet with simplified interface
3. **Edit:** Click "✏️ Edit" to modify, then resubmit
4. **Clean History:** Only final results visible in chat

The bot maintains clean chat history by automatically removing temporary messages.`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
  });
}

export { registerHelpCommand };
