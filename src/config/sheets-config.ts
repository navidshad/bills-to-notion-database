export interface SheetField {
  name: string;
  type: "string" | "number" | "date" | "currency" | "json" | "boolean";
  required?: boolean;
  default?: any;
  validation?: (value: any) => boolean;
}

export interface SheetSection {
  title: string;
  emoji: string;
  startColumn: string;
  endColumn: string;
  fields: SheetField[];
  color: {
    title: { red: number; green: number; blue: number };
    header: { red: number; green: number; blue: number };
    border: { red: number; green: number; blue: number };
  };
}

export interface SheetConfiguration {
  name: string;
  gridProperties: {
    rowCount: number;
    columnCount: number;
  };
  sections?: SheetSection[];
  fields?: SheetField[];
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
        columnCount: 17,
      },
      sections: [
        {
          title: "📂 CATEGORIES",
          emoji: "📂",
          startColumn: "A",
          endColumn: "E",
          fields: [
            { name: "#", type: "number", required: true },
            { name: "ID", type: "string", required: true },
            { name: "Name", type: "string", required: true },
            { name: "Emoji", type: "string", default: "📋" },
            { name: "Description", type: "string" },
          ],
          color: {
            title: { red: 0.85, green: 0.92, blue: 1 },
            header: { red: 0.9, green: 0.95, blue: 1 },
            border: { red: 0.2, green: 0.4, blue: 0.8 },
          },
        },
        {
          title: "💳 ACCOUNTS",
          emoji: "💳",
          startColumn: "G",
          endColumn: "L",
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
          color: {
            title: { red: 0.85, green: 1, blue: 0.85 },
            header: { red: 0.9, green: 1, blue: 0.9 },
            border: { red: 0.2, green: 0.6, blue: 0.2 },
          },
        },
        {
          title: "💰 INCOME SOURCES",
          emoji: "💰",
          startColumn: "N",
          endColumn: "R",
          fields: [
            { name: "#", type: "number", required: true },
            { name: "ID", type: "string", required: true },
            { name: "Name", type: "string", required: true },
            { name: "Emoji", type: "string", default: "💼" },
            { name: "Description", type: "string" },
          ],
          color: {
            title: { red: 1, green: 0.9, blue: 0.7 },
            header: { red: 1, green: 0.95, blue: 0.85 },
            border: { red: 0.8, green: 0.5, blue: 0.2 },
          },
        },
      ],
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
      sections: [
        {
          title: "⚙️ CONFIGURATION",
          emoji: "⚙️",
          startColumn: "H",
          endColumn: "J",
          fields: [
            { name: "Setting", type: "string", required: true },
            { name: "Value", type: "string", required: true },
            { name: "Description", type: "string" },
          ],
          color: {
            title: { red: 0.9, green: 0.85, blue: 1 },
            header: { red: 0.95, green: 0.9, blue: 1 },
            border: { red: 0.5, green: 0.2, blue: 0.8 },
          },
        },
        {
          title: "💰 ACCOUNT BALANCES",
          emoji: "💰",
          startColumn: "H",
          endColumn: "J",
          fields: [
            { name: "Account", type: "string", required: true },
            { name: "Currency", type: "currency", required: true },
            { name: "Balance", type: "number" },
          ],
          color: {
            title: { red: 0.7, green: 0.95, blue: 0.7 },
            header: { red: 0.8, green: 0.98, blue: 0.8 },
            border: { red: 0.1, green: 0.7, blue: 0.1 },
          },
        },
      ],
    },
  };

  // Default data for sheets
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

  static getSectionRange(
    section: SheetSection,
    startRow: number,
    endRow: number
  ): string {
    return this.getRange(
      section.startColumn,
      startRow,
      section.endColumn,
      endRow
    );
  }

  static getFieldRange(
    sheetConfig: SheetConfiguration,
    fieldName: string,
    startRow: number,
    endRow: number
  ): string {
    const fieldIndex = sheetConfig.fields?.findIndex(
      (field) => field.name === fieldName
    );
    if (fieldIndex === undefined || fieldIndex === -1) {
      throw new Error(`Field "${fieldName}" not found in sheet configuration`);
    }

    const column = this.numberToColumn(fieldIndex + 1);
    return this.getRange(column, startRow, column, endRow);
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

  static getSectionHeaderRange(section: SheetSection, row: number): string {
    return this.getRange(section.startColumn, row, section.endColumn, row);
  }

  static getSectionDataRange(section: SheetSection, startRow: number): string {
    return `${section.startColumn}${startRow}:${section.endColumn}`;
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

  // Get field headers for a sheet
  static getFieldHeaders(sheetKey: string): string[] {
    const sheet = this.SHEETS[sheetKey];
    if (!sheet) {
      throw new Error(`Sheet configuration "${sheetKey}" not found`);
    }

    if (sheet.fields) {
      return sheet.fields.map((field) => field.name);
    }

    if (sheet.sections) {
      // For sectioned sheets, return all field names from all sections
      return sheet.sections.flatMap((section) =>
        section.fields.map((field) => field.name)
      );
    }

    return [];
  }

  // Get section by name
  static getSection(
    sheetKey: string,
    sectionTitle: string
  ): SheetSection | undefined {
    const sheet = this.SHEETS[sheetKey];
    return sheet?.sections?.find((section) => section.title === sectionTitle);
  }

  // Get field configuration
  static getField(sheetKey: string, fieldName: string): SheetField | undefined {
    const sheet = this.SHEETS[sheetKey];

    if (sheet?.fields) {
      return sheet.fields.find((field) => field.name === fieldName);
    }

    if (sheet?.sections) {
      for (const section of sheet.sections) {
        const field = section.fields.find((field) => field.name === fieldName);
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
}
