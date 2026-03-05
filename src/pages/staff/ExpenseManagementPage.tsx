import { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import AddExpenseModal from '../../components/expenses/AddExpenseModal';
import ExpenseDetailsModal from '../../components/expenses/ExpenseDetailsModal';

interface Expense {
  id: string;
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  vendor?: string;
  receipt_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  created_by_user?: {
    full_name: string;
  };
}

interface ExpenseStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  byCategory: Record<string, number>;
  trend: number;
}

const EXPENSE_CATEGORIES = [
  { value: 'utilities', label: 'Services Publics', icon: '⚡' },
  { value: 'rent', label: 'Loyer', icon: '🏢' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'supplies', label: 'Fournitures', icon: '📦' },
  { value: 'salaries', label: 'Salaires', icon: '💰' },
  { value: 'equipment', label: 'Équipement', icon: '🖥️' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'insurance', label: 'Assurances', icon: '🛡️' },
  { value: 'transportation', label: 'Transport', icon: '🚗' },
  { value: 'other', label: 'Autres', icon: '📋' },
];

export default function ExpenseManagementPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    byCategory: {},
    trend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('month');
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, categoryFilter, dateFilter]);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          created_by_user:user_profiles!expenses_created_by_fkey(full_name)
        `)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      showError('Erreur lors du chargement des dépenses');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(expenseList: Expense[]) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = expenseList.filter(
      (e) => new Date(e.expense_date) >= thisMonth
    );
    const lastMonthExpenses = expenseList.filter(
      (e) =>
        new Date(e.expense_date) >= lastMonth &&
        new Date(e.expense_date) <= lastMonthEnd
    );

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const byCategory: Record<string, number> = {};
    thisMonthExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    const trend = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    setStats({
      total: expenseList.reduce((sum, e) => sum + e.amount, 0),
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      byCategory,
      trend,
    });
  }

  function applyFilters() {
    let filtered = [...expenses];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const today = now.toISOString().split('T')[0];
      filtered = filtered.filter((e) => e.expense_date === today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((e) => new Date(e.expense_date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter((e) => new Date(e.expense_date) >= monthStart);
    }

    setFilteredExpenses(filtered);
  }

  function handleAddSuccess() {
    setShowAddModal(false);
    fetchExpenses();
    success('Dépense enregistrée avec succès');
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function getCategoryInfo(category: string) {
    return EXPENSE_CATEGORIES.find((c) => c.value === category) || EXPENSE_CATEGORIES[9];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Dépenses</h1>
              <p className="text-gray-600 mt-1">
                Suivi et analyse des dépenses opérationnelles
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Dépense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Dépenses ce Mois</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.thisMonth)}
          </p>
          <div className="mt-2 flex items-center text-sm">
            {stats.trend >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-600">+{stats.trend.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">{stats.trend.toFixed(1)}%</span>
              </>
            )}
            <span className="text-gray-500 ml-1">vs mois dernier</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Mois Dernier</span>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.lastMonth)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {expenses.filter((e) => {
              const date = new Date(e.expense_date);
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              return date.getMonth() === lastMonth.getMonth();
            }).length}{' '}
            transactions
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Général</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.total)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {expenses.length} transactions au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtres:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Toutes les catégories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois</option>
            <option value="all">Toutes les dates</option>
          </select>

          <button className="ml-auto flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucune dépense trouvée
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const catInfo = getCategoryInfo(expense.category);
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {catInfo.icon} {catInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                        Détails →
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          categories={EXPENSE_CATEGORIES}
        />
      )}

      {selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onUpdate={fetchExpenses}
          categories={EXPENSE_CATEGORIES}
        />
      )}
    </div>
  );
}
