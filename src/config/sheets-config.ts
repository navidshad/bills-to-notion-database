export interface SheetField {
  name: string;
  type: "string" | "number" | "date" | "currency" | "json" | "boolean";
  required?: boolean;
  default?: any;
  validation?: (value: any) => boolean;
}

export interface SectionTable {
  fields: SheetField[];
  maxRows?: number; // undefined = unlimited
  hasHeaders?: boolean; // default: true
  defaultData?: any[][]; // default data to populate
}

export interface SectionSpacing {
  top?: number; // empty rows above
  bottom?: number; // empty rows below
  left?: number; // empty columns to the left
  right?: number; // empty columns to the right
}

export interface SectionMerging {
  colspan?: number; // merge columns (horizontal span)
  rowspan?: number; // merge rows (vertical span)
}

// Interface for section configuration context
export interface SectionConfigureContext {
  sheetName: string;
  spreadsheetId: string;
  sheetsApi: any; // Google Sheets API instance
  allSections: SheetSection[]; // All sections in the current sheet
  limits: typeof SheetsConfig.LIMITS;
  getSheetConfig: (sheetKey: string) => SheetConfiguration | undefined;
  getSection: (sheetKey: string, sectionId: string) => SheetSection | undefined;
  columnToNumber: (column: string) => number;
  numberToColumn: (num: number) => string;
}

export interface SheetSection {
  id: string; // unique identifier
  title: string;
  table: SectionTable;
  color: {
    title: { red: number; green: number; blue: number }; // Section title background
    header: { red: number; green: number; blue: number }; // Column headers background
    border: { red: number; green: number; blue: number }; // Section outline border color
    data?: { red: number; green: number; blue: number }; // Optional data area background (defaults to white)
  };
  spacing?: SectionSpacing;
  merging?: SectionMerging;
  // New: Configure method for section-specific setup logic
  configure?: (context: SectionConfigureContext) => Promise<void>;
  // These will be calculated automatically based on grid position
  _calculated?: {
    startColumn: string;
    endColumn: string;
    startRow: number;
    endRow: number;
  };
}

export interface SheetGrid {
  sections: (SheetSection | null)[][]; // 2D array, null for empty cells
  gridSettings: {
    defaultSectionWidth: number; // default columns per section
    defaultSectionHeight: number; // default rows per section
    sectionSpacing: {
      horizontal: number; // default spacing between sections horizontally
      vertical: number; // default spacing between sections vertically
    };
  };
}

export interface SheetConfiguration {
  name: string;
  gridProperties: {
    rowCount: number;
    columnCount: number;
  };
  // For simple field-based sheets (legacy support)
  fields?: SheetField[];
  // For complex grid-based sheets (new system)
  grid?: SheetGrid;
}

export class SheetsConfig {
  // Configuration limits
  static readonly LIMITS = {
    MAX_ACCOUNTS: 10,
    MAX_CATEGORIES: 25,
    MAX_INCOME_SOURCES: 25,
  };

