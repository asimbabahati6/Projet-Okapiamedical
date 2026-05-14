import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Filter,
  ChevronDown,
  ChevronRight,
  Beaker,
  FileText,
  DollarSign,
  Timer,
  Droplets,
  TrendingUp,
  Plus,
  Eye,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CreateLabOrderModal } from '../../components/laboratory/CreateLabOrderModal';

interface LabTest {
  id: string;
  test_code: string;
  test_name: string;
  category: string;
  specimen_type: string;
  normal_range: string;
  unit: string;
  price: number;
  turnaround_time: number;
  is_active: boolean;
}

interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  patient_name: string;
  test_name: string;
  test_code: string;
  status: string;
  priority: string;
  created_at: string;
  result_value: string | null;
  is_abnormal: boolean;
}

type TabType = 'orders' | 'catalog';

const CATEGORIES = [
  { key: 'all', label: 'Toutes' },
  { key: 'Hematologie', label: 'Hematologie' },
  { key: 'Biochimie', label: 'Biochimie' },
  { key: 'Immunologie', label: 'Immunologie' },
  { key: 'Bacteriologie', label: 'Bacteriologie' },
  { key: 'Parasitologie', label: 'Parasitologie' },
  { key: 'Hormonologie', label: 'Hormonologie' },
  { key: 'Urologie', label: 'Urologie' },
  { key: 'Serologie', label: 'Serologie' },
];

