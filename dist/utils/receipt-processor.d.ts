/**
 * Receipt processing utilities
 */
/**
 * Process receipt from image and caption
 * @param {string} imageId - Telegram file ID for the image
 * @param {string} caption - Optional caption text
 * @param {Object} bot - Telegram bot instance
 * @returns {Promise<Object>} Processed bill details
 */
declare function getReceiptDetail(imageId: string, caption: string, bot: any): Promise<any>;
export { getReceiptDetail };
//# sourceMappingURL=receipt-processor.d.ts.map