declare class GoogleSheetsAdapter {
    spreadsheetId: string | undefined;
    serviceAccountPath: string;
    auth: any;
    sheets: any;
    constructor();
    initialize(): Promise<void>;
    initializeSheets(): Promise<{
        spreadsheetId: string;
        url: string;
        sheetsCreated: string[];
        existingSheets: any;
    }>;
    setupBillsHeaders(spreadsheetId: string): Promise<void>;
    setupTempBillsHeaders(spreadsheetId: string): Promise<void>;
    setupCategoriesData(spreadsheetId: string): Promise<void>;
    setupAccountsData(spreadsheetId: string): Promise<void>;
    setupConfigData(spreadsheetId: string): Promise<void>;
    normalizeDate(date: string): string;
    flatItems(description: string): string;
    addItem(title: string, totalPrice: number, currency_code: string, date: string, description: string): Promise<{
        success: boolean;
        id: string;
    }>;
    ensureYearlySheetExists(year: number): Promise<void>;
}
declare const _default: GoogleSheetsAdapter;
export default _default;
//# sourceMappingURL=google-sheets.d.ts.map