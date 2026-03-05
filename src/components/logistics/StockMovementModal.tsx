import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Package, MapPin, AlertCircle, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MovementType } from '../../types/logistics';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedItemId?: string;
}

export default function StockMovementModal({ isOpen, onClose, onSuccess, preselectedItemId }: StockMovementModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    item_id: preselectedItemId || '',
    movement_type: 'entry' as MovementType,
    quantity: 0,
    reason: '',
    reference_number: '',
    source_location: '',
    destination_location: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      if (preselectedItemId) {
        setFormData(prev => ({ ...prev, item_id: preselectedItemId }));
      }
    }
  }, [isOpen, preselectedItemId]);

  useEffect(() => {
    if (formData.item_id) {
      const item = items.find(i => i.id === formData.item_id);
      setSelectedItem(item);
    } else {
      setSelectedItem(null);
    }
  }, [formData.item_id, items]);

  async function fetchItems() {
    const { data } = await supabase
      .from('inventory_items')
      .select('id, name, sku, current_quantity, unit, status')
      .order('name');

    if (data) setItems(data);
  }

  function getMovementIcon(type: MovementType) {
    const icons = {
      entry: TrendingUp,
      exit: TrendingDown,
      adjustment: Package,
      transfer: MapPin,
      return: RotateCcw,
      loss: AlertCircle,
      expiry: AlertCircle,
    };
    return icons[type] || Package;
  }

  function getMovementColor(type: MovementType) {
    const colors = {
      entry: 'text-green-600 bg-green-100',
      exit: 'text-red-600 bg-red-100',
      adjustment: 'text-blue-600 bg-blue-100',
      transfer: 'text-purple-600 bg-purple-100',
      return: 'text-orange-600 bg-orange-100',
      loss: 'text-gray-600 bg-gray-100',
      expiry: 'text-gray-600 bg-gray-100',
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  }

  function calculateNewQuantity() {
    if (!selectedItem) return 0;

    const current = selectedItem.current_quantity;
    const qty = formData.quantity;

    switch (formData.movement_type) {
      case 'entry':
      case 'return':
        return current + qty;
      case 'exit':
      case 'loss':
      case 'expiry':
        return current - qty;
      case 'adjustment':
        return qty;
      case 'transfer':
        return current - qty;
      default:
        return current;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.item_id || !formData.reason) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (formData.quantity <= 0) {
        throw new Error('La quantité doit être supérieure à 0');
      }

      if (!selectedItem) {
        throw new Error('Article non trouvé');
      }

      const currentQty = selectedItem.current_quantity;
      const newQty = calculateNewQuantity();

      if (newQty < 0) {
        throw new Error(`Quantité insuffisante en stock. Disponible: ${currentQty} ${selectedItem.unit}`);
      }

      if (['exit', 'loss', 'expiry', 'transfer'].includes(formData.movement_type)) {
        if (formData.quantity > currentQty) {
          throw new Error(`Quantité insuffisante. Disponible: ${currentQty} ${selectedItem.unit}`);
        }
      }

      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert({
          item_id: formData.item_id,
          movement_type: formData.movement_type,
          quantity: formData.quantity,
          previous_quantity: currentQty,
          new_quantity: newQty,
          reason: formData.reason,
          reference_number: formData.reference_number || null,
          source_location: formData.source_location || null,
          destination_location: formData.destination_location || null,
          notes: formData.notes || null,
          performed_by: user?.id,
        });

      if (insertError) throw insertError;

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFormData({
      item_id: '',
      movement_type: 'entry',
      quantity: 0,
      reason: '',
      reference_number: '',
      source_location: '',
      destination_location: '',
      notes: '',
    });
    setSelectedItem(null);
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  const MovementIcon = getMovementIcon(formData.movement_type);
  const newQuantity = calculateNewQuantity();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getMovementColor(formData.movement_type)}`}>
              <MovementIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enregistrer un Mouvement</h2>
              <p className="text-sm text-gray-600">Entrée, sortie ou ajustement de stock</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Erreur</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Type de mouvement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de mouvement <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'entry', label: 'Entrée', icon: TrendingUp, color: 'green' },
                { value: 'exit', label: 'Sortie', icon: TrendingDown, color: 'red' },
                { value: 'adjustment', label: 'Ajustement', icon: Package, color: 'blue' },
                { value: 'transfer', label: 'Transfert', icon: MapPin, color: 'purple' },
              ].map((type) => {
                const Icon = type.icon;
                const isSelected = formData.movement_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, movement_type: type.value as MovementType })}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? `border-${type.color}-600 bg-${type.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? `text-${type.color}-600` : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isSelected ? `text-${type.color}-900` : 'text-gray-600'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Article */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!!preselectedItemId}
            >
              <option value="">Sélectionner un article</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.sku} ({item.current_quantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Stock actuel */}
          {selectedItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Stock Actuel</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedItem.current_quantity} <span className="text-sm font-normal">{selectedItem.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Changement</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formData.movement_type === 'adjustment' ? '=' : ['entry', 'return'].includes(formData.movement_type) ? '+' : '-'}
                    {formData.quantity || 0} <span className="text-sm font-normal">{selectedItem.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Nouveau Stock</p>
                  <p className={`text-2xl font-bold ${newQuantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {newQuantity} <span className="text-sm font-normal">{selectedItem.unit}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              {selectedItem && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {selectedItem.unit}
                </span>
              )}
            </div>
            {formData.movement_type === 'adjustment' && (
              <p className="text-xs text-gray-500 mt-1">
                Pour un ajustement, entrez la nouvelle quantité totale
              </p>
            )}
          </div>

          {/* Raison */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Réception fournisseur, Distribution service, Inventaire physique"
            />
          </div>

          {/* Numéro de référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de référence
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: BL-2024-001, CMD-456"
            />
          </div>

          {/* Localisation (si transfert) */}
          {formData.movement_type === 'transfer' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emplacement source
                </label>
                <input
                  type="text"
                  value={formData.source_location}
                  onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Entrepôt A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emplacement destination
                </label>
                <input
                  type="text"
                  value={formData.destination_location}
                  onChange={(e) => setFormData({ ...formData, destination_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Pharmacie"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notes supplémentaires (optionnel)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Enregistrer le mouvement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