  // Sheet configurations
  static readonly SHEETS: Record<string, SheetConfiguration> = {
    bills: {
      name: "Bills_{year}",
      gridProperties: {
        rowCount: 1000,
        columnCount: 20,
      },
      fields: [
        { name: "ID", type: "number", required: true },
        { name: "Date", type: "date", required: true },
        { name: "Title/Description", type: "string", required: true },
        { name: "Amount", type: "number", required: true },
        { name: "Currency", type: "currency", required: true, default: "USD" },
        { name: "Category", type: "string", required: true },
        {
          name: "Transaction Type",
          type: "string",
          required: true,
          default: "Expense",
        },
        { name: "Account", type: "string", required: true },
        { name: "Destination Account", type: "string" },
        { name: "Destination Amount", type: "number" },
        { name: "Destination Currency", type: "currency" },
        { name: "Exchange Rate", type: "number" },
        { name: "Fee", type: "number" },
        { name: "Payment Method", type: "string" },
        { name: "Tags", type: "string" },
        { name: "Notes", type: "string" },
        { name: "Created At", type: "date", required: true },
        { name: "Updated At", type: "date", required: true },
      ],
    },
    tempBills: {
      name: "TempBills",
      gridProperties: {
        rowCount: 100,
        columnCount: 15,
      },
      fields: [
        { name: "bill_id", type: "number", required: true },
        { name: "user_id", type: "string", required: true },
        { name: "transaction_data", type: "json", required: true },
        { name: "guide_message_ids", type: "json", default: "[]" },
        { name: "user_input_message_id", type: "number" },
        { name: "original_message_id", type: "number", required: true },
        { name: "created_at", type: "date", required: true },
        { name: "updated_at", type: "date", required: true },
      ],
    },
    reference: {
      name: "Reference",
      gridProperties: {
        rowCount: 50,
        columnCount: 20,
      },
      grid: {
        sections: [
          [
            // First row: Categories and Accounts
            {
              id: "categories",
              title: "📂 CATEGORIES",
              table: {
                fields: [
                  { name: "#", type: "number", required: true },
                  { name: "ID", type: "string", required: true },
                  { name: "Name", type: "string", required: true },
                  { name: "Emoji", type: "string", default: "📋" },
                  { name: "Description", type: "string" },
                ],
                maxRows: 25,
                hasHeaders: true,
                defaultData: [
                  [1, "food", "Food", "🍕", "Restaurants, groceries, takeout"],
                  [
                    2,
                    "transport",
                    "Transport",
                    "🚗",
                    "Gas, public transit, rideshare",
                  ],
                  [
                    3,
                    "shopping",
                    "Shopping",
                    "👕",
                    "Clothes, electronics, general purchases",
                  ],
                  [
                    4,
                    "utilities",
                    "Utilities",
                    "💡",
                    "Electricity, water, internet, phone",
                  ],
                  [
                    5,
                    "healthcare",
                    "Healthcare",
                    "🏥",
                    "Medical bills, pharmacy, insurance",
                  ],
                  [
                    6,
                    "entertainment",
                    "Entertainment",
                    "🎬",
                    "Movies, games, subscriptions",
                  ],
                  [
                    7,
                    "housing",
                    "Housing",
                    "🏠",
                    "Rent, mortgage, maintenance",
                  ],
                  [
                    8,
                    "education",
                    "Education",
                    "📚",
                    "Books, courses, tuition",
                  ],
                  [9, "other", "Other", "📋", "Miscellaneous expenses"],
                ],
              },
              color: {
                title: { red: 0.85, green: 0.92, blue: 1 },
                header: { red: 0.9, green: 0.95, blue: 1 },
                border: { red: 0.2, green: 0.4, blue: 0.8 },
              },
            },
            {
              id: "accounts",
              title: "💳 ACCOUNTS",
              table: {
                fields: [
                  { name: "#", type: "number", required: true },
                  { name: "ID", type: "string", required: true },
                  { name: "Name", type: "string", required: true },
                  { name: "Emoji", type: "string", default: "💳" },
                  {
                    name: "Currency",
                    type: "currency",
                    required: true,
                    default: "USD",
                  },
                  { name: "Description", type: "string" },
                ],
                maxRows: 10,
                hasHeaders: true,
                defaultData: [
                  [
                    1,
                    "main_card",
                    "Main Card",
                    "💳",
                    "USD",
                    "Primary debit/credit card",
                  ],
                  [
                    2,
                    "checking",
                    "Checking",
                    "🏦",
                    "USD",
                    "Main checking account",
                  ],
                  [
                    3,
                    "euro_card",
                    "Euro Card",
                    "💳",
                    "EUR",
                    "European debit/credit card",
                  ],
                  [
                    4,
                    "euro_cash",
                    "Euro Cash",
                    "💰",
                    "EUR",
                    "Physical euro cash",
                  ],
                ],
              },
              color: {
                title: { red: 0.85, green: 1, blue: 0.85 },
                header: { red: 0.9, green: 1, blue: 0.9 },
                border: { red: 0.2, green: 0.6, blue: 0.2 },
              },
            },
            // Second row: Income Sources (spans across)
            {
              id: "income_sources",
              title: "💰 INCOME SOURCES",
              table: {
                fields: [
                  { name: "#", type: "number", required: true },
                  { name: "ID", type: "string", required: true },
                  { name: "Name", type: "string", required: true },
                  { name: "Emoji", type: "string", default: "💼" },
                  { name: "Description", type: "string" },
                ],
                maxRows: 25,
                hasHeaders: true,
                defaultData: [
                  [1, "salary", "Salary", "💼", "Monthly salary income"],
                  [2, "freelance", "Freelance", "💻", "Freelance work income"],
                  [3, "bonus", "Bonus", "🎁", "Performance bonus"],
                  [4, "investment", "Investment", "📈", "Investment returns"],
                  [5, "rental", "Rental", "🏠", "Rental property income"],
                  [6, "business", "Business", "🏢", "Business income"],
                  [7, "gift", "Gift", "🎁", "Gift money received"],
                  [8, "refund", "Refund", "↩️", "Refund from purchase"],
                  [9, "other_income", "Other", "📋", "Other income sources"],
                ],
              },
              color: {
                title: { red: 1, green: 0.9, blue: 0.7 },
                header: { red: 1, green: 0.95, blue: 0.85 },
                border: { red: 0.8, green: 0.5, blue: 0.2 },
              },
            },
          ],
        ],
        gridSettings: {
          defaultSectionWidth: 5, // 5 columns per section by default
          defaultSectionHeight: 30, // 30 rows per section by default
          sectionSpacing: {
            horizontal: 1, // 1 column between sections
            vertical: 2, // 2 rows between sections
          },
        },
      },
    },
    config: {
      name: "Config",
      gridProperties: {
        rowCount: 50,
        columnCount: 3,
      },
      fields: [
        { name: "Setting", type: "string", required: true },
        { name: "Value", type: "string", required: true },
        { name: "Description", type: "string" },
      ],
    },
    dashboard: {
      name: "Dashboard",
      gridProperties: {
        rowCount: 100,
        columnCount: 15,
      },
      grid: {
        sections: [
          [
            // First row: Configuration section
            {
              id: "configuration",
              title: "⚙️ CONFIGURATION",
              table: {
                fields: [
                  { name: "Setting", type: "string", required: true },
                  { name: "Value", type: "string", required: true },
                  { name: "Description", type: "string" },
                ],
                maxRows: 2,
                hasHeaders: true,
                defaultData: [
                  [
                    "Year",
                    new Date().getFullYear().toString(),
                    "Selected year for analysis",
                  ],
                ],
              },
              color: {
                title: { red: 0.9, green: 0.85, blue: 1 },
                header: { red: 0.95, green: 0.9, blue: 1 },
                border: { red: 0.5, green: 0.2, blue: 0.8 },
              },
            },
          ],
          [
            // Second row: Account Balances section
            {
              id: "account_balances",
              title: "💰 ACCOUNT BALANCES",
              table: {
                fields: [
                  { name: "Account", type: "string", required: true },
                  { name: "Currency", type: "currency", required: true },
                  { name: "Balance", type: "number" },
                ],
                maxRows: this.LIMITS.MAX_ACCOUNTS, // limited to max accounts
                hasHeaders: true,
              },
              color: {
                title: { red: 0.7, green: 0.95, blue: 0.7 },
                header: { red: 0.8, green: 0.98, blue: 0.8 },
                border: { red: 0.1, green: 0.7, blue: 0.1 },
              },
              configure: async (context: SectionConfigureContext) => {
                // Account Balances configuration logic
                await SheetsConfig.configureAccountBalances(context);
              },
            },
          ],
          [
            // Third row: Monthly Expenses by Category section
            {
              id: "monthly_expenses",
              title: "📊 MONTHLY EXPENSES BY CATEGORY",
              table: {
                fields: [
                  { name: "Setting", type: "string", required: true },
                  { name: "Value", type: "string", required: true },
                  { name: "Description", type: "string" },
                ],
                maxRows: this.LIMITS.MAX_CATEGORIES + 2, // categories + month selector + header spacer
                hasHeaders: true,
                defaultData: [
                  [
                    "Month",
                    (new Date().getMonth() + 1).toString(),
                    "Selected month for analysis (1-12)",
                  ],
                  ["", "", ""], // Spacer row
                  ["Category", "Amount", "Percentage"], // Expenses header
                ],
              },
              color: {
                title: { red: 1, green: 0.9, blue: 0.7 },
                header: { red: 1, green: 0.95, blue: 0.85 },
                border: { red: 0.8, green: 0.5, blue: 0.2 },
              },
              spacing: {
                top: 1, // Add some spacing above this section
              },
              configure: async (context: SectionConfigureContext) => {
                // Monthly Expenses configuration logic
                await SheetsConfig.configureMonthlyExpenses(context);
              },
            },
          ],
        ],
        gridSettings: {
          defaultSectionWidth: 3, // 3 columns per section by default
          defaultSectionHeight: 20, // 20 rows per section by default
          sectionSpacing: {
            horizontal: 1, // 1 column between sections
            vertical: 1, // 1 row between sections
          },
        },
      },
    },
  };

