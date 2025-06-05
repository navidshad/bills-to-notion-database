/**
 * Receipt processing utilities
 */

const textChain = require("../text-chain");
const visionChain = require("../vision-chain");

/**
 * Process receipt from image and caption
 * @param {string} imageId - Telegram file ID for the image
 * @param {string} caption - Optional caption text
 * @param {Object} bot - Telegram bot instance
 * @returns {Promise<Object>} Processed bill details
 */
async function getReceiptDetail(imageId, caption, bot) {
  const fileLink = await bot.getFileLink(imageId);
  const extractedBill = await visionChain.extractImageDetail(fileLink, caption);
  return await textChain.generateBillInfo(extractedBill);
}

module.exports = {
  getReceiptDetail,
};
