import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, AlertTriangle, TrendingUp, Pill } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export function PharmacyDashboard() {
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, dispensedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { count: total } = await supabase
        .from('pharmacy_stock')
        .select('*', { count: 'exact', head: true });

      setStats({
        total: total || 0,
        lowStock: 0,
        outOfStock: 0,
        dispensedToday: 0,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <LayoutDashboard className="w-7 h-7 text-blue-600" />
          Tableau de bord Pharmacie
        </h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de l'activite pharmaceutique</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Produits en stock</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.total}</p>
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
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ruptures</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.outOfStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dispenses aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.dispensedToday}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Activite recente</h2>
        <div className="text-center py-8 text-gray-400">
          <Pill className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Les dispensations recentes apparaitront ici</p>
        </div>
      </div>
    </div>
  );
}
