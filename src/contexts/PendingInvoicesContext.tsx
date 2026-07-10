import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useFinancialPermissions } from '../hooks/useFinancialPermissions';

interface PendingInvoicesContextValue {
  count: number;
  refresh: () => void;
}

const PendingInvoicesContext = createContext<PendingInvoicesContextValue>({ count: 0, refresh: () => {} });

export function usePendingInvoices() {
  return useContext(PendingInvoicesContext);
}

export function PendingInvoicesProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const { canViewEncaissementQueue } = useFinancialPermissions();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchCount = useCallback(async () => {
    if (!canViewEncaissementQueue) { setCount(0); return; }
    try {
      const { count: c, error } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'partial'])
        .or('type_facture.eq.cash,type_facture.is.null')
        .gt('balance', 0);
      if (!error && c !== null) setCount(c);
    } catch (_) {}
  }, [canViewEncaissementQueue]);

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel('pending-invoices-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchCount();
      })
      .subscribe();

    intervalRef.current = setInterval(fetchCount, 60000);

    return () => {
      supabase.removeChannel(channel);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  return (
    <PendingInvoicesContext.Provider value={{ count, refresh: fetchCount }}>
      {children}
    </PendingInvoicesContext.Provider>
  );
}
