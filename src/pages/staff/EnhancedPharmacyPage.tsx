import { useState, useEffect } from 'react';
import { Pill, Search, Package, AlertTriangle, Plus, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AddMedicationModal } from '../../components/pharmacy/AddMedicationModal';

interface MedicationStock {
  id: string;
  medication_id: string;
  generic_name: string;
  brand_name: string | null;
  strength: string;
  quantity: number;
  expiry_date: string | null;
}

export function EnhancedPharmacyPage() {
  const [stock, setStock] = useState<MedicationStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchStock();
  }, []);

  async function fetchStock() {
    try {
      const { data } = await supabase
        .from('pharmacy_stock')
        .select(`
          id,
          medication_id,
          quantity,
          expiry_date,
          medication:medications(generic_name, brand_name, strength)
        `)
        .order('quantity', { ascending: true });

      if (data) {
        setStock(data.map((item: any) => ({
          id: item.id,
          medication_id: item.medication_id,
          generic_name: item.medication?.generic_name || '',
          brand_name: item.medication?.brand_name || null,
          strength: item.medication?.strength || '',
          quantity: item.quantity || 0,
          expiry_date: item.expiry_date,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = stock.filter(m =>
    searchQuery === '' ||
    m.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.brand_name && m.brand_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-blue-600" />
            Gestion avancee de l'inventaire
          </h1>
          <p className="text-gray-500 mt-1">Gerer les medicaments et le stock</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun medicament trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Medicament</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Dosage</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{med.brand_name || med.generic_name}</div>
                      {med.brand_name && <div className="text-xs text-gray-500">{med.generic_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{med.strength}</td>
                    <td className="px-4 py-3 text-center font-medium">{med.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      {med.quantity === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" /> Rupture
                        </span>
                      ) : med.quantity < 10 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          Bas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddMedicationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchStock();
          }}
        />
      )}
    </div>
  );
}
