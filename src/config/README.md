# Google Sheets Configuration System

This directory contains the configuration system for Google Sheets integration, which eliminates hardcoded sheet details and provides flexibility for customization.

## Overview

The new configuration system provides:

- **Declarative sheet structure definitions** - Define sheet layouts, fields, and sections in configuration rather than hardcoded values
- **Dynamic coordinate calculation** - Helper functions to calculate ranges and positions programmatically
- **Type safety and validation** - Built-in validation for field types and required fields
- **Easy customization** - Change sheet layouts by modifying configuration rather than code
- **Template generation** - Automatically generate rows with proper field ordering and defaults

## Files

- `sheets-config.ts` - Main configuration file with sheet definitions and helper functions
- `README.md` - This documentation file

## Configuration Structure

### Sheet Configuration

Each sheet is defined with:

```typescript
interface SheetConfiguration {
  name: string;                    // Sheet name (supports variables like {year})
  gridProperties: {                // Grid size
    rowCount: number;
    columnCount: number;
  };
  sections?: SheetSection[];       // For multi-section sheets (like Reference)
  fields?: SheetField[];          // For standard sheets (like Bills, TempBills)
}
```

### Field Configuration

Each field is defined with:

```typescript
interface SheetField {
  name: string;                           // Field display name
  type: 'string' | 'number' | 'date' | 'currency' | 'json' | 'boolean';
  required?: boolean;                     // Whether field is required
  default?: any;                         // Default value
  validation?: (value: any) => boolean;  // Custom validation function
}
```

### Section Configuration (for Reference sheet)

```typescript
interface SheetSection {
  title: string;        // Section title (e.g., "📂 CATEGORIES")
  emoji: string;        // Section emoji
  startColumn: string;  // Starting column (e.g., "A")
  endColumn: string;    // Ending column (e.g., "D")
  fields: SheetField[]; // Fields in this section
  color: {              // Color scheme for formatting
    title: { red: number; green: number; blue: number };
    header: { red: number; green: number; blue: number };
    border: { red: number; green: number; blue: number };
  };
}
```

## Usage Examples

### 1. Getting Sheet Names

```typescript
import { SheetsConfig } from './sheets-config';

// Static sheet names
const referenceName = SheetsConfig.getSheetName('reference'); // "Reference"
const configName = SheetsConfig.getSheetName('config');       // "Config"

// Dynamic sheet names with variables
const bills2024 = SheetsConfig.getSheetName('bills', { year: 2024 }); // "Bills_2024"
const bills2025 = SheetsConfig.getSheetName('bills', { year: 2025 }); // "Bills_2025"
```

### 2. Getting Field Headers

```typescript
// Get all field headers for a sheet
const billsHeaders = SheetsConfig.getFieldHeaders('bills');
// Returns: ["ID", "Date", "Title/Description", "Amount", "Currency", ...]

const configHeaders = SheetsConfig.getFieldHeaders('config');
// Returns: ["Setting", "Value", "Description"]
```

### 3. Dynamic Range Calculation

```typescript
// Get ranges for standard sheets
const billsConfig = SheetsConfig.SHEETS.bills;
const headersRange = SheetsConfig.getHeadersRange(billsConfig);  // "A1:R1"
const dataRange = SheetsConfig.getDataRange(billsConfig);        // "A2:R"
const dataFrom10 = SheetsConfig.getDataRange(billsConfig, 10);   // "A10:R"

// Get ranges for sectioned sheets
const categoriesSection = SheetsConfig.getSection('reference', '📂 CATEGORIES');
const titleRange = SheetsConfig.getSectionHeaderRange(categoriesSection, 1);  // "A1:D1"
const headerRange = SheetsConfig.getSectionHeaderRange(categoriesSection, 2); // "A2:D2"
const dataRange = SheetsConfig.getSectionDataRange(categoriesSection, 3);     // "A3:D"
```

### 4. Column Calculations

```typescript
// Convert between column letters and numbers
SheetsConfig.columnToNumber('A');   // 1
SheetsConfig.columnToNumber('Z');   // 26
SheetsConfig.columnToNumber('AA');  // 27

SheetsConfig.numberToColumn(1);     // "A"
SheetsConfig.numberToColumn(26);    // "Z"
SheetsConfig.numberToColumn(27);    // "AA"

// Create custom ranges
SheetsConfig.getRange('A', 1, 'D', 10);  // "A1:D10"
```

### 5. Template Row Generation

```typescript
// Generate a template row with defaults
const templateRow = SheetsConfig.generateTemplateRow('bills', {
  'ID': 12345,
  'Date': '2024-01-15',
  'Title/Description': 'Coffee Shop',
  'Amount': 4.50,
  'Currency': 'USD',
  'Category': 'food',
  'Account': 'main_card'
});
// Returns array with values in correct field order
```

### 6. Data Validation

```typescript
// Validate data against sheet configuration
const testData = [
  ['123', '2024-01-15', 'Expense', '25.00', 'USD', ...],
  ['', '2024-01-15', 'Invalid', '25.00', 'USD', ...] // Missing required ID
];

const validation = SheetsConfig.validateData('bills', testData);
console.log(validation.isValid); // false
console.log(validation.errors);  // ["Row 2: Field "ID" is required"]
```

### 7. Field Information

```typescript
// Get field configuration
const idField = SheetsConfig.getField('bills', 'ID');
console.log(idField.required);  // true
console.log(idField.type);      // "number"

// Get default values
const currency = SheetsConfig.getFieldDefault('bills', 'Currency'); // "USD"
const transactionType = SheetsConfig.getFieldDefault('bills', 'Transaction Type'); // "Expense"
```

## Refactored Adapter Usage

The `GoogleSheetsAdapter` has been updated to use this configuration system:

### Before (Hardcoded)
```typescript
// Old hardcoded approach
const range = `Bills_${currentYear}!A1:R1`;
const headers = ["ID", "Date", "Title/Description", ...];
```

### After (Configuration-driven)
```typescript
// New configuration-driven approach
const sheetName = SheetsConfig.getSheetName('bills', { year: currentYear });
const config = SheetsConfig.SHEETS.bills;
const range = `${sheetName}!${SheetsConfig.getHeadersRange(config)}`;
const headers = SheetsConfig.getFieldHeaders('bills');
```

## Benefits

1. **Maintainability** - All sheet structures defined in one place
2. **Flexibility** - Easy to modify layouts without touching adapter code
3. **Type Safety** - Configuration provides type information and validation
4. **Consistency** - Ensures all methods use the same field definitions
5. **Testability** - Configuration can be easily tested and validated
6. **Extensibility** - New sheet types can be added by extending configuration

## Adding New Sheets

To add a new sheet type:

1. Add the sheet configuration to `SheetsConfig.SHEETS`
2. Add default data to `SheetsConfig.DEFAULT_DATA` if needed
3. Update the adapter's `getSheetKeyByName` method
4. The adapter will automatically handle the new sheet using the configuration

## Adding New Fields

To add fields to existing sheets:

1. Update the `fields` array in the sheet configuration
2. Update the `DEFAULT_DATA` if the field needs default values
3. The adapter will automatically use the new field structure

This system provides a robust foundation for managing Google Sheets integration with full flexibility and maintainability. 