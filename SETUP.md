# Setup Guide - Personal Finance Bot (Phase 1)

## Prerequisites

1. **Google Cloud Project** with Google Sheets API enabled
2. **Service Account** with Google Sheets access
3. **Telegram Bot Token** from @BotFather

## Step 1: Google Cloud Setup

### Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Create a Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name it: `personal-finance-bot`
4. Click "Create and Continue"
5. Skip roles for now, click "Continue"
6. Click "Done"

### Generate Service Account Key
1. Click on your service account email
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file
6. Save it as `service-account.json` in your project root

## Step 2: Environment Variables

Create a `.env` file in your project root:

```bash
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Google Sheets Configuration
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json
```

## Step 3: Initialize Your Spreadsheet

1. Start your bot: `npm start`
2. Send `/init` command to your bot
3. Copy the Spreadsheet ID from the bot's response
4. Update your `.env` file with the Spreadsheet ID
5. Share the Google Sheet with your service account email:
   - Open the spreadsheet URL provided by the bot
   - Click "Share" button
   - Add your service account email (found in service-account.json)
   - Give "Editor" permissions

## Step 4: Test the Bot

1. Restart your bot: `npm start`
2. Send a photo of a receipt or type an expense
3. Click "Add to Database" to save it to Google Sheets
4. Check your Google Sheet to verify the data was added

## File Structure After Setup

```
your-project/
├── src/
│   └── adapters/
│       ├── google-sheets.js
│       └── notion-adapter.js (legacy)
├── service-account.json (your Google service account key)
├── .env (your environment variables)
├── index.js
├── text-chain.js
├── vision-chain.js
├── helpers.js
├── package.json
└── SETUP.md
```

## Troubleshooting

### "GOOGLE_SPREADSHEET_ID environment variable not set"
- Make sure you've updated your `.env` file with the spreadsheet ID from `/init`
- Restart your bot after updating environment variables

### "Error adding to Google Sheets"
- Verify service account email has access to the spreadsheet
- Check that the service account JSON file path is correct
- Ensure Google Sheets API is enabled in your Google Cloud project

### "Error setting up spreadsheet"
- Check your service account JSON file is valid
- Verify Google Sheets API is enabled
- Ensure your service account has the necessary permissions

## Phase 1 Complete! ✅

Your bot now:
- Creates Google Sheets workbooks with `/init` command
- Processes receipts and expenses 
- Saves data to Google Sheets instead of Notion
- Maintains all existing functionality

Ready for Phase 2: Enhanced Commands and UI! 