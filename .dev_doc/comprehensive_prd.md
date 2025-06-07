# Bills to Personal Finance App - Comprehensive PRD

## Executive Summary

Transform the existing Telegram bill collector bot from a simple Notion-based data entry tool into a comprehensive personal finance application using Google Sheets as the backend. The system will provide intelligent bill processing, categorization, financial tracking, and personal debt/credit management capabilities.

## Current State Analysis

### Existing Implementation
- **Technology Stack**: Node.js + TypeScript, Telegram Bot API, OpenAI GPT-4o, Google Sheets API
- **Features**: Photo/text bill processing, AI-powered data extraction, Google Sheets integration
- **Limitations**: No categorization, no financial insights, limited user interaction, no debt tracking

### Migration Goals
- **Primary**: Replace Notion with Google Sheets API ✅ COMPLETED
- **Secondary**: Add comprehensive financial features
- **Tertiary**: Improve user experience and data management
- **New**: Add personal debt and credit tracking

## Product Vision

Create a smart, conversational personal finance assistant that:
- Automatically processes and categorizes bills/receipts
- Organizes financial data in structured Google Sheets
- Provides insights and maintains financial records
- Tracks personal loans and debts with friends/family
- Adapts to user preferences and spending patterns

## Core Requirements

### 1. Google Sheets Integration

#### 1.1 Sheet Structure
- **Bills_{YEAR}**: Annual transaction sheets (e.g., Bills_2024, Bills_2025)
- **Categories**: Expense categories and subcategories
- **Accounts**: Bank accounts, credit cards, cash, etc.
- **Config**: System settings and user preferences
- **Dashboard**: Summary metrics and insights
- **TempBills**: Temporary storage for unconfirmed transactions [MessageID, ProcessedData, InputMessageIDs, Timestamp]
- **Contacts**: People you lend to/borrow from (NEW)
- **Debts**: Active debt/credit tracking (NEW)
- **DebtHistory**: Payment history for debts/credits (NEW)

#### 1.2 Data Schema

**Bills_{YEAR} Columns:**
```typescript
interface BillRecord {
  id: number;                    // Sequential numeric ID starting from 100
  bill_id?: number;              // Reference to TempBill if originated there
  date: string;                  // ISO date
  title: string;                 // Description
  amount: number;                // Transaction amount
  currency: string;              // Currency code
  category: string;              // Expense category
  transaction_type: "expense" | "income" | "transfer" | "lend" | "borrow" | "debt_payment" | "debt_received";
  account: string;               // Source account
  destination_account?: string;  // For transfers
  destination_amount?: number;   // For currency exchanges
  destination_currency?: string; // For currency exchanges
  exchange_rate?: number;        // For currency exchanges
  payment_method?: string;       // How payment was made
  contact_id?: string;           // For debt transactions (references Contacts)
  contact_name?: string;         // Person's name for easy reading
  related_debt_id?: string;      // Links to active debt in Debts sheet
  debt_type?: "LENT" | "BORROWED"; // Type of debt relationship
  tags?: string;                 // Comma-separated tags
  notes?: string;                // Additional notes
  created_at: string;            // Creation timestamp
  updated_at: string;            // Last update timestamp
}
```

**Contacts Sheet Columns:**
```typescript
interface Contact {
  contact_id: number;            // Sequential numeric ID starting from 100
  name: string;                  // Person's name
  phone?: string;                // Optional phone number
  relationship?: string;         // Friend, Family, Colleague, etc.
  notes?: string;                // Additional info
  created_at: string;            // Creation timestamp
  updated_at: string;            // Last update timestamp
}
```

**Debts Sheet Columns:**
```typescript
interface Debt {
  debt_id: number;               // Sequential numeric ID starting from 100
  contact_id: number;            // References Contacts sheet
  contact_name: string;          // For easy reading
  type: "LENT" | "BORROWED";     // Money lent or borrowed
  original_amount: number;       // Original debt amount
  currency: string;              // Currency code
  current_balance: number;       // Remaining amount owed
  interest_rate?: number;        // Optional interest rate (default 0%)
  date_created: string;          // When debt was created
  due_date?: string;             // Optional due date
  description: string;           // Reason for debt
  status: "ACTIVE" | "PAID" | "CANCELLED"; // Current status
  created_at: string;            // Creation timestamp
  updated_at: string;            // Last update timestamp
}
```

**DebtHistory Sheet Columns:**
```typescript
interface DebtPayment {
  payment_id: number;            // Sequential numeric ID starting from 100
  debt_id: number;               // References Debts sheet
  contact_name: string;          // Person's name
  payment_amount: number;        // Amount paid
  payment_date: string;          // When payment was made
  payment_method?: string;       // How payment was made
  notes?: string;                // Payment notes
  new_balance: number;           // Balance after this payment
  created_at: string;            // Creation timestamp
}
```

**TempBills Sheet Columns:**
```typescript
interface TempBill {
  bill_id: number;               // Sequential numeric ID starting from 100 (primary key)
  user_id: string;               // Telegram user ID
  transaction_data: string;      // JSON string of BillRecord data
  guide_message_ids: string;     // JSON array of guide message IDs for cleanup [123, 124, 125]
  user_input_message_id?: number; // User's input message ID for cleanup
  original_message_id: number;   // The main transaction message to preserve
  created_at: string;            // Creation timestamp
  updated_at: string;            // Last update timestamp
}
```

**Clean Message Management**: The system tracks all temporary guide messages and user input messages for automatic cleanup, ensuring chat history remains clean with only final transaction results visible.

#### 1.3 Configuration Management
- **Authentication**: Service Account with Google Sheets API
- **Spreadsheet ID**: Configurable per user/deployment
- **Auto-sheet Creation**: Create yearly sheets as needed
- **Backup Strategy**: Regular data export capabilities

### 2. User Interface & Keyboard Design

#### 2.1 Keyboard Hierarchy Structure

The bot uses a dynamic inline keyboard system that adapts based on transaction type and user context:

```
📱 BILL PROCESSING KEYBOARDS
│
├── 🏠 PRIMARY KEYBOARDS (Transaction Type Based)
│   ├── 💸 Expense Keyboard
│   ├── 💰 Income Keyboard
│   ├── 🔄 Transfer Keyboard
│   ├── 🤝 Lend Keyboard
│   ├── 🙏 Borrow Keyboard
│   ├── 💳 Debt Payment Keyboard
│   └── 💵 Debt Received Keyboard
│
├── ✏️ FIELD EDIT KEYBOARDS
│   ├── 💰 Amount Edit
│   ├── 📅 Date Edit
│   ├── 🏷️ Transaction Type Selection
│   ├── 📂 Category Selection
│   ├── 💳 Account Selection
│   ├── 👤 Contact Selection
│   ├── 🔗 Debt Selection
│   └── ✏️ Manual Text Edit
│
├── 🔧 ACTION KEYBOARDS
│   ├── ✅ Confirmation
│   ├── ❌ Error/Retry
│   └── 📋 Summary/Review
│
└── 🔄 FLOW KEYBOARDS
    ├── 🆕 New Category Creation
    ├── 🆕 New Account Creation
    ├── 🆕 New Contact Creation
    └── 🔄 Re-calculation States
```

#### 2.2 Primary Keyboard Layouts

**Expense Transaction Keyboard:**
```
Message Text: 
💰 Amount: $25.50
📅 Date: Jan 15, 2024
📂 Category: Food
💳 Account: Main Card

---
MENU: 💸 Expense Transaction #100 👇

Keyboard:
┌─────────────────────────────────────────┐
│ 🏷️ Type: Expense                       │
├─────────────────────────────────────────┤
│ 💰 Amount: $25.50   📅 Date: Jan 15     │
├─────────────────────────────────────────┤
│ 📂 Category: Food                       │
├─────────────────────────────────────────┤
│ 💳 Account: Main Card                   │
├─────────────────────────────────────────┤
│ 📋 Copy ID: #100  ❌ Cancel  ✅ Submit  │
└─────────────────────────────────────────┘
```

**Transfer Transaction Keyboard:**
```
Message Text:
💰 Amount: $100.00
📅 Date: Jan 15, 2024
📤 From: Main Card
📥 To: Cash

---
MENU: 🔄 Transfer Transaction #101 👇

Keyboard:
┌─────────────────────────────────────────┐
│ 🏷️ Type: Transfer                      │
├─────────────────────────────────────────┤
│ 💰 Amount: $100.00   📅 Date: Jan 15    │
├─────────────────────────────────────────┤
│ 📤 From: Main Card   📥 To: Cash        │
├─────────────────────────────────────────┤
│ 💱 Rate: 1.0                            │
├─────────────────────────────────────────┤
│ 📋 Copy ID: #101  ❌ Cancel  ✅ Submit  │
└─────────────────────────────────────────┘
```

