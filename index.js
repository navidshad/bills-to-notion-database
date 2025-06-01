const TelegramBot = require("node-telegram-bot-api");
const textChain = require("./text-chain");
const visionChain = require("./vision-chain");
const notionAdapter = require("./notion-adapter");

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN || "";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

async function getReceiptDetail(imageId, caption) {
  const fileLink = await bot.getFileLink(imageId);
  const extractedBill = await visionChain.extractImageDetail(fileLink, caption);
  return await textChain.generateBillInfo(extractedBill);
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

  if (!msg.photo && !msg.text) {
    bot.sendMessage(chatId, "Please send a photo/text about your bill");
    return;
  }

  const hasText = !!msg.text;
  const hasPhoto =
    !!msg.photo && (!!msg.photo[3]?.file_id || msg.photo[2]?.file_id);

  // Process the image text
  if (hasPhoto) {
    // Process Image and get the receipt detail
    const imageId = msg.photo[3]?.file_id || msg.photo[2]?.file_id;

    // send a message to the chat acknowledging receipt of their message
    //
    const previewMessage = await bot.sendPhoto(chatId, imageId, {
      caption: "Processing your photo...",
    });

    // calculate the receipt
    //
    const billDetail = await getReceiptDetail(imageId, msg.text);

    // send back the calculated receipt
    //
    bot.editMessageCaption(JSON.stringify(billDetail, null, "\t"), {
      chat_id: chatId,
      message_id: previewMessage.message_id,
      reply_markup: reply_markup,
    });
  }

  // Process text message
  else if (hasText) {
    // send a message to the chat acknowledging receipt of their message
    //
    const previewMessage = await bot.sendMessage(
      chatId,
      "Processing your message..."
    );

    // calculate the receipt
    //
    const { intent, general } = await textChain.interpretUserMessage(msg.text);

    if (intent == "general") {
      bot.sendMessage(chatId, general);
      bot.deleteMessage(chatId, previewMessage.message_id);
      return;
    } else if (intent == "add-bill") {
      // calculate the receipt
      //
      const billDetail = await textChain.generateBillInfo(msg.text);

      // send back the calculated receipt
      //
      bot.editMessageText(JSON.stringify(billDetail, null, "\t"), {
        chat_id: chatId,
        message_id: previewMessage.message_id,
        reply_markup: reply_markup,
      });
      return;
    }
    //
    else {
      bot.sendMessage(chatId, "cant understand your intent");
      bot.deleteMessage(chatId, previewMessage.message_id);
      return;
    }
  }

  // delete the message
  //
  bot.deleteMessage(chatId, msg.message_id);
});

bot.on("callback_query", async (query) => {
  //
  // Recalculate the bill
  //
  if (query.data === "re-calculate" && query.message) {
    if (query.message.photo) {
      editTextMessage({
        newText: "Reprocessing your photo...",
        message: query.message,
      });

      const imageId =
        query.message?.photo[3]?.file_id || query.message?.photo[2]?.file_id;

      const billDetail = await getReceiptDetail(imageId);

      editTextMessage({
        newText: JSON.stringify(billDetail, null, "\t"),
        message: query.message,
        options: {
          reply_markup: reply_markup,
        },
      });
    } else {
      editTextMessage({
        newText: "Reprocessing your bill...",
        message: query.message,
      });

      const billDetail = await textChain.generateBillInfo(query.message.text);

      editTextMessage({
        newText: JSON.stringify(billDetail, null, "\t"),
        message: query.message,
        options: {
          reply_markup: reply_markup,
        },
      });
    }
  }

  //
  // Add to database
  //
  if (query.data === "add-to-database" && query.message) {
    const stringData = query.message.caption || query.message.text;
    // remove inline keyboard
    //
    editTextMessage({
      newText: stringData,
      message: query.message,
    });

    let billRecord = null;
    try {
      billRecord = JSON.parse(stringData || "{}");
    } catch (error) {
      console.error("Error parsing bill record:", error);
    }

    if (!billRecord) return;

    const { title, total_price, currency_code, date, description } = billRecord;

    try {
      await notionAdapter.addItem(
        title,
        total_price,
        currency_code,
        date,
        description
      );

      const caption = stringData + "\n\nAdded to database";
      editTextMessage({
        newText: caption,
        message: query.message,
      });
    } catch (error) {
      bot.sendMessage(
        query.message.chat.id,
        "Error adding to database\n" + error
      );

      editTextMessage({
        newText: stringData,
        message: query.message,
        options: { reply_markup },
      });
    }
  }
});

function editTextMessage({ newText, message, options = {} }) {
  const { caption, messageId, text } = message;

  if (caption) {
    bot.editMessageCaption(newText, {
      chat_id: message.chat.id,
      message_id: message.message_id,
      ...options,
    });
  } else {
    bot.editMessageText(newText, {
      chat_id: message.chat.id,
      message_id: message.message_id,
      ...options,
    });
  }
}
