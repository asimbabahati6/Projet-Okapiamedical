import { useState, useEffect } from 'react';
import {
  Banknote,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Calendar,
  TrendingUp,
  Search,
  Receipt,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { getCaisseByType, getSoldeJourAuxiliaire, type CaisseInfo } from '../../services/caisseService';

interface Mouvement {
  id: string;
  type: string;
  montant: number;
  devise: string;
  reference: string;
  motif: string;
  created_at: string;
  effectue_par_name: string;
}

export function CaissePaymentView() {
  const { canAccessCashRegister, isDirecteurGeneral, isCaissiere } = useFinancialPermissions();
  const canView = canAccessCashRegister || isDirecteurGeneral || isCaissiere;

  const [_caisse, setCaisse] = useState<CaisseInfo | null>(null);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [soldeUSD, setSoldeUSD] = useState(0);
  const [soldeCDF, setSoldeCDF] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [dayStatsUSD, setDayStatsUSD] = useState({ entrees: 0, sorties: 0 });
  const [dayStatsCDF, setDayStatsCDF] = useState({ entrees: 0, sorties: 0 });

  useEffect(() => {
    if (canView) loadData();
  }, [canView, selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const c = await getCaisseByType('auxiliaire');
      setCaisse(c);
      if (!c) return;

      const solde = await getSoldeJourAuxiliaire(selectedDate);
      setSoldeUSD(solde.usd);
      setSoldeCDF(solde.cdf);

      const { data } = await supabase
        .from('mouvements_caisse')
        .select('*')
        .eq('caisse_id', c.id)
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`)
        .order('created_at', { ascending: false });

      const rows = data || [];
      const userIds = [...new Set(rows.map((m: any) => m.effectue_par).filter(Boolean))];
      const userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds);
        for (const p of profiles || []) userMap[p.id] = p.full_name;
      }

      const mapped = rows.map((m: any) => ({
        ...m,
        effectue_par_name: m.effectue_par ? (userMap[m.effectue_par] || 'Inconnu') : '-',
      }));
      setMouvements(mapped);

      let entreesUSD = 0, sortiesUSD = 0, entreesCDF = 0, sortiesCDF = 0;
      for (const m of mapped) {
        const isEntree = m.type === 'entree' || m.type === 'transfert_entrant';
        if (m.devise === 'CDF') {
          if (isEntree) entreesCDF += Number(m.montant);
          else sortiesCDF += Number(m.montant);
        } else {
          if (isEntree) entreesUSD += Number(m.montant);
          else sortiesUSD += Number(m.montant);
        }
      }
      setDayStatsUSD({ entrees: entreesUSD, sorties: sortiesUSD });
      setDayStatsCDF({ entrees: entreesCDF, sorties: sortiesCDF });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = mouvements.filter(m => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.reference || '').toLowerCase().includes(q) ||
      (m.motif || '').toLowerCase().includes(q) ||
      m.effectue_par_name.toLowerCase().includes(q)
    );
  });

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
          <p className="text-sm text-gray-400">Vous n'avez pas les droits d'acces a la caisse.</p>
        </div>
      </div>
    );
  }

  const typeInfo: Record<string, { label: string; color: string; isEntree: boolean }> = {
    entree: { label: 'Entree', color: 'bg-green-100 text-green-800', isEntree: true },
    sortie: { label: 'Sortie', color: 'bg-red-100 text-red-800', isEntree: false },
    transfert_entrant: { label: 'Virement recu', color: 'bg-blue-100 text-blue-800', isEntree: true },
    transfert_sortant: { label: 'Virement sortant', color: 'bg-orange-100 text-orange-800', isEntree: false },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            Caisse Auxiliaire
          </h1>
          <p className="text-gray-500 text-sm mt-1">Vue en temps reel des encaissements et decaissements du jour</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm border-none focus:ring-0 p-0"
            />
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solde Jour USD</p>
              <p className={`text-2xl font-bold mt-1 ${soldeUSD >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {soldeUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solde Jour CDF</p>
              <p className={`text-2xl font-bold mt-1 ${soldeCDF >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {soldeCDF.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entrees du jour</p>
              <p className="text-lg font-bold text-green-700 mt-1">
                +{dayStatsUSD.entrees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs text-gray-500">USD</span>
              </p>
              {dayStatsCDF.entrees > 0 && (
                <p className="text-sm text-green-600">
                  +{dayStatsCDF.entrees.toLocaleString('fr-FR')} <span className="text-xs text-gray-400">CDF</span>
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sorties du jour</p>
              <p className="text-lg font-bold text-red-600 mt-1">
                -{dayStatsUSD.sorties.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs text-gray-500">USD</span>
              </p>
              {dayStatsCDF.sorties > 0 && (
                <p className="text-sm text-red-500">
                  -{dayStatsCDF.sorties.toLocaleString('fr-FR')} <span className="text-xs text-gray-400">CDF</span>
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par reference, motif..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Mouvements Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Mouvements du {new Date(selectedDate).toLocaleDateString('fr-FR')} ({filtered.length})
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp className="w-3.5 h-3.5" />
            {mouvements.length} operations
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucun mouvement pour cette journee</p>
            <p className="text-sm mt-1">Les encaissements apparaitront ici en temps reel.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Heure</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-left">Devise</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                  <th className="px-4 py-3 text-left">Par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => {
                  const info = typeInfo[m.type] || { label: m.type, color: 'bg-gray-100 text-gray-600', isEntree: false };
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${info.color}`}>
                          {info.isEntree ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                          {info.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${info.isEntree ? 'text-green-700' : 'text-red-600'}`}>
                        {info.isEntree ? '+' : '-'}{Number(m.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          m.devise === 'USD' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {m.devise}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.reference || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{m.motif || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{m.effectue_par_name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
