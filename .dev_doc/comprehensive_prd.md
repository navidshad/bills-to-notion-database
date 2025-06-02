# Bills to Personal Finance App - Comprehensive PRD

## Executive Summary

Transform the existing Telegram bill collector bot from a simple Notion-based data entry tool into a comprehensive personal finance application using Google Sheets as the backend. The system will provide intelligent bill processing, categorization, and financial tracking capabilities.

## Current State Analysis

### Existing Implementation
- **Technology Stack**: Node.js, Telegram Bot API, OpenAI GPT-4o, Notion API
- **Features**: Photo/text bill processing, AI-powered data extraction, basic Notion integration
- **Limitations**: Single database, no categorization, no financial insights, limited user interaction

### Migration Goals
- **Primary**: Replace Notion with Google Sheets API
- **Secondary**: Add comprehensive financial features
- **Tertiary**: Improve user experience and data management

## Product Vision

Create a smart, conversational personal finance assistant that:
- Automatically processes and categorizes bills/receipts
- Organizes financial data in structured Google Sheets
- Provides insights and maintains financial records
- Adapts to user preferences and spending patterns

## Core Requirements

### 1. Google Sheets Integration

#### 1.1 Sheet Structure
- **Bills_{YEAR}**: Annual transaction sheets (e.g., Bills_2024, Bills_2025)
- **Categories**: Expense categories and subcategories
- **Accounts**: Bank accounts, credit cards, cash, etc.
- **Config**: System settings and user preferences
- **Dashboard**: Summary metrics and insights

#### 1.2 Data Schema
```
Bills_{YEAR} Columns:
- ID (Auto-generated)
- Date
- Title/Description
- Amount
- Currency
- Category
- Transaction Type (Expense/Income/Transfer)
- Account
- Destination Account (for transfers)
- Destination Amount (for currency exchanges)
- Destination Currency (for currency exchanges)
- Exchange Rate (for currency exchanges)
- Payment Method
- Tags
- Notes
- Created At
- Updated At
```

#### 1.3 Configuration Management
- **Authentication**: Service Account with Google Sheets API
- **Spreadsheet ID**: Configurable per user/deployment
- **Auto-sheet Creation**: Create yearly sheets as needed
- **Backup Strategy**: Regular data export capabilities

### 2. Enhanced AI Processing

#### 2.1 Multi-modal Analysis
- **Image Processing**: Receipt/bill photo analysis
- **Text Processing**: Natural language bill descriptions
- **Caption Integration**: Use photo captions in analysis process

#### 2.2 Smart Categorization
- **Dynamic Categories**: Load from Google Sheets Categories tab
- **AI Suggestions**: Propose categories based on merchant/description
- **Fallback Handling**: "Other" category with user review prompt

#### 2.3 Enhanced Data Extraction
```javascript
Enhanced Bill Schema:
{
  id: string,
  title: string,
  amount: number,
  currency_code: string,
  date: ISO8601,
  category: string,
  transaction_type: "expense" | "income" | "transfer",
  account: string,
  // Transfer/Exchange specific fields
  destination_account: string?,     // For transfers
  destination_amount: number?,      // For currency exchanges
  destination_currency: string?,    // For currency exchanges
  exchange_rate: number?,           // For currency exchanges
  // General fields
  payment_method: string?,
  merchant: string?,
  location: string?,
  tags: string[],
  confidence_score: number,
  description: string,
  original_text: string?
}
```

### 3. Advanced User Interface

#### 3.1 Enhanced Inline Keyboard
```
Message Processing Flow:
┌─────────────────────────────────────┐
│ [User sends bill photo/text]        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ Bot shows processed JSON + keyboard │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ ✏️ Edit Details                     │
│ 📂 Category: Food  🔧 Change        │
│ 💰 Type: Expense   🔄 Switch        │
│ 💳 Account: Card   🏦 Change        │
│ 🔄 To Account: --- 🏦 Set (if transfer) │
│ 🏷️ Add Tags       📝 Add Notes      │
│ ❌ Cancel         ✅ Submit         │
└─────────────────────────────────────┘
```

#### 3.2 Edit Functionality
- **Inline Editing**: Quick category/type/account changes
- **Detailed Editing**: Full JSON modification support
- **Natural Language**: "Change category to groceries" support
- **Validation**: Real-time data validation and error handling

#### 3.3 Batch Operations
- **Multi-select**: Process multiple bills in sequence
- **Bulk Actions**: Apply same category to multiple items
- **Review Queue**: Review uncertain AI classifications

### 4. Financial Features

#### 4.1 Transaction Management
- **Multiple Accounts**: Support for various payment methods
- **Currency Handling**: Multi-currency support with conversion
- **Recurring Transactions**: Detect and manage recurring bills
- **Split Transactions**: Divide bills across categories

#### 4.2 Categories & Tags
- **Custom Categories**: User-defined categories for organization
- **Custom Tags**: User-defined tags for flexible organization
- **Spending Insights**: Category-based spending analysis

#### 4.3 Account Management
- **Account Types**: Cash, Checking, Credit Card, Digital Wallet
- **Balance Tracking**: Optional balance maintenance
- **Transfer Handling**: Inter-account transfer support

### 5. Configuration System

#### 5.1 System Configuration
```javascript
Config Structure:
{
  user_preferences: {
    default_currency: "USD",
    default_account: "Main Card",
    default_category: "Other",
    timezone: "UTC",
    date_format: "YYYY-MM-DD"
  },
  google_sheets: {
    spreadsheet_id: "...",
    service_account_path: "...",
    auto_create_yearly_sheets: true,
    backup_enabled: true
  },
  ai_settings: {
    confidence_threshold: 0.8,
    auto_submit_high_confidence: false
  }
}
```

