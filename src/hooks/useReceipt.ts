import { useCallback, useEffect, useState } from 'react';
import { getReceiptById } from '../services/storage/receiptRepository';
import type { Receipt } from '../types/receipt';

interface UseReceiptResult {
  receipt: Receipt | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useReceipt(receiptId: string): UseReceiptResult {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    getReceiptById(receiptId)
      .then((result) => {
        if (!cancelled) setReceipt(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load receipt'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // refreshToken isn't read in the body — it's only here to force a new
    // `load` reference (and therefore a refetch) each time refresh() fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptId, refreshToken]);

  // This is a standard fetch-on-mount-and-on-refresh hook: `load` resets
  // `loading` to true synchronously so a refetch shows a loading state too,
  // not just the initial mount. That's intentional, not an accidental
  // cascading render, so the newer strict-mode rule is disabled for this
  // one line rather than restructured around.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => load(), [load]);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  return { receipt, loading, error, refresh };
}
