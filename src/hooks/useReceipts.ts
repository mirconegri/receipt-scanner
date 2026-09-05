import { useCallback, useEffect, useState } from 'react';
import { listReceiptSummaries, type ListReceiptsOptions } from '../services/storage/receiptRepository';
import type { ReceiptSummary } from '../types/receipt';

interface UseReceiptsResult {
  receipts: ReceiptSummary[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useReceipts(options: ListReceiptsOptions): UseReceiptsResult {
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const optionsKey = JSON.stringify(options);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    listReceiptSummaries(options)
      .then((result) => {
        if (!cancelled) setReceipts(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load receipts'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // optionsKey intentionally stands in for `options` (a fresh object each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, refreshToken]);

  // See useReceipt.ts — same intentional reset-loading-on-refetch pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => load(), [load]);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  return { receipts, loading, error, refresh };
}
