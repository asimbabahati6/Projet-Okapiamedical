import { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpCircle,
  Banknote,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { getCaisseByType, enregistrerMouvementSortie } from '../../services/caisseService';
import { useToast } from '../../hooks/useToast';

interface MouvementSortie {
  id: string;
  type: string;
  montant: number;
  devise: string;
  reference: string;
  motif: string;
  created_at: string;
  effectue_par: string | null;
  effectue_par_name: string;
}

interface SortieStats {
  totalUSD: number;
  totalCDF: number;
  count: number;
  avgUSD: number;
  avgCDF: number;
  trendUSD: number;
  trendCDF: number;
}

type SortBy = 'date' | 'montant' | 'devise' | 'reference';
type SortDir = 'asc' | 'desc';

const PRESET_PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '3 mois' },
  { value: 'custom', label: 'Personnalise' },
] as const;

function computeDateRange(preset: string, customFrom: string, customTo: string) {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from: Date;

  switch (preset) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case '7d':
      from = new Date(now.getTime() - 7 * 86400000);
      from.setHours(0, 0, 0, 0);
      break;
    case '90d':
      from = new Date(now.getTime() - 90 * 86400000);
      from.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      return {
        from: customFrom ? `${customFrom}T00:00:00` : `${new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)}T00:00:00`,
        to: customTo ? `${customTo}T23:59:59` : `${now.toISOString().slice(0, 10)}T23:59:59`,
      };
    default:
      from = new Date(now.getTime() - 30 * 86400000);
      from.setHours(0, 0, 0, 0);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function SortiesCaissePage() {
  const { canAccessCashRegister, canViewCashFlow, isDirecteurGeneral, isCaissiere, isGestionnaire } = useFinancialPermissions();
  const canView = canViewCashFlow || canAccessCashRegister;
  const canCreate = isDirecteurGeneral || isCaissiere || isGestionnaire;
  const { showToast } = useToast();

  const [_caisse, setCaisse] = useState<string | null>(null);
  const [mouvements, setMouvements] = useState<MouvementSortie[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodPreset, setPeriodPreset] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deviseFilter, setDeviseFilter] = useState<'all' | 'USD' | 'CDF'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<MouvementSortie | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newSortie, setNewSortie] = useState({
    montant: '',
    devise: 'USD' as 'USD' | 'CDF',
    reference: '',
    motif: '',
  });

  useEffect(() => {
    if (canView) loadData();
  }, [canView, periodPreset, customFrom, customTo]);

  async function loadData() {
    setLoading(true);
    try {
      const c = await getCaisseByType('auxiliaire');
      setCaisse(c?.id ?? null);
      if (!c) return;

      const range = computeDateRange(periodPreset, customFrom, customTo);
      const { data } = await supabase
        .from('mouvements_caisse')
        .select('*')
        .eq('caisse_id', c.id)
        .in('type', ['sortie', 'transfert_sortant'])
        .gte('created_at', range.from)
        .lte('created_at', range.to)
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

      setMouvements(
        rows.map((m: any) => ({
          ...m,
          effectue_par_name: m.effectue_par ? (userMap[m.effectue_par] || 'Inconnu') : '-',
        }))
      );
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des donnees', 'error');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo<SortieStats>(() => {
    let totalUSD = 0, totalCDF = 0, countUSD = 0, countCDF = 0;
    for (const m of mouvements) {
      if (m.devise === 'CDF') { totalCDF += Number(m.montant); countCDF++; }
      else { totalUSD += Number(m.montant); countUSD++; }
    }

    const midpoint = Math.floor(mouvements.length / 2);
    const recentHalf = mouvements.slice(0, midpoint);
    const olderHalf = mouvements.slice(midpoint);
    const recentUSD = recentHalf.filter(m => m.devise !== 'CDF').reduce((s, m) => s + Number(m.montant), 0);
    const olderUSD = olderHalf.filter(m => m.devise !== 'CDF').reduce((s, m) => s + Number(m.montant), 0);
    const recentCDF = recentHalf.filter(m => m.devise === 'CDF').reduce((s, m) => s + Number(m.montant), 0);
    const olderCDF = olderHalf.filter(m => m.devise === 'CDF').reduce((s, m) => s + Number(m.montant), 0);

    return {
      totalUSD,
      totalCDF,
      count: mouvements.length,
      avgUSD: countUSD > 0 ? totalUSD / countUSD : 0,
      avgCDF: countCDF > 0 ? totalCDF / countCDF : 0,
      trendUSD: olderUSD > 0 ? ((recentUSD - olderUSD) / olderUSD) * 100 : 0,
      trendCDF: olderCDF > 0 ? ((recentCDF - olderCDF) / olderCDF) * 100 : 0,
    };
  }, [mouvements]);

  const filtered = useMemo(() => {
    let list = [...mouvements];

    if (deviseFilter !== 'all') list = list.filter(m => m.devise === deviseFilter);

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(m =>
        (m.reference || '').toLowerCase().includes(q) ||
        (m.motif || '').toLowerCase().includes(q) ||
        m.effectue_par_name.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case 'montant': cmp = Number(a.montant) - Number(b.montant); break;
        case 'devise': cmp = a.devise.localeCompare(b.devise); break;
        case 'reference': cmp = (a.reference || '').localeCompare(b.reference || ''); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [mouvements, deviseFilter, searchTerm, sortBy, sortDir]);

  async function handleCreateSortie(e: React.FormEvent) {
    e.preventDefault();
    const montant = parseFloat(newSortie.montant);
    if (!montant || montant <= 0) { showToast('Le montant doit etre superieur a 0', 'error'); return; }
    if (!newSortie.motif.trim()) { showToast('Le motif est obligatoire', 'error'); return; }

    setSubmitting(true);
    try {
      await enregistrerMouvementSortie({
        montant,
        devise: newSortie.devise,
        reference: newSortie.reference || `SRT-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        motif: newSortie.motif,
      });
      showToast('Sortie de caisse enregistree avec succes', 'success');
      setShowAddModal(false);
      setNewSortie({ montant: '', devise: 'USD', reference: '', motif: '' });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la creation', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function exportToCSV() {
    if (filtered.length === 0) { showToast('Aucune donnee a exporter', 'error'); return; }

    const lines: string[] = [];
    lines.push('SORTIES DE CAISSE');
    lines.push(`Genere le;${new Date().toLocaleString('fr-FR')}`);
    lines.push(`Nombre de sorties;${filtered.length}`);
    lines.push(`Total USD;${stats.totalUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`);
    lines.push(`Total CDF;${stats.totalCDF.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF`);
    lines.push('');
    lines.push('Date;Heure;Type;Montant;Devise;Reference;Motif;Effectue par');
    for (const m of filtered) {
      const d = new Date(m.created_at);
      const typeLabel = m.type === 'sortie' ? 'Sortie' : 'Virement sortant';
      lines.push([
        d.toLocaleDateString('fr-FR'),
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        typeLabel,
        Number(m.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        m.devise,
        m.reference || '-',
        `"${(m.motif || '-').replace(/"/g, '""')}"`,
        m.effectue_par_name,
      ].join(';'));
    }

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorties-caisse-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    showToast('Export CSV telecharge', 'success');
  }

  function toggleSort(col: SortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  function SortIcon({ col }: { col: SortBy }) {
    if (sortBy !== col) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-blue-600" />
      : <ChevronUp className="w-3 h-3 text-blue-600" />;
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
          <p className="text-sm text-gray-400">
            Vous n'avez pas les permissions pour consulter les sorties de caisse.
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-white" />
            </div>
            Sorties de Caisse
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Suivi des decaissements et virements sortants de la caisse auxiliaire
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          {canCreate && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle sortie
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Sorties USD"
          value={stats.totalUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          suffix="USD"
          trend={stats.trendUSD}
          icon={<DollarSign className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-100"
        />
        <KPICard
          label="Total Sorties CDF"
          value={stats.totalCDF.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
          suffix="CDF"
          trend={stats.trendCDF}
          icon={<Banknote className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-100"
        />
        <KPICard
          label="Nombre d'operations"
          value={stats.count.toLocaleString('fr-FR')}
          icon={<ArrowUpCircle className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <KPICard
          label="Moyenne / operation (USD)"
          value={stats.avgUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          suffix="USD"
          icon={<TrendingDown className="w-5 h-5 text-slate-600" />}
          iconBg="bg-slate-100"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period presets */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            {PRESET_PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriodPreset(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  periodPreset === p.value
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodPreset === 'custom' && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-gray-400 text-sm">a</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          )}

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Devise filter */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            {(['all', 'USD', 'CDF'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDeviseFilter(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  deviseFilter === d
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d === 'all' ? 'Toutes devises' : d}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par reference, motif, utilisateur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            Sorties ({filtered.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ArrowUpCircle className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucune sortie trouvee</p>
            <p className="text-sm mt-1">Modifiez vos filtres ou la periode selectionnee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => toggleSort('date')}
                  >
                    <span className="inline-flex items-center gap-1">Date <SortIcon col="date" /></span>
                  </th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th
                    className="px-4 py-3 text-right cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => toggleSort('montant')}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">Montant <SortIcon col="montant" /></span>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => toggleSort('devise')}
                  >
                    <span className="inline-flex items-center gap-1">Devise <SortIcon col="devise" /></span>
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => toggleSort('reference')}
                  >
                    <span className="inline-flex items-center gap-1">Reference <SortIcon col="reference" /></span>
                  </th>
                  <th className="px-4 py-3 text-left">Motif</th>
                  <th className="px-4 py-3 text-left">Effectue par</th>
                  <th className="px-4 py-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => {
                  const isTransfert = m.type === 'transfert_sortant';
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-700">
                          {new Date(m.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="text-xs text-gray-400 ml-1.5">
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isTransfert ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <ArrowUpCircle className="w-3 h-3" />
                          {isTransfert ? 'Virement' : 'Sortie'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-600 tabular-nums">
                        -{Number(m.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          m.devise === 'USD' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {m.devise}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{m.reference || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate" title={m.motif || '-'}>
                        {m.motif || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{m.effectue_par_name}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setShowDetailModal(m)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Sortie Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <ArrowUpCircle className="w-4 h-4 text-red-600" />
                </div>
                Nouvelle sortie de caisse
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateSortie} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newSortie.montant}
                    onChange={e => setNewSortie(p => ({ ...p, montant: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise *</label>
                  <select
                    value={newSortie.devise}
                    onChange={e => setNewSortie(p => ({ ...p, devise: e.target.value as 'USD' | 'CDF' }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  >
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference (optionnel)</label>
                <input
                  type="text"
                  value={newSortie.reference}
                  onChange={e => setNewSortie(p => ({ ...p, reference: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                  placeholder="Ex: BSC-20260714-001, Facture #123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                <textarea
                  rows={3}
                  value={newSortie.motif}
                  onChange={e => setNewSortie(p => ({ ...p, motif: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                  placeholder="Decrivez le motif de la sortie..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4" />
                  )}
                  Enregistrer la sortie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Detail de la sortie</h3>
              <button onClick={() => setShowDetailModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <DetailRow
                label="Date et heure"
                value={new Date(showDetailModal.created_at).toLocaleString('fr-FR')}
              />
              <DetailRow
                label="Type"
                value={showDetailModal.type === 'transfert_sortant' ? 'Virement sortant' : 'Sortie de caisse'}
              />
              <DetailRow
                label="Montant"
                value={`${Number(showDetailModal.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${showDetailModal.devise}`}
                highlight
              />
              <DetailRow label="Reference" value={showDetailModal.reference || '-'} mono />
              <DetailRow label="Motif" value={showDetailModal.motif || '-'} />
              <DetailRow label="Effectue par" value={showDetailModal.effectue_par_name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, suffix, trend, icon, iconBg }: {
  label: string;
  value: string;
  suffix?: string;
  trend?: number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate">
            {value}
            {suffix && <span className="text-sm font-semibold text-gray-500 ml-1">{suffix}</span>}
          </p>
          {trend !== undefined && trend !== 0 && (
            <div className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight, mono }: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${
        highlight ? 'font-bold text-red-600 text-base' : 'text-gray-900'
      } ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
