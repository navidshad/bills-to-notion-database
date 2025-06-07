import { google } from "googleapis";

class GoogleSheetsAdapter {
  spreadsheetId: string | undefined;
  serviceAccountPath: string;
  auth: any;
  sheets: any;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    this.serviceAccountPath =
      process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "./service-account.json";
    this.auth = null;
    this.sheets = null;
  }

  async initialize() {
    try {
      // Initialize Google Sheets API with service account
      this.auth = new google.auth.GoogleAuth({
        keyFile: this.serviceAccountPath,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth: this.auth });

      console.log("Google Sheets adapter initialized successfully");
    } catch (error) {
      console.error("Error initializing Google Sheets adapter:", error);
      throw error;
    }
  }

  async initializeSheets() {
    if (!this.sheets) await this.initialize();

    if (!this.spreadsheetId) {
      throw new Error(
        "GOOGLE_SPREADSHEET_ID environment variable not set. Please provide an existing spreadsheet ID."
      );
    }

    try {
      console.log(`Initializing sheets in spreadsheet: ${this.spreadsheetId}`);

      // Get existing spreadsheet info
      const spreadsheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = spreadsheetInfo.data.sheets.map(
        (sheet: any) => sheet.properties.title
      );
      const requiredSheets = [
        `Bills_${new Date().getFullYear()}`,
        "Categories",
        "Accounts",
        "Config",
        "TempBills",
      ];

      // Create missing sheets
      const sheetsToCreate = requiredSheets.filter(
        (sheetName) => !existingSheets.includes(sheetName)
      );

      if (sheetsToCreate.length > 0) {
        console.log(`Creating missing sheets: ${sheetsToCreate.join(", ")}`);

        const requests = sheetsToCreate.map((sheetName) => ({
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: sheetName.startsWith("Bills_")
                  ? 1000
                  : sheetName === "Categories"
                  ? 100
                  : sheetName === "TempBills"
                  ? 100
                  : 50,
                columnCount:
                  sheetName === "TempBills"
                    ? 15
                    : sheetName.startsWith("Bills_")
                    ? 20
                    : sheetName === "Categories"
                    ? 4 // ID, Name, Emoji, Description
                    : sheetName === "Accounts"
                    ? 5 // ID, Name, Emoji, Currency, Description
                    : 3, // Config sheet: Setting, Value, Description
              },
            },
          },
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: { requests },
        });
      }

      // Set up headers and data for all required sheets
      await this.setupBillsHeaders(this.spreadsheetId);
      await this.setupCategoriesData(this.spreadsheetId);
      await this.setupAccountsData(this.spreadsheetId);
      await this.setupConfigData(this.spreadsheetId);
      await this.setupTempBillsHeaders(this.spreadsheetId);

      return {
        spreadsheetId: this.spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`,
        sheetsCreated: sheetsToCreate,
        existingSheets: existingSheets,
      };
    } catch (error) {
      console.error("Error initializing sheets:", error);
      throw error;
    }
  }

  async setupBillsHeaders(spreadsheetId: string) {
    const currentYear = new Date().getFullYear();
    const headers = [
      "ID",
      "Date",
      "Title/Description",
      "Amount",
      "Currency",
      "Category",
      "Transaction Type",
      "Account",
      "Destination Account",
      "Destination Amount",
      "Destination Currency",
      "Exchange Rate",
      "Fee", // Phase 4: Transfer fee support
      "Payment Method",
      "Tags",
      "Notes",
      "Created At",
      "Updated At",
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Bills_${currentYear}!A1:R1`, // Updated to R1 to include Fee column
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  }

  async setupTempBillsHeaders(spreadsheetId: string) {
    const headers = [
      "bill_id", // Sequential numeric ID starting from 100 (primary key)
      "user_id", // Telegram user ID
      "transaction_data", // JSON string of BillRecord data
      "guide_message_ids", // JSON array of guide message IDs for cleanup [123, 124, 125]
      "user_input_message_id", // User's input message ID for cleanup
      "original_message_id", // The main transaction message to preserve
      "created_at", // Creation timestamp
      "updated_at", // Last update timestamp
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "TempBills!A1:H1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  }

  async setupCategoriesData(spreadsheetId: string) {
    const range = "Categories!A1:D100";
    const values = [
      ["ID", "Name", "Emoji", "Description"],
      ["food", "Food", "🍕", "Restaurants, groceries, takeout"],
      ["transport", "Transport", "🚗", "Gas, public transit, rideshare"],
      ["shopping", "Shopping", "👕", "Clothes, electronics, general purchases"],
      ["utilities", "Utilities", "💡", "Electricity, water, internet, phone"],
      ["healthcare", "Healthcare", "🏥", "Medical bills, pharmacy, insurance"],
      ["entertainment", "Entertainment", "🎬", "Movies, games, subscriptions"],
      ["housing", "Housing", "🏠", "Rent, mortgage, maintenance"],
      ["education", "Education", "📚", "Books, courses, tuition"],
      ["other", "Other", "📋", "Miscellaneous expenses"],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }

  async setupAccountsData(spreadsheetId: string) {
    const range = "Accounts!A1:E100";
    const values = [
      ["ID", "Name", "Emoji", "Currency", "Description"],
      ["main_card", "Main Card", "💳", "USD", "Primary debit/credit card"],
      ["checking", "Checking", "🏦", "USD", "Main checking account"],
      ["euro_card", "Euro Card", "💳", "EUR", "European debit/credit card"],
      ["euro_cash", "Euro Cash", "💰", "EUR", "Physical euro cash"],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }

  async setupConfigData(spreadsheetId: string) {
    const config = [
      ["Setting", "Value", "Description"],
      ["default_account", "Main Card", "Default account for expenses"],
      [
        "default_category",
        "Other",
        "Default category for unclassified expenses",
      ],
      ["timezone", "UTC", "Default timezone"],
      ["date_format", "YYYY-MM-DD", "Date format preference"],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Config!A1:C5",
      valueInputOption: "RAW",
      requestBody: {
        values: config,
      },
    });
  }

  normalizeDate(date: string) {
    // remove time
    date = date.split(" ")[0];
    // remove `"`, `'` around the date
    date = date.replace(/["']/g, "");
    // replace `/` with `-`
    date = date.split("/").join("-");
    // replace `.` with `-`
    date = date.split(".").join("-");
    return date;
  }

  flatItems(description: string) {
    // separate by , and . to new lines
    description = description.split(",").join("\n");
    description = description.split(".").join("\n");
    // trim the lines
    description = description
      .split("\n")
      .map((line: string) => line.trim())
      .join("\n");
    return description;
  }

  async addItem(
    title: string,
    totalPrice: number,
    currency_code: string,
    date: string,
    description: string,
    id?: number
  ) {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      const currentYear = new Date().getFullYear();
      const sheetName = `Bills_${currentYear}`;

      // Ensure the yearly sheet exists
      await this.ensureYearlySheetExists(currentYear);

      description = description || "";
      description = this.flatItems(description);

      const normalizedDate = this.normalizeDate(date);
      const timestamp = new Date().toISOString();

      // Use provided ID or generate a fallback timestamp-based ID
      const itemId = id || Date.now();

      // Use provided currency or get default from default account
      const finalCurrency = currency_code || (await this.getDefaultCurrency());

      const values = [
        itemId, // ID
        normalizedDate, // Date
        title, // Title/Description
        totalPrice, // Amount
        finalCurrency.toUpperCase(), // Currency
        "Other", // Category (default)
        "Expense", // Transaction Type (default)
        "Main Card", // Account (default)
        "", // Destination Account
        "", // Destination Amount
        "", // Destination Currency
        "", // Exchange Rate
        "", // Payment Method
        "", // Tags
        description, // Notes
        timestamp, // Created At
        timestamp, // Updated At
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Q`,
        valueInputOption: "RAW",
        requestBody: {
          values: [values],
        },
      });

      console.log("Success! Entry added to Google Sheets.");
      return { success: true, id: itemId };
    } catch (error) {
      console.error("Error adding item to Google Sheets:", error);
      throw error;
    }
  }

  async getRange(range: string) {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });
      return response.data;
    } catch (error: any) {
      if (error.status === 400) {
        // Sheet or range doesn't exist
        return null;
      }
      throw error;
    }
  }

  async getCategories() {
    try {
      const range = "Categories!A2:D";
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        id: row[0] || "",
        name: row[1] || "",
        emoji: row[2] || "📋",
        description: row[3] || "",
      }));
    } catch (error) {
      console.error("Error getting categories from Google Sheets:", error);
      // Fallback to default categories
      return [];
    }
  }

  async getAccounts() {
    try {
      const range = "Accounts!A2:E";
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        id: row[0] || "",
        name: row[1] || "",
        emoji: row[2] || "💳",
        currency: (row[3] || "USD").toString().toUpperCase(),
        description: row[4] || "",
      }));
    } catch (error) {
      console.error("Error getting accounts from Google Sheets:", error);
      // Fallback to default accounts (only USD and EUR)
      return [];
    }
  }

  async getConfig() {
    try {
      const range = "Config!A2:B";
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      const config: Record<string, string> = {};

      rows.forEach((row: any[]) => {
        if (row[0] && row[1]) {
          config[row[0]] = row[1];
        }
      });

      return config;
    } catch (error) {
      console.error("Error getting config from Google Sheets:", error);
      // Fallback to default config
      return {
        default_account: "Main Card",
        default_category: "Other",
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
      };
    }
  }

  async getDefaultCurrency(): Promise<string> {
    try {
      // Get the default account from config
      const config = await this.getConfig();
      const defaultAccountName = config.default_account || "Main Card";

      // Get all accounts and find the default one
      const accounts = await this.getAccounts();
      const defaultAccount = accounts.find(
        (acc: any) =>
          acc.name === defaultAccountName || acc.id === defaultAccountName
      );

      // Return the currency from the default account, fallback to USD
      return defaultAccount ? defaultAccount.currency : "USD";
    } catch (error) {
      console.error("Error getting default currency:", error);
      return "USD";
    }
  }

  async ensureYearlySheetExists(year: number) {
    const sheetName = `Bills_${year}`;

    try {
      // Try to get the sheet to see if it exists
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:A1`,
      });
    } catch (error: any) {
      if (error.status === 400) {
        // Sheet doesn't exist, create it
        console.log(`Creating sheet for year ${year}`);
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: 20,
                    },
                  },
                },
              },
            ],
          },
        });

        // Set up headers for the new sheet
        await this.setupBillsHeaders(this.spreadsheetId!);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create a new account in the Google Sheets
   */
  async createAccount(
    id: string,
    name: string,
    emoji: string,
    currency: string,
    description: string
  ) {
    try {
      if (!this.sheets) await this.initialize();
      if (!this.spreadsheetId) {
        throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
      }

      // Normalize currency to uppercase
      const normalizedCurrency = currency.toUpperCase();

      // Get current accounts to find the next available row
      const currentData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Accounts!A:E",
      });

      const rows = currentData.data.values || [];
      const nextRow = rows.length + 1;

      // Append the new account
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Accounts!A${nextRow}:E${nextRow}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[id, name, emoji, normalizedCurrency, description]],
        },
      });

      console.log(
        `Successfully created account: ${name} (${normalizedCurrency})`
      );
      return { success: true, id, name, currency: normalizedCurrency };
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }

  /**
   * Check if an account with the given ID exists
   */
  async accountExists(accountId: string): Promise<boolean> {
    try {
      if (!this.sheets) await this.initialize();

      const accounts = await this.getAccounts();
      return accounts.some((account: any) => account.id === accountId);
    } catch (error) {
      console.error("Error checking if account exists:", error);
      return false;
    }
  }

  /**
   * Get all supported currencies from existing accounts
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      if (!this.sheets) await this.initialize();

      const accounts = await this.getAccounts();
      const currencies: string[] = accounts.map(
        (account: any) => account.currency as string
      );
      return Array.from(new Set(currencies)); // Remove duplicates
    } catch (error) {
      console.error("Error getting supported currencies:", error);
      return ["USD", "EUR"]; // Fallback to defaults
    }
  }

  /**
   * Check if a currency is supported (has at least one account)
   */
  async isCurrencySupported(currency: string): Promise<boolean> {
    try {
      if (!this.sheets) await this.initialize();

      const supportedCurrencies = await this.getSupportedCurrencies();
      return supportedCurrencies.includes(currency.toUpperCase());
    } catch (error) {
      console.error("Error checking currency support:", error);
      return ["USD", "EUR"].includes(currency.toUpperCase());
    }
  }

  /**
   * Validate extracted currency and return validation result
   */
  async validateCurrency(extractedCurrency: string): Promise<{
    isValid: boolean;
    currency: string;
    warning?: string;
    supportedCurrencies: string[];
  }> {
    try {
      if (!this.sheets) await this.initialize();

      const supportedCurrencies = await this.getSupportedCurrencies();

      if (!extractedCurrency || extractedCurrency.trim() === "") {
        // No currency extracted, use default
        const defaultCurrency = await this.getDefaultCurrency();
        return {
          isValid: true,
          currency: defaultCurrency,
          supportedCurrencies,
        };
      }

      const normalizedCurrency = extractedCurrency.toUpperCase();
      const isSupported = supportedCurrencies.includes(normalizedCurrency);

      if (isSupported) {
        return {
          isValid: true,
          currency: normalizedCurrency,
          supportedCurrencies,
        };
      } else {
        // Fall back to default currency instead of using unsupported currency
        const defaultCurrency = await this.getDefaultCurrency();
        return {
          isValid: false,
          currency: defaultCurrency,
          warning: `Currency "${normalizedCurrency}" not recognized. Using default account. Supported currencies: ${supportedCurrencies.join(
            ", "
          )}.`,
          supportedCurrencies,
        };
      }
    } catch (error) {
      console.error("Error validating currency:", error);
      const defaultCurrency = await this.getDefaultCurrency();
      return {
        isValid: true,
        currency: defaultCurrency,
        supportedCurrencies: ["USD", "EUR"],
      };
    }
  }

  /**
   * Validate that account and category IDs exist in Google Sheets
   */
  async validateBillData(billDetail: any): Promise<{
    isValid: boolean;
    errors: string[];
    correctedData: any;
  }> {
    try {
      if (!this.sheets) await this.initialize();

      const errors: string[] = [];
      const correctedData = { ...billDetail };

      // Get available accounts and categories
      const [accounts, categories] = await Promise.all([
        this.getAccounts(),
        this.getCategories(),
      ]);

      // Validate account
      if (billDetail.account) {
        const accountExists = accounts.some(
          (acc: any) => acc.id === billDetail.account
        );
        if (!accountExists) {
          errors.push(
            `Account "${
              billDetail.account
            }" not found. Available accounts: ${accounts
              .map((acc: any) => acc.id)
              .join(", ")}`
          );
          // Remove invalid account
          delete correctedData.account;
        }
      }

      // Validate category
      if (billDetail.category) {
        const categoryExists = categories.some(
          (cat: any) => cat.id === billDetail.category
        );
        if (!categoryExists) {
          errors.push(
            `Category "${
              billDetail.category
            }" not found. Available categories: ${categories
              .map((cat: any) => cat.id)
              .join(", ")}`
          );
          // Remove invalid category
          delete correctedData.category;
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        correctedData,
      };
    } catch (error) {
      console.error("Error validating bill data:", error);
      return {
        isValid: false,
        errors: ["Failed to validate against Google Sheets"],
        correctedData: billDetail,
      };
    }
  }

  /**
   * TempBills Management Methods
   */

  /**
   * Save a temporary bill to TempBills sheet
   */
  async saveTempBill(
    billId: number,
    userId: string,
    transactionData: any,
    originalMessageId: number,
    guideMessageIds: number[] = []
  ) {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      const timestamp = new Date().toISOString();
      const values = [
        billId, // bill_id
        userId, // user_id
        JSON.stringify(transactionData), // transaction_data
        JSON.stringify(guideMessageIds), // guide_message_ids
        "", // user_input_message_id (empty initially)
        originalMessageId, // original_message_id
        timestamp, // created_at
        timestamp, // updated_at
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "TempBills!A:H",
        valueInputOption: "RAW",
        requestBody: {
          values: [values],
        },
      });

      console.log(`TempBill saved: ID ${billId}`);
      return { success: true, billId };
    } catch (error) {
      console.error("Error saving temp bill:", error);
      throw error;
    }
  }

  /**
   * Get a temporary bill by ID
   */
  async getTempBill(billId: number): Promise<any | null> {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "TempBills!A:H",
      });

      if (!response.data.values) return null;

      // Find the row with matching bill_id (skip header row)
      for (let i = 1; i < response.data.values.length; i++) {
        const row = response.data.values[i];
        if (parseInt(row[0]) === billId) {
          return {
            billId: parseInt(row[0]),
            userId: row[1],
            transactionData: JSON.parse(row[2] || "{}"),
            guideMessageIds: JSON.parse(row[3] || "[]"),
            userInputMessageId: row[4] ? parseInt(row[4]) : null,
            originalMessageId: parseInt(row[5]),
            createdAt: row[6],
            updatedAt: row[7],
            rowIndex: i + 1, // 1-based row index for updates
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting temp bill:", error);
      throw error;
    }
  }

  /**
   * Update a temporary bill
   */
  async updateTempBill(
    billId: number,
    updates: {
      transactionData?: any;
      guideMessageIds?: number[];
      userInputMessageId?: number;
    }
  ) {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      // First, get the current temp bill to find its row
      const tempBill = await this.getTempBill(billId);
      if (!tempBill) {
        throw new Error(`TempBill with ID ${billId} not found`);
      }

      const timestamp = new Date().toISOString();

      // Prepare updated values
      const updatedTransactionData = updates.transactionData
        ? JSON.stringify(updates.transactionData)
        : JSON.stringify(tempBill.transactionData);

      // Merge guide message IDs instead of replacing
      const currentGuideMessageIds = tempBill.guideMessageIds || [];
      const updatedGuideMessageIds =
        updates.guideMessageIds !== undefined
          ? JSON.stringify([
              ...currentGuideMessageIds,
              ...updates.guideMessageIds,
            ])
          : JSON.stringify(currentGuideMessageIds);

      const updatedUserInputMessageId =
        updates.userInputMessageId !== undefined
          ? updates.userInputMessageId.toString()
          : tempBill.userInputMessageId
          ? tempBill.userInputMessageId.toString()
          : "";

      const values = [
        tempBill.billId, // bill_id (unchanged)
        tempBill.userId, // user_id (unchanged)
        updatedTransactionData, // transaction_data (updated)
        updatedGuideMessageIds, // guide_message_ids (merged)
        updatedUserInputMessageId, // user_input_message_id (updated)
        tempBill.originalMessageId, // original_message_id (unchanged)
        tempBill.createdAt, // created_at (unchanged)
        timestamp, // updated_at (updated)
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `TempBills!A${tempBill.rowIndex}:H${tempBill.rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [values],
        },
      });

      console.log(`TempBill updated: ID ${billId}`);
      return { success: true, billId };
    } catch (error) {
      console.error("Error updating temp bill:", error);
      throw error;
    }
  }

  /**
   * Delete a temporary bill
   */
  async deleteTempBill(billId: number) {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      // First, get the temp bill to find its row
      const tempBill = await this.getTempBill(billId);
      if (!tempBill) {
        console.warn(`TempBill with ID ${billId} not found for deletion`);
        return { success: true, billId }; // Consider it successful if already gone
      }

      // Delete the row (0-based index for delete request)
      const deleteRowIndex = tempBill.rowIndex - 1;

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: await this.getSheetId("TempBills"),
                  dimension: "ROWS",
                  startIndex: deleteRowIndex,
                  endIndex: deleteRowIndex + 1,
                },
              },
            },
          ],
        },
      });

      console.log(`TempBill deleted: ID ${billId}`);
      return { success: true, billId };
    } catch (error) {
      console.error("Error deleting temp bill:", error);
      throw error;
    }
  }

  /**
   * Get sheet ID by name (helper method for deleteTempBill)
   */
  private async getSheetId(sheetName: string): Promise<number> {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets.find(
        (s: any) => s.properties.title === sheetName
      );

      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      return sheet.properties.sheetId;
    } catch (error) {
      console.error(`Error getting sheet ID for "${sheetName}":`, error);
      throw error;
    }
  }

  /**
   * Get all temporary bills for a user
   */
  async getUserTempBills(userId: string): Promise<any[]> {
    if (!this.sheets) await this.initialize();
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "TempBills!A:H",
      });

      if (!response.data.values) return [];

      const tempBills = [];

      // Find all rows with matching user_id (skip header row)
      for (let i = 1; i < response.data.values.length; i++) {
        const row = response.data.values[i];
        if (row[1] === userId) {
          tempBills.push({
            billId: parseInt(row[0]),
            userId: row[1],
            transactionData: JSON.parse(row[2] || "{}"),
            guideMessageIds: JSON.parse(row[3] || "[]"),
            userInputMessageId: row[4] ? parseInt(row[4]) : null,
            originalMessageId: parseInt(row[5]),
            createdAt: row[6],
            updatedAt: row[7],
            rowIndex: i + 1,
          });
        }
      }

      return tempBills;
    } catch (error) {
      console.error("Error getting user temp bills:", error);
      throw error;
    }
  }

  /**
   * Submit a bill from TempBills to yearly sheet (Phase 3)
   */
  async submitBillToYearlySheet(billId: number): Promise<{
    success: boolean;
    yearlySheetRecord?: any;
    tempBill?: any;
    error?: string;
  }> {
    try {
      // Get the temp bill data
      const tempBill = await this.getTempBill(billId);
      if (!tempBill || !tempBill.transactionData) {
        return { success: false, error: `TempBill #${billId} not found` };
      }

      const transactionData = tempBill.transactionData;
      const currentYear = new Date().getFullYear();
      const sheetName = `Bills_${currentYear}`;

      // Ensure the yearly sheet exists
      await this.ensureYearlySheetExists(currentYear);

      // Convert temp bill to yearly sheet format
      const yearlySheetRecord = {
        id: billId, // Keep the same ID
        date: transactionData.date || new Date().toISOString().split("T")[0],
        title:
          transactionData.title || transactionData.description || "Expense",
        amount: transactionData.amount || transactionData.total_price || 0,
        currency: transactionData.currency_code || "USD",
        category: transactionData.category || "Other",
        transaction_type: transactionData.transaction_type || "expense",
        account: transactionData.account || "Main Card",
        destination_account: transactionData.destination_account || "",
        destination_amount: transactionData.destination_amount || "",
        destination_currency: transactionData.destination_currency || "",
        exchange_rate: transactionData.exchange_rate || "",
        fee: transactionData.fee || "", // Phase 4: Transfer fee support
        payment_method: transactionData.payment_method || "",
        tags: transactionData.tags || "",
        notes: transactionData.notes || "",
        created_at: tempBill.created_at,
        updated_at: new Date().toISOString(),
      };

      // Add to yearly sheet
      const values = [
        [
          yearlySheetRecord.id,
          yearlySheetRecord.date,
          yearlySheetRecord.title,
          yearlySheetRecord.amount,
          yearlySheetRecord.currency,
          yearlySheetRecord.category,
          yearlySheetRecord.transaction_type,
          yearlySheetRecord.account,
          yearlySheetRecord.destination_account,
          yearlySheetRecord.destination_amount,
          yearlySheetRecord.destination_currency,
          yearlySheetRecord.exchange_rate,
          yearlySheetRecord.fee, // Phase 4: Include fee in data
          yearlySheetRecord.payment_method,
          yearlySheetRecord.tags,
          yearlySheetRecord.notes,
          yearlySheetRecord.created_at,
          yearlySheetRecord.updated_at,
        ],
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:R`, // Updated to R to include Fee column
        valueInputOption: "RAW",
        requestBody: { values },
      });

      // Remove from TempBills (this will be handled by BillManager for message cleanup)
      // Note: TempBill deletion is now handled by BillManager to ensure proper message cleanup

      console.log(`Bill #${billId} successfully submitted to ${sheetName}`);
      return { success: true, yearlySheetRecord, tempBill };
    } catch (error) {
      console.error(`Error submitting bill #${billId} to yearly sheet:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get a bill from yearly sheet by ID (Phase 3)
   */
  async getBillFromYearlySheet(
    billId: number,
    year?: number
  ): Promise<any | null> {
    try {
      const targetYear = year || new Date().getFullYear();
      const sheetName = `Bills_${targetYear}`;

      // Check if sheet exists
      const spreadsheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetExists = spreadsheetInfo.data.sheets.some(
        (sheet: any) => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        return null;
      }

      // Get all bills from the yearly sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:R`, // Updated to R to include Fee column
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return null;
      }

      // Find the bill by ID (skip header row)
      const headers = rows[0];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && parseInt(row[0]) === billId) {
          // Convert row to object
          const bill: any = {};
          headers.forEach((header: string, index: number) => {
            bill[header.toLowerCase().replace(/\s+/g, "_")] = row[index] || "";
          });

          // Convert to consistent format
          return {
            id: parseInt(bill.id),
            date: bill.date,
            title: bill["title/description"] || bill.title,
            amount: parseFloat(bill.amount) || 0,
            currency_code: bill.currency,
            category: bill.category,
            transaction_type: bill.transaction_type,
            account: bill.account,
            destination_account: bill.destination_account,
            destination_amount: bill.destination_amount,
            destination_currency: bill.destination_currency,
            exchange_rate: bill.exchange_rate,
            fee: bill.fee || "", // Phase 4: Include fee data
            payment_method: bill.payment_method,
            tags: bill.tags,
            notes: bill.notes,
            created_at: bill.created_at,
            updated_at: bill.updated_at,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting bill #${billId} from yearly sheet:`, error);
      return null;
    }
  }

  /**
   * Update/replace a bill in yearly sheet (Phase 3 - for edit flow)
   */
  async updateBillInYearlySheet(
    billId: number,
    transactionData: any,
    year?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const targetYear = year || new Date().getFullYear();
      const sheetName = `Bills_${targetYear}`;

      // Get all bills from the yearly sheet to find the row
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:R`, // Updated to R to include Fee column
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return { success: false, error: `No bills found in ${sheetName}` };
      }

      // Find the row index for this bill ID
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] && parseInt(rows[i][0]) === billId) {
          rowIndex = i + 1; // Google Sheets is 1-indexed
          break;
        }
      }

      if (rowIndex === -1) {
        return {
          success: false,
          error: `Bill #${billId} not found in ${sheetName}`,
        };
      }

      // Prepare updated values
      const updatedValues = [
        [
          billId, // Keep the same ID
          transactionData.date || new Date().toISOString().split("T")[0],
          transactionData.title || transactionData.description || "Expense",
          transactionData.amount || transactionData.total_price || 0,
          transactionData.currency_code || "USD",
          transactionData.category || "Other",
          transactionData.transaction_type || "expense",
          transactionData.account || "Main Card",
          transactionData.destination_account || "",
          transactionData.destination_amount || "",
          transactionData.destination_currency || "",
          transactionData.exchange_rate || "",
          transactionData.fee || "", // Phase 4: Include fee data
          transactionData.payment_method || "",
          transactionData.tags || "",
          transactionData.notes || "",
          rows[rowIndex - 1][16] || "", // Keep original created_at (adjusted index)
          new Date().toISOString(), // Update updated_at
        ],
      ];

      // Update the specific row
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex}:R${rowIndex}`, // Updated to R to include Fee column
        valueInputOption: "RAW",
        requestBody: { values: updatedValues },
      });

      console.log(`Bill #${billId} successfully updated in ${sheetName}`);
      return { success: true };
    } catch (error) {
      console.error(`Error updating bill #${billId} in yearly sheet:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Copy a bill from yearly sheet back to TempBills for editing (Phase 3)
   */
  async copyBillToTempBills(
    billId: number,
    userId: string,
    originalMessageId: number,
    year?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the bill from yearly sheet
      const bill = await this.getBillFromYearlySheet(billId, year);
      if (!bill) {
        return {
          success: false,
          error: `Bill #${billId} not found in yearly sheet`,
        };
      }

      // Convert to transaction data format
      const transactionData = {
        amount: bill.amount,
        total_price: bill.amount,
        currency_code: bill.currency_code,
        date: bill.date,
        title: bill.title,
        description: bill.title,
        category: bill.category,
        transaction_type: bill.transaction_type,
        account: bill.account,
        destination_account: bill.destination_account,
        destination_amount: bill.destination_amount,
        destination_currency: bill.destination_currency,
        exchange_rate: bill.exchange_rate,
        fee: bill.fee, // Phase 4: Include fee data
        payment_method: bill.payment_method,
        tags: bill.tags,
        notes: bill.notes,
      };

      // Save to TempBills with same ID
      await this.saveTempBill(
        billId,
        userId,
        transactionData,
        originalMessageId,
        []
      );

      console.log(
        `Bill #${billId} copied from yearly sheet to TempBills for editing`
      );
      return { success: true };
    } catch (error) {
      console.error(`Error copying bill #${billId} to TempBills:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export default new GoogleSheetsAdapter();
