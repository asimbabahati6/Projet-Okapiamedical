import { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, DollarSign, Archive, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InventoryStats } from '../../types/logistics';

interface StocksDashboardProps {
  onNavigate?: (tab: 'inventory' | 'movements' | 'alerts' | 'suppliers') => void;
  onAddItem?: () => void;
  onAddMovement?: () => void;
  onAddSupplier?: () => void;
}

export default function StocksDashboard({
  onNavigate,
  onAddItem,
  onAddMovement,
  onAddSupplier
}: StocksDashboardProps = {}) {
  const [stats, setStats] = useState<InventoryStats>({
    total_items: 0,
    total_value: 0,
    critical_items: 0,
    low_stock_items: 0,
    expired_items: 0,
    active_alerts: 0,
    total_categories: 0,
    total_suppliers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCardClick = (cardTitle: string) => {
    if (!onNavigate) return;

    switch(cardTitle) {
      case 'Total Articles':
      case 'Valeur Stock':
      case 'Articles Expirés':
      case 'Catégories':
        onNavigate('inventory');
        break;
      case 'Articles Critiques':
      case 'Stock Faible':
      case 'Alertes Actives':
        onNavigate('alerts');
        break;
      case 'Fournisseurs Actifs':
        onNavigate('suppliers');
        break;
    }
  };

  async function fetchStats() {
    try {
      const [
        itemsResult,
        categoriesResult,
        suppliersResult,
        alertsResult,
      ] = await Promise.all([
        supabase.from('inventory_items').select('id, current_quantity, min_quantity, status, total_value'),
        supabase.from('inventory_categories').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('logistics_stock_alerts').select('id, severity', { count: 'exact' }).eq('is_active', true).eq('acknowledged', false),
      ]);

      const items = itemsResult.data || [];
      const totalValue = items.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);
      const criticalItems = items.filter(item => item.status === 'critical' || item.status === 'out_of_stock').length;
      const lowStockItems = items.filter(item => item.status === 'low').length;
      const expiredItems = items.filter(item => item.status === 'expired').length;

      setStats({
        total_items: items.length,
        total_value: totalValue,
        critical_items: criticalItems,
        low_stock_items: lowStockItems,
        expired_items: expiredItems,
        active_alerts: alertsResult.count || 0,
        total_categories: categoriesResult.count || 0,
        total_suppliers: suppliersResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Articles',
      value: stats.total_items,
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Valeur Stock',
      value: `${stats.total_value.toLocaleString('fr-FR')} FC`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Articles Critiques',
      value: stats.critical_items,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      alert: stats.critical_items > 0,
    },
    {
      title: 'Stock Faible',
      value: stats.low_stock_items,
      icon: TrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      alert: stats.low_stock_items > 0,
    },
    {
      title: 'Articles Expirés',
      value: stats.expired_items,
      icon: Archive,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Alertes Actives',
      value: stats.active_alerts,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      alert: stats.active_alerts > 0,
    },
    {
      title: 'Catégories',
      value: stats.total_categories,
      icon: Package,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Fournisseurs Actifs',
      value: stats.total_suppliers,
      icon: Users,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vue d'ensemble des Stocks</h2>
        <p className="text-gray-600">Statistiques en temps réel de votre inventaire</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => handleCardClick(card.title)}
              className={`bg-white rounded-lg border ${
                card.alert ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-200'
              } p-6 hover:shadow-lg transition-all cursor-pointer ${
                onNavigate ? 'hover:scale-105' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                {card.alert && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    Attention
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
              <p className={`text-2xl font-bold ${card.alert ? 'text-red-600' : 'text-gray-900'}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Alerts Summary */}
      {(stats.critical_items > 0 || stats.low_stock_items > 0 || stats.expired_items > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Action Requise
              </h3>
              <ul className="space-y-1 text-red-800">
                {stats.critical_items > 0 && (
                  <li>• {stats.critical_items} article{stats.critical_items > 1 ? 's' : ''} en stock critique ou épuisé</li>
                )}
                {stats.low_stock_items > 0 && (
                  <li>• {stats.low_stock_items} article{stats.low_stock_items > 1 ? 's' : ''} avec stock faible</li>
                )}
                {stats.expired_items > 0 && (
                  <li>• {stats.expired_items} article{stats.expired_items > 1 ? 's expiré' : ' expiré'}</li>
                )}
              </ul>
              <p className="text-sm text-red-700 mt-3">
                Consultez l'onglet "Alertes" pour plus de détails et des actions recommandées.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onAddItem}
            disabled={!onAddItem}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Package className="w-5 h-5" />
            Ajouter un Article
          </button>
          <button
            onClick={onAddMovement}
            disabled={!onAddMovement}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="w-5 h-5" />
            Enregistrer Mouvement
          </button>
          <button
            onClick={onAddSupplier}
            disabled={!onAddSupplier}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-5 h-5" />
            Ajouter Fournisseur
          </button>
        </div>
      </div>
    </div>
  );
}
