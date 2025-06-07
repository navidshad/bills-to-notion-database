/**
 * Default Values Utilities
 * Get default account and category from first available items in Google Sheets
 */

import googleSheetsAdapter from "../adapters/google-sheets";

/**
 * Get default account name (first account or "none")
 */
export async function getDefaultAccount(): Promise<string> {
  try {
    const accounts = await googleSheetsAdapter.getAccounts();
    return accounts.length > 0 ? accounts[0].name : "none";
  } catch (error) {
    console.error("Error getting default account:", error);
    return "none";
  }
}

/**
 * Get default category name (first category or "none")
 */
export async function getDefaultCategory(): Promise<string> {
  try {
    const categories = await googleSheetsAdapter.getCategories();
    return categories.length > 0 ? categories[0].name : "none";
  } catch (error) {
    console.error("Error getting default category:", error);
    return "none";
  }
}

/**
 * Get default account name for display (first account or fallback mapping)
 */
export async function getAccountNameOrDefault(
  accountId?: string
): Promise<string> {
  if (!accountId) {
    return await getDefaultAccount();
  }

  try {
    const accounts = await googleSheetsAdapter.getAccounts();
    const account = accounts.find((acc: any) => acc.id === accountId);
    return account ? account.name : await getDefaultAccount();
  } catch (error) {
    console.error("Error getting account name:", error);
    // Fallback to hardcoded mapping only as last resort
    const accountMap: Record<string, string> = {
      main_card: "Main Card",
      "main card": "Main Card",
      checking: "Checking",
      cash: "Cash",
      credit: "Credit Card",
      savings: "Savings",
      digital: "Digital Wallet",
    };
    return accountMap[accountId] || (await getDefaultAccount());
  }
}

/**
 * Get default category name for display (first category or fallback mapping)
 */
export async function getCategoryNameOrDefault(
  categoryId?: string
): Promise<string> {
  if (!categoryId) {
    return await getDefaultCategory();
  }

  try {
    const categories = await googleSheetsAdapter.getCategories();
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : await getDefaultCategory();
  } catch (error) {
    console.error("Error getting category name:", error);
    // Fallback to hardcoded mapping only as last resort
    const categoryMap: Record<string, string> = {
      food: "Food",
      transport: "Transport",
      housing: "Housing",
      utilities: "Utilities",
      shopping: "Shopping",
      entertainment: "Entertainment",
      healthcare: "Healthcare",
      education: "Education",
    };
    return categoryMap[categoryId] || (await getDefaultCategory());
  }
}
