/**
 * Callback query handler for inline keyboard interactions
 */

const textChain = require("../text-chain");
const googleSheetsAdapter = require("../adapters/google-sheets");
const { getReceiptDetail } = require("../utils/receipt-processor");
const { editTextMessage, BILL_REPLY_MARKUP } = require("../utils/helpers");

/**
 * Register callback query handler
 * @param {Object} bot - Telegram bot instance
 */
function registerCallbackHandler(bot) {
  bot.on("callback_query", async (query) => {
    //
    // Recalculate the bill
    //
    if (query.data === "re-calculate" && query.message) {
      if (query.message.photo) {
        editTextMessage(
          {
            newText: "Reprocessing your photo...",
            message: query.message,
          },
          bot
        );

        const imageId =
          query.message?.photo[3]?.file_id || query.message?.photo[2]?.file_id;

        const billDetail = await getReceiptDetail(imageId, null, bot);

        editTextMessage(
          {
            newText: JSON.stringify(billDetail, null, "\t"),
            message: query.message,
            options: {
              reply_markup: BILL_REPLY_MARKUP,
            },
          },
          bot
        );
      } else {
        editTextMessage(
          {
            newText: "Reprocessing your bill...",
            message: query.message,
          },
          bot
        );

        const billDetail = await textChain.generateBillInfo(query.message.text);

        editTextMessage(
          {
            newText: JSON.stringify(billDetail, null, "\t"),
            message: query.message,
            options: {
              reply_markup: BILL_REPLY_MARKUP,
            },
          },
          bot
        );
      }
    }

    //
    // Add to database
    //
    if (query.data === "add-to-database" && query.message) {
      const stringData = query.message.caption || query.message.text;
      // remove inline keyboard
      editTextMessage(
        {
          newText: stringData,
          message: query.message,
        },
        bot
      );

      let billRecord = null;
      try {
        billRecord = JSON.parse(stringData || "{}");
      } catch (error) {
        console.error("Error parsing bill record:", error);
      }

      if (!billRecord) return;

      const { title, total_price, currency_code, date, description } =
        billRecord;

      try {
        await googleSheetsAdapter.addItem(
          title,
          total_price,
          currency_code,
          date,
          description
        );

        const caption = stringData + "\n\n✅ Added to Google Sheets database";
        editTextMessage(
          {
            newText: caption,
            message: query.message,
          },
          bot
        );
      } catch (error) {
        console.error("Error adding to Google Sheets:", error);
        bot.sendMessage(
          query.message.chat.id,
          "❌ Error adding to database:\n" +
            error.message +
            "\n\nMake sure your Google Sheets is properly configured."
        );

        editTextMessage(
          {
            newText: stringData,
            message: query.message,
            options: { reply_markup: BILL_REPLY_MARKUP },
          },
          bot
        );
      }
    }
  });
}

module.exports = {
  registerCallbackHandler,
};