  // Default data for compatibility (keeping legacy support)
  static readonly DEFAULT_DATA = {
    categories: [
      [1, "food", "Food", "🍕", "Restaurants, groceries, takeout"],
      [2, "transport", "Transport", "🚗", "Gas, public transit, rideshare"],
      [
        3,
        "shopping",
        "Shopping",
        "👕",
        "Clothes, electronics, general purchases",
      ],
      [
        4,
        "utilities",
        "Utilities",
        "💡",
        "Electricity, water, internet, phone",
      ],
      [
        5,
        "healthcare",
        "Healthcare",
        "🏥",
        "Medical bills, pharmacy, insurance",
      ],
      [
        6,
        "entertainment",
        "Entertainment",
        "🎬",
        "Movies, games, subscriptions",
      ],
      [7, "housing", "Housing", "🏠", "Rent, mortgage, maintenance"],
      [8, "education", "Education", "📚", "Books, courses, tuition"],
      [9, "other", "Other", "📋", "Miscellaneous expenses"],
    ],
    accounts: [
      [1, "main_card", "Main Card", "💳", "USD", "Primary debit/credit card"],
      [2, "checking", "Checking", "🏦", "USD", "Main checking account"],
      [3, "euro_card", "Euro Card", "💳", "EUR", "European debit/credit card"],
      [4, "euro_cash", "Euro Cash", "💰", "EUR", "Physical euro cash"],
    ],
    incomeSources: [
      [1, "salary", "Salary", "💼", "Monthly salary income"],
      [2, "freelance", "Freelance", "💻", "Freelance work income"],
      [3, "bonus", "Bonus", "🎁", "Performance bonus"],
      [4, "investment", "Investment", "📈", "Investment returns"],
      [5, "rental", "Rental", "🏠", "Rental property income"],
      [6, "business", "Business", "🏢", "Business income"],
      [7, "gift", "Gift", "🎁", "Gift money received"],
      [8, "refund", "Refund", "↩️", "Refund from purchase"],
      [9, "other_income", "Other", "📋", "Other income sources"],
    ],
    config: [
      ["Setting", "Value", "Description"],
      ["timezone", "UTC", "Default timezone"],
      ["date_format", "YYYY-MM-DD", "Date format preference"],
    ],
    dashboard: {
      configuration: [
        [
          "Year",
          new Date().getFullYear().toString(),
          "Selected year for analysis",
        ],
      ],
    },
  };

