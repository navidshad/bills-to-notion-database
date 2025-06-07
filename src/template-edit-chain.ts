import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Schema for template edit response
const templateEditSchema = z.object({
  transaction_id: z.number().describe("The transaction ID being edited"),
  fields: z
    .object({
      amount: z.number().optional().describe("Transaction amount if provided"),
      date: z
        .string()
        .optional()
        .describe("Transaction date in ISO format if provided"),
      rate: z
        .number()
        .optional()
        .describe("Exchange rate if provided (for transfers)"),
      fee: z
        .number()
        .optional()
        .describe("Transfer fee if provided (for transfers)"),
      category: z
        .string()
        .optional()
        .describe("Transaction category if provided (for expenses)"),
    })
    .describe("The fields to update with their new values"),
  success: z.boolean().describe("Whether the template was parsed successfully"),
  error_message: z
    .string()
    .optional()
    .describe("Error message if parsing failed"),
});

export type TemplateEditResponse = z.infer<typeof templateEditSchema>;

/**
 * Parse user's template edit input using AI
 * @param userInput - The user's template message
 * @returns Parsed template data
 */
export const parseTemplateEdit = async (
  userInput: string
): Promise<TemplateEditResponse> => {
  const chatTemplate = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a financial transaction template parser. Parse the user's edit template and extract the transaction ID and field updates.",
    ],
    ["user", "User Input: {userInput}"],
    [
      "user",
      `TEMPLATE FORMAT EXPECTED:
/edit [transaction_id]

field1: value1
field2: value2

VALID FIELDS:
- amount: numeric value (e.g., 100.50)
- date: date string (convert to ISO format YYYY-MM-DD)
- rate: exchange rate numeric value (e.g., 1.18) - for transfer transactions
- fee: fee amount numeric value (e.g., 3.00) - for transfer transactions
- category: text string (e.g., "Food", "Transport") - for expense transactions

RULES:
1. Extract transaction_id from /edit command
2. Parse only the valid fields listed above
3. Ignore any invalid fields or formats
4. Convert dates to ISO format (YYYY-MM-DD)
5. Return success=false if template is malformed or transaction_id missing
6. Only include fields that are actually provided by the user`,
    ],
    ["system", "JSON result is:"],
  ]);

  const jsonSchema = zodToJsonSchema(templateEditSchema);
  const chain = chatTemplate.pipe(llm.withStructuredOutput(jsonSchema));

  try {
    const result = await chain.invoke({ userInput });
    return result as TemplateEditResponse;
  } catch (error) {
    console.error("Error parsing template edit:", error);
    return {
      transaction_id: 0,
      fields: {},
      success: false,
      error_message: "Failed to parse template",
    };
  }
};

/**
 * Generate edit template for a transaction based on its type
 * @param transactionId - The transaction ID
 * @param transactionData - Current transaction data
 * @returns Template string for user to edit
 */
export function generateEditTemplate(
  transactionId: number,
  transactionData: any
): string {
  const amount =
    transactionData?.total_price || transactionData?.amount || "100.00";
  const date = transactionData?.date
    ? new Date(transactionData.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const transactionType = transactionData?.transaction_type || "expense";

  let templateFields = "";

  // Base fields for all transaction types
  templateFields += `amount: ${amount}\n`;
  templateFields += `date: ${date}\n`;

  // Add type-specific fields
  if (transactionType === "transfer") {
    const rate = transactionData?.exchange_rate || "1.0";
    const fee = transactionData?.fee || "0";
    templateFields += `rate: ${rate}\n`;
    templateFields += `fee: ${fee}\n`;
  } else if (transactionType === "expense") {
    const category = transactionData?.category || "Other";
    templateFields += `category: ${category}\n`;
  }

  return `📝 Edit Transaction #${transactionId}

Copy this template, edit the values you want to change, and send it back:

/edit ${transactionId}

${templateFields}
✏️ Edit any field you want to change, then send the whole template back.`;
}
