import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { extractJSON } from "./helpers";

const chat = new ChatOpenAI({
  modelName: "gpt-4.1-mini",
  maxTokens: 4096,
});

export const extractImageDetail = (imageURL: string, caption = "") => {
  const message = new HumanMessage({
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

  return chat.invoke([message]).then((response: any) => response.text);
  // .then((response) => {
  //   return extractJSON(response);
  // });
};