  // Helper methods for coordinate calculations
  static columnToNumber(column: string): number {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - "A".charCodeAt(0) + 1);
    }
    return result;
  }

  static numberToColumn(num: number): string {
    let result = "";
    while (num > 0) {
      num--;
      result = String.fromCharCode("A".charCodeAt(0) + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  static getRange(
    startColumn: string,
    startRow: number,
    endColumn: string,
    endRow: number
  ): string {
    return `${startColumn}${startRow}:${endColumn}${endRow}`;
  }

  // Calculate section positions in the grid
  static calculateSectionPositions(grid: SheetGrid): void {
    const { sections, gridSettings } = grid;
    let currentRow = 1;

    for (let rowIndex = 0; rowIndex < sections.length; rowIndex++) {
      const sectionRow = sections[rowIndex];
      let currentColumn = 1;
      let maxRowsInThisGridRow = 0;

      for (let colIndex = 0; colIndex < sectionRow.length; colIndex++) {
        const section = sectionRow[colIndex];
        if (!section) {
          currentColumn +=
            gridSettings.defaultSectionWidth +
            gridSettings.sectionSpacing.horizontal;
          continue;
        }

        // Apply spacing
        const leftSpacing = section.spacing?.left || 0;
        const rightSpacing = section.spacing?.right || 0;
        const topSpacing = section.spacing?.top || 0;
        const bottomSpacing = section.spacing?.bottom || 0;

        // Calculate section dimensions
        const colspan = section.merging?.colspan || 1;
        const rowspan = section.merging?.rowspan || 1;

        // For sections with colspan, calculate actual grid space it occupies
        const totalGridWidth = gridSettings.defaultSectionWidth * colspan;

        // Section should span exactly its field count, not the grid width
        const effectiveWidth = section.table.fields.length;

        // Calculate max rows for this section
        const headerRows = section.table.hasHeaders !== false ? 1 : 0;
        const titleRows = 1;
        const dataRows =
          section.table.maxRows || gridSettings.defaultSectionHeight;
        const totalSectionRows =
          titleRows + headerRows + dataRows + topSpacing + bottomSpacing;

        // Track max rows in this grid row
        maxRowsInThisGridRow = Math.max(maxRowsInThisGridRow, totalSectionRows);

        // Calculate positions
        const startColumn = this.numberToColumn(currentColumn + leftSpacing);
        const endColumn = this.numberToColumn(
          currentColumn + leftSpacing + effectiveWidth - 1
        );
        const startRow = currentRow + topSpacing;
        const endRow = startRow + titleRows + headerRows + dataRows - 1;

        // Store calculated positions
        section._calculated = {
          startColumn,
          endColumn,
          startRow,
          endRow,
        };

        // Move to next column position
        // Advance by the actual width of the section (field count)
        currentColumn +=
          effectiveWidth +
          leftSpacing +
          rightSpacing +
          gridSettings.sectionSpacing.horizontal;
      }

      // Move to next row
      currentRow += maxRowsInThisGridRow + gridSettings.sectionSpacing.vertical;
    }
  }

  // Get section by ID from any sheet
  static getSectionById(
    sheetKey: string,
    sectionId: string
  ): SheetSection | undefined {
    const sheet = this.SHEETS[sheetKey];
    if (!sheet?.grid) return undefined;

    for (const sectionRow of sheet.grid.sections) {
      for (const section of sectionRow) {
        if (section && section.id === sectionId) {
          return section;
        }
      }
    }
    return undefined;
  }

  // Get all sections from a sheet
  static getAllSections(sheetKey: string): SheetSection[] {
    const sheet = this.SHEETS[sheetKey];
    if (!sheet?.grid) return [];

    const allSections: SheetSection[] = [];
    for (const sectionRow of sheet.grid.sections) {
      for (const section of sectionRow) {
        if (section) {
          allSections.push(section);
        }
      }
    }
    return allSections;
  }

  // Legacy compatibility methods
  static getSectionHeaderRange(section: SheetSection, row: number): string {
    if (!section._calculated) {
      throw new Error(
        "Section positions not calculated. Call calculateSectionPositions first."
      );
    }
    return this.getRange(
      section._calculated.startColumn,
      row,
      section._calculated.endColumn,
      row
    );
  }

  static getSectionDataRange(section: SheetSection, startRow: number): string {
    if (!section._calculated) {
      throw new Error(
        "Section positions not calculated. Call calculateSectionPositions first."
      );
    }
    return `${section._calculated.startColumn}${startRow}:${section._calculated.endColumn}`;
  }

  static getHeadersRange(sheetConfig: SheetConfiguration): string {
    const endColumn = this.numberToColumn(sheetConfig.fields?.length || 1);
    return this.getRange("A", 1, endColumn, 1);
  }

  static getDataRange(
    sheetConfig: SheetConfiguration,
    startRow: number = 2
  ): string {
    const endColumn = this.numberToColumn(sheetConfig.fields?.length || 1);
    return `A${startRow}:${endColumn}`;
  }

  // Get sheet name with dynamic values
  static getSheetName(
    sheetKey: string,
    variables: Record<string, any> = {}
  ): string {
    let name = this.SHEETS[sheetKey]?.name || sheetKey;

    // Replace variables in sheet name
    Object.entries(variables).forEach(([key, value]) => {
      name = name.replace(`{${key}}`, value.toString());
    });

    return name;
  }

  // Get field headers for a sheet (legacy support)
  static getFieldHeaders(sheetKey: string): string[] {
    const sheet = this.SHEETS[sheetKey];
    if (!sheet) {
      throw new Error(`Sheet configuration "${sheetKey}" not found`);
    }

    if (sheet.fields) {
      return sheet.fields.map((field) => field.name);
    }

    if (sheet.grid) {
      // For grid-based sheets, return all field names from all sections
      const allSections = this.getAllSections(sheetKey);
      return allSections.flatMap((section) =>
        section.table.fields.map((field) => field.name)
      );
    }

    return [];
  }

  // Legacy compatibility - get section by title
  static getSection(
    sheetKey: string,
    sectionTitle: string
  ): SheetSection | undefined {
    const sheet = this.SHEETS[sheetKey];
    if (!sheet?.grid) return undefined;

    for (const sectionRow of sheet.grid.sections) {
      for (const section of sectionRow) {
        if (section && section.title === sectionTitle) {
          return section;
        }
      }
    }
    return undefined;
  }

  // Get field configuration
  static getField(sheetKey: string, fieldName: string): SheetField | undefined {
    const sheet = this.SHEETS[sheetKey];

    if (sheet?.fields) {
      return sheet.fields.find((field) => field.name === fieldName);
    }

    if (sheet?.grid) {
      const allSections = this.getAllSections(sheetKey);
      for (const section of allSections) {
        const field = section.table.fields.find(
          (field) => field.name === fieldName
        );
        if (field) return field;
      }
    }

    return undefined;
  }

  // Validate sheet data against configuration
  static validateData(
    sheetKey: string,
    data: any[]
  ): { isValid: boolean; errors: string[] } {
    const sheet = this.SHEETS[sheetKey];
    if (!sheet) {
      return {
        isValid: false,
        errors: [`Sheet configuration "${sheetKey}" not found`],
      };
    }

    const errors: string[] = [];
    const fields = sheet.fields || [];

    data.forEach((row, rowIndex) => {
      fields.forEach((field, fieldIndex) => {
        const value = row[fieldIndex];

        // Check required fields
        if (
          field.required &&
          (value === undefined || value === null || value === "")
        ) {
          errors.push(`Row ${rowIndex + 1}: Field "${field.name}" is required`);
        }

        // Type validation
        if (value !== undefined && value !== null && value !== "") {
          if (field.type === "number" && isNaN(Number(value))) {
            errors.push(
              `Row ${rowIndex + 1}: Field "${field.name}" must be a number`
            );
          }

          if (field.type === "date" && isNaN(Date.parse(value))) {
            errors.push(
              `Row ${rowIndex + 1}: Field "${field.name}" must be a valid date`
            );
          }

          if (field.type === "json") {
            try {
              JSON.parse(value);
            } catch {
              errors.push(
                `Row ${rowIndex + 1}: Field "${field.name}" must be valid JSON`
              );
            }
          }
        }

        // Custom validation
        if (field.validation && !field.validation(value)) {
          errors.push(
            `Row ${rowIndex + 1}: Field "${
              field.name
            }" failed custom validation`
          );
        }
      });
    });

    return { isValid: errors.length === 0, errors };
  }

  // Get default value for a field
  static getFieldDefault(sheetKey: string, fieldName: string): any {
    const field = this.getField(sheetKey, fieldName);
    return field?.default;
  }

  // Generate template row with default values
  static generateTemplateRow(
    sheetKey: string,
    overrides: Record<string, any> = {}
  ): any[] {
    const sheet = this.SHEETS[sheetKey];
    if (!sheet?.fields) {
      throw new Error(
        `Sheet configuration "${sheetKey}" not found or has no fields`
      );
    }

    return sheet.fields.map((field) => {
      if (overrides.hasOwnProperty(field.name)) {
        return overrides[field.name];
      }
      return field.default || "";
    });
  }

  /**
   * Configure Account Balances section with dynamic formulas
   */
  static async configureAccountBalances(
    context: SectionConfigureContext
  ): Promise<void> {
    const balanceSection = context.getSection("dashboard", "account_balances");
    if (!balanceSection || !balanceSection._calculated) {
      console.warn("Account balances section not found or not calculated");
      return;
    }

    // Get the configuration section for the year value location
    const configSection = context.getSection("dashboard", "configuration");
    if (!configSection || !configSection._calculated) {
      console.warn("Configuration section not found or not calculated");
      return;
    }

    // Get the reference sheet configuration and calculate positions
    const referenceConfig = context.getSheetConfig("reference");
    if (!referenceConfig?.grid) {
      console.warn("Reference sheet configuration not found");
      return;
    }

    // Calculate positions for reference sheet if not already done
    this.calculateSectionPositions(referenceConfig.grid);

    const accountsSection = context.getSection("reference", "accounts");
    if (!accountsSection || !accountsSection._calculated) {
      console.warn("Accounts section not found in reference sheet");
      return;
    }

    try {
      const maxAccounts = context.limits.MAX_ACCOUNTS;
      console.log(
        `Setting up dynamic formulas for up to ${maxAccounts} accounts from Reference sheet`
      );

      // Clear existing data first
      const dataStartRow = balanceSection._calculated.startRow + 2;
      const clearEndRow = dataStartRow + maxAccounts - 1;
      const clearRange = `${context.sheetName}!${balanceSection._calculated.startColumn}${dataStartRow}:${balanceSection._calculated.endColumn}${clearEndRow}`;

      await context.sheetsApi.spreadsheets.values.clear({
        spreadsheetId: context.spreadsheetId,
        range: clearRange,
      });

      // Calculate dynamic column addresses for the accounts section
      const accountsStartCol = context.columnToNumber(
        accountsSection._calculated.startColumn
      );

      // Field indices within the accounts section
      const accountFields = accountsSection.table.fields;
      const idFieldIndex = accountFields.findIndex(
        (field) => field.name === "ID"
      );
      const nameFieldIndex = accountFields.findIndex(
        (field) => field.name === "Name"
      );
      const emojiFieldIndex = accountFields.findIndex(
        (field) => field.name === "Emoji"
      );
      const currencyFieldIndex = accountFields.findIndex(
        (field) => field.name === "Currency"
      );

      // Calculate actual column letters
      const idColumn = context.numberToColumn(accountsStartCol + idFieldIndex);
      const nameColumn = context.numberToColumn(
        accountsStartCol + nameFieldIndex
      );
      const emojiColumn = context.numberToColumn(
        accountsStartCol + emojiFieldIndex
      );
      const currencyColumn = context.numberToColumn(
        accountsStartCol + currencyFieldIndex
      );

      // Calculate the year value cell location in the configuration section
      const configStartCol = context.columnToNumber(
        configSection._calculated.startColumn
      );
      const valueFieldIndex = configSection.table.fields.findIndex(
        (field) => field.name === "Value"
      );
      const yearValueColumn = context.numberToColumn(
        configStartCol + valueFieldIndex
      );
      const yearValueRow = configSection._calculated.startRow + 2;

      // Get bills sheet field configuration
      const billsConfig = context.getSheetConfig("bills");
      if (!billsConfig?.fields) {
        throw new Error("Bills sheet configuration not found");
      }

      // Find field indices in bills sheet
      const billsFields = billsConfig.fields;
      const amountFieldIndex = billsFields.findIndex(
        (field) => field.name === "Amount"
      );
      const accountFieldIndex = billsFields.findIndex(
        (field) => field.name === "Account"
      );
      const transactionTypeFieldIndex = billsFields.findIndex(
        (field) => field.name === "Transaction Type"
      );
      const destinationAccountFieldIndex = billsFields.findIndex(
        (field) => field.name === "Destination Account"
      );
      const destinationAmountFieldIndex = billsFields.findIndex(
        (field) => field.name === "Destination Amount"
      );

      // Convert to column letters
      const amountColumn = context.numberToColumn(amountFieldIndex + 1);
      const accountColumn = context.numberToColumn(accountFieldIndex + 1);
      const transactionTypeColumn = context.numberToColumn(
        transactionTypeFieldIndex + 1
      );
      const destinationAccountColumn = context.numberToColumn(
        destinationAccountFieldIndex + 1
      );
      const destinationAmountColumn = context.numberToColumn(
        destinationAmountFieldIndex + 1
      );

      // Define transaction types
      const TRANSACTION_TYPES = {
        INCOME: "Income",
        EXPENSE: "Expense",
        TRANSFER: "Transfer",
      };

      // Setup account data with formulas
      const accountData = [];
      for (let i = 0; i < maxAccounts; i++) {
        const currentRow = dataStartRow + i;
        const referenceRow = accountsSection._calculated.startRow + 2 + i;

        // Account name formula
        const accountNameFormula = `=IF(Reference!${idColumn}${referenceRow}<>"", Reference!${emojiColumn}${referenceRow}&" "&Reference!${nameColumn}${referenceRow}, "")`;

        // Currency formula
        const currencyFormula = `=IF(Reference!${idColumn}${referenceRow}<>"", Reference!${currencyColumn}${referenceRow}, "")`;

        // Balance formula
        const balanceFormula = `=IF(Reference!${idColumn}${referenceRow}<>"", SUMIFS(INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${amountColumn}:${amountColumn}"),INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${accountColumn}:${accountColumn}"),Reference!${idColumn}${referenceRow},INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${transactionTypeColumn}:${transactionTypeColumn}"),"${TRANSACTION_TYPES.INCOME}")-SUMIFS(INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${amountColumn}:${amountColumn}"),INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${accountColumn}:${accountColumn}"),Reference!${idColumn}${referenceRow},INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${transactionTypeColumn}:${transactionTypeColumn}"),"${TRANSACTION_TYPES.EXPENSE}")+SUMIFS(INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${destinationAmountColumn}:${destinationAmountColumn}"),INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${destinationAccountColumn}:${destinationAccountColumn}"),Reference!${idColumn}${referenceRow},INDIRECT("'Bills_"&${yearValueColumn}$${yearValueRow}&"'!${transactionTypeColumn}:${transactionTypeColumn}"),"${TRANSACTION_TYPES.TRANSFER}"), "")`;

        accountData.push([accountNameFormula, currencyFormula, balanceFormula]);
      }

      if (accountData.length > 0) {
        const endRow = dataStartRow + accountData.length - 1;
        const fullRange = `${context.sheetName}!${balanceSection._calculated.startColumn}${dataStartRow}:${balanceSection._calculated.endColumn}${endRow}`;

        console.log(`Writing dynamic account formulas to range: ${fullRange}`);

        await context.sheetsApi.spreadsheets.values.update({
          spreadsheetId: context.spreadsheetId,
          range: fullRange,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: accountData,
          },
        });

        console.log(
          "Dynamic account balances with formulas setup successfully"
        );
      }
    } catch (error) {
      console.error("Error setting up account balances with formulas:", error);
    }
  }

  /**
   * Configure Monthly Expenses section with dynamic formulas
   */
  static async configureMonthlyExpenses(
    context: SectionConfigureContext
  ): Promise<void> {
    const expensesSection = context.getSection("dashboard", "monthly_expenses");
    if (!expensesSection || !expensesSection._calculated) {
      console.warn("Monthly expenses section not found or not calculated");
      return;
    }

    // Get the configuration section for year value
    const configSection = context.getSection("dashboard", "configuration");
    if (!configSection || !configSection._calculated) {
      console.warn("Configuration section not found or not calculated");
      return;
    }

    // Get the reference sheet configuration and calculate positions
    const referenceConfig = context.getSheetConfig("reference");
    if (!referenceConfig?.grid) {
      console.warn("Reference sheet configuration not found");
      return;
    }

    // Calculate positions for reference sheet if not already done
    this.calculateSectionPositions(referenceConfig.grid);

    const categoriesSection = context.getSection("reference", "categories");
    if (!categoriesSection || !categoriesSection._calculated) {
      console.warn("Categories section not found in reference sheet");
      return;
    }

    try {
      const maxCategories = context.limits.MAX_CATEGORIES;
      console.log(
        `Setting up monthly expenses section with embedded month selector for up to ${maxCategories} categories`
      );

      // 1. Setup section title
      const titleRange = this.getSectionHeaderRange(
        expensesSection,
        expensesSection._calculated.startRow
      );
      await context.sheetsApi.spreadsheets.values.update({
        spreadsheetId: context.spreadsheetId,
        range: `${context.sheetName}!${titleRange}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[expensesSection.title]],
        },
      });

      // 2. Setup section headers
      const headers = expensesSection.table.fields.map((field) => field.name);
      const headerRange = this.getSectionHeaderRange(
        expensesSection,
        expensesSection._calculated.startRow + 1
      );
      await context.sheetsApi.spreadsheets.values.update({
        spreadsheetId: context.spreadsheetId,
        range: `${context.sheetName}!${headerRange}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [headers],
        },
      });

      // 3. Setup default data (month selector + spacer + expenses header)
      if (expensesSection.table.defaultData) {
        const defaultDataStartRow = expensesSection._calculated.startRow + 2; // After section title and main headers
        const defaultDataEndRow =
          defaultDataStartRow + expensesSection.table.defaultData.length - 1;
        const defaultDataRange = `${context.sheetName}!${expensesSection._calculated.startColumn}${defaultDataStartRow}:${expensesSection._calculated.endColumn}${defaultDataEndRow}`;

        await context.sheetsApi.spreadsheets.values.update({
          spreadsheetId: context.spreadsheetId,
          range: defaultDataRange,
          valueInputOption: "RAW",
          requestBody: {
            values: expensesSection.table.defaultData,
          },
        });
      }

      // 4. Calculate dynamic column addresses for the categories section
      const categoriesStartCol = context.columnToNumber(
        categoriesSection._calculated.startColumn
      );

      // Field indices within the categories section
      const categoryFields = categoriesSection.table.fields;
      const nameFieldIndex = categoryFields.findIndex(
        (field) => field.name === "Name"
      );
      const emojiFieldIndex = categoryFields.findIndex(
        (field) => field.name === "Emoji"
      );

      // Calculate actual column letters for categories
      const categoryNameColumn = context.numberToColumn(
        categoriesStartCol + nameFieldIndex
      );
      const categoryEmojiColumn = context.numberToColumn(
        categoriesStartCol + emojiFieldIndex
      );

      // 5. Calculate configuration value locations (year from config section)
      const configStartCol = context.columnToNumber(
        configSection._calculated.startColumn
      );
      const configValueFieldIndex = configSection.table.fields.findIndex(
        (field) => field.name === "Value"
      );
      const configValueColumn = context.numberToColumn(
        configStartCol + configValueFieldIndex
      );
      const yearValueRow = configSection._calculated.startRow + 2; // Year value location

      // 6. Calculate month value location (within monthly expenses section)
      const expensesValueFieldIndex = expensesSection.table.fields.findIndex(
        (field) => field.name === "Value"
      );
      const expensesValueColumn = context.numberToColumn(
        context.columnToNumber(expensesSection._calculated.startColumn) +
          expensesValueFieldIndex
      );
      const monthValueRow = expensesSection._calculated.startRow + 2; // Month value in first data row

      // 7. Get bills sheet field configuration
      const billsConfig = context.getSheetConfig("bills");
      if (!billsConfig?.fields) {
        throw new Error("Bills sheet configuration not found");
      }

      // Find field indices in bills sheet
      const billsFields = billsConfig.fields;
      const amountFieldIndex = billsFields.findIndex(
        (field) => field.name === "Amount"
      );
      const categoryFieldIndex = billsFields.findIndex(
        (field) => field.name === "Category"
      );
      const transactionTypeFieldIndex = billsFields.findIndex(
        (field) => field.name === "Transaction Type"
      );
      const dateFieldIndex = billsFields.findIndex(
        (field) => field.name === "Date"
      );

      // Convert to column letters for bills sheet
      const billsAmountColumn = context.numberToColumn(amountFieldIndex + 1);
      const billsCategoryColumn = context.numberToColumn(
        categoryFieldIndex + 1
      );
      const billsTransactionTypeColumn = context.numberToColumn(
        transactionTypeFieldIndex + 1
      );
      const billsDateColumn = context.numberToColumn(dateFieldIndex + 1);

      // 8. Setup expense data with formulas (starting after month selector + spacer + header)
      const expenseDataStartRow = expensesSection._calculated.startRow + 5; // After title, headers, month, spacer, expenses header
      const expenseData = [];

      for (let i = 0; i < maxCategories; i++) {
        const currentRow = expenseDataStartRow + i;
        const categoryReferenceRow =
          categoriesSection._calculated.startRow + 2 + i;

        // Category name formula (with emoji)
        const categoryNameFormula = `=IF(Reference!${categoryNameColumn}${categoryReferenceRow}<>"", Reference!${categoryEmojiColumn}${categoryReferenceRow}&" "&Reference!${categoryNameColumn}${categoryReferenceRow}, "")`;

        // Monthly expense amount formula using month from within the section
        const amountFormula = `=IF(Reference!${categoryNameColumn}${categoryReferenceRow}<>"", SUMIFS(INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsAmountColumn}:${billsAmountColumn}"), INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsCategoryColumn}:${billsCategoryColumn}"), Reference!${categoryNameColumn}${categoryReferenceRow}, INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsTransactionTypeColumn}:${billsTransactionTypeColumn}"), "Expense", INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsDateColumn}:${billsDateColumn}"), ">="&DATE(${configValueColumn}$${yearValueRow}, ${expensesValueColumn}$${monthValueRow}, 1), INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsDateColumn}:${billsDateColumn}"), "<"&EOMONTH(DATE(${configValueColumn}$${yearValueRow}, ${expensesValueColumn}$${monthValueRow}, 1), 0)+1), "")`;

        // Calculate total monthly expenses (using month from within the section)
        const totalExpensesFormula = `SUMIFS(INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsAmountColumn}:${billsAmountColumn}"), INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsTransactionTypeColumn}:${billsTransactionTypeColumn}"), "Expense", INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsDateColumn}:${billsDateColumn}"), ">="&DATE(${configValueColumn}$${yearValueRow}, ${expensesValueColumn}$${monthValueRow}, 1), INDIRECT("'Bills_"&${configValueColumn}$${yearValueRow}&"'!${billsDateColumn}:${billsDateColumn}"), "<"&EOMONTH(DATE(${configValueColumn}$${yearValueRow}, ${expensesValueColumn}$${monthValueRow}, 1), 0)+1)`;

        // Percentage formula - reference the amount column (second column in the section)
        const amountColumnInSection = context.numberToColumn(
          context.columnToNumber(expensesSection._calculated.startColumn) + 1
        );
        const percentageFormula = `=IF(AND(Reference!${categoryNameColumn}${categoryReferenceRow}<>"", ${amountColumnInSection}${currentRow}<>"", ${totalExpensesFormula}>0), ROUND((${amountColumnInSection}${currentRow}/(${totalExpensesFormula}))*100, 1)&"%", "")`;

        expenseData.push([
          categoryNameFormula,
          amountFormula,
          percentageFormula,
        ]);
      }

      // 9. Write expense formulas to sheet
      if (expenseData.length > 0) {
        const endRow = expenseDataStartRow + expenseData.length - 1;
        const fullRange = `${context.sheetName}!${expensesSection._calculated.startColumn}${expenseDataStartRow}:${expensesSection._calculated.endColumn}${endRow}`;

        console.log(`Writing monthly expenses formulas to range: ${fullRange}`);

        await context.sheetsApi.spreadsheets.values.update({
          spreadsheetId: context.spreadsheetId,
          range: fullRange,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: expenseData,
          },
        });

        console.log(
          "Monthly expenses section fully configured with embedded month selector and dynamic formulas"
        );
      }
    } catch (error) {
      console.error("Error setting up monthly expenses with formulas:", error);
    }
  }

  /**
   * Demo method to showcase the new grid-based configuration system
   * This demonstrates all the new features: 2D grid layout, sections, spacing, merging, etc.
   */
  static demonstrateGridConfiguration(): void {
    console.log("🚀 New Grid-Based Configuration System Demo\n");

    // Demo 1: Reference Sheet Layout
    console.log("📋 Reference Sheet Configuration:");
    const referenceConfig = this.SHEETS.reference;

    if (referenceConfig.grid) {
      console.log(
        `Grid size: ${referenceConfig.grid.sections.length} rows x ${
          referenceConfig.grid.sections[0]?.length || 0
        } columns`
      );
      console.log(
        `Default section size: ${referenceConfig.grid.gridSettings.defaultSectionWidth} cols x ${referenceConfig.grid.gridSettings.defaultSectionHeight} rows`
      );
      console.log(
        `Section spacing: H=${referenceConfig.grid.gridSettings.sectionSpacing.horizontal}, V=${referenceConfig.grid.gridSettings.sectionSpacing.vertical}\n`
      );

      referenceConfig.grid.sections.forEach((row, rowIndex) => {
        console.log(`  Grid Row ${rowIndex + 1}:`);
        row.forEach((section, colIndex) => {
          if (section) {
            console.log(`    🔹 ${section.title} (ID: ${section.id})`);
            console.log(
              `       Fields: ${section.table.fields
                .map((f) => f.name)
                .join(", ")}`
            );
            console.log(
              `       Max rows: ${section.table.maxRows || "unlimited"}`
            );
            if (section.spacing) {
              console.log(`       Spacing: ${JSON.stringify(section.spacing)}`);
            }
            if (section.merging) {
              console.log(`       Merging: ${JSON.stringify(section.merging)}`);
            }
          } else {
            console.log(`    🔸 [Empty Grid Cell]`);
          }
        });
      });
    }

    // Demo 2: Calculate and Display Positions
    console.log("\n🎯 Calculating Section Positions:");
    if (referenceConfig.grid) {
      this.calculateSectionPositions(referenceConfig.grid);

      const allSections = this.getAllSections("reference");
      allSections.forEach((section) => {
        if (section._calculated) {
          console.log(`  ${section.title}:`);
          console.log(
            `    📍 Position: ${section._calculated.startColumn}${section._calculated.startRow}:${section._calculated.endColumn}${section._calculated.endRow}`
          );
          console.log(
            `    📏 Size: ${
              this.columnToNumber(section._calculated.endColumn) -
              this.columnToNumber(section._calculated.startColumn) +
              1
            } cols x ${
              section._calculated.endRow - section._calculated.startRow + 1
            } rows`
          );
        }
      });
    }

    // Demo 3: Dashboard Configuration
    console.log("\n📊 Dashboard Sheet Configuration:");
    const dashboardConfig = this.SHEETS.dashboard;
    if (dashboardConfig.grid) {
      this.calculateSectionPositions(dashboardConfig.grid);

      const dashboardSections = this.getAllSections("dashboard");
      dashboardSections.forEach((section) => {
        console.log(`  🔹 ${section.title} (ID: ${section.id})`);
        if (section._calculated) {
          console.log(
            `     📍 Position: ${section._calculated.startColumn}${section._calculated.startRow}:${section._calculated.endColumn}${section._calculated.endRow}`
          );
        }
        console.log(
          `     📝 Fields: ${section.table.fields
            .map((f) => f.name)
            .join(", ")}`
        );
        if (section.table.defaultData) {
          console.log(
            `     📄 Default data rows: ${section.table.defaultData.length}`
          );
        }
      });
    }

    // Demo 4: Section Lookup Features
    console.log("\n🔍 Section Lookup and Access:");

    // By ID
    const categoriesSection = this.getSectionById("reference", "categories");
    console.log(
      `  Categories section by ID: ${
        categoriesSection ? "✅ Found" : "❌ Not found"
      }`
    );
    if (categoriesSection) {
      console.log(`    Title: ${categoriesSection.title}`);
      console.log(`    Fields: ${categoriesSection.table.fields.length}`);
      console.log(
        `    Has default data: ${
          categoriesSection.table.defaultData ? "Yes" : "No"
        }`
      );
    }

    // By title (legacy compatibility)
    const accountsSection = this.getSection("reference", "💳 ACCOUNTS");
    console.log(
      `  Accounts section by title: ${
        accountsSection ? "✅ Found" : "❌ Not found"
      }`
    );

    // Demo 5: Backward Compatibility
    console.log("\n🔄 Legacy Compatibility:");

    // Field-based sheets still work
    const billsConfig = this.SHEETS.bills;
    console.log(
      `  Bills sheet (field-based): ${
        billsConfig.fields ? "✅ Compatible" : "❌ Not compatible"
      }`
    );
    if (billsConfig.fields) {
      console.log(`    Fields: ${billsConfig.fields.length}`);
      console.log(
        `    Headers: ${this.getFieldHeaders("bills")
          .slice(0, 3)
          .join(", ")}...`
      );
    }

    // Demo 6: New Features Summary
    console.log("\n🎉 New Features Summary:");
    console.log("  ✅ 2D Grid Layout: Sections arranged in rows and columns");
    console.log("  ✅ Flexible Spacing: Empty rows/columns around sections");
    console.log("  ✅ Section Merging: Colspan and rowspan support");
    console.log("  ✅ Dynamic Positioning: Automatic coordinate calculation");
    console.log("  ✅ Table Limits: Configurable max rows per section");
    console.log("  ✅ Default Data: Built-in default content");
    console.log("  ✅ Color Themes: Per-section color configuration");
    console.log(
      "  ✅ Legacy Support: Backward compatible with existing configs"
    );
    console.log("  ✅ Type Safety: Full TypeScript support");

    console.log("\n✨ Grid Configuration Demo Complete!");
  }
}
