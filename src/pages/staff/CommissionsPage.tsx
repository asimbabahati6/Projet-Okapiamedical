import { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Banknote,
  CheckCircle,
  X,
  CreditCard,
  Eye,
  Info,
  PieChart,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { enregistrerMouvementSortie } from '../../services/caisseService';
import { useToast } from '../../hooks/useToast';

interface CommissionRow {
  id: string;
  date_commission: string;
  medecin_id: string;
  medecin_nom: string;
  facture_id: string | null;
  acte_id: string | null;
  invoice_number: string | null;
  libelle_acte: string;
  montant_acte: number;
  mode_remuneration: 'pourcentage' | 'forfait';
  pourcentage: number | null;
  montant_forfait: number | null;
  montant_base: number;
  montant_du: number;
  prorata_ratio: number;
  statut_paiement: 'a_payer' | 'non_paye' | 'paye';
  depense_id: string | null;
  paye_le: string | null;
  reference_etat: string | null;
}

interface BenefSummary {
  medecin_id: string;
  medecin_nom: string;
  total_du: number;
  total_verse: number;
  solde: number;
  count: number;
}

interface Apporteur {
  id: string;
  nom_complet: string;
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

export default function CommissionsPage() {
  const { isDirecteurGeneral, isGestionnaire, isAccountant, isCaissiere } = useFinancialPermissions();
  const canView = isDirecteurGeneral || isGestionnaire || isAccountant || isCaissiere;
  const canPay = isDirecteurGeneral || isGestionnaire || isAccountant;
  const { showToast } = useToast();

  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [apporteurs, setApporteurs] = useState<Apporteur[]>([]);
  const [versements, setVersements] = useState<Array<{ medecin_id: string; montant: number }>>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBenef, setSelectedBenef] = useState('all');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [statutFilter, setStatutFilter] = useState<'all' | 'a_payer' | 'paye'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showPayModal, setShowPayModal] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ montant: '', devise: 'USD' as 'USD' | 'CDF', reference: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const [showDetail, setShowDetail] = useState<CommissionRow | null>(null);

  useEffect(() => {
    if (canView) loadData();
  }, [canView, dateFrom, dateTo]);

  async function loadData() {
    setLoading(true);
    try {
      const [comRes, apRes, verRes] = await Promise.all([
        supabase
          .from('commissions_medecins')
          .select('*')
          .gte('date_commission', dateFrom)
          .lte('date_commission', dateTo)
          .order('date_commission', { ascending: false }),
        supabase
          .from('medecins_prestataires')
          .select('id, nom_complet')
          .eq('actif', true)
          .in('type', ['apporteur', 'les_deux'])
          .order('nom_complet'),
        supabase
          .from('versements_honoraires')
          .select('medecin_id, montant')
          .eq('type_versement', 'commission'),
      ]);

      setApporteurs(apRes.data || []);
      setVersements(verRes.data || []);

      const rows = comRes.data || [];
      const medecinIds = [...new Set(rows.map((r: any) => r.medecin_id))];
      const invoiceIds = [...new Set(rows.map((r: any) => r.facture_id).filter(Boolean))];

      const mMap: Record<string, string> = {};
      if (medecinIds.length > 0) {
        const { data } = await supabase
          .from('medecins_prestataires')
          .select('id, nom_complet')
          .in('id', medecinIds);
        for (const m of data || []) mMap[m.id] = m.nom_complet;
      }

      const iMap: Record<string, string> = {};
      if (invoiceIds.length > 0) {
        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_number')
          .in('id', invoiceIds);
        for (const inv of data || []) iMap[inv.id] = inv.invoice_number;
      }

      setCommissions(
        rows.map((r: any) => ({
          ...r,
          medecin_nom: mMap[r.medecin_id] || 'Inconnu',
          invoice_number: r.facture_id ? iMap[r.facture_id] || null : null,
        }))
      );
    } catch (err: any) {
      showToast(err.message || 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  /* ---------- derived data ---------- */

  const filtered = useMemo(() => {
    let list = [...commissions];
    if (selectedBenef !== 'all') list = list.filter((c) => c.medecin_id === selectedBenef);
    if (statutFilter === 'a_payer') list = list.filter((c) => c.statut_paiement !== 'paye');
    if (statutFilter === 'paye') list = list.filter((c) => c.statut_paiement === 'paye');
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.medecin_nom.toLowerCase().includes(q) ||
          c.libelle_acte.toLowerCase().includes(q) ||
          (c.reference_etat || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [commissions, selectedBenef, statutFilter, searchTerm]);

  const hasProrata = useMemo(
    () => commissions.some((c) => Number(c.prorata_ratio) < 1),
    [commissions]
  );

  const summaries = useMemo<BenefSummary[]>(() => {
    const map: Record<string, BenefSummary> = {};
    for (const c of commissions) {
      if (!map[c.medecin_id]) {
        const tv = versements
          .filter((v) => v.medecin_id === c.medecin_id)
          .reduce((s, v) => s + Number(v.montant), 0);
        map[c.medecin_id] = {
          medecin_id: c.medecin_id,
          medecin_nom: c.medecin_nom,
          total_du: 0,
          total_verse: tv,
          solde: 0,
          count: 0,
        };
      }
      const s = map[c.medecin_id];
      s.total_du += Number(c.montant_du);
      s.count++;
    }
    for (const s of Object.values(map)) s.solde = s.total_du - s.total_verse;
    return Object.values(map).sort((a, b) => b.solde - a.solde);
  }, [commissions, versements]);

  const globalStats = useMemo(() => {
    const totalDu = commissions.reduce((s, c) => s + Number(c.montant_du), 0);
    const totalVerse = versements.reduce((s, v) => s + Number(v.montant), 0);
    return {
      totalDu,
      resteAVerser: Math.max(totalDu - totalVerse, 0),
      totalVerse,
      count: commissions.length,
    };
  }, [commissions, versements]);

  /* ---------- actions ---------- */

  function openPay(medecinId: string) {
    const s = summaries.find((x) => x.medecin_id === medecinId);
    setPayingId(medecinId);
    setPayForm({
      montant: s ? Math.max(s.solde, 0).toFixed(2) : '',
      devise: 'USD',
      reference: '',
      notes: '',
    });
    setShowPayModal(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payingId) return;
    const montant = parseFloat(payForm.montant);
    if (!montant || montant <= 0) {
      showToast('Montant invalide', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const med = apporteurs.find((p) => p.id === payingId);
      const ref =
        payForm.reference ||
        `COM-VER-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

      await supabase.from('versements_honoraires').insert({
        type_versement: 'commission',
        medecin_id: payingId,
        montant,
        devise: payForm.devise,
        reference: ref,
        notes: payForm.notes || null,
        periode_debut: dateFrom,
        periode_fin: dateTo,
      });

      await enregistrerMouvementSortie({
        montant,
        devise: payForm.devise,
        reference: ref,
        motif: `Versement commissions: ${med?.nom_complet || 'Beneficiaire'}`,
      });

      // Mark individual commission rows as 'paye', oldest first
      const unpaid = commissions
        .filter((c) => c.medecin_id === payingId && c.statut_paiement !== 'paye')
        .sort(
          (a, b) =>
            new Date(a.date_commission).getTime() - new Date(b.date_commission).getTime()
        );

      let remaining = montant;
      for (const c of unpaid) {
        if (remaining <= 0) break;
        const due = Number(c.montant_du);
        if (remaining >= due) {
          await supabase
            .from('commissions_medecins')
            .update({ statut_paiement: 'paye', paye_le: new Date().toISOString() })
            .eq('id', c.id);
          remaining -= due;
        } else {
          break;
        }
      }

      showToast(`Versement de ${fmt(montant)} ${payForm.devise} enregistre`, 'success');
      setShowPayModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du versement', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function exportCSV() {
    if (filtered.length === 0) {
      showToast('Aucune donnee a exporter', 'error');
      return;
    }
    const lines = [
      'RELEVE DES COMMISSIONS — MEDECINS APPORTEURS',
      `Periode;${fmtDate(dateFrom)} au ${fmtDate(dateTo)}`,
      `Genere le;${new Date().toLocaleString('fr-FR')}`,
      `Total commissions dues;${fmt(globalStats.totalDu)} USD`,
      `Total verse;${fmt(globalStats.totalVerse)} USD`,
      `Reste a verser;${fmt(globalStats.resteAVerser)} USD`,
      '',
      'Date;Beneficiaire;Acte;Montant Acte;Mode;Taux/Forfait;Montant Base;Prorata;Commission Due;Ref;Statut',
    ];
    for (const c of filtered) {
      const ratio = Number(c.prorata_ratio);
      lines.push(
        [
          c.date_commission,
          `"${c.medecin_nom}"`,
          `"${c.libelle_acte}"`,
          fmt(Number(c.montant_acte)),
          c.mode_remuneration === 'pourcentage' ? 'Pourcentage' : 'Forfait',
          c.mode_remuneration === 'pourcentage' ? `${c.pourcentage}%` : `${c.montant_forfait} USD`,
          fmt(Number(c.montant_base)),
          ratio < 1 ? `${Math.round(ratio * 100)}%` : '100%',
          fmt(Number(c.montant_du)),
          c.reference_etat || '-',
          c.statut_paiement === 'paye' ? 'Paye' : 'A payer',
        ].join(';')
      );
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${dateFrom}-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Export CSV telecharge', 'success');
  }

  /* ---------- render ---------- */

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
          <p className="text-gray-400 text-sm mt-1">
            Vous n'avez pas les droits pour consulter les commissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            Commissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Suivi et versement des commissions aux medecins apporteurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total commissions dues"
          value={globalStats.totalDu}
          suffix="USD"
          icon={<DollarSign className="w-5 h-5 text-teal-600" />}
          iconBg="bg-teal-100"
        />
        <KPICard
          label="Reste a verser"
          value={globalStats.resteAVerser}
          suffix="USD"
          icon={<Banknote className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-100"
          alert
        />
        <KPICard
          label="Total verse"
          value={globalStats.totalVerse}
          suffix="USD"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-100"
        />
        <KPICard
          label="Nombre d'actes"
          value={globalStats.count}
          icon={<Award className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-100"
          isCount
        />
      </div>

      {/* ── Prorata indicator ── */}
      {hasProrata && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
          <PieChart className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Commissions au prorata</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Certaines commissions sont calculees au prorata des paiements partiels recus sur les
              factures. Le montant de base (avant prorata) et le ratio sont affiches dans le detail.
            </p>
          </div>
        </div>
      )}

      {/* ── Summary by beneficiaire ── */}
      {summaries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Solde par beneficiaire
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Beneficiaire</th>
                  <th className="px-4 py-3 text-right">Total du</th>
                  <th className="px-4 py-3 text-right">Total verse</th>
                  <th className="px-4 py-3 text-right">Solde</th>
                  <th className="px-4 py-3 text-center">Actes</th>
                  {canPay && <th className="px-4 py-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaries.map((s) => (
                  <tr key={s.medecin_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.medecin_nom}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(s.total_du)}</td>
                    <td className="px-4 py-3 text-right text-green-700 tabular-nums">
                      {fmt(s.total_verse)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums ${
                        s.solde > 0 ? 'text-red-600' : 'text-green-700'
                      }`}
                    >
                      {fmt(s.solde)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{s.count}</td>
                    {canPay && (
                      <td className="px-4 py-3 text-center">
                        {s.solde > 0 && (
                          <button
                            onClick={() => openPay(s.medecin_id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Verser
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedBenef}
            onChange={(e) => setSelectedBenef(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">Tous les beneficiaires</option>
            {apporteurs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom_complet}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          />
          <span className="text-gray-400 text-sm">a</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['all', 'a_payer', 'paye'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statutFilter === s
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? 'Tous' : s === 'a_payer' ? 'A payer' : 'Payes'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher acte, beneficiaire, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          />
        </div>
      </div>

      {/* ── Detail table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Detail des commissions ({filtered.length})
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Award className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucune commission sur cette periode</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Beneficiaire</th>
                  <th className="px-4 py-3 text-left">Acte</th>
                  <th className="px-4 py-3 text-right">Montant acte</th>
                  <th className="px-4 py-3 text-center">Mode</th>
                  <th className="px-4 py-3 text-center">Prorata</th>
                  <th className="px-4 py-3 text-right">Commission due</th>
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => {
                  const ratio = Number(c.prorata_ratio);
                  const isPartial = ratio < 1;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {fmtDate(c.date_commission)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.medecin_nom}</td>
                      <td
                        className="px-4 py-3 text-gray-600 max-w-[180px] truncate"
                        title={c.libelle_acte}
                      >
                        {c.libelle_acte}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                        {fmt(Number(c.montant_acte))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            c.mode_remuneration === 'pourcentage'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {c.mode_remuneration === 'pourcentage'
                            ? `${c.pourcentage}%`
                            : `${fmt(Number(c.montant_forfait))} USD`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                            <PieChart className="w-3 h-3" />
                            {Math.round(ratio * 100)}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">100%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-teal-700">
                        {fmt(Number(c.montant_du))}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {c.reference_etat || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.statut_paiement === 'paye'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {c.statut_paiement === 'paye' ? 'Paye' : 'A payer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setShowDetail(c)}
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

      {/* ── Versement Modal ── */}
      {showPayModal && payingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowPayModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                </div>
                Versement de commission
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-700">
                  {apporteurs.find((p) => p.id === payingId)?.nom_complet}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Solde restant:{' '}
                  <span className="font-bold text-red-600">
                    {fmt(summaries.find((s) => s.medecin_id === payingId)?.solde ?? 0)} USD
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={payForm.montant}
                    onChange={(e) => setPayForm((f) => ({ ...f, montant: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select
                    value={payForm.devise}
                    onChange={(e) =>
                      setPayForm((f) => ({ ...f, devise: e.target.value as 'USD' | 'CDF' }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  >
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input
                  type="text"
                  value={payForm.reference}
                  onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  placeholder="N de cheque, virement..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={payForm.notes}
                  onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Les commissions les plus anciennes seront marquees comme payees en premier
                  (FIFO). Un mouvement de sortie de caisse sera automatiquement cree.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirmer le versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {showDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowDetail(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Detail de la commission</h3>
              <button
                onClick={() => setShowDetail(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <DetailRow label="Date" value={fmtDate(showDetail.date_commission)} />
              <DetailRow label="Beneficiaire" value={showDetail.medecin_nom} />
              <DetailRow label="Acte" value={showDetail.libelle_acte} />
              <DetailRow label="N° Facture" value={showDetail.invoice_number || '-'} />
              <DetailRow
                label="Montant acte"
                value={`${fmt(Number(showDetail.montant_acte))} USD`}
              />
              <DetailRow
                label="Mode"
                value={
                  showDetail.mode_remuneration === 'pourcentage'
                    ? `Pourcentage (${showDetail.pourcentage}%)`
                    : `Forfait (${fmt(Number(showDetail.montant_forfait))} USD)`
                }
              />
              <DetailRow
                label="Montant base (avant prorata)"
                value={`${fmt(Number(showDetail.montant_base))} USD`}
              />
              {Number(showDetail.prorata_ratio) < 1 && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm text-gray-500">Prorata</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                    <PieChart className="w-3 h-3" />
                    {Math.round(Number(showDetail.prorata_ratio) * 100)}% — paiement partiel
                  </span>
                </div>
              )}
              <DetailRow
                label="Commission due"
                value={`${fmt(Number(showDetail.montant_du))} USD`}
                highlight
              />
              <DetailRow label="Reference" value={showDetail.reference_etat || '-'} />
              <DetailRow
                label="Statut"
                value={showDetail.statut_paiement === 'paye' ? 'Paye' : 'A payer'}
              />
              {showDetail.paye_le && (
                <DetailRow label="Paye le" value={fmtDate(showDetail.paye_le)} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ── */

function KPICard({
  label,
  value,
  suffix,
  icon,
  iconBg,
  alert,
  isCount,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  iconBg: string;
  alert?: boolean;
  isCount?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-5 ${
        alert && value > 0 ? 'border-red-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p
            className={`text-2xl font-bold mt-1 tabular-nums ${
              alert && value > 0 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {isCount ? value.toLocaleString('fr-FR') : fmt(value)}
            {suffix && <span className="text-sm font-semibold text-gray-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm text-right ${highlight ? 'font-bold text-teal-700' : 'text-gray-900'}`}
      >
        {value}
      </span>
    </div>
  );
}
