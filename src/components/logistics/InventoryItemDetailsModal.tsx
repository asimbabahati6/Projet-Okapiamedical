import { useState, useEffect } from 'react';
import { X, Package, TrendingUp, TrendingDown, Calendar, User, MapPin, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InventoryItem, StockMovement } from '../../types/logistics';

interface InventoryItemDetailsModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
}

export default function InventoryItemDetailsModal({ isOpen, item, onClose }: InventoryItemDetailsModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  useEffect(() => {
    if (isOpen && item) {
      fetchMovements();
    }
  }, [isOpen, item]);

  async function fetchMovements() {
    if (!item) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          performer:user_profiles!stock_movements_performed_by_fkey(id, full_name)
        `)
        .eq('item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setMovements(data as any);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMovementIcon(type: string) {
    switch (type) {
      case 'entry':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'exit':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'adjustment':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'transfer':
        return <MapPin className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  }

  function getMovementLabel(type: string) {
    const labels: Record<string, string> = {
      entry: 'Entrée',
      exit: 'Sortie',
      adjustment: 'Ajustement',
      transfer: 'Transfert',
      return: 'Retour',
      loss: 'Perte',
      expiry: 'Expiration',
    };
    return labels[type] || type;
  }

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-600">SKU: {item.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Informations
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historique ({movements.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 font-medium mb-1">Quantité Actuelle</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {item.current_quantity} <span className="text-lg font-normal">{item.unit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium mb-1">Valeur Totale</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {item.total_value.toLocaleString('fr-FR')} <span className="text-lg font-normal">FC</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium mb-1">Prix Unitaire</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {item.unit_price.toLocaleString('fr-FR')} <span className="text-lg font-normal">FC</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Informations Générales</h3>

                  {item.description && (
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-gray-900">{item.description}</p>
                    </div>
                  )}

                  {item.category && (
                    <div>
                      <p className="text-sm text-gray-600">Catégorie</p>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium"
                        style={{
                          backgroundColor: `${item.category.color}20`,
                          color: item.category.color,
                        }}
                      >
                        {item.category.name}
                      </span>
                    </div>
                  )}

                  {item.supplier && (
                    <div>
                      <p className="text-sm text-gray-600">Fournisseur</p>
                      <p className="text-gray-900">{item.supplier.name}</p>
                    </div>
                  )}

                  {item.batch_number && (
                    <div>
                      <p className="text-sm text-gray-600">Numéro de lot</p>
                      <p className="text-gray-900 font-mono">{item.batch_number}</p>
                    </div>
                  )}

                  {item.location && (
                    <div>
                      <p className="text-sm text-gray-600">Emplacement</p>
                      <p className="text-gray-900">{item.location}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Gestion des Stocks</h3>

                  <div>
                    <p className="text-sm text-gray-600">Quantité Minimum</p>
                    <p className="text-gray-900">{item.min_quantity} {item.unit}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Quantité Maximum</p>
                    <p className="text-gray-900">{item.max_quantity} {item.unit}</p>
                  </div>

                  {item.reorder_point && (
                    <div>
                      <p className="text-sm text-gray-600">Point de Réapprovisionnement</p>
                      <p className="text-gray-900">{item.reorder_point} {item.unit}</p>
                    </div>
                  )}

                  {item.expiry_date && (
                    <div>
                      <p className="text-sm text-gray-600">Date d'Expiration</p>
                      <p className="text-gray-900">
                        {new Date(item.expiry_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}

                  {item.last_restock_date && (
                    <div>
                      <p className="text-sm text-gray-600">Dernier Réapprovisionnement</p>
                      <p className="text-gray-900">
                        {new Date(item.last_restock_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {item.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun mouvement</h3>
                  <p className="text-gray-600">
                    Aucun mouvement de stock n'a été enregistré pour cet article.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getMovementIcon(movement.movement_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {getMovementLabel(movement.movement_type)}
                              </h4>
                              <span className="text-sm text-gray-500">
                                {new Date(movement.created_at).toLocaleDateString('fr-FR')}
                                {' à '}
                                {new Date(movement.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{movement.reason}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                Quantité: <strong>{movement.quantity} {item.unit}</strong>
                              </span>
                              <span className="text-gray-600">
                                {movement.previous_quantity} → {movement.new_quantity} {item.unit}
                              </span>
                              {movement.performer && (
                                <span className="flex items-center gap-1 text-gray-600">
                                  <User className="w-3 h-3" />
                                  {movement.performer.full_name}
                                </span>
                              )}
                            </div>
                            {movement.notes && (
                              <p className="text-sm text-gray-500 mt-2 italic">{movement.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
