/**
 * Transfer transaction types and schemas
 */

import { z } from "zod";

/**
 * Transfer transaction record interface
 */
export interface TransferRecord {
  // Basic transaction info
  amount: number;
  date: Date | string;
  description?: string;

  // Source account details
  from_account: string;
  from_currency: string;

  // Destination account details
  to_account: string;
  to_currency: string;
  destination_amount?: number;

  // Exchange and fees
  exchange_rate?: number;
  fee?: number;

  // Transaction metadata
  transaction_type: "transfer";

  // Optional fields for compatibility
  account?: string; // Maps to from_account for backward compatibility
  currency_code?: string; // Maps to from_currency for backward compatibility
  total_price?: number; // Maps to amount for backward compatibility
}

/**
 * Zod schema for transfer record validation
 */
export const transferRecordSchema = z.object({
  // Basic transaction info
  amount: z.number().positive().describe("Transfer amount in source currency"),
  date: z.string().describe("Transfer date in ISO format (YYYY-MM-DD)"),
  description: z
    .string()
    .optional()
    .describe("Optional transfer description or note"),

  // Source account details
  from_account: z.string().describe("Source account name or ID"),
  from_currency: z
    .string()
    .length(3)
    .describe("Source currency code (3 letters, e.g., USD)"),

  // Destination account details
  to_account: z.string().describe("Destination account name or ID"),
  to_currency: z
    .string()
    .length(3)
    .describe("Destination currency code (3 letters, e.g., EUR)"),
  destination_amount: z
    .number()
    .positive()
    .optional()
    .describe("Amount received in destination currency"),

  // Exchange and fees
  exchange_rate: z
    .number()
    .positive()
    .optional()
    .describe("Exchange rate (from_currency to to_currency)"),
  fee: z.number().min(0).optional().describe("Transfer fee in source currency"),

  // Transaction metadata
  transaction_type: z
    .literal("transfer")
    .describe("Transaction type - must be 'transfer'"),

  // Optional backward compatibility fields
  account: z
    .string()
    .optional()
    .describe("Backward compatibility - maps to from_account"),
  currency_code: z
    .string()
    .optional()
    .describe("Backward compatibility - maps to from_currency"),
  total_price: z
    .number()
    .optional()
    .describe("Backward compatibility - maps to amount"),
});

/**
 * User intent for transfer transactions
 */
export interface TransferIntent {
  intent: "transfer" | "general";
  general?: string;
}

/**
 * Zod schema for transfer intent validation
 */
export const transferIntentSchema = z.object({
  intent: z.enum(["general", "transfer"]),
  general: z
    .string({
      description:
        "A general response to the user message, with the same language of message",
    })
    .optional(),
});

/**
 * Transfer processing result
 */
export interface TransferProcessingResult {
  success: boolean;
  transferData?: TransferRecord;
  error?: string;
  warnings?: string[];
}

/**
 * Convert TransferRecord to BillRecord for backward compatibility
 */
export function transferToBillRecord(transfer: TransferRecord): any {
  return {
    title:
      transfer.description ||
      `Transfer from ${transfer.from_account} to ${transfer.to_account}`,
    total_price: transfer.amount,
    amount: transfer.amount,
    currency_code: transfer.from_currency,
    date: transfer.date,
    description: transfer.description || "",
    account: transfer.from_account,
    from_account: transfer.from_account,
    to_account: transfer.to_account,
    destination_account: transfer.to_account,
    destination_currency: transfer.to_currency,
    destination_amount: transfer.destination_amount,
    exchange_rate: transfer.exchange_rate || 1.0,
    fee: transfer.fee || 0,
    transaction_type: "transfer" as const,
  };
}

/**
 * Convert BillRecord to TransferRecord
 */
export function billToTransferRecord(bill: any): TransferRecord {
  return {
    amount: bill.total_price || bill.amount || 0,
    date: bill.date,
    description: bill.description,
    from_account: bill.from_account || bill.account || "",
    from_currency: bill.currency_code || "USD",
    to_account: bill.to_account || bill.destination_account || "",
    to_currency: bill.destination_currency || bill.currency_code || "USD",
    destination_amount: bill.destination_amount,
    exchange_rate: bill.exchange_rate,
    fee: bill.fee,
    transaction_type: "transfer",
    // Backward compatibility
    account: bill.from_account || bill.account,
    currency_code: bill.currency_code,
    total_price: bill.total_price || bill.amount,
  };
}

export type { TransferRecord as Transfer };
