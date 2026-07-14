import { useState, useEffect, useMemo } from 'react';
import { UserCheck, Plus, Search, RefreshCw, X, CreditCard as Edit, Eye, ChevronDown, ChevronUp, Percent, DollarSign, Phone, Mail } from 'lucide-react';
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
  user_profile_id: string | null;
  created_at: string;
}

const TYPE_OPTIONS = [
  { value: 'prestataire', label: 'Prestataire', color: 'bg-blue-100 text-blue-800' },
  { value: 'apporteur', label: 'Apporteur', color: 'bg-purple-100 text-purple-800' },
  { value: 'les_deux', label: 'Prestataire + Apporteur', color: 'bg-teal-100 text-teal-800' },
];

const emptyForm = {
  nom_complet: '',
  specialite: '',
  telephone: '',
  email: '',
  type: 'prestataire',
  service: '',
  mode_remuneration_defaut: 'pourcentage',
  taux_defaut: '',
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
  const [detailStats, setDetailStats] = useState<{ totalHonoraires: number; totalCommissions: number; totalVerse: number } | null>(null);

  useEffect(() => { if (canView) loadData(); }, [canView]);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('medecins_prestataires').select('*').order('nom_complet');
      if (error) throw error;
      setPrestataires(data || []);
    } catch (err: any) {
      showToast(err.message || 'Erreur', 'error');
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
    });
    setFormError('');
    setShowFormModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.nom_complet.trim()) { setFormError('Le nom est obligatoire'); return; }

    setSubmitting(true);
    try {
      const payload = {
        nom_complet: form.nom_complet.trim(),
        specialite: form.specialite.trim() || null,
        telephone: form.telephone.trim() || null,
        email: form.email.trim() || null,
        type: form.type,
        service: form.service.trim() || null,
        mode_remuneration_defaut: form.mode_remuneration_defaut,
        taux_defaut: form.taux_defaut ? parseFloat(form.taux_defaut) : null,
      };

      if (editingId) {
        const { error } = await supabase.from('medecins_prestataires').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Prestataire mis a jour', 'success');
      } else {
        const { error } = await supabase.from('medecins_prestataires').insert({ ...payload, source: 'externe' });
        if (error) throw error;
        showToast('Prestataire cree', 'success');
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
      showToast(`Prestataire ${p.actif ? 'desactive' : 'active'}`, 'success');
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
      });
    } catch { /* ignore */ }
  }

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            Medecins Prestataires
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des medecins prestataires et apporteurs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          {canManage && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: prestataires.length, color: 'text-blue-700' },
          { label: 'Actifs', value: prestataires.filter(p => p.actif).length, color: 'text-green-700' },
          { label: 'Internes', value: prestataires.filter(p => p.source === 'interne').length, color: 'text-purple-700' },
          { label: 'Externes', value: prestataires.filter(p => p.source === 'externe').length, color: 'text-orange-700' },
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
              {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {(['all', 'interne', 'externe'] as const).map(s => (
            <button key={s} onClick={() => setSourceFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sourceFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'Tous' : s === 'interne' ? 'Internes' : 'Externes'}
            </button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">Tous les types</option>
          {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom, specialite..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <UserCheck className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucun prestataire trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Specialite</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-center">Source</th>
                  <th className="px-4 py-3 text-center">Remuneration</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const typeInfo = TYPE_OPTIONS.find(t => t.value === p.type) || TYPE_OPTIONS[0];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{p.nom_complet}</p>
                        {p.service && <p className="text-xs text-gray-400">{p.service}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.specialite || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${p.source === 'interne' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.source === 'interne' ? 'Interne' : 'Externe'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.taux_defaut != null ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
                            {p.mode_remuneration_defaut === 'pourcentage' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                            {p.taux_defaut}{p.mode_remuneration_defaut === 'pourcentage' ? '%' : ' USD'}
                          </span>
                        ) : <span className="text-xs text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                          {p.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.telephone}</span>}
                          {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                          {!p.telephone && !p.email && '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${p.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDetail(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><Eye className="w-4 h-4" /></button>
                          {canManage && (
                            <>
                              <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => toggleStatus(p)} className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${p.actif ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}>
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
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Modifier le prestataire' : 'Nouveau prestataire'}</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={form.type} onChange={e => updateForm('type', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Remuneration par defaut</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mode</label>
                    <select value={form.mode_remuneration_defaut} onChange={e => updateForm('mode_remuneration_defaut', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                      <option value="pourcentage">Pourcentage (%)</option>
                      <option value="forfait">Forfait (USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{form.mode_remuneration_defaut === 'pourcentage' ? 'Taux (%)' : 'Montant (USD)'}</label>
                    <input type="number" step="0.01" min="0" value={form.taux_defaut} onChange={e => updateForm('taux_defaut', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder={form.mode_remuneration_defaut === 'pourcentage' ? 'Ex: 30' : 'Ex: 50'} />
                  </div>
                </div>
              </div>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{showDetail.nom_complet}</h3>
              <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-3">
              <DRow label="Specialite" value={showDetail.specialite || '-'} />
              <DRow label="Type" value={TYPE_OPTIONS.find(t => t.value === showDetail.type)?.label || showDetail.type} />
              <DRow label="Source" value={showDetail.source === 'interne' ? 'Medecin interne' : 'Externe'} />
              <DRow label="Service" value={showDetail.service || '-'} />
              <DRow label="Remuneration" value={showDetail.taux_defaut != null ? `${showDetail.taux_defaut}${showDetail.mode_remuneration_defaut === 'pourcentage' ? '%' : ' USD/acte'}` : 'Non definie'} />
              <DRow label="Telephone" value={showDetail.telephone || '-'} />
              <DRow label="Email" value={showDetail.email || '-'} />
              <DRow label="Statut" value={showDetail.actif ? 'Actif' : 'Inactif'} />
              {detailStats && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <DRow label="Total honoraires dus" value={`${detailStats.totalHonoraires.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} highlight />
                  <DRow label="Total commissions dues" value={`${detailStats.totalCommissions.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} />
                  <DRow label="Total verse" value={`${detailStats.totalVerse.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`} />
                </>
              )}
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
