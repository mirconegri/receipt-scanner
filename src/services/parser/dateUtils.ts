/**
 * Date/time extraction. Receipts are inconsistent about date format, and
 * numeric dates are genuinely ambiguous (03/04/2026 — March 4th or April
 * 3rd?). Where it's ambiguous we default to day-first (European), which
 * fits the app's primary target usage; unambiguous formats (ISO, or any
 * component over 12) are resolved exactly regardless of that default.
 */

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1, gen: 1, gennaio: 1,
  feb: 2, february: 2, febbraio: 2,
  mar: 3, march: 3, marzo: 3,
  apr: 4, april: 4, aprile: 4,
  may: 5, maggio: 5,
  jun: 6, june: 6, giu: 6, giugno: 6,
  jul: 7, july: 7, lug: 7, luglio: 7,
  aug: 8, august: 8, ago: 8, agosto: 8,
  sep: 9, sept: 9, september: 9, settembre: 9,
  oct: 10, october: 10, ott: 10, ottobre: 10,
  nov: 11, november: 11, novembre: 11,
  dec: 12, december: 12, dic: 12, dicembre: 12,
};

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const fullYear = year < 100 ? 2000 + year : year;
  if (!isValidDate(fullYear, month, day)) return null;
  return `${fullYear}-${pad2(month)}-${pad2(day)}`;
}

/** Resolves a numeric a/b/year triple, handling the day-first vs
 * month-first ambiguity described above. */
function resolveNumericDate(a: number, b: number, year: number): string | null {
  if (a > 12 && b <= 12) return toIsoDate(year, b, a); // a must be day
  if (b > 12 && a <= 12) return toIsoDate(year, a, b); // b must be day
  if (a <= 12 && b <= 12) return toIsoDate(year, b, a); // ambiguous: default day-first
  return null;
}

const ISO_DATE = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/;
const NUMERIC_DATE = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/;
const NAMED_MONTH_DATE =
  /\b(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{2,4})\b|\b([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{2,4})\b/;

export function extractDate(text: string): string | null {
  const iso = text.match(ISO_DATE);
  if (iso) {
    const [, year, month, day] = iso;
    const result = toIsoDate(Number(year), Number(month), Number(day));
    if (result) return result;
  }

  const named = text.match(NAMED_MONTH_DATE);
  if (named) {
    if (named[1] && named[2] && named[3]) {
      const month = MONTH_NAMES[named[2].toLowerCase()];
      if (month) return toIsoDate(Number(named[3]), month, Number(named[1]));
    } else if (named[4] && named[5] && named[6]) {
      const month = MONTH_NAMES[named[4].toLowerCase()];
      if (month) return toIsoDate(Number(named[6]), month, Number(named[5]));
    }
  }

  const numeric = text.match(NUMERIC_DATE);
  if (numeric) {
    const [, a, b, year] = numeric;
    const result = resolveNumericDate(Number(a), Number(b), Number(year));
    if (result) return result;
  }

  return null;
}

const TIME_24H = /\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\b/;
const TIME_12H = /\b(0?[1-9]|1[0-2]):([0-5]\d)\s?(am|pm|AM|PM)\b/;

export function extractTime(text: string): string | null {
  const twelveHour = text.match(TIME_12H);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = twelveHour[2];
    const meridiem = twelveHour[3].toLowerCase();
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return `${pad2(hour)}:${minute}`;
  }

  const twentyFourHour = text.match(TIME_24H);
  if (twentyFourHour) {
    return `${pad2(Number(twentyFourHour[1]))}:${twentyFourHour[2]}`;
  }

  return null;
}
