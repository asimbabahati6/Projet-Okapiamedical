import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, AlertTriangle, TrendingUp, Pill,
  ArrowDownRight, ArrowUpRight, Clock, DollarSign, Activity
} from 'lucide-react';
import { getPharmacyStats, getRecentMovements, getLowStockMedications } from '../../../services/pharmacyService';
import type { PharmacyMedication, StockMovement } from '../../../types/pharmacy';

export function PharmacyDashboard() {
  const [stats, setStats] = useState({
    total_medications: 0, low_stock_count: 0, out_of_stock_count: 0,
    expiring_soon_count: 0, total_stock_value: 0, dispensed_today: 0, total_categories: 0
  });
  const [recentMovements, setRecentMovements] = useState<(StockMovement & { medication_name?: string })[]>([]);
  const [lowStockItems, setLowStockItems] = useState<PharmacyMedication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [statsData, movements, lowStock] = await Promise.all([
        getPharmacyStats(),
        getRecentMovements(10),
        getLowStockMedications()
      ]);
      setStats(statsData);
      setRecentMovements(movements);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  const movementTypeLabels: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
    reception: { label: 'Réception', color: 'text-green-600 bg-green-50', icon: ArrowUpRight },
    dispensation: { label: 'Dispensation', color: 'text-blue-600 bg-blue-50', icon: ArrowDownRight },
    adjustment: { label: 'Ajustement', color: 'text-gray-600 bg-gray-50', icon: Activity },
    loss: { label: 'Perte', color: 'text-red-600 bg-red-50', icon: ArrowDownRight },
    expiry: { label: 'Périmé', color: 'text-orange-600 bg-orange-50', icon: Clock },
    return: { label: 'Retour', color: 'text-teal-600 bg-teal-50', icon: ArrowUpRight },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <LayoutDashboard className="w-7 h-7 text-teal-600" />
          Tableau de bord Pharmacie
        </h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de l'activité pharmaceutique</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Produits en stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.total_medications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Stock bas</p>
              <p className="text-xl font-bold text-amber-600">{stats.low_stock_count}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Ruptures</p>
              <p className="text-xl font-bold text-red-600">{stats.out_of_stock_count}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Valeur totale</p>
              <p className="text-xl font-bold text-gray-900">${stats.total_stock_value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Activité récente</h2>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {recentMovements.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Pill className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun mouvement récent</p>
              </div>
            ) : (
              recentMovements.slice(0, 8).map((mov) => {
                const typeInfo = movementTypeLabels[mov.movement_type] || movementTypeLabels.adjustment;
                const Icon = typeInfo.icon;
                return (
                  <div key={mov.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{mov.medication_name}</p>
                      <p className="text-xs text-gray-500">{typeInfo.label} - {mov.quantity} unités</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(mov.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Alertes stock</h2>
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {lowStockItems.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Tous les stocks sont normaux</p>
              </div>
            ) : (
              lowStockItems.slice(0, 8).map((med) => (
                <div key={med.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    med.current_stock === 0 ? 'bg-red-50' : 'bg-amber-50'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      med.current_stock === 0 ? 'text-red-500' : 'text-amber-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{med.name}</p>
                    <p className="text-xs text-gray-500">{med.category} - {med.dosage}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      med.current_stock === 0 ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {med.current_stock}
                    </span>
                    <p className="text-xs text-gray-400">/ {med.minimum_stock} min</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
