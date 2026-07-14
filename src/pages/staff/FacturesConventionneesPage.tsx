import { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Building2,
  CheckCircle,
  Filter,
  DollarSign,
  Banknote,
  X,
  Eye,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { useToast } from '../../hooks/useToast';

interface Convention {
  id: string;
  nom: string;
  code: string | null;
  taux_prise_en_charge: number | null;
  plafond_montant: number | null;
  actif: boolean;
}

interface ConventionInvoice {
  id: string;
  invoice_number: string | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  created_at: string;
  convention_id: string;
  convention_nom: string;
  taux_convention: number;
  part_organisation: number;
  part_patient: number;
  patient_name: string;
  patient_number: string | null;
  creance_reglee: boolean;
  date_reglement: string | null;
}

interface CreanceSummary {
  convention_id: string;
  convention_nom: string;
  total_creances: number;
  total_reglees: number;
  total_impayees: number;
  count_invoices: number;
}

export default function FacturesConventionneesPage() {
  const { isDirecteurGeneral, isGestionnaire, isAccountant, isCaissiere } = useFinancialPermissions();
  const canView = isDirecteurGeneral || isGestionnaire || isAccountant || isCaissiere;
  const canMarkPaid = isDirecteurGeneral || isAccountant;
  const { showToast } = useToast();

  const [conventions, setConventions] = useState<Convention[]>([]);
  const [invoices, setInvoices] = useState<ConventionInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedConvention, setSelectedConvention] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'impayee' | 'reglee'>('all');

  const [showPayModal, setShowPayModal] = useState(false);
  const [payingConventionId, setPayingConventionId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ montant: '', devise: 'USD' as 'USD' | 'CDF', reference: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState<ConventionInvoice | null>(null);

  useEffect(() => { if (canView) loadData(); }, [canView, dateFrom, dateTo]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: convData } = await supabase.from('conventions').select('id, nom, code, taux_prise_en_charge, plafond_montant, actif').order('nom');
      setConventions(convData || []);

      const { data: invData, error } = await supabase
        .from('invoices')
        .select('*')
        .not('convention_id', 'is', null)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = invData || [];
      const patientIds = [...new Set(rows.map((r: any) => r.patient_id).filter(Boolean))];
      // convention data already loaded above

      const pMap: Record<string, { first_name: string; last_name: string; patient_number: string | null }> = {};
      if (patientIds.length > 0) {
        const { data: patients } = await supabase.from('patients').select('id, first_name, last_name, patient_number').in('id', patientIds);
        for (const p of patients || []) pMap[p.id] = p;
      }

      const cMap: Record<string, Convention> = {};
      for (const c of convData || []) cMap[c.id] = c;

      const mapped: ConventionInvoice[] = rows.map((inv: any) => {
        const conv = cMap[inv.convention_id];
        const taux = conv?.taux_prise_en_charge ?? 0;
        const total = Number(inv.net_to_pay || inv.total_amount || 0);
        const partOrg = Math.min(total * taux / 100, conv?.plafond_montant ? Number(conv.plafond_montant) : Infinity);
        const partPatient = total - partOrg;
        const pat = pMap[inv.patient_id];

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          total_amount: total,
          paid_amount: Number(inv.paid_amount || 0),
          balance: Number(inv.balance || 0),
          status: inv.status,
          created_at: inv.created_at,
          convention_id: inv.convention_id,
          convention_nom: conv?.nom || 'Inconnue',
          taux_convention: taux,
          part_organisation: partOrg,
          part_patient: partPatient,
          patient_name: pat ? `${pat.first_name} ${pat.last_name}` : 'Inconnu',
          patient_number: pat?.patient_number || null,
          creance_reglee: inv.paid_amount >= total || inv.status === 'paid',
          date_reglement: inv.payment_date,
        };
      });

      setInvoices(mapped);
    } catch (err: any) {
      showToast(err.message || 'Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (selectedConvention !== 'all') list = list.filter(i => i.convention_id === selectedConvention);
    if (statusFilter === 'impayee') list = list.filter(i => !i.creance_reglee);
    if (statusFilter === 'reglee') list = list.filter(i => i.creance_reglee);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(i =>
        i.patient_name.toLowerCase().includes(q) ||
        (i.invoice_number || '').toLowerCase().includes(q) ||
        (i.patient_number || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, selectedConvention, statusFilter, searchTerm]);

  const creanceSummaries = useMemo<CreanceSummary[]>(() => {
    const map: Record<string, CreanceSummary> = {};
    for (const inv of invoices) {
      if (!map[inv.convention_id]) {
        map[inv.convention_id] = {
          convention_id: inv.convention_id,
          convention_nom: inv.convention_nom,
          total_creances: 0,
          total_reglees: 0,
          total_impayees: 0,
          count_invoices: 0,
        };
      }
      const s = map[inv.convention_id];
      s.count_invoices++;
      s.total_creances += inv.part_organisation;
      if (inv.creance_reglee) s.total_reglees += inv.part_organisation;
      else s.total_impayees += inv.part_organisation;
    }
    return Object.values(map).sort((a, b) => b.total_impayees - a.total_impayees);
  }, [invoices]);

  const globalStats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.part_organisation, 0);
    const impayees = invoices.filter(i => !i.creance_reglee).reduce((s, i) => s + i.part_organisation, 0);
    const reglees = total - impayees;
    return { total, impayees, reglees, count: invoices.length };
  }, [invoices]);

  function openPayConvention(convId: string) {
    const summary = creanceSummaries.find(s => s.convention_id === convId);
    setPayingConventionId(convId);
    setPayForm({ montant: summary ? summary.total_impayees.toFixed(2) : '', devise: 'USD', reference: '', notes: '' });
    setShowPayModal(true);
  }

  async function handleMarkPaid(e: React.FormEvent) {
    e.preventDefault();
    if (!payingConventionId) return;
    const montant = parseFloat(payForm.montant);
    if (!montant || montant <= 0) { showToast('Montant invalide', 'error'); return; }

    setSubmitting(true);
    try {
      const unpaidInvoices = invoices
        .filter(i => i.convention_id === payingConventionId && !i.creance_reglee)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      let remaining = montant;
      for (const inv of unpaidInvoices) {
        if (remaining <= 0) break;
        const toPay = Math.min(remaining, inv.part_organisation);
        const newPaid = inv.paid_amount + toPay;
        const newBalance = inv.total_amount - newPaid;
        const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : inv.status;

        const { error } = await supabase.from('invoices').update({
          paid_amount: newPaid,
          balance: Math.max(newBalance, 0),
          status: newStatus,
          payment_date: new Date().toISOString(),
        }).eq('id', inv.id);
        if (error) throw error;

        await supabase.from('payment_history').insert({
          invoice_id: inv.id,
          payment_amount: toPay,
          payment_method: 'Virement convention',
          transaction_reference: payForm.reference || `CONV-${new Date().toISOString().slice(0, 10)}`,
          notes: payForm.notes || `Reglement convention: ${inv.convention_nom}`,
        });

        remaining -= toPay;
      }

      showToast(`Reglement de ${montant.toLocaleString('fr-FR')} ${payForm.devise} enregistre`, 'success');
      setShowPayModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erreur', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function exportCSV() {
    const data = selectedConvention !== 'all'
      ? filtered
      : filtered;
    if (data.length === 0) { showToast('Aucune donnee a exporter', 'error'); return; }

    const convName = selectedConvention !== 'all'
      ? conventions.find(c => c.id === selectedConvention)?.nom || 'convention'
      : 'toutes-conventions';

    const lines: string[] = [];
    lines.push('RELEVE DES FACTURES CONVENTIONNEES');
    lines.push(`Organisation;${convName}`);
    lines.push(`Periode;${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}`);
    lines.push(`Genere le;${new Date().toLocaleString('fr-FR')}`);
    lines.push(`Nombre de factures;${data.length}`);
    lines.push(`Total creances;${data.reduce((s, i) => s + i.part_organisation, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`);
    lines.push(`Total impayees;${data.filter(i => !i.creance_reglee).reduce((s, i) => s + i.part_organisation, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`);
    lines.push('');
    lines.push('N Facture;Date;Patient;N Patient;Total Facture;Taux Conv.;Part Organisation;Part Patient;Statut');
    for (const inv of data) {
      lines.push([
        inv.invoice_number || '-',
        new Date(inv.created_at).toLocaleDateString('fr-FR'),
        `"${inv.patient_name}"`,
        inv.patient_number || '-',
        inv.total_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        `${inv.taux_convention}%`,
        inv.part_organisation.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        inv.part_patient.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
        inv.creance_reglee ? 'Reglee' : 'Impayee',
      ].join(';'));
    }

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `releve-${convName.toLowerCase().replace(/\s+/g, '-')}-${dateFrom}-${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    showToast('Export telecharge', 'success');
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            Factures Conventionnees
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des creances et reglements par organisation</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <Download className="w-4 h-4" /> Exporter releve
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total creances" value={globalStats.total} suffix="USD" icon={<DollarSign className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" />
        <KPICard label="Creances impayees" value={globalStats.impayees} suffix="USD" icon={<Banknote className="w-5 h-5 text-red-600" />} iconBg="bg-red-100" alert={globalStats.impayees > 0} />
        <KPICard label="Creances reglees" value={globalStats.reglees} suffix="USD" icon={<CheckCircle className="w-5 h-5 text-green-600" />} iconBg="bg-green-100" />
        <KPICard label="Factures conventionnees" value={globalStats.count} icon={<FileCheck className="w-5 h-5 text-indigo-600" />} iconBg="bg-indigo-100" isCount />
      </div>

      {/* Creances by Convention */}
      {creanceSummaries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" /> Creances par organisation
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Organisation</th>
                  <th className="px-4 py-3 text-right">Total creances</th>
                  <th className="px-4 py-3 text-right">Reglees</th>
                  <th className="px-4 py-3 text-right">Impayees</th>
                  <th className="px-4 py-3 text-center">Factures</th>
                  {canMarkPaid && <th className="px-4 py-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creanceSummaries.map(s => (
                  <tr key={s.convention_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.convention_nom}</td>
                    <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{s.total_creances.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium tabular-nums">{s.total_reglees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-bold tabular-nums">{s.total_impayees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{s.count_invoices}</td>
                    {canMarkPaid && (
                      <td className="px-4 py-3 text-center">
                        {s.total_impayees > 0 && (
                          <button onClick={() => openPayConvention(s.convention_id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Regler
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
          <select value={selectedConvention} onChange={e => setSelectedConvention(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
            <option value="all">Toutes les conventions</option>
            {conventions.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
          <span className="text-gray-400 text-sm">a</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['all', 'impayee', 'reglee'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'Toutes' : s === 'impayee' ? 'Impayees' : 'Reglees'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher patient, n facture..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Factures ({filtered.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileCheck className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucune facture conventionnee trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">N Facture</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Convention</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Taux</th>
                  <th className="px-4 py-3 text-right">Part Org.</th>
                  <th className="px-4 py-3 text-right">Part Patient</th>
                  <th className="px-4 py-3 text-center">Creance</th>
                  <th className="px-4 py-3 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.invoice_number || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{inv.patient_name}</span>
                      {inv.patient_number && <span className="ml-1.5 text-xs text-gray-400">{inv.patient_number}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{inv.convention_nom}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 font-medium">{inv.total_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{inv.taux_convention}%</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-indigo-700">{inv.part_organisation.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{inv.part_patient.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${inv.creance_reglee ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {inv.creance_reglee ? 'Reglee' : 'Impayee'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setShowDetailModal(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Convention Modal */}
      {showPayModal && payingConventionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                Reglement convention
              </h3>
              <button onClick={() => setShowPayModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleMarkPaid} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{conventions.find(c => c.id === payingConventionId)?.nom}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Creances impayees: <span className="font-bold text-red-600">{creanceSummaries.find(s => s.convention_id === payingConventionId)?.total_impayees.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant recu *</label>
                  <input type="number" step="0.01" min="0.01" value={payForm.montant} onChange={e => setPayForm(f => ({ ...f, montant: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select value={payForm.devise} onChange={e => setPayForm(f => ({ ...f, devise: e.target.value as 'USD' | 'CDF' }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-400">
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference transfert</label>
                <input type="text" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-400" placeholder="N de virement, cheque..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm">Annuler</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <CheckCircle className="w-4 h-4" />}
                  Confirmer le reglement
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
              <h3 className="text-lg font-bold text-gray-900">Detail facture</h3>
              <button onClick={() => setShowDetailModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-3">
              <DetailRow label="N Facture" value={showDetailModal.invoice_number || '-'} mono />
              <DetailRow label="Date" value={new Date(showDetailModal.created_at).toLocaleDateString('fr-FR')} />
              <DetailRow label="Patient" value={showDetailModal.patient_name} />
              <DetailRow label="Convention" value={showDetailModal.convention_nom} />
              <div className="h-px bg-gray-100 my-2" />
              <DetailRow label="Total facture" value={`${showDetailModal.total_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} />
              <DetailRow label="Taux convention" value={`${showDetailModal.taux_convention}%`} />
              <DetailRow label="Part organisation" value={`${showDetailModal.part_organisation.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} highlight />
              <DetailRow label="Part patient (ticket moderateur)" value={`${showDetailModal.part_patient.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} />
              <div className="h-px bg-gray-100 my-2" />
              <DetailRow label="Statut creance" value={showDetailModal.creance_reglee ? 'Reglee' : 'Impayee'} />
              {showDetailModal.date_reglement && <DetailRow label="Date reglement" value={new Date(showDetailModal.date_reglement).toLocaleDateString('fr-FR')} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, suffix, icon, iconBg, alert, isCount }: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  iconBg: string;
  alert?: boolean;
  isCount?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 ${alert ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-900'}`}>
            {isCount ? value.toLocaleString('fr-FR') : value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            {suffix && <span className="text-sm font-semibold text-gray-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-bold text-indigo-700' : 'text-gray-900'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