**Debt Management Keyboards:**
```
Message Text:
💰 Amount: $200.00
📅 Date: Jan 15, 2024
👤 Contact: John Smith
💳 Account: Main Card
📝 Purpose: Car Repair

---
MENU: 🤝 Lend Money Transaction #102 👇

Keyboard:
┌─────────────────────────────────────────┐
│ 🏷️ Type: Lend Money                    │
├─────────────────────────────────────────┤
│ 💰 Amount: $200.00   📅 Date: Jan 15    │
├─────────────────────────────────────────┤
│ 👤 Contact: John Smith                  │
├─────────────────────────────────────────┤
│ 💳 Account: Main Card                   │
├─────────────────────────────────────────┤
│ 📝 Purpose: Car Repair                  │
├─────────────────────────────────────────┤
│ 📋 Copy ID: #102  ❌ Cancel  ✅ Submit  │
└─────────────────────────────────────────┘
```

#### 2.3 Field Edit Keyboards

**Cancellation Confirmation:**
```
Message Text:
⚠️ Cancel Transaction #100?
      
This will permanently delete this transaction. This action cannot be undone.

---
MENU: Cancellation Confirmation 👇

Keyboard:
┌─────────────────────────────────────────┐
│ ✅ Yes, Cancel Transaction              │
├─────────────────────────────────────────┤
│ ← No, Go Back                           │
└─────────────────────────────────────────┘
```

**Transaction Type Selection:**
```
Message Text:
🔄 Change Transaction Type for #100

Keyboard:
┌─────────────────────────────────────────┐
│ 💸 Expense      💰 Income               │
├─────────────────────────────────────────┤
│ 🔄 Transfer     🤝 Lend Money           │
├─────────────────────────────────────────┤
│ 🙏 Borrow       💳 Debt Payment         │
├─────────────────────────────────────────┤
│ 💵 Debt Received                        │
├─────────────────────────────────────────┤
│ ← Back to Transaction                   │
└─────────────────────────────────────────┘
```

**Category Selection:**
```
Message Text:
📂 Select Category for Transaction #100

Keyboard:
┌─────────────────────────────────────────┐
│ 🍕 Food         🚗 Transport            │
├─────────────────────────────────────────┤
│ 🏠 Housing      💡 Utilities            │
├─────────────────────────────────────────┤
│ 👕 Shopping     🎬 Entertainment        │
├─────────────────────────────────────────┤
│ 🏥 Healthcare   📚 Education            │
├─────────────────────────────────────────┤
│ ➕ Create New Category                  │
├─────────────────────────────────────────┤
│ ← Back to Transaction                   │
└─────────────────────────────────────────┘
```

**Contact Selection:**
```
Message Text:
👤 Select Contact for Transaction #102
Current: John Smith → Choose contact:

Keyboard:
┌─────────────────────────────────────────┐
│ 👤 John Smith         👤 Sarah J.       │
├─────────────────────────────────────────┤
│ 👤 Mom                👤 Dad            │
├─────────────────────────────────────────┤
│ 👤 Mike Wilson        👤 Lisa Chen      │
├─────────────────────────────────────────┤
│ ➕ Add New Contact                      │
├─────────────────────────────────────────┤
│ ← Back to Transaction                   │
└─────────────────────────────────────────┘
```

#### 2.4 Enhanced Keyboard Design Principles

- **Values in Button Labels**: Transaction values are displayed directly in button labels for immediate visibility
- **Clean Message Titles**: Only menu titles are shown in message text, no detailed information
- **Interactive Buttons**: Each button shows current value and allows editing (e.g., "💰 Amount: $25.50")
- **Functional Buttons Only**: Every button performs an action - no decorative or informational buttons
- **Placeholder Messages**: Non-implemented buttons show helpful "Coming soon" or "Not implemented yet" messages
- **Consistent Navigation**: "← Back to Transaction" pattern for all sub-menus
- **Copy ID Integration**: "📋 Copy ID: #XXX" button included in main transaction keyboards
- **Logical Grouping**: Related actions grouped together (amount/date, accounts, etc.)
- **Real-time Updates**: Button labels update immediately when values change

#### 2.5 Placeholder Message System

For non-implemented features, the bot responds with helpful placeholder messages:

```typescript
// Placeholder message examples
const PLACEHOLDER_MESSAGES = {
  edit_details: "✨ Advanced editing features coming soon!\n\nFor now, you can:\n• Edit individual fields using the buttons\n• Use direct input: '100 new_value'\n• Re-calculate to refresh data",
  
  exchange_rate: "💱 Exchange rate editing not yet implemented\n\nCurrently using 1:1 rate. Advanced currency features coming in next update!",
  
  recurring: "🔄 Recurring transaction detection coming soon!\n\nFor now, manually add similar transactions.",
  
  analytics: "📊 Financial analytics dashboard coming soon!\n\nWill include spending trends, category breakdowns, and insights.",
  
  export: "📤 Data export features coming soon!\n\nWill support CSV, PDF, and Excel formats."
};
```

#### 2.6 Clean Input Collection Strategy

**Challenge**: Telegram bots are stateless, and guide messages create chat clutter that reduces user experience quality.

**Solution**: Clean Numeric ID-Based Input Collection - A stateless approach with automatic message cleanup for professional chat history.

**Implementation Flow:**
1. **User Interaction**: User clicks an edit button (e.g., "Edit Amount") on transaction keyboard
2. **Button State Update**: Bot updates keyboard to show "⏳ Amount being edited..."
3. **Input Request**: Bot sends guide message requesting input with numeric transaction ID:
   ```
   💰 Send the new amount for transaction #100
   
   Format: 100 [amount]
   Example: 100 150.75
   ```
4. **User Response**: User sends message containing transaction ID and new value: `100 150.75`
5. **Processing**: Bot parses message, extracts transaction ID, validates new value, updates transaction
6. **Cleanup**: Bot automatically deletes all guide messages and user's input message
7. **Refresh**: Bot updates original transaction keyboard with new data and restores full functionality

**Clean Message Management:**
- **Guide Message Tracking**: All instructional messages are tracked for deletion
- **User Input Cleanup**: User's input messages are automatically removed after processing
- **Preserved History**: Only final transaction results remain in chat history
- **Error Recovery**: Failed cleanup attempts are logged but don't block functionality

**Message Parsing Patterns:**
- Numeric ID format: `100 150.75` or `150.75 100`
- Regex extraction: `/^(\d{3,})\s+(.+)$/` for reliable ID detection
- Graceful error handling for invalid formats

**Error Handling:**
- Invalid transaction ID: "Transaction #999 not found. Use /pending to see active transactions"
- Missing value: "Please include the new amount: 100 25.50"
- Invalid format: "Format should be: 100 25.50"

