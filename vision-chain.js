const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage } = require("@langchain/core/messages");
const { extractJSON } = require("./helpers");
const chat = new ChatOpenAI({
  modelName: "gpt-4-vision-preview",
  maxTokens: 4096,
});

module.exports = {
  extractImageDetail: (imageURL) => {
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: "This seems to be a receipt. help me to extract items, place, date, and total price. don't return extra details. note: translate the detail into English if it is in another language.",
        },
        {
          type: "image_url",
          image_url: {
            url: imageURL,
          },
        },
      ],
    });

    return chat.invoke([message]).then((response) => response.text);
    // .then((response) => {
    //   return extractJSON(response);
    // });
  },
};
