import { google } from "googleapis";
import {
  SheetsConfig,
  SheetConfiguration,
  SheetSection,
} from "../config/sheets-config";

export class GoogleSheetsAdapter {
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

      // Generate required sheet names using configuration
      const currentYear = new Date().getFullYear();
      const requiredSheets = [
        SheetsConfig.getSheetName("bills", { year: currentYear }),
        SheetsConfig.getSheetName("reference"),
        SheetsConfig.getSheetName("config"),
        SheetsConfig.getSheetName("tempBills"),
      ];

      // Create missing sheets
      const sheetsToCreate = requiredSheets.filter(
        (sheetName) => !existingSheets.includes(sheetName)
      );

      if (sheetsToCreate.length > 0) {
        console.log(`Creating missing sheets: ${sheetsToCreate.join(", ")}`);

        const requests = sheetsToCreate.map((sheetName) => {
          const sheetKey = this.getSheetKeyByName(sheetName);
          const config = SheetsConfig.SHEETS[sheetKey];

          return {
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: config.gridProperties,
              },
            },
          };
        });

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: { requests },
        });
      }

      // Set up headers and data for all required sheets
      await this.setupSheetHeaders("bills", currentYear);
      await this.setupReferenceData();
      await this.setupSheetHeaders("config");
      await this.setupSheetHeaders("tempBills");

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

  private getSheetKeyByName(sheetName: string): string {
    const currentYear = new Date().getFullYear();

    if (
      sheetName === SheetsConfig.getSheetName("bills", { year: currentYear })
    ) {
      return "bills";
    }
    if (sheetName === SheetsConfig.getSheetName("reference")) {
      return "reference";
    }
    if (sheetName === SheetsConfig.getSheetName("config")) {
      return "config";
    }
    if (sheetName === SheetsConfig.getSheetName("tempBills")) {
      return "tempBills";
    }

    throw new Error(`Unknown sheet name: ${sheetName}`);
  }

  async setupSheetHeaders(sheetKey: string, year?: number) {
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    const config = SheetsConfig.SHEETS[sheetKey];
    if (!config) {
      throw new Error(`Sheet configuration "${sheetKey}" not found`);
    }

    // Get sheet name with variables
    const variables = year ? { year } : {};
    const sheetName = SheetsConfig.getSheetName(sheetKey, variables);

    if (config.fields) {
      // Standard sheet with fields
      const headers = SheetsConfig.getFieldHeaders(sheetKey);
      const range = `${sheetName}!${SheetsConfig.getHeadersRange(config)}`;

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: {
          values: [headers],
        },
      });
    } else if (config.sections) {
      // Reference sheet with sections - handled separately
      if (sheetKey === "reference") {
        await this.setupReferenceData();
      }
    }

    console.log(`Headers set up for ${sheetName}`);
  }

  async setupBillsHeaders(spreadsheetId: string) {
    const currentYear = new Date().getFullYear();
    await this.setupSheetHeaders("bills", currentYear);
  }

  async setupTempBillsHeaders() {
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    await this.setupSheetHeaders("tempBills");
  }

  async setupReferenceData() {
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    // Setup combined Categories, Accounts, and Income Sources in single sheet using configuration
    const sheetName = SheetsConfig.getSheetName("reference");
    const config = SheetsConfig.SHEETS.reference;

    // Setup section titles using configuration
    if (config.sections) {
      for (const section of config.sections) {
        const titleRange = SheetsConfig.getSectionHeaderRange(section, 1);

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${titleRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[section.title]],
          },
        });
      }
    }

    // Setup column headers using configuration
    if (config.sections) {
      for (const section of config.sections) {
        const headerRange = SheetsConfig.getSectionHeaderRange(section, 2);
        const headers = section.fields.map((field) => field.name);

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${headerRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [headers],
          },
        });
      }
    }

    // Setup default data using configuration
    if (config.sections) {
      const sectionDataMap: Record<string, any[]> = {
        "📂 CATEGORIES": SheetsConfig.DEFAULT_DATA.categories,
        "💳 ACCOUNTS": SheetsConfig.DEFAULT_DATA.accounts,
        "💰 INCOME SOURCES": SheetsConfig.DEFAULT_DATA.incomeSources,
      };

      for (const section of config.sections) {
        const sectionData = sectionDataMap[section.title];
        if (sectionData) {
          const dataRange = SheetsConfig.getSectionDataRange(section, 3);
          const endRow = 3 + sectionData.length - 1;
          const fullRange = `${sheetName}!${section.startColumn}3:${section.endColumn}${endRow}`;

          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: fullRange,
            valueInputOption: "RAW",
            requestBody: { values: sectionData },
          });
        }
      }
    }

    // Add visual formatting with colored borders and background
    await this.formatReferenceSheet(this.spreadsheetId, sheetName);
  }

  async formatReferenceSheet(spreadsheetId: string, sheetName: string) {
    try {
      // Get sheet ID for formatting
      const sheetId = await this.getSheetId(sheetName);

      const requests = [
        // Categories section title formatting (A1:D1)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 4,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.85, green: 0.92, blue: 1 }, // Light blue
                textFormat: { bold: true, fontSize: 14 },
                horizontalAlignment: "LEFT",
                borders: {
                  top: {
                    style: "SOLID",
                    width: 3,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  left: {
                    style: "SOLID",
                    width: 3,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  right: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,borders)",
          },
        },
        // Categories column headers formatting (A2:D2)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: 4,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.9, green: 0.95, blue: 1 }, // Lighter blue
                textFormat: { bold: true },
                horizontalAlignment: "LEFT",
                wrapStrategy: "CLIP",
                borders: {
                  top: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  left: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  right: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,wrapStrategy,borders)",
          },
        },
        // Categories data border (A3:D25) - extended range for user additions
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 2,
              endRowIndex: 25,
              startColumnIndex: 0,
              endColumnIndex: 4,
            },
            cell: {
              userEnteredFormat: {
                wrapStrategy: "CLIP",
                borders: {
                  left: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  right: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.2, green: 0.4, blue: 0.8 },
                  },
                  top: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.7, green: 0.7, blue: 0.7 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.7, green: 0.7, blue: 0.7 },
                  },
                },
              },
            },
            fields: "userEnteredFormat(wrapStrategy,borders)",
          },
        },
        // Divider column formatting (E1:E25)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 25,
              startColumnIndex: 4,
              endColumnIndex: 5,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 }, // Light gray
                textFormat: { bold: true, fontSize: 10 },
                horizontalAlignment: "CENTER",
                wrapStrategy: "CLIP",
                borders: {
                  left: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.5, green: 0.5, blue: 0.5 },
                  },
                  right: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.5, green: 0.5, blue: 0.5 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy,borders)",
          },
        },
        // Accounts section title formatting (F1:J1)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 5,
              endColumnIndex: 10,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.85, green: 1, blue: 0.85 }, // Light green
                textFormat: { bold: true, fontSize: 14 },
                horizontalAlignment: "LEFT",
                borders: {
                  top: {
                    style: "SOLID",
                    width: 3,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  left: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  right: {
                    style: "SOLID",
                    width: 3,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,borders)",
          },
        },
        // Accounts column headers formatting (F2:J2)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 2,
              startColumnIndex: 5,
              endColumnIndex: 10,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.9, green: 1, blue: 0.9 }, // Lighter green
                textFormat: { bold: true },
                horizontalAlignment: "LEFT",
                wrapStrategy: "CLIP",
                borders: {
                  top: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  left: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  right: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,wrapStrategy,borders)",
          },
        },
        // Accounts data border (F3:J25) - extended range for user additions
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 2,
              endRowIndex: 25,
              startColumnIndex: 5,
              endColumnIndex: 10,
            },
            cell: {
              userEnteredFormat: {
                wrapStrategy: "CLIP",
                borders: {
                  left: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  right: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.2, green: 0.6, blue: 0.2 },
                  },
                  top: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.7, green: 0.7, blue: 0.7 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.7, green: 0.7, blue: 0.7 },
                  },
                },
              },
            },
            fields: "userEnteredFormat(wrapStrategy,borders)",
          },
        },
        // Divider column formatting between Accounts and Income Sources (K1:K25)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 25,
              startColumnIndex: 10,
              endColumnIndex: 11,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 }, // Light gray
                textFormat: { bold: true, fontSize: 10 },
                horizontalAlignment: "CENTER",
                wrapStrategy: "CLIP",
                borders: {
                  left: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.5, green: 0.5, blue: 0.5 },
                  },
                  right: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.5, green: 0.5, blue: 0.5 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy,borders)",
          },
        },
        // Income Sources section title formatting (L1:O1)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 11,
              endColumnIndex: 15,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 0.9, blue: 0.7 }, // Light orange/yellow
                textFormat: { bold: true, fontSize: 14 },
                horizontalAlignment: "LEFT",
                borders: {
                  top: {
                    style: "SOLID",
                    width: 3,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  left: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  right: {
                    style: "SOLID",
                    width: 3,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,borders)",
          },
        },
        // Income Sources column headers formatting (L2:O2)
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 2,
              startColumnIndex: 11,
              endColumnIndex: 15,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 0.95, blue: 0.85 }, // Lighter orange
                textFormat: { bold: true },
                horizontalAlignment: "LEFT",
                wrapStrategy: "CLIP",
                borders: {
                  top: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  left: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  right: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,wrapStrategy,borders)",
          },
        },
        // Income Sources data border (L3:O25) - extended range for user additions
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 2,
              endRowIndex: 25,
              startColumnIndex: 11,
              endColumnIndex: 15,
            },
            cell: {
              userEnteredFormat: {
                wrapStrategy: "CLIP",
                borders: {
                  left: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  right: {
                    style: "SOLID",
                    width: 2,
                    color: { red: 0.8, green: 0.5, blue: 0.2 },
                  },
                  top: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.7, green: 0.7, blue: 0.7 },
                  },
                  bottom: {
                    style: "SOLID",
                    width: 1,
                    color: { red: 0.7, green: 0.7, blue: 0.7 },
                  },
                },
              },
            },
            fields: "userEnteredFormat(wrapStrategy,borders)",
          },
        },
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });

      console.log(
        "Successfully formatted Reference sheet with Categories (blue), Accounts (green), and Income Sources (orange) sections"
      );
    } catch (error) {
      console.error("Error formatting Reference sheet:", error);
      // Don't throw error - formatting is optional
    }
  }

  async setupConfigData() {
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    const sheetName = SheetsConfig.getSheetName("config");
    const config = SheetsConfig.SHEETS.config;
    const configData = SheetsConfig.DEFAULT_DATA.config;

    const range = `${sheetName}!${SheetsConfig.getDataRange(config, 1)}`;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: configData,
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
      const sheetName = SheetsConfig.getSheetName("bills", {
        year: currentYear,
      });

      // Ensure the yearly sheet exists
      await this.ensureYearlySheetExists(currentYear);

      description = description || "";
      description = this.flatItems(description);

      const normalizedDate = this.normalizeDate(date);
      const timestamp = new Date().toISOString();

      // Use provided ID or generate a fallback timestamp-based ID
      const itemId = id || Date.now();

      // Use provided currency or get default from first account
      const finalCurrency = currency_code || (await this.getDefaultCurrency());

      // Get default account and category from first available
      const defaultAccount = await this.getDefaultAccount();
      const defaultCategory = await this.getDefaultCategory();

      // Create values using configuration template
      const billData = {
        ID: itemId,
        Date: normalizedDate,
        "Title/Description": title,
        Amount: totalPrice,
        Currency: finalCurrency.toUpperCase(),
        Category: defaultCategory,
        "Transaction Type": "Expense",
        Account: defaultAccount,
        "Destination Account": "",
        "Destination Amount": "",
        "Destination Currency": "",
        "Exchange Rate": "",
        Fee: "",
        "Payment Method": "",
        Tags: "",
        Notes: description,
        "Created At": timestamp,
        "Updated At": timestamp,
      };

      const values = SheetsConfig.generateTemplateRow("bills", billData);
      const config = SheetsConfig.SHEETS.bills;
      const dataRange = SheetsConfig.getDataRange(config);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${dataRange}`,
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
      const sheetName = SheetsConfig.getSheetName("reference");
      const section = SheetsConfig.getSection("reference", "📂 CATEGORIES");

      if (!section) {
        throw new Error("Categories section not found in configuration");
      }

      const dataRange = SheetsConfig.getSectionDataRange(section, 3);
      const range = `${sheetName}!${dataRange}`;

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
      const sheetName = SheetsConfig.getSheetName("reference");
      const section = SheetsConfig.getSection("reference", "💳 ACCOUNTS");

      if (!section) {
        throw new Error("Accounts section not found in configuration");
      }

      const dataRange = SheetsConfig.getSectionDataRange(section, 3);
      const range = `${sheetName}!${dataRange}`;

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

  async getIncomeSources() {
    try {
      const sheetName = SheetsConfig.getSheetName("reference");
      const section = SheetsConfig.getSection("reference", "💰 INCOME SOURCES");

      if (!section) {
        throw new Error("Income sources section not found in configuration");
      }

      const dataRange = SheetsConfig.getSectionDataRange(section, 3);
      const range = `${sheetName}!${dataRange}`;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        id: row[0] || "",
        name: row[1] || "",
        emoji: row[2] || "💼",
        description: row[3] || "",
      }));
    } catch (error) {
      console.error("Error getting income sources from Google Sheets:", error);
      // Fallback to default income sources
      return [
        {
          id: "salary",
          name: "Salary",
          emoji: "💼",
          description: "Monthly salary income",
        },
        {
          id: "other_income",
          name: "Other",
          emoji: "📋",
          description: "Other income sources",
        },
      ];
    }
  }

  async getConfig() {
    try {
      const sheetName = SheetsConfig.getSheetName("config");
      const configSheet = SheetsConfig.SHEETS.config;
      const dataRange = SheetsConfig.getDataRange(configSheet, 2); // Skip header row
      const range = `${sheetName}!${dataRange}`;

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
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
      };
    }
  }

  async getDefaultAccount(): Promise<string> {
    try {
      const accounts = await this.getAccounts();
      // Return first account name or "none" if no accounts exist
      return accounts.length > 0 ? accounts[0].name : "none";
    } catch (error) {
      console.error("Error getting default account:", error);
      return "none";
    }
  }

  async getDefaultCategory(): Promise<string> {
    try {
      const categories = await this.getCategories();
      // Return first category name or "none" if no categories exist
      return categories.length > 0 ? categories[0].name : "none";
    } catch (error) {
      console.error("Error getting default category:", error);
      return "none";
    }
  }

  async getDefaultCurrency(): Promise<string> {
    try {
      // Get all accounts and use the first one for currency
      const accounts = await this.getAccounts();
      const firstAccount = accounts.length > 0 ? accounts[0] : null;

      // Return the currency from the first account, fallback to USD
      return firstAccount ? firstAccount.currency : "USD";
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

      // Get current accounts to find the next available row in accounts section (F3:J)
      const currentData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Reference!F3:J",
      });

      const rows = currentData.data.values || [];
      const nextRow = 3 + rows.length; // Start from row 3 (after section title and headers)

      // Append the new account to accounts section (starting at column F)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Reference!F${nextRow}:J${nextRow}`,
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
   * Create a new category in the Google Sheets
   */
  async createCategory(
    id: string,
    name: string,
    emoji: string,
    description: string
  ) {
    try {
      if (!this.sheets) await this.initialize();
      if (!this.spreadsheetId) {
        throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
      }

      // Get current categories to find the next available row in categories section (A3:D)
      const currentData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Reference!A3:D",
      });

      const rows = currentData.data.values || [];
      const nextRow = 3 + rows.length; // Start from row 3 (after section title and headers)

      // Append the new category to categories section (starting at column A)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Reference!A${nextRow}:D${nextRow}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[id, name, emoji, description]],
        },
      });

      console.log(`Successfully created category: ${name}`);
      return { success: true, id, name };
    } catch (error) {
      console.error("Error creating category:", error);
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
        category: transactionData.category || (await this.getDefaultCategory()),
        transaction_type: transactionData.transaction_type || "expense",
        account: transactionData.account || (await this.getDefaultAccount()),
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
          transactionData.category || (await this.getDefaultCategory()),
          transactionData.transaction_type || "expense",
          transactionData.account || (await this.getDefaultAccount()),
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
