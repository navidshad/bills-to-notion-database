import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  billRecordSchema,
  userIntentSchema,
  BillRecord,
  UserIntent,
} from "./types";

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export const generateBillInfo = async (
  billDetail: string
): Promise<BillRecord> => {
  const chatTemplate = ChatPromptTemplate.fromMessages([
    ["user", "Bill: {billDetail}"],
    [
      "user",
      "it is really important to return the result according to the schema",
    ],
    [
      "user",
      "please use a valid ISO 8601 for date, message date is {msg_date}",
    ],
    ["system", "JSON result is:"],
  ]);

  const intentJsonSchema = zodToJsonSchema(billRecordSchema);

  const chain = chatTemplate.pipe(llm.withStructuredOutput(intentJsonSchema));

  const parsed_date = new Date(Date.now())
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  return chain
    .invoke({
      billDetail,
      msg_date: parsed_date,
    })
    .catch((error: any) => {
      console.error(error);
      return error;
    });
};

export const interpretUserMessage = (message: string): Promise<UserIntent> => {
  const chatTemplate = ChatPromptTemplate.fromMessages([
    ["user", "{message}"],
    [
      "user",
      "try to understand the user request, the main goal is to figure out if user is providing a bill detail about his latest shop, and return the intent based on the given schema",
    ],
    ["system", "JSON result is:"],
  ]);

  const intentJsonSchema = zodToJsonSchema(userIntentSchema);

  // const chain = new LLMChain({ llm, prompt: chatTemplate });
  const chain = chatTemplate.pipe(llm.withStructuredOutput(intentJsonSchema));

  return (
    chain
      .invoke({ message })
      // .then((res) => {
      //   return extractJSON(res);
      // })
      .catch((error: any) => {
        console.error(error);
        return error;
      })
  );
};
