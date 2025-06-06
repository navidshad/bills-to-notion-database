/**
 * Pending command handler for listing active temporary bills
 * Shows all unconfirmed transactions for the user
 */

import GoogleSheetsAdapter from "../../adapters/google-sheets";

/**
 * Register /pending command
 * @param {Object} bot - Telegram bot instance
 */
function registerPendingCommand(bot: any) {
  bot.onText(/\/pending/, async (msg: any) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    try {
      // Get all temporary bills for this user
      const tempBills = await GoogleSheetsAdapter.getUserTempBills(userId);

      if (tempBills.length === 0) {
        bot.sendMessage(
          chatId,
          "📋 No pending transactions found.\n\nUse /add to create a new transaction."
        );
        return;
      }

      // Format the list of pending transactions
      let messageText = `📋 **Pending Transactions (${tempBills.length})**\n\n`;

      tempBills.forEach((tempBill) => {
        const data = tempBill.transactionData;
        const amount = data.total_price || data.amount || "0.00";
        const currency = data.currency_code || "USD";
        const category = data.category || "Other";
        const account = data.account || "Unknown";

        messageText += `💰 **#${tempBill.billId}** - ${getCurrencySymbol(
          currency
        )}${amount}\n`;
        messageText += `📂 ${category} | 💳 ${account}\n`;
        messageText += `📅 ${formatDate(data.date)}\n\n`;
      });

      messageText += `📝 Use the transaction keyboards to edit and submit your pending transactions.`;

      bot.sendMessage(chatId, messageText, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error getting pending transactions:", error);
      bot.sendMessage(
        chatId,
        "❌ Error retrieving pending transactions. Please try again later."
      );
    }
  });
}

/**
 * Get currency symbol helper
 */
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    GEL: "₾",
    JPY: "¥",
  };
  return symbols[currencyCode] || currencyCode + " ";
}

/**
 * Format date helper
 */
function formatDate(date: any): string {
  if (!date) return "No date";

  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "Invalid date";
  }
}

export default registerPendingCommand;
