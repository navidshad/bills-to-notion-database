import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  billRecordSchema,
  userIntentSchema,
  BillRecord,
  UserIntent,
} from "./types";
import {
  transferRecordSchema,
  transferIntentSchema,
  TransferRecord,
  TransferIntent,
} from "./types/transfer.types";

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

/**
 * Generate transfer-specific transaction info using AI
 */
export const generateTransferInfo = async (
  transferDetail: string,
  supportedCurrencies?: string[],
  availableAccounts?: any[]
): Promise<TransferRecord> => {
  const currencyHint =
    supportedCurrencies && supportedCurrencies.length > 0
      ? `\n\nSUPPORTED CURRENCIES: ${supportedCurrencies.join(
          ", "
        )}. Use these currencies when possible.`
      : "";

  const accountsHint =
    availableAccounts && availableAccounts.length > 0
      ? `\n\nAVAILABLE ACCOUNTS: You MUST use ONLY these account names/IDs: ${availableAccounts
          .map((acc) => `"${acc.id}" (${acc.name} - ${acc.currency})`)
          .join(
            ", "
          )}. For from_account and to_account, use exact account IDs. If you cannot determine which account fits, use the account name as written in the transfer description.`
      : "";

  const chatTemplate = ChatPromptTemplate.fromMessages([
    ["user", "Transfer Transaction: {transferDetail}"],
    [
      "user",
      "TRANSFER ANALYSIS: Extract transfer details from the text:\n• Amount in source currency\n• Source account (from_account)\n• Destination account (to_account)\n• Source currency (from_currency)\n• Destination currency (to_currency)\n• Exchange rate if mentioned\n• Transfer fee if mentioned\n• Transfer date\n• Optional description/note",
    ],
    [
      "user",
      "EXCHANGE RATE LOGIC:\n• If same currency transfer (USD to USD): exchange_rate = 1.0\n• If different currencies: extract rate from text or leave undefined\n• If rate provided: destination_amount = amount * exchange_rate\n• If destination_amount provided: exchange_rate = destination_amount / amount",
    ],
    [
      "user",
      "CURRENCY DETECTION: Look for currency codes (USD, EUR, GBP, etc.) or symbols ($, €, £, etc.). Extract 3-letter ISO codes." +
        currencyHint,
    ],
    [
      "user",
      "ACCOUNTS: Use exact account names/IDs from the available accounts list." +
        accountsHint,
    ],
    [
      "user",
      "DATE: Use valid ISO 8601 format (YYYY-MM-DD). Current date context: {msg_date}",
    ],
    [
      "user",
      "IMPORTANT: transaction_type must always be 'transfer'. Return result according to the schema.",
    ],
    ["system", "JSON result is:"],
  ]);

  const transferJsonSchema = zodToJsonSchema(transferRecordSchema);
  const chain = chatTemplate.pipe(llm.withStructuredOutput(transferJsonSchema));

  const parsed_date = new Date(Date.now())
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  return chain
    .invoke({
      transferDetail,
      msg_date: parsed_date,
    })
    .catch((error: any) => {
      console.error("Error generating transfer info:", error);
      return error;
    });
};

/**
 * Interpret user message for transfer intent
 */
export const interpretTransferMessage = (
  message: string
): Promise<TransferIntent> => {
  const chatTemplate = ChatPromptTemplate.fromMessages([
    ["user", "{message}"],
    [
      "user",
      "Analyze the user request to determine if it's a transfer transaction. Return 'transfer' if the user is describing a money transfer between accounts, including:\n• Moving money between personal accounts\n• Bank transfers\n• Account-to-account transfers\n• Currency exchanges between accounts\n• Any transaction involving 'transfer', 'move money', 'send from X to Y'\n\nReturn 'general' only for non-transfer conversations or other transaction types.",
    ],
    ["system", "JSON result is:"],
  ]);

  const intentJsonSchema = zodToJsonSchema(transferIntentSchema);
  const chain = chatTemplate.pipe(llm.withStructuredOutput(intentJsonSchema));

  return chain.invoke({ message }).catch((error: any) => {
    console.error("Error interpreting transfer message:", error);
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
