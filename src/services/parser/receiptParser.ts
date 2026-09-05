import type { ParsedField, ParsedReceipt, ReceiptItem } from '../../types/receipt';
import { extractDate, extractTime } from './dateUtils';
import { findMoneyValues, lastMoneyValue, MONEY_TOKEN_REGEX } from './moneyUtils';
import {
  DISCOUNT_KEYWORDS,
  lineMatchesAny,
  NON_ITEM_KEYWORDS,
  SUBTOTAL_KEYWORDS,
  TAX_KEYWORDS,
  TOTAL_KEYWORDS,
} from './keywords';

const RECEIPT_NUMBER_PATTERN =
  /(?:receipt|trans(?:action)?|order|scontrino|ricevuta|invoice|fattura)[^0-9A-Za-z]{0,6}(?:no\.?|n[°.]?)?[^0-9A-Za-z]{0,3}([A-Za-z0-9-]{3,})/i;

const ADDRESS_HINT_PATTERN =
  /\b(via|viale|piazza|corso|str(?:eet)?|ave(?:nue)?|road|rd\.|blvd|boulevard|suite|floor|terrace|lane|ln\.|drive|dr\.|way|court|ct\.)\b/i;

const HEADER_META_PATTERN = /\b(p\.?\s?iva|tel\.?|phone|fax|vat\s?(?:no|number)?)\b/i;
const LONG_CODE_PATTERN = /\b\d{5,}\b/;

const SEPARATOR_LINE = /^[\s\-=_*#.]{3,}$/;
// Quantity markers: "2 x", "2X", or the reverse "x2" — matched anywhere in
// the line (not just at the edges), since "NAME  2 x  1.20  2.40" is the
// most common multi-quantity layout.
const NUMBER_THEN_X = /(\d+(?:[.,]\d+)?)\s*[x×X]\s*/;
const X_THEN_NUMBER = /[x×X]\s*(\d+(?:[.,]\d+)?)\b/;
const CURRENCY_SYMBOL_MAP: Record<string, string> = { '€': 'EUR', $: 'USD', '£': 'GBP' };

function detected<T>(value: T): ParsedField<T> {
  return { value, confidence: 'detected' };
}

function undetected<T>(): ParsedField<T> {
  return { value: null, confidence: 'uncertain' };
}

function cleanLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0 && !SEPARATOR_LINE.test(line));
}

function findKeywordValue(lines: string[], keywords: string[]): number | null {
  // Search from the bottom up: totals/tax/subtotal are almost always in the
  // summary block near the end, and this avoids matching a product whose
  // name happens to contain a keyword (e.g. an item literally named "Tax").
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lineMatchesAny(lines[i], keywords)) {
      const value = lastMoneyValue(lines[i]);
      if (value !== null) return value;
    }
  }
  return null;
}

function detectCurrency(text: string): string | null {
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOL_MAP)) {
    if (text.includes(symbol)) return code;
  }
  const chfMatch = text.match(/\bCHF\b/);
  if (chfMatch) return 'CHF';
  return null;
}

function extractReceiptNumber(text: string): string | null {
  const match = text.match(RECEIPT_NUMBER_PATTERN);
  return match ? match[1] : null;
}

/** A line the item scanner should never treat as a product: masthead,
 * address, phone/VAT number, or a bare date/time stamp. Used both to find
 * where the header block ends and, defensively, inside the scan range. */
function isNonItemHeaderLine(line: string): boolean {
  if (ADDRESS_HINT_PATTERN.test(line)) return true;
  if (HEADER_META_PATTERN.test(line)) return true;
  if (LONG_CODE_PATTERN.test(line) && !/[.,]\d{1,2}\b/.test(line)) return true; // long bare code, not a price
  if (extractDate(line) && extractTime(line)) return true; // a timestamp line
  if (extractDate(line) && !/[.,]\d{1,2}\b/.test(line)) return true; // a date-only line
  return false;
}

function guessMerchantAndAddress(lines: string[]): {
  merchant: string | null;
  address: string | null;
  itemScanStart: number;
} {
  if (lines.length === 0) return { merchant: null, address: null, itemScanStart: 0 };

  const merchantLine = lines[0].length >= 2 ? lines[0] : null;
  let address: string | null = null;
  let itemScanStart = merchantLine ? 1 : 0;

  // Walk forward while lines still look like header content (address,
  // phone/VAT, store metadata) — the item block starts right after.
  for (let i = itemScanStart; i < Math.min(lines.length, 6); i += 1) {
    if (!isNonItemHeaderLine(lines[i])) break;
    if (address === null && ADDRESS_HINT_PATTERN.test(lines[i])) address = lines[i];
    itemScanStart = i + 1;
  }

  return { merchant: merchantLine, address, itemScanStart };
}

