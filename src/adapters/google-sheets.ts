import { google } from "googleapis";
import { SheetsConfig, SectionConfigureContext } from "../config/sheets-config";

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
        SheetsConfig.getSheetName("dashboard"),
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
      await this.setupDashboard();

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
    if (sheetName === SheetsConfig.getSheetName("dashboard")) {
      return "dashboard";
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
    } else if (config.grid) {
      // Grid-based sheets with sections - calculate positions and handle setup
      await SheetsConfig.calculateSectionPositions(config.grid);

      if (sheetKey === "reference") {
        await this.setupReferenceData();
      } else if (sheetKey === "dashboard") {
        await this.setupDashboard();
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

    // Setup sections using new grid configuration
    if (config.grid) {
      // Ensure positions are calculated first
      await SheetsConfig.calculateSectionPositions(config.grid);

      const allSections = SheetsConfig.getAllSections("reference");

      for (const section of allSections) {
        if (!section._calculated) {
          throw new Error(
            "Section positions not calculated. Call calculateSectionPositions first."
          );
        }

        // Setup section title
        const titleRange = SheetsConfig.getSectionHeaderRange(
          section,
          section._calculated.startRow
        );
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${titleRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[section.title]],
          },
        });

        // Setup column headers
        const headerRange = SheetsConfig.getSectionHeaderRange(
          section,
          section._calculated.startRow + 1
        );
        const headers = section.table.fields.map((field) => field.name);
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${headerRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [headers],
          },
        });

        // Setup default data
        if (section.table.defaultData) {
          const dataStartRow = section._calculated.startRow + 2; // After title and headers

          // Clear existing data first to prevent accumulation/duplication
          // Clear a large enough range to remove any old data
          const clearEndRow =
            dataStartRow + Math.max(section.table.defaultData.length, 50) - 1;
          const clearRange = `${sheetName}!${section._calculated.startColumn}${dataStartRow}:${section._calculated.endColumn}${clearEndRow}`;

          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: clearRange,
          });

          // Now populate with fresh default data
          const endRow = dataStartRow + section.table.defaultData.length - 1;
          const fullRange = `${sheetName}!${section._calculated.startColumn}${dataStartRow}:${section._calculated.endColumn}${endRow}`;

          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: fullRange,
            valueInputOption: "RAW",
            requestBody: { values: section.table.defaultData },
          });
        }
      }
    }

    // Add visual formatting with colored borders and background
    await this.formatSheet("reference");
  }

  /**
   * General formatter method for any sheet with grid configuration
   *
   * New Clean Styling Approach:
   * - Section-level borders only (no inner cell borders)
   * - Clean data areas with minimal visual clutter
   * - Strong section boundaries for clear organization
   * - Beautiful color-coded sections based on configuration
   *
   * Benefits:
   * - More readable and professional appearance
   * - Reduced visual noise in data areas
   * - Consistent styling across all sheets
   * - Easy to maintain and extend
   */
  async formatSheet(sheetKey: string) {
    try {
      if (!this.spreadsheetId) {
        throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
      }

      const config = SheetsConfig.SHEETS[sheetKey];
      if (!config?.grid) {
        console.warn(`Sheet ${sheetKey} has no grid configuration`);
        return;
      }

      const sheetName = SheetsConfig.getSheetName(sheetKey);
      const sheetId = await this.getSheetId(sheetName);
      const requests = [];

      // Create context for dynamic sizing (if needed)
      const context: SectionConfigureContext = {
        sheetName,
        spreadsheetId: this.spreadsheetId,
        sheetId,
        sheetsApi: this.sheets,
        allSections: SheetsConfig.getAllSections(sheetKey),
        limits: SheetsConfig.LIMITS,
        getSheetConfig: (key: string) => SheetsConfig.SHEETS[key],
        getSection: (key: string, id: string) =>
          SheetsConfig.getSectionById(key, id),
        columnToNumber: SheetsConfig.columnToNumber,
        numberToColumn: SheetsConfig.numberToColumn,
      };

      // Calculate positions with dynamic sizing
      await SheetsConfig.calculateSectionPositions(config.grid, context);

      // Format each section using calculated coordinates
      const allSections = SheetsConfig.getAllSections(sheetKey);
      for (const section of allSections) {
        if (!section._calculated) continue;

        // Convert to 0-based indices for Google Sheets API
        const startCol =
          SheetsConfig.columnToNumber(section._calculated.startColumn) - 1;
        const endCol = SheetsConfig.columnToNumber(
          section._calculated.endColumn
        );
        const titleRow = section._calculated.startRow - 1;
        const headerRow = titleRow + 1;
        const dataStartRow = headerRow + 1;

        // Use actual data rows instead of full allocated space
        const actualDataRows = section._calculated.actualDataRows;

        if (actualDataRows === undefined) {
          console.error(
            `Section "${section.title}" has undefined actualDataRows, skipping formatting`
          );
          continue;
        }
        const dataEndRow = dataStartRow + actualDataRows - 1;

        // 1. Format section title with top and side borders
        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: titleRow,
              endRowIndex: titleRow + 1,
              startColumnIndex: startCol,
              endColumnIndex: endCol,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: section.color.title,
                textFormat: { bold: true, fontSize: 14 },
                horizontalAlignment: "LEFT",
                borders: {
                  top: {
                    style: "SOLID",
                    width: 3,
                    color: section.color.border,
                  },
                  left: {
                    style: "SOLID",
                    width: 3,
                    color: section.color.border,
                  },
                  right: {
                    style: "SOLID",
                    width: 3,
                    color: section.color.border,
                  },
                  bottom: {
                    style: "SOLID",
                    width: 1,
                    color: section.color.border,
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,borders)",
          },
        });

        // 2. Format section headers with side borders and bottom separator
        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: headerRow,
              endRowIndex: headerRow + 1,
              startColumnIndex: startCol,
              endColumnIndex: endCol,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: section.color.header,
                textFormat: { bold: true, fontSize: 11 },
                horizontalAlignment: "CENTER",
                wrapStrategy: "CLIP",
                borders: {
                  left: {
                    style: "SOLID",
                    width: 3,
                    color: section.color.border,
                  },
                  right: {
                    style: "SOLID",
                    width: 3,
                    color: section.color.border,
                  },
                  bottom: {
                    style: "SOLID",
                    width: 2,
                    color: section.color.border,
                  },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy,borders)",
          },
        });

        // 3. Format data area with clean background, no inner borders
        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: dataStartRow,
              endRowIndex: dataEndRow + 1,
              startColumnIndex: startCol,
              endColumnIndex: endCol,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: section.color.data || {
                  red: 1.0,
                  green: 1.0,
                  blue: 1.0,
                },
                horizontalAlignment: "LEFT",
                wrapStrategy: "CLIP",
                // No inner borders - clean look
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,horizontalAlignment,wrapStrategy)",
          },
        });

        // 4. Add section boundary borders (outline only)
        // Left border for data area
        requests.push({
          updateBorders: {
            range: {
              sheetId: sheetId,
              startRowIndex: dataStartRow,
              endRowIndex: dataEndRow + 1,
              startColumnIndex: startCol,
              endColumnIndex: startCol + 1,
            },
            left: { style: "SOLID", width: 3, color: section.color.border },
          },
        });

        // Right border for data area
        requests.push({
          updateBorders: {
            range: {
              sheetId: sheetId,
              startRowIndex: dataStartRow,
              endRowIndex: dataEndRow + 1,
              startColumnIndex: endCol - 1,
              endColumnIndex: endCol,
            },
            right: { style: "SOLID", width: 3, color: section.color.border },
          },
        });

        // Bottom border for data area (only for sections with defined limits)
        // Skip bottom border for unlimited sections (reference sheet sections)
        if (section.table.maxRows !== undefined) {
          requests.push({
            updateBorders: {
              range: {
                sheetId: sheetId,
                startRowIndex: dataEndRow,
                endRowIndex: dataEndRow + 1,
                startColumnIndex: startCol,
                endColumnIndex: endCol,
              },
              bottom: { style: "SOLID", width: 3, color: section.color.border },
            },
          });
        }

        // 5. Make the first column (ID/# column) narrower if applicable
        if (section.table.fields[0]?.name === "#") {
          requests.push({
            updateDimensionProperties: {
              range: {
                sheetId: sheetId,
                dimension: "COLUMNS",
                startIndex: startCol,
                endIndex: startCol + 1,
              },
              properties: { pixelSize: 50 },
              fields: "pixelSize",
            },
          });
        }
      }

      // Execute all formatting requests
      if (requests.length > 0) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: { requests },
        });
      }

      console.log(
        `Sheet ${sheetName} formatted successfully with clean section borders`
      );
    } catch (error) {
      console.error(`Error formatting sheet ${sheetKey}:`, error);
    }
  }

  async setupDashboard() {
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    const sheetName = SheetsConfig.getSheetName("dashboard");
    const config = SheetsConfig.SHEETS.dashboard;

    if (!config.grid) {
      throw new Error("Dashboard configuration grid not found");
    }

    try {
      // Create context for dynamic row calculation
      const sheetId = await this.getSheetId(sheetName);
      const context: SectionConfigureContext = {
        sheetName,
        spreadsheetId: this.spreadsheetId,
        sheetId,
        sheetsApi: this.sheets,
        allSections: SheetsConfig.getAllSections("dashboard"),
        limits: SheetsConfig.LIMITS,
        getSheetConfig: (key: string) => SheetsConfig.SHEETS[key],
        getSection: (key: string, id: string) =>
          SheetsConfig.getSectionById(key, id),
        columnToNumber: SheetsConfig.columnToNumber,
        numberToColumn: SheetsConfig.numberToColumn,
      };

      // Calculate section positions with dynamic sizing
      await SheetsConfig.calculateSectionPositions(config.grid, context);

      // Setup Configuration section
      const configSection = SheetsConfig.getSectionById(
        "dashboard",
        "configuration"
      );
      if (configSection && configSection._calculated) {
        // Setup title
        const titleRange = SheetsConfig.getSectionHeaderRange(
          configSection,
          configSection._calculated.startRow
        );
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${titleRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[configSection.title]],
          },
        });

        // Setup headers
        const headers = configSection.table.fields.map((field) => field.name);
        const headerRange = SheetsConfig.getSectionHeaderRange(
          configSection,
          configSection._calculated.startRow + 1
        );
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${headerRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [headers],
          },
        });

        // Setup configuration data
        if (configSection.table.defaultData) {
          const dataStartRow = configSection._calculated.startRow + 2;
          const endRow =
            dataStartRow + configSection.table.defaultData.length - 1;
          const fullRange = `${sheetName}!${configSection._calculated.startColumn}${dataStartRow}:${configSection._calculated.endColumn}${endRow}`;

          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: fullRange,
            valueInputOption: "RAW",
            requestBody: {
              values: configSection.table.defaultData,
            },
          });
        }
      }

      // Setup Account Balances section
      const balanceSection = SheetsConfig.getSectionById(
        "dashboard",
        "account_balances"
      );
      if (balanceSection && balanceSection._calculated) {
        // Setup title
        const titleRange = SheetsConfig.getSectionHeaderRange(
          balanceSection,
          balanceSection._calculated.startRow
        );
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${titleRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[balanceSection.title]],
          },
        });

        // Setup headers
        const headers = balanceSection.table.fields.map((field) => field.name);
        const headerRange = SheetsConfig.getSectionHeaderRange(
          balanceSection,
          balanceSection._calculated.startRow + 1
        );
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${headerRange}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [headers],
          },
        });

        // Setup account balances with full configuration
        await SheetsConfig.configureAccountBalancesComplete(context);
      }

      // Setup Monthly Expenses section with full configuration
      await SheetsConfig.configureMonthlyExpensesComplete(context);

      // Create expense comparison pie chart
      await this.createExpenseComparisonPieChart();

      // Apply beautiful formatting with preserved dynamic sizing
      await this.formatSheet("dashboard");

      console.log("Dashboard sheet setup completed successfully");
    } catch (error) {
      console.error("Error setting up dashboard:", error);
      throw error;
    }
  }

  async createExpenseComparisonPieChart() {
    try {
      const sheetName = SheetsConfig.getSheetName("dashboard");
      const sheetId = await this.getSheetId(sheetName);

      // Get the selected year from the dashboard configuration
      const selectedYear = await this.getSelectedYear();
      console.log(
        `Creating expense comparison pie chart for year ${selectedYear}`
      );

      // Remove existing charts first (if any)
      await this.removeExistingCharts(sheetId);

      // Get expense data grouped by category
      const expenseData = await this.getExpenseDataByCategory(selectedYear);

      if (expenseData.length === 0) {
        console.log("No expense data found for pie chart");
        return;
      }

      // First, expand the dashboard sheet grid to accommodate chart data
      // We need at least 21 columns (up to column U) for chart data
      const currentConfig = SheetsConfig.SHEETS.dashboard;
      const requiredColumns = Math.max(
        21,
        currentConfig.gridProperties.columnCount
      );

      if (currentConfig.gridProperties.columnCount < requiredColumns) {
        console.log(
          `Expanding dashboard grid from ${currentConfig.gridProperties.columnCount} to ${requiredColumns} columns`
        );

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: sheetId,
                    gridProperties: {
                      rowCount: currentConfig.gridProperties.rowCount,
                      columnCount: requiredColumns,
                    },
                  },
                  fields: "gridProperties.columnCount",
                },
              },
            ],
          },
        });
      }

      // Place chart data in columns T and U (now that we've expanded the grid)
      const chartDataStartRow = 1;
      const chartDataEndRow = chartDataStartRow + expenseData.length - 1;
      const chartDataStartCol = 19; // Column T (0-based, so 19 = T)
      const chartDataEndCol = 20; // Column U (0-based, so 20 = U)
      const chartDataRange = `T${chartDataStartRow}:U${chartDataEndRow}`;

      // Write chart data to the sheet (in far right columns T-U)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${chartDataRange}`,
        valueInputOption: "RAW",
        requestBody: {
          values: expenseData,
        },
      });

      // Create pie chart specification
      const chartSpec = {
        title: `Expense Comparison ${selectedYear}`,
        pieChart: {
          domain: {
            sourceRange: {
              sources: [
                {
                  sheetId: sheetId,
                  startRowIndex: chartDataStartRow - 1,
                  endRowIndex: chartDataEndRow,
                  startColumnIndex: chartDataStartCol,
                  endColumnIndex: chartDataStartCol + 1,
                },
              ],
            },
          },
          series: {
            sourceRange: {
              sources: [
                {
                  sheetId: sheetId,
                  startRowIndex: chartDataStartRow - 1,
                  endRowIndex: chartDataEndRow,
                  startColumnIndex: chartDataEndCol,
                  endColumnIndex: chartDataEndCol + 1,
                },
              ],
            },
          },
          pieHole: 0.2, // Donut chart style
          legendPosition: "RIGHT_LEGEND",
        },
        titleTextFormat: {
          fontSize: 16,
          bold: true,
        },
        backgroundColor: {
          red: 1.0,
          green: 1.0,
          blue: 1.0,
        },
      };

      // Position the chart in the left space area
      const requests = [
        {
          addChart: {
            chart: {
              spec: chartSpec,
              position: {
                overlayPosition: {
                  anchorCell: {
                    sheetId: sheetId,
                    rowIndex: 0, // Start from top
                    columnIndex: 0, // Start from left
                  },
                  offsetXPixels: 20,
                  offsetYPixels: 20,
                  widthPixels: 400,
                  heightPixels: 300,
                },
              },
            },
          },
        },
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests },
      });

      // Don't clear the chart data - it needs to stay for the chart to work!
      // The data is now placed in columns T-U which are outside the visible dashboard area

      console.log("Expense comparison pie chart created successfully");
      console.log(`Chart data placed in range: ${sheetName}!${chartDataRange}`);
    } catch (error) {
      console.error("Error creating expense comparison pie chart:", error);
      throw error;
    }
  }

  async removeExistingCharts(sheetId: number) {
    try {
      // Get the spreadsheet to find existing charts
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = spreadsheet.data.sheets.find(
        (s: any) => s.properties.sheetId === sheetId
      );

      if (sheet && sheet.charts && sheet.charts.length > 0) {
        const deleteRequests = sheet.charts.map((chart: any) => ({
          deleteEmbeddedObject: {
            objectId: chart.chartId,
          },
        }));

        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: { requests: deleteRequests },
        });

        console.log(`Removed ${sheet.charts.length} existing charts`);
      }
    } catch (error) {
      console.error("Error removing existing charts:", error);
      // Don't throw error, just log it as this is cleanup
    }
  }

  async getExpenseDataByCategory(year: number): Promise<(string | number)[][]> {
    try {
      const billsSheetName = SheetsConfig.getSheetName("bills", { year });

      // Get all bills data for the year
      const billsData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${billsSheetName}!A2:G1000`, // ID, Date, Title, Amount, Currency, Category, Transaction Type
      });

      const rows = billsData.data.values || [];

      // Group expenses by category
      const expensesByCategory: { [category: string]: number } = {};

      rows.forEach((row: any[]) => {
        const transactionType = row[6]; // Transaction Type column
        const category = row[5]; // Category column
        const amount = parseFloat(row[3]) || 0; // Amount column

        // Only include expense transactions
        if (
          transactionType &&
          transactionType.toLowerCase() === "expense" &&
          category &&
          amount > 0
        ) {
          if (!expensesByCategory[category]) {
            expensesByCategory[category] = 0;
          }
          expensesByCategory[category] += amount;
        }
      });

      // Convert to array format for chart: [Category, Amount]
      // Let Google Sheets handle percentage calculations dynamically
      const chartData: (string | number)[][] = [];
      Object.entries(expensesByCategory).forEach(([category, amount]) => {
        chartData.push([category, amount]); // Simple category names, Google Sheets will calculate percentages
      });

      // Sort by amount (descending) for better visualization
      chartData.sort((a, b) => (b[1] as number) - (a[1] as number));

      console.log(
        `Found ${chartData.length} expense categories with data:`,
        chartData
      );
      return chartData;
    } catch (error) {
      console.error("Error getting expense data by category:", error);
      return [];
    }
  }

  /**
   * Run the configure method for a specific section
   */
  async runSectionConfigure(
    sheetKey: string,
    sectionId: string
  ): Promise<void> {
    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable not set");
    }

    const section = SheetsConfig.getSectionById(sheetKey, sectionId);
    if (!section || !section.configure) {
      console.log(
        `Section ${sectionId} in sheet ${sheetKey} has no configure method`
      );
      return;
    }

    const sheetName = SheetsConfig.getSheetName(sheetKey);
    const allSections = SheetsConfig.getAllSections(sheetKey);

    // Create context for the section configure method
    const context: SectionConfigureContext = {
      sheetName,
      spreadsheetId: this.spreadsheetId,
      sheetsApi: this.sheets,
      allSections,
      limits: SheetsConfig.LIMITS,
      getSheetConfig: (key: string) => SheetsConfig.SHEETS[key],
      getSection: (key: string, id: string) =>
        SheetsConfig.getSectionById(key, id),
      columnToNumber: SheetsConfig.columnToNumber,
      numberToColumn: SheetsConfig.numberToColumn,
    };

    try {
      await section.configure(context);
      console.log(`Section ${sectionId} configured successfully`);
    } catch (error) {
      console.error(`Error configuring section ${sectionId}:`, error);
      throw error;
    }
  }

  async setupAccountBalancesWithFormulas() {
    // Legacy method - now delegates to section configure
    await this.runSectionConfigure("dashboard", "account_balances");
  }

  async getSelectedYear(): Promise<number> {
    const sheetName = SheetsConfig.getSheetName("dashboard");
    try {
      // Get the configuration section and calculate its position
      const config = SheetsConfig.SHEETS.dashboard;
      if (!config.grid) {
        return new Date().getFullYear();
      }

      await SheetsConfig.calculateSectionPositions(config.grid);
      const configSection = SheetsConfig.getSectionById(
        "dashboard",
        "configuration"
      );
      if (!configSection || !configSection._calculated) {
        return new Date().getFullYear();
      }

      // Calculate the dynamic address for the year value
      const configStartCol = SheetsConfig.columnToNumber(
        configSection._calculated.startColumn
      );
      const valueFieldIndex = configSection.table.fields.findIndex(
        (field) => field.name === "Value"
      );
      const yearValueColumn = SheetsConfig.numberToColumn(
        configStartCol + valueFieldIndex
      );
      const yearValueRow = configSection._calculated.startRow + 2; // After title and headers, first data row

      const yearValueCell = `${yearValueColumn}${yearValueRow}`;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${yearValueCell}`,
      });

      const year = response.data.values?.[0]?.[0];
      return year ? parseInt(year) : new Date().getFullYear();
    } catch (error) {
      return new Date().getFullYear();
    }
  }

  async calculateAccountBalance(accountId: string, year: number) {
    const sheetName = SheetsConfig.getSheetName("bills", { year });

    try {
      // Check if the yearly sheet exists first
      const spreadsheetInfo = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetExists = spreadsheetInfo.data.sheets.some(
        (sheet: any) => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        console.log(`Bills sheet for year ${year} doesn't exist yet`);
        return { income: 0, expenses: 0, transfersIn: 0, balance: 0 };
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:R`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log(`No data found in ${sheetName}`);
        return { income: 0, expenses: 0, transfersIn: 0, balance: 0 };
      }

      const headers = rows[0];
      const accountColumnIndex = headers.findIndex(
        (h: string) => h === "Account"
      );
      const destinationAccountColumnIndex = headers.findIndex(
        (h: string) => h === "Destination Account"
      );
      const amountColumnIndex = headers.findIndex(
        (h: string) => h === "Amount"
      );
      const destinationAmountColumnIndex = headers.findIndex(
        (h: string) => h === "Destination Amount"
      );
      const transactionTypeColumnIndex = headers.findIndex(
        (h: string) => h === "Transaction Type"
      );

      if (
        accountColumnIndex === -1 ||
        amountColumnIndex === -1 ||
        transactionTypeColumnIndex === -1
      ) {
        console.log(`Required columns not found in ${sheetName}`);
        return { income: 0, expenses: 0, transfersIn: 0, balance: 0 };
      }

      let income = 0;
      let expenses = 0;
      let transfersIn = 0;
      let transactionCount = 0;

      // Process each transaction
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const account = row[accountColumnIndex]?.toString().trim();
        const destinationAccount = row[destinationAccountColumnIndex]
          ?.toString()
          .trim();
        const amount = parseFloat(row[amountColumnIndex]) || 0;
        const destinationAmount =
          parseFloat(row[destinationAmountColumnIndex]) || amount;
        const transactionType = row[transactionTypeColumnIndex]
          ?.toString()
          .toLowerCase()
          .trim();

        // Skip if no amount or invalid transaction
        if (!amount || !account || !transactionType) continue;

        // Money going out of this account
        if (account === accountId) {
          transactionCount++;
          if (transactionType === "income") {
            income += amount;
          } else if (transactionType === "expense") {
            expenses += amount;
          } else if (transactionType === "transfer") {
            // Transfer out counted as expense
            expenses += amount;
          }
        }

        // Money coming into this account (transfers)
        if (
          destinationAccount === accountId &&
          transactionType === "transfer"
        ) {
          transfersIn += destinationAmount;
        }
      }

      const balance = income + transfersIn - expenses;

      console.log(
        `Account ${accountId}: ${transactionCount} transactions, Income: ${income}, Expenses: ${expenses}, Transfers In: ${transfersIn}, Balance: ${balance}`
      );

      return {
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        transfersIn: Math.round(transfersIn * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      };
    } catch (error) {
      console.error(
        `Error calculating balance for account ${accountId}:`,
        error
      );
      return { income: 0, expenses: 0, transfersIn: 0, balance: 0 };
    }
  }

  async updateDashboard() {
    try {
      // With formula-based calculations, the dashboard updates automatically
      // We can just re-setup the account balances using section configure method
      await this.runSectionConfigure("dashboard", "account_balances");

      // Re-setup monthly expenses using section configure method
      await this.runSectionConfigure("dashboard", "monthly_expenses");

      // Recreate expense comparison pie chart with updated data
      await this.createExpenseComparisonPieChart();

      console.log("Dashboard data and charts updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Error updating dashboard:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Refresh the expense comparison pie chart with the latest data
   * This can be called independently when expense data changes
   */
  async refreshExpenseChart() {
    try {
      await this.createExpenseComparisonPieChart();
      console.log("Expense comparison pie chart refreshed successfully");
      return { success: true };
    } catch (error) {
      console.error("Error refreshing expense chart:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
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
      return rows
        .filter((row: any[]) => row && row.length > 0 && row[1]) // Filter out empty rows and ensure ID exists
        .map((row: any[]) => ({
          number: parseInt(row[0]) || 0, // Number column
          id: row[1] || "",
          name: row[2] || "",
          emoji: row[3] || "📋",
          description: row[4] || "",
        }));
    } catch (error) {
      console.error("Error getting categories from Google Sheets:", error);
      // Fallback to default categories
      return [
        {
          number: 1,
          id: "food",
          name: "Food",
          emoji: "🍕",
          description: "Restaurants, groceries, takeout",
        },
        {
          number: 2,
          id: "transport",
          name: "Transport",
          emoji: "🚗",
          description: "Gas, public transit, rideshare",
        },
        {
          number: 3,
          id: "other",
          name: "Other",
          emoji: "📋",
          description: "Miscellaneous expenses",
        },
      ];
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

      // Filter and deduplicate accounts based on ID
      const uniqueAccountIds = new Set();
      const filteredRows = rows.filter((row: any[]) => {
        if (!row || row.length === 0 || !row[1]) return false; // Must have ID

        const accountId = row[1].toString().trim();
        if (uniqueAccountIds.has(accountId)) {
          console.warn(`Duplicate account ID found: ${accountId}, skipping`);
          return false; // Skip duplicates
        }

        uniqueAccountIds.add(accountId);
        return true;
      });

      return filteredRows.map((row: any[]) => ({
        number: parseInt(row[0]) || 0, // Number column
        id: row[1] || "",
        name: row[2] || "",
        emoji: row[3] || "💳",
        currency: (row[4] || "USD").toString().toUpperCase(),
        description: row[5] || "",
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
      return rows
        .filter((row: any[]) => row && row.length > 0 && row[1]) // Filter out empty rows and ensure ID exists
        .map((row: any[]) => ({
          number: parseInt(row[0]) || 0, // Number column
          id: row[1] || "",
          name: row[2] || "",
          emoji: row[3] || "💼",
          description: row[4] || "",
        }));
    } catch (error) {
      console.error("Error getting income sources from Google Sheets:", error);
      // Fallback to default income sources
      return [
        {
          number: 1,
          id: "salary",
          name: "Salary",
          emoji: "💼",
          description: "Monthly salary income",
        },
        {
          number: 2,
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
      // Return first account ID or "none" if no accounts exist
      return accounts.length > 0 ? accounts[0].id : "none";
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

      // Get current accounts to find the next available row in accounts section (G3:L)
      const currentData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Reference!G3:L",
      });

      const rows = currentData.data.values || [];

      // Check if we've reached the limit
      if (rows.length >= SheetsConfig.LIMITS.MAX_ACCOUNTS) {
        throw new Error(
          `Maximum number of accounts (${SheetsConfig.LIMITS.MAX_ACCOUNTS}) reached`
        );
      }

      const nextRow = 3 + rows.length; // Start from row 3 (after section title and headers)
      const accountNumber = rows.length + 1; // Next number in sequence

      // Append the new account to accounts section (starting at column G)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Reference!G${nextRow}:L${nextRow}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [accountNumber, id, name, emoji, normalizedCurrency, description],
          ],
        },
      });

      console.log(
        `Successfully created account #${accountNumber}: ${name} (${normalizedCurrency})`
      );
      return {
        success: true,
        id,
        name,
        currency: normalizedCurrency,
        number: accountNumber,
      };
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

      // Get current categories to find the next available row in categories section (A3:E)
      const currentData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Reference!A3:E",
      });

      const rows = currentData.data.values || [];

      // Check if we've reached the limit
      if (rows.length >= SheetsConfig.LIMITS.MAX_CATEGORIES) {
        throw new Error(
          `Maximum number of categories (${SheetsConfig.LIMITS.MAX_CATEGORIES}) reached`
        );
      }

      const nextRow = 3 + rows.length; // Start from row 3 (after section title and headers)
      const categoryNumber = rows.length + 1; // Next number in sequence

      // Append the new category to categories section (starting at column A)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Reference!A${nextRow}:E${nextRow}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[categoryNumber, id, name, emoji, description]],
        },
      });

      console.log(`Successfully created category #${categoryNumber}: ${name}`);
      return { success: true, id, name, number: categoryNumber };
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

      // Refresh expense chart after adding new bill
      try {
        await this.refreshExpenseChart();
      } catch (chartError) {
        console.error(
          "Error refreshing expense chart after bill submission:",
          chartError
        );
        // Don't fail the whole operation if chart refresh fails
      }

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

      // Refresh expense chart after updating bill
      try {
        await this.refreshExpenseChart();
      } catch (chartError) {
        console.error(
          "Error refreshing expense chart after bill update:",
          chartError
        );
        // Don't fail the whole operation if chart refresh fails
      }

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
