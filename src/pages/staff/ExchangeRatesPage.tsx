import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Plus, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExchangeRateRecord {
  id: string;
  rate_date: string;
  usd_to_cdf: number;
  cdf_to_usd: number;
  eur_to_cdf: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualUsd, setManualUsd] = useState('');
  const [manualEur, setManualEur] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRates(); }, []);

  async function fetchRates() {
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('rate_date', { ascending: false })
      .limit(30);
    setRates(data || []);
    setLoading(false);
  }

  async function handleAutoRefresh() {
    setRefreshing(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-exchange-rates`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await res.json();
      if (result.success) {
        await fetchRates();
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleManualSave() {
    if (!manualUsd) return;
    setSaving(true);
    try {
      await supabase
        .from('exchange_rates')
        .update({ is_active: false })
        .eq('is_active', true);

      await supabase.from('exchange_rates').insert({
        rate_date: new Date().toISOString().split('T')[0],
        usd_to_cdf: parseFloat(manualUsd),
        cdf_to_usd: 1 / parseFloat(manualUsd),
        eur_to_cdf: manualEur ? parseFloat(manualEur) : null,
        is_active: true,
        notes: 'Saisie manuelle par administrateur',
      });

      setManualUsd('');
      setManualEur('');
      setShowManualForm(false);
      await fetchRates();
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setSaving(false);
    }
  }

  const activeRate = rates.find(r => r.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taux de Change</h1>
          <p className="text-gray-600 mt-1">Taux officiels BCC (Banque Centrale du Congo)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Saisie manuelle
          </button>
          <button
            onClick={handleAutoRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Recuperation...' : 'Recuperer taux BCC'}
          </button>
        </div>
      </div>

      {/* Current Rate Card */}
      {activeRate && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">Taux actif</h2>
            <span className="ml-auto text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
              {activeRate.rate_date}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">USD / CDF</div>
              <div className="text-2xl font-bold text-gray-900">
                {Number(activeRate.usd_to_cdf).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FC
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">EUR / CDF</div>
              <div className="text-2xl font-bold text-gray-900">
                {activeRate.eur_to_cdf
                  ? `${Number(activeRate.eur_to_cdf).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FC`
                  : 'Non disponible'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">CDF / USD</div>
              <div className="text-2xl font-bold text-gray-900">
                {Number(activeRate.cdf_to_usd).toFixed(6)}
              </div>
            </div>
          </div>
          {activeRate.notes && (
            <p className="mt-3 text-xs text-green-700">{activeRate.notes}</p>
          )}
        </div>
      )}

      {/* Manual Entry Form */}
      {showManualForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saisie manuelle du taux</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1 USD = ? CDF
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={manualUsd}
                  onChange={(e) => setManualUsd(e.target.value)}
                  placeholder="Ex: 2850"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1 EUR = ? CDF (optionnel)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={manualEur}
                  onChange={(e) => setManualEur(e.target.value)}
                  placeholder="Ex: 3120"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleManualSave}
              disabled={!manualUsd || saving}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Historique des taux</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">USD/CDF</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">EUR/CDF</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map((rate) => (
                <tr key={rate.id} className={rate.is_active ? 'bg-green-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">{rate.rate_date}</td>
                  <td className="px-6 py-3 text-sm text-right font-mono text-gray-900">
                    {Number(rate.usd_to_cdf).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-mono text-gray-900">
                    {rate.eur_to_cdf
                      ? Number(rate.eur_to_cdf).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                      : '---'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {rate.is_active ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Actif</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Archive</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500 max-w-[200px] truncate">{rate.notes || '---'}</td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun taux enregistre. Cliquez sur "Recuperer taux BCC" pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
