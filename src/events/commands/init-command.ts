/**
 * /init command handler
 * Initializes Google Sheets for personal finance tracking
 */

import googleSheetsAdapter from "../../adapters/google-sheets";

/**
 * Handle /init command
 * @param {Object} bot - Telegram bot instance
 */
function registerInitCommand(bot: any) {
  bot.onText(/\/init/, async (msg: any) => {
    const chatId = msg.chat.id;

    try {
      bot.sendMessage(
        chatId,
        "🔧 Initializing your personal finance tracker sheets...\nThis may take a moment..."
      );

      const result = await googleSheetsAdapter.initializeSheets();

      const sheetsCreatedText =
        result.sheetsCreated.length > 0
          ? `\n**Sheets Created:** ${result.sheetsCreated.join(", ")}`
          : "\n**All required sheets already exist**";

      const setupMessage = `✅ Successfully initialized your personal finance tracker!

📋 **Your Spreadsheet ID:** \`${result.spreadsheetId}\`

🔗 **Spreadsheet URL:** ${result.url}${sheetsCreatedText}

**Required Sheets:**
✅ Bills_${new Date().getFullYear()} - Your transactions for this year
✅ Reference - Categories, accounts, and income sources with visual separation
✅ Config - System configuration
✅ TempBills - Temporary storage for processing

🎉 You're ready to start tracking your expenses! Send me a photo of your receipt or describe an expense to get started.`;

      bot.sendMessage(chatId, setupMessage, { parse_mode: "Markdown" });
    } catch (error: any) {
      console.error("Error in /init command:", error);
      bot.sendMessage(
        chatId,
        `❌ Error initializing sheets: ${error.message}\n\nPlease check your Google Sheets configuration and GOOGLE_SPREADSHEET_ID environment variable.`
      );
    }
  });
}

export { registerInitCommand };