#### 5.2 User Customization
- **Personal Categories**: User-specific category management
- **Spending Limits**: Optional budget tracking
- **Notification Preferences**: Spending alerts and summaries

## User Stories

### Core User Stories

#### US1: Bill Processing
**As a user**, I want to send a photo of my receipt and have it automatically processed and categorized, **so that** I can quickly log my expenses without manual data entry.

**Acceptance Criteria:**
- Photo uploads are processed within 10 seconds
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
**As a user**, I want to input bills via text, photo, or photo with caption, **so that** I have flexibility in how I log my expenses.

**Acceptance Criteria:**
- Text input: "Spent $15 on lunch at McDonald's"
- Photo input: Receipt image processing
- Photo + caption: Enhanced context for AI processing
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

#### US8: Recurring Transaction Detection
**As a user**, I want the system to detect recurring transactions, **so that** I can automate regular expense logging.

**Acceptance Criteria:**
- AI identifies similar transactions over time
- Suggests automatic categorization for recurring items
- Optional auto-submission for high-confidence recurring transactions

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
    "uuid": "^9.0.0"
  }
}
```

### 6.2 Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegram Bot  │◄──►│   Main App       │◄──►│  Google Sheets  │
│                 │    │   (index.js)     │    │   Adapter       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
            ┌─────────────────┐  ┌─────────────────┐
            │   AI Chains     │  │  Configuration  │
            │ (text/vision)   │  │   Manager       │
            └─────────────────┘  └─────────────────┘
```

### 6.3 File Structure
```
├── src/
│   ├── index.js                 # Main bot entry point
│   ├── adapters/
│   │   ├── google-sheets.js     # Google Sheets integration
│   │   └── notion.js           # Legacy Notion (for migration)
│   ├── ai/
│   │   ├── text-chain.js       # Text processing
│   │   ├── vision-chain.js     # Image processing
│   │   └── category-suggester.js
│   ├── handlers/
│   │   ├── message-handler.js  # Message processing
│   │   ├── callback-handler.js # Button interactions
│   │   └── edit-handler.js     # Edit functionality
│   ├── utils/
│   │   ├── config.js           # Configuration management
│   │   ├── validation.js       # Data validation
│   │   └── helpers.js          # Utility functions
│   └── keyboards/
│       └── bill-keyboard.js    # Dynamic keyboard generation
├── config/
│   ├── default.json
│   └── production.json
└── docs/
    ├── api.md
    ├── setup.md
    └── user-guide.md
```

## Implementation Phases

### Phase 1: Google Sheets API Setup & Basic Migration
- [ ] Install googleapis dependency
- [ ] Create Google Sheets adapter class (src/adapters/google-sheets.js)
- [ ] Set up service account authentication
- [ ] Create initial spreadsheet with sheets: Config, Categories, Accounts, Bills_2024
- [ ] Implement basic addTransaction() method
- [ ] Update package.json with new dependencies
- [ ] Test connection and basic data insertion

### Phase 2: Enhanced Data Structure & Schema
- [ ] Update text-chain.js with enhanced bill schema (including transfer fields)
- [ ] Implement yearly sheet auto-creation logic
- [ ] Create category management methods (getCategories, addCategory)
- [ ] Create account management methods (getAccounts, addAccount)
- [ ] Update main index.js to use Google Sheets adapter instead of Notion
- [ ] Add transfer transaction support

### Phase 3: Enhanced Telegram Interface
- [ ] Create src/keyboards/bill-keyboard.js for dynamic keyboards
- [ ] Update callback handlers for new keyboard options
- [ ] Implement edit functionality in src/handlers/edit-handler.js
- [ ] Add transfer/exchange keyboard flows
- [ ] Update message processing to handle transfers and exchanges
- [ ] Add validation for transfer transactions

### Phase 4: AI Processing Improvements
- [ ] Update vision-chain.js to use photo captions
- [ ] Enhance text-chain.js to suggest categories from Google Sheets
- [ ] Add confidence scoring to AI responses
- [ ] Implement transfer/exchange detection in AI processing
- [ ] Add natural language processing for "Transfer $50 from card to cash"

### Phase 5: Configuration & Finalization
- [ ] Create src/utils/config.js for configuration management
- [ ] Set up environment variables for Google Sheets
- [ ] Add error handling and retry logic
- [ ] Create initial Dashboard sheet with basic formulas
- [ ] Remove old Notion dependencies
- [ ] Final testing of all transaction types

## Technical Implementation Notes

### Key Requirements for AI Agent
- **Google Sheets API**: Service account authentication required
- **Error Handling**: Implement retry logic for API failures
- **Data Validation**: Validate all inputs before Google Sheets insertion
- **Backup Strategy**: Log all transactions locally before sending to sheets

### Critical Files to Modify
- `index.js` - Main bot logic, replace notion-adapter with google-sheets
- `text-chain.js` - Update schema and add transfer support
- `vision-chain.js` - Enhance with caption processing
- `package.json` - Add googleapis dependency

## Future Considerations

### Potential Enhancements
- **G sheet Dashboard**: configured a new sheet in initial use
- **Multi-user Support**: Family/team financial tracking
- **Advanced Analytics**: Machine learning-powered financial insights

### Scalability Considerations
- **Multi-tenant Architecture**: Support multiple users/organizations
- **Database Migration**: Move from Google Sheets to dedicated database
- **API Layer**: RESTful API for third-party integrations
- **Microservices**: Break down into specialized services

---