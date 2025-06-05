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
- **TempBills**: Temporary storage for unconfirmed transactions [MessageID, ProcessedData, Timestamp]
- **Contacts**: People you lend to/borrow from (NEW)
- **Debts**: Active debt/credit tracking (NEW)
- **DebtHistory**: Payment history for debts/credits (NEW)

#### 1.2 Data Schema

**Bills_{YEAR} Columns:**
```typescript
interface BillRecord {
  id: string;                    // Auto-generated
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
  contact_id: string;            // Auto-generated
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
  debt_id: string;               // Auto-generated
  contact_id: string;            // References Contacts sheet
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
  payment_id: string;            // Auto-generated
  debt_id: string;               // References Debts sheet
  contact_name: string;          // Person's name
  payment_amount: number;        // Amount paid
  payment_date: string;          // When payment was made
  payment_method?: string;       // How payment was made
  notes?: string;                // Payment notes
  new_balance: number;           // Balance after this payment
  created_at: string;            // Creation timestamp
}
```

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
┌─────────────────────────────────────────┐
│ 🏷️ Type: Expense                [Edit] │
├─────────────────────────────────────────┤
│ 💰 $25.50 [Edit]    📅 Jan 15 [Edit]   │
├─────────────────────────────────────────┤
│ 📂 Category: Food             [Change]  │
├─────────────────────────────────────────┤
│ 💳 Account: Main Card        [Change]   │
├─────────────────────────────────────────┤
│ ✏️ Edit Details    🔄 Re-Calculate      │
├─────────────────────────────────────────┤
│              ✅ Submit                  │
└─────────────────────────────────────────┘
```

**Transfer Transaction Keyboard:**
```
┌─────────────────────────────────────────┐
│ 🏷️ Type: Transfer               [Edit] │
├─────────────────────────────────────────┤
│ 💰 $100.00 [Edit]   📅 Jan 15 [Edit]   │
├─────────────────────────────────────────┤
│ 📤 From: Main Card           [Change]   │
├─────────────────────────────────────────┤
│ 📥 To: Cash Account          [Change]   │
├─────────────────────────────────────────┤
│ 💱 Exchange Rate: 1.0        [Change]   │
├─────────────────────────────────────────┤
│ ✏️ Edit Details    🔄 Re-Calculate      │
├─────────────────────────────────────────┤
│              ✅ Submit                  │
└─────────────────────────────────────────┘
```

**Debt Management Keyboards:**
```
┌─────────────────────────────────────────┐
│ 🏷️ Type: Lend Money            [Edit] │
├─────────────────────────────────────────┤
│ 💰 $200.00 [Edit]   📅 Jan 15 [Edit]   │
├─────────────────────────────────────────┤
│ 👤 Contact: John Smith       [Change]   │
├─────────────────────────────────────────┤
│ 💳 From Account: Main Card   [Change]   │
├─────────────────────────────────────────┤
│ 📝 Purpose: Car Repair       [Change]   │
├─────────────────────────────────────────┤
│ ✏️ Edit Details    🔄 Re-Calculate      │
├─────────────────────────────────────────┤
│              ✅ Submit                  │
└─────────────────────────────────────────┘
```

#### 2.3 Field Edit Keyboards

**Transaction Type Selection:**
```
┌─────────────────────────────────────────┐
│         🔄 Change Transaction Type       │
├─────────────────────────────────────────┤
│ 💸 Expense      💰 Income               │
├─────────────────────────────────────────┤
│ 🔄 Transfer     🤝 Lend Money           │
├─────────────────────────────────────────┤
│ 🙏 Borrow       💳 Debt Payment         │
├─────────────────────────────────────────┤
│ 💵 Debt Received                        │
├─────────────────────────────────────────┤
│ ← Back                                  │
└─────────────────────────────────────────┘
```

**Category Selection:**
```
┌─────────────────────────────────────────┐
│          📂 Select Category             │
├─────────────────────────────────────────┤
│ 🍕 Food         🚗 Transport            │
├─────────────────────────────────────────┤
│ 🏠 Housing      💡 Utilities            │
├─────────────────────────────────────────┤
│ 👕 Shopping     🎬 Entertainment        │
├─────────────────────────────────────────┤
│ 🏥 Healthcare   📚 Education            │
├─────────────────────────────────────────┤
│ ➕ New Category                         │
├─────────────────────────────────────────┤
│ ← Back                                  │
└─────────────────────────────────────────┘
```

**Contact Selection:**
```
┌─────────────────────────────────────────┐
│            👤 Select Contact            │
├─────────────────────────────────────────┤
│ 👤 John Smith         👤 Sarah J.       │
├─────────────────────────────────────────┤
│ 👤 Mom                👤 Dad            │
├─────────────────────────────────────────┤
│ 👤 Mike Wilson        👤 Lisa Chen      │
├─────────────────────────────────────────┤
│ ➕ New Contact                          │
├─────────────────────────────────────────┤
│ ← Back                                  │
└─────────────────────────────────────────┘
```

#### 2.4 Keyboard Design Principles

- **First Row**: Always shows transaction type with edit option
- **Second Row**: Amount and date with separate edit buttons
- **Context Rows**: Adapt based on transaction type (category for expenses, contacts for debts, etc.)
- **Action Row**: Edit details and re-calculate options
- **Submit Row**: Final confirmation button
- **Navigation**: Consistent back buttons and clear flow patterns
- **Quick Actions**: Common shortcuts for frequently used operations

#### 2.5 Input Collection Strategy

**Challenge**: Telegram bots are stateless, making text input collection for field editing complex without persistent state management.

**Solution**: ID-Based Input Collection - A stateless approach that embeds transaction context directly in user messages.

**Implementation Flow:**
1. **User Interaction**: User clicks an edit button (e.g., "Edit Amount") on transaction keyboard
2. **Button State Update**: Bot removes/dims the pressed button and updates keyboard to show "⏳ Amount being edited..."
3. **Input Request**: Bot sends new message requesting input with transaction ID:
   ```
   💰 Send me the new amount with this ID: msg_123
   
   Format: msg_123 [new amount]
   Example: msg_123 150.75
   
   [📋 Copy ID: msg_123]
   ```
4. **User Response**: User sends message containing both transaction ID and new value: `msg_123 150.75`
5. **Processing**: Bot parses message, extracts transaction ID, validates new value, updates transaction
6. **Refresh**: Bot updates original transaction keyboard with new data and restores full functionality

**Message Parsing Patterns:**
- Flexible format support: `msg_123 150.75` or `150.75 msg_123`
- Regex extraction of transaction IDs and values
- Graceful handling of typos and formatting errors

**Error Handling:**
- Invalid transaction ID: "Transaction msg_999 not found. Check your pending transactions with /pending"
- Missing value: "Please include the new amount after msg_123"
- Invalid format: "I found ID msg_123 but couldn't understand the amount. Please send: msg_123 25.50"

**Advantages:**
- **Truly Stateless**: No persistent state storage required
- **Self-Contained**: Each input message carries its own context
- **Concurrent Safe**: Multiple users can edit different transactions simultaneously
- **No Cleanup**: No abandoned input sessions or timeouts to manage
- **Scalable**: Naturally handles multiple concurrent editing sessions

**User Experience Example:**
```
User: [Clicks "Edit Amount" on transaction msg_123]
Bot: [Updates keyboard to show "⏳ Amount being edited..."]
     
     💰 Send me the new amount with this ID: msg_123
     Format: msg_123 [new amount]
     [📋 Copy ID: msg_123]

User: msg_123 150.75
Bot: ✅ Updated amount to $150.75
     [Refreshes original transaction keyboard with updated data]
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
  id: string;
  message_id: string;              // Telegram message ID for session management
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
  contact_id?: string;            // Links to Contacts sheet
  contact_name?: string;          // Person's name for easy reading
  related_debt_id?: string;       // Links to active debt in Debts sheet
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
    default_currency: string;      // "USD"
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

#### US9: Session Management
**As a user**, I want to reference and modify specific bills using their message ID, **so that** I can edit transactions later without losing context.

**Acceptance Criteria:**
- Each processed bill shows a unique message ID and "Copy ID" button
- User can provide bill ID to edit: "Edit bill msg_12345"
- Unconfirmed bills are stored in TempBills sheet temporarily
- Bills are removed from TempBills when submitted or cancelled
- User can list pending bills: "Show pending bills"

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
│   │   │   ├── lend-command.ts      # /lend command handler (NEW)
│   │   │   ├── borrow-command.ts    # /borrow command handler (NEW)
│   │   │   ├── pay-command.ts       # /pay command handler (NEW)
│   │   │   ├── debts-command.ts     # /debts command handler (NEW)
│   │   │   └── contacts-command.ts  # /contacts command handler (NEW)
│   │   ├── message-handler.ts       # Photo/text message processing
│   │   └── callback-handler.ts      # Inline keyboard interactions
│   ├── managers/
│   │   ├── debt-manager.ts          # Debt tracking logic (NEW)
│   │   └── contact-manager.ts       # Contact management (NEW)
│   ├── utils/
│   │   ├── helpers.ts              # editTextMessage + BILL_REPLY_MARKUP
│   │   └── receipt-processor.ts    # getReceiptDetail function
│   ├── types/
│   │   ├── bill.types.ts           # Bill and transaction types
│   │   ├── debt.types.ts           # Debt and contact types (NEW)
│   │   └── config.types.ts         # Configuration types
│   └── keyboards/
│       ├── bill-keyboards.ts       # Bill processing keyboards
│       └── debt-keyboards.ts       # Debt management keyboards (NEW)
├── config/ (planned)
└── docs/ (planned)
```

## Implementation Phases
*Each phase delivers a working, deployable version*

### Phase 1: Basic Google Sheets Migration (Working Bot) ✅ COMPLETED
**Deliverable**: Functional bot that saves bills to Google Sheets instead of Notion

- [x] Install googleapis dependency (`npm install googleapis`)
- [x] Create Google Sheets adapter class (src/adapters/google-sheets.ts)
- [x] Set up service account authentication
- [x] Implement `/init` command - initializes required sheets in existing spreadsheet
- [x] Replace notion-adapter with google-sheets in index.ts
- [x] Keep existing photo/text processing logic but save to Google Sheets
- [x] Updated `/init` to work with existing spreadsheet ID instead of creating new one
- [x] Created SETUP.md guide for Google Sheets configuration
- [x] Updated .gitignore to exclude service account files
- [x] Updated package.json dependencies (removed @notionhq/client, added googleapis)
- [x] **REFACTORING COMPLETE**: Broke down monolithic index.js into modular TypeScript structure ✅
  - [x] Created `src/events/` directory with command and handler separation
  - [x] Created `src/utils/` for shared functionality (helpers, receipt-processor)
  - [x] Modular command handlers: init-command.ts, help-command.ts
  - [x] Separated message and callback handling into dedicated files
  - [x] Clean index.ts entry point with proper imports
- [x] **TESTING COMPLETE**: User can send photo/text → bot processes → saves to Google Sheets ✅
- [x] **Working Version**: Bot processes bills and saves to Google Sheets ✅

**Status**: ✅ **PHASE 1 COMPLETE** - Full Google Sheets migration + modular TypeScript refactoring successful!

### Phase 2: Command Structure & Enhanced UI (Improved UX)
**Deliverable**: Bot with proper commands and better keyboards

- [ ] Implement `/add` command handler
- [ ] Update message processing to only work after `/add` command
- [ ] Enhance keyboard with better layout and options
- [ ] Update text-chain.ts with enhanced bill schema
- [ ] Create Categories and Accounts sheets in `/init`
- [ ] Implement category/account selection in keyboards
- [ ] Test: `/add` + photo/text → enhanced keyboard → save to sheets
- [ ] **Working Version**: Command-based bot with better UX

### Phase 3: Session Management & Editing (Full CRUD)
**Deliverable**: Users can edit bills using message IDs

- [ ] Add TempBills sheet to store unconfirmed transactions
- [ ] Implement message ID tracking in bill schema
- [ ] Add "Copy ID" button to keyboards
- [ ] Implement edit functionality: "Edit bill msg_12345"
- [ ] Add "Show pending bills" command
- [ ] Implement submit/cancel functionality from TempBills
- [ ] Test: Create bill → edit by ID → submit → moves to Bills_2024
- [ ] **Working Version**: Full CRUD operations on bills

### Phase 4: Transfer & Exchange Features (Financial Features)
**Deliverable**: Complete personal finance functionality

- [ ] Add transfer transaction type support
- [ ] Implement account-to-account transfers
- [ ] Add currency exchange functionality
- [ ] Update keyboards for transfer/exchange flows
- [ ] Add transfer validation logic
- [ ] Test: Create transfers between accounts and currency exchanges
- [ ] **Working Version**: Complete personal finance app

### Phase 5: Personal Debt & Credit Tracking (NEW)
**Deliverable**: Complete debt management functionality

- [ ] Add Contacts, Debts, DebtHistory sheets to `/init` command
- [ ] Create debt-related TypeScript types (debt.types.ts)
- [ ] Implement debt transaction types (lend, borrow, debt_payment, debt_received)
- [ ] Create debt management commands:
  - [ ] `/lend` - Record money lent to someone
  - [ ] `/borrow` - Record money borrowed from someone
  - [ ] `/pay` - Record debt payments (giving or receiving)
  - [ ] `/debts` - Show debt overview and balances
  - [ ] `/contacts` - Manage lending contacts
- [ ] Update AI chains to detect debt language patterns
- [ ] Create debt-manager.ts and contact-manager.ts
- [ ] Add debt management keyboards and flows
- [ ] Implement automatic debt balance updates
- [ ] Add payment history tracking
- [ ] Test: Lend money → record payments → track balances → debt overview
- [ ] **Working Version**: Complete personal finance app with debt tracking

### Phase 6: Polish & Advanced Features (Production Ready)
**Deliverable**: Production-ready bot with advanced features

- [ ] Add Dashboard sheet with summary formulas (including debt summaries)
- [ ] Implement yearly sheet auto-creation
- [ ] Add photo caption processing enhancement
- [ ] Implement confidence scoring
- [ ] Add error handling and retry logic
- [ ] Create comprehensive documentation
- [ ] Remove all Notion dependencies
- [ ] Add debt payment reminders (optional)
- [ ] Implement interest calculations for debts
- [ ] **Working Version**: Production-ready personal finance bot with debt management

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
- `package.json` - Ensure TypeScript dependencies

### Available Commands
- `/init` - Set up new Google Sheets workbook
- `/add` - Add new transaction (followed by photo/text)
- `/add [description]` - Add transaction with text description
- `Edit bill [id]` - Edit specific bill by message ID
- `Show pending bills` - List unconfirmed transactions
- `/lend` - Record money lent to someone (NEW)
- `/borrow` - Record money borrowed from someone (NEW)
- `/pay` - Record debt payment (NEW)
- `/debts` - Show debt overview (NEW)
- `/contacts` - Manage lending contacts (NEW)

### Transaction Commands Flow
```
User: /add
Bot: 📸 Send me a photo of your receipt or describe your expense

User: [Sends receipt photo]
Bot: [Shows processed JSON with keyboard]
     ┌─────────────────────────────────────┐
     │ Bill ID: msg_12345 📋 Copy ID       │
     │ Amount: $25.50 | Category: Food     │
     │ ✏️ Edit   📂 Change   ✅ Submit      │
     └─────────────────────────────────────┘

User: /add Spent $15 on coffee
Bot: [Shows processed data with keyboard]

User: Edit bill msg_12345
Bot: Found bill msg_12345. What would you like to edit?
     Current: $25.50 Food expense from Card

User: Change category to Transport
Bot: ✅ Updated bill msg_12345 category to Transport
     [Shows updated keyboard]
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