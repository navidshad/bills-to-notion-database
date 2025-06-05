"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretUserMessage = exports.generateBillInfo = void 0;
const zod_1 = require("zod");
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const zod_to_json_schema_1 = require("zod-to-json-schema");
// const billRecordSchema = z.object({
//   title: z.string(),
//   total_price: z.number(),
//   date: z.date(),
//   description: z.string(),
// });
// const schema = zodToJsonSchema(billRecordSchema);
const llm = new openai_1.ChatOpenAI({
    modelName: "gpt-4o",
    openAIApiKey: process.env.OPENAI_API_KEY,
});
const generateBillInfo = async (billDetail) => {
    const chatTemplate = prompts_1.ChatPromptTemplate.fromMessages([
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
    const billRecordSchema = zod_1.z.object({
        title: zod_1.z.string({
            description: "title of the bill, generated from the bill detail, don't write 'bill' or none sense words",
        }),
        total_price: zod_1.z.number(),
        currency_code: zod_1.z.string({
            description: "if didn't provide, default is " + process.env.DEFAULT_CURRENCY,
        }),
        date: zod_1.z.date({ description: "if not provided, use message date" }),
        description: zod_1.z.string(),
    });
    const intentJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(billRecordSchema);
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
};
exports.generateBillInfo = generateBillInfo;
const interpretUserMessage = (message) => {
    const chatTemplate = prompts_1.ChatPromptTemplate.fromMessages([
        ["user", "{message}"],
        [
            "user",
            "try to understand the user request, the main goal is to figure out if user is providing a bill detail about his latest shop, and return the intent based on the given schema",
        ],
        ["system", "JSON result is:"],
    ]);
    const intentSchemaObject = zod_1.z.object({
        intent: zod_1.z.enum(["general", "add-bill"]),
        general: zod_1.z.string({
            description: "A general response to the user message, with the same language of message",
        }),
    });
    const intentJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(intentSchemaObject);
    // const chain = new LLMChain({ llm, prompt: chatTemplate });
    const chain = chatTemplate.pipe(llm.withStructuredOutput(intentJsonSchema));
    return (chain
        .invoke({ message })
        // .then((res) => {
        //   return extractJSON(res);
        // })
        .catch((error) => {
        console.error(error);
        return error;
    }));
};
exports.interpretUserMessage = interpretUserMessage;
//# sourceMappingURL=text-chain.js.map