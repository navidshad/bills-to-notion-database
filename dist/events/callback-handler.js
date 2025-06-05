"use strict";
/**
 * Callback query handler for inline keyboard interactions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCallbackHandler = registerCallbackHandler;
const textChain = __importStar(require("../text-chain"));
const google_sheets_1 = __importDefault(require("../adapters/google-sheets"));
const receipt_processor_1 = require("../utils/receipt-processor");
const helpers_1 = require("../utils/helpers");
/**
 * Register callback query handler
 * @param {Object} bot - Telegram bot instance
 */
function registerCallbackHandler(bot) {
    bot.on("callback_query", async (query) => {
        //
        // Recalculate the bill
        //
        if (query.data === "re-calculate" && query.message) {
            if (query.message.photo) {
                (0, helpers_1.editTextMessage)({
                    newText: "Reprocessing your photo...",
                    message: query.message,
                }, bot);
                const imageId = query.message?.photo[3]?.file_id || query.message?.photo[2]?.file_id;
                const billDetail = await (0, receipt_processor_1.getReceiptDetail)(imageId, "", bot);
                (0, helpers_1.editTextMessage)({
                    newText: JSON.stringify(billDetail, null, "\t"),
                    message: query.message,
                    options: {
                        reply_markup: helpers_1.BILL_REPLY_MARKUP,
                    },
                }, bot);
            }
            else {
                (0, helpers_1.editTextMessage)({
                    newText: "Reprocessing your bill...",
                    message: query.message,
                }, bot);
                const billDetail = await textChain.generateBillInfo(query.message.text);
                (0, helpers_1.editTextMessage)({
                    newText: JSON.stringify(billDetail, null, "\t"),
                    message: query.message,
                    options: {
                        reply_markup: helpers_1.BILL_REPLY_MARKUP,
                    },
                }, bot);
            }
        }
        //
        // Add to database
        //
        if (query.data === "add-to-database" && query.message) {
            const stringData = query.message.caption || query.message.text;
            // remove inline keyboard
            (0, helpers_1.editTextMessage)({
                newText: stringData,
                message: query.message,
            }, bot);
            let billRecord = null;
            try {
                billRecord = JSON.parse(stringData || "{}");
            }
            catch (error) {
                console.error("Error parsing bill record:", error);
            }
            if (!billRecord)
                return;
            const { title, total_price, currency_code, date, description } = billRecord;
            try {
                await google_sheets_1.default.addItem(title, total_price, currency_code, date, description);
                const caption = stringData + "\n\n✅ Added to Google Sheets database";
                (0, helpers_1.editTextMessage)({
                    newText: caption,
                    message: query.message,
                }, bot);
            }
            catch (error) {
                console.error("Error adding to Google Sheets:", error);
                bot.sendMessage(query.message.chat.id, "❌ Error adding to database:\n" +
                    error.message +
                    "\n\nMake sure your Google Sheets is properly configured.");
                (0, helpers_1.editTextMessage)({
                    newText: stringData,
                    message: query.message,
                    options: { reply_markup: helpers_1.BILL_REPLY_MARKUP },
                }, bot);
            }
        }
    });
}
//# sourceMappingURL=callback-handler.js.map