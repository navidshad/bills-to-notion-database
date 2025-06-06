/**
 * ID Manager for generating sequential transaction IDs
 * Manages numeric IDs starting from 100
 */

import googleSheetsAdapter from "../adapters/google-sheets";

class IDManager {
  private static lastUsedId: number | null = null;

  /**
   * Get the next available bill ID
   * Checks both TempBills and current year Bills sheet for highest existing ID
   */
  private static async getNextBillID(): Promise<number> {
    try {
      // If we have a cached last ID, just increment it
      if (this.lastUsedId !== null) {
        this.lastUsedId++;
        return this.lastUsedId;
      }

      // First time - need to check existing IDs
      const currentYear = new Date().getFullYear();
      const billsSheetName = `Bills_${currentYear}`;

      let maxId = 99; // Start from 99 so next ID is 100

      // Check TempBills sheet for existing IDs (if it exists)
      try {
        // This will be implemented when TempBills sheet is created in Phase 3
        // For now, we'll just check the current Bills sheet
      } catch (error) {
        // TempBills sheet doesn't exist yet, that's okay
      }

      // Check current year Bills sheet for existing IDs
      try {
        const range = `${billsSheetName}!A:A`; // ID column
        const response = await googleSheetsAdapter.getRange(range);

        if (response && response.values) {
          response.values.forEach((row: any[]) => {
            if (row[0] && typeof row[0] === "number") {
              const id = parseInt(row[0].toString());
              if (!isNaN(id) && id > maxId) {
                maxId = id;
              }
            } else if (row[0] && typeof row[0] === "string") {
              const id = parseInt(row[0]);
              if (!isNaN(id) && id > maxId) {
                maxId = id;
              }
            }
          });
        }
      } catch (error) {
        console.warn(
          `Could not check existing IDs in ${billsSheetName}:`,
          error
        );
        // If sheet doesn't exist, that's okay - we'll start from 100
      }

      const nextId = maxId + 1;
      this.lastUsedId = nextId;
      return nextId;
    } catch (error) {
      console.error("Error generating bill ID:", error);
      // Fallback: use timestamp-based ID but make it smaller
      const fallbackId = Date.now() % 100000; // Last 5 digits of timestamp
      return fallbackId < 100 ? fallbackId + 100 : fallbackId;
    }
  }

  /**
   * Generate a new transaction ID
   * Returns a sequential numeric ID starting from 100
   */
  static async generateTransactionID(): Promise<number> {
    return await this.getNextBillID();
  }

  /**
   * Reset the cached ID (useful for testing or when IDs might have been added externally)
   */
  static resetCache(): void {
    this.lastUsedId = null;
  }
}

export default IDManager;
