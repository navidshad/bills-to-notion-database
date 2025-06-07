# Test Scripts Directory

This directory contains scripts for testing and populating the dashboard with sample data.

## 📊 Test Data Population Script

### Overview
The `populate-test-data.ts` script generates comprehensive sample financial data to test dashboard components and visualizations. It reads credentials from the `.env` file and populates your Google Sheets with realistic transaction data.

### Features
- **🔐 Automatic credential loading** from `.env` file
- **📅 3 months of realistic data** (~200+ transactions)
- **🎯 Weighted distribution**: 60% expenses, 20% income, 20% transfers
- **💱 Multi-currency support**: USD and EUR transactions
- **💳 Transfer fees**: Tests Phase 4 transfer fee analysis
- **⚡ Batch processing**: Respects Google Sheets API rate limits
- **📊 Data verification**: Generates summary statistics

### Quick Start

1. **Install dependencies** (if needed):
   ```bash
   npm install
   ```

2. **Ensure .env file** has required credentials:
   ```env
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json  # or default location
   ```

3. **Populate test data**:
   ```bash
   npm run test:populate
   ```

### Available Commands

| Command                 | Description                     | Example Output              |
| ----------------------- | ------------------------------- | --------------------------- |
| `npm run test:populate` | Generate and upload test data   | ~200 transactions uploaded  |
| `npm run test:clear`    | Clear existing test data        | Clears Bills_2024 data rows |
| `npm run test:summary`  | Generate summary without upload | Statistics and data preview |

### Generated Data Structure

#### Transaction Types Distribution
- **💸 Expenses (60%)**: Daily spending across categories
- **💰 Income (20%)**: Salary, freelance, investments, rewards
- **🔄 Transfers (20%)**: Account movements, currency exchanges

#### Categories Breakdown
- **🍕 Food (25%)**: Groceries, restaurants, coffee
- **🚗 Transport (20%)**: Gas, taxi, public transport
- **🛍️ Shopping (15%)**: Clothes, electronics, home goods
- **💡 Utilities (10%)**: Bills, phone, internet
- **🎬 Entertainment (15%)**: Movies, games, streaming
- **🏥 Healthcare (10%)**: Doctor, pharmacy, insurance
- **📚 Education (5%)**: Courses, books, training

#### Account Distribution
- **💳 Main Card (40%)**: Primary spending account (USD)
- **💰 Cash (25%)**: Cash transactions (USD)
- **💼 Business Card (20%)**: Work-related expenses (USD)
- **🇪🇺 Euro Cash (10%)**: European transactions (EUR)
- **🏦 Savings (5%)**: Savings account (USD)

### Sample Output

```
🚀 Initializing Dashboard Test Data Populator...
📊 Target Spreadsheet ID: 1X5qax6JphPamB-XcSFX_JxW0gNFIzMBPbHMW6W7J5c4
✅ Google Sheets adapter initialized
📊 Generating test data...
📝 Generated 203 test transactions
📤 Uploading data to Google Sheets...
✅ Uploaded batch 1/3 (100 transactions)
✅ Uploaded batch 2/3 (100 transactions)
✅ Uploaded batch 3/3 (3 transactions)
🎉 Successfully populated 203 test transactions!

📊 TEST DATA SUMMARY
====================

📈 Transaction Types:
  expense: 122 transactions
  income: 15 transactions
  transfer: 25 transactions

📂 Categories:
  Food: 31 transactions
  Transport: 24 transactions
  Shopping: 18 transactions
  ...

💰 Amount Statistics:
  Total: $12,456.78
  Average: $61.37
  Min: $8.50
  Max: $3,500.00

📅 Date Range:
  From: 2024-03-15
  To: 2024-06-15
  Days: 92

🔗 Spreadsheet URL: https://docs.google.com/spreadsheets/d/your_id/edit
```

### Dashboard Testing Workflow

1. **🧹 Clear old data** (optional):
   ```bash
   npm run test:clear
   ```

2. **📊 Populate test data**:
   ```bash
   npm run test:populate
   ```

3. **🔍 Verify data** in Google Sheets:
   - Check Bills_2024 sheet has populated data
   - Verify different transaction types are present
   - Confirm multi-currency data exists

4. **🎯 Begin dashboard implementation**:
   - Start with Phase A (Core Dashboard Setup)
   - Test each component with real data
   - Verify charts and formulas work correctly

### Error Handling

Common issues and solutions:

| Error                             | Solution                                     |
| --------------------------------- | -------------------------------------------- |
| `GOOGLE_SPREADSHEET_ID not found` | Add spreadsheet ID to `.env` file            |
| `service-account.json not found`  | Ensure service account file exists           |
| `Insufficient permissions`        | Share spreadsheet with service account email |
| `API rate limit exceeded`         | Script includes automatic delays             |

### Data Validation

The script includes comprehensive validation:
- ✅ Transaction ID uniqueness (starting from 100)
- ✅ Date range consistency (last 3 months)
- ✅ Amount realistic distribution
- ✅ Currency code accuracy
- ✅ Category assignment correctness
- ✅ Account relationship integrity

### Next Steps

After populating test data:
1. **Verify spreadsheet** has all expected data
2. **Begin Phase A** of dashboard implementation
3. **Test formulas** with real data volume
4. **Validate charts** display correctly
5. **Performance test** with full dataset

This test data provides a solid foundation for developing and testing all dashboard components with realistic financial data patterns. 