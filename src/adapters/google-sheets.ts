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
      "Payment Method",
      "Tags",
      "Notes",
      "Created At",
      "Updated At",
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Bills_${currentYear}!A1:Q1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });
  }

  async setupTempBillsHeaders(spreadsheetId: string) {
    const headers = [
      "MessageID",
      "ProcessedData",
      "Timestamp",
      "ChatID",
      "Status",
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "TempBills!A1:E1",
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
}

export default new GoogleSheetsAdapter();
