/**
 * Domain model. These types are the contract between the parser, storage,
 * and UI layers — nothing here knows about OCR, SQLite, or React.
 *
 * Confidence is tracked per-field: OCR/parsing is never certain, and the
 * UI needs to know which fields to flag for the user to confirm rather
 * than silently trusting a guess.
 */

export type FieldConfidence = 'detected' | 'uncertain' | 'manual';

/** A value paired with how it was obtained. `value` is null when the
 * parser could not confidently extract it — callers must never invent
 * a value to fill this in. */
export interface ParsedField<T> {
  value: T | null;
  confidence: FieldConfidence;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

export interface Receipt {
  id: string;
  merchant: string | null;
  address: string | null;
  date: string | null; // ISO 8601 date (YYYY-MM-DD)
  time: string | null; // HH:mm, 24h
  receiptNumber: string | null;
  currency: string; // ISO 4217 code, e.g. "EUR" — defaults to the app's configured currency
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  total: number | null;
  /** Full OCR text, kept for re-parsing and for the user to inspect if
   * extraction went wrong. Never sent anywhere off-device. */
  rawText: string;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}

/** What the parser actually produces before the user reviews it — same
 * shape as Receipt but every extracted field carries its confidence. */
export interface ParsedReceipt {
  merchant: ParsedField<string>;
  address: ParsedField<string>;
  date: ParsedField<string>;
  time: ParsedField<string>;
  receiptNumber: ParsedField<string>;
  currency: ParsedField<string>;
  items: ReceiptItem[];
  subtotal: ParsedField<number>;
  tax: ParsedField<number>;
  discount: ParsedField<number>;
  total: ParsedField<number>;
  rawText: string;
}

export interface ReceiptSummary {
  id: string;
  merchant: string | null;
  date: string | null;
  total: number | null;
  currency: string;
  itemCount: number;
}
