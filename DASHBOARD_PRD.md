# Personal Finance Dashboard PRD
## Google Sheets Integration - Phases 1-4 Implementation

## Executive Summary

This document outlines the dashboard specifications for our personal finance application built on Google Sheets. The dashboard will provide comprehensive visualization and analysis of financial data collected through phases 1-4, leveraging Google Sheets' native charting, formula, and data manipulation capabilities.

## Available Data Sources (Phases 1-4)

### Primary Data Sources
1. **Bills_YYYY Sheets** (e.g., Bills_2024, Bills_2025)
   - Transaction records with 18 columns
   - Transaction types: expense, income, transfer
   - Categories, accounts, amounts, dates
   - Transfer-specific data: exchange rates, fees

2. **Reference Sheet** 
   - Categories (A-E columns)
   - Accounts (G-K columns) 
   - Income Sources (separated by column F)

3. **TempBills Sheet**
   - Pending/unconfirmed transactions
   - Temporary data during processing

### Data Schema Summary
```
Bills_YYYY Columns:
- ID, Date, Title/Description, Amount, Currency
- Category, Transaction Type, Account
- Destination Account, Destination Amount, Destination Currency
- Exchange Rate, Fee, Payment Method
- Tags, Notes, Created At, Updated At
```

## Dashboard Layout Structure

### Sheet Organization
```
Dashboard Sheet Layout:
├── A-F: Period Controls & Summary Metrics
├── G-L: Charts Area 1 (Periodic Analysis)
├── M-R: Charts Area 2 (Category Analysis)
├── S-X: Charts Area 3 (Account & Transfer Analysis)
└── Y-AD: Additional Analytics & Insights
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           📊 PERSONAL FINANCE DASHBOARD                         │
│                              Google Sheets Integration                          │
└─────────────────────────────────────────────────────────────────────────────────┘

📅 PERIOD CONTROL SYSTEM (A1:F10)
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [🕒 Last 7 Days ▼] [📅 Start Date] [📅 End Date] → [⚙️ Auto Calculation]      │
│                                                                                 │
│  💰 Total Expenses │ 💵 Total Income │ 📊 Net Flow │ 🔄 Transfers │ 📈 Count    │
│     $2,450.75     │    $5,200.00    │  $2,749.25  │   $500.00   │    42       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ FILTERS ALL COMPONENTS
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼

📈 PERIODIC ANALYSIS (G5:L15)           📊 CATEGORY ANALYSIS (M5:R15)
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│   📈 Expenses Trend Over Time   │     │     🥧 Category Breakdown       │
│                                 │     │                                 │
│   $1200 ┌─┐                     │     │   Food        35% │████████     │
│   $1000 │ │ ┌─┐                 │     │   Transport   20% │█████        │
│   $800  │ │ │ │ ┌─┐             │     │   Shopping    15% │████         │
│   $600  │ │ │ │ │ │             │     │   Utilities   10% │██           │
│   $400  │ │ │ │ │ │             │     │   Other       20% │█████        │
│        Week1 Week2 Week3 Week4  │     │                                 │
└─────────────────────────────────┘     └─────────────────────────────────┘

💳 ACCOUNT ANALYSIS (S5:X15)            🔄 TRANSFER ANALYSIS (Y5:AD15)
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│    📊 Account Balance Evolution │     │      🌊 Transfer Flow Matrix    │
│                                 │     │                                 │
│ Main Card ████████████████████  │     │ Main Card → Cash     $200  ████ │
│ Savings   ██████████████████    │     │ Cash → Savings       $150  ███  │
│ Cash      ████████              │     │ USD → EUR           $100  ██   │
│           Jan  Feb  Mar  Apr    │     │ Card → Investment    $300  █████ │
└─────────────────────────────────┘     └─────────────────────────────────┘
</dita>

🔍 ADVANCED ANALYTICS (Row 17-35)
┌───────────────────────────────────────────────────────────────────────────────┐
│ 🏆 TOP CATEGORIES    │ 💱 CURRENCY SUMMARY  │ 🗓️ MONTHLY COMPARISON          │
│ Food      $850 ████  │ USD  $2,100  ████    │ Jan Feb Mar Apr May Jun        │
│ Transport $420 ██    │ EUR   €180   ██      │ ███ ██  ████ ███ ████ ███     │
│ Shopping  $310 █     │ GBP   £45    █       │ (Heat map: Red = High expense) │
│                      │                      │                                │
│ 📅 WEEKLY PATTERNS   │ 💳 PAYMENT METHODS   │ ⚡ TRANSACTION VELOCITY       │
│     Su Mo Tu We Th   │ Credit Card   65%    │ Daily Avg:    2.1 transactions│
│ ███ █  ██ ████ ███   │ Cash         20%     │ Peak Day:     Friday          │
│ (Radar: Fri = Peak)  │ Bank Transfer 15%    │ Avg Amount:   $58.35          │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Component Interaction Flow

```
📊 DATA SOURCES                    🎛️ DASHBOARD COMPONENTS                📈 OUTPUT
┌─────────────────┐              ┌─────────────────────────┐           ┌─────────────────┐
│                 │              │                         │           │                 │
│ 📋 Bills_2024   │──────────────▶│  🕒 Period Controls     │──────────▶│ 📊 Visual       │
│ 📋 Bills_2025   │              │                         │           │    Analytics    │
│ 📋 Bills_YYYY   │              │  💰 Financial Overview  │           │                 │
│                 │              │                         │           │ 📈 Trend Charts │
│ 📊 Reference    │──────────────▶│  📈 Periodic Analysis   │──────────▶│                 │
│ - Categories    │              │                         │           │ 🥧 Category     │
│ - Accounts      │              │  📂 Category Breakdown  │           │    Breakdowns   │
│ - Income Sources│              │                         │           │                 │
│                 │              │  💳 Account Evolution   │           │ 💳 Account      │
│ 📝 TempBills    │──────────────▶│                         │──────────▶│    Tracking     │
│ (Pending)       │              │  🔄 Transfer Analysis   │           │                 │
│                 │              │                         │           │ 🔄 Transfer     │
│ 🎯 Config       │              │  🔍 Advanced Analytics  │           │    Insights     │
│ (Settings)      │              │                         │           │                 │
└─────────────────┘              └─────────────────────────┘           └─────────────────┘
         │                                       │                             │
         │                                       │                             │
         ▼ FORMULAS & CALCULATIONS                ▼ USER INTERACTIONS           ▼ ACTIONABLE
                                                                                  INSIGHTS
    =SUMIFS() =FILTER()                    Period Selection                Financial 
    =UNIQUE() =QUERY()                     Category Drill-down            Decision Making
    =SPARKLINE()                           Account Analysis               Budget Planning