**Advantages:**
- **Clean Chat History**: Only final results visible, professional appearance
- **Numeric IDs**: Easy to remember and type (#100, #101, #102...)
- **Stateless Design**: No persistent state storage required
- **Concurrent Safe**: Multiple users can edit different transactions simultaneously
- **Auto-Cleanup**: Temporary messages automatically removed
- **Professional UX**: Clean, uncluttered conversation flow

**Clean User Experience Example:**
```
User: [Clicks "Edit Amount" on transaction #100]
Bot: [Updates keyboard to show "⏳ Amount being edited..."]
     💰 Send the new amount for transaction #100  ← DELETED after input
     Format: 100 [amount]                         ← DELETED after input

User: 100 150.75                                  ← DELETED after processing
Bot: [Updated transaction keyboard with new amount - guide messages gone]

Final Chat History:
User: [Photo of receipt]
Bot: Transaction #100: $150.75 Food expense      ← Clean final result
     [Updated keyboard with all options]
```

### 3. Enhanced AI Processing

#### 3.1 Multi-modal Analysis
- **Image Processing**: Receipt/bill photo analysis
- **Text Processing**: Natural language bill descriptions
- **Caption Integration**: Use photo captions in analysis process
- **Debt Detection**: Recognize lending/borrowing language patterns

#### 3.2 Smart Categorization
- **Dynamic Categories**: Load from Google Sheets Categories tab
- **AI Suggestions**: Propose categories based on merchant/description
- **Fallback Handling**: "Other" category with user review prompt
- **Debt Classification**: Automatically detect and categorize debt transactions

#### 3.3 Enhanced Data Extraction
```typescript
interface EnhancedBillSchema {
  id: number;                      // Sequential numeric ID starting from 100
  bill_id: number;                 // Session management ID (matches TempBills)
  title: string;
  amount: number;
  currency_code: string;
  date: string;                    // ISO8601
  category: string;
  transaction_type: "expense" | "income" | "transfer" | "lend" | "borrow" | "debt_payment" | "debt_received";
  account: string;
  // Transfer/Exchange specific fields
  destination_account?: string;    // For transfers
  destination_amount?: number;     // For currency exchanges
  destination_currency?: string;   // For currency exchanges
  exchange_rate?: number;          // For currency exchanges
  // Debt-related fields (NEW)
  contact_id?: number;             // Links to Contacts sheet (numeric)
  contact_name?: string;           // Person's name for easy reading
  related_debt_id?: number;        // Links to active debt in Debts sheet (numeric)
  debt_type?: "LENT" | "BORROWED"; // Type of debt relationship
  // General fields
  payment_method?: string;
  merchant?: string;
  location?: string;
  tags: string[];
  confidence_score: number;
  description: string;
  original_text?: string;
}
```

#### 3.4 Debt Detection Patterns
The AI will recognize these natural language patterns:
```typescript
const debtPatterns = [
  /lent?\s+\$?(\d+(?:\.\d{2})?)\s+to\s+([A-Za-z\s]+)/i,           // "Lent $50 to John"
  /borrowed?\s+\$?(\d+(?:\.\d{2})?)\s+from\s+([A-Za-z\s]+)/i,     // "Borrowed $200 from Mom"
  /([A-Za-z\s]+)\s+paid\s+me\s+back\s+\$?(\d+(?:\.\d{2})?)/i,     // "John paid me back $25"
  /paid\s+([A-Za-z\s]+)\s+back\s+\$?(\d+(?:\.\d{2})?)/i,          // "Paid Mom back $100"
  /([A-Za-z\s]+)\s+owes?\s+me\s+\$?(\d+(?:\.\d{2})?)/i            // "Sarah owes me $30"
];
```

### 4. Financial Features

#### 4.1 Transaction Management
- **Multiple Accounts**: Support for various payment methods
- **Currency Handling**: Multi-currency support with conversion
- **Recurring Transactions**: Detect and manage recurring bills
- **Split Transactions**: Divide bills across categories
- **Debt Transactions**: Track lending and borrowing (NEW)

#### 4.2 Categories & Tags
- **Custom Categories**: User-defined categories for organization
- **Custom Tags**: User-defined tags for flexible organization
- **Spending Insights**: Category-based spending analysis

#### 4.3 Account Management
- **Account Types**: Cash, Checking, Credit Card, Digital Wallet
- **Balance Tracking**: Optional balance maintenance
- **Transfer Handling**: Inter-account transfer support

#### 4.4 Debt & Credit Management (NEW)
- **Personal Lending**: Track money lent to friends/family
- **Borrowing**: Track money borrowed from others
- **Payment Tracking**: Record payments and update balances
- **Contact Management**: Maintain lending relationship records
- **Interest Calculation**: Optional interest rate support
- **Payment History**: Complete audit trail of all debt payments

### 5. Configuration System

#### 5.1 System Configuration
```typescript
interface Config {
  user_preferences: {
    default_account: string;       // "Main Card"
    default_category: string;      // "Other"
    timezone: string;              // "UTC"
    date_format: string;           // "YYYY-MM-DD"
  };
  google_sheets: {
    spreadsheet_id: string;
    service_account_path: string;
    auto_create_yearly_sheets: boolean;
    backup_enabled: boolean;
  };
  ai_settings: {
    confidence_threshold: number;   // 0.8
    auto_submit_high_confidence: boolean;
  };
  debt_settings: {
    default_interest_rate: number; // 0% (NEW)
    payment_reminders: boolean;    // false (NEW)
  };
}
```

#### 5.2 User Customization
- **Personal Categories**: User-specific category management
- **Spending Limits**: Optional budget tracking
- **Notification Preferences**: Spending alerts and summaries
- **Debt Preferences**: Interest rates, payment reminders (NEW)

## User Stories

### Core User Stories

#### US1: Bill Processing
**As a user**, I want to use `/add` command followed by a photo or text to add a transaction, **so that** I can explicitly log my expenses without accidental processing.

**Acceptance Criteria:**
- `/add` command followed by photo processes the receipt
- `/add` command followed by text processes the bill description
- `/add` with photo + caption uses both for enhanced processing
- AI extracts amount, date, merchant, and suggests category
- User can review and modify before submission
- Data is saved to appropriate yearly Google Sheet

#### US2: Category Management
**As a user**, I want to modify suggested categories and create new ones, **so that** my expenses are organized according to my personal finance system.

**Acceptance Criteria:**
- Can select from existing categories via inline keyboard
- Can create new categories through bot conversation
- Categories are saved to Google Sheets Categories tab

#### US3: Multi-format Input
**As a user**, I want to input bills via `/add` command with various formats, **so that** I have flexibility in how I log my expenses.

**Acceptance Criteria:**
- `/add` + text: "/add Spent $15 on lunch at McDonald's"
- `/add` + photo: Upload receipt after /add command
- `/add` + photo + caption: Enhanced context for AI processing
- All formats produce consistent data structure

#### US4: Edit and Correct
**As a user**, I want to edit processed bill data before submission, **so that** I can ensure accuracy and add personal notes.

**Acceptance Criteria:**
- Inline keyboard for quick edits (category, type, account)
- Full edit mode for comprehensive changes
- Natural language edit commands
- Data validation prevents invalid entries

### Advanced User Stories

#### US5: Financial Insights
**As a user**, I want to view spending summaries and trends, **so that** I can understand my financial patterns.

**Acceptance Criteria:**
- Monthly/yearly spending summaries
- Category breakdown analysis
- Spending trend identification
- Export capabilities for external analysis

#### US6: Account Transfers
**As a user**, I want to transfer money from one account to another (e.g., card to cash), **so that** I can track money movement between my accounts.

**Acceptance Criteria:**
- Can select source and destination accounts
- Transfer amount is recorded for both accounts
- Transfer appears in transaction history with "transfer" type
- Supports text input like "Transfer $50 from card to cash"

#### US7: Currency Exchange
**As a user**, I want to exchange money from one currency to another, **so that** I can track currency conversions and foreign transactions.

**Acceptance Criteria:**
- Can specify source currency and amount
- Can specify destination currency and account
- Exchange rate is automatically calculated or manually entered
- Both source and destination transactions are recorded
- Supports text input like "Exchange $100 USD to EUR in cash"

#### US8: Sheet Initialization
**As a user**, I want to use `/init` command to set up a new Google Sheets workbook, **so that** I can quickly configure my personal finance tracking system.

**Acceptance Criteria:**
- `/init` command creates a new Google Sheets workbook
- Sets up required sheets: Config, Categories, Accounts, Bills_2024, Dashboard, TempBills, Contacts, Debts, DebtHistory
- Populates default categories and accounts
- Provides the user with the Spreadsheet ID to configure
- Guides user through basic setup process

#### US9: Clean Session Management
**As a user**, I want to reference and modify specific bills using clean numeric IDs, **so that** I can edit transactions later with a professional, uncluttered chat experience.

**Acceptance Criteria:**
- Each processed bill shows a unique numeric ID (#100, #101, etc.) and "Copy ID" button
- User can provide bill ID to edit: "Edit bill 100" or "100 new_amount"
- Unconfirmed bills are stored in TempBills sheet temporarily with numeric IDs
- Bills are removed from TempBills when submitted or cancelled
- All guide messages and user input are automatically cleaned up
- Chat history shows only final transaction results
- User can list pending bills: "/pending" shows clean list with numeric IDs

#### US10: Recurring Transaction Detection
**As a user**, I want the system to detect recurring transactions, **so that** I can automate regular expense logging.

**Acceptance Criteria:**
- AI identifies similar transactions over time
- Suggests automatic categorization for recurring items
- Optional auto-submission for high-confidence recurring transactions

### Debt & Credit User Stories (NEW)

#### US11: Lending Money
**As a user**, I want to record when I lend money to someone, **so that** I can track who owes me money and manage my credits.

**Acceptance Criteria:**
- Can use `/lend` command or natural language: "Lent $50 to John"
- AI detects lending transactions automatically from text
- Creates contact record if person doesn't exist
- Records debt in Debts sheet with LENT type
- Shows summary and confirmation before saving
- Updates person's total debt balance

#### US12: Borrowing Money
**As a user**, I want to record when I borrow money from someone, **so that** I can track what I owe and manage repayments.

**Acceptance Criteria:**
- Can use `/borrow` command or natural language: "Borrowed $200 from Mom"
- AI detects borrowing transactions automatically from text
- Creates contact record if person doesn't exist
- Records debt in Debts sheet with BORROWED type
- Shows summary and confirmation before saving
- Tracks due dates and interest if applicable

#### US13: Debt Payments
**As a user**, I want to record when someone pays me back or when I pay someone back, **so that** I can track debt balances and payment history.

**Acceptance Criteria:**
- Can use `/pay` command or natural language: "John paid me back $50"
- Shows list of active debts for quick selection
- Updates debt balance automatically in Debts sheet
- Records payment history in DebtHistory sheet
- Marks debt as PAID when balance reaches zero
- Supports partial payments with remaining balance tracking

#### US14: Debt Overview
**As a user**, I want to see all my active debts and credits, **so that** I can understand my lending relationships and outstanding balances.

**Acceptance Criteria:**
- `/debts` command shows summary of all active debts
- Separates money lent (credits) from money borrowed (debts)
- Shows current balances and original amounts
- Displays total amounts owed to you and by you
- Provides quick actions for recording payments
- Shows payment history for each debt

#### US15: Contact Management
**As a user**, I want to manage my lending contacts, **so that** I can maintain clean records of people I do financial business with.

**Acceptance Criteria:**
- `/contacts` command shows all lending contacts
- Can add/edit contact information (name, phone, relationship)
- Shows total debt/credit balance per contact
- Can view complete lending history with each contact
- Can add notes about lending relationships

## Technical Implementation Details

### 6.0 Numeric ID System & Message Cleanup

#### 6.0.1 ID Management System
```typescript
// src/managers/id-manager.ts
class IDManager {
  private static async getNextBillID(): Promise<number> {
    // Check TempBills and Bills_YYYY sheets for highest existing ID
    const currentYear = new Date().getFullYear();
    const billsSheet = `Bills_${currentYear}`;
    
    const [tempBillsResponse, billsResponse] = await Promise.all([
      googleSheets.getRange('TempBills!A:A'),
      googleSheets.getRange(`${billsSheet}!A:A`)
    ]);
    
    let maxId = 99; // Start from 99 so next ID is 100
    
    // Check existing IDs in both sheets
    [tempBillsResponse, billsResponse].forEach(response => {
      response.values?.forEach(row => {
        const id = parseInt(row[0]);
        if (!isNaN(id) && id > maxId) {
          maxId = id;
        }
      });
    });
    
    return maxId + 1;
  }
  
  static async generateBillID(): Promise<number> {
    return await this.getNextBillID();
  }
}
```

#### 6.0.2 Message Cleanup System
```typescript
// src/utils/message-cleanup.ts
interface MessageTracker {
  billId: number;
  guideMessages: number[];          // All guide message IDs to cleanup
  userInputMessageId?: number;      // User's input message to cleanup
  originalTransactionMessageId: number; // The main transaction message to keep
}

class MessageCleanupManager {
  private static messageTracker = new Map<number, MessageTracker>();
  
  static trackMessages(billId: number, tracker: MessageTracker) {
    this.messageTracker.set(billId, tracker);
  }
  
  static async cleanupMessages(billId: number, bot: any, chatId: string) {
    const tracker = this.messageTracker.get(billId);
    if (!tracker) return;
    
    // Delete all guide messages
    for (const messageId of tracker.guideMessages) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.warn(`Could not delete guide message ${messageId}:`, error);
      }
    }
    
    // Delete user input message if exists
    if (tracker.userInputMessageId) {
      try {
        await bot.deleteMessage(chatId, tracker.userInputMessageId);
      } catch (error) {
        console.warn(`Could not delete user input message:`, error);
      }
    }
    
    // Remove from tracker
    this.messageTracker.delete(billId);
  }
}
```

#### 6.0.3 Enhanced Message Handler for Numeric Input
```typescript
// Updated src/events/message-handler.ts
async function handleInputMessage(msg: any, bot: any) {
  const text = msg.text;
  const chatId = msg.chat.id;
  
  // Check if message contains numeric ID format: "100 25.50"
  const inputMatch = text.match(/^(\d{3,})\s+(.+)$/);
  
  if (inputMatch) {
    const billId = parseInt(inputMatch[1]);
    const inputValue = inputMatch[2].trim();
    
    // Track user's input message for cleanup
    const tracker = MessageCleanupManager.getTracker(billId);
    if (tracker) {
      tracker.userInputMessageId = msg.message_id;
      MessageCleanupManager.trackMessages(billId, tracker);
    }
    
    // Process the input
    const success = await processFieldUpdate(billId, inputValue, bot, chatId);
    
    if (success) {
      // Clean up all guide messages and user input
      await MessageCleanupManager.cleanupMessages(billId, bot, chatId);
      
      // Update transaction keyboard with new data
      await refreshTransactionKeyboard(billId, bot, chatId);
    }
    
    return; // Don't process as regular message
  }
  
  // Handle regular messages (existing logic)
  // ...
}
```

#### 6.0.4 Clean Keyboard Implementation
```typescript
// Updated src/keyboards/bill-keyboards.ts
function createTransactionKeyboard(billId: number, transactionData: any) {
  return {
    inline_keyboard: [
      [
        { text: "💰 Edit Amount", callback_data: `edit_amount_${billId}` },
        { text: "📅 Edit Date", callback_data: `edit_date_${billId}` }
      ],
      [
        { text: "📂 Change Category", callback_data: `edit_category_${billId}` }
      ],
      [
        { text: "💳 Change Account", callback_data: `edit_account_${billId}` }
      ],
      [
        { text: "🏷️ Change Type", callback_data: `edit_type_${billId}` },
        { text: "🔄 Re-Calculate", callback_data: `recalculate_${billId}` }
      ],
      [
        { text: `📋 Copy ID: #${billId}`, callback_data: `copy_id_${billId}` },
        { text: "✅ Submit", callback_data: `submit_${billId}` }
      ]
    ]
  };
}

