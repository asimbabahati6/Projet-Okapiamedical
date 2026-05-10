import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Plus, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StockMovement {
  id: string;
  item_name: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
}

interface StockMovementsListProps {
  onAddMovement: () => void;
}

export default function StockMovementsList({ onAddMovement }: StockMovementsListProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  async function fetchMovements() {
    try {
      const { data } = await supabase
        .from('stock_movements')
        .select(`
          id,
          movement_type,
          quantity,
          reason,
          created_at,
          inventory_items(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setMovements(data.map((m: any) => ({
          id: m.id,
          item_name: m.inventory_items?.name || 'Article inconnu',
          movement_type: m.movement_type,
          quantity: m.quantity,
          reason: m.reason,
          created_at: m.created_at,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Chargement des mouvements...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Mouvements de stock</h3>
        <button
          onClick={onAddMovement}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau mouvement
        </button>
      </div>

      {movements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>Aucun mouvement enregistre</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {movements.map((movement) => (
            <div key={movement.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {movement.movement_type === 'in' ? (
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">{movement.item_name}</p>
                  <p className="text-xs text-gray-500">{movement.reason || 'Mouvement de stock'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm ${movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(movement.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
