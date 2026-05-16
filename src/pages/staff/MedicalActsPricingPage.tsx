import { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Save, Archive, RotateCcw, Filter, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logActivity } from '../../utils/activityLogger';

const CATEGORIES = ['Consultation', 'Chirurgie', 'Radiologie', 'Laboratoire', 'Pharmacie', 'Soins infirmiers', 'Autres'];
const ADMIN_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general'];

interface MedicalAct {
  id: string;
  act_name: string;
  category: string;
  price_usd: number;
  price_cdf: number;
  is_active: boolean;
}

interface EditState {
  act_name: string;
  category: string;
  price_usd: string;
  price_cdf: string;
}

export default function MedicalActsPricingPage() {
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';
  const isAdmin = ADMIN_ROLES.includes(userRole);

  const [acts, setActs] = useState<MedicalAct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ act_name: '', category: '', price_usd: '', price_cdf: '' });
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAct, setNewAct] = useState<EditState>({ act_name: '', category: 'Consultation', price_usd: '', price_cdf: '' });

  useEffect(() => { fetchActs(); }, [showArchived]);

  async function fetchActs() {
    setLoading(true);
    try {
      let query = supabase.from('medical_acts_pricing').select('*').order('category').order('act_name');
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
    setEditState({
      act_name: act.act_name,
      category: act.category,
      price_usd: String(act.price_usd),
      price_cdf: String(act.price_cdf),
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const { error } = await supabase.from('medical_acts_pricing').update({
        act_name: editState.act_name,
        category: editState.category,
        price_usd: parseFloat(editState.price_usd) || 0,
        price_cdf: parseFloat(editState.price_cdf) || 0,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      logActivity('update', 'expenses', `Acte medical modifie: ${editState.act_name}`);
      setEditingId(null);
      fetchActs();
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
      }).eq('id', act.id);
      if (error) throw error;
      logActivity('update', 'expenses', `Acte medical ${act.is_active ? 'archive' : 'restaure'}: ${act.act_name}`);
      fetchActs();
    } catch (err) {
      console.error('Error archiving:', err);
    }
  }

  async function addNewAct() {
    if (!newAct.act_name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('medical_acts_pricing').insert({
        act_name: newAct.act_name,
        category: newAct.category,
        price_usd: parseFloat(newAct.price_usd) || 0,
        price_cdf: parseFloat(newAct.price_cdf) || 0,
      });
      if (error) throw error;
      logActivity('create', 'expenses', `Nouvel acte medical: ${newAct.act_name}`);
      setNewAct({ act_name: '', category: 'Consultation', price_usd: '', price_cdf: '' });
      setShowAddForm(false);
      fetchActs();
    } catch (err) {
      console.error('Error adding act:', err);
    } finally {
      setSaving(false);
    }
  }

  const filtered = acts.filter(a => {
    if (filterCategory && a.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.act_name.toLowerCase().includes(s) || a.category.toLowerCase().includes(s);
    }
    return true;
  });

  const grouped = CATEGORIES.reduce<Record<string, MedicalAct[]>>((acc, cat) => {
    const items = filtered.filter(a => a.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tarification des Actes Medicaux</h1>
              <p className="text-gray-600 text-sm mt-0.5">Grille tarifaire des prestations medicales</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvel Acte
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un acte..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Toutes les categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
        </div>
      </div>

      {/* Add form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-lg border border-emerald-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Ajouter un nouvel acte</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              value={newAct.act_name}
              onChange={(e) => setNewAct(p => ({ ...p, act_name: e.target.value }))}
              placeholder="Nom de l'acte"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={newAct.category}
              onChange={(e) => setNewAct(p => ({ ...p, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="number"
              value={newAct.price_usd}
              onChange={(e) => setNewAct(p => ({ ...p, price_usd: e.target.value }))}
              placeholder="Prix USD"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="number"
              value={newAct.price_cdf}
              onChange={(e) => setNewAct(p => ({ ...p, price_cdf: e.target.value }))}
              placeholder="Prix CDF"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={addNewAct}
                disabled={saving || !newAct.act_name.trim()}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="text-gray-500 mt-3">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          Aucun acte medical trouve
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                {category}
                <span className="text-xs text-gray-500 font-normal ml-1">({items.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Acte</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Prix (USD)</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Prix (CDF)</th>
                    <th className="px-5 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(act => (
                    <tr key={act.id} className={`hover:bg-gray-50 ${!act.is_active ? 'opacity-50' : ''}`}>
                      {editingId === act.id ? (
                        <>
                          <td className="px-5 py-2.5">
                            <input
                              type="text"
                              value={editState.act_name}
                              onChange={(e) => setEditState(p => ({ ...p, act_name: e.target.value }))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              type="number"
                              value={editState.price_usd}
                              onChange={(e) => setEditState(p => ({ ...p, price_usd: e.target.value }))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-24 text-right focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-5 py-2.5">
                            <input
                              type="number"
                              value={editState.price_cdf}
                              onChange={(e) => setEditState(p => ({ ...p, price_cdf: e.target.value }))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-28 text-right focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-5 py-2.5 text-center">
                            <select
                              value={editState.category}
                              onChange={(e) => setEditState(p => ({ ...p, category: e.target.value }))}
                              className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => saveEdit(act.id)}
                                disabled={saving}
                                className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
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
                          <td className="px-5 py-2.5 text-sm text-right text-gray-600">
                            {Number(act.price_cdf).toLocaleString('fr-FR')} CDF
                          </td>
                          <td className="px-5 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              act.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {act.is_active ? 'Actif' : 'Archive'}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => startEdit(act)}
                                    className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 font-medium"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => toggleArchive(act)}
                                    className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                                    title={act.is_active ? 'Archiver' : 'Restaurer'}
                                  >
                                    {act.is_active ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                  </button>
                                </>
                              )}
                              {!isAdmin && (
                                <button className="px-2.5 py-1 text-xs text-white bg-emerald-600 rounded hover:bg-emerald-700 font-medium">
                                  Selectionner
                                </button>
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
    </div>
  );
}