```

### Visual Dashboard Layout (Google Sheets Coordinate System)

```
     A    B    C    D    E    F  │  G    H    I    J    K    L  │  M    N    O    P    Q    R
   ┌────┬────┬────┬────┬────┬────┼────┬────┬────┬────┬────┬────┼────┬────┬────┬────┬────┬────┐
 1 │🕒 Period Control System     │         PERIODIC ANALYSIS         │       CATEGORY ANALYSIS       │
 2 │[Last 7 Days▼] [Start] [End]│                                   │                               │
 3 │                             │                                   │                               │
 4 │                             │                                   │                               │
 5 │💰    💵    📊    🔄    📈   │    📈 Expenses Trend Chart        │     🥧 Category Pie Chart     │
 6 │$2.4K $5.2K +$2.7K $500  42 │                                   │                               │
 7 │                             │                                   │                               │
 8 │                             │                                   │                               │
 9 │                             │                                   │                               │
10 │                             │                                   │                               │
11 │                             │        📊 Transaction Count       │     📊 Category Bar Chart     │
12 │                             │                                   │                               │
13 │                             │                                   │                               │
14 │                             │                                   │                               │
15 │                             │                                   │                               │
   ├────┴────┴────┴────┴────┴────┼────┴────┴────┴────┴────┴────┼────┴────┴────┴────┴────┴────┤
