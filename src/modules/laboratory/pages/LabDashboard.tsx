import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLabPermissions } from '../../../hooks/useLabPermissions';
import { ReadOnlyBadge, FullAccessBadge } from '../../../components/common/PermissionBadges';
import { ReadOnlyNotice } from '../../../components/common/AccessMessages';
import {
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface LabStats {
  pending_orders: number;
  in_progress: number;
  completed_today: number;
  urgent_orders: number;
  avg_processing_time: number;
}

interface RecentOrder {
  id: string;
  test_name: string;
  patient_name: string;
  urgency: string;
  status: string;
  created_at: string;
}

export const LabDashboard: React.FC = () => {
  const permissions = useLabPermissions();
  const [stats, setStats] = useState<LabStats>({
    pending_orders: 0,
    in_progress: 0,
    completed_today: 0,
    urgent_orders: 0,
    avg_processing_time: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
            .select('id')
            .in('status', ['prescribed', 'pending_sample', 'sample_received']),
          supabase
            .from('lab_orders')
            .select('id')
            .eq('status', 'in_progress'),
          supabase
            .from('lab_orders')
            .select('id')
            .in('status', ['completed', 'validated', 'results_sent'])
            .gte('updated_at', `${today}T00:00:00`),
          supabase
            .from('lab_orders')
            .select('id')
            .in('urgency', ['urgent', 'stat'])
            .not('status', 'in', '(completed,validated,results_sent,viewed)'),
          supabase
            .from('lab_orders')
            .select('id, test_name, status, urgency, created_at, patients(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

      setStats({
        pending_orders: pendingRes.data?.length || 0,
        in_progress: inProgressRes.data?.length || 0,
        completed_today: completedRes.data?.length || 0,
        urgent_orders: urgentRes.data?.length || 0,
        avg_processing_time: 45
      });

      const orders = (recentRes.data || []).map((order: any) => ({
        id: order.id,
        test_name: order.test_name,
        patient_name: `${order.patients?.first_name} ${order.patients?.last_name}`,
        urgency: order.urgency,
        status: order.status,
        created_at: order.created_at
      }));

      setRecentOrders(orders);
    } catch (error) {
      console.error('Error loading lab dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'En attente',
      value: stats.pending_orders,
      icon: Clock,
      color: 'yellow',
      link: '/laboratory/queue?filter=pending'
    },
    {
      title: 'En cours',
      value: stats.in_progress,
      icon: Activity,
      color: 'blue',
      link: '/laboratory/queue?filter=in_progress'
    },
    {
      title: 'Terminées aujourd\'hui',
      value: stats.completed_today,
      icon: CheckCircle,
      color: 'green',
      link: '/laboratory/history'
    },
    {
      title: 'Urgences',
      value: stats.urgent_orders,
      icon: AlertTriangle,
      color: 'red',
      link: '/laboratory/queue?filter=urgent'
    }
  ];

  const getUrgencyBadge = (urgency: string) => {
    const config: Record<string, { label: string; className: string }> = {
      routine: { label: 'Routine', className: 'bg-gray-100 text-gray-800' },
      urgent: { label: 'Urgent', className: 'bg-orange-100 text-orange-800' },
      stat: { label: 'STAT', className: 'bg-red-100 text-red-800' }
    };

    const badge = config[urgency] || config.routine;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      prescribed: { label: 'Prescrit', className: 'bg-blue-100 text-blue-800' },
      pending_sample: { label: 'En attente échantillon', className: 'bg-yellow-100 text-yellow-800' },
      sample_received: { label: 'Échantillon reçu', className: 'bg-cyan-100 text-cyan-800' },
      in_progress: { label: 'En cours', className: 'bg-teal-100 text-teal-800' },
      completed: { label: 'Terminé', className: 'bg-green-100 text-green-800' },
      validated: { label: 'Validé', className: 'bg-green-100 text-green-800' }
    };

    const badge = config[status] || config.prescribed;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Laboratoire</h1>
        <div>
          {permissions.hasFullAccess ? (
            <FullAccessBadge />
          ) : permissions.isDashboardOnly ? (
            <ReadOnlyBadge />
          ) : null}
        </div>
      </div>

      {permissions.isDashboardOnly && (
        <ReadOnlyNotice message="Vous avez accès en consultation uniquement. Contactez un responsable laboratoire pour effectuer des modifications." />
      )}

      <div>
        <p className="text-gray-600 mt-2">Vue d'ensemble de l'activité du laboratoire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Demandes récentes</h2>
              <Link
                to="/laboratory/queue"
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune demande récente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <FlaskConical className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{order.test_name}</h3>
                        <p className="text-sm text-gray-600">{order.patient_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right space-y-1">
                        {getUrgencyBadge(order.urgency)}
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link
                to="/laboratory/queue"
                className="block w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-center"
              >
                Voir la file d'attente
              </Link>
              <Link
                to="/laboratory/results"
                className="block w-full px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 text-center"
              >
                Saisir résultats
              </Link>
              <Link
                to="/laboratory/equipment"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
              >
                Gérer équipements
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-8 h-8" />
              <h3 className="font-semibold text-lg">Performance</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-teal-100 text-sm">Temps moyen traitement</p>
                <p className="text-2xl font-bold">{stats.avg_processing_time} min</p>
              </div>
              <div className="pt-3 border-t border-teal-500">
                <p className="text-teal-100 text-sm">Analyses ce mois</p>
                <p className="text-2xl font-bold">234</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
