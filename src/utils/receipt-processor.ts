/**
 * Receipt processing utilities
 */

import * as textChain from "../text-chain";
import * as visionChain from "../vision-chain";
import GoogleSheetsAdapter from "../adapters/google-sheets";

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

  // Get supported currencies, accounts, and categories for AI hint
  let supportedCurrencies: string[] = ["USD", "EUR"];
  let availableAccounts: any[] = [];
  let availableCategories: any[] = [];

  try {
    supportedCurrencies = await GoogleSheetsAdapter.getSupportedCurrencies();
    availableAccounts = await GoogleSheetsAdapter.getAccounts();
    availableCategories = await GoogleSheetsAdapter.getCategories();
  } catch (error) {
    console.warn(
      "Failed to get data from Google Sheets for receipt processing:",
      error
    );
  }

  return await textChain.generateBillInfo(
    extractedBill,
    supportedCurrencies,
    availableAccounts,
    availableCategories
  );
}

export { getReceiptDetail };
