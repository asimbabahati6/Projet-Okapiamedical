import { useState, useEffect } from 'react';
import {
  Lock,
  History,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRightLeft,
  Calendar,
  User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { getCaisseByType } from '../../services/caisseService';

interface ClotureRecord {
  date: string;
  montantTheorique: number;
  montantPhysique: number;
  ecart: number;
  motif: string | null;
  declarePar: string;
  virementUSD: number;
  virementCDF: number;
  virementEffectue: boolean;
}

export default function HistoriqueCoturesPage() {
  const { isDirecteurGeneral, isAccountant } = useFinancialPermissions();
  const canView = isDirecteurGeneral || isAccountant;

  const [records, setRecords] = useState<ClotureRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canView) loadData();
  }, [canView]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: ecarts } = await supabase
        .from('ecarts_caisse')
        .select('*')
        .order('date_cloture', { ascending: false });

      const userIds = [...new Set((ecarts || []).map((e: any) => e.declare_par).filter(Boolean))];
      const userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds);
        for (const p of profiles || []) userMap[p.id] = p.full_name;
      }

      const caisse = await getCaisseByType('auxiliaire');
      const { data: transferts } = caisse
        ? await supabase
            .from('mouvements_caisse')
            .select('montant, devise, created_at')
            .eq('caisse_id', caisse.id)
            .eq('type', 'transfert_sortant')
            .order('created_at', { ascending: false })
        : { data: [] };

      const transfertsByDate: Record<string, { usd: number; cdf: number }> = {};
      for (const t of transferts || []) {
        const d = new Date(t.created_at).toISOString().slice(0, 10);
        if (!transfertsByDate[d]) transfertsByDate[d] = { usd: 0, cdf: 0 };
        if (t.devise === 'CDF') transfertsByDate[d].cdf += Number(t.montant);
        else transfertsByDate[d].usd += Number(t.montant);
      }

      const result: ClotureRecord[] = (ecarts || []).map((e: any) => {
        const d = e.date_cloture;
        const vir = transfertsByDate[d] || { usd: 0, cdf: 0 };
        return {
          date: d,
          montantTheorique: Number(e.montant_theorique),
          montantPhysique: Number(e.montant_physique),
          ecart: Number(e.ecart),
          motif: e.motif_justification,
          declarePar: userMap[e.declare_par] || '-',
          virementUSD: vir.usd,
          virementCDF: vir.cdf,
          virementEffectue: vir.usd > 0 || vir.cdf > 0,
        };
      });

      setRecords(result);
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
            L'historique des clotures est visible uniquement par la direction et le comptable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            Historique des Clotures
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des clotures journalieres et des ecarts de caisse</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Summary Stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total clotures</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{records.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avec ecart</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {records.filter(r => Math.abs(r.ecart) > 0.01).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Virements effectues</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {records.filter(r => r.virementEffectue).length}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucune cloture enregistree</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Solde theorique</th>
                  <th className="px-4 py-3 text-right">Solde physique</th>
                  <th className="px-4 py-3 text-right">Ecart</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                  <th className="px-4 py-3 text-left">Virement</th>
                  <th className="px-4 py-3 text-left">Caissiere</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r, idx) => {
                  const hasEcart = Math.abs(r.ecart) > 0.01;
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {r.montantTheorique.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {r.montantPhysique.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasEcart ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {r.ecart >= 0 ? '+' : ''}{r.ecart.toLocaleString('fr-FR')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            0
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                        {hasEcart ? (
                          <span className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded-lg">
                            {r.motif || '-'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Conforme</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.virementEffectue ? (
                          <div className="flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                            <div className="text-xs">
                              {r.virementUSD > 0 && <span className="font-medium text-blue-700">{r.virementUSD.toLocaleString('fr-FR')} USD</span>}
                              {r.virementUSD > 0 && r.virementCDF > 0 && <span className="text-gray-400 mx-1">+</span>}
                              {r.virementCDF > 0 && <span className="font-medium text-blue-700">{r.virementCDF.toLocaleString('fr-FR')} CDF</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non effectue</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {r.declarePar}
                        </div>
                      </td>
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
