import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Package, ShoppingCart, Search, XCircle,
  ArrowLeft, TrendingDown
} from 'lucide-react';
import { getMedications } from '@/services/pharmacyService';
import { Medication } from '@/types/pharmacy';
import { useToast } from '@/hooks/useToast';

export default function PharmacyLowStockPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLowStock();
  }, []);

  async function loadLowStock() {
    setLoading(true);
    try {
      const all = await getMedications();
      const low = all.filter(m => {
        const stock = m.quantity_in_stock ?? 0;
        const reorder = m.reorder_level ?? 0;
        return stock <= reorder;
      });
      setMedications(low);
    } catch (error) {
      console.error('Error loading low stock:', error);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = medications.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.generic_name.toLowerCase().includes(term) ||
      (m.brand_name && m.brand_name.toLowerCase().includes(term)) ||
      m.medication_code.toLowerCase().includes(term)
    );
  });

  const outOfStock = filtered.filter(m => (m.quantity_in_stock ?? 0) === 0);
  const criticalStock = filtered.filter(m => {
    const stock = m.quantity_in_stock ?? 0;
    const reorder = m.reorder_level ?? 0;
    return stock > 0 && stock < reorder / 2;
  });
  const lowStock = filtered.filter(m => {
    const stock = m.quantity_in_stock ?? 0;
    const reorder = m.reorder_level ?? 0;
    return stock >= reorder / 2 && stock <= reorder;
  });

  function getSeverityBadge(med: Medication) {
    const stock = med.quantity_in_stock ?? 0;
    const reorder = med.reorder_level ?? 0;

    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Rupture
        </span>
      );
    } else if (stock < reorder / 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3" />
          Critique
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        <TrendingDown className="w-3 h-3" />
        Bas
      </span>
    );
  }

  function getRowBg(med: Medication) {
    const stock = med.quantity_in_stock ?? 0;
    const reorder = med.reorder_level ?? 0;
    if (stock === 0) return 'bg-red-50 border-l-4 border-red-500';
    if (stock < reorder / 2) return 'bg-orange-50 border-l-4 border-orange-400';
    return 'bg-yellow-50 border-l-4 border-yellow-400';
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pharmacy/dashboard')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Bas</h1>
          <p className="text-gray-600 mt-1">
            {medications.length} médicament(s) nécessitent un réapprovisionnement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rupture de stock</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{outOfStock.length}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Niveau critique</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{criticalStock.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock bas</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{lowStock.length}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un médicament..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          onClick={() => navigate('/pharmacy/orders')}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Voir les commandes
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Aucun médicament en stock bas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Médicament</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stock actuel</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Seuil min</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">À commander</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sévérité</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fournisseur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(med => {
                const stock = med.quantity_in_stock ?? 0;
                const reorder = med.reorder_level ?? 0;
                const toOrder = Math.max(reorder * 2 - stock, 0);

                return (
                  <tr key={med.id} className={`${getRowBg(med)} hover:brightness-95 transition-all`}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{med.generic_name}</p>
                      {med.brand_name && (
                        <p className="text-xs text-gray-500">{med.brand_name}</p>
                      )}
                      <p className="text-xs text-gray-400 font-mono">{med.medication_code}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {med.category ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-2xl font-bold ${stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600 font-medium">{reorder}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-sm font-semibold rounded-full">
                        {toOrder}
                      </span>
                    </td>
                    <td className="px-5 py-4">{getSeverityBadge(med)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {med.supplier ?? <span className="text-gray-400 italic">Non défini</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
