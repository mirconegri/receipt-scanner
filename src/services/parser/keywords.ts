/**
 * Receipt vocabularies. English is the primary target, but this ships with
 * Italian included from day one since it is the most likely real-world
 * input for the first users of this app — the OCR'd text on a receipt is
 * independent of the app's UI language. Add a locale by extending these
 * arrays; nothing else in the parser needs to change.
 */

export const TOTAL_KEYWORDS = [
  'grand total',
  'total due',
  'amount due',
  'total',
  'totale complessivo',
  'totale finale',
  'importo totale',
  'totale',
];

export const SUBTOTAL_KEYWORDS = [
  'subtotal',
  'sub total',
  'sub-total',
  'totale parziale',
  'subtotale',
  'imponibile',
];

export const TAX_KEYWORDS = ['vat', 'tax', 'gst', 'hst', 'sales tax', 'iva'];

export const DISCOUNT_KEYWORDS = ['discount', 'coupon', 'promo', 'sconto', 'riduzione', 'abbuono'];

/** Lines that mention these are almost never product lines — payment
 * method / change lines that would otherwise look like an "item". */
export const NON_ITEM_KEYWORDS = [
  'cash',
  'change',
  'card',
  'credit',
  'debit',
  'visa',
  'mastercard',
  'balance',
  'contanti',
  'resto',
  'carta',
  'credito',
  'bancomat',
  'pagamento',
  'scontrino',
  'ricevuta fiscale',
  'partita iva',
  'codice fiscale',
  ...TOTAL_KEYWORDS,
  ...SUBTOTAL_KEYWORDS,
  ...TAX_KEYWORDS,
  ...DISCOUNT_KEYWORDS,
];

export function lineMatchesAny(line: string, keywords: string[]): boolean {
  const lower = line.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}