16 │                             │                               │                               │
17 │   🏆 TOP SPENDING TRENDS    │    💱 CURRENCY ANALYSIS       │    🗓️ MONTHLY COMPARISON      │
18 │                             │                               │                               │
19 │ Food      $850 ████████     │ USD $2,100 ████████████       │ Jan Feb Mar Apr May Jun      │
20 │ Transport $420 ████         │ EUR  €180  ████               │ ███ ██  ████ ███ ████ ███   │
21 │ Shopping  $310 ███          │ GBP   £45  █                  │ (Red = High, Green = Low)    │
22 │ Utilities $180 ██           │                               │                               │
23 │ Other     $120 █            │ 📊 Exchange Rate Trends       │ 📊 Month-over-Month %        │
24 │                             │                               │                               │
25 │ 📉 Sparkline Trends ▁▂▃▄▃▂  │                               │                               │
   └─────────────────────────────┴───────────────────────────────┴───────────────────────────────┘

     S    T    U    V    W    X  │  Y    Z   AA   AB   AC   AD
   ┌────┬────┬────┬────┬────┬────┼────┬────┬────┬────┬────┬────┐
 1 │      ACCOUNT EVOLUTION      │        TRANSFER ANALYSIS       │
 2 │                             │                               │
 3 │                             │                               │
 4 │                             │                               │
 5 │  📈 Balance Over Time       │    🌊 Transfer Flow Matrix    │
 6 │                             │                               │
 7 │ Main Card ████████████████  │ From      To        Amount    │
 8 │ Savings   ██████████████    │ Main Card → Cash     $200     │
 9 │ Cash      ████████          │ Cash      → Savings  $150     │
10 │ Investment████              │ USD       → EUR      $100     │
11 │           Jan Feb Mar Apr   │ Card      → Invest   $300     │
12 │                             │                               │
13 │ 📊 Account Summary Table    │ 💸 Transfer Fee Analysis      │
14 │                             │                               │
15 │                             │                               │
   ├────┴────┴────┴────┴────┴────┼────┴────┴────┴────┴────┴────┤
17 │   📅 WEEKLY PATTERNS        │    💳 PAYMENT METHODS         │
18 │                             │                               │
19 │     Su Mo Tu We Th Fr Sa    │ Credit Card    65% ████████   │
20 │ ███ █  ██ ████ ███ ████ ██  │ Cash          20% ███         │
21 │ (Radar Chart: Fri = Peak)   │ Bank Transfer 15% ██          │
22 │                             │                               │
23 │ 🕐 Peak Hours: 2PM-4PM      │ 📊 Efficiency Metrics        │
24 │ 💡 Recommendation: Budget   │ 💰 Fee Analysis               │
25 │    Friday spending limit    │                               │
   └─────────────────────────────┴───────────────────────────────┘