// Message text generation
function generateTransactionMessage(billId: number, transactionData: any): string {
  const typeEmoji = getTransactionTypeEmoji(transactionData.type);
  const typeName = getTransactionTypeName(transactionData.type);
  
  return `${typeEmoji} ${typeName} Transaction #${billId}
💰 Amount: $${transactionData.amount} | 📅 Date: ${transactionData.date}
📂 Category: ${transactionData.category} | 💳 Account: ${transactionData.account}`;
}

// Placeholder message handler
function handlePlaceholderButton(callback_data: string): string {
  const PLACEHOLDER_MESSAGES = {
    edit_details: "✨ Advanced editing features coming soon!\n\nFor now, you can:\n• Edit individual fields using the buttons\n• Use direct input: '100 new_value'\n• Re-calculate to refresh data",
    
    exchange_rate: "💱 Exchange rate editing not yet implemented\n\nCurrently using 1:1 rate. Advanced currency features coming in next update!",
    
    recurring: "🔄 Recurring transaction detection coming soon!\n\nFor now, manually add similar transactions.",
    
    analytics: "📊 Financial analytics dashboard coming soon!\n\nWill include spending trends, category breakdowns, and insights.",
    
    export: "📤 Data export features coming soon!\n\nWill support CSV, PDF, and Excel formats."
  };
  
  return PLACEHOLDER_MESSAGES[callback_data] || "🚧 This feature is not yet implemented.\n\nStay tuned for updates!";
}
```

## Technical Requirements

### 6.1 Dependencies
```json
{
  "dependencies": {
    "node-telegram-bot-api": "^0.66.0",
    "googleapis": "^134.0.0",
    "langchain": "^0.3.11",
    "@langchain/openai": "^0.2.0",
    "zod": "^3.22.0",
    "zod-to-json-schema": "^3.24.1",
    "moment": "^2.29.4",
    "uuid": "^9.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/node-telegram-bot-api": "^0.64.0"
  }
}
```

### 6.2 Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegram Bot  │◄──►│   Main App       │◄──►│  Google Sheets  │
│                 │    │   (index.ts)     │    │   Adapter       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
            ┌─────────────────┐  ┌─────────────────┐
            │   AI Chains     │  │  Configuration  │
            │ (text/vision)   │  │   Manager       │
            └─────────────────┘  └─────────────────┘
                                         │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                    ┌─────────────────┐  ┌─────────────────┐
                    │  Debt Manager   │  │  Contact        │
                    │   (NEW)         │  │  Manager (NEW)  │
                    └─────────────────┘  └─────────────────┘
```

