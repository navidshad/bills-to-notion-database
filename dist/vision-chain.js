"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractImageDetail = void 0;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const chat = new openai_1.ChatOpenAI({
    modelName: "gpt-4o",
    maxTokens: 4096,
});
const extractImageDetail = (imageURL, caption = "") => {
    const message = new messages_1.HumanMessage({
        content: [
            {
                type: "text",
                text: "This seems to be a receipt. help me to extract items, place, date, and total price. don't return extra details. note: translate the detail into English if it is in another language.",
            },
            {
                type: "text",
                text: "image caption: " + caption,
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
};
exports.extractImageDetail = extractImageDetail;
//# sourceMappingURL=vision-chain.js.map