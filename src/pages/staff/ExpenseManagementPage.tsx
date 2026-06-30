import { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, TrendingUp, TrendingDown, Filter, Download, CheckCircle, RotateCcw, XCircle, Clock, MessageSquare, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { logActivity } from '../../utils/activityLogger';
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
  approval_status: string;
  approval_comment?: string;
  approved_by?: string;
  approved_at?: string;
  justification_documents?: string;
  beneficiaire_type?: string;
  beneficiaire_id?: string;
  beneficiaire_nom?: string;
  created_by: string;
  created_at: string;
  created_by_user?: {
    full_name: string;
  };
  approved_by_user?: {
    full_name: string;
  };
  beneficiaire_user?: {
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
  { value: 'logiciel', label: 'Logiciel', icon: '💻' },
  { value: 'frais_generaux', label: 'Frais generaux', icon: '📊' },
  { value: 'salaires_charges', label: 'Salaires et charges sociales', icon: '💰' },
  { value: 'avance_salaire', label: 'Avance sur salaire', icon: '💵' },
  { value: 'soins_medicaux', label: 'Soins medicaux', icon: '🏥' },
  { value: 'autres_charges_personnel', label: 'Autres charges du Personnel', icon: '👥' },
  { value: 'frais_mission', label: 'Frais de mission', icon: '✈️' },
  { value: 'primes', label: 'Primes', icon: '🏆' },
  { value: 'frais_transport', label: 'Frais de transport', icon: '🚗' },
  { value: 'achat_marchandises', label: 'Achat de Marchandises et Matieres Premieres', icon: '📦' },
  { value: 'import_taxes', label: 'Import et Taxes', icon: '🏛️' },
  { value: 'materiels_bureau', label: 'Materiels de Bureau', icon: '🖊️' },
  { value: 'assurances', label: 'Assurances', icon: '🛡️' },
  { value: 'depenses_informatiques', label: 'Depenses informatiques', icon: '🖥️' },
  { value: 'frais_juridiques', label: 'Frais juridiques et Administratifs', icon: '⚖️' },
  { value: 'dons_rse', label: 'Dons et Responsabilite Societale', icon: '🤝' },
  { value: 'marchandises', label: 'Marchandises', icon: '🏪' },
  { value: 'materiels_fournitures', label: 'Materiels et fournitures Consommees', icon: '🔧' },
  { value: 'energie_courant_carburant', label: 'Energie - Courant - Carburant', icon: '⚡' },
  { value: 'loyer', label: 'Loyer', icon: '🏢' },
  { value: 'autres_services', label: 'Autres services Consommes', icon: '📋' },
  { value: 'communication', label: 'Communication', icon: '📡' },
  { value: 'autres_depenses', label: 'Autres Depenses', icon: '📝' },
  { value: 'utilities', label: 'Services Publics', icon: '⚡' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'supplies', label: 'Fournitures', icon: '📦' },
  { value: 'equipment', label: 'Equipement', icon: '🖥️' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
];

const APPROVAL_ROLES = ['admin', 'medical_director', 'directeur_general', 'medecin_chef_staff'];
const CASHIER_ROLES = ['caissiere', 'cashier', 'caissier'];

export default function ExpenseManagementPage() {
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';
  const isApprover = APPROVAL_ROLES.includes(userRole);
  const isCashier = CASHIER_ROLES.includes(userRole);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    byCategory: {},
    trend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('month');
  const [returnComment, setReturnComment] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);

  // Cashier request form state
  const [requestForm, setRequestForm] = useState({
    amount: '',
    description: '',
    category: '',
    justification_documents: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchExpenses();
    if (isApprover) fetchPendingRequests();
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
          created_by_user:user_profiles!expenses_created_by_fkey(full_name),
          approved_by_user:user_profiles!expenses_approved_by_fkey(full_name),
          beneficiaire_user:user_profiles!expenses_beneficiaire_id_fkey(full_name)
        `)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const allExpenses = data || [];
      setExpenses(allExpenses);
      calculateStats(allExpenses.filter(e => e.approval_status === 'approved'));
    } catch (err) {
      console.error('Error fetching expenses:', err);
      showError('Erreur lors du chargement des depenses');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPendingRequests() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          created_by_user:user_profiles!expenses_created_by_fkey(full_name)
        `)
        .eq('approval_status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
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
    let filtered = [...expenses].filter(e => e.approval_status === 'approved');

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

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
    if (isApprover) fetchPendingRequests();
    success('Depense enregistree avec succes');
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestForm.amount || !requestForm.description || !requestForm.category) {
      showError('Veuillez remplir tous les champs requis');
      return;
    }

    setSubmittingRequest(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        amount: parseFloat(requestForm.amount),
        description: requestForm.description,
        category: requestForm.category,
        justification_documents: requestForm.justification_documents || null,
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        approval_status: 'pending_approval',
        created_by: profile?.id,
      });

      if (error) throw error;

      logActivity('create', 'expenses', `Demande creee: ${requestForm.amount} USD`);
      success('Demande de depense soumise pour approbation');
      setRequestForm({ amount: '', description: '', category: '', justification_documents: '' });
      setShowRequestModal(false);
      fetchExpenses();
    } catch (err) {
      console.error('Error submitting request:', err);
      showError('Erreur lors de la soumission de la demande');
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function handleApproval(expenseId: string, action: 'approved' | 'returned' | 'cancelled', comment?: string) {
    setProcessingId(expenseId);
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          approval_status: action,
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
          approval_comment: comment || null,
        })
        .eq('id', expenseId);

      if (error) throw error;

      const expense = pendingRequests.find(r => r.id === expenseId);
      const amount = expense ? `${expense.amount} USD` : expenseId;
      if (action === 'approved') logActivity('approve', 'expenses', `Demande validee: ${amount}`);
      else if (action === 'returned') logActivity('return', 'expenses', `Demande retournee: ${comment || amount}`);
      else if (action === 'cancelled') logActivity('cancel', 'expenses', `Demande annulee: ${amount}`);

      const actionLabels = { approved: 'approuvee', returned: 'retournee pour etude', cancelled: 'annulee' };
      success(`Demande ${actionLabels[action]}`);
      setShowReturnModal(null);
      setReturnComment('');
      fetchPendingRequests();
      fetchExpenses();
    } catch (err) {
      console.error('Error processing approval:', err);
      showError('Erreur lors du traitement de la demande');
    } finally {
      setProcessingId(null);
    }
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

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending_approval':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" />En attente</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" />Approuvee</span>;
      case 'returned':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><RotateCcw className="w-3 h-3" />Retournee</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" />Annulee</span>;
      default:
        return null;
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Depenses</h1>
              <p className="text-gray-600 mt-1">
                Suivi et analyse des depenses operationnelles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isCashier && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Send className="w-5 h-5" />
                Demande de Depense
              </button>
            )}
            {!isCashier && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouvelle Depense
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pending Approval Section (Directors Only) */}
      {isApprover && pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Demandes en Attente d'Approbation
              </h2>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white">
                {pendingRequests.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRequests.map((req) => {
              const catInfo = getCategoryInfo(req.category);
              return (
                <div key={req.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{catInfo.icon}</span>
                        <span className="font-semibold text-gray-900">{req.description}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {catInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Demandee par: <strong className="text-gray-700">{req.created_by_user?.full_name || 'Inconnu'}</strong></span>
                        <span>Le: {new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
                        {req.justification_documents && (
                          <span className="text-blue-600">Justificatifs: {req.justification_documents}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900 mb-3">{formatCurrency(req.amount)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproval(req.id, 'approved')}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Valider
                        </button>
                        <button
                          onClick={() => setShowReturnModal(req.id)}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Retourner
                        </button>
                        <button
                          onClick={() => handleApproval(req.id, 'cancelled')}
                          disabled={processingId === req.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Return comment modal inline */}
                  {showReturnModal === req.id && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm font-semibold text-blue-800 mb-2">Motif du retour pour etude</p>
                      <textarea
                        value={returnComment}
                        onChange={(e) => setReturnComment(e.target.value)}
                        placeholder="Expliquez pourquoi cette demande est retournee..."
                        rows={3}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!returnComment.trim()) {
                              showError('Le commentaire est obligatoire pour retourner une demande');
                              return;
                            }
                            handleApproval(req.id, 'returned', returnComment);
                          }}
                          disabled={processingId === req.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Confirmer le retour
                        </button>
                        <button
                          onClick={() => { setShowReturnModal(null); setReturnComment(''); }}
                          className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cashier: My requests status */}
      {isCashier && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Mes Demandes de Depenses</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {expenses.filter(e => e.created_by === profile?.id).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune demande soumise
              </div>
            ) : (
              expenses.filter(e => e.created_by === profile?.id).map((req) => {
                const catInfo = getCategoryInfo(req.category);
                return (
                  <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{catInfo.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{req.description}</p>
                          <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">{formatCurrency(req.amount)}</span>
                        {getStatusBadge(req.approval_status)}
                      </div>
                    </div>
                    {req.approval_comment && (
                      <div className="mt-2 ml-9 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs text-blue-700 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {req.approval_comment}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Depenses ce Mois</span>
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
              const lastM = new Date();
              lastM.setMonth(lastM.getMonth() - 1);
              return date.getMonth() === lastM.getMonth() && e.approval_status === 'approved';
            }).length}{' '}
            transactions
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total General</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.total)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {expenses.filter(e => e.approval_status === 'approved').length} transactions approuvees
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
            <option value="all">Toutes les categories</option>
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
                  Categorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beneficiaire
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucune depense trouvee
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const catInfo = getCategoryInfo(expense.category);
                  const benefName = expense.beneficiaire_type === 'interne'
                    ? expense.beneficiaire_user?.full_name || '-'
                    : expense.beneficiaire_nom || '-';
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
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {benefName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                        Details
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashier Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Demande de Depense</h2>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Cette demande sera soumise au directeur pour approbation</p>
            </div>
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif / Description *</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  placeholder="Decrivez le motif de cette depense..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
                <select
                  value={requestForm.category}
                  onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                >
                  <option value="">Selectionnez une categorie</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pieces justificatives</label>
                <input
                  type="text"
                  value={requestForm.justification_documents}
                  onChange={(e) => setRequestForm({ ...requestForm, justification_documents: e.target.value })}
                  placeholder="Facture, bon de commande, devis..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {submittingRequest ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Soumettre la Demande
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
