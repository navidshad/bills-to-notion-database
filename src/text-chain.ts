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
  billDetail: string,
  supportedCurrencies?: string[],
  availableAccounts?: any[],
  availableCategories?: any[]
): Promise<BillRecord> => {
  const currencyHint = supportedCurrencies
    ? `\n\nNOTE: User has accounts in these currencies: ${supportedCurrencies.join(
        ", "
      )}. If you detect a different currency, extract it exactly as written.`
    : "";

  const accountsHint =
    availableAccounts && availableAccounts.length > 0
      ? `\n\nAVAILABLE ACCOUNTS: You MUST use ONLY these account IDs: ${availableAccounts
          .map((acc) => `"${acc.id}" (${acc.name} - ${acc.currency})`)
          .join(
            ", "
          )}. If you cannot determine which account fits, leave account field empty.`
      : "";

  const categoriesHint =
    availableCategories && availableCategories.length > 0
      ? `\n\nAVAILABLE CATEGORIES: You MUST use ONLY these category IDs: ${availableCategories
          .map((cat) => `"${cat.id}" (${cat.name})`)
          .join(
            ", "
          )}. If you cannot determine which category fits, leave category field empty.`
      : "";

  const chatTemplate = ChatPromptTemplate.fromMessages([
    ["user", "Financial Transaction: {billDetail}"],
    [
      "user",
      "TRANSACTION TYPE DETECTION: Analyze the text to determine transaction type:\n• 'expense' - spending money, purchases, bills\n• 'income' - receiving money, salary, refunds\n• 'transfer' - moving money between accounts (keywords: transfer, move, from X to Y)\n• 'lend' - giving money to someone\n• 'borrow' - taking money from someone\n• 'debt_payment' - paying back debt\n• 'debt_received' - receiving debt payment",
    ],
    [
      "user",
      "it is really important to return the result according to the schema",
    ],
    [
      "user",
      "please use a valid ISO 8601 for date, message date is {msg_date}",
    ],
    [
      "user",
      "CURRENCY EXTRACTION: Look carefully for currency codes (USD, EUR, GBP, GEL, etc.) or currency symbols ($, €, £, ლ, etc.) in the text. Extract the exact 3-letter ISO currency code. If no currency is found, leave currency_code as empty string." +
        currencyHint,
    ],
    [
      "user",
      "ACCOUNTS & CATEGORIES: Use ONLY the provided account and category IDs. Do NOT make up names." +
        accountsHint +
        categoriesHint,
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
      "Analyze the user request to determine the intent. Return 'add-bill' if the user is describing ANY financial transaction including:\n• Shopping bills/receipts (expenses)\n• Income transactions\n• Money transfers between accounts\n• Lending or borrowing money\n• Debt payments\n• Any transaction with amounts, accounts, or financial details\n\nReturn 'general' only for non-financial conversations, questions, or commands.",
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
