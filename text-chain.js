const z = require("zod");
const { LLMChain } = require("langchain/chains");
const { ChatOpenAI } = require("@langchain/openai");
const {
  PromptTemplate,
  ChatPromptTemplate,
} = require("@langchain/core/prompts");
const { zodToJsonSchema } = require("zod-to-json-schema");

const billRecordSchema = z.object({
  title: z.string(),
  total_price: z.number(),
  date: z.date(),
  description: z.string(),
});

const schema = zodToJsonSchema(billRecordSchema);

const llm = new ChatOpenAI({
  modelName: "gpt-4",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const chatTemplate = ChatPromptTemplate.fromMessages([
  ["user", "Bill: {billDetail}"],
  ["user", "map this bill to the given schema: {schema}"],
  [
    "user",
    "it is really important to return the result according to the schema",
  ],
  ["user", "please use a valid ISO 8601 for date"],
  ["system", "JSON result is:"],
]);

const chain = new LLMChain({ llm, prompt: chatTemplate });

module.exports = {
  invoke: async (billDetail) => {
    return chain
      .invoke({
        billDetail,
        schema: JSON.stringify({
          title: "string",
          total_price: "number",
          date: "date",
          description: "string",
        }),
      })
      .catch((error) => {
        console.error(error);
        return error;
      });
  },
};
