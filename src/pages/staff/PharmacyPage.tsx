import { useState, useEffect } from 'react';
import { Pill, Search, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PharmacyItem {
  id: string;
  generic_name: string;
  brand_name: string | null;
  strength: string;
  quantity: number;
  status: string;
}

export function PharmacyPage() {
  const [medications, setMedications] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMedications();
  }, []);

  async function fetchMedications() {
    try {
      const { data } = await supabase
        .from('pharmacy_stock')
        .select(`
          id,
          quantity,
          medication:medications(id, generic_name, brand_name, strength)
        `)
        .order('quantity', { ascending: true })
        .limit(50);

      if (data) {
        setMedications(data.map((item: any) => ({
          id: item.id,
          generic_name: item.medication?.generic_name || '',
          brand_name: item.medication?.brand_name || null,
          strength: item.medication?.strength || '',
          quantity: item.quantity || 0,
          status: item.quantity === 0 ? 'rupture' : item.quantity < 10 ? 'bas' : 'ok',
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = medications.filter(m =>
    searchQuery === '' ||
    m.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.brand_name && m.brand_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const outOfStock = medications.filter(m => m.status === 'rupture').length;
  const lowStock = medications.filter(m => m.status === 'bas').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Pill className="w-7 h-7 text-blue-600" />
          Pharmacie
        </h1>
        <p className="text-gray-500 mt-1">Gestion du stock pharmaceutique</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total produits</p>
              <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock bas</p>
              <p className="text-2xl font-bold text-gray-900">{lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rupture</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStock}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un medicament..."
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
                      {med.status === 'ok' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> OK
                        </span>
                      )}
                      {med.status === 'bas' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3" /> Bas
                        </span>
                      )}
                      {med.status === 'rupture' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" /> Rupture
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
    </div>
  );
}
