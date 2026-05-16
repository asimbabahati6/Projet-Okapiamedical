import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, ArrowUpRight, ArrowDownRight,
  Activity, X, Pill, History, Trash2, AlertTriangle,
  Pencil, Save, Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { recordStockMovement, getStockMovements } from '../../services/pharmacyService';
import type { PharmacyMedication, StockMovement, StockMovementType, MedicationCategory, DosageForm } from '../../types/pharmacy';
import { useToast } from '../../hooks/useToast';

const EDIT_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general', 'pharmacist', 'pharmacien'];

const CATEGORIES: MedicationCategory[] = [
  'Antibiotique', 'Antalgique', 'Anti-inflammatoire', 'Cardiovasculaire',
  'Antidiabétique', 'Antiparasitaire', 'Gastro-intestinal', 'Respiratoire',
  'Vitamine', 'Dermatologie', 'Neurologique', 'Obstétrique', 'Ophtalmologie',
  'Antihypertenseur', 'Antipaludéen', 'Antiviral', 'Bronchodilatateur', 'Corticoïde', 'Autre'
];

const FORMS: DosageForm[] = [
  'Comprimé', 'Gélule', 'Sirop', 'Injectable', 'Suppositoire',
  'Pommade', 'Solution', 'Spray', 'Crème', 'Collyre', 'Inhalateur', 'Poudre'
];

interface EditForm {
  name: string;
  code: string;
  form: string;
  dosage: string;
  unit_price: string;
  minimum_stock: string;
}

interface NewMedForm {
  name: string;
  code: string;
  category: MedicationCategory;
  form: DosageForm;
  dosage: string;
  unit_price: string;
  current_stock: string;
  minimum_stock: string;
}

const emptyNewMed: NewMedForm = {
  name: '', code: '', category: 'Autre', form: 'Comprimé',
  dosage: '', unit_price: '', current_stock: '0', minimum_stock: '10',
};

