/**
 * Bill Manager - Phase 3 Implementation
 * Handles bill submission, edit flow, and message tracking
 */

import googleSheetsAdapter from "../adapters/google-sheets";

/**
 * Interface for tracking edit messages during edit flow
 */
interface EditMessageTracker {
  billId: number; // Same ID as original bill
  originalMessageId: number; // The submitted bill message to update
  editGuideMessages: number[]; // All edit instruction messages
  editInputMessages: number[]; // User's edit input messages
  isEditing: boolean; // Currently being edited flag
  userId: string; // User performing the edit
}

/**
 * Bill state enum
 */
export enum BillState {
  TEMP = "temp", // In TempBills, being edited
  SUBMITTED = "submitted", // In yearly sheet, submitted
  EDITING = "editing", // Being edited from yearly sheet
}

/**
 * Bill Manager class for Phase 3 functionality
 */
export class BillManager {
  private static editTrackers = new Map<number, EditMessageTracker>();

  /**
   * Submit a bill from TempBills to yearly sheet
   */
  static async submitBill(billId: number): Promise<{
    success: boolean;
    billState: BillState;
    submittedBill?: any;
    error?: string;
  }> {
    try {
      console.log(`Attempting to submit bill #${billId}`);

      const result = await googleSheetsAdapter.submitBillToYearlySheet(billId);

      if (result.success) {
        // Clear any edit tracking for this bill
        this.editTrackers.delete(billId);

        return {
          success: true,
          billState: BillState.SUBMITTED,
          submittedBill: result.yearlySheetRecord,
        };
      } else {
        return {
          success: false,
          billState: BillState.TEMP,
          error: result.error,
        };
      }
    } catch (error) {
      console.error(`Error in BillManager.submitBill for #${billId}:`, error);
      return {
        success: false,
        billState: BillState.TEMP,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Start edit flow for a submitted bill
   */
  static async startEditFlow(
    billId: number,
    userId: string,
    originalMessageId: number
  ): Promise<{
    success: boolean;
    billState: BillState;
    error?: string;
  }> {
    try {
      // Check if bill is already being edited
      if (this.editTrackers.has(billId)) {
        return {
          success: false,
          billState: BillState.EDITING,
          error: `Bill #${billId} is already being edited`,
        };
      }

      console.log(`Starting edit flow for bill #${billId}`);

      // Copy bill from yearly sheet to TempBills
      const result = await googleSheetsAdapter.copyBillToTempBills(
        billId,
        userId,
        originalMessageId
      );

      if (result.success) {
        // Track the edit session
        this.editTrackers.set(billId, {
          billId,
          originalMessageId,
          editGuideMessages: [],
          editInputMessages: [],
          isEditing: true,
          userId,
        });

        return {
          success: true,
          billState: BillState.EDITING,
        };
      } else {
        return {
          success: false,
          billState: BillState.SUBMITTED,
          error: result.error,
        };
      }
    } catch (error) {
      console.error(`Error starting edit flow for bill #${billId}:`, error);
      return {
        success: false,
        billState: BillState.SUBMITTED,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Resubmit an edited bill (replace in yearly sheet)
   */
  static async resubmitEditedBill(billId: number): Promise<{
    success: boolean;
    billState: BillState;
    error?: string;
  }> {
    try {
      console.log(`Resubmitting edited bill #${billId}`);

      // Get the updated transaction data from TempBills
      const tempBill = await googleSheetsAdapter.getTempBill(billId);
      if (!tempBill || !tempBill.transactionData) {
        return {
          success: false,
          billState: BillState.EDITING,
          error: `Updated bill data not found in TempBills`,
        };
      }

      // Update the bill in yearly sheet
      const updateResult = await googleSheetsAdapter.updateBillInYearlySheet(
        billId,
        tempBill.transactionData
      );

      if (updateResult.success) {
        // Remove from TempBills
        await googleSheetsAdapter.deleteTempBill(billId);

        // Clear edit tracking
        this.editTrackers.delete(billId);

        return {
          success: true,
          billState: BillState.SUBMITTED,
        };
      } else {
        return {
          success: false,
          billState: BillState.EDITING,
          error: updateResult.error,
        };
      }
    } catch (error) {
      console.error(`Error resubmitting bill #${billId}:`, error);
      return {
        success: false,
        billState: BillState.EDITING,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cancel edit flow and restore original bill
   */
  static async cancelEditFlow(billId: number): Promise<{
    success: boolean;
    billState: BillState;
    error?: string;
  }> {
    try {
      console.log(`Cancelling edit flow for bill #${billId}`);

      // Remove from TempBills (restores to submitted state)
      await googleSheetsAdapter.deleteTempBill(billId);

      // Clear edit tracking
      this.editTrackers.delete(billId);

      return {
        success: true,
        billState: BillState.SUBMITTED,
      };
    } catch (error) {
      console.error(`Error cancelling edit flow for bill #${billId}:`, error);
      return {
        success: false,
        billState: BillState.EDITING,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get bill state (temp, submitted, or editing)
   */
  static async getBillState(billId: number): Promise<BillState> {
    try {
      // Check if currently being edited
      if (this.editTrackers.has(billId)) {
        return BillState.EDITING;
      }

      // Check if in TempBills
      const tempBill = await googleSheetsAdapter.getTempBill(billId);
      if (tempBill) {
        return BillState.TEMP;
      }

      // Check if in yearly sheet
      const yearlyBill = await googleSheetsAdapter.getBillFromYearlySheet(
        billId
      );
      if (yearlyBill) {
        return BillState.SUBMITTED;
      }

      // Bill not found anywhere
      return BillState.TEMP; // Default state
    } catch (error) {
      console.error(`Error getting bill state for #${billId}:`, error);
      return BillState.TEMP; // Default on error
    }
  }

  /**
   * Track edit-related messages for cleanup
   */
  static trackEditMessage(
    billId: number,
    messageId: number,
    isUserInput: boolean = false
  ): void {
    const tracker = this.editTrackers.get(billId);
    if (tracker) {
      if (isUserInput) {
        tracker.editInputMessages.push(messageId);
      } else {
        tracker.editGuideMessages.push(messageId);
      }
      this.editTrackers.set(billId, tracker);
    }
  }

  /**
   * Clean up all edit-related messages
   */
  static async cleanupEditMessages(
    billId: number,
    bot: any,
    chatId: string
  ): Promise<void> {
    const tracker = this.editTrackers.get(billId);
    if (!tracker) return;

    console.log(`Cleaning up edit messages for bill #${billId}`);

    // Delete all guide messages
    for (const messageId of tracker.editGuideMessages) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.warn(
          `Could not delete edit guide message ${messageId}:`,
          error
        );
      }
    }

    // Delete user input messages
    for (const messageId of tracker.editInputMessages) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.warn(
          `Could not delete edit input message ${messageId}:`,
          error
        );
      }
    }

    // Clear the tracking arrays but keep the tracker for edit state
    tracker.editGuideMessages = [];
    tracker.editInputMessages = [];
    this.editTrackers.set(billId, tracker);
  }

  /**
   * Check if a bill is currently being edited
   */
  static isBillBeingEdited(billId: number): boolean {
    return this.editTrackers.has(billId);
  }

  /**
   * Get edit tracker for a bill
   */
  static getEditTracker(billId: number): EditMessageTracker | undefined {
    return this.editTrackers.get(billId);
  }

  /**
   * Get all bills currently being edited by a user
   */
  static getUserEditingBills(userId: string): number[] {
    const editingBills: number[] = [];
    for (const [billId, tracker] of this.editTrackers.entries()) {
      if (tracker.userId === userId) {
        editingBills.push(billId);
      }
    }
    return editingBills;
  }
}

export default BillManager;
