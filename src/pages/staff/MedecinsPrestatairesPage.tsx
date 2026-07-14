import { useState, useEffect, useMemo } from 'react';
import { UserCheck, Plus, Search, RefreshCw, X, CreditCard as Edit, Eye, ChevronDown, ChevronUp, Percent, DollarSign, Phone, Mail, Stethoscope, Users, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { useToast } from '../../hooks/useToast';

interface Prestataire {
  id: string;
  nom_complet: string;
  specialite: string | null;
  telephone: string | null;
  email: string | null;
  type: string;
  actif: boolean;
  source: string;
  service: string | null;
  mode_remuneration_defaut: string | null;
  taux_defaut: number | null;
  mode_commission_defaut: string | null;
  taux_commission_defaut: number | null;
  user_profile_id: string | null;
  created_at: string;
}

interface DetailStats {
  totalHonoraires: number;
  totalCommissions: number;
  totalVerse: number;
  nbActes: number;
  nbCommissions: number;
}

const TYPE_OPTIONS = [
  { value: 'visiteur', label: 'Visiteur', desc: 'Realise des actes', color: 'bg-blue-100 text-blue-800' },
  { value: 'apporteur', label: 'Apporteur', desc: 'Refere des patients', color: 'bg-green-100 text-green-800' },
  { value: 'les_deux', label: 'Visiteur + Apporteur', desc: 'Les deux roles', color: 'bg-teal-100 text-teal-800' },
];

const emptyForm = {
  nom_complet: '',
  specialite: '',
  telephone: '',
  email: '',
  type: 'visiteur',
  service: '',
  mode_remuneration_defaut: 'pourcentage',
  taux_defaut: '',
  mode_commission_defaut: 'pourcentage',
  taux_commission_defaut: '',
};

export default function MedecinsPrestatairesPage() {
  const { isDirecteurGeneral, isGestionnaire, isAccountant, isCaissiere } = useFinancialPermissions();
  const canView = isDirecteurGeneral || isGestionnaire || isAccountant || isCaissiere;
  const canManage = isDirecteurGeneral || isGestionnaire;
  const { showToast } = useToast();

  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'interne' | 'externe'>('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [showDetail, setShowDetail] = useState<Prestataire | null>(null);
  const [detailStats, setDetailStats] = useState<DetailStats | null>(null);

  useEffect(() => { if (canView) loadData(); }, [canView]);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('medecins_prestataires').select('*').order('nom_complet');
      if (error) throw error;
      setPrestataires(data || []);
    } catch (err: any) {
      showToast(err.message || 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...prestataires];
    if (statusFilter === 'active') list = list.filter(p => p.actif);
    if (statusFilter === 'inactive') list = list.filter(p => !p.actif);
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    if (sourceFilter !== 'all') list = list.filter(p => p.source === sourceFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.nom_complet.toLowerCase().includes(q) ||
        (p.specialite || '').toLowerCase().includes(q) ||
        (p.service || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [prestataires, statusFilter, typeFilter, sourceFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: prestataires.length,
    actifs: prestataires.filter(p => p.actif).length,
    visiteurs: prestataires.filter(p => p.type === 'visiteur' || p.type === 'les_deux').length,
    apporteurs: prestataires.filter(p => p.type === 'apporteur' || p.type === 'les_deux').length,
  }), [prestataires]);

  const showHonorairesFields = form.type === 'visiteur' || form.type === 'les_deux';
  const showCommissionFields = form.type === 'apporteur' || form.type === 'les_deux';

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError('');
    setShowFormModal(true);
  }

  function openEdit(p: Prestataire) {
    setEditingId(p.id);
    setForm({
      nom_complet: p.nom_complet,
      specialite: p.specialite || '',
      telephone: p.telephone || '',
      email: p.email || '',
      type: p.type,
      service: p.service || '',
      mode_remuneration_defaut: p.mode_remuneration_defaut || 'pourcentage',
      taux_defaut: p.taux_defaut?.toString() || '',
      mode_commission_defaut: p.mode_commission_defaut || 'pourcentage',
      taux_commission_defaut: p.taux_commission_defaut?.toString() || '',
    });
    setFormError('');
    setShowFormModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.nom_complet.trim()) { setFormError('Le nom est obligatoire'); return; }

    const isVisiteur = form.type === 'visiteur' || form.type === 'les_deux';
    const isApporteur = form.type === 'apporteur' || form.type === 'les_deux';

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        nom_complet: form.nom_complet.trim(),
        specialite: form.specialite.trim() || null,
        telephone: form.telephone.trim() || null,
        email: form.email.trim() || null,
        type: form.type,
        service: form.service.trim() || null,
        mode_remuneration_defaut: isVisiteur ? form.mode_remuneration_defaut : null,
        taux_defaut: isVisiteur && form.taux_defaut ? parseFloat(form.taux_defaut) : null,
        mode_commission_defaut: isApporteur ? form.mode_commission_defaut : null,
        taux_commission_defaut: isApporteur && form.taux_commission_defaut ? parseFloat(form.taux_commission_defaut) : null,
      };

      if (editingId) {
        const { error } = await supabase.from('medecins_prestataires').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Medecin mis a jour', 'success');
      } else {
        const { error } = await supabase.from('medecins_prestataires').insert({ ...payload, source: 'externe' });
        if (error) throw error;
        showToast('Medecin cree', 'success');
      }
      setShowFormModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(p: Prestataire) {
    try {
      const { error } = await supabase.from('medecins_prestataires').update({ actif: !p.actif }).eq('id', p.id);
      if (error) throw error;
      showToast(`Medecin ${p.actif ? 'desactive' : 'active'}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function openDetail(p: Prestataire) {
    setShowDetail(p);
    setDetailStats(null);
    try {
      const [honRes, comRes, verRes] = await Promise.all([
        supabase.from('honoraires_medecins').select('montant_du').eq('medecin_id', p.id),
        supabase.from('commissions_medecins').select('montant_du').eq('medecin_id', p.id),
        supabase.from('versements_honoraires').select('montant').eq('medecin_id', p.id),
      ]);
      setDetailStats({
        totalHonoraires: (honRes.data || []).reduce((s, r) => s + Number(r.montant_du), 0),
        totalCommissions: (comRes.data || []).reduce((s, r) => s + Number(r.montant_du), 0),
        totalVerse: (verRes.data || []).reduce((s, r) => s + Number(r.montant), 0),
        nbActes: honRes.data?.length || 0,
        nbCommissions: comRes.data?.length || 0,
      });
    } catch { /* ignore */ }
  }

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  }

  function exportCSV() {
    if (filtered.length === 0) { showToast('Aucune donnee', 'error'); return; }
    const lines = [
      'REGISTRE DES MEDECINS PRESTATAIRES',
      `Genere le;${new Date().toLocaleString('fr-FR')}`,
      '',
      'Nom;Specialite;Type;Source;Service;Honoraires Mode;Honoraires Taux;Commission Mode;Commission Taux;Telephone;Email;Statut',
    ];
    for (const p of filtered) {
      const typeLabel = TYPE_OPTIONS.find(t => t.value === p.type)?.label || p.type;
      lines.push([
        `"${p.nom_complet}"`,
        `"${p.specialite || ''}"`,
        typeLabel,
        p.source === 'interne' ? 'Interne' : 'Externe',
        `"${p.service || ''}"`,
        p.mode_remuneration_defaut || '-',
        p.taux_defaut != null ? p.taux_defaut.toString() : '-',
        p.mode_commission_defaut || '-',
        p.taux_commission_defaut != null ? p.taux_commission_defaut.toString() : '-',
        p.telephone || '',
        p.email || '',
        p.actif ? 'Actif' : 'Inactif',
      ].join(';'));
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medecins-prestataires-${new Date().toISOString().slice(0, 10)}.csv`;
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
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
          <p className="text-gray-400 text-sm mt-1">Vous n'avez pas les droits pour acceder a cette page</p>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            Medecins Prestataires
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des medecins visiteurs et apporteurs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          {canManage && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors">
              <Plus className="w-4 h-4" /> Nouveau medecin
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
          { label: 'Actifs', value: stats.actifs, icon: <UserCheck className="w-5 h-5 text-green-600" />, bg: 'bg-green-100' },
          { label: 'Visiteurs', value: stats.visiteurs, icon: <Stethoscope className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Apporteurs', value: stats.apporteurs, icon: <Users className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['all', 'interne', 'externe'] as const).map(s => (
            <button key={s} onClick={() => setSourceFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sourceFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'Toutes sources' : s === 'interne' ? 'Internes' : 'Externes'}
            </button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">Tous les types</option>
          {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom, specialite, service..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Stethoscope className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucun medecin prestataire trouve</p>
            <p className="text-sm text-gray-400 mt-1">Ajustez vos filtres ou ajoutez un nouveau medecin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Medecin</th>
                  <th className="px-4 py-3 text-left">Specialite</th>
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-center">Source</th>
                  <th className="px-4 py-3 text-center">Honoraires</th>
                  <th className="px-4 py-3 text-center">Commission</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const typeInfo = TYPE_OPTIONS.find(t => t.value === p.type) || TYPE_OPTIONS[0];
                  const isVisiteur = p.type === 'visiteur' || p.type === 'les_deux';
                  const isApporteur = p.type === 'apporteur' || p.type === 'les_deux';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{p.nom_complet}</p>
                        {p.service && <p className="text-xs text-gray-400 mt-0.5">{p.service}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.specialite || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${p.source === 'interne' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.source === 'interne' ? 'Interne' : 'Externe'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isVisiteur && p.taux_defaut != null ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                            {p.mode_remuneration_defaut === 'pourcentage' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                            {p.taux_defaut}{p.mode_remuneration_defaut === 'pourcentage' ? '%' : ' USD'}
                          </span>
                        ) : isVisiteur ? (
                          <span className="text-xs text-gray-400 italic">Non defini</span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isApporteur && p.taux_commission_defaut != null ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">
                            {p.mode_commission_defaut === 'pourcentage' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                            {p.taux_commission_defaut}{p.mode_commission_defaut === 'pourcentage' ? '%' : ' USD'}
                          </span>
                        ) : isApporteur ? (
                          <span className="text-xs text-gray-400 italic">Non defini</span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                          {p.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.telephone}</span>}
                          {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                          {!p.telephone && !p.email && <span className="text-gray-300">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${p.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDetail(p)} title="Voir le detail" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <>
                              <button onClick={() => openEdit(p)} title="Modifier" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => toggleStatus(p)} title={p.actif ? 'Desactiver' : 'Activer'} className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${p.actif ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}>
                                {p.actif ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                              </button>
                            </>
                          )}
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

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowFormModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Modifier le medecin' : 'Nouveau medecin prestataire'}</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input type="text" value={form.nom_complet} onChange={e => updateForm('nom_complet', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialite</label>
                  <input type="text" value={form.specialite} onChange={e => updateForm('specialite', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <input type="text" value={form.service} onChange={e => updateForm('service', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="Ex: Chirurgie" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map(t => (
                    <button key={t.value} type="button" onClick={() => updateForm('type', t.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-center transition-all ${form.type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <span className="block">{t.label}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Honoraires rate (for visiteur / les_deux) */}
              {showHonorairesFields && (
                <div className="bg-blue-50/50 rounded-xl p-4 space-y-3 border border-blue-100">
                  <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> Honoraires (taux par defaut)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mode</label>
                      <select value={form.mode_remuneration_defaut} onChange={e => updateForm('mode_remuneration_defaut', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                        <option value="pourcentage">Pourcentage (%)</option>
                        <option value="forfait">Forfait (USD/acte)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{form.mode_remuneration_defaut === 'pourcentage' ? 'Taux (%)' : 'Montant (USD)'}</label>
                      <input type="number" step="0.01" min="0" value={form.taux_defaut} onChange={e => updateForm('taux_defaut', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder={form.mode_remuneration_defaut === 'pourcentage' ? 'Ex: 30' : 'Ex: 50'} />
                    </div>
                  </div>
                </div>
              )}

              {/* Commission rate (for apporteur / les_deux) */}
              {showCommissionFields && (
                <div className="bg-teal-50/50 rounded-xl p-4 space-y-3 border border-teal-100">
                  <p className="text-sm font-semibold text-teal-800 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Commission (taux par defaut)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mode</label>
                      <select value={form.mode_commission_defaut} onChange={e => updateForm('mode_commission_defaut', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
                        <option value="pourcentage">Pourcentage (%)</option>
                        <option value="forfait">Forfait (USD/facture)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{form.mode_commission_defaut === 'pourcentage' ? 'Taux (%)' : 'Montant (USD)'}</label>
                      <input type="number" step="0.01" min="0" value={form.taux_commission_defaut} onChange={e => updateForm('taux_commission_defaut', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder={form.mode_commission_defaut === 'pourcentage' ? 'Ex: 10' : 'Ex: 25'} />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input type="text" value={form.telephone} onChange={e => updateForm('telephone', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm">Annuler</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <UserCheck className="w-4 h-4" />}
                  {editingId ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">{showDetail.nom_complet}</h3>
              <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-3">
              <DRow label="Specialite" value={showDetail.specialite || '-'} />
              <DRow label="Role" value={TYPE_OPTIONS.find(t => t.value === showDetail.type)?.label || showDetail.type} />
              <DRow label="Source" value={showDetail.source === 'interne' ? 'Medecin interne' : 'Externe'} />
              <DRow label="Service" value={showDetail.service || '-'} />
              <DRow label="Statut" value={showDetail.actif ? 'Actif' : 'Inactif'} />
              <DRow label="Telephone" value={showDetail.telephone || '-'} />
              <DRow label="Email" value={showDetail.email || '-'} />

              {(showDetail.type === 'visiteur' || showDetail.type === 'les_deux') && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Honoraires</p>
                  <DRow label="Mode" value={showDetail.mode_remuneration_defaut === 'forfait' ? 'Forfait' : 'Pourcentage'} />
                  <DRow label="Taux/Montant" value={showDetail.taux_defaut != null ? `${showDetail.taux_defaut}${showDetail.mode_remuneration_defaut === 'pourcentage' ? '%' : ' USD/acte'}` : 'Non defini'} />
                </>
              )}

              {(showDetail.type === 'apporteur' || showDetail.type === 'les_deux') && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Commission</p>
                  <DRow label="Mode" value={showDetail.mode_commission_defaut === 'forfait' ? 'Forfait' : 'Pourcentage'} />
                  <DRow label="Taux/Montant" value={showDetail.taux_commission_defaut != null ? `${showDetail.taux_commission_defaut}${showDetail.mode_commission_defaut === 'pourcentage' ? '%' : ' USD/facture'}` : 'Non defini'} />
                </>
              )}

              {detailStats && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Bilan financier</p>
                  <DRow label="Honoraires dus" value={`${detailStats.totalHonoraires.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD (${detailStats.nbActes} actes)`} highlight />
                  <DRow label="Commissions dues" value={`${detailStats.totalCommissions.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD (${detailStats.nbCommissions} refs)`} />
                  <DRow label="Total verse" value={`${detailStats.totalVerse.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} />
                  <DRow label="Solde restant" value={`${(detailStats.totalHonoraires + detailStats.totalCommissions - detailStats.totalVerse).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} highlight />
                </>
              )}

              <DRow label="Date de creation" value={new Date(showDetail.created_at).toLocaleDateString('fr-FR')} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-bold text-blue-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
