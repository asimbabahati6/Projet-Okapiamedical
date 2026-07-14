import { useState, useEffect, useMemo } from 'react';
import {
  Coins,
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
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { enregistrerMouvementSortie } from '../../services/caisseService';
import { useToast } from '../../hooks/useToast';

interface HonoraireRow {
  id: string;
  date_prestation: string;
  medecin_id: string;
  medecin_nom: string;
  facture_id: string | null;
  invoice_number: string | null;
  libelle_acte: string;
  montant_acte: number;
  mode_remuneration: string;
  pourcentage: number | null;
  montant_forfait: number | null;
  montant_du: number;
  statut_paiement: string;
  reference_etat: string | null;
  paye_le: string | null;
}

interface MedecinSummary {
  medecin_id: string;
  medecin_nom: string;
  total_du: number;
  total_paye: number;
  total_verse: number;
  solde: number;
  count: number;
}

interface Prestataire {
  id: string;
  nom_complet: string;
}

export default function HonorairesPage() {
  const { isDirecteurGeneral, isGestionnaire, isAccountant, isCaissiere } = useFinancialPermissions();
  const canView = isDirecteurGeneral || isGestionnaire || isAccountant || isCaissiere;
  const canPay = isDirecteurGeneral || isGestionnaire || isAccountant;
  const { showToast } = useToast();

  const [honoraires, setHonoraires] = useState<HonoraireRow[]>([]);
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [versements, setVersements] = useState<Array<{ medecin_id: string; montant: number }>>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMedecin, setSelectedMedecin] = useState('all');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [statutFilter, setStatutFilter] = useState<'all' | 'a_payer' | 'paye'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showPayModal, setShowPayModal] = useState(false);
  const [payingMedecinId, setPayingMedecinId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ montant: '', devise: 'USD' as 'USD' | 'CDF', reference: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState<HonoraireRow | null>(null);

  useEffect(() => { if (canView) loadData(); }, [canView, dateFrom, dateTo]);

  async function loadData() {
    setLoading(true);
    try {
      const [honRes, presRes, verRes] = await Promise.all([
        supabase.from('honoraires_medecins').select('*')
          .gte('date_prestation', dateFrom)
          .lte('date_prestation', dateTo)
          .order('date_prestation', { ascending: false }),
        supabase.from('medecins_prestataires').select('id, nom_complet').eq('actif', true).order('nom_complet'),
        supabase.from('versements_honoraires').select('medecin_id, montant').eq('type_versement', 'honoraire'),
      ]);

      setPrestataires(presRes.data || []);
      setVersements(verRes.data || []);

      const rows = honRes.data || [];
      const medecinIds = [...new Set(rows.map((r: any) => r.medecin_id))];
      const invoiceIds = [...new Set(rows.map((r: any) => r.facture_id).filter(Boolean))];

      const mMap: Record<string, string> = {};
      if (medecinIds.length > 0) {
        const { data } = await supabase.from('medecins_prestataires').select('id, nom_complet').in('id', medecinIds);
        for (const m of data || []) mMap[m.id] = m.nom_complet;
      }

      const iMap: Record<string, string> = {};
      if (invoiceIds.length > 0) {
        const { data } = await supabase.from('invoices').select('id, invoice_number').in('id', invoiceIds);
        for (const inv of data || []) iMap[inv.id] = inv.invoice_number;
      }

      setHonoraires(rows.map((r: any) => ({
        ...r,
        medecin_nom: mMap[r.medecin_id] || 'Inconnu',
        invoice_number: r.facture_id ? (iMap[r.facture_id] || null) : null,
      })));
    } catch (err: any) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...honoraires];
    if (selectedMedecin !== 'all') list = list.filter(h => h.medecin_id === selectedMedecin);
    if (statutFilter === 'a_payer') list = list.filter(h => h.statut_paiement !== 'paye');
    if (statutFilter === 'paye') list = list.filter(h => h.statut_paiement === 'paye');
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(h => h.medecin_nom.toLowerCase().includes(q) || h.libelle_acte.toLowerCase().includes(q) || (h.reference_etat || '').toLowerCase().includes(q));
    }
    return list;
  }, [honoraires, selectedMedecin, statutFilter, searchTerm]);

  const summaries = useMemo<MedecinSummary[]>(() => {
    const map: Record<string, MedecinSummary> = {};
    for (const h of honoraires) {
      if (!map[h.medecin_id]) {
        const totalVerse = versements.filter(v => v.medecin_id === h.medecin_id).reduce((s, v) => s + Number(v.montant), 0);
        map[h.medecin_id] = { medecin_id: h.medecin_id, medecin_nom: h.medecin_nom, total_du: 0, total_paye: 0, total_verse: totalVerse, solde: 0, count: 0 };
      }
      const s = map[h.medecin_id];
      s.total_du += Number(h.montant_du);
      if (h.statut_paiement === 'paye') s.total_paye += Number(h.montant_du);
      s.count++;
    }
    for (const s of Object.values(map)) {
      s.solde = s.total_du - s.total_verse;
    }
    return Object.values(map).sort((a, b) => b.solde - a.solde);
  }, [honoraires, versements]);

  const globalStats = useMemo(() => ({
    totalDu: honoraires.reduce((s, h) => s + Number(h.montant_du), 0),
    totalAPayer: honoraires.filter(h => h.statut_paiement !== 'paye').reduce((s, h) => s + Number(h.montant_du), 0),
    totalVerse: versements.reduce((s, v) => s + Number(v.montant), 0),
    count: honoraires.length,
  }), [honoraires, versements]);

  function openPay(medecinId: string) {
    const summary = summaries.find(s => s.medecin_id === medecinId);
    setPayingMedecinId(medecinId);
    setPayForm({ montant: summary ? Math.max(summary.solde, 0).toFixed(2) : '', devise: 'USD', reference: '', notes: '' });
    setShowPayModal(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payingMedecinId) return;
    const montant = parseFloat(payForm.montant);
    if (!montant || montant <= 0) { showToast('Montant invalide', 'error'); return; }

    setSubmitting(true);
    try {
      const medecin = prestataires.find(p => p.id === payingMedecinId);
      const ref = payForm.reference || `HON-VER-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

      await supabase.from('versements_honoraires').insert({
        type_versement: 'honoraire',
        medecin_id: payingMedecinId,
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
        motif: `Versement honoraires: ${medecin?.nom_complet || 'Prestataire'}`,
      });

      const unpaid = honoraires
        .filter(h => h.medecin_id === payingMedecinId && h.statut_paiement !== 'paye')
        .sort((a, b) => new Date(a.date_prestation).getTime() - new Date(b.date_prestation).getTime());

      let remaining = montant;
      for (const h of unpaid) {
        if (remaining <= 0) break;
        if (remaining >= Number(h.montant_du)) {
          await supabase.from('honoraires_medecins').update({ statut_paiement: 'paye', paye_le: new Date().toISOString() }).eq('id', h.id);
          remaining -= Number(h.montant_du);
        } else {
          break;
        }
      }

      showToast(`Versement de ${montant.toLocaleString('fr-FR')} ${payForm.devise} enregistre`, 'success');
      setShowPayModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function exportCSV() {
    if (filtered.length === 0) { showToast('Aucune donnee', 'error'); return; }
    const lines = [
      'RELEVE DES HONORAIRES',
      `Periode;${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}`,
      `Genere le;${new Date().toLocaleString('fr-FR')}`,
      `Total honoraires;${globalStats.totalDu.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`,
      `Total verse;${globalStats.totalVerse.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`,
      '',
      'Date;Medecin;Acte;Montant Acte;Mode;Taux/Forfait;Honoraire Du;Ref;Statut',
    ];
    for (const h of filtered) {
      lines.push([
        h.date_prestation,
        `"${h.medecin_nom}"`,
        `"${h.libelle_acte}"`,
        Number(h.montant_acte).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        h.mode_remuneration === 'pourcentage' ? 'Pourcentage' : 'Forfait',
        h.mode_remuneration === 'pourcentage' ? `${h.pourcentage}%` : `${h.montant_forfait} USD`,
        Number(h.montant_du).toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        h.reference_etat || '-',
        h.statut_paiement === 'paye' ? 'Paye' : 'A payer',
      ].join(';'));
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `honoraires-${dateFrom}-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Export telecharge', 'success');
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            Honoraires
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suivi et versement des honoraires aux medecins prestataires</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total honoraires dus" value={globalStats.totalDu} suffix="USD" icon={<DollarSign className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-100" />
        <KPI label="Reste a verser" value={Math.max(globalStats.totalDu - globalStats.totalVerse, 0)} suffix="USD" icon={<Banknote className="w-5 h-5 text-red-600" />} iconBg="bg-red-100" alert />
        <KPI label="Total verse" value={globalStats.totalVerse} suffix="USD" icon={<CheckCircle className="w-5 h-5 text-green-600" />} iconBg="bg-green-100" />
        <KPI label="Nombre d'actes" value={globalStats.count} icon={<Coins className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" isCount />
      </div>

      {/* Summary by Medecin */}
      {summaries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Solde par prestataire</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Medecin</th>
                  <th className="px-4 py-3 text-right">Total du</th>
                  <th className="px-4 py-3 text-right">Total verse</th>
                  <th className="px-4 py-3 text-right">Solde</th>
                  <th className="px-4 py-3 text-center">Actes</th>
                  {canPay && <th className="px-4 py-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaries.map(s => (
                  <tr key={s.medecin_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.medecin_nom}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.total_du.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-green-700 tabular-nums">{s.total_verse.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${s.solde > 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {s.solde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{s.count}</td>
                    {canPay && (
                      <td className="px-4 py-3 text-center">
                        {s.solde > 0 && (
                          <button onClick={() => openPay(s.medecin_id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-colors">
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

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={selectedMedecin} onChange={e => setSelectedMedecin(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
            <option value="all">Tous les medecins</option>
            {prestataires.map(p => <option key={p.id} value={p.id}>{p.nom_complet}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
          <span className="text-gray-400 text-sm">a</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['all', 'a_payer', 'paye'] as const).map(s => (
            <button key={s} onClick={() => setStatutFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statutFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'Tous' : s === 'a_payer' ? 'A payer' : 'Payes'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Detail des honoraires ({filtered.length})</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Coins className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucun honoraire sur cette periode</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Medecin</th>
                  <th className="px-4 py-3 text-left">Acte</th>
                  <th className="px-4 py-3 text-right">Montant acte</th>
                  <th className="px-4 py-3 text-center">Mode</th>
                  <th className="px-4 py-3 text-right">Honoraire du</th>
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(h.date_prestation).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{h.medecin_nom}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={h.libelle_acte}>{h.libelle_acte}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{Number(h.montant_acte).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${h.mode_remuneration === 'pourcentage' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {h.mode_remuneration === 'pourcentage' ? `${h.pourcentage}%` : `${h.montant_forfait} USD`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-amber-700">{Number(h.montant_du).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{h.reference_etat || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${h.statut_paiement === 'paye' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {h.statut_paiement === 'paye' ? 'Paye' : 'A payer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setShowDetailModal(h)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {showPayModal && payingMedecinId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-amber-600" /></div>
                Versement d'honoraires
              </h3>
              <button onClick={() => setShowPayModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-700">{prestataires.find(p => p.id === payingMedecinId)?.nom_complet}</p>
                <p className="text-xs text-gray-500 mt-0.5">Solde restant: <span className="font-bold text-red-600">{summaries.find(s => s.medecin_id === payingMedecinId)?.solde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                  <input type="number" step="0.01" min="0.01" value={payForm.montant} onChange={e => setPayForm(f => ({ ...f, montant: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select value={payForm.devise} onChange={e => setPayForm(f => ({ ...f, devise: e.target.value as 'USD' | 'CDF' }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400">
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" placeholder="N de cheque, virement..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm">Annuler</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <CheckCircle className="w-4 h-4" />}
                  Confirmer le versement
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
              <h3 className="text-lg font-bold text-gray-900">Detail de l'honoraire</h3>
              <button onClick={() => setShowDetailModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-3">
              <DR label="Date" value={new Date(showDetailModal.date_prestation).toLocaleDateString('fr-FR')} />
              <DR label="Medecin" value={showDetailModal.medecin_nom} />
              <DR label="Acte" value={showDetailModal.libelle_acte} />
              <DR label="N Facture" value={showDetailModal.invoice_number || '-'} />
              <DR label="Montant acte" value={`${Number(showDetailModal.montant_acte).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} />
              <DR label="Mode" value={showDetailModal.mode_remuneration === 'pourcentage' ? `Pourcentage (${showDetailModal.pourcentage}%)` : `Forfait (${showDetailModal.montant_forfait} USD)`} />
              <DR label="Honoraire du" value={`${Number(showDetailModal.montant_du).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} highlight />
              <DR label="Reference" value={showDetailModal.reference_etat || '-'} />
              <DR label="Statut" value={showDetailModal.statut_paiement === 'paye' ? 'Paye' : 'A payer'} />
              {showDetailModal.paye_le && <DR label="Paye le" value={new Date(showDetailModal.paye_le).toLocaleDateString('fr-FR')} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, suffix, icon, iconBg, alert, isCount }: { label: string; value: number; suffix?: string; icon: React.ReactNode; iconBg: string; alert?: boolean; isCount?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 ${alert && value > 0 ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${alert && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {isCount ? value.toLocaleString('fr-FR') : value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            {suffix && <span className="text-sm font-semibold text-gray-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );
}

function DR({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-bold text-amber-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
