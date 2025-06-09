I want to improve this  telegram robot which is responsible for collect bills.

Main goal:
- migrate fro a simple bill collector to a simple personal finance app based on google sheet. and this source code is only responsible for data insertion.
- Migrate from notion database to Google sheets And using Google sheets API.
- Add more financial features.

## New Features:
1. Bills sheet are per year, and bills from each years should be added to relevant sheet, if the year-sheet not created, need to be created first.
2. There should be a sheet for configuration, expense category, currency accounts.
3. For any new transaction ai should check the avalable transaction types and select a relevent, otherwise suggest a new category.
4. Google sheet configuration should be setup in the system configuration file with sheet ID and authentication details.
5. All transactions will be recorded in the configured Google sheet.
6. when user sends a bill system shows a processed version of the bill with inline keyboard for the message. this keyborad show be extend for new features.
7. use should be able to selecte a different category or create a new one from the keyboard.
8. Sinc the bot shows the data as json, user should be able to edit the analysed bill.
9. use the photo caption also in the analyse process.

Sugested keyboard:
[
	// Edit the bill detail
	[edit]

	// when user selects edit, it shoulbe be able to select other available categories or create a new one.
	["cate: exsisted/suggested", "edit cat"],

	// static types [exchange, income, expense], by prdessing this button user should be able to edit the type.
	[type: relevant type],	

	// add the bll to google sheet
	[Submit]
]

## Edit feature:
Sinc the bot shows the data as json, user should be able to edit the analysed bill.
the edit scenario is like this:
1. user send a bill photo or text
2. bot analyse the biil and send a new message to users contains a json and inline keyborad.
3. if user selec edit button
4. edit: a message sends to user contains the bill id and invite the user to provide the edited version od data
5. when user send the new data, the bot takes the new data, removes the user's message and updates that intial analysed bill
note: you can use the analysed message id to has a connected from the intial analysed message and use it later.

## Dashboard
I want a dashboard in google sheet
let's create a seperated prd for it.

numeric secions:
1. available fund in currency > 0
2. today's expenses

charts (based on a year selector)
1. monthly comparison over expenses and income
2. this month expense categories share

