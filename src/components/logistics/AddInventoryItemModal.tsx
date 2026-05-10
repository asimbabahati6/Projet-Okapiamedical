import { useState, useEffect } from 'react';
import { X, Package, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { InventoryItemFormData } from '../../types/logistics';

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddInventoryItemModal({ isOpen, onClose, onSuccess }: AddInventoryItemModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [formData, setFormData] = useState<InventoryItemFormData>({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    supplier_id: '',
    current_quantity: 0,
    min_quantity: 10,
    max_quantity: 1000,
    reorder_point: 20,
    unit: 'unité',
    unit_price: 0,
    expiry_date: '',
    batch_number: '',
    location: '',
    notes: '',
    photo_url: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchSuppliers();
      generateSKU();
    }
  }, [isOpen]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (data) setCategories(data);
  }

  async function fetchSuppliers() {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) setSuppliers(data);
  }

  async function generateSKU() {
    try {
      const { data, error } = await supabase.rpc('generate_sku');
      if (error) throw error;
      if (data) {
        setFormData(prev => ({ ...prev, sku: data }));
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      const fallbackSKU = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setFormData(prev => ({ ...prev, sku: fallbackSKU }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.sku) {
        throw new Error('Le nom et le SKU sont requis');
      }

      if (formData.min_quantity >= formData.max_quantity) {
        throw new Error('La quantité minimum doit être inférieure à la quantité maximum');
      }

      const { error: insertError } = await supabase
        .from('inventory_items')
        .insert({
          name: formData.name,
          description: formData.description || null,
          sku: formData.sku,
          category_id: formData.category_id || null,
          supplier_id: formData.supplier_id || null,
          current_quantity: formData.current_quantity,
          min_quantity: formData.min_quantity,
          max_quantity: formData.max_quantity,
          reorder_point: formData.reorder_point || null,
          unit: formData.unit,
          unit_price: formData.unit_price,
          expiry_date: formData.expiry_date || null,
          batch_number: formData.batch_number || null,
          location: formData.location || null,
          notes: formData.notes || null,
          photo_url: formData.photo_url || null,
        });

      if (insertError) throw insertError;

      if (formData.current_quantity > 0) {
        const item = await supabase
          .from('inventory_items')
          .select('id')
          .eq('sku', formData.sku)
          .single();

        if (item.data) {
          await supabase.from('stock_movements').insert({
            item_id: item.data.id,
            movement_type: 'entry',
            quantity: formData.current_quantity,
            previous_quantity: 0,
            new_quantity: formData.current_quantity,
            reason: 'Stock initial',
            performed_by: user?.id,
          });
        }
      }

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
      name: '',
      description: '',
      sku: '',
      category_id: '',
      supplier_id: '',
      current_quantity: 0,
      min_quantity: 10,
      max_quantity: 1000,
      reorder_point: 20,
      unit: 'unité',
      unit_price: 0,
      expiry_date: '',
      batch_number: '',
      location: '',
      notes: '',
      photo_url: '',
    });
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ajouter un Article</h2>
              <p className="text-sm text-gray-600">Enregistrer un nouvel article dans l'inventaire</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'article <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Paracétamol 500mg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description détaillée de l'article"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="INV-YYYYMMDD-XXXX"
              />
              <p className="text-xs text-gray-500 mt-1">Code unique auto-généré</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de lot</label>
              <input
                type="text"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="LOT-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité initiale
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.current_quantity}
                onChange={(e) => setFormData({ ...formData, current_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unité</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: unité, boîte, flacon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité minimum <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité maximum <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.max_quantity}
                onChange={(e) => setFormData({ ...formData, max_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Point de réapprovisionnement</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.reorder_point || ''}
                onChange={(e) => setFormData({ ...formData, reorder_point: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix unitaire (FC)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date d'expiration</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emplacement</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Entrepôt A, Étagère 3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notes supplémentaires"
              />
            </div>
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Ajouter l'article
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