```

## Core Dashboard Components

### 1. Period Control System
**Location**: A1:F10
**Visualization Type**: Dropdown Controls + Summary Numbers

**Technical Implementation**:
- **Period Selector Dropdown** (A2): Data validation list ["Last 7 Days", "Last 30 Days", "Last 3 Months", "Last 6 Months", "This Year", "All Time", "Custom Range"]
- **Custom Date Range** (B2:C2): Start Date, End Date inputs (enabled when "Custom Range" selected)
- **Auto-Date Calculation** (D2:F2): Formulas to convert period selection to actual date ranges

**Formulas**:
```
D2: =IF(A2="Last 7 Days", TODAY()-7, IF(A2="Last 30 Days", TODAY()-30, ...))
E2: =IF(A2="All Time", TODAY(), IF(A2="Custom Range", C2, TODAY()))
```

### 2. Financial Overview Cards
**Location**: A5:F10
**Visualization Type**: Large Numbers with Trend Indicators

**Components**:
- **Total Expenses** (A5): `=SUMIFS(Bills_2024!D:D, Bills_2024!B:B, ">="&$D$2, Bills_2024!B:B, "<="&$E$2, Bills_2024!G:G, "expense")`
- **Total Income** (B5): `=SUMIFS(Bills_2024!D:D, Bills_2024!B:B, ">="&$D$2, Bills_2024!B:B, "<="&$E$2, Bills_2024!G:G, "income")`
- **Net Cash Flow** (C5): `=B5-A5`
- **Total Transfers** (D5): `=SUMIFS(Bills_2024!D:D, Bills_2024!B:B, ">="&$D$2, Bills_2024!B:B, "<="&$E$2, Bills_2024!G:G, "transfer")`
- **Transaction Count** (E5): `=COUNTIFS(Bills_2024!B:B, ">="&$D$2, Bills_2024!B:B, "<="&$E$2)`
- **Average Transaction** (F5): `=A5/E5`

**Visual Enhancement**: Use conditional formatting for positive/negative values (green/red)

### 3. Periodic Expenses Trend
**Location**: G5:L15
**Visualization Type**: Line Chart with Dual Axis

**Data Preparation** (G1:L4):
```
G1: Week/Month    H1: Expenses    I1: Income    J1: Net Flow    K1: Count    L1: Avg
G2: =DATE(YEAR($D$2), MONTH($D$2), 1)  [Dynamic based on period]
H2: =SUMIFS(Bills_2024!D:D, Bills_2024!B:B, ">="&G2, Bills_2024!B:B, "<"&G2+7, Bills_2024!G:G, "expense")
```

**Chart Configuration**:
- Chart Type: Line chart with secondary axis
- X-axis: Time periods (weekly/monthly based on selection)
- Primary Y-axis: Expenses (line)
- Secondary Y-axis: Transaction count (columns)
- Data Range: G1:L20 (dynamic based on period)

**Technical Feasibility**: ✅ Google Sheets supports line charts with secondary axis

### 4. Category Breakdown Analysis
**Location**: M5:R15
**Visualization Type**: Pie Chart + Horizontal Bar Chart

**Data Preparation** (M1:R10):
```
M1: Category    N1: Amount    O1: Percentage    P1: Count    Q1: Avg    R1: Trend
M2: =UNIQUE(FILTER(Bills_2024!F:F, (Bills_2024!B:B>=$D$2)*(Bills_2024!B:B<=$E$2)*(Bills_2024!G:G="expense")))
N2: =SUMIFS(Bills_2024!D:D, Bills_2024!F:F, M2, Bills_2024!B:B, ">="&$D$2, Bills_2024!B:B, "<="&$E$2, Bills_2024!G:G, "expense")
O2: =N2/SUM($N$2:$N$20)*100
```

**Charts**:
- **Pie Chart** (M5:O15): Categories by expense amount
- **Bar Chart** (P5:R15): Categories by transaction count

**Technical Feasibility**: ✅ Google Sheets native pie and bar charts

### 5. Account Balance Evolution
**Location**: S5:X15
**Visualization Type**: Stacked Area Chart + Account Summary Table

**Data Preparation** (S1:X20):
```
S1: Date    T1: Account1    U1: Account2    V1: Account3    W1: Total    X1: Transfers
S2: =DATE formulas for period range
T2: =SUMIFS(Bills_2024!D:D, Bills_2024!H:H, T$1, Bills_2024!B:B, "<="&$S2, Bills_2024!G:G, "income")
     - SUMIFS(Bills_2024!D:D, Bills_2024!H:H, T$1, Bills_2024!B:B, "<="&$S2, Bills_2024!G:G, "expense")