/** Index of the first line that starts the summary block (subtotal, tax,
 * discount, or total) — items are never searched at or beyond this line. */
function findSummaryStart(lines: string[]): number {
  const allSummaryKeywords = [...TOTAL_KEYWORDS, ...SUBTOTAL_KEYWORDS, ...TAX_KEYWORDS, ...DISCOUNT_KEYWORDS];
  for (let i = 0; i < lines.length; i += 1) {
    // A registration/VAT-ID line like "P.IVA 01234567890" contains "iva"
    // as a substring but is store metadata, not a tax amount — never let
    // it be mistaken for the start of the summary block.
    if (HEADER_META_PATTERN.test(lines[i])) continue;
    if (lineMatchesAny(lines[i], allSummaryKeywords)) return i;
  }
  return lines.length;
}

function extractQuantityMarker(line: string): { quantity: number; withoutMarker: string } | null {
  const numberFirst = line.match(NUMBER_THEN_X);
  if (numberFirst && numberFirst.index !== undefined) {
    const quantity = Number.parseFloat(numberFirst[1].replace(',', '.'));
    const withoutMarker = line.slice(0, numberFirst.index) + ' ' + line.slice(numberFirst.index + numberFirst[0].length);
    return { quantity, withoutMarker };
  }
  const xFirst = line.match(X_THEN_NUMBER);
  if (xFirst && xFirst.index !== undefined) {
    const quantity = Number.parseFloat(xFirst[1].replace(',', '.'));
    const withoutMarker = line.slice(0, xFirst.index) + ' ' + line.slice(xFirst.index + xFirst[0].length);
    return { quantity, withoutMarker };
  }
  return null;
}

function parseItemLine(line: string): ReceiptItem | null {
  if (lineMatchesAny(line, NON_ITEM_KEYWORDS)) return null;
  if (isNonItemHeaderLine(line)) return null;

  const quantityMatch = extractQuantityMarker(line);
  const quantity = quantityMatch?.quantity ?? null;
  const workingLine = quantityMatch?.withoutMarker ?? line;

  const moneyValues = findMoneyValues(workingLine);
  if (moneyValues.length === 0) return null;

  const name = workingLine.replace(MONEY_TOKEN_REGEX, '').trim();
  const cleanedName = name.replace(/[\s.\-]+$/, '').replace(/^[\s.\-]+/, '').trim();
  if (cleanedName.length < 2) return null;

  let unitPrice: number | null = null;
  let totalPrice: number | null = null;
  if (moneyValues.length >= 2) {
    unitPrice = moneyValues[0];
    totalPrice = moneyValues[moneyValues.length - 1];
  } else {
    totalPrice = moneyValues[0];
    if (quantity === 1) unitPrice = totalPrice;
  }

  return {
    id: '',
    name: cleanedName,
    quantity,
    unitPrice,
    totalPrice,
  };
}

/**
 * Parses raw OCR text into a structured receipt. Every field is either a
 * confident extraction or explicitly null+uncertain — this function never
 * invents a value it didn't find evidence for.
 */
export function parseReceiptText(rawText: string, generateId: () => string): ParsedReceipt {
  const lines = cleanLines(rawText);
  const cleanedText = lines.join('\n');

  const { merchant, address, itemScanStart } = guessMerchantAndAddress(lines);
  const date = extractDate(cleanedText);
  const time = extractTime(cleanedText);
  const receiptNumber = extractReceiptNumber(cleanedText);
  const currency = detectCurrency(cleanedText);

  const total = findKeywordValue(lines, TOTAL_KEYWORDS);
  const subtotal = findKeywordValue(lines, SUBTOTAL_KEYWORDS);
  const tax = findKeywordValue(lines, TAX_KEYWORDS);
  const discount = findKeywordValue(lines, DISCOUNT_KEYWORDS);

  // Items only ever live between the header block and the summary block —
  // scoping the scan here is what keeps store addresses, phone/VAT numbers,
  // and payment/change lines from ever being mistaken for products.
  const summaryStart = findSummaryStart(lines);
  const items: ReceiptItem[] = [];
  for (let i = itemScanStart; i < summaryStart; i += 1) {
    const item = parseItemLine(lines[i]);
    if (item) items.push({ ...item, id: generateId() });
  }

  return {
    merchant: merchant ? detected(merchant) : undetected(),
    address: address ? detected(address) : undetected(),
    date: date ? detected(date) : undetected(),
    time: time ? detected(time) : undetected(),
    receiptNumber: receiptNumber ? detected(receiptNumber) : undetected(),
    currency: currency ? detected(currency) : undetected(),
    items,
    subtotal: subtotal !== null ? detected(subtotal) : undetected(),
    tax: tax !== null ? detected(tax) : undetected(),
    discount: discount !== null ? detected(discount) : undetected(),
    total: total !== null ? detected(total) : undetected(),
    rawText,
  };
}
