import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLabPermissions } from '../../hooks/useLabPermissions';
import { useAuth } from '../../contexts/AuthContext';
import { ReadOnlyBadge, FullAccessBadge } from '../../components/common/PermissionBadges';
import { ReadOnlyNotice } from '../../components/common/AccessMessages';
import { AddLabOrderModal } from '../../components/laboratory/AddLabOrderModal';
import { LabResultsEntryModal } from '../../components/laboratory/LabResultsEntryModal';
import { useLabOrderFilters } from '../../hooks/useLabOrderFilters';
import {
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  TestTube,
  FileText,
  UserCheck,
  Plus,
  Info,
  Filter,
  X
} from 'lucide-react';

interface LabStats {
  pending_orders: number;
  in_progress: number;
  completed_today: number;
  urgent_orders: number;
  validated_today: number;
  avg_processing_time: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  patient_name: string;
  priority: string;
  status: string;
  created_at: string;
}

export function LaboratoryPage() {
  const navigate = useNavigate();
  const permissions = useLabPermissions();
  const { profile } = useAuth();
  const {
    isQueueFilterActive,
    showQueue,
    clearFilters
  } = useLabOrderFilters();

  const [stats, setStats] = useState<LabStats>({
    pending_orders: 0,
    in_progress: 0,
    completed_today: 0,
    urgent_orders: 0,
    validated_today: 0,
    avg_processing_time: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showLabTechTooltip, setShowLabTechTooltip] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [pendingRes, inProgressRes, completedRes, urgentRes, recentRes] =
        await Promise.all([
          supabase
            .from('lab_orders')
            .select('id', { count: 'exact' })
            .eq('status', 'pending'),
          supabase
            .from('lab_orders')
            .select('id', { count: 'exact' })
            .eq('status', 'in_progress'),
          supabase
            .from('lab_orders')
            .select('id', { count: 'exact' })
            .eq('status', 'completed')
            .gte('updated_at', `${today}T00:00:00`),
          supabase
            .from('lab_orders')
            .select('id', { count: 'exact' })
            .eq('priority', 'urgent')
            .neq('status', 'completed'),
          supabase
            .from('lab_orders')
            .select('id, order_number, status, priority, created_at, patients(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

      setStats({
        pending_orders: pendingRes.count || 0,
        in_progress: inProgressRes.count || 0,
        completed_today: completedRes.count || 0,
        urgent_orders: urgentRes.count || 0,
        validated_today: 0,
        avg_processing_time: 45
      });

      const orders = (recentRes.data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        patient_name: order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : 'N/A',
        priority: order.priority || 'normal',
        status: order.status,
        created_at: order.created_at
      }));

      setRecentOrders(orders);
      setFilteredOrders(orders);
    } catch (error) {
      console.error('Error loading lab dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer le filtrage des commandes
  useEffect(() => {
    if (isQueueFilterActive) {
      const filtered = recentOrders.filter(
        order => order.status === 'pending' || order.status === 'in_progress'
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(recentOrders);
    }
  }, [isQueueFilterActive, recentOrders]);

  // Gérer l'action "Voir File d'Attente"
  const handleViewQueue = () => {
    showQueue();
  };

  // Gérer l'action "Saisir Résultats"
  const handleEnterResults = async () => {
    try {
      // Récupérer le premier ordre en attente
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false }) // Urgents en premier
        .order('created_at', { ascending: true }) // Plus anciens en premier
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedOrder(data);
        setShowResultsModal(true);
      } else {
        alert('Aucune analyse en attente de résultats');
      }
    } catch (error: any) {
      console.error('Error fetching order for results entry:', error);
      if (error.code !== 'PGRST116') { // Pas d'erreur si aucun résultat
        alert('Erreur lors de la récupération de l\'analyse');
      }
    }
  };

  // Vérifier les permissions RBAC pour la saisie de résultats
  const canEnterResults = () => {
    const userRole = profile?.role?.name;
    return userRole === 'lab_supervisor' ||
           userRole === 'lab_technician' ||
           userRole === 'super_admin';
  };

  const statCards = [
    {
      title: 'Analyses en Attente',
      value: stats.pending_orders,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500'
    },
    {
      title: 'En Cours d\'Analyse',
      value: stats.in_progress,
      icon: FlaskConical,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      title: 'Terminées Aujourd\'hui',
      value: stats.completed_today,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-600',
      borderColor: 'border-green-500'
    },
    {
      title: 'Validées Aujourd\'hui',
      value: stats.validated_today,
      icon: UserCheck,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-500'
    },
    {
      title: 'Cas Urgents',
      value: stats.urgent_orders,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-600',
      borderColor: 'border-red-500'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      normal: { label: 'Normal', className: 'bg-gray-100 text-gray-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' }
    };

    const badge = config[priority] || config.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminé', className: 'bg-green-100 text-green-800' }
    };

    const badge = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Determine user role for RBAC
  const userRole = profile?.role?.name;
  const canCreateOrders = permissions.canCreateOrders;
  const isLabTech = userRole === 'lab_technician';

  // Handle button click based on permissions
  const handleNewAnalysisClick = () => {
    if (canCreateOrders) {
      setShowAddModal(true);
    } else if (isLabTech) {
      setShowLabTechTooltip(true);
      setTimeout(() => setShowLabTechTooltip(false), 3000);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Laboratoire</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble de l'activité du laboratoire</p>
          </div>
          <div className="flex items-center gap-3">
            {permissions.hasFullAccess ? (
              <FullAccessBadge />
            ) : permissions.isDashboardOnly ? (
              <ReadOnlyBadge />
            ) : null}

            {/* New Analysis Button with RBAC */}
            <div className="relative">
              <button
                onClick={handleNewAnalysisClick}
                disabled={!canCreateOrders && !isLabTech}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  canCreateOrders
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                    : isLabTech
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={
                  canCreateOrders
                    ? 'Créer une nouvelle demande d\'analyse'
                    : isLabTech
                    ? 'Cliquer pour plus d\'informations'
                    : 'Accès limité'
                }
              >
                <Plus className="w-5 h-5" />
                Nouvelle Analyse
              </button>

              {/* Lab Technician Tooltip */}
              {showLabTechTooltip && isLabTech && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-blue-900 text-white p-4 rounded-lg shadow-2xl z-50">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Information</p>
                      <p className="text-sm text-blue-100">
                        Votre rôle vous permet de traiter les analyses reçues. Seuls les médecins peuvent créer de nouvelles demandes.
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-0 right-4 -mt-2 w-4 h-4 bg-blue-900 transform rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Lab Order Modal */}
      {showAddModal && (
        <AddLabOrderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadDashboardData();
          }}
          currentUserRole={userRole}
        />
      )}

      {permissions.isDashboardOnly && (
        <div className="mb-6">
          <ReadOnlyNotice message="Vous avez accès en consultation uniquement. Contactez un responsable laboratoire pour effectuer des modifications." />
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card) => {
          const isHighlighted = isQueueFilterActive &&
            (card.title === 'Analyses en Attente' || card.title === 'En Cours d\'Analyse');

          return (
            <div
              key={card.title}
              className={`${card.bgColor} rounded-xl shadow-lg p-6 border-l-4 ${card.borderColor} transition-all ${
                isHighlighted
                  ? 'ring-4 ring-green-300 shadow-2xl scale-105'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                    {isHighlighted && (
                      <Filter className="w-3 h-3 inline ml-1 text-green-600 animate-pulse" />
                    )}
                  </p>
                  <p className={`text-3xl font-bold ${card.textColor} mt-2`}>
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.iconBg} ${isHighlighted ? 'ring-2 ring-green-400' : ''}`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Banner for Urgent Cases */}
      {stats.urgent_orders > 0 && (
        <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">
                Attention: {stats.urgent_orders} analyse(s) urgente(s) en attente
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Ces analyses nécessitent un traitement prioritaire.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Demandes Récentes
                {isQueueFilterActive && (
                  <span className="ml-2 text-sm font-normal text-green-600">
                    (File d'attente active)
                  </span>
                )}
              </h2>
              {isQueueFilterActive && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Effacer filtre
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isQueueFilterActive
                    ? 'Aucune analyse en attente'
                    : 'Aucune demande récente'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FlaskConical className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{order.order_number}</h3>
                        <p className="text-sm text-gray-600">{order.patient_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right space-y-1">
                        {getPriorityBadge(order.priority)}
                        <div>{getStatusBadge(order.status)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar with Quick Actions and Performance */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="space-y-3">
              <button
                onClick={handleViewQueue}
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg transition-all font-medium ${
                  isQueueFilterActive
                    ? 'bg-green-700 text-white ring-2 ring-green-300 shadow-lg'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isQueueFilterActive && <Filter className="w-4 h-4" />}
                <TestTube className="w-4 h-4" />
                Voir File d'Attente
              </button>

              {canEnterResults() && (
                <button
                  onClick={handleEnterResults}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Saisir Résultats
                </button>
              )}

              <Link
                to="/laboratory/equipment"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Activity className="w-4 h-4" />
                Gérer Équipements
              </Link>
            </div>
          </div>

          {/* Performance Widget */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-8 h-8" />
              <h3 className="font-semibold text-lg">Performance du Lab</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-green-100 text-sm">Temps moyen traitement</p>
                <p className="text-3xl font-bold">{stats.avg_processing_time} min</p>
              </div>
              <div className="pt-3 border-t border-green-500">
                <p className="text-green-100 text-sm">Analyses ce mois</p>
                <p className="text-3xl font-bold">234</p>
              </div>
              <div className="pt-3 border-t border-green-500">
                <p className="text-green-100 text-sm">Taux de validation</p>
                <p className="text-3xl font-bold">96%</p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-start gap-3">
              <FlaskConical className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">À propos du Laboratoire</h3>
                <p className="text-xs text-gray-700 mb-2">
                  Le laboratoire gère l'ensemble des analyses médicales avec traçabilité complète.
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Gestion des prélèvements
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Saisie et validation résultats
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Traçabilité complète
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddLabOrderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadDashboardData();
          }}
        />
      )}

      {showResultsModal && selectedOrder && (
        <LabResultsEntryModal
          order={selectedOrder}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedOrder(null);
          }}
          onSave={() => {
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
