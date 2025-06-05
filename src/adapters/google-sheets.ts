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
                    : 5,
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
    const categories = [
      ["Category", "Type", "Description"],
      ["Food & Dining", "Expense", "Restaurants, groceries, coffee"],
      ["Transportation", "Expense", "Gas, public transport, parking"],
      ["Shopping", "Expense", "Clothing, electronics, general shopping"],
      ["Bills & Utilities", "Expense", "Electricity, water, internet, phone"],
      ["Healthcare", "Expense", "Medical expenses, pharmacy, insurance"],
      ["Entertainment", "Expense", "Movies, games, subscriptions"],
      ["Travel", "Expense", "Hotels, flights, vacation expenses"],
      ["Education", "Expense", "Books, courses, training"],
      ["Income", "Income", "Salary, freelance, bonuses"],
      ["Other", "Expense", "Miscellaneous expenses"],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Categories!A1:C11",
      valueInputOption: "RAW",
      requestBody: {
        values: categories,
      },
    });
  }

  async setupAccountsData(spreadsheetId: string) {
    const accounts = [
      ["Account", "Type", "Description"],
      ["Main Card", "Credit Card", "Primary credit card"],
      ["Debit Card", "Debit Card", "Bank debit card"],
      ["Cash", "Cash", "Physical cash"],
      ["Savings", "Bank Account", "Savings account"],
      ["Checking", "Bank Account", "Checking account"],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Accounts!A1:C6",
      valueInputOption: "RAW",
      requestBody: {
        values: accounts,
      },
    });
  }

  async setupConfigData(spreadsheetId: string) {
    const config = [
      ["Setting", "Value", "Description"],
      ["default_currency", "USD", "Default currency for transactions"],
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
      range: "Config!A1:C6",
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
    description: string
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

      // Generate a simple ID (you might want to use UUID in production)
      const id = `bill_${Date.now()}`;

      const values = [
        id, // ID
        normalizedDate, // Date
        title, // Title/Description
        totalPrice, // Amount
        currency_code, // Currency
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
      return { success: true, id };
    } catch (error) {
      console.error("Error adding item to Google Sheets:", error);
      throw error;
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
}

export default new GoogleSheetsAdapter();
