import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, PieChart as PieChartIcon, TrendingUp, Download,
  Package, DollarSign, AlertTriangle, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getCategoryStats, getPharmacyStats, getExpiringMedications } from '../../services/pharmacyService';
import { supabase } from '../../lib/supabase';
import type { PharmacyMedication } from '../../types/pharmacy';

const COLORS = ['#0d9488', '#0891b2', '#2563eb', '#7c3aed', '#db2777',
  '#ea580c', '#65a30d', '#ca8a04', '#dc2626', '#6366f1',
  '#14b8a6', '#f59e0b', '#ef4444'];

export function PharmacyAnalyticsPage() {
  const [categoryData, setCategoryData] = useState<{ category: string; count: number; value: number }[]>([]);
  const [stats, setStats] = useState({
    total_medications: 0, low_stock_count: 0, out_of_stock_count: 0,
    expiring_soon_count: 0, total_stock_value: 0, dispensed_today: 0, total_categories: 0
  });
  const [stockDistribution, setStockDistribution] = useState<{ name: string; value: number }[]>([]);
  const [topMedications, setTopMedications] = useState<{ name: string; stock: number; value: number }[]>([]);
  const [expiringData, setExpiringData] = useState<{ month: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const [catData, statsData, expiring, medsResult] = await Promise.all([
        getCategoryStats(),
        getPharmacyStats(),
        getExpiringMedications(180),
        supabase.from('pharmacy_medications').select('*').eq('is_active', true).order('current_stock', { ascending: false }).limit(10)
      ]);

      setCategoryData(catData.sort((a, b) => b.value - a.value));
      setStats(statsData);

      // Stock distribution for pie chart
      const meds: PharmacyMedication[] = medsResult.data || [];
      const ok = meds.filter(m => m.current_stock >= m.minimum_stock).length;
      const low = meds.filter(m => m.current_stock > 0 && m.current_stock < m.minimum_stock).length;
      const out = meds.filter(m => m.current_stock === 0).length;
      setStockDistribution([
        { name: 'Stock normal', value: ok },
        { name: 'Stock bas', value: low },
        { name: 'Rupture', value: out },
      ]);

      // Top medications by value
      const allMeds: PharmacyMedication[] = medsResult.data || [];
      setTopMedications(
        allMeds
          .map(m => ({ name: m.name, stock: m.current_stock, value: m.current_stock * m.unit_price }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
      );

      // Expiring medications by month
      const monthMap = new Map<string, number>();
      expiring.forEach(m => {
        if (m.expiry_date) {
          const month = new Date(m.expiry_date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          monthMap.set(month, (monthMap.get(month) || 0) + 1);
        }
      });
      setExpiringData(Array.from(monthMap.entries()).map(([month, count]) => ({ month, count })));
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    const headers = ['Catégorie', 'Nombre de produits', 'Valeur ($)'];
    const rows = categoryData.map(c => [c.category, c.count, c.value.toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_pharmacie_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Rapports & Analyses
          </h1>
          <p className="text-gray-500 mt-1">Analyse du stock pharmaceutique</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter le rapport
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total références</p>
              <p className="text-xl font-bold text-gray-900">{stats.total_medications}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Valeur inventaire</p>
              <p className="text-xl font-bold text-gray-900">${stats.total_stock_value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Alertes stock</p>
              <p className="text-xl font-bold text-amber-600">{stats.low_stock_count + stats.out_of_stock_count}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Catégories</p>
              <p className="text-xl font-bold text-gray-900">{stats.total_categories}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            Valeur par catégorie
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.slice(0, 8)} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valeur']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stock Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-600" />
            Distribution du stock
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stockDistribution.map((_, idx) => (
                    <Cell key={idx} fill={['#10b981', '#f59e0b', '#ef4444'][idx]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-gray-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Medications by Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Top produits par valeur
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMedications} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#6b7280' }} width={120} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valeur en stock']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expiring Medications Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            Expirations à venir
          </h3>
          {expiringData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              Aucune expiration dans les 6 prochains mois
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expiringData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Produits expirant']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Category Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Résumé par catégorie</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Catégorie</th>
                <th className="px-5 py-3 text-center font-medium text-gray-600">Nb produits</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">Valeur stock</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">% du total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categoryData.map((cat, idx) => (
                <tr key={cat.category} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-medium text-gray-900">{cat.category}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-700">{cat.count}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    ${cat.value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {stats.total_stock_value > 0 ? ((cat.value / stats.total_stock_value) * 100).toFixed(1) : '0'}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td className="px-5 py-3 font-semibold text-gray-900">Total</td>
                <td className="px-5 py-3 text-center font-semibold text-gray-900">{stats.total_medications}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  ${stats.total_stock_value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
