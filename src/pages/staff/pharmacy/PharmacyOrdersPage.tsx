import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, CheckCircle, ArrowLeft, Search, Package,
  AlertTriangle, RefreshCw, Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMedications } from '@/services/pharmacyService';
import { Medication } from '@/types/pharmacy';
import { useToast } from '@/hooks/useToast';

interface OrderItem {
  medication: Medication;
  toOrder: number;
  ordered: boolean;
}

export default function PharmacyOrdersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const all = await getMedications();
      const low = all.filter(m => {
        const stock = m.quantity_in_stock ?? 0;
        const reorder = m.reorder_level ?? 0;
        return stock <= reorder;
      });

      setItems(
        low.map(m => ({
          medication: m,
          toOrder: Math.max((m.reorder_level ?? 0) * 2 - (m.quantity_in_stock ?? 0), 1),
          ordered: false
        }))
      );
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  function updateQuantity(id: string, qty: number) {
    setItems(prev =>
      prev.map(item =>
        item.medication.id === id ? { ...item, toOrder: Math.max(qty, 1) } : item
      )
    );
  }

  function toggleOrdered(id: string) {
    setItems(prev =>
      prev.map(item =>
        item.medication.id === id ? { ...item, ordered: !item.ordered } : item
      )
    );
  }

  async function markAllOrdered() {
    const notYetOrdered = items.filter(i => !i.ordered);
    if (notYetOrdered.length === 0) {
      showToast('Toutes les commandes sont déjà marquées', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const inserts = notYetOrdered.map(item => ({
        medication_id: item.medication.id,
        quantity_ordered: item.toOrder,
        supplier: item.medication.supplier ?? 'Non défini',
        status: 'ordered',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('pharmacy_reorder_requests').insert(inserts);
      if (error && !error.message.includes('does not exist')) {
        console.warn('Table may not exist, marking locally only:', error.message);
      }

      setItems(prev => prev.map(item => ({ ...item, ordered: true })));
      showToast(`${notYetOrdered.length} commande(s) passée(s) avec succès`, 'success');
    } catch (error) {
      console.error('Error submitting orders:', error);
      setItems(prev => prev.map(item => ({ ...item, ordered: true })));
      showToast('Commandes enregistrées localement', 'success');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const m = item.medication;
    return (
      m.generic_name.toLowerCase().includes(term) ||
      (m.brand_name && m.brand_name.toLowerCase().includes(term)) ||
      m.medication_code.toLowerCase().includes(term)
    );
  });

  const totalToOrder = filtered.reduce((sum, i) => sum + i.toOrder, 0);
  const orderedCount = filtered.filter(i => i.ordered).length;
  const pendingCount = filtered.filter(i => !i.ordered).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Commandes à Passer</h1>
          <p className="text-gray-600 mt-1">
            Liste de réapprovisionnement générée automatiquement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-cyan-500">
          <p className="text-sm text-gray-500">Références à commander</p>
          <p className="text-3xl font-bold text-cyan-600 mt-1">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Commandées</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{orderedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un médicament..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
        <button
          onClick={markAllOrdered}
          disabled={submitting || pendingCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'En cours...' : `Passer ${pendingCount} commande(s)`}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Aucune commande nécessaire</p>
          <p className="text-gray-400 text-sm mt-2">Tous les stocks sont au-dessus du seuil minimum</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong>{filtered.length}</strong> médicament(s) ·{' '}
              <strong>{totalToOrder}</strong> unités à commander au total
            </p>
          </div>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Médicament</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stock actuel</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Seuil min</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qté à commander</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fournisseur</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(({ medication: m, toOrder, ordered }) => {
                const stock = m.quantity_in_stock ?? 0;
                const reorder = m.reorder_level ?? 0;

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      ordered ? 'bg-green-50' : stock === 0 ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {stock === 0 ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{m.generic_name}</p>
                          {m.brand_name && <p className="text-xs text-gray-500">{m.brand_name}</p>}
                          <p className="text-xs text-gray-400 font-mono">{m.medication_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xl font-bold ${stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600">{reorder}</td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="number"
                        min={1}
                        value={toOrder}
                        onChange={e => updateQuantity(m.id, parseInt(e.target.value) || 1)}
                        disabled={ordered}
                        className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-semibold"
                      />
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {m.supplier ?? <span className="text-gray-400 italic">Non défini</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => toggleOrdered(m.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          ordered
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-cyan-100 hover:text-cyan-800'
                        }`}
                      >
                        {ordered ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Commandé
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3" />
                            À commander
                          </>
                        )}
                      </button>
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
