const TelegramBot = require("node-telegram-bot-api");
const textChain = require("./text-chain");
const visionChain = require("./vision-chain");

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN || "";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

async function getReceiptDetail(imageId) {
  const fileLink = await bot.getFileLink(imageId);
  const extractedBill = await visionChain.extractImageDetail(fileLink);
  return await textChain.invoke(extractedBill);
}

const reply_markup = {
  inline_keyboard: [
    [
      {
        text: "Re Calculate",
        callback_data: "re-calculate",
      },
      {
        text: "Add to Database",
        callback_data: "add-to-database",
      },
    ],
  ],
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.photo) {
    bot.sendMessage(chatId, "Please send a photo from your receipt");
    return;
  }

  const imageId = msg.photo[3]?.file_id || msg.photo[2]?.file_id;

  const response = await getReceiptDetail(imageId);

  bot.sendPhoto(chatId, imageId, {
    caption: response.text,
    reply_markup: reply_markup,
  });
});

bot.on("callback_query", async (query) => {
  if (query.data === "re-calculate" && query.message?.photo) {
    const imageId =
      query.message?.photo[3]?.file_id || query.message?.photo[2]?.file_id;

    bot.editMessageCaption("Pending", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      // reply_markup: reply_markup,
    });

    const response = await getReceiptDetail(imageId);

    bot.editMessageCaption(response.text, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: reply_markup,
    });
  }
});
