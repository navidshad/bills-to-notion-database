/**
 * Configuration Types
 * Type definitions for application configuration and environment variables
 */

import { Currency } from "./bill.types";

// Environment Variables
export interface EnvironmentConfig {
  // Telegram Bot
  BOT_TOKEN: string;

  // OpenAI
  OPENAI_API_KEY: string;

  // Google Sheets
  GOOGLE_SPREADSHEET_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_PATH?: string;

  // Notion
  NOTION_TOKEN?: string;
  DATABASE_ID?: string;

  // App Settings
  DEFAULT_CURRENCY?: Currency;
  NODE_ENV?: "development" | "production" | "test";
}

// Application Configuration
export interface AppConfig {
  bot: {
    token: string;
    polling: boolean;
  };
  ai: {
    openaiApiKey: string;
    model: string;
    maxTokens: number;
  };
  storage: {
    googleSheets?: {
      spreadsheetId: string;
      serviceAccountPath: string;
    };
    notion?: {
      token: string;
      databaseId: string;
    };
  };
  defaults: {
    currency: Currency;
    category: string;
    account: string;
    transactionType: string;
  };
}

// Runtime Configuration
export interface RuntimeConfig {
  isProduction: boolean;
  isDevelopment: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  enableMetrics: boolean;
}

// Feature Flags
export interface FeatureFlags {
  enableNotionIntegration: boolean;
  enableGoogleSheetsIntegration: boolean;
  enableAdvancedProcessing: boolean;
  enableDebugLogging: boolean;
}

// Default configurations
export const DEFAULT_CONFIG = {
  ai: {
    model: "gpt-4o",
    maxTokens: 4096,
  },
  defaults: {
    currency: "USD",
    category: "Other",
    account: "Main Card",
    transactionType: "Expense",
  },
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableNotionIntegration: true,
  enableGoogleSheetsIntegration: true,
  enableAdvancedProcessing: true,
  enableDebugLogging: false,
};