```

**Chart Configuration**:
- Stacked area chart showing account balance evolution
- Each account as a separate series
- X-axis: Time, Y-axis: Running balance

**Technical Feasibility**: ✅ Google Sheets supports stacked area charts with calculated running totals

### 6. Transfer Analysis Matrix
**Location**: Y5:AD15
**Visualization Type**: Sankey-style Table + Transfer Flow Chart

**Data Preparation** (Y1:AD10):
```
Y1: From Account    Z1: To Account    AA1: Amount    AB1: Frequency    AC1: Avg Rate    AD1: Total Fees
Y2: =UNIQUE(Bills_2024!H:H, Bills_2024!I:I) [Transfer pairs]
AA2: =SUMIFS(Bills_2024!D:D, Bills_2024!H:H, Y2, Bills_2024!I:I, Z2, Bills_2024!G:G, "transfer")
AD2: =SUMIFS(Bills_2024!M:M, Bills_2024!H:H, Y2, Bills_2024!I:I, Z2, Bills_2024!G:G, "transfer")
```

**Chart**: Horizontal bar chart showing transfer volumes between account pairs

**Technical Feasibility**: ✅ Table-based approach for transfer analysis

### 7. Top Spending Categories
**Location**: G17:L25
**Visualization Type**: Horizontal Bar Chart + Trend Sparklines

**Data Preparation**:
```
G17: Category    H17: This Period    I17: Last Period    J17: Change    K17: Trend    L17: Rank
G18: =LARGE(CategoryTotals, ROW()-17) [Top categories by spending]
J18: =(H18-I18)/I18*100 [Percentage change]
K18: =SPARKLINE(Monthly_Category_Data) [Mini trend chart]
```

**Technical Feasibility**: ✅ Google Sheets SPARKLINE function for trend visualization

### 8. Currency Exchange Summary
**Location**: M17:R25
**Visualization Type**: Summary Table + Exchange Rate Chart

**Components**:
- **Multi-Currency Summary**: Show expenses/income by currency
- **Exchange Rate Tracking**: Average rates used in transfers
- **Currency Conversion Impact**: Show total amounts in base currency

**Data Preparation**:
```
M17: Currency    N17: Expenses    O17: Income    P17: Transfers    Q17: Avg Rate    R17: Base Amount
M18: =UNIQUE(Bills_2024!E:E) [All currencies used]
N18: =SUMIFS(Bills_2024!D:D, Bills_2024!E:E, M18, Bills_2024!G:G, "expense")
```

**Technical Feasibility**: ✅ Tabular analysis with conditional formatting

### 9. Monthly Comparison Matrix
**Location**: S17:X25
**Visualization Type**: Heat Map Table + Comparison Chart

**Data Structure**:
```
S17: Month    T17: Expenses    U17: Income    V17: Net    W17: vs Avg    X17: Color
S18: =DATE(YEAR(Bills_2024!B:B), MONTH(Bills_2024!B:B), 1) [Monthly grouping]
W18: =(T18-AVERAGE($T$18:$T$30))/AVERAGE($T$18:$T$30)*100 [vs Average %]
```

**Visual Enhancement**: Conditional formatting for heat map effect (red=high expenses, green=low expenses)

**Technical Feasibility**: ✅ Google Sheets conditional formatting supports color scales

### 10. Payment Method Analysis
**Location**: Y17:AD25
**Visualization Type**: Donut Chart + Method Efficiency Table

**Data Preparation**:
```
Y17: Payment Method    Z17: Amount    AA17: Count    AB17: Avg    AC17: Fee Total    AD17: Efficiency
Y18: =UNIQUE(Bills_2024!N:N) [All payment methods]
Z18: =SUMIFS(Bills_2024!D:D, Bills_2024!N:N, Y18)
AD18: =Z18/(Z18+AC18)*100 [Efficiency = Amount/(Amount+Fees)]
```

**Technical Feasibility**: ✅ Donut charts available in Google Sheets

## Advanced Analytics Components

### 11. Weekly Spending Pattern
**Location**: A27:F35
**Visualization Type**: Radar Chart + Day-of-Week Analysis

**Data Preparation**:
```
A27: Day of Week    B27: Avg Expense    C27: Count    D27: Peak Hours    E27: Pattern    F27: Recommendation
A28: =TEXT(Bills_2024!B:B, "dddd") [Extract day of week]
B28: =AVERAGEIFS(Bills_2024!D:D, A28, A$28, Bills_2024!G:G, "expense")
```

**Chart**: Radar chart showing spending patterns by day of week

**Technical Feasibility**: ✅ Google Sheets supports radar charts

### 12. Budget vs Actual Tracker
**Location**: G27:L35
**Visualization Type**: Gauge Charts + Budget Performance Table

**Prerequisites**: Add Budget sheet with category budgets

**Implementation**:
```
G27: Category    H27: Budget    I27: Actual    J27: Remaining    K27: %Used    L27: Status
I27: =SUMIFS(Bills_2024!D:D, Bills_2024!F:F, G27, Bills_2024!G:G, "expense")
K27: =I27/H27*100
L27: =IF(K27>100, "Over Budget", IF(K27>80, "Warning", "On Track"))
```

**Visual**: Conditional formatting for budget status colors

**Technical Feasibility**: ✅ Requires manual budget setup but fully functional

### 13. Transaction Velocity Analysis
**Location**: M27:R35
**Visualization Type**: Velocity Chart + Transaction Frequency

**Metrics**:
- Transactions per day/week
- Spending velocity (amount per day)
- Peak transaction times
- Transaction size distribution

**Technical Implementation**:
```
M27: Period    N27: Transaction Count    O27: Daily Avg    P27: Amount Velocity    Q27: Size Distribution    R27: Trend
N27: =COUNTIFS(Bills_2024!B:B, ">="&period_start, Bills_2024!B:B, "<="&period_end)
O27: =N27/DAYS(period_end, period_start)
```

**Technical Feasibility**: ✅ Formula-based calculations with trend analysis

## Implementation Phases

### Phase 0: Test Data Population (Prerequisites)
**Deliverable**: Comprehensive sample data for dashboard testing

**📊 Test Data Script Features:**
- ✅ **Reads .env credentials** - Automatically loads GOOGLE_SPREADSHEET_ID and service account
- ✅ **3 months of realistic data** - ~200+ transactions across all categories
- ✅ **Weighted distribution** - 60% expenses, 20% income, 20% transfers
- ✅ **Multi-currency support** - USD, EUR transactions with realistic exchange rates
- ✅ **Transfer fees included** - Tests Phase 4 transfer fee analysis
- ✅ **Batch uploading** - Respects Google Sheets API rate limits
- ✅ **Data verification** - Generates summary statistics for validation

**🚀 Usage Commands:**
```bash
# Install dependencies (if needed)
npm install

