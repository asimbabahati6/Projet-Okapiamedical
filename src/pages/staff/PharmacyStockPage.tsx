import { useEffect, useState } from 'react';
import { Package, Search, Plus, FileDown, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePharmacyPermissions } from '../../hooks/usePharmacyPermissions';
import { FullAccessBadge, ReadOnlyBadge } from '../../components/common/PermissionBadges';

interface Medication {
  id: string;
  code: string;
  name: string;
  generic_name: string;
  category: string;
  dosage: string;
  form: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  expiry_date: string;
  manufacturer: string;
  batch_number: string;
}

const categoryColors: Record<string, string> = {
  'Antibiotique': 'bg-blue-100 text-blue-800',
  'Analgésique': 'bg-green-100 text-green-800',
  'Anti-inflammatoire': 'bg-orange-100 text-orange-800',
  'Antihypertenseur': 'bg-red-100 text-red-800',
  'Antidiabétique': 'bg-purple-100 text-purple-800',
  'Antipaludéen': 'bg-yellow-100 text-yellow-800',
  'Bronchodilatateur': 'bg-cyan-100 text-cyan-800',
  'Corticoïde': 'bg-pink-100 text-pink-800',
  'Antiviral': 'bg-indigo-100 text-indigo-800',
  'Autre': 'bg-gray-100 text-gray-800'
};

export default function PharmacyStockPage() {
  const permissions = usePharmacyPermissions();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMeds, setFilteredMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    fetchMedications();
  }, []);

  useEffect(() => {
    filterMedications();
  }, [medications, searchTerm, categoryFilter, stockFilter]);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_medications')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedications = () => {
    let filtered = medications;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.code.toLowerCase().includes(term) ||
        m.generic_name?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(m => m.current_stock < m.minimum_stock);
    } else if (stockFilter === 'ok') {
      filtered = filtered.filter(m => m.current_stock >= m.minimum_stock);
    }

    setFilteredMeds(filtered);
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current < minimum) {
      return { status: 'Rupture', color: 'text-red-600', icon: AlertTriangle };
    }
    return { status: 'Normal', color: 'text-green-600', icon: CheckCircle };
  };

  const categories = [...new Set(medications.map(m => m.category))];

  const totalValue = filteredMeds.reduce((sum, m) => sum + (m.current_stock * m.unit_price), 0);
  const lowStockCount = medications.filter(m => m.current_stock < m.minimum_stock).length;

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
            <h1 className="text-3xl font-bold text-gray-900">Stock Pharmacie</h1>
            <p className="text-gray-600 mt-1">Inventaire global des médicaments</p>
          </div>
          <div className="flex items-center gap-4">
            {permissions.canManageInventory ? <FullAccessBadge /> : <ReadOnlyBadge />}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Médicaments</p>
              <p className="text-3xl font-bold text-cyan-600 mt-2">{medications.length}</p>
            </div>
            <Package className="w-12 h-12 text-cyan-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{lowStockCount}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
              <p className="text-2xl font-bold text-green-600 mt-2">${totalValue.toFixed(2)}</p>
            </div>
            <FileDown className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Catégories</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{categories.length}</p>
            </div>
            <Filter className="w-12 h-12 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Code, nom, générique..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">État du stock</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">Tous les états</option>
              <option value="low">Stock bas uniquement</option>
              <option value="ok">Stock normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medications Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Désignation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix Unitaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeds.map((med) => {
                const stockStatus = getStockStatus(med.current_stock, med.minimum_stock);
                const StatusIcon = stockStatus.icon;

                return (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-gray-900">{med.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{med.name}</div>
                        {med.generic_name && (
                          <div className="text-xs text-gray-500">{med.generic_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryColors[med.category] || categoryColors['Autre']}`}>
                        {med.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{med.dosage}</span>
                      <span className="text-xs text-gray-500 ml-1">({med.form})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className={`font-semibold ${med.current_stock < med.minimum_stock ? 'text-red-600' : 'text-gray-900'}`}>
                          {med.current_stock}
                        </span>
                        <span className="text-gray-500 text-xs"> / {med.minimum_stock} min</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">${med.unit_price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {new Date(med.expiry_date).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center ${stockStatus.color}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">{stockStatus.status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMeds.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun médicament trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {permissions.canManageInventory && (
        <div className="mt-8 flex justify-end gap-4">
          <button className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter un médicament
          </button>
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Exporter Excel
          </button>
        </div>
      )}
    </div>
  );
}
