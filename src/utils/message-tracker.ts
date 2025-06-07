/**
 * Message Tracker Utility
 * Centralized message sending with automatic ID tracking for temp bills
 */

import googleSheetsAdapter from "../adapters/google-sheets";

interface MessageOptions {
  parse_mode?: string;
  reply_markup?: any;
  disable_web_page_preview?: boolean;
}

interface MessageResponse {
  message_id: number;
  chat: { id: string | number };
  text?: string;
}

/**
 * Send a message and automatically track its ID for a specific transaction
 */
export async function sendAndTrackMessage(
  bot: any,
  chatId: string | number,
  text: string,
  transactionId: number,
  options: MessageOptions = {},
  messageType: "guide" | "error" | "notification" | "processing" = "guide"
): Promise<MessageResponse> {
  // Send the message
  const sentMessage = await bot.sendMessage(chatId, text, options);

  // Track the message ID for cleanup
  await trackMessageForTransaction(
    transactionId,
    sentMessage.message_id,
    messageType
  );

  console.log(
    `Tracked ${messageType} message ${sentMessage.message_id} for transaction #${transactionId}`
  );

  return sentMessage;
}

/**
 * Track a message ID for a specific transaction
 */
export async function trackMessageForTransaction(
  transactionId: number,
  messageId: number,
  messageType: "guide" | "error" | "notification" | "processing" = "guide"
): Promise<void> {
  try {
    const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
    if (tempBill) {
      const currentGuideMessages = tempBill.guideMessageIds || [];

      // Add the new message ID to the tracking list
      const updatedGuideMessages = [...currentGuideMessages, messageId];

      await googleSheetsAdapter.updateTempBill(transactionId, {
        guideMessageIds: updatedGuideMessages,
      });

      console.log(
        `Added message ${messageId} (${messageType}) to transaction #${transactionId} tracking`
      );
    } else {
      console.warn(
        `Cannot track message ${messageId}: Transaction #${transactionId} not found in TempBills`
      );
    }
  } catch (error) {
    console.error(
      `Error tracking message ${messageId} for transaction #${transactionId}:`,
      error
    );
  }
}

/**
 * Send a temporary message that auto-deletes (for notifications)
 */
export async function sendTemporaryMessage(
  bot: any,
  chatId: string | number,
  text: string,
  autoDeleteMs: number = 8000,
  options: MessageOptions = {}
): Promise<MessageResponse> {
  const sentMessage = await bot.sendMessage(chatId, text, options);

  // Auto-delete after specified time
  setTimeout(() => {
    bot.deleteMessage(chatId, sentMessage.message_id).catch((error: any) => {
      console.warn(
        `Could not auto-delete temporary message ${sentMessage.message_id}:`,
        error
      );
    });
  }, autoDeleteMs);

  return sentMessage;
}

/**
 * Edit a message and track the original message ID for a transaction
 */
export async function editAndTrackMessage(
  bot: any,
  chatId: string | number,
  messageId: number,
  newText: string,
  transactionId: number,
  options: { reply_markup?: any; parse_mode?: string } = {}
): Promise<void> {
  await bot.editMessageText(newText, {
    chat_id: chatId,
    message_id: messageId,
    ...options,
  });

  // Track the message as part of the transaction
  await trackMessageForTransaction(transactionId, messageId, "processing");
}

/**
 * Get all tracked message IDs for a transaction
 */
export async function getTrackedMessages(
  transactionId: number
): Promise<number[]> {
  try {
    const tempBill = await googleSheetsAdapter.getTempBill(transactionId);
    if (tempBill && tempBill.guideMessageIds) {
      return tempBill.guideMessageIds;
    }
    return [];
  } catch (error) {
    console.error(
      `Error getting tracked messages for transaction #${transactionId}:`,
      error
    );
    return [];
  }
}

/**
 * Clean up all tracked messages for a transaction
 */
export async function cleanupTrackedMessages(
  bot: any,
  chatId: string | number,
  transactionId: number
): Promise<void> {
  try {
    const trackedMessages = await getTrackedMessages(transactionId);
    const tempBill = await googleSheetsAdapter.getTempBill(transactionId);

    console.log(
      `Cleaning up ${trackedMessages.length} tracked messages for transaction #${transactionId}`
    );

    // Clean up all guide messages
    for (const messageId of trackedMessages) {
      try {
        await bot.deleteMessage(chatId, messageId);
        console.log(`Deleted tracked message ${messageId}`);
      } catch (error) {
        console.warn(`Could not delete tracked message ${messageId}:`, error);
      }
    }

    // Clean up user input message if exists
    if (tempBill && tempBill.userInputMessageId) {
      try {
        await bot.deleteMessage(chatId, tempBill.userInputMessageId);
        console.log(
          `Deleted user input message ${tempBill.userInputMessageId}`
        );
      } catch (error) {
        console.warn(`Could not delete user input message:`, error);
      }
    }

    // Clear the tracking
    await googleSheetsAdapter.updateTempBill(transactionId, {
      guideMessageIds: [],
      userInputMessageId: undefined,
    });

    console.log(`Completed cleanup for transaction #${transactionId}`);
  } catch (error) {
    console.error(
      `Error cleaning up messages for transaction #${transactionId}:`,
      error
    );
  }
}
