import { useEffect, useState } from 'react';
import { Activity, FileText, CheckCircle, Clock, AlertCircle, ListChecks, PlusCircle, Eye } from 'lucide-react';
import { useRadiologyPermissions } from '../../../hooks/useRadiologyPermissions';
import { supabase } from '../../../lib/supabase';
import { FullAccessBadge, ReadOnlyBadge } from '../../../components/common/PermissionBadges';

interface DashboardStats {
  pending: number;
  inProgress: number;
  completed: number;
  validated: number;
  urgent: number;
}

export default function RadiologyDashboard() {
  const permissions = useRadiologyPermissions();
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    inProgress: 0,
    completed: 0,
    validated: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('radiology_exams')
        .select('status, urgency_level', { count: 'exact' });

      if (error) throw error;

      if (data) {
        const newStats: DashboardStats = {
          pending: data.filter(e => e.status === 'prescribed').length,
          inProgress: data.filter(e => e.status === 'in_progress').length,
          completed: data.filter(e => e.status === 'completed').length,
          validated: data.filter(e => e.status === 'validated').length,
          urgent: data.filter(e => e.urgency_level === 'urgent').length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'En attente',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'En cours',
      value: stats.inProgress,
      icon: Activity,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Terminés',
      value: stats.completed,
      icon: FileText,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Validés',
      value: stats.validated,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Urgents',
      value: stats.urgent,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Radiologie</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble de l'activité radiologique</p>
          </div>
          <div>
            {permissions.hasFullControl ? (
              <FullAccessBadge />
            ) : permissions.canViewAll && !permissions.canPerformExams ? (
              <ReadOnlyBadge />
            ) : null}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          <p className="text-gray-600 mt-4">Chargement des statistiques...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((card) => (
            <div
              key={card.title}
              className={`${card.bgColor} rounded-xl shadow-lg p-6 border-l-4 ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textColor} mt-2`}>
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {permissions.canPerformExams && (
            <a
              href="/staff/radiology/queue"
              className="p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors border-2 border-cyan-200"
            >
              <ListChecks className="w-6 h-6 text-cyan-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Voir la file d'attente</h3>
              <p className="text-sm text-gray-600 mt-1">
                Gérer les examens en attente
              </p>
            </a>
          )}
          {permissions.canPrescribe && (
            <a
              href="/staff/radiology/prescribe"
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200"
            >
              <PlusCircle className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Prescrire un examen</h3>
              <p className="text-sm text-gray-600 mt-1">
                Créer une nouvelle prescription
              </p>
            </a>
          )}
          {permissions.canViewAll && (
            <a
              href="/staff/radiology/viewer"
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-200"
            >
              <Eye className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Visualiser les rapports</h3>
              <p className="text-sm text-gray-600 mt-1">
                Consulter les examens validés
              </p>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