### 6.3 File Structure (✅ IMPLEMENTED with TypeScript)
```
├── src/
│   ├── index.ts                     # Clean main entry point
│   ├── text-chain.ts               # Text processing AI chain
│   ├── vision-chain.ts             # Image processing AI chain
│   ├── adapters/
│   │   ├── google-sheets.ts         # Google Sheets integration
│   │   └── notion-adapter.ts       # Legacy Notion (for migration)
│   ├── events/
│   │   ├── commands/
│   │   │   ├── init-command.ts      # /init command handler
│   │   │   ├── help-command.ts      # /help command handler
│   │   │   ├── pending-command.ts   # /pending command handler (NEW)
│   │   │   ├── lend-command.ts      # /lend command handler (NEW)
│   │   │   ├── borrow-command.ts    # /borrow command handler (NEW)
│   │   │   ├── pay-command.ts       # /pay command handler (NEW)
│   │   │   ├── debts-command.ts     # /debts command handler (NEW)
│   │   │   └── contacts-command.ts  # /contacts command handler (NEW)
│   │   ├── message-handler.ts       # Photo/text + numeric ID input processing
│   │   └── callback-handler.ts      # Inline keyboard interactions
│   ├── managers/
│   │   ├── debt-manager.ts          # Debt tracking logic (NEW)
│   │   ├── contact-manager.ts       # Contact management (NEW)
│   │   └── id-manager.ts            # Numeric ID generation (NEW)
│   ├── utils/
│   │   ├── helpers.ts              # editTextMessage + BILL_REPLY_MARKUP
│   │   ├── receipt-processor.ts    # getReceiptDetail function
│   │   └── message-cleanup.ts      # Auto message cleanup system (NEW)
│   ├── types/
│   │   ├── bill.types.ts           # Bill and transaction types (updated with numeric IDs)
│   │   ├── debt.types.ts           # Debt and contact types (NEW)
│   │   └── config.types.ts         # Configuration types
│   └── keyboards/
│       ├── bill-keyboards.ts       # Bill processing keyboards (with numeric IDs)
│       └── debt-keyboards.ts       # Debt management keyboards (NEW)
├── config/ (planned)
└── docs/ (planned)
```

## Implementation Phases
*Each phase builds upon keyboard layouts as the system architecture foundation*

### Phase 1: Foundation & Basic Keyboards ✅ COMPLETED
**Deliverable**: Basic bot with Google Sheets integration and simple keyboard

**Keyboard Focus**: Basic confirmation keyboard for processed bills
```
┌─────────────────────────────────────────┐
│ Bill: $25.50 Food from Main Card       │
├─────────────────────────────────────────┤
│              ✅ Save Bill               │
└─────────────────────────────────────────┘
```

**Implementation Tasks**:
- [x] Google Sheets adapter and authentication
- [x] Modular TypeScript architecture (src/events/, src/utils/, etc.)
- [x] Basic photo/text processing with AI chains
- [x] Simple confirmation keyboard implementation
- [x] Direct save to Bills_2024 sheet

**Status**: ✅ **COMPLETE**

---

## 🚀 **CURRENT IMPLEMENTATION STATUS (Updated)**

### **✅ Phase 2 - COMPLETED & READY FOR USE**
**What's Working Now:**
- 💸 **Expense Transactions** - Full keyboard, category/account selection
- 💰 **Income Transactions** - Full keyboard, source account management  
- 🔄 **Transfer Transactions** - Full keyboard, multi-account transfers
- 📋 **TempBills System** - Transaction data persistence during editing
- 🔢 **Numeric ID System** - Sequential transaction IDs starting from 100
- 📞 **/pending Command** - List all active temporary bills
- 🔄 **Data Persistence** - Account/type switching preserves all data
- 🚫 **Debt Types Disabled** - Properly commented out until Phase 5

### **✅ Phase 3 - COMPLETED: Yearly Sheet Integration & Edit Flow**
**Achievements:**
- ✅ **Submit to Yearly Sheets** - Move completed bills from TempBills to Bills_YYYY
- ✅ **Simplified Edit Interface** - Submitted bills show only "Edit" button
- ✅ **Edit-Resubmit Cycle** - Clean edit workflow with message tracking
- ✅ **Enhanced Message Cleanup** - Professional chat history maintenance

### **🎯 Phase 4 - NEXT: Transfer & Exchange Keyboards**
**Objectives:**
- 🔄 **Enhanced Transfer Features** - Improve transfer keyboard functionality
- 💱 **Currency Exchange** - Multi-currency support with exchange rates
- 🧮 **Advanced Calculations** - Auto-calculation features
- 🔧 **Polish & Optimization** - Performance improvements and bug fixes

**Current Transaction Types Available:**
| Type            | Status        | Features                                    |
| --------------- | ------------- | ------------------------------------------- |
| 💸 Expense       | ✅ **Active**  | Amount, Date, Category, Account selection   |
| 💰 Income        | ✅ **Active**  | Amount, Date, Source account selection      |
| 🔄 Transfer      | ✅ **Active**  | Amount, From/To accounts, exchange rates    |
| 🤝 Lend Money    | 🚧 **Phase 5** | Disabled - Proper contact management needed |
| 🙏 Borrow Money  | 🚧 **Phase 5** | Disabled - Debt tracking system needed      |
| 💳 Debt Payment  | 🚧 **Phase 5** | Disabled - Payment history needed           |
| 💵 Debt Received | 🚧 **Phase 5** | Disabled - Lending relationship needed      |

---

### Phase 2: Command Structure & Primary Keyboards ✅ COMPLETED
**Deliverable**: `/add` command with enhanced transaction keyboards and TempBills system

**Keyboard Focus**: Full primary keyboards for implemented transaction types
```
🎯 TARGET KEYBOARDS:
├── 💸 Expense Keyboard (Amount, Date, Category, Account)
├── 💰 Income Keyboard (Amount, Date, Source Account)
├── 🔄 Transfer Keyboard (Amount, From/To Accounts, Exchange Rate)
└── 🏷️ Transaction Type Selection (Expense, Income, Transfer)
```

**Implementation Tasks**:
- [x] Implement `/add` command handler (src/events/commands/add-command.ts)
- [x] Create primary keyboard layouts (src/keyboards/bill-keyboards.ts)
- [x] Update message processing to require `/add` command
- [x] Implement Categories and Accounts sheets in `/init`
- [x] Add keyboard callback handling (src/events/callback-handler.ts)
- [x] Update AI chains with enhanced bill schema
- [x] **NEW**: Implement numeric ID system starting from 100 (src/managers/id-manager.ts)
- [x] **NEW**: Implement TempBills system with transaction data persistence
- [x] **NEW**: Add `/pending` command to list active temporary bills
- [x] **NEW**: Fix transaction data loss during account/type switching
- [x] **NEW**: Comment out debt transaction types until Phase 5 implementation

**Test Checklist**:
```
✅ Manual Test Checklist - Phase 2
┌────────────────────────────────────────┐
│ Test 1: Command Structure              │
├────────────────────────────────────────┤
│ ✅ Send photo without /add → Bot ignores│
│ ✅ Send /add → Bot prompts for input    │
│ ✅ Send /add + photo → Shows keyboard   │
│ ✅ Send /add + text → Shows keyboard    │
│                                        │
│ Test 2: Transaction Keyboards          │
├────────────────────────────────────────┤
│ ✅ Expense keyboard displays correctly  │
│ ✅ Income keyboard displays correctly   │
│ ✅ Transfer keyboard displays correctly │
│ ✅ Transaction type switching works     │
│ ✅ Category selection shows options     │
│ ✅ Account selection shows options      │
│                                        │
│ Test 3: TempBills System               │
├────────────────────────────────────────┤
│ ✅ Transaction data persists on changes │
│ ✅ Account switching preserves amount   │
│ ✅ Type switching preserves all data    │
│ ✅ Category switching preserves data    │
│ ✅ /pending command lists active bills  │
│ ✅ Transaction cancellation works       │
│                                        │
│ Test 4: Numeric ID System              │
├────────────────────────────────────────┤
│ ✅ Transaction IDs start from 100       │
│ ✅ IDs are sequential (100, 101, 102...)│
│ ✅ Copy ID button shows correct ID      │
│ ✅ Message shows "Transaction #100"     │
│ ✅ IDs persist across bot restarts      │
│                                        │
│ Test 5: Google Sheets Integration      │
├────────────────────────────────────────┤
│ ✅ Categories sheet has default data    │
│ ✅ Accounts sheet has default data      │
│ ✅ TempBills sheet structure correct    │
│ ✅ All required fields populated        │
│ ✅ Numeric IDs saved correctly in sheet │
│                                        │
│ Test 6: Debt Types (Commented Out)     │
├────────────────────────────────────────┤
│ ✅ Debt transaction buttons hidden      │
│ ✅ Only Expense/Income/Transfer visible │
│ ✅ No "Type: Expense" for debt types    │
│ ✅ Proper Phase 5 placeholder messages  │
└────────────────────────────────────────┘
```

