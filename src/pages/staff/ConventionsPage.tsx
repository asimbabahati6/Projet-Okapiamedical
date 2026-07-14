import { useState, useEffect, useMemo } from 'react';
import { FileCheck, Plus, Search, RefreshCw, X, CreditCard as Edit, Trash2, Building2, Shield, Heart, MoreHorizontal, Users, ChevronDown, ChevronUp, Eye, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { useToast } from '../../hooks/useToast';

interface Convention {
  id: string;
  nom: string;
  code: string | null;
  type_organisation: string;
  actif: boolean;
  taux_prise_en_charge: number | null;
  plafond_montant: number | null;
  contact_nom: string | null;
  contact_telephone: string | null;
  contact_email: string | null;
  date_debut: string | null;
  date_fin: string | null;
  adresse: string | null;
  notes: string | null;
  created_at: string;
  affilies_count?: number;
}

interface Affiliation {
  id: string;
  patient_id: string;
  convention_id: string;
  numero_affilie: string;
  actif: boolean;
  date_debut: string | null;
  date_fin: string | null;
  patient_name: string;
  patient_number: string | null;
}

const TYPE_OPTIONS = [
  { value: 'entreprise', label: 'Entreprise', icon: Building2, color: 'bg-blue-100 text-blue-800' },
  { value: 'assurance', label: 'Assurance', icon: Shield, color: 'bg-green-100 text-green-800' },
  { value: 'ong', label: 'ONG', icon: Heart, color: 'bg-orange-100 text-orange-800' },
  { value: 'autre', label: 'Autre', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
];

const emptyForm = {
  nom: '',
  code: '',
  type_organisation: 'entreprise',
  taux_prise_en_charge: '100',
  plafond_montant: '',
  contact_nom: '',
  contact_telephone: '',
  contact_email: '',
  date_debut: '',
  date_fin: '',
  adresse: '',
  notes: '',
};

export default function ConventionsPage() {
  const { isDirecteurGeneral, isGestionnaire, isAccountant, isCaissiere } = useFinancialPermissions();
  const canManage = isDirecteurGeneral || isGestionnaire;
  const canView = isDirecteurGeneral || isGestionnaire || isAccountant || isCaissiere;
  const { showToast } = useToast();

  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [showDetailModal, setShowDetailModal] = useState<Convention | null>(null);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loadingAffiliations, setLoadingAffiliations] = useState(false);

  const [showAffiliationModal, setShowAffiliationModal] = useState(false);
  const [affiliationForm, setAffiliationForm] = useState({ patient_id: '', numero_affilie: '' });
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Array<{ id: string; first_name: string; last_name: string; patient_number: string }>>([]);
  const [_searchingPatients, setSearchingPatients] = useState(false);

  useEffect(() => { if (canView) loadConventions(); }, [canView]);

  async function loadConventions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conventions')
        .select('*')
        .order('nom');
      if (error) throw error;

      const rows = data || [];
      const counts: Record<string, number> = {};
      if (rows.length > 0) {
        const { data: affData } = await supabase
          .from('patient_affiliations')
          .select('convention_id');
        for (const a of affData || []) {
          counts[a.convention_id] = (counts[a.convention_id] || 0) + 1;
        }
      }

      setConventions(rows.map(c => ({ ...c, affilies_count: counts[c.id] || 0 })));
    } catch (err: any) {
      showToast(err.message || 'Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...conventions];
    if (statusFilter === 'active') list = list.filter(c => c.actif);
    if (statusFilter === 'inactive') list = list.filter(c => !c.actif);
    if (typeFilter !== 'all') list = list.filter(c => c.type_organisation === typeFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.contact_nom || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [conventions, statusFilter, typeFilter, searchTerm]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError('');
    setShowFormModal(true);
  }

  function openEdit(c: Convention) {
    setEditingId(c.id);
    setForm({
      nom: c.nom,
      code: c.code || '',
      type_organisation: c.type_organisation,
      taux_prise_en_charge: c.taux_prise_en_charge?.toString() || '100',
      plafond_montant: c.plafond_montant?.toString() || '',
      contact_nom: c.contact_nom || '',
      contact_telephone: c.contact_telephone || '',
      contact_email: c.contact_email || '',
      date_debut: c.date_debut || '',
      date_fin: c.date_fin || '',
      adresse: c.adresse || '',
      notes: c.notes || '',
    });
    setFormError('');
    setShowFormModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.nom.trim()) { setFormError('Le nom est obligatoire'); return; }
    const taux = parseFloat(form.taux_prise_en_charge);
    if (isNaN(taux) || taux < 0 || taux > 100) { setFormError('Le taux doit etre entre 0 et 100'); return; }

    setSubmitting(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        code: form.code.trim() || null,
        type_organisation: form.type_organisation,
        taux_prise_en_charge: taux,
        plafond_montant: form.plafond_montant ? parseFloat(form.plafond_montant) : null,
        contact_nom: form.contact_nom.trim() || null,
        contact_telephone: form.contact_telephone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        adresse: form.adresse.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase.from('conventions').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Convention mise a jour', 'success');
      } else {
        const { error } = await supabase.from('conventions').insert(payload);
        if (error) throw error;
        showToast('Convention creee', 'success');
      }
      setShowFormModal(false);
      loadConventions();
    } catch (err: any) {
      setFormError(err.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(c: Convention) {
    try {
      const { error } = await supabase.from('conventions').update({ actif: !c.actif }).eq('id', c.id);
      if (error) throw error;
      showToast(`Convention ${c.actif ? 'desactivee' : 'activee'}`, 'success');
      loadConventions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function openDetail(c: Convention) {
    setShowDetailModal(c);
    setLoadingAffiliations(true);
    try {
      const { data } = await supabase
        .from('patient_affiliations')
        .select('*')
        .eq('convention_id', c.id)
        .order('created_at', { ascending: false });

      const rows = data || [];
      const patientIds = rows.map((r: any) => r.patient_id);
      const pMap: Record<string, { first_name: string; last_name: string; patient_number: string }> = {};
      if (patientIds.length > 0) {
        const { data: patients } = await supabase
          .from('patients')
          .select('id, first_name, last_name, patient_number')
          .in('id', patientIds);
        for (const p of patients || []) pMap[p.id] = p;
      }

      setAffiliations(rows.map((r: any) => ({
        ...r,
        patient_name: pMap[r.patient_id]
          ? `${pMap[r.patient_id].first_name} ${pMap[r.patient_id].last_name}`
          : 'Inconnu',
        patient_number: pMap[r.patient_id]?.patient_number || null,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAffiliations(false);
    }
  }

  async function searchPatients(q: string) {
    setPatientSearch(q);
    if (q.length < 2) { setPatientResults([]); return; }
    setSearchingPatients(true);
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_number')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,patient_number.ilike.%${q}%`)
        .limit(10);
      setPatientResults(data || []);
    } catch { /* ignore */ } finally {
      setSearchingPatients(false);
    }
  }

  async function handleAddAffiliation(e: React.FormEvent) {
    e.preventDefault();
    if (!affiliationForm.patient_id || !affiliationForm.numero_affilie.trim()) {
      showToast('Patient et numero d\'affilie requis', 'error');
      return;
    }
    try {
      const { error } = await supabase.from('patient_affiliations').insert({
        patient_id: affiliationForm.patient_id,
        convention_id: showDetailModal!.id,
        numero_affilie: affiliationForm.numero_affilie.trim(),
      });
      if (error) throw error;
      showToast('Patient affilie', 'success');
      setShowAffiliationModal(false);
      setAffiliationForm({ patient_id: '', numero_affilie: '' });
      setPatientSearch('');
      setPatientResults([]);
      openDetail(showDetailModal!);
      loadConventions();
    } catch (err: any) {
      showToast(err.message?.includes('unique') ? 'Ce patient est deja affilie ou ce numero existe deja' : (err.message || 'Erreur'), 'error');
    }
  }

  async function removeAffiliation(affId: string) {
    try {
      const { error } = await supabase.from('patient_affiliations').delete().eq('id', affId);
      if (error) throw error;
      showToast('Affiliation supprimee', 'success');
      openDetail(showDetailModal!);
      loadConventions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  }

  const getTypeInfo = (t: string) => TYPE_OPTIONS.find(o => o.value === t) || TYPE_OPTIONS[3];

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            Conventions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des organisations conventionnees et de leurs affilies</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadConventions} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          {canManage && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors">
              <Plus className="w-4 h-4" /> Nouvelle convention
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total conventions', value: conventions.length, color: 'text-teal-700' },
          { label: 'Actives', value: conventions.filter(c => c.actif).length, color: 'text-green-700' },
          { label: 'Inactives', value: conventions.filter(c => !c.actif).length, color: 'text-red-600' },
          { label: 'Total affilies', value: conventions.reduce((s, c) => s + (c.affilies_count || 0), 0), color: 'text-blue-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'Tous' : s === 'active' ? 'Actives' : 'Inactives'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Tous types</button>
          {TYPE_OPTIONS.map(t => (
            <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === t.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom, code, contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileCheck className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucune convention trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Organisation</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-center">Taux</th>
                  <th className="px-4 py-3 text-center">Plafond</th>
                  <th className="px-4 py-3 text-center">Affilies</th>
                  <th className="px-4 py-3 text-left">Periode</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => {
                  const typeInfo = getTypeInfo(c.type_organisation);
                  const isExpired = c.date_fin && new Date(c.date_fin) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{c.nom}</p>
                          {c.code && <p className="text-xs text-gray-400 font-mono">{c.code}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                          <typeInfo.icon className="w-3 h-3" />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {c.taux_prise_en_charge != null ? `${c.taux_prise_en_charge}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {c.plafond_montant ? `${Number(c.plafond_montant).toLocaleString('fr-FR')} USD` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                          <Users className="w-3 h-3" />
                          {c.affilies_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {c.date_debut || c.date_fin ? (
                          <span className={isExpired ? 'text-red-500' : ''}>
                            {c.date_debut ? new Date(c.date_debut).toLocaleDateString('fr-FR') : '...'} - {c.date_fin ? new Date(c.date_fin).toLocaleDateString('fr-FR') : '...'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${c.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {c.actif ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDetail(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <>
                              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Modifier">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => toggleStatus(c)} className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${c.actif ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`} title={c.actif ? 'Desactiver' : 'Activer'}>
                                {c.actif ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
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

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowFormModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-teal-600" />
                </div>
                {editingId ? 'Modifier la convention' : 'Nouvelle convention'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{formError}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'organisation *</label>
                  <input type="text" value={form.nom} onChange={e => updateForm('nom', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" value={form.code} onChange={e => updateForm('code', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder="Ex: CONV-001" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.type_organisation} onChange={e => updateForm('type_organisation', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux prise en charge (%) *</label>
                  <input type="number" min="0" max="100" step="0.01" value={form.taux_prise_en_charge} onChange={e => updateForm('taux_prise_en_charge', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plafond (USD)</label>
                  <input type="number" min="0" step="0.01" value={form.plafond_montant} onChange={e => updateForm('plafond_montant', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder="Sans limite" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de debut</label>
                  <input type="date" value={form.date_debut} onChange={e => updateForm('date_debut', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input type="date" value={form.date_fin} onChange={e => updateForm('date_fin', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" value={form.contact_nom} onChange={e => updateForm('contact_nom', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder="Nom du contact" />
                  <input type="text" value={form.contact_telephone} onChange={e => updateForm('contact_telephone', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder="Telephone" />
                  <input type="email" value={form.contact_email} onChange={e => updateForm('contact_email', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder="Email" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={form.adresse} onChange={e => updateForm('adresse', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => updateForm('notes', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm">Annuler</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <FileCheck className="w-4 h-4" />}
                  {editingId ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail + Affiliations Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{showDetailModal.nom}</h3>
                <p className="text-sm text-gray-500">{getTypeInfo(showDetailModal.type_organisation).label} {showDetailModal.code ? `- ${showDetailModal.code}` : ''}</p>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Convention info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Taux', value: showDetailModal.taux_prise_en_charge != null ? `${showDetailModal.taux_prise_en_charge}%` : '-' },
                  { label: 'Plafond', value: showDetailModal.plafond_montant ? `${Number(showDetailModal.plafond_montant).toLocaleString('fr-FR')} USD` : 'Sans limite' },
                  { label: 'Statut', value: showDetailModal.actif ? 'Active' : 'Inactive' },
                  { label: 'Debut', value: showDetailModal.date_debut ? new Date(showDetailModal.date_debut).toLocaleDateString('fr-FR') : '-' },
                  { label: 'Fin', value: showDetailModal.date_fin ? new Date(showDetailModal.date_fin).toLocaleDateString('fr-FR') : '-' },
                  { label: 'Contact', value: showDetailModal.contact_nom || '-' },
                ].map((f, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">{f.label}</p>
                    <p className="text-sm text-gray-900 font-semibold mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Affiliations */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" /> Patients affilies ({affiliations.length})
                  </h4>
                  {canManage && (
                    <button onClick={() => { setShowAffiliationModal(true); setAffiliationForm({ patient_id: '', numero_affilie: '' }); setPatientSearch(''); setPatientResults([]); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors">
                      <UserPlus className="w-3.5 h-3.5" /> Affilier un patient
                    </button>
                  )}
                </div>

                {loadingAffiliations ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-600 border-t-transparent" /></div>
                ) : affiliations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Aucun patient affilie a cette convention</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Patient</th>
                          <th className="px-4 py-2.5 text-left">N Affilie</th>
                          <th className="px-4 py-2.5 text-center">Statut</th>
                          {canManage && <th className="px-4 py-2.5 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {affiliations.map(a => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-gray-900">{a.patient_name}</span>
                              {a.patient_number && <span className="ml-2 text-xs text-gray-400 font-mono">{a.patient_number}</span>}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{a.numero_affilie}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${a.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {a.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            {canManage && (
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => removeAffiliation(a.id)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Affiliation Modal */}
      {showAffiliationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAffiliationModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" /> Affilier un patient
              </h3>
              <button onClick={() => setShowAffiliationModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddAffiliation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher un patient *</label>
                <input type="text" value={patientSearch} onChange={e => searchPatients(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder="Nom ou numero du patient..." />
                {patientResults.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-100">
                    {patientResults.map(p => (
                      <button key={p.id} type="button" onClick={() => { setAffiliationForm(f => ({ ...f, patient_id: p.id })); setPatientSearch(`${p.first_name} ${p.last_name}`); setPatientResults([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-teal-50 transition-colors flex items-center justify-between">
                        <span className="font-medium">{p.first_name} {p.last_name}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.patient_number}</span>
                      </button>
                    ))}
                  </div>
                )}
                {affiliationForm.patient_id && (
                  <p className="text-xs text-green-600 mt-1">Patient selectionne</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero d'affilie *</label>
                <input type="text" value={affiliationForm.numero_affilie} onChange={e => setAffiliationForm(f => ({ ...f, numero_affilie: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" placeholder="Ex: AFF-001" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAffiliationModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm">Annuler</button>
                <button type="submit" disabled={!affiliationForm.patient_id} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Affilier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
