import { useState, useEffect } from 'react';
import { Package, Plus, Download, Search, Eye, Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getMedications, deleteMedication, getPharmacyStats, getStockAlerts } from '../../services/pharmacyService';
import { Medication, PharmacyStats, MedicationStockAlert } from '../../types/pharmacy';
import { AddMedicationModal } from '../../components/pharmacy/AddMedicationModal';
import { useToast } from '../../hooks/useToast';

export default function PharmacyInventoryPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState<PharmacyStats>({
    total_medications: 0,
    low_stock_count: 0,
    expiring_soon_count: 0,
    total_stock_value: 0,
    out_of_stock_count: 0
  });
  const [alerts, setAlerts] = useState<MedicationStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMedications();
  }, [medications, searchTerm, categoryFilter, formFilter, stockFilter, activeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [medsData, statsData, alertsData] = await Promise.all([
        getMedications(),
        getPharmacyStats(),
        getStockAlerts()
      ]);
      setMedications(medsData);
      setStats(statsData);
      setAlerts(alertsData);
    } catch (error: any) {
      showToast('Erreur lors du chargement des données', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterMedications() {
    let filtered = medications;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.generic_name.toLowerCase().includes(search) ||
          (m.brand_name && m.brand_name.toLowerCase().includes(search)) ||
          m.medication_code.toLowerCase().includes(search)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    if (formFilter !== 'all') {
      filtered = filtered.filter(m => m.dosage_form === formFilter);
    }

    if (stockFilter !== 'all') {
      filtered = filtered.filter(m => {
        const stock = m.quantity_in_stock || 0;
        const reorder = m.reorder_level || 0;

        switch (stockFilter) {
          case 'in_stock':
            return stock > reorder;
          case 'low_stock':
            return stock <= reorder && stock > 0;
          case 'out_of_stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(m => m.is_active === (activeFilter === 'active'));
    }

    setFilteredMedications(filtered);
  }

  async function handleDelete(medication: Medication) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${medication.generic_name}?`)) {
      return;
    }

    try {
      await deleteMedication(medication.id);
      showToast('Médicament supprimé avec succès', 'success');
      loadData();
    } catch (error: any) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Error deleting medication:', error);
    }
  }

  function getStockStatusBadge(medication: Medication) {
    const stock = medication.quantity_in_stock || 0;
    const reorder = medication.reorder_level || 0;

    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Rupture
        </span>
      );
    } else if (stock <= reorder) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3" />
          Bas
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          OK
        </span>
      );
    }
  }

  function isExpiringSoon(expiryDate: string | null): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  }

  function exportToCSV() {
    const headers = [
      'Code',
      'Nom Générique',
      'Nom Commercial',
      'Catégorie',
      'Forme',
      'Dosage',
      'Stock',
      'Niveau Alerte',
      'Prix (CDF)',
      'Expiration'
    ];
    const rows = filteredMedications.map(m => [
      m.medication_code,
      m.generic_name,
      m.brand_name || '',
      m.category || '',
      m.dosage_form || '',
      m.strength || '',
      m.quantity_in_stock || 0,
      m.reorder_level || 0,
      m.unit_price || 0,
      m.expiry_date || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire-pharmacie-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire Pharmacie</h1>
          <p className="text-gray-600">Gérer l'inventaire des médicaments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Nouveau Médicament
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Alertes Stock</h3>
              <p className="text-sm text-red-700">
                {stats.out_of_stock_count} en rupture de stock, {stats.low_stock_count} stock bas, {stats.expiring_soon_count} expirant bientôt
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Médicaments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_medications}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bas</p>
              <p className="text-2xl font-bold text-orange-600">{stats.low_stock_count}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rupture Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_count}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expirant Bientôt</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring_soon_count}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur Stock</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.total_stock_value)} CDF</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes catégories</option>
              <option value="Antibiotique">Antibiotique</option>
              <option value="Antalgique">Antalgique</option>
              <option value="Anti-inflammatoire">Anti-inflammatoire</option>
              <option value="Antipyrétique">Antipyrétique</option>
              <option value="Antihypertenseur">Antihypertenseur</option>
              <option value="Antidiabétique">Antidiabétique</option>
              <option value="Antipaludéen">Antipaludéen</option>
              <option value="Vitamines">Vitamines</option>
            </select>

            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes formes</option>
              <option value="Comprimé">Comprimé</option>
              <option value="Gélule">Gélule</option>
              <option value="Sirop">Sirop</option>
              <option value="Solution injectable">Injectable</option>
              <option value="Pommade">Pommade</option>
              <option value="Crème">Crème</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous stocks</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Stock bas</option>
              <option value="out_of_stock">Rupture</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médicament</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forme</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMedications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucun médicament trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredMedications.map((medication) => (
                  <tr key={medication.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{medication.medication_code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{medication.generic_name}</div>
                      {medication.brand_name && (
                        <div className="text-xs text-gray-500">{medication.brand_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {medication.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{medication.dosage_form || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{medication.strength || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {medication.quantity_in_stock || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        Seuil: {medication.reorder_level || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStockStatusBadge(medication)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(medication.unit_price)} CDF
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {medication.expiry_date ? (
                        <span
                          className={`text-sm ${
                            isExpiringSoon(medication.expiry_date)
                              ? 'text-orange-600 font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          {new Date(medication.expiry_date).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showToast('Fonctionnalité en développement', 'info')}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => showToast('Fonctionnalité en développement', 'info')}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(medication)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddMedicationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadData();
            showToast('Médicament ajouté avec succès', 'success');
          }}
        />
      )}
    </div>
  );
}
