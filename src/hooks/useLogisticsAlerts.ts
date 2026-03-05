import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useLogisticsAlerts() {
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertsCount();

    const subscription = supabase
      .channel('logistics_alerts_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_stock_alerts' }, () => {
        fetchAlertsCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchAlertsCount() {
    try {
      const { count, error } = await supabase
        .from('logistics_stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('acknowledged', false);

      if (error) throw error;
      setActiveAlertsCount(count || 0);
    } catch (error) {
      console.error('Error fetching alerts count:', error);
      setActiveAlertsCount(0);
    } finally {
      setLoading(false);
    }
  }

  return { activeAlertsCount, loading };
}
