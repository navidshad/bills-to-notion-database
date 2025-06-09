/**
 * /update command handler
 * Updates the dashboard sheet layout based on new entries in the reference sheet
 */

import googleSheetsAdapter from "../../adapters/google-sheets";

/**
 * Handle /update command
 * @param {Object} bot - Telegram bot instance
 */
function registerUpdateCommand(bot: any) {
  bot.onText(/\/update/, async (msg: any) => {
    const chatId = msg.chat.id;

    try {
      // Send initial status message
      const statusMessage = await bot.sendMessage(
        chatId,
        "🔄 Updating dashboard layout...\nAnalyzing reference sheet changes..."
      );

      // Initialize Google Sheets adapter if needed
      if (!googleSheetsAdapter.sheets) {
        await googleSheetsAdapter.initialize();
      }

      if (!googleSheetsAdapter.spreadsheetId) {
        throw new Error(
          "Google Spreadsheet not configured. Please run /init first."
        );
      }

      // Update status - counting accounts and categories
      await bot.editMessageText(
        "🔍 Counting accounts and categories in reference sheet...",
        {
          chat_id: chatId,
          message_id: statusMessage.message_id,
        }
      );

      // Get current counts from reference sheet
      const [accounts, categories, incomeSources] = await Promise.all([
        googleSheetsAdapter.getAccounts(),
        googleSheetsAdapter.getCategories(),
        googleSheetsAdapter.getIncomeSources(),
      ]);

      // Update status - clearing dashboard
      await bot.editMessageText(
        `📊 Found ${accounts.length} accounts, ${categories.length} categories, ${incomeSources.length} income sources\nClearing existing dashboard layout...`,
        {
          chat_id: chatId,
          message_id: statusMessage.message_id,
        }
      );

      // Completely clear the dashboard sheet
      await googleSheetsAdapter.clearDashboard();

      // Update status - rebuilding dashboard
      await bot.editMessageText(
        "🔨 Rebuilding dashboard layout from scratch...",
        {
          chat_id: chatId,
          message_id: statusMessage.message_id,
        }
      );

      // Completely rebuild the dashboard (like init does)
      await googleSheetsAdapter.setupDashboard();

      // Update status - finalizing
      await bot.editMessageText("✨ Finalizing dashboard setup...", {
        chat_id: chatId,
        message_id: statusMessage.message_id,
      });

      // Final success message
      const successMessage = `✅ **Dashboard Updated Successfully!**

📊 **Reference Data Summary:**
• ${accounts.length} accounts configured
• ${categories.length} expense categories available
• ${incomeSources.length} income sources defined

🔄 **Complete Rebuild Applied:**
• Dashboard completely cleared and rebuilt from scratch
• Account balances section sized perfectly for ${accounts.length} accounts
• Monthly expenses section sized perfectly for ${categories.length} categories
• All dynamic formulas recreated with current reference data
• Fresh expense comparison pie chart with latest data
• Clean formatting and layout optimized for your data

📈 **Dashboard Features:**
• Real-time balance calculations with formulas
• Month selector for expense analysis
• Visual charts updated with latest transaction data
• Automatic sizing based on your reference data

💡 **Tip:** Run /update whenever you add new accounts or categories to the reference sheet. This completely rebuilds your dashboard with optimal sizing and fresh data.`;

      await bot.editMessageText(successMessage, {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: "Markdown",
      });

      console.log(
        `Dashboard updated successfully for user ${
          msg.from?.username || chatId
        }`
      );
      console.log(
        `Reference data: ${accounts.length} accounts, ${categories.length} categories, ${incomeSources.length} income sources`
      );
    } catch (error: any) {
      console.error("Error in /update command:", error);

      const errorMessage = `❌ **Error updating dashboard:** ${error.message}

**Common solutions:**
• Make sure your Google Sheets are properly configured
• Run \`/init\` if this is your first time using the bot
• Check that your reference sheet has valid account/category data
• Ensure the bot has edit permissions on your spreadsheet

**Need help?** Use \`/help\` for more information.`;

      try {
        await bot.sendMessage(chatId, errorMessage, { parse_mode: "Markdown" });
      } catch (sendError) {
        // Fallback without markdown if formatting fails
        await bot.sendMessage(
          chatId,
          `❌ Error updating dashboard: ${error.message}\n\nTry running /init to reset your sheets or /help for assistance.`
        );
      }
    }
  });
}

export { registerUpdateCommand };