# Populate test data
npm run test:populate

# Clear existing test data
npm run test:clear

# Generate summary only (no upload)
npm run test:summary
```

**📈 Generated Test Data:**
- **Expense Categories**: Food (25%), Transport (20%), Shopping (15%), Utilities (10%), Entertainment (15%), Healthcare (10%), Education (5%)
- **Account Distribution**: Main Card (40%), Cash (25%), Business Card (20%), Euro Cash (10%), Savings (5%)
- **Transaction Patterns**: More weekday transactions, realistic amounts with variance
- **Transfer Scenarios**: USD↔EUR exchanges, account-to-account moves, optional fees
- **Time Range**: Last 3 months with daily transactions

**✅ Validation Features:**
- Automatic summary statistics generation
- Transaction type and category distribution
- Amount statistics (total, average, min, max)
- Date range verification
- Direct spreadsheet URL for verification

### Phase A: Core Dashboard Setup (Week 1)
- [ ] **Prerequisites**: Run `npm run test:populate` to generate sample data
- [ ] Create Dashboard sheet in existing workbook
- [ ] Implement period control system (Component 1)
- [ ] Add financial overview cards (Component 2)
- [ ] Set up periodic expenses chart (Component 3)
- [ ] **Verify with test data**: Ensure charts display correctly with populated data

### Phase B: Category & Account Analysis (Week 2)
- [ ] Implement category breakdown charts (Component 4)
- [ ] Add account balance evolution (Component 5)
- [ ] Create transfer analysis matrix (Component 6)
- [ ] **Test multi-currency**: Verify EUR/USD transactions display correctly

### Phase C: Advanced Analytics (Week 3)
- [ ] Add top spending categories with trends (Component 7)
- [ ] Implement currency exchange summary (Component 8)
- [ ] Create monthly comparison heat map (Component 9)
- [ ] **Test historical patterns**: Verify 3-month data trends are visible

### Phase D: Specialized Analysis (Week 4)
- [ ] Add payment method analysis (Component 10)
- [ ] Implement weekly spending patterns (Component 11)
- [ ] Create budget vs actual tracker (Component 12)
- [ ] Add transaction velocity analysis (Component 13)
- [ ] **Performance testing**: Verify dashboard loads quickly with full dataset

## Technical Requirements

### Google Sheets Capabilities Required
- ✅ **Charts**: Line, Bar, Pie, Area, Radar, Donut charts
- ✅ **Functions**: SUMIFS, COUNTIFS, FILTER, UNIQUE, SPARKLINE
- ✅ **Data Validation**: Dropdown controls for period selection
- ✅ **Conditional Formatting**: Color scales, icon sets, custom rules
- ✅ **Array Formulas**: For dynamic data analysis
- ✅ **Pivot Tables**: Optional for complex aggregations

### Performance Considerations
- **Data Range Optimization**: Limit formulas to necessary ranges
- **Calculated Fields**: Pre-calculate complex metrics in hidden columns
- **Chart Data Limits**: Keep chart data sources under 10,000 rows for performance
- **Update Frequency**: Manual refresh or Apps Script automation

### Formula Examples for Core Components

#### Period-Based Expense Summary
```
=SUMIFS(
  Bills_2024!D:D,           // Amount column
  Bills_2024!B:B, ">="&D2,  // Date >= start
  Bills_2024!B:B, "<="&E2,  // Date <= end  
  Bills_2024!G:G, "expense" // Transaction type
)
```

#### Category Breakdown with Percentage
```
=ARRAYFORMULA(
  QUERY(
    {Bills_2024!F:F, Bills_2024!D:D},
    "SELECT Col1, SUM(Col2), COUNT(Col2) 
     WHERE Col1 IS NOT NULL 
     GROUP BY Col1 
     ORDER BY SUM(Col2) DESC",
    1
  )
)
```

#### Running Account Balance
```
=SUMIFS(Bills_2024!D:D, Bills_2024!H:H, "Main Card", Bills_2024!B:B, "<="&A2, Bills_2024!G:G, "income")
-SUMIFS(Bills_2024!D:D, Bills_2024!H:H, "Main Card", Bills_2024!B:B, "<="&A2, Bills_2024!G:G, "expense")
```

## Dashboard Usage Scenarios

### Scenario 1: Monthly Review
1. **Set Period**: Select "Last 30 Days" from dropdown
2. **Review Overview**: Check total expenses, income, net flow
3. **Analyze Categories**: Identify top spending categories
4. **Check Trends**: Review spending trend over time
5. **Account Health**: Verify account balances and transfers

### Scenario 2: Budget Planning
1. **Set Period**: Select "This Year" for annual view
2. **Category Analysis**: Review spending patterns by category
3. **Monthly Comparison**: Identify seasonal spending patterns
4. **Set Budgets**: Use insights to set realistic category budgets
5. **Track Progress**: Monitor budget vs actual performance

### Scenario 3: Transfer Analysis
1. **Focus on Transfers**: Review transfer analysis matrix
2. **Exchange Rates**: Check currency conversion efficiency
3. **Account Optimization**: Identify frequently used transfer paths
4. **Fee Analysis**: Review total transfer fees and costs

## Maintenance & Updates

### Regular Maintenance Tasks
- **Data Validation**: Ensure all transaction data is complete
- **Formula Updates**: Adjust date ranges for new years
- **Chart Refresh**: Update chart data ranges as data grows
- **Performance Monitoring**: Check calculation speed and optimize

### Automatic Updates
- **Apps Script Integration**: Optional automation for data refresh
- **Template Protection**: Protect formula cells from accidental changes
- **Backup Strategy**: Regular dashboard template backup

## Future Enhancements

### Advanced Features (Post Phase 4)
- **Debt Dashboard**: When Phase 5 is implemented
- **Forecasting Models**: Predictive spending analysis
- **Goal Tracking**: Savings and financial goal monitoring
- **External Data**: Bank statement import and reconciliation

### Integration Possibilities
- **Google Apps Script**: Advanced automation and calculations
- **Google Data Studio**: Enhanced visualization (if needed)
- **External APIs**: Real-time exchange rates, market data

## Conclusion

This dashboard design leverages Google Sheets' native capabilities to provide comprehensive financial analysis without requiring external tools or complex integrations. All components are technically feasible using standard Google Sheets functions and charting capabilities, ensuring reliable performance and easy maintenance.

The modular design allows for incremental implementation, starting with core components and adding advanced analytics over time. The period control system ensures all analysis can be filtered by time ranges, making the dashboard suitable for both daily monitoring and long-term financial planning. 