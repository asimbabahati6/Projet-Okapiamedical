import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Settings,
  Database,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Wrench,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DivisionStats {
  hr: { staff: number; tasks: number };
  finance: { contracts: number; tasks: number };
  operations: { requests: number; tasks: number };
  it: { reports: number; tasks: number };
}

interface Task {
  id: string;
  task_title: string;
  priority: string;
  status: string;
  due_date: string;
  task_type: string;
}

interface MaintenanceRequest {
  id: string;
  location: string;
  priority: string;
  status: string;
  request_type: string;
  created_at: string;
}

interface Contract {
  id: string;
  vendor_name: string;
  end_date: string;
  contract_type: string;
  status: string;
}

export default function AdministrationDashboard() {
  const [stats, setStats] = useState<DivisionStats>({
    hr: { staff: 0, tasks: 0 },
    finance: { contracts: 0, tasks: 0 },
    operations: { requests: 0, tasks: 0 },
    it: { reports: 0, tasks: 0 }
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [urgentMaintenance, setUrgentMaintenance] = useState<MaintenanceRequest[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        adminStaffRes,
        tasksRes,
        contractsRes,
        maintenanceRes,
        reportsRes
      ] = await Promise.all([
        supabase.from('administrative_staff').select('division', { count: 'exact' }),
        supabase.from('administrative_tasks').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('vendor_contracts').select('*').eq('status', 'active'),
        supabase.from('facility_maintenance_requests').select('*').in('status', ['pending', 'assigned']),
        supabase.from('administrative_reports').select('*', { count: 'exact' })
      ]);

      const hrStaff = adminStaffRes.data?.filter(s => s.division === 'hr').length || 0;
      const hrTasks = tasksRes.data?.filter(t => t.task_type === 'hr' && t.status !== 'completed').length || 0;

      const financeContracts = contractsRes.data?.length || 0;
      const financeTasks = tasksRes.data?.filter(t => t.task_type === 'finance' && t.status !== 'completed').length || 0;

      const operationsRequests = maintenanceRes.data?.length || 0;
      const operationsTasks = tasksRes.data?.filter(t => t.task_type === 'operations' && t.status !== 'completed').length || 0;

      const itReports = reportsRes.count || 0;
      const itTasks = tasksRes.data?.filter(t => t.task_type === 'reporting' && t.status !== 'completed').length || 0;

      setStats({
        hr: { staff: hrStaff, tasks: hrTasks },
        finance: { contracts: financeContracts, tasks: financeTasks },
        operations: { requests: operationsRequests, tasks: operationsTasks },
        it: { reports: itReports, tasks: itTasks }
      });

      setRecentTasks(tasksRes.data || []);
      setUrgentMaintenance(maintenanceRes.data?.filter(m => m.priority === 'emergency' || m.priority === 'high').slice(0, 5) || []);

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = contractsRes.data?.filter(c => {
        const endDate = new Date(c.end_date);
        return endDate <= thirtyDaysFromNow && endDate >= today;
      }).slice(0, 5) || [];
      setExpiringContracts(expiring);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'emergency':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Administration</h1>
          <p className="text-gray-600">Vue d'ensemble des opérations administratives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Ressources Humaines</h3>
          <div className="flex items-baseline space-x-3">
            <p className="text-3xl font-bold">{stats.hr.staff}</p>
            <p className="text-sm opacity-80">Personnel</p>
          </div>
          <p className="text-sm mt-2 opacity-80">{stats.hr.tasks} tâches en cours</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Finance</h3>
          <div className="flex items-baseline space-x-3">
            <p className="text-3xl font-bold">{stats.finance.contracts}</p>
            <p className="text-sm opacity-80">Contrats</p>
          </div>
          <p className="text-sm mt-2 opacity-80">{stats.finance.tasks} tâches en cours</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Settings className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Opérations</h3>
          <div className="flex items-baseline space-x-3">
            <p className="text-3xl font-bold">{stats.operations.requests}</p>
            <p className="text-sm opacity-80">Demandes</p>
          </div>
          <p className="text-sm mt-2 opacity-80">{stats.operations.tasks} tâches en cours</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Database className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5 opacity-60" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Systèmes d'Information</h3>
          <div className="flex items-baseline space-x-3">
            <p className="text-3xl font-bold">{stats.it.reports}</p>
            <p className="text-sm opacity-80">Rapports</p>
          </div>
          <p className="text-sm mt-2 opacity-80">{stats.it.tasks} tâches en cours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-teal-600" />
              Tâches Récentes
            </h2>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune tâche récente</p>
            ) : (
              recentTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.task_title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {task.due_date && (
                    <div className="text-sm text-gray-500 ml-4">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {new Date(task.due_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Maintenance Urgente
            </h2>
          </div>
          <div className="space-y-3">
            {urgentMaintenance.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">Aucune demande urgente</p>
              </div>
            ) : (
              urgentMaintenance.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{request.location}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                      <span className="text-xs text-gray-600">{request.request_type}</span>
                    </div>
                  </div>
                  <Wrench className="h-5 w-5 text-red-600 ml-4" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-teal-600" />
            Contrats Expirant Bientôt
          </h2>
        </div>
        <div className="space-y-3">
          {expiringContracts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">Aucun contrat expirant dans les 30 prochains jours</p>
            </div>
          ) : (
            expiringContracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{contract.vendor_name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600">{contract.contract_type}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-orange-600 font-medium">
                      Expire le {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm">
                  Renouveler
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
