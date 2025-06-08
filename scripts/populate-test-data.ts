/**
 * Test Data Population Script for Dashboard Testing
 * This script populates Google Sheets with realistic sample data
 * to test dashboard components and visualizations
 */

import { config } from "dotenv";
import * as path from "path";
import { GoogleSheetsAdapter } from "../src/adapters/google-sheets";

// Load environment variables
config({ path: path.resolve(__dirname, "../.env") });

interface TestTransaction {
  id: number;
  date: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  transaction_type: string;
  account: string;
  destination_account?: string;
  destination_amount?: number;
  destination_currency?: string;
  exchange_rate?: number;
  fee?: number;
  payment_method?: string;
  tags?: string;
  notes?: string;
}

class DashboardTestDataPopulator {
  private sheetsAdapter: GoogleSheetsAdapter;
  private startId = 100;

  constructor() {
    this.sheetsAdapter = new GoogleSheetsAdapter();
  }

  async initialize() {
    console.log("🚀 Initializing Dashboard Test Data Populator...");

    // Verify environment variables
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID not found in .env file");
    }

    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_PATH &&
      !require("fs").existsSync("./service-account.json")
    ) {
      throw new Error(
        "service-account.json not found and GOOGLE_SERVICE_ACCOUNT_PATH not set"
      );
    }

    console.log(
      `📊 Target Spreadsheet ID: ${process.env.GOOGLE_SPREADSHEET_ID}`
    );

    await this.sheetsAdapter.initialize();
    console.log("✅ Google Sheets adapter initialized");
  }

  /**
   * Generate comprehensive test data for all transaction types
   */
  generateTestData(): TestTransaction[] {
    const testData: TestTransaction[] = [];
    let currentId = this.startId;

    // Generate data from today going 3 months backward
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // 3 months ago

    // Calculate the exact number of days between start and end
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(
      `📅 Generating data from ${startDate.toISOString().split("T")[0]} to ${
        endDate.toISOString().split("T")[0]
      } (${totalDays} days)`
    );

    // 1. EXPENSE TRANSACTIONS (60% of data)
    const expenseCategories = [
      { name: "Food", weight: 0.25, avgAmount: 35 },
      { name: "Transport", weight: 0.2, avgAmount: 25 },
      { name: "Shopping", weight: 0.15, avgAmount: 75 },
      { name: "Utilities", weight: 0.1, avgAmount: 120 },
      { name: "Entertainment", weight: 0.15, avgAmount: 45 },
      { name: "Healthcare", weight: 0.1, avgAmount: 150 },
      { name: "Education", weight: 0.05, avgAmount: 200 },
    ];

    const accounts = [
      { name: "Main Card", currency: "USD", weight: 0.4 },
      { name: "Cash", currency: "USD", weight: 0.25 },
      { name: "Business Card", currency: "USD", weight: 0.2 },
      { name: "Euro Cash", currency: "EUR", weight: 0.1 },
      { name: "Savings", currency: "USD", weight: 0.05 },
    ];

    // Generate expenses for the calculated date range
    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Skip future dates (in case of calculation edge cases)
      if (currentDate > endDate) break;

      // 1-4 transactions per day (weighted towards weekdays)
      const isWeekend =
        currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const dailyTransactions = isWeekend
        ? Math.floor(Math.random() * 2) + 1
        : Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < dailyTransactions; i++) {
        const category = this.weightedRandom(expenseCategories);
        const account = this.weightedRandom(accounts);

        // Add some randomness to amounts
        const baseAmount = category.avgAmount;
        const amount = baseAmount + (Math.random() - 0.5) * baseAmount * 0.6;

        testData.push({
          id: currentId++,
          date: currentDate.toISOString().split("T")[0],
          title: this.generateExpenseTitle(category.name),
          amount: Math.round(amount * 100) / 100,
          currency: account.currency,
          category: category.name,
          transaction_type: "expense",
          account: account.name,
          payment_method: this.getRandomPaymentMethod(),
          tags: this.generateTags(category.name),
          notes: Math.random() > 0.7 ? this.generateNotes() : "",
        });
      }
    }

    // 2. INCOME TRANSACTIONS (20% of data)
    const incomeData = [
      { title: "Salary Payment", amount: 3500, frequency: 30 },
      { title: "Freelance Project", amount: 800, frequency: 15 },
      { title: "Investment Return", amount: 150, frequency: 45 },
      { title: "Cashback Reward", amount: 25, frequency: 7 },
      { title: "Gift Money", amount: 100, frequency: 60 },
    ];

    for (const income of incomeData) {
      for (let day = 0; day < totalDays; day += income.frequency) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);

        // Skip future dates
        if (currentDate > endDate) break;

        testData.push({
          id: currentId++,
          date: currentDate.toISOString().split("T")[0],
          title: income.title,
          amount: income.amount + (Math.random() - 0.5) * income.amount * 0.1,
          currency: "USD",
          category: "Income",
          transaction_type: "income",
          account: "Main Card",
          payment_method: "Bank Transfer",
          notes: `Regular ${income.title.toLowerCase()}`,
        });
      }
    }

    // 3. TRANSFER TRANSACTIONS (20% of data)
    const transferScenarios = [
      {
        from: "Main Card",
        to: "Cash",
        currency_from: "USD",
        currency_to: "USD",
        rate: 1.0,
      },
      {
        from: "Main Card",
        to: "Euro Cash",
        currency_from: "USD",
        currency_to: "EUR",
        rate: 0.85,
      },
      {
        from: "Cash",
        to: "Savings",
        currency_from: "USD",
        currency_to: "USD",
        rate: 1.0,
      },
      {
        from: "Business Card",
        to: "Main Card",
        currency_from: "USD",
        currency_to: "USD",
        rate: 1.0,
      },
    ];

    for (let i = 0; i < 25; i++) {
      const scenario =
        transferScenarios[Math.floor(Math.random() * transferScenarios.length)];
      const transferDate = new Date(startDate);
      transferDate.setDate(
        startDate.getDate() + Math.floor(Math.random() * totalDays)
      );

      // Skip future dates
      if (transferDate > endDate) continue;

      const sourceAmount = Math.floor(Math.random() * 500) + 50;
      const destinationAmount =
        Math.round(sourceAmount * scenario.rate * 100) / 100;
      const hasFee = Math.random() > 0.7;
      const fee = hasFee ? Math.round(sourceAmount * 0.02 * 100) / 100 : 0;

      testData.push({
        id: currentId++,
        date: transferDate.toISOString().split("T")[0],
        title: `Transfer ${scenario.currency_from} to ${scenario.currency_to}`,
        amount: sourceAmount,
        currency: scenario.currency_from,
        category: "Transfer",
        transaction_type: "transfer",
        account: scenario.from,
        destination_account: scenario.to,
        destination_amount: destinationAmount,
        destination_currency: scenario.currency_to,
        exchange_rate: scenario.rate,
        fee: fee,
        payment_method: "Bank Transfer",
        notes:
          scenario.rate === 1.0
            ? "Same currency transfer"
            : "Currency exchange",
      });
    }

    console.log(`📝 Generated ${testData.length} test transactions`);
    return testData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Weighted random selection helper
   */
  private weightedRandom(items: any[]): any {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return items[0];
  }

  /**
   * Generate realistic expense titles
   */
  private generateExpenseTitle(category: string): string {
    const titles: Record<string, string[]> = {
      Food: [
        "Grocery Shopping",
        "Restaurant Dinner",
        "Coffee Shop",
        "Fast Food",
        "Lunch Meeting",
      ],
      Transport: [
        "Gas Station",
        "Taxi Ride",
        "Public Transport",
        "Parking Fee",
        "Car Maintenance",
      ],
      Shopping: [
        "Online Purchase",
        "Clothing Store",
        "Electronics Store",
        "Home Goods",
        "Pharmacy",
      ],
      Utilities: [
        "Electricity Bill",
        "Internet Bill",
        "Water Bill",
        "Phone Bill",
        "Gas Bill",
      ],
      Entertainment: [
        "Movie Theater",
        "Concert Ticket",
        "Gaming",
        "Streaming Service",
        "Books",
      ],
      Healthcare: [
        "Doctor Visit",
        "Pharmacy",
        "Dental Care",
        "Health Insurance",
        "Gym Membership",
      ],
      Education: [
        "Online Course",
        "Books",
        "Certification",
        "Workshop",
        "Training",
      ],
    };

    const categoryTitles = titles[category] || ["General Expense"];
    return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
  }

  /**
   * Generate random payment methods
   */
  private getRandomPaymentMethod(): string {
    const methods = [
      "Credit Card",
      "Debit Card",
      "Cash",
      "Bank Transfer",
      "Digital Wallet",
      "Check",
    ];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  /**
   * Generate category-based tags
   */
  private generateTags(category: string): string {
    const tagMap: Record<string, string[]> = {
      Food: ["meal", "dining", "grocery"],
      Transport: ["commute", "travel", "vehicle"],
      Shopping: ["retail", "online", "necessary"],
      Utilities: ["monthly", "bills", "home"],
      Entertainment: ["leisure", "fun", "social"],
      Healthcare: ["health", "medical", "wellness"],
      Education: ["learning", "development", "career"],
    };

    const tags = tagMap[category] || ["general"];
    return tags[Math.floor(Math.random() * tags.length)];
  }

  /**
   * Generate random notes
   */
  private generateNotes(): string {
    const notes = [
      "Regular monthly expense",
      "One-time purchase",
      "Work related",
      "Personal expense",
      "Emergency purchase",
      "Planned expense",
      "Unexpected cost",
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  /**
   * Populate the Google Sheets with test data
   */
  async populateTestData() {
    console.log("📊 Generating test data...");
    const testData = this.generateTestData();

    console.log("📤 Uploading data to Google Sheets...");

    // Prepare data for batch insert
    const currentYear = new Date().getFullYear();
    const sheetName = `Bills_${currentYear}`;

    // Ensure yearly sheet exists
    await this.sheetsAdapter.ensureYearlySheetExists(currentYear);

    // Prepare batch data
    const batchData = testData.map((transaction) => [
      transaction.id,
      transaction.date,
      transaction.title,
      transaction.amount,
      transaction.currency,
      transaction.category,
      transaction.transaction_type,
      transaction.account,
      transaction.destination_account || "",
      transaction.destination_amount || "",
      transaction.destination_currency || "",
      transaction.exchange_rate || "",
      transaction.fee || "",
      transaction.payment_method || "",
      transaction.tags || "",
      transaction.notes || "",
      new Date().toISOString(), // created_at
      new Date().toISOString(), // updated_at
    ]);

    // Insert data in batches to avoid API limits
    const batchSize = 100;
    let startRow = 2; // Start after header row

    for (let i = 0; i < batchData.length; i += batchSize) {
      const batch = batchData.slice(i, i + batchSize);
      const endRow = startRow + batch.length - 1;

      await this.sheetsAdapter.sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetsAdapter.spreadsheetId,
        range: `${sheetName}!A${startRow}:R${endRow}`,
        valueInputOption: "RAW",
        requestBody: { values: batch },
      });

      console.log(
        `✅ Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          batchData.length / batchSize
        )} (${batch.length} transactions)`
      );
      startRow += batch.length;

      // Add small delay to respect API rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `🎉 Successfully populated ${testData.length} test transactions!`
    );
  }

  /**
   * Generate summary statistics for verification
   */
  async generateSummary() {
    console.log("\n📊 TEST DATA SUMMARY");
    console.log("====================");

    const testData = this.generateTestData();

    // Transaction type distribution
    const typeDistribution = testData.reduce((acc, t) => {
      acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📈 Transaction Types:");
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} transactions`);
    });

    // Category distribution
    const categoryDistribution = testData.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📂 Categories:");
    Object.entries(categoryDistribution).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} transactions`);
    });

    // Amount statistics
    const amounts = testData.map((t) => t.amount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const avgAmount = totalAmount / amounts.length;

    console.log("\n💰 Amount Statistics:");
    console.log(`  Total: $${totalAmount.toFixed(2)}`);
    console.log(`  Average: $${avgAmount.toFixed(2)}`);
    console.log(`  Min: $${Math.min(...amounts).toFixed(2)}`);
    console.log(`  Max: $${Math.max(...amounts).toFixed(2)}`);

    // Date range
    const dates = testData.map((t) => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    console.log("\n📅 Date Range:");
    console.log(`  From: ${minDate.toISOString().split("T")[0]}`);
    console.log(`  To: ${maxDate.toISOString().split("T")[0]}`);
    console.log(
      `  Days: ${Math.ceil(
        (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      )}`
    );

    console.log(
      `\n🔗 Spreadsheet URL: https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SPREADSHEET_ID}/edit`
    );
  }

  /**
   * Clear existing test data (optional)
   */
  async clearTestData() {
    console.log("🗑️ Clearing existing test data...");

    const currentYear = new Date().getFullYear();
    const sheetName = `Bills_${currentYear}`;

    // Clear all data except headers (row 1)
    await this.sheetsAdapter.sheets.spreadsheets.values.clear({
      spreadsheetId: this.sheetsAdapter.spreadsheetId,
      range: `${sheetName}!A2:R1000`,
    });

    console.log("✅ Test data cleared");
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");
  const shouldSummaryOnly = args.includes("--summary-only");

  try {
    const populator = new DashboardTestDataPopulator();
    await populator.initialize();

    if (shouldClear) {
      await populator.clearTestData();
    }

    if (shouldSummaryOnly) {
      await populator.generateSummary();
    } else {
      await populator.populateTestData();
      await populator.generateSummary();
    }

    console.log("\n🎯 Next Steps:");
    console.log("1. Open your Google Sheets dashboard");
    console.log("2. Verify the test data is populated correctly");
    console.log("3. Test dashboard components with real data");
    console.log("4. Begin dashboard implementation Phase A");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

export default DashboardTestDataPopulator;
