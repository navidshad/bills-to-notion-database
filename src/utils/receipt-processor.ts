/**
 * Receipt processing utilities
 */

import * as textChain from "../text-chain";
import * as visionChain from "../vision-chain";

/**
 * Process receipt from image and caption
 * @param {string} imageId - Telegram file ID for the image
 * @param {string} caption - Optional caption text
 * @param {Object} bot - Telegram bot instance
 * @returns {Promise<Object>} Processed bill details
 */
async function getReceiptDetail(imageId: string, caption: string, bot: any) {
  const fileLink = await bot.getFileLink(imageId);
  const extractedBill = await visionChain.extractImageDetail(fileLink, caption);
  return await textChain.generateBillInfo(extractedBill);
}

export { getReceiptDetail };
