import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ExchangeRate {
  id: string;
  rate_date: string;
  usd_to_cdf: number;
  cdf_to_usd: number;
  is_active: boolean;
}

export function useExchangeRate() {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('is_active', true)
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      setRate(data);
      setLoading(false);
    }
    fetch();
  }, []);

  function convertToUSD(amount: number, devise: 'USD' | 'CDF'): number {
    if (devise === 'USD' || !rate) return amount;
    return Math.round((amount / rate.usd_to_cdf) * 100) / 100;
  }

  function convertToCDF(amount: number, devise: 'USD' | 'CDF'): number {
    if (devise === 'CDF' || !rate) return amount;
    return Math.round(amount * rate.usd_to_cdf);
  }

  function equivalentDisplay(amount: number, devise: 'USD' | 'CDF'): string {
    if (!rate || !amount) return '';
    if (devise === 'USD') {
      const cdf = Math.round(amount * rate.usd_to_cdf);
      return `≈ ${cdf.toLocaleString('fr-FR')} CDF`;
    }
    const usd = Math.round((amount / rate.usd_to_cdf) * 100) / 100;
    return `≈ ${usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`;
  }

  return {
    rate,
    loading,
    usdToCdf: rate?.usd_to_cdf ?? 0,
    convertToUSD,
    convertToCDF,
    equivalentDisplay,
  };
}
