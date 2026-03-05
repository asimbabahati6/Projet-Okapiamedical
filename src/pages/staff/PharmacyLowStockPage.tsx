import { useEffect, useState } from 'react';
import { AlertTriangle, Package, ShoppingCart, TrendingDown, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePharmacyPermissions } from '../../hooks/usePharmacyPermissions';

interface LowStockMedication {
  id: string;
  code: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_price: number;
  manufacturer: string;
  form: string;
  dosage: string;
}

export default function PharmacyLowStockPage() {
  const permissions = usePharmacyPermissions();
  const [lowStockMeds, setLowStockMeds] = useState<LowStockMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeds, setSelectedMeds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLowStockMedications();
  }, []);

  const fetchLowStockMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_medications')
        .select('*')
        .eq('is_active', true)
        .order('current_stock', { ascending: true });

      if (error) throw error;

      const lowStock = (data || []).filter(m => m.current_stock < m.minimum_stock);
      setLowStockMeds(lowStock);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockPercentage = (current: number, minimum: number) => {
    return (current / minimum) * 100;
  };

  const getUrgencyLevel = (current: number, minimum: number) => {
    const percentage = getStockPercentage(current, minimum);
    if (percentage === 0) return { label: 'RUPTURE', color: 'bg-red-600', textColor: 'text-red-600' };
    if (percentage < 25) return { label: 'CRITIQUE', color: 'bg-orange-600', textColor: 'text-orange-600' };
    if (percentage < 50) return { label: 'BAS', color: 'bg-yellow-600', textColor: 'text-yellow-600' };
    return { label: 'ATTENTION', color: 'bg-blue-600', textColor: 'text-blue-600' };
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedMeds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMeds(newSelected);
  };

  const selectAll = () => {
    if (selectedMeds.size === lowStockMeds.length) {
      setSelectedMeds(new Set());
    } else {
      setSelectedMeds(new Set(lowStockMeds.map(m => m.id)));
    }
  };

  const generatePurchaseOrder = () => {
    if (selectedMeds.size === 0) {
      alert('Veuillez sélectionner au moins un médicament');
      return;
    }

    const selectedItems = lowStockMeds.filter(m => selectedMeds.has(m.id));
    const orderDetails = selectedItems.map(m => ({
      code: m.code,
      name: m.name,
      quantityToOrder: m.minimum_stock - m.current_stock + 100,
      estimatedCost: (m.minimum_stock - m.current_stock + 100) * m.unit_price
    }));

    console.log('Bon de commande:', orderDetails);
    alert(`Bon de commande généré pour ${selectedItems.length} médicament(s)`);
  };

  const totalDeficit = lowStockMeds.reduce((sum, m) => sum + (m.minimum_stock - m.current_stock), 0);
  const criticalCount = lowStockMeds.filter(m => m.current_stock === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              Alertes Stock Bas
            </h1>
            <p className="text-gray-600 mt-1">Médicaments nécessitant un réapprovisionnement urgent</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-8 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Attention: Ruptures de stock détectées!</h3>
              <p className="text-red-700 mt-1">
                {criticalCount} médicament(s) en rupture totale. Action immédiate requise.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{lowStockMeds.length}</p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ruptures</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{criticalCount}</p>
            </div>
            <Package className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Déficit Total</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{totalDeficit}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      {permissions.canManageInventory && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {selectedMeds.size === lowStockMeds.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
            <span className="text-sm text-gray-600">
              {selectedMeds.size} médicament(s) sélectionné(s)
            </span>
          </div>

          <button
            onClick={generatePurchaseOrder}
            disabled={selectedMeds.size === 0}
            className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-5 h-5" />
            Générer Bon de Commande
          </button>
        </div>
      )}

      {/* Low Stock Cards */}
      {lowStockMeds.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Package className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Excellent!</h3>
          <p className="mt-2 text-gray-600">Tous les médicaments sont en stock suffisant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lowStockMeds.map((med) => {
            const urgency = getUrgencyLevel(med.current_stock, med.minimum_stock);
            const deficit = med.minimum_stock - med.current_stock;
            const recommendedOrder = deficit + 100;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 ${urgency.color} ${selectedMeds.has(med.id) ? 'ring-2 ring-cyan-500' : ''}`}
              >
                <div className="p-6">
                  {/* Header with checkbox */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-2 ${urgency.color}`}>
                        {urgency.label}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-600">{med.code}</p>
                    </div>
                    {permissions.canManageInventory && (
                      <input
                        type="checkbox"
                        checked={selectedMeds.has(med.id)}
                        onChange={() => toggleSelection(med.id)}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                      />
                    )}
                  </div>

                  {/* Stock Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Stock actuel:</span>
                      <span className={`font-bold ${urgency.textColor}`}>{med.current_stock}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Stock minimum:</span>
                      <span className="font-semibold text-gray-900">{med.minimum_stock}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Déficit:</span>
                      <span className="font-bold text-red-600">-{deficit}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${urgency.color}`}
                        style={{ width: `${Math.min(getStockPercentage(med.current_stock, med.minimum_stock), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Catégorie:</span>
                      <span className="font-medium text-gray-900">{med.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Dosage:</span>
                      <span className="font-medium text-gray-900">{med.dosage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Fabricant:</span>
                      <span className="font-medium text-gray-900">{med.manufacturer}</span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantité recommandée:</span>
                      <span className="text-lg font-bold text-cyan-600">{recommendedOrder}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Coût estimé:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(recommendedOrder * med.unit_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
