/**
 * External Services Types
 * Type definitions for integrating with external services
 */

import { BillRecord } from "./bill.types";

// LangChain / AI Service Types
export interface AIProcessingResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
  confidence?: number;
}

export interface VisionChainResult {
  extractedText: string;
  confidence?: number;
  processingTime?: number;
}

export interface TextChainResult {
  billData: BillRecord;
  confidence?: number;
  processingTime?: number;
}

// Google Sheets Types
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountPath: string;
}

export interface SpreadsheetInitResult {
  spreadsheetId: string;
  url: string;
  sheetsCreated: string[];
  existingSheets: string[];
}

export interface SheetRange {
  sheetName: string;
  range: string;
}

export interface SheetData {
  range: string;
  values: any[][];
}

// Notion Types
export interface NotionConfig {
  token: string;
  databaseId: string;
}

export interface NotionPageProperty {
  id?: string;
  type: string;
  [key: string]: any;
}

export interface NotionCreatePageRequest {
  parent: {
    database_id: string;
  };
  properties: Record<string, NotionPageProperty>;
}

// Common service response pattern
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    service: string;
    requestId?: string;
  };
}
