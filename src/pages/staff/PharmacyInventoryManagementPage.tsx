import { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Package, History, Plus, Minus, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePharmacyPermissions } from '../../hooks/usePharmacyPermissions';
import { useAuth } from '../../contexts/AuthContext';

interface StockMovement {
  id: string;
  medication_id: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_number: string;
  reason: string;
  created_at: string;
  medication: {
    code: string;
    name: string;
  };
}

interface Medication {
  id: string;
  code: string;
  name: string;
  current_stock: number;
  unit_price: number;
}

export default function PharmacyInventoryManagementPage() {
  const permissions = usePharmacyPermissions();
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    medication_id: '',
    movement_type: 'reception',
    quantity: '',
    unit_cost: '',
    reference_number: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movementsRes, medsRes] = await Promise.all([
        supabase
          .from('pharmacy_stock_movements')
          .select(`
            *,
            medication:pharmacy_medications(code, name)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('pharmacy_medications')
          .select('id, code, name, current_stock, unit_price')
          .eq('is_active', true)
          .order('name')
      ]);

      if (movementsRes.error) throw movementsRes.error;
      if (medsRes.error) throw medsRes.error;

      setMovements(movementsRes.data || []);
      setMedications(medsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!permissions.canManageInventory) {
      alert('Vous n\'avez pas les permissions nécessaires');
      return;
    }

    try {
      const medication = medications.find(m => m.id === formData.medication_id);
      if (!medication) {
        alert('Médicament non trouvé');
        return;
      }

      const quantity = parseInt(formData.quantity);
      const adjustedQuantity = formData.movement_type === 'dispensation' ||
                                formData.movement_type === 'loss' ||
                                formData.movement_type === 'expiry'
                                ? -Math.abs(quantity)
                                : Math.abs(quantity);

      const newStock = medication.current_stock + adjustedQuantity;

      if (newStock < 0) {
        alert('Stock insuffisant pour cette opération');
        return;
      }

      const unitCost = parseFloat(formData.unit_cost) || medication.unit_price;
      const totalCost = Math.abs(adjustedQuantity) * unitCost;

      const { error: movementError } = await supabase
        .from('pharmacy_stock_movements')
        .insert({
          medication_id: formData.medication_id,
          movement_type: formData.movement_type,
          quantity: adjustedQuantity,
          previous_stock: medication.current_stock,
          new_stock: newStock,
          unit_cost: unitCost,
          total_cost: totalCost,
          reference_number: formData.reference_number,
          reason: formData.reason,
          performed_by: user?.id
        });

      if (movementError) throw movementError;

      const { error: updateError } = await supabase
        .from('pharmacy_medications')
        .update({ current_stock: newStock })
        .eq('id', formData.medication_id);

      if (updateError) throw updateError;

      alert('Mouvement de stock enregistré avec succès');
      setFormData({
        medication_id: '',
        movement_type: 'reception',
        quantity: '',
        unit_cost: '',
        reference_number: '',
        reason: ''
      });
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error recording movement:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const movementTypeConfig = {
    reception: { label: 'Entrée Fournisseur', icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-50' },
    dispensation: { label: 'Dispensation', icon: ArrowDownCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    adjustment: { label: 'Ajustement', icon: Package, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    loss: { label: 'Perte/Casse', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    expiry: { label: 'Péremption', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    return: { label: 'Retour', icon: ArrowUpCircle, color: 'text-purple-600', bg: 'bg-purple-50' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gérer l'Inventaire</h1>
            <p className="text-gray-600 mt-1">Journal des mouvements de stock</p>
          </div>
          {permissions.canManageInventory && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouveau Mouvement
            </button>
          )}
        </div>
      </div>

      {/* Movement Form */}
      {showForm && permissions.canManageInventory && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Enregistrer un Mouvement</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médicament *
                </label>
                <select
                  value={formData.medication_id}
                  onChange={(e) => setFormData({ ...formData, medication_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un médicament</option>
                  {medications.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.code} - {med.name} (Stock: {med.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de Mouvement *
                </label>
                <select
                  value={formData.movement_type}
                  onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="reception">Entrée Fournisseur (+)</option>
                  <option value="dispensation">Dispensation (-)</option>
                  <option value="adjustment">Ajustement</option>
                  <option value="loss">Perte/Casse (-)</option>
                  <option value="expiry">Péremption (-)</option>
                  <option value="return">Retour (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Entrer la quantité"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coût Unitaire (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Optionnel - prix par défaut utilisé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de Référence
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ex: REC-2026-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif/Notes *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Expliquer le motif du mouvement"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Movements */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Historique Récent (10 derniers mouvements)</h2>
        </div>

        <div className="space-y-4">
          {movements.map((movement) => {
            const config = movementTypeConfig[movement.movement_type as keyof typeof movementTypeConfig];
            const Icon = config.icon;
            const isPositive = movement.quantity > 0;

            return (
              <div
                key={movement.id}
                className={`${config.bg} border-l-4 ${config.color.replace('text', 'border')} rounded-lg p-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg bg-white`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color} ${config.bg}`}>
                          {config.label}
                        </span>
                        {movement.reference_number && (
                          <span className="text-xs font-mono text-gray-500">{movement.reference_number}</span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg">
                        {movement.medication.code} - {movement.medication.name}
                      </h3>

                      <p className="text-sm text-gray-600 mt-1">{movement.reason}</p>

                      <div className="mt-3 flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Quantité: </span>
                          <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{movement.quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Stock avant: </span>
                          <span className="font-semibold text-gray-900">{movement.previous_stock}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Stock après: </span>
                          <span className="font-semibold text-gray-900">{movement.new_stock}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(movement.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {movements.length === 0 && (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun mouvement</h3>
              <p className="mt-1 text-sm text-gray-500">
                Les mouvements de stock apparaîtront ici
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
