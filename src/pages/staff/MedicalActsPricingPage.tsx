import { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Save, Archive, RotateCcw, Filter, Check, X, Upload, ArrowRightLeft, User, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { logActivity } from '../../utils/activityLogger';
import { ImportTarifsModal } from '../../components/pricing/ImportTarifsModal';

const ADMIN_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general'];
const IMPORT_ROLES = ['admin', 'medical_director'];

interface MedicalAct {
  id: string;
  act_name: string;
  category: string;
  price_usd: number;
  price_cdf: number;
  is_active: boolean;
  updated_at?: string;
  updated_by_name?: string;
}

export default function MedicalActsPricingPage() {
  const { profile, user } = useAuth();
  const userRole = profile?.role?.name || '';
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const canImport = IMPORT_ROLES.includes(userRole);
  const { usdToCdf, rate } = useExchangeRate();

  const [acts, setActs] = useState<MedicalAct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriceUsd, setEditPriceUsd] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriceUsd, setNewPriceUsd] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const categories = [...new Set(acts.map(a => a.category))].sort();

  useEffect(() => { fetchActs(); }, [showArchived]);

  async function fetchActs() {
    setLoading(true);
    try {
      let query = supabase
        .from('medical_acts_pricing')
        .select('id, act_name, category, price_usd, price_cdf, is_active, updated_at, updated_by_name')
        .order('category')
        .order('act_name');
      if (!showArchived) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      setActs(data || []);
    } catch (err) {
      console.error('Error fetching acts:', err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(act: MedicalAct) {
    setEditingId(act.id);
    setEditName(act.act_name);
    setEditCategory(act.category);
    setEditPriceUsd(String(act.price_usd));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const priceUsd = parseFloat(editPriceUsd) || 0;
      const priceCdf = usdToCdf > 0 ? Math.round(priceUsd * usdToCdf) : 0;
      const userName = profile?.full_name || user?.email || '';

      const { error } = await supabase.from('medical_acts_pricing').update({
        act_name: editName,
        category: editCategory,
        price_usd: priceUsd,
        price_cdf: priceCdf,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
        updated_by_name: userName,
      }).eq('id', id);
      if (error) throw error;
      logActivity('update', 'expenses', `Acte medical modifie: ${editName} — ${priceUsd.toFixed(2)} USD`);
      setEditingId(null);
      fetchActs();
      flash('Acte mis a jour');
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(act: MedicalAct) {
    try {
      const { error } = await supabase.from('medical_acts_pricing').update({
        is_active: !act.is_active,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
        updated_by_name: profile?.full_name || '',
      }).eq('id', act.id);
      if (error) throw error;
      logActivity('update', 'expenses', `Acte medical ${act.is_active ? 'archive' : 'restaure'}: ${act.act_name}`);
      fetchActs();
    } catch (err) {
      console.error('Error archiving:', err);
    }
  }

  async function addNewAct() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const priceUsd = parseFloat(newPriceUsd) || 0;
      const priceCdf = usdToCdf > 0 ? Math.round(priceUsd * usdToCdf) : 0;

      const { error } = await supabase.from('medical_acts_pricing').insert({
        act_name: newName,
        category: newCategory || 'Autres',
        price_usd: priceUsd,
        price_cdf: priceCdf,
        updated_by: user?.id || null,
        updated_by_name: profile?.full_name || '',
      });
      if (error) throw error;
      logActivity('create', 'expenses', `Nouvel acte medical: ${newName}`);
      setNewName('');
      setNewCategory('');
      setNewPriceUsd('');
      setShowAddForm(false);
      fetchActs();
      flash('Acte cree');
    } catch (err) {
      console.error('Error adding act:', err);
    } finally {
      setSaving(false);
    }
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  const editPriceUsdNum = parseFloat(editPriceUsd) || 0;
  const editPriceCdfAuto = usdToCdf > 0 ? Math.round(editPriceUsdNum * usdToCdf) : 0;
  const newPriceUsdNum = parseFloat(newPriceUsd) || 0;
  const newPriceCdfAuto = usdToCdf > 0 ? Math.round(newPriceUsdNum * usdToCdf) : 0;

  const filtered = acts.filter(a => {
    if (filterCategory && a.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.act_name.toLowerCase().includes(s) || a.category.toLowerCase().includes(s);
    }
    return true;
  });

  const grouped = categories.reduce<Record<string, MedicalAct[]>>((acc, cat) => {
    const items = filtered.filter(a => a.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          <Check className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tarification des Actes Medicaux</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {acts.length} acte(s)
                {rate && (
                  <span className="ml-2 text-xs text-gray-400">
                    <ArrowRightLeft className="w-3 h-3 inline mr-1" />
                    1 USD = {usdToCdf.toLocaleString('fr-FR')} CDF
                  </span>
                )}
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              {canImport && (
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Importer des tarifs
                </button>
              )}
              <button
                onClick={() => { setShowAddForm(true); setNewCategory(categories[0] || 'Autres'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nouvel Acte
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un acte..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="">Toutes les categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Afficher archives
            </label>
          )}
          <div className="text-xs text-gray-400 ml-auto">
            {filtered.length} resultat(s)
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Ajouter un nouvel acte
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom de l'acte</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de l'acte"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
              <input
                list="categories-list"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Categorie"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <datalist id="categories-list">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Prix USD</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPriceUsd}
                onChange={(e) => setNewPriceUsd(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-right"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Prix CDF (auto)</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 text-right">
                {newPriceCdfAuto > 0 ? newPriceCdfAuto.toLocaleString('fr-FR') : '—'}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={addNewAct}
                disabled={saving || !newName.trim()}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          <p className="text-gray-500 mt-3 text-sm">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
          Aucun acte medical trouve
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                {category}
                <span className="text-xs text-gray-400 font-normal ml-1">({items.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Acte</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Prix (USD)</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Prix (CDF)</th>
                    <th className="px-5 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Derniere modif.</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(act => (
                    <tr key={act.id} className={`hover:bg-gray-50/50 transition-colors ${!act.is_active ? 'opacity-50' : ''}`}>
                      {editingId === act.id ? (
                        <>
                          <td className="px-5 py-2.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editPriceUsd}
                              onChange={(e) => setEditPriceUsd(e.target.value)}
                              className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm w-28 text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <span className="text-sm text-gray-500">
                              {editPriceCdfAuto > 0 ? editPriceCdfAuto.toLocaleString('fr-FR') : '—'} CDF
                            </span>
                            <span className="block text-[10px] text-gray-400">auto</span>
                          </td>
                          <td className="px-5 py-2.5 text-center">
                            <input
                              list="edit-categories"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none w-32"
                            />
                            <datalist id="edit-categories">
                              {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                          </td>
                          <td className="px-5 py-2.5" />
                          <td className="px-5 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => saveEdit(act.id)}
                                disabled={saving}
                                className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-2.5 text-sm font-medium text-gray-900">{act.act_name}</td>
                          <td className="px-5 py-2.5 text-sm text-right font-semibold text-gray-900">
                            {act.price_usd.toFixed(2)} $
                          </td>
                          <td className="px-5 py-2.5 text-sm text-right text-gray-500">
                            {Number(act.price_cdf).toLocaleString('fr-FR')} CDF
                          </td>
                          <td className="px-5 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              act.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {act.is_active ? 'Actif' : 'Archive'}
                            </span>
                          </td>
                          <td className="px-5 py-2.5">
                            {act.updated_by_name ? (
                              <div className="text-xs text-gray-400 space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{act.updated_by_name}</span>
                                </div>
                                {act.updated_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(act.updated_at).toLocaleDateString('fr-FR')}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => startEdit(act)}
                                    className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => toggleArchive(act)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                    title={act.is_active ? 'Archiver' : 'Restaurer'}
                                  >
                                    {act.is_active ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Import modal */}
      {showImport && (
        <ImportTarifsModal
          existingActs={acts}
          usdToCdf={usdToCdf}
          userName={profile?.full_name || user?.email || ''}
          userId={user?.id || ''}
          onClose={() => setShowImport(false)}
          onSuccess={fetchActs}
        />
      )}
    </div>
  );
}
