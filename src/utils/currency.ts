export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/** Formats a monetary value for display. Falls back to a plain fixed-point
 * string if Intl.NumberFormat can't resolve the currency (e.g. a code the
 * device's ICU data doesn't recognize) — the amount should never disappear
 * just because formatting failed. */
export function formatMoney(value: number | null, currency: string): string {
  if (value === null) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatQuantity(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
