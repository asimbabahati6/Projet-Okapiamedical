import { useEffect, useState } from 'react';
import { Plus, Filter, TrendingUp, TrendingDown, Package, MapPin, User, Calendar, Search, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StockMovement, MovementType } from '../../types/logistics';

interface StockMovementsListProps {
  onAddMovement: () => void;
}

export default function StockMovementsList({ onAddMovement }: StockMovementsListProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    movement_type: 'all',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movements, filters]);

  async function fetchMovements() {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          item:inventory_items(id, name, sku, unit),
          performer:user_profiles!stock_movements_performed_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      if (data) setMovements(data as any);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...movements];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.item?.name.toLowerCase().includes(term) ||
          m.item?.sku.toLowerCase().includes(term) ||
          m.reason.toLowerCase().includes(term) ||
          m.reference_number?.toLowerCase().includes(term)
      );
    }

    if (filters.movement_type !== 'all') {
      filtered = filtered.filter(m => m.movement_type === filters.movement_type);
    }

    if (filters.date_from) {
      filtered = filtered.filter(m => m.created_at >= filters.date_from);
    }

    if (filters.date_to) {
      const dateTo = new Date(filters.date_to);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(m => new Date(m.created_at) <= dateTo);
    }

    setFilteredMovements(filtered);
  }

  function getMovementIcon(type: MovementType) {
    const icons = {
      entry: TrendingUp,
      exit: TrendingDown,
      adjustment: Package,
      transfer: MapPin,
      return: TrendingUp,
      loss: TrendingDown,
      expiry: TrendingDown,
    };
    const Icon = icons[type] || Package;
    return <Icon className="w-4 h-4" />;
  }

  function getMovementLabel(type: MovementType) {
    const labels: Record<MovementType, string> = {
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

  function getMovementColor(type: MovementType) {
    const colors = {
      entry: 'bg-green-100 text-green-800',
      exit: 'bg-red-100 text-red-800',
      adjustment: 'bg-blue-100 text-blue-800',
      transfer: 'bg-purple-100 text-purple-800',
      return: 'bg-orange-100 text-orange-800',
      loss: 'bg-gray-100 text-gray-800',
      expiry: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mouvements de Stock</h2>
          <p className="text-gray-600 mt-1">
            {filteredMovements.length} mouvement{filteredMovements.length > 1 ? 's' : ''} sur {movements.length}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filtres
          </button>
          <button
            onClick={onAddMovement}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau Mouvement
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par article, raison, référence..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de mouvement</label>
              <select
                value={filters.movement_type}
                onChange={(e) => setFilters({ ...filters, movement_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="entry">Entrée</option>
                <option value="exit">Sortie</option>
                <option value="adjustment">Ajustement</option>
                <option value="transfer">Transfert</option>
                <option value="return">Retour</option>
                <option value="loss">Perte</option>
                <option value="expiry">Expiration</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={() => setFilters({ search: '', movement_type: 'all', date_from: '', date_to: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Entrées',
            count: movements.filter(m => m.movement_type === 'entry').length,
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'Sorties',
            count: movements.filter(m => m.movement_type === 'exit').length,
            color: 'text-red-600 bg-red-50',
          },
          {
            label: 'Ajustements',
            count: movements.filter(m => m.movement_type === 'adjustment').length,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Transferts',
            count: movements.filter(m => m.movement_type === 'transfer').length,
            color: 'text-purple-600 bg-purple-50',
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
            <p className="text-sm font-medium opacity-80">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Movements List */}
      {filteredMovements.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun mouvement trouvé</h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.movement_type !== 'all' || filters.date_from || filters.date_to
              ? 'Aucun mouvement ne correspond à vos critères.'
              : 'Commencez par enregistrer votre premier mouvement de stock.'}
          </p>
          {movements.length === 0 && (
            <button
              onClick={onAddMovement}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau Mouvement
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Évolution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-900">
                            {new Date(movement.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(movement.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getMovementColor(
                          movement.movement_type
                        )}`}
                      >
                        {getMovementIcon(movement.movement_type)}
                        {getMovementLabel(movement.movement_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{movement.item?.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{movement.item?.sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">
                        {movement.quantity} {movement.item?.unit}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">
                        {movement.previous_quantity} → {movement.new_quantity} {movement.item?.unit}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{movement.reason}</p>
                        {movement.reference_number && (
                          <p className="text-xs text-gray-500 mt-1">Réf: {movement.reference_number}</p>
                        )}
                        {movement.notes && (
                          <p className="text-xs text-gray-500 italic mt-1">{movement.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movement.performer && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{movement.performer.full_name}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