### Phase 3: Yearly Sheet Integration & Edit Flow
**Deliverable**: Seamless transition from TempBills to yearly sheets with simplified edit workflow

**Core Changes from Phase 2**:
- ✅ **Phase 2 Complete**: TempBills system, numeric IDs, transaction keyboards working
- 🎯 **New Goal**: Move submitted bills to yearly sheets with clean edit workflow

**Implementation Focus**: Post-submission workflow and bill editing system
```
🎯 PHASE 3 WORKFLOW:
├── 📊 Yearly Sheet Integration
│   ├── Submit → Move from TempBills to Bills_YYYY
│   ├── Clean up all temporary messages
│   └── Show simplified submitted bill message
│
├── ✏️ Simplified Edit Interface  
│   ├── Submitted bill shows only "Edit" button
│   ├── Edit → Copy back to TempBills with same ID
│   └── Show full edit keyboards again
│
└── 🔄 Edit-Resubmit Cycle
    ├── Track all edit-related messages
    ├── Resubmit → Replace in yearly sheet
    └── Clean up all edit messages, update original
```

**Yearly Sheet Integration Tasks**:
- [x] Implement bill submission to yearly sheets (Bills_2024, Bills_2025, etc.)
- [x] Auto-create yearly sheets if they don't exist
- [x] Remove bills from TempBills after successful submission to yearly sheet
- [x] Update message format for submitted bills (simplified keyboard)

**Simplified Submitted Bill Interface**:
```
Message Text (Post-Submission):
✅ Expense #100 | $25.50 | Food | Main Card | Jan 15, 2024

Keyboard:
┌─────────────────────────────────────────┐
│ ✏️ Edit Transaction                     │
└─────────────────────────────────────────┘
```

**Edit Workflow Implementation**:
- [x] Create edit flow that copies submitted bill back to TempBills with same ID
- [x] Show full edit keyboards again when editing submitted bills
- [x] Track all edit-related messages for cleanup
- [x] Implement replace logic for yearly sheet updates
- [x] Ensure original message updates (no new messages created)

**Message Tracking System**:
```typescript
interface EditMessageTracker {
  billId: number;                      // Same ID as original bill
  originalMessageId: number;           // The submitted bill message to update
  editGuideMessages: number[];         // All edit instruction messages
  editInputMessages: number[];         // User's edit input messages
  isEditing: boolean;                  // Currently being edited flag
}
```

**Edit Flow Sequence**:
1. **User clicks "Edit" on submitted bill #100**
   - Copy bill data from Bills_2024 to TempBills with same ID
   - Update message to show full edit keyboards
   - Track original message ID for updates

2. **User edits fields using existing Phase 2 keyboards**
   - All Phase 2 edit functionality works as before
   - Track all edit guide messages and user inputs

3. **User resubmits edited bill**
   - Replace original record in Bills_2024
   - Remove from TempBills
   - Update original message back to simplified format
   - Clean up ALL edit-related messages

**Concurrent Edit Protection**:
- [x] Check if bill is already being edited before allowing edit
- [x] Show appropriate message if bill is currently being edited
- [x] Clear editing flag after submission or cancellation

**Implementation Tasks**:
```typescript
// New functions to implement:

1. submitBillToYearlySheet(billId: number)
   - Move data from TempBills to Bills_YYYY
   - Remove from TempBills
   - Update message format to simplified version

2. startEditFlow(billId: number, messageId: number)
   - Copy from Bills_YYYY back to TempBills
   - Show full edit keyboards
   - Track editing state and messages

3. resubmitEditedBill(billId: number)
   - Replace record in Bills_YYYY
   - Remove from TempBills
   - Update original message
   - Clean up all edit messages

4. cleanupEditMessages(billId: number)
   - Delete all tracked edit guide messages
   - Delete all tracked user input messages
   - Reset tracking state
```

**Test Checklist**:
```
✅ Manual Test Checklist - Phase 3
┌────────────────────────────────────────┐
│ Test 1: Yearly Sheet Integration       │
├────────────────────────────────────────┤
│ ✅ Submit moves bill from TempBills to Bills_2024 │
│ ✅ Auto-creates Bills_2025 if needed (year change) │
│ ✅ Submitted bill shows simplified keyboard │
│ ✅ Original complex edit keyboard disappears │
│ ✅ All temporary messages cleaned up on submit │
│                                        │
│ Test 2: Simplified Submitted Interface │
├────────────────────────────────────────┤
│ ✅ Submitted bill shows: "✅ Expense #100..." │
│ ✅ Only "✏️ Edit Transaction" button visible │
│ ✅ Copy ID button removed (not needed) │
│ ✅ No category/account/amount buttons visible │
│ ✅ Message format clean and readable    │
│                                        │
│ Test 3: Edit Flow                      │
├────────────────────────────────────────┤
│ ✅ Click "Edit" → Bill copied back to TempBills │
│ ✅ Full edit keyboards appear again     │
│ ✅ All original Phase 2 edit functions work │
│ ✅ Bill ID remains the same (#100)     │
│ ✅ Edit tracking system records messages │
│                                        │
│ Test 4: Resubmit Flow                  │
├────────────────────────────────────────┤
│ ✅ Resubmit → Replaces original in Bills_2024 │
│ ✅ Original message updates (same message) │
│ ✅ Returns to simplified keyboard format │
│ ✅ All edit messages automatically deleted │
│ ✅ Chat history shows only final result │
│                                        │
│ Test 5: Message Cleanup & History      │
├────────────────────────────────────────┤
│ ✅ Only final bill result visible in chat │
│ ✅ No leftover guide messages          │
│ ✅ No leftover user input messages     │
│ ✅ Clean professional chat appearance  │
│ ✅ Edit history not cluttering chat    │
│                                        │
│ Test 6: Concurrent Edit Protection     │
├────────────────────────────────────────┤
│ ✅ Cannot edit bill already being edited │
│ ✅ Appropriate message shown if blocked │
│ ✅ Edit lock cleared after submission  │
│ ✅ Edit lock cleared after cancellation │
│ ✅ Multiple users can edit different bills │
│                                        │
│ Test 7: Data Integrity                │
├────────────────────────────────────────┤
│ ✅ No data loss during edit cycle      │
│ ✅ Yearly sheet data matches TempBills │
│ ✅ Bill replacement works correctly    │
│ ✅ IDs remain consistent throughout    │
│ ✅ All required fields preserved       │
└────────────────────────────────────────┘
```

**Example Edit Flow**:
```
Initial State (After Phase 2 submission):
User: [Photo of receipt]
Bot: ✅ Expense #100 | $25.50 | Food | Main Card | Jan 15, 2024
     [✏️ Edit Transaction]

Edit Cycle:
User: [Clicks "✏️ Edit Transaction"]
Bot: 💰 Amount: $25.50                     ← Same message updated
     📅 Date: Jan 15, 2024
     📂 Category: Food  
     💳 Account: Main Card
     
     ---
     MENU: 💸 Expense Transaction #100 👇   ← Full keyboards back
     [All Phase 2 edit buttons available]

User: [Edits amount to $30.00 using Phase 2 system]
Bot: [Edit guide messages...]               ← TRACKED for cleanup
User: 100 30.00                           ← TRACKED for cleanup  
Bot: [Updated edit keyboard with $30.00]

User: [Clicks "✅ Submit"]
Bot: ✅ Expense #100 | $30.00 | Food | Main Card | Jan 15, 2024  ← SAME MESSAGE
     [✏️ Edit Transaction]                  ← Back to simple
     
Final Chat History (All edit messages cleaned up):
User: [Photo of receipt]
Bot: ✅ Expense #100 | $30.00 | Food | Main Card | Jan 15, 2024
     [✏️ Edit Transaction]
```

**Files to Modify**:
- `src/events/callback-handler.ts` - Add edit flow and resubmit logic
- `src/adapters/google-sheets.ts` - Add yearly sheet operations
- `src/keyboards/bill-keyboards.ts` - Add simplified submitted bill keyboard
- `src/utils/message-cleanup.ts` - Enhance for edit message tracking
- `src/managers/bill-manager.ts` - Add edit cycle management (new file)

