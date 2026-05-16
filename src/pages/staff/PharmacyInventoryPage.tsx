import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, ArrowUpRight, ArrowDownRight,
  Activity, X, Pill, History, Trash2, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { recordStockMovement, getStockMovements } from '../../services/pharmacyService';
import type { PharmacyMedication, StockMovement, StockMovementType } from '../../types/pharmacy';
import { useToast } from '../../hooks/useToast';

const PURGE_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general'];

export function PharmacyInventoryPage() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';
  const canPurge = PURGE_ROLES.includes(userRole);

  const [medications, setMedications] = useState<PharmacyMedication[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);
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
      showToast('Mouvement enregistré avec succès', 'success');
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
    reception: { label: 'Réception', color: 'bg-green-100 text-green-700' },
    dispensation: { label: 'Dispensation', color: 'bg-blue-100 text-blue-700' },
    adjustment: { label: 'Ajustement', color: 'bg-gray-100 text-gray-700' },
    loss: { label: 'Perte', color: 'bg-red-100 text-red-700' },
    expiry: { label: 'Périmé', color: 'bg-orange-100 text-orange-700' },
    return: { label: 'Retour', color: 'bg-teal-100 text-teal-700' },
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            Gestion des Stocks
          </h1>
          <p className="text-gray-500 mt-1">Mouvements de stock et ajustements</p>
        </div>
        {canPurge && (
          <button
            onClick={() => setShowPurgeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Vider les donnees de demonstration
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un médicament..."
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
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {filtered.slice(0, 30).map(med => {
                const isLow = med.current_stock < med.minimum_stock && med.current_stock > 0;
                const isOut = med.current_stock === 0;
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
                      <p className="text-xs text-gray-500">{med.code} - Stock: <span className={`font-semibold ${
                        isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'
                      }`}>{med.current_stock}</span> / min: {med.minimum_stock}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openMovement(med, 'reception')}
                        className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors"
                        title="Réception"
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
            <h2 className="font-semibold text-gray-900 text-sm">Mouvements récents</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Aucun mouvement enregistré</p>
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
                      Qté: <span className="font-medium">{mov.quantity}</span> | {mov.previous_stock} → {mov.new_stock}
                    </p>
                    {mov.reason && <p className="text-xs text-gray-400 mt-0.5">{mov.reason}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

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
                  <p className="text-xs text-gray-500">Stock actuel: {selectedMed.current_stock} unités</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement</label>
                  <select
                    value={movementForm.type}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, type: e.target.value as StockMovementType }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="reception">Réception (entrée)</option>
                    <option value="dispensation">Dispensation (sortie)</option>
                    <option value="return">Retour (entrée)</option>
                    <option value="loss">Perte (sortie)</option>
                    <option value="expiry">Périmé (sortie)</option>
                    <option value="adjustment">Ajustement (nouveau total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {movementForm.type === 'adjustment' ? 'Nouveau stock total' : 'Quantité'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence (optionnel)</label>
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
