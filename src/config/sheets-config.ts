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

export interface SheetSection {
  id: string; // unique identifier
  title: string;
  table: SectionTable;
  color: {
    title: { red: number; green: number; blue: number };
    header: { red: number; green: number; blue: number };
    border: { red: number; green: number; blue: number };
    data?: { red: number; green: number; blue: number }; // optional data background
  };
  spacing?: SectionSpacing;
  merging?: SectionMerging;
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
                maxRows: 5,
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
              spacing: { left: 8 },
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
                maxRows: 15, // limited to max accounts
                hasHeaders: true,
              },
              color: {
                title: { red: 0.7, green: 0.95, blue: 0.7 },
                header: { red: 0.8, green: 0.98, blue: 0.8 },
                border: { red: 0.1, green: 0.7, blue: 0.1 },
              },

              spacing: { left: 8, top: 1 }, // 2 empty rows above
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