**Key Phase 3 Principles**:
- **One Source of Truth**: Yearly sheets contain final data, TempBills is temporary workspace
- **Clean Chat History**: Only final bill results visible, all edit artifacts removed
- **Same Message Updates**: No message proliferation, original message gets updated
- **Seamless Edit Cycle**: Edit feels natural, like re-opening the original transaction

### Phase 4: Transfer Enhancement & Currency Exchange
**Deliverable**: Enhanced transfer functionality with currency exchange and optional fees

**Scope Refinement**: Current transfer keyboard is functional - focus on enhancement and multi-currency support
```
🎯 PHASE 4 OBJECTIVES:
├── 🔄 Enhanced Transfer Features (Optional transfer fees)
├── 💱 Currency Exchange Support (User-provided exchange rates)
├── 🔧 Transfer Polish & Optimization (Better UX and validation)
└── 📊 Multi-Currency Display (Clear source/destination amounts)
```

**Core Features**:
- **✅ Keep Current Transfer Keyboard** - Basic functionality working well
- **➕ Add Optional Transfer Fees** - Additional cost field for transfer charges
- **💱 Multi-Currency Transfers** - USD account → EUR account with exchange rates
- **📊 Enhanced Display** - Clear visualization of both currencies and amounts
- **🔧 Polish & Validation** - Better error handling and user experience

**Implementation Tasks**:
- [ ] Add optional transfer fee field to transfer transactions
- [x] Enhance currency exchange visualization in transfer keyboard
- [x] Improve transfer message display to show both source and destination clearly
- [ ] Add validation for currency exchange rates (user-provided)
- [x] Polish transfer keyboard UX and error messages
- [ ] Update transfer data schema to properly handle fees
- [ ] Use currency codes beside account labels in keyboards (e.g., "Main Card (USD)", "Euro Cash (EUR)")
- [ ] Test multi-currency transfer scenarios

**Transfer Enhancement Examples**:
```typescript
// Enhanced Transfer Display:
📤 From: $100.00 USD (Main Card)
📥 To: €85.00 EUR (Euro Cash)
💱 Rate: 1.18 USD/EUR
💸 Fee: $3.00 USD
💰 Total Deducted: $103.00 USD

// Account Selection with Currency Codes:
┌─────────────────────────────────────────┐
│ 📤 From Account:                        │
│ 💳 Main Card (USD)    💳 Business (USD) │
│ 🏦 Savings (USD)      💰 Euro Cash (EUR)│
│ 🇬🇧 UK Account (GBP)  🇯🇵 Yen Card (JPY)│
└─────────────────────────────────────────┘

// Optional Fee Scenarios:
- Bank transfer fees
- ATM withdrawal charges  
- Currency exchange fees
- Wire transfer costs
```

**Key Implementation Notes**:
- **Transfer fees are optional** - Most transfers won't have fees
- **User provides exchange rates** - No API integration needed
- **Account-to-account only** - Transfers are between user's own accounts
- **Fees deducted from source** - Fee amount reduces source account by fee + transfer amount
- **Dashboard calculations later** - No complex balance tracking in Phase 4

**Test Checklist**:
```
🧪 Manual Test Checklist - Phase 4
┌────────────────────────────────────────┐
│ Test 1: Enhanced Transfer Display       │
├────────────────────────────────────────┤
│ [ ] Transfer shows clear From/To amounts │
│ [ ] Currency symbols display correctly  │
│ [ ] Exchange rate field editable        │
│ [ ] Destination amount calculated properly │
│ [ ] Multi-currency keyboard layout clean │
│                                        │
│ Test 2: Optional Transfer Fees         │
├────────────────────────────────────────┤
│ [ ] Fee field is optional (can be empty) │
│ [ ] Fee amount added to total deducted  │
│ [ ] Transfer with fee saves correctly   │
│ [ ] Transfer without fee works normally │
│ [ ] Fee calculation shown in summary    │
│                                        │
│ Test 3: Currency Exchange              │
├────────────────────────────────────────┤
│ [ ] User can input custom exchange rate │
│ [ ] Rate validation prevents invalid values │
│ [ ] Multi-currency accounts supported  │
│ [ ] Exchange calculation accurate       │
│ [ ] Both currencies saved to sheet     │
│                                        │
│ Test 4: Transfer Polish & UX          │
├────────────────────────────────────────┤
│ [ ] Error messages helpful and clear   │
│ [ ] Transfer validation prevents errors │
│ [ ] Keyboard navigation smooth         │
│ [ ] Edit flow works for all transfer fields │
│ [ ] Transfer submission reliable        │
│                                        │
│ Test 5: Data Integrity                │
├────────────────────────────────────────┤
│ [ ] All transfer fields saved correctly │
│ [ ] Fee data preserved in Google Sheets │
│ [ ] Exchange rate data accurate        │
│ [ ] No data loss during edit cycles    │
│ [ ] Transfer IDs consistent with system │
│                                        │
│ Test 6: Multi-Currency Scenarios      │
├────────────────────────────────────────┤
│ [ ] USD → EUR transfer with fee works  │
│ [ ] Same currency transfer (no exchange) │
│ [ ] Complex exchange rates (e.g., 1.234) │
│ [ ] Large amounts formatted correctly  │
│ [ ] Multiple currency accounts supported │
└────────────────────────────────────────┘
```

**Example Enhanced Transfer Flow**:
```
User: /add Transfer $100 from card to euro cash
Bot: 📤 From: $100.00 USD (Main Card)
     📥 To: €0.00 EUR (Euro Cash)
     💱 Rate: 1.0 USD/EUR
     💸 Fee: (none)
     
     ---
     MENU: 🔄 Transfer Transaction #100 👇
     
     [📤 From: Main Card (USD)    📥 To: Euro Cash (EUR)]
     [💱 Rate: 1.0   💸 Add Fee   🔄 Re-Calculate]

User: [Clicks "💱 Edit Rate"]
Bot: 💱 Send the exchange rate for transaction #100  ← AUTO-DELETED
     Format: 100 1.18                               ← AUTO-DELETED

User: 100 1.18                                      ← AUTO-DELETED
Bot: 📤 From: $100.00 USD (Main Card)                ← Updated display
     📥 To: €84.75 EUR (Euro Cash)                   ← Auto-calculated
     💱 Rate: 1.18 USD/EUR
     💸 Fee: (none)

User: [Clicks "💸 Add Fee"]
Bot: 💸 Send the transfer fee for transaction #100   ← AUTO-DELETED
User: 100 3.00                                      ← AUTO-DELETED
Bot: 📤 From: $100.00 USD (Main Card)
     📥 To: €84.75 EUR (Euro Cash)
     💱 Rate: 1.18 USD/EUR
     💸 Fee: $3.00 USD
     💰 Total Deducted: $103.00 USD

Final Result: Clean transfer with proper currency handling and optional fees
```

### Phase 5: Debt Management Keyboards
**Deliverable**: Complete personal debt tracking with specialized keyboards

**Keyboard Focus**: Debt and contact management keyboards
```
🎯 TARGET KEYBOARDS:
├── 🤝 Lend Money Keyboard (Contact, Amount, Purpose)
├── 🙏 Borrow Money Keyboard (Contact, Amount, Terms)
├── 💳 Debt Payment Keyboard (Debt Selection, Payment Amount)
├── 👤 Contact Management Keyboard (Add/Edit Contacts)
└── 📊 Debt Overview Keyboard (Summary, Quick Actions)
```

**Implementation Tasks**:
- [ ] Add Contacts, Debts, DebtHistory sheets to `/init`
- [ ] Create debt-related TypeScript types (debt.types.ts)
- [ ] **Uncomment debt transaction types** in callback-handler.ts and bill-keyboards.ts
- [ ] Implement proper debt transaction keyboards (createLendKeyboard, createBorrowKeyboard, etc.)
- [ ] Create contact management system with contact selection keyboards
- [ ] Add debt tracking and balance updates
- [ ] Implement payment history tracking
- [ ] Create debt overview and summary keyboards
- [ ] Add debt-specific AI detection patterns

### Phase 6: Advanced Keyboards & Polish
**Deliverable**: Production-ready bot with advanced keyboard features

**Keyboard Focus**: Advanced features and polish
```
🎯 TARGET KEYBOARDS:
├── 📊 Dashboard Keyboard (Summary, Reports, Quick Stats)
├── 🔍 Search & Filter Keyboard (Advanced transaction search)
├── ⚙️ Settings Keyboard (Preferences, Configuration)
├── 📤 Export Keyboard (Data export options)
└── 🔔 Notification Keyboard (Reminders, Alerts)
```