export function PharmacyInventoryPage() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';
  const canEdit = EDIT_ROLES.includes(userRole);

  const [medications, setMedications] = useState<PharmacyMedication[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [purging, setPurging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PharmacyMedication | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', code: '', form: '', dosage: '', unit_price: '', minimum_stock: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [newMed, setNewMed] = useState<NewMedForm>(emptyNewMed);
  const [addingMed, setAddingMed] = useState(false);
  const [selectedMed, setSelectedMed] = useState<PharmacyMedication | null>(null);
  const [movementForm, setMovementForm] = useState({
    type: 'reception' as StockMovementType,
    quantity: 0,
    reason: '',
    reference: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [medsRes, movsRes] = await Promise.all([
        supabase.from('pharmacy_medications').select('*').eq('is_active', true).order('name'),
        getStockMovements(undefined, 30)
      ]);
      if (medsRes.data) setMedications(medsRes.data);
      setMovements(movsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openMovement(med: PharmacyMedication, type: StockMovementType) {
    setSelectedMed(med);
    setMovementForm({ type, quantity: 0, reason: '', reference: '' });
    setShowMovementModal(true);
  }

  function startEdit(med: PharmacyMedication) {
    setEditingId(med.id);
    setEditForm({
      name: med.name,
      code: med.code,
      form: med.form,
      dosage: med.dosage,
      unit_price: String(med.unit_price),
      minimum_stock: String(med.minimum_stock),
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSavingEdit(true);
    try {
      const { error } = await supabase.from('pharmacy_medications').update({
        name: editForm.name,
        code: editForm.code,
        form: editForm.form,
        dosage: editForm.dosage,
        unit_price: parseFloat(editForm.unit_price) || 0,
        minimum_stock: parseInt(editForm.minimum_stock) || 0,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      showToast('Medicament mis a jour', 'success');
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  function confirmDelete(med: PharmacyMedication) {
    setDeleteTarget(med);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supabase.from('pharmacy_stock_movements').delete().eq('medication_id', deleteTarget.id);
      const { error } = await supabase.from('pharmacy_medications').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      showToast('Medicament supprime', 'success');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddMed(e: React.FormEvent) {
    e.preventDefault();
    if (!newMed.name.trim() || !newMed.code.trim()) return;
    setAddingMed(true);
    try {
      const { error } = await supabase.from('pharmacy_medications').insert({
        name: newMed.name,
        code: newMed.code,
        category: newMed.category,
        form: newMed.form,
        dosage: newMed.dosage,
        unit_price: parseFloat(newMed.unit_price) || 0,
        currency: 'CDF',
        current_stock: parseInt(newMed.current_stock) || 0,
        minimum_stock: parseInt(newMed.minimum_stock) || 10,
        maximum_stock: 1000,
        is_active: true,
        requires_prescription: false,
      });
      if (error) throw error;
      showToast('Medicament ajoute avec succes', 'success');
      setNewMed(emptyNewMed);
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'ajout', 'error');
    } finally {
      setAddingMed(false);
    }
  }

  async function handleMovementSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMed || movementForm.quantity <= 0) return;
    setSubmitting(true);
    try {
      await recordStockMovement(
        selectedMed.id,
        movementForm.type,
        movementForm.quantity,
        movementForm.reason || null,
        movementForm.reference || null
      );
      showToast('Mouvement enregistre avec succes', 'success');
      setShowMovementModal(false);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePurge() {
    setPurging(true);
    try {
      await supabase.from('pharmacy_dispensation_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pharmacy_prescriptions_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pharmacy_stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pharmacy_medications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('medications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      showToast('Toutes les donnees de demonstration ont ete supprimees', 'success');
      setShowPurgeModal(false);
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setPurging(false);
    }
  }

  const filtered = medications.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) ||
      (m.generic_name || '').toLowerCase().includes(q);
  });

  const typeLabels: Record<string, { label: string; color: string }> = {
    reception: { label: 'Reception', color: 'bg-green-100 text-green-700' },
    dispensation: { label: 'Dispensation', color: 'bg-blue-100 text-blue-700' },
    adjustment: { label: 'Ajustement', color: 'bg-gray-100 text-gray-700' },
    loss: { label: 'Perte', color: 'bg-red-100 text-red-700' },
    expiry: { label: 'Perime', color: 'bg-orange-100 text-orange-700' },
    return: { label: 'Retour', color: 'bg-teal-100 text-teal-700' },
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            Gestion des Stocks
          </h1>
          <p className="text-gray-500 mt-1">Mouvements de stock et ajustements</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouveau medicament
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setShowPurgeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Vider demo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un medicament..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Pill className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun medicament en stock</p>
              {canEdit && (
                <button onClick={() => setShowAddModal(true)} className="mt-3 text-blue-600 text-sm font-medium hover:underline">
                  + Ajouter un medicament
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {filtered.map(med => {
                const isLow = med.current_stock < med.minimum_stock && med.current_stock > 0;
                const isOut = med.current_stock === 0;
                const isEditing = editingId === med.id;

                if (isEditing) {
                  return (
                    <div key={med.id} className="px-4 py-3 bg-blue-50/50 border-l-4 border-blue-500">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="Nom"
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(e) => setEditForm(p => ({ ...p, code: e.target.value }))}
                          placeholder="Code"
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={editForm.form}
                          onChange={(e) => setEditForm(p => ({ ...p, form: e.target.value }))}
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <input
                          type="text"
                          value={editForm.dosage}
                          onChange={(e) => setEditForm(p => ({ ...p, dosage: e.target.value }))}
                          placeholder="Dosage"
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          value={editForm.unit_price}
                          onChange={(e) => setEditForm(p => ({ ...p, unit_price: e.target.value }))}
                          placeholder="Prix (CDF)"
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          value={editForm.minimum_stock}
                          onChange={(e) => setEditForm(p => ({ ...p, minimum_stock: e.target.value }))}
                          placeholder="Stock minimum"
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(med.id)}
                          disabled={savingEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Sauvegarder
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={med.id} className="px-4 py-3 hover:bg-gray-50/50 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isOut ? 'bg-red-50' : isLow ? 'bg-amber-50' : 'bg-gray-50'
                    }`}>
                      <Pill className={`w-4 h-4 ${
                        isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{med.name}</p>
                      <p className="text-xs text-gray-500">
                        {med.code} | {med.form} {med.dosage} | {med.unit_price} CDF | Stock: <span className={`font-semibold ${
                          isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'
                        }`}>{med.current_stock}</span> / min: {med.minimum_stock}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => startEdit(med)}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(med)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openMovement(med, 'reception')}
                        className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors"
                        title="Reception"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openMovement(med, 'dispensation')}
                        className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Dispensation"
                      >
                        <ArrowDownRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openMovement(med, 'adjustment')}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                        title="Ajustement"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Mouvements recents</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Aucun mouvement enregistre</p>
              </div>
            ) : (
              movements.map(mov => {
                const info = typeLabels[mov.movement_type] || typeLabels.adjustment;
                return (
                  <div key={mov.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>
                        {info.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(mov.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Qte: <span className="font-medium">{mov.quantity}</span> | {mov.previous_stock} → {mov.new_stock}
                    </p>
                    {mov.reason && <p className="text-xs text-gray-400 mt-0.5">{mov.reason}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add medication modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Nouveau medicament</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleAddMed} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={(e) => setNewMed(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Code MED</label>
                    <input
                      type="text"
                      value={newMed.code}
                      onChange={(e) => setNewMed(p => ({ ...p, code: e.target.value }))}
                      placeholder="MED-001"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Categorie</label>
                    <select
                      value={newMed.category}
                      onChange={(e) => setNewMed(p => ({ ...p, category: e.target.value as MedicationCategory }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Forme pharmaceutique</label>
                    <select
                      value={newMed.form}
                      onChange={(e) => setNewMed(p => ({ ...p, form: e.target.value as DosageForm }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed(p => ({ ...p, dosage: e.target.value }))}
                      placeholder="500mg"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prix unitaire (CDF)</label>
                    <input
                      type="number"
                      value={newMed.unit_price}
                      onChange={(e) => setNewMed(p => ({ ...p, unit_price: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock actuel</label>
                    <input
                      type="number"
                      value={newMed.current_stock}
                      onChange={(e) => setNewMed(p => ({ ...p, current_stock: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock minimum</label>
                    <input
                      type="number"
                      value={newMed.minimum_stock}
                      onChange={(e) => setNewMed(p => ({ ...p, minimum_stock: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={addingMed || !newMed.name.trim() || !newMed.code.trim()}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingMed ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce medicament ?</h3>
                <p className="text-sm text-gray-600 mb-1 font-medium">{deleteTarget.name}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Cette action est irreversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purge confirmation modal */}
      <AnimatePresence>
        {showPurgeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Cette action supprimera tous les medicaments et mouvements de stock. Continuer ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPurgeModal(false)}
                    disabled={purging}
                    className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePurge}
                    disabled={purging}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {purging ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock movement modal */}
      <AnimatePresence>
        {showMovementModal && selectedMed && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Mouvement de stock</h3>
                <button onClick={() => setShowMovementModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleMovementSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{selectedMed.name}</p>
                  <p className="text-xs text-gray-500">Stock actuel: {selectedMed.current_stock} unites</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement</label>
                  <select
                    value={movementForm.type}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, type: e.target.value as StockMovementType }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="reception">Reception (entree)</option>
                    <option value="dispensation">Dispensation (sortie)</option>
                    <option value="return">Retour (entree)</option>
                    <option value="loss">Perte (sortie)</option>
                    <option value="expiry">Perime (sortie)</option>
                    <option value="adjustment">Ajustement (nouveau total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {movementForm.type === 'adjustment' ? 'Nouveau stock total' : 'Quantite'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={movementForm.quantity || ''}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raison / Note</label>
                  <input
                    type="text"
                    value={movementForm.reason}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Ex: Livraison fournisseur..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference (optionnel)</label>
                  <input
                    type="text"
                    value={movementForm.reference}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Ex: BON-2024-001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMovementModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || movementForm.quantity <= 0}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Enregistrement...' : 'Confirmer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
