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
• \`/add\` - Add new expense/income transaction (followed by photo or text)
• \`/transfer\` - Add transfer transaction (followed by photo or text)
• \`/pending\` - List all pending transactions
• \`/update\` - Update dashboard layout based on reference sheet changes
• \`/help\` - Show this help message

**How to use:**
1. Use \`/add\` command followed by a photo or description
2. Review and edit the transaction details using the keyboard
3. Select category/source, account, and transaction type
4. Use "✏️ Edit More" for advanced template-based editing
5. Click "✅ Submit" to save to your yearly Google Sheet
6. Use "✏️ Edit Transaction" to modify submitted bills

**Examples:**
• \`/add\` [then send photo of receipt]
• \`/add Spent $15 on lunch at McDonald's\`
• \`/add Got $500 salary payment\`
• \`/transfer Transfer $100 from savings to checking\`
• \`/transfer Move €50 from main card to cash wallet\`

**Template Editing:**
Use the "✏️ Edit More" button to edit multiple fields at once:
\`\`\`
/edit 123
amount: 25.50
date: 2024-01-15
category: Food
\`\`\`

**Transaction Types:**
• **💸 Expense:** Track spending with categories and accounts
• **💰 Income:** Track earnings with sources and accounts  
• **🔄 Transfer:** Move money between accounts with rates/fees

**Dashboard Management:**
• Use \`/update\` after adding accounts/categories to the reference sheet
• Completely clears and rebuilds dashboard from scratch
• Automatically sizes sections perfectly for your current data
• Recreates all formulas, charts, and formatting for optimal layout

**Smart Features:**
✅ AI processing of receipts and text descriptions
✅ Template-based multi-field editing
✅ Clean chat history with automatic message cleanup
✅ Category, account, and income source management
✅ Yearly sheet organization (Bills_2024, Bills_2025, etc.)
✅ Seamless edit-resubmit workflow for submitted transactions
✅ Dynamic dashboard layout based on reference data

The bot maintains clean chat history by automatically removing temporary messages and providing a professional editing experience.`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
  });
}

export { registerHelpCommand };