export function LaboratoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [ordersRes, testsRes] = await Promise.all([
        supabase
          .from('lab_orders')
          .select('*, patients(first_name, last_name), lab_tests(test_name, test_code)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('lab_tests')
          .select('*')
          .eq('is_active', true)
          .order('category, test_name'),
      ]);

      if (ordersRes.data) {
        setOrders(
          ordersRes.data.map((o: Record<string, unknown>) => {
            const patient = o.patients as { first_name: string; last_name: string } | null;
            const test = o.lab_tests as { test_name: string; test_code: string } | null;
            return {
              id: o.id as string,
              order_number: (o.order_number as string) || '',
              patient_id: (o.patient_id as string) || '',
              patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu',
              test_name: test?.test_name || 'Analyse',
              test_code: test?.test_code || '',
              status: (o.status as string) || 'pending',
              priority: (o.priority as string) || 'normal',
              created_at: o.created_at as string,
              result_value: o.result_value as string | null,
              is_abnormal: (o.is_abnormal as boolean) || false,
            };
          })
        );
      }

      if (testsRes.data) {
        setTests(testsRes.data as LabTest[]);
      }
    } catch (error) {
      console.error('Error fetching lab data:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => ({
    pending: orders.filter((o) => ['pending', 'prescribed', 'pending_sample', 'sample_received'].includes(o.status)).length,
    inProgress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => ['completed', 'validated'].includes(o.status)).length,
    urgent: orders.filter((o) => o.priority === 'urgent' || o.priority === 'stat').length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') filtered = filtered.filter((o) => ['pending', 'prescribed', 'pending_sample', 'sample_received'].includes(o.status));
      else if (statusFilter === 'in_progress') filtered = filtered.filter((o) => o.status === 'in_progress');
      else if (statusFilter === 'completed') filtered = filtered.filter((o) => ['completed', 'validated'].includes(o.status));
      else if (statusFilter === 'urgent') filtered = filtered.filter((o) => o.priority === 'urgent' || o.priority === 'stat');
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.patient_name.toLowerCase().includes(term) ||
          o.test_name.toLowerCase().includes(term) ||
          o.order_number.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [orders, statusFilter, searchTerm]);

  const filteredTests = useMemo(() => {
    let filtered = tests;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.test_name.toLowerCase().includes(term) ||
          t.test_code.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [tests, selectedCategory, searchTerm]);

  const groupedTests = useMemo(() => {
    const groups: Record<string, LabTest[]> = {};
    for (const test of filteredTests) {
      if (!groups[test.category]) groups[test.category] = [];
      groups[test.category].push(test);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTests]);

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function expandAll() {
    setExpandedCategories(new Set(groupedTests.map(([cat]) => cat)));
  }

  function getStatusConfig(status: string) {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700' },
      prescribed: { label: 'Prescrit', bg: 'bg-blue-50', text: 'text-blue-700' },
      pending_sample: { label: 'Echantillon attendu', bg: 'bg-orange-50', text: 'text-orange-700' },
      sample_received: { label: 'Echantillon recu', bg: 'bg-cyan-50', text: 'text-cyan-700' },
      in_progress: { label: 'En cours', bg: 'bg-teal-50', text: 'text-teal-700' },
      completed: { label: 'Termine', bg: 'bg-green-50', text: 'text-green-700' },
      validated: { label: 'Valide', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    };
    return config[status] || config.pending;
  }

  function getPriorityConfig(priority: string) {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      normal: { label: 'Normal', bg: 'bg-gray-50', text: 'text-gray-600' },
      urgent: { label: 'Urgent', bg: 'bg-orange-50', text: 'text-orange-700' },
      stat: { label: 'STAT', bg: 'bg-red-50', text: 'text-red-700' },
    };
    return config[priority] || config.normal;
  }

  function formatTurnaround(hours: number) {
    if (hours < 1) return '<1h';
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}j`;
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      Hematologie: 'bg-red-100 text-red-700 border-red-200',
      Biochimie: 'bg-blue-100 text-blue-700 border-blue-200',
      Immunologie: 'bg-amber-100 text-amber-700 border-amber-200',
      Bacteriologie: 'bg-green-100 text-green-700 border-green-200',
      Parasitologie: 'bg-teal-100 text-teal-700 border-teal-200',
      Hormonologie: 'bg-pink-100 text-pink-700 border-pink-200',
      Urologie: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      Serologie: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-teal-600" />
            Laboratoire
          </h1>
          <p className="text-gray-500 mt-1">Gestion des analyses et catalogue</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/laboratory/report-template')}
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
          >
            <ClipboardList className="w-4 h-4" />
            Modele de rapport
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle demande
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'En attente', value: stats.pending, icon: Clock, bgColor: 'bg-amber-100', iconColor: 'text-amber-600', badgeColor: 'bg-amber-100 text-amber-700', filter: 'pending' },
          { label: 'En cours', value: stats.inProgress, icon: Activity, bgColor: 'bg-blue-100', iconColor: 'text-blue-600', badgeColor: 'bg-blue-100 text-blue-700', filter: 'in_progress' },
          { label: 'Terminees', value: stats.completed, icon: CheckCircle, bgColor: 'bg-green-100', iconColor: 'text-green-600', badgeColor: 'bg-green-100 text-green-700', filter: 'completed' },
          { label: 'Urgentes', value: stats.urgent, icon: AlertTriangle, bgColor: 'bg-red-100', iconColor: 'text-red-600', badgeColor: 'bg-red-100 text-red-700', filter: 'urgent' },
        ].map((stat) => {
          const Icon = stat.icon;
          const isActive = statusFilter === stat.filter;
          return (
            <button
              key={stat.label}
              onClick={() => {
                setActiveTab('orders');
                setStatusFilter(isActive ? 'all' : stat.filter);
              }}
              className={`bg-white rounded-xl p-4 border shadow-sm text-left transition-all hover:shadow-md ${
                isActive ? 'border-teal-400 ring-2 ring-teal-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                {stat.value > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                    {stat.value}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'orders'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Demandes d'analyses
          {orders.length > 0 && (
            <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {orders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'catalog'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Beaker className="w-4 h-4" />
          Catalogue des analyses
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {tests.length}
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'orders' ? 'Rechercher par patient, analyse ou numero...' : 'Rechercher une analyse...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          />
        </div>
        {activeTab === 'catalog' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              onClick={expandAll}
              className="px-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-600"
            >
              Tout deployer
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        </div>
      ) : activeTab === 'orders' ? (
        <OrdersTable
          orders={filteredOrders}
          getStatusConfig={getStatusConfig}
          getPriorityConfig={getPriorityConfig}
          onViewReport={(id) => navigate(`/staff/laboratory/report-template/${id}`)}
        />
      ) : (
        <CatalogView
          groupedTests={groupedTests}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          getCategoryColor={getCategoryColor}
          formatTurnaround={formatTurnaround}
          totalTests={filteredTests.length}
        />
      )}

      {showCreateModal && (
        <CreateLabOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function OrdersTable({
  orders,
  getStatusConfig,
  getPriorityConfig,
  onViewReport,
}: {
  orders: LabOrder[];
  getStatusConfig: (s: string) => { label: string; bg: string; text: string };
  getPriorityConfig: (s: string) => { label: string; bg: string; text: string };
  onViewReport: (orderId: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <FlaskConical className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune demande d'analyse</h3>
        <p className="text-gray-400 text-sm">Les demandes d'analyses apparaitront ici lorsqu'elles seront creees.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">N Ordre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analyse</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priorite</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => {
              const statusCfg = getStatusConfig(order.status);
              const priorityCfg = getPriorityConfig(order.priority);
              return (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-700">{order.order_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 text-sm">{order.patient_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{order.test_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityCfg.bg} ${priorityCfg.text}`}>
                      {priorityCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors" title="Voir details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {['completed', 'validated'].includes(order.status) && (
                        <button
                          onClick={() => onViewReport(order.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Voir le rapport"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CatalogView({
  groupedTests,
  expandedCategories,
  toggleCategory,
  getCategoryColor,
  formatTurnaround,
  totalTests,
}: {
  groupedTests: [string, LabTest[]][];
  expandedCategories: Set<string>;
  toggleCategory: (cat: string) => void;
  getCategoryColor: (cat: string) => string;
  formatTurnaround: (h: number) => string;
  totalTests: number;
}) {
  if (groupedTests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Beaker className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune analyse trouvee</h3>
        <p className="text-gray-400 text-sm">Modifiez vos filtres pour voir les analyses disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{totalTests}</span> analyses disponibles dans{' '}
          <span className="font-semibold text-gray-700">{groupedTests.length}</span> categories
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Prix en USD</span>
          <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Delai de rendu</span>
        </div>
      </div>

      {groupedTests.map(([category, categoryTests]) => {
        const isExpanded = expandedCategories.has(category);
        const colorClass = getCategoryColor(category);
        return (
          <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${colorClass}`}>
                  {category}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {categoryTests.length} analyses
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {categoryTests.reduce((sum, t) => sum + t.price, 0)} USD total
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/70">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analyse</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> Prelevement</span>
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Valeurs normales</th>
                      <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                      <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Delai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categoryTests.map((test) => (
                      <tr key={test.id} className="hover:bg-teal-50/30 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {test.test_code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-gray-800">{test.test_name}</span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-gray-300" />
                            {test.specimen_type}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <span className="text-xs text-gray-500">
                            {test.normal_range || '-'}
                            {test.unit && ` (${test.unit})`}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-gray-800">
                            {test.price}
                            <span className="text-xs text-gray-400 font-normal">USD</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <Timer className="w-3 h-3" />
                            {formatTurnaround(test.turnaround_time)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-center gap-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4 text-teal-500" />
          <span>Prix moyen: <span className="font-semibold text-gray-700">{Math.round(groupedTests.reduce((sum, [, catTests]) => sum + catTests.reduce((s, t) => s + t.price, 0), 0) / totalTests)} USD</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Timer className="w-4 h-4 text-teal-500" />
          <span>Delai moyen: <span className="font-semibold text-gray-700">{formatTurnaround(Math.round(groupedTests.reduce((sum, [, catTests]) => sum + catTests.reduce((s, t) => s + t.turnaround_time, 0), 0) / totalTests))}</span></span>
        </div>
      </div>
    </div>
  );
}