**Implementation Tasks**:
- [ ] Add Dashboard sheet with summary formulas
- [ ] Create advanced keyboard interactions
- [ ] Implement yearly sheet auto-creation
- [ ] Add confidence scoring and smart suggestions
- [ ] Create export and backup functionality
- [ ] Add debt payment reminders
- [ ] Implement comprehensive error handling
- [ ] Add keyboard navigation improvements

## Phase Testing Protocol

**After Each Phase**:
1. **Complete Manual Testing**: Use provided checklist
2. **User Feedback**: Report issues, suggestions, UX improvements
3. **AI Agent Review**: Address feedback and fix issues before next phase
4. **Keyboard Flow Validation**: Ensure all keyboards work as designed
5. **Data Integrity Check**: Verify Google Sheets data accuracy

## Technical Implementation Notes

### Key Requirements for AI Agent
- **Google Sheets API**: Service account authentication required
- **Error Handling**: Implement retry logic for API failures
- **Data Validation**: Validate all inputs before Google Sheets insertion
- **Backup Strategy**: Log all transactions locally before sending to sheets
- **TypeScript**: Full type safety across the application

### Critical Files to Modify
- `src/index.ts` - Main bot logic, add debt-related commands
- `src/text-chain.ts` - Update schema and add debt detection patterns
- `src/vision-chain.ts` - Enhance with caption processing
- `src/adapters/google-sheets.ts` - Add debt sheet management
- `src/events/callback-handler.ts` - Add placeholder message handling for non-implemented buttons
- `src/keyboards/bill-keyboards.ts` - Update to use message text for titles, clean button layouts
- `src/utils/message-formatter.ts` - New utility for generating formatted transaction messages
- `package.json` - Ensure TypeScript dependencies

### Enhanced Callback Handler for Placeholder Messages
```typescript
// Updated src/events/callback-handler.ts
function registerCallbackHandler(bot: any) {
  bot.on("callback_query", async (query: any) => {
    const { data: callback_data, message } = query;
    const chatId = message.chat.id;
    
    // Handle placeholder buttons (non-implemented features) ✅ IMPLEMENTED
    const placeholderFeatures = [
      // Phase 3 features
      "edit_amount", "edit_date", "edit_details", "new_category", "new_account", "submit",
      // Phase 4 features  
      "edit_from", "edit_to", "edit_exchange", "edit_source",
      // Phase 5 features
      "edit_contact", "edit_purpose", "debt_payment", 
      // Phase 6 features
      "analytics", "export", "recurring", "notifications"
    ];
    
    if (placeholderFeatures.some(feature => callback_data.includes(feature))) {
      const placeholderMessage = handlePlaceholderButton(callback_data);
      
      // Send temporary notification message with phase information
      const notificationMsg = await bot.sendMessage(chatId, placeholderMessage, {
        parse_mode: "Markdown"
      });
      
      // Auto-delete notification after 8 seconds (longer for detailed messages)
      setTimeout(() => {
        bot.deleteMessage(chatId, notificationMsg.message_id).catch(() => {});
      }, 8000);
      
      // Answer callback query to remove loading state
      bot.answerCallbackQuery(query.id);
      return;
    }
    
    // Handle implemented features (Phase 2 complete)
    // ... existing callback handling logic
  });
}
```

### Available Commands

**✅ Phase 2 - Currently Implemented:**
- `/init` - Set up new Google Sheets workbook with TempBills support
- `/add` - Add new transaction (followed by photo/text) 
- `/add [description]` - Add transaction with text description
- `/pending` - List unconfirmed transactions with clean numeric IDs
- `/help` - Show available commands and current phase status

**🚧 Phase 3-6 - Coming Soon:**
- `Edit bill [id]` - Edit specific bill by numeric ID (e.g., "Edit bill 100")
- `[id] [value]` - Direct field editing (e.g., "100 25.50" to update amount)

**🚧 Phase 5 - Debt Management (Not Yet Implemented):**
- `/lend` - Record money lent to someone (DISABLED)
- `/borrow` - Record money borrowed from someone (DISABLED)
- `/pay` - Record debt payment (DISABLED) 
- `/debts` - Show debt overview (DISABLED)
- `/contacts` - Manage lending contacts (DISABLED)

**Transaction Types Currently Available:**
- 💸 **Expense** - Full functionality with categories and accounts
- 💰 **Income** - Full functionality with source accounts  
- 🔄 **Transfer** - Full functionality with multi-account support
- 🚧 **Debt Types** - Commented out until Phase 5 (Lend, Borrow, Debt Payment, Debt Received)

### Clean Transaction Commands Flow
```
User: /add
Bot: 📸 Send me a photo of your receipt or describe your expense

User: [Sends receipt photo]
Bot: 💰 Amount: $25.50
     📅 Date: Jan 15, 2024
     📂 Category: Food
     💳 Account: Main Card
     
     ---
     MENU: 💸 Expense Transaction #100 👇
     [Clean keyboard with action buttons only]

User: /add Spent $15 on coffee
Bot: 💰 Amount: $15.00
     📅 Date: Jan 15, 2024
     📂 Category: Food
     💳 Account: Main Card
     
     ---
     MENU: 💸 Expense Transaction #101 👇

User: [Clicks "💰 Edit Amount" on transaction #100]
Bot: 💰 Send the new amount for transaction #100    ← AUTO-DELETED
     Format: 100 [amount]                          ← AUTO-DELETED

User: 100 150.75                                   ← AUTO-DELETED
Bot: 💰 Amount: $150.75                           ← Updated message
     📅 Date: Jan 15, 2024
     📂 Category: Food
     💳 Account: Main Card
     
     ---
     MENU: 💸 Expense Transaction #100 👇
     [Clean keyboard - all guide messages gone]

Final Chat History:
User: [Photo of receipt]
Bot: 💰 Amount: $150.75                           ← Clean result only
     📅 Date: Jan 15, 2024
     📂 Category: Food
     💳 Account: Main Card
     
     ---
     MENU: 💸 Expense Transaction #100 👇
     [Action buttons keyboard]
```

### Debt Commands Flow (NEW)
```
User: /lend
Bot: 💰 Who did you lend money to?

User: John
Bot: 💵 How much did you lend to John?

User: $200
Bot: 📅 When was this loan made? (or just send "today")

User: today  
Bot: 📝 What was this loan for? (optional)

User: Emergency car repair
Bot: 📋 Loan Summary:
     👤 Contact: John
     💵 Amount: $200.00 USD
     📅 Date: 2024-01-15
     📝 Purpose: Emergency car repair
     
     [✅ Save Loan] [✏️ Edit] [❌ Cancel]

User: /debts
Bot: 📊 Your Active Debts & Credits:

     💰 MONEY LENT (Credits):
     • John: $100 remaining (originally $200)
     • Sarah: $50 remaining 
     Total owed to you: $150
     
     💸 MONEY BORROWED (Debts):
     • Mom: $300 remaining (originally $500)
     • Credit Union: $1,200 remaining
     Total you owe: $1,500
     
     [💰 Record Payment] [📋 Full History] [➕ New Debt/Credit]
```

### `/init` Command Flow
```
User: /init
Bot: 🔧 Setting up your personal finance tracker...
     ✅ Created Google Sheets workbook
     ✅ Set up Config, Categories, Accounts, Bills_2024, Dashboard, TempBills sheets
     ✅ Set up Contacts, Debts, DebtHistory sheets (NEW)
     ✅ Added default categories and accounts
     
     📋 Your Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
     
     Please:
     1. Save this ID in your .env file as GOOGLE_SPREADSHEET_ID
     2. Share the sheet with your bot's service account
     3. Start sending bills and tracking debts! 📸💰
```

## Future Considerations

### Potential Enhancements
- **Advanced Dashboard**: Debt summaries, payment schedules, interest calculations
- **Multi-user Support**: Family/team financial tracking with shared debts
- **Advanced Analytics**: Machine learning-powered financial insights
- **Payment Reminders**: Automated debt payment notifications
- **Interest Calculations**: Compound interest tracking for long-term debts

### Scalability Considerations
- **Multi-tenant Architecture**: Support multiple users/organizations
- **Database Migration**: Move from Google Sheets to dedicated database
- **API Layer**: RESTful API for third-party integrations
- **Microservices**: Break down into specialized services
- **Mobile App**: Native mobile application for enhanced UX

---
