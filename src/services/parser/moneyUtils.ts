/**
 * Money token handling. Receipts mix "12.34" (US) and "12,34" (EU) decimal
 * styles, sometimes with thousands separators on top ("1.234,56" or
 * "1,234.56") — normalizing this correctly is one of the most common
 * places a naive parser silently produces the wrong total.
 */

// Currency symbols this build recognizes when stripping tokens. Extend
// this list rather than special-casing symbols elsewhere.
const CURRENCY_SYMBOLS = ['€', '$', '£', 'CHF'];

/** Matches a plausible price token: optional currency symbol, digits with
 * optional thousands/decimal separators. Intentionally permissive — the
 * caller decides what to do with the match. */
export const MONEY_TOKEN_REGEX = /(?:[€$£]|CHF)?\s?-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?\b/g;

/**
 * Normalizes a matched money token to a JS number, or null if it does not
 * resolve to a sane number. Never throws.
 */
export function parseMoneyToken(raw: string): number | null {
  let token = raw.trim();
  for (const symbol of CURRENCY_SYMBOLS) {
    token = token.replace(symbol, '');
  }
  token = token.trim();
  if (token.length === 0) return null;

  const isNegative = token.startsWith('-');
  if (isNegative) token = token.slice(1);

  const lastComma = token.lastIndexOf(',');
  const lastDot = token.lastIndexOf('.');

  let normalized: string;
  if (lastComma === -1 && lastDot === -1) {
    // Plain integer, e.g. "1250" — treat as a whole-currency amount.
    normalized = token;
  } else if (lastComma > lastDot) {
    // Comma is the decimal separator (EU style): "1.234,56" -> "1234.56"
    normalized = token.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Dot is the decimal separator (US style): "1,234.56" -> "1234.56"
    normalized = token.replace(/,/g, '');
  } else {
    normalized = token;
  }

  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return null;
  return isNegative ? -value : value;
}

/** Finds every money-like token in a line and returns their parsed values
 * in the order they appear. Tokens that fail to parse are skipped. */
export function findMoneyValues(line: string): number[] {
  const matches = line.match(MONEY_TOKEN_REGEX) ?? [];
  return matches.map(parseMoneyToken).filter((value): value is number => value !== null);
}

/** The rightmost money value on a line — the common position for a line
 * total on most receipt layouts. Returns null if the line has none. */
export function lastMoneyValue(line: string): number | null {
  const values = findMoneyValues(line);
  return values.length > 0 ? values[values.length - 1] : null;
}
