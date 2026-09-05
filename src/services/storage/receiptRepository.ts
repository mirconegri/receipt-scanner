import type { Receipt, ReceiptItem, ReceiptSummary } from '../../types/receipt';
import { getDatabase } from './database';

interface ReceiptRow {
  id: string;
  merchant: string | null;
  address: string | null;
  date: string | null;
  time: string | null;
  receipt_number: string | null;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  total: number | null;
  raw_text: string;
  created_at: string;
  updated_at: string;
}

interface ReceiptItemRow {
  id: string;
  receipt_id: string;
  name: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  position: number;
}

function rowToReceipt(row: ReceiptRow, items: ReceiptItem[]): Receipt {
  return {
    id: row.id,
    merchant: row.merchant,
    address: row.address,
    date: row.date,
    time: row.time,
    receiptNumber: row.receipt_number,
    currency: row.currency,
    items,
    subtotal: row.subtotal,
    tax: row.tax,
    discount: row.discount,
    total: row.total,
    rawText: row.raw_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function itemRowToItem(row: ReceiptItemRow): ReceiptItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalPrice: row.total_price,
  };
}

export type SortField = 'date' | 'total' | 'merchant';
export type SortDirection = 'asc' | 'desc';

export interface ListReceiptsOptions {
  searchQuery?: string;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}

const SORT_COLUMN: Record<SortField, string> = {
  date: 'date',
  total: 'total',
  merchant: 'merchant',
};

/** Saves a receipt (insert or full replace, including its items) inside a
 * single transaction so a save can never leave the item list partially
 * written. */
export async function saveReceipt(receipt: Receipt): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO receipts
        (id, merchant, address, date, time, receipt_number, currency, subtotal, tax, discount, total, raw_text, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        merchant = excluded.merchant,
        address = excluded.address,
        date = excluded.date,
        time = excluded.time,
        receipt_number = excluded.receipt_number,
        currency = excluded.currency,
        subtotal = excluded.subtotal,
        tax = excluded.tax,
        discount = excluded.discount,
        total = excluded.total,
        raw_text = excluded.raw_text,
        updated_at = excluded.updated_at`,
      receipt.id,
      receipt.merchant,
      receipt.address,
      receipt.date,
      receipt.time,
      receipt.receiptNumber,
      receipt.currency,
      receipt.subtotal,
      receipt.tax,
      receipt.discount,
      receipt.total,
      receipt.rawText,
      receipt.createdAt,
      receipt.updatedAt,
    );

    await db.runAsync('DELETE FROM receipt_items WHERE receipt_id = ?', receipt.id);
    for (let i = 0; i < receipt.items.length; i += 1) {
      const item = receipt.items[i];
      await db.runAsync(
        `INSERT INTO receipt_items (id, receipt_id, name, quantity, unit_price, total_price, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        receipt.id,
        item.name,
        item.quantity,
        item.unitPrice,
        item.totalPrice,
        i,
      );
    }
  });
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReceiptRow>('SELECT * FROM receipts WHERE id = ?', id);
  if (!row) return null;

  const itemRows = await db.getAllAsync<ReceiptItemRow>(
    'SELECT * FROM receipt_items WHERE receipt_id = ? ORDER BY position ASC',
    id,
  );
  return rowToReceipt(row, itemRows.map(itemRowToItem));
}

export async function listReceiptSummaries(options: ListReceiptsOptions = {}): Promise<ReceiptSummary[]> {
  const db = await getDatabase();
  const sortColumn = SORT_COLUMN[options.sortBy ?? 'date'];
  const direction = options.sortDirection === 'asc' ? 'ASC' : 'DESC';

  const clauses: string[] = [];
  const params: string[] = [];
  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    clauses.push('(merchant LIKE ? OR raw_text LIKE ?)');
    const like = `%${options.searchQuery.trim()}%`;
    params.push(like, like);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = await db.getAllAsync<ReceiptRow & { item_count: number }>(
    `SELECT r.*, (SELECT COUNT(*) FROM receipt_items WHERE receipt_id = r.id) AS item_count
     FROM receipts r
     ${where}
     ORDER BY ${sortColumn} ${direction} NULLS LAST`,
    ...params,
  );

  return rows.map((row) => ({
    id: row.id,
    merchant: row.merchant,
    date: row.date,
    total: row.total,
    currency: row.currency,
    itemCount: row.item_count,
  }));
}

export async function deleteReceipt(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM receipts WHERE id = ?', id);
}

export async function deleteAllReceipts(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM receipts');
}

/** Sum of receipt totals whose `date` falls within the given calendar
 * month (yearMonth format: "YYYY-MM"). Receipts with no detected date are
 * excluded rather than guessed into a month. */
export async function getMonthSpend(yearMonth: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ sum: number | null }>(
    `SELECT SUM(total) as sum FROM receipts WHERE date LIKE ?`,
    `${yearMonth}%`,
  );
  return row?.sum ?? 0;
}

export async function countReceipts(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM receipts');
  return row?.count ?? 0;
}
