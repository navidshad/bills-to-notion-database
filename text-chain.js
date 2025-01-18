const z = require("zod");
const { LLMChain } = require("langchain/chains");
const { ChatOpenAI } = require("@langchain/openai");
const {
  PromptTemplate,
  ChatPromptTemplate,
} = require("@langchain/core/prompts");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { extractJSON } = require("./helpers");

// const billRecordSchema = z.object({
//   title: z.string(),
//   total_price: z.number(),
//   date: z.date(),
//   description: z.string(),
// });

// const schema = zodToJsonSchema(billRecordSchema);

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  generateBillInfo: async (billDetail) => {
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

    const billRecordSchema = z.object({
      title: z.string({
        description:
          "title of the bill, generated from the bill detail, don't write 'bill' or none sense words",
      }),
      total_price: z.number(),
      currency_code: z.string({
        description:
          "if didn't provide, default is " + process.env.DEFAULT_CURRENCY,
      }),
      date: z.date({ description: "if not provided, use message date" }),
      description: z.string(),
    });

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
      .catch((error) => {
        console.error(error);
        return error;
      });
  },

  interpretUserMessage(message) {
    const chatTemplate = ChatPromptTemplate.fromMessages([
      ["user", "{message}"],
      [
        "user",
        "try to understand the user request, the main goal is to figure out if user is providing a bill detail about his latest shop, and return the intent based on the given schema",
      ],
      ["system", "JSON result is:"],
    ]);

    const intentSchemaObject = z.object({
      intent: z.enum(["general", "add-bill"]),
      general: z.string({
        description:
          "A general response to the user message, with the same language of message",
      }),
    });

    const intentJsonSchema = zodToJsonSchema(intentSchemaObject);

    // const chain = new LLMChain({ llm, prompt: chatTemplate });
    const chain = chatTemplate.pipe(llm.withStructuredOutput(intentJsonSchema));

    return (
      chain
        .invoke({ message })
        // .then((res) => {
        //   return extractJSON(res);
        // })
        .catch((error) => {
          console.error(error);
          return error;
        })
    );
  },
};
