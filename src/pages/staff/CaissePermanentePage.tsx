import { useState, useEffect } from 'react';
import {
  Lock,
  Vault,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Banknote,
  Calendar,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { getCaisseByType, type CaisseInfo } from '../../services/caisseService';

interface Mouvement {
  id: string;
  type: string;
  montant: number;
  devise: string;
  reference: string;
  motif: string;
  created_at: string;
  effectue_par_user?: { full_name: string } | null;
}

export default function CaissePermanentePage() {
  const { isDirecteurGeneral, isAccountant } = useFinancialPermissions();
  const canView = isDirecteurGeneral || isAccountant;

  const [caisse, setCaisse] = useState<CaisseInfo | null>(null);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [soldeUSD, setSoldeUSD] = useState(0);
  const [soldeCDF, setSoldeCDF] = useState(0);

  useEffect(() => {
    if (canView) loadData();
  }, [canView, dateFrom, dateTo]);

  async function loadData() {
    setLoading(true);
    try {
      const c = await getCaisseByType('permanente');
      setCaisse(c);

      if (c) {
        const { data } = await supabase
          .from('mouvements_caisse')
          .select('*')
          .eq('caisse_id', c.id)
          .gte('created_at', `${dateFrom}T00:00:00`)
          .lte('created_at', `${dateTo}T23:59:59`)
          .order('created_at', { ascending: false });

        const mvtRows = data || [];
        const userIds = [...new Set(mvtRows.map((m: any) => m.effectue_par).filter(Boolean))];
        const userMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .in('id', userIds);
          for (const p of profiles || []) userMap[p.id] = p.full_name;
        }
        setMouvements(mvtRows.map((m: any) => ({
          ...m,
          effectue_par_user: m.effectue_par ? { full_name: userMap[m.effectue_par] || '-' } : null,
        })) as Mouvement[]);

        const { data: allMvts } = await supabase
          .from('mouvements_caisse')
          .select('type, montant, devise')
          .eq('caisse_id', c.id);

        let usd = 0, cdf = 0;
        for (const m of allMvts || []) {
          const sign = (m.type === 'entree' || m.type === 'transfert_entrant') ? 1 : -1;
          if (m.devise === 'CDF') cdf += sign * Number(m.montant);
          else usd += sign * Number(m.montant);
        }
        setSoldeUSD(usd);
        setSoldeCDF(cdf);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
          <p className="text-sm text-gray-400">
            La caisse permanente est visible uniquement par la direction et le comptable.
          </p>
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, { label: string; color: string }> = {
    entree: { label: 'Entree', color: 'bg-green-100 text-green-800' },
    sortie: { label: 'Sortie', color: 'bg-red-100 text-red-800' },
    transfert_entrant: { label: 'Virement recu', color: 'bg-blue-100 text-blue-800' },
    transfert_sortant: { label: 'Virement sortant', color: 'bg-orange-100 text-orange-800' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <Vault className="w-5 h-5 text-white" />
            </div>
            Caisse Permanente
          </h1>
          <p className="text-gray-500 text-sm mt-1">Solde cumule et historique des mouvements</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Solde Global */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solde USD</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{soldeUSD.toLocaleString('fr-FR')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solde CDF</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{soldeCDF.toLocaleString('fr-FR')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Periode :</span>
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
        <span className="text-gray-400">a</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>

      {/* Mouvements Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Mouvements ({mouvements.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : mouvements.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Vault className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucun mouvement sur cette periode</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-left">Devise</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                  <th className="px-4 py-3 text-left">Par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mouvements.map(m => {
                  const info = typeLabels[m.type] || { label: m.type, color: 'bg-gray-100 text-gray-600' };
                  const isEntree = m.type === 'entree' || m.type === 'transfert_entrant';
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(m.created_at).toLocaleDateString('fr-FR')}
                        <span className="text-xs text-gray-400 ml-1">
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${info.color}`}>
                          {isEntree ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                          {info.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${isEntree ? 'text-green-700' : 'text-red-600'}`}>
                        {isEntree ? '+' : '-'}{Number(m.montant).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{m.devise}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{m.reference || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{m.motif || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{m.effectue_par_user?.full_name || '-'}</td>
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
