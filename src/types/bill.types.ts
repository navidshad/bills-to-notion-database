/**
 * Bill and Financial Data Types
 * Core domain objects for the personal finance application
 */

import { z } from "zod";

// Zod Schemas for runtime validation
export const billRecordSchema = z.object({
  title: z.string({
    description:
      "title of the bill, generated from the bill detail, don't write 'bill' or none sense words",
  }),
  total_price: z.number(),
  currency_code: z.string({
    description:
      "if didn't provide, default is " +
      (process.env.DEFAULT_CURRENCY || "USD"),
  }),
  date: z.date({ description: "if not provided, use message date" }),
  description: z.string(),
});

export const userIntentSchema = z.object({
  intent: z.enum(["general", "add-bill"]),
  general: z.string({
    description:
      "A general response to the user message, with the same language of message",
  }),
});

// TypeScript interfaces derived from Zod schemas
export interface BillRecord {
  title: string;
  total_price: number;
  currency_code: string;
  date: Date | string;
  description: string;
}

export interface BillRecordInput {
  title: string;
  total_price: number;
  currency_code?: string;
  date?: Date | string;
  description?: string;
}

export interface ProcessedBillData {
  id?: string;
  title: string;
  total_price: number;
  currency_code: string;
  date: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserIntent {
  intent: "general" | "add-bill";
  general?: string;
}

export interface ReceiptProcessingResult {
  success: boolean;
  data?: BillRecord;
  error?: string;
  message?: string;
}

// Type aliases for common financial concepts
export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD" | string;
export type TransactionType = "Income" | "Expense" | "Transfer";
export type PaymentMethod =
  | "Cash"
  | "Credit Card"
  | "Debit Card"
  | "Bank Transfer"
  | "Digital Wallet"
  | string;

// Financial entities
export interface Account {
  name: string;
  type: "Credit Card" | "Debit Card" | "Bank Account" | "Cash" | string;
  description?: string;
}

export interface Category {
  name: string;
  type: TransactionType;
  description?: string;
}
