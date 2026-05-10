import { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InventoryItem {
  id: string;
  generic_name: string;
  brand_name: string | null;
  strength: string;
  quantity: number;
  min_quantity: number;
}

export default function PharmacyInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const { data } = await supabase
        .from('pharmacy_stock')
        .select(`
          id, quantity,
          medication:medications(generic_name, brand_name, strength)
        `)
        .order('quantity', { ascending: true });

      if (data) {
        setItems(data.map((d: any) => ({
          id: d.id,
          generic_name: d.medication?.generic_name || '',
          brand_name: d.medication?.brand_name || null,
          strength: d.medication?.strength || '',
          quantity: d.quantity || 0,
          min_quantity: 5,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter(i =>
    search === '' ||
    i.generic_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.brand_name && i.brand_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Inventaire
        </h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Medicament</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Dosage</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.brand_name || item.generic_name}</div>
                      {item.brand_name && <div className="text-xs text-gray-500">{item.generic_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.strength}</td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      {item.quantity === 0 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Rupture</span>
                      ) : item.quantity < item.min_quantity ? (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Bas</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OK</span>
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
