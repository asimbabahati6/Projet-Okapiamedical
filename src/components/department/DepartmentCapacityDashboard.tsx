import { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  departmentCapacityService,
  DepartmentCapacity,
  CapacityAlert,
} from '../../services/departmentCapacityService';

export function DepartmentCapacityDashboard() {
  const [capacities, setCapacities] = useState<DepartmentCapacity[]>([]);
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    loadCapacityData();
    const interval = setInterval(loadCapacityData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadCapacityData = async () => {
    setLoading(true);
    try {
      const [allCapacities, allAlerts] = await Promise.all([
        departmentCapacityService.getAllDepartmentCapacities(),
        departmentCapacityService.getCapacityAlerts(),
      ]);
      setCapacities(allCapacities);
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error loading capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'unavailable':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-5 w-5" />;
      case 'moderate':
        return <Activity className="h-5 w-5" />;
      case 'high':
        return <TrendingUp className="h-5 w-5" />;
      case 'unavailable':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'moderate':
        return 'Charge modérée';
      case 'high':
        return 'Charge élevée';
      case 'unavailable':
        return 'Pleine capacité';
      default:
        return 'Inconnu';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const totalPatients = capacities.reduce((sum, d) => sum + d.currentPatientsToday, 0);
  const avgCapacity =
    capacities.length > 0
      ? Math.round(
          capacities.reduce((sum, d) => sum + d.capacityPercentage, 0) / capacities.length
        )
      : 0;
  const departmentsAtCapacity = capacities.filter((d) => d.capacityStatus === 'unavailable').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalPatients}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Capacité moyenne</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{avgCapacity}%</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Services actifs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{capacities.length}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">À pleine capacité</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{departmentsAtCapacity}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alertes de capacité</h3>
            <span className="text-sm text-gray-500">{alerts.length} alerte(s)</span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.departmentId}
                className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{alert.departmentName}</p>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{alert.currentPercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Capacité par service
        </h3>
        <div className="space-y-4">
          {capacities.map((capacity) => (
            <div
              key={capacity.departmentId}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedDepartment === capacity.departmentId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDepartment(capacity.departmentId)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(capacity.capacityStatus)}`}>
                    {getStatusIcon(capacity.capacityStatus)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{capacity.departmentName}</h4>
                    <p className="text-sm text-gray-600">
                      {getStatusLabel(capacity.capacityStatus)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {capacity.capacityPercentage}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {capacity.currentPatientsToday} / {capacity.maxPatientsPerDay}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-xs font-semibold text-gray-600">Capacité</div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${Math.min(capacity.capacityPercentage, 100)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      capacity.capacityPercentage >= 90
                        ? 'bg-red-500'
                        : capacity.capacityPercentage >= 70
                        ? 'bg-orange-500'
                        : capacity.capacityPercentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  />
                </div>
              </div>

              {/* Additional details */}
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Médecins disponibles</p>
                  <p className="font-semibold text-gray-900">{capacity.availableDoctors}</p>
                </div>
                <div>
                  <p className="text-gray-600">RDV en attente</p>
                  <p className="font-semibold text-gray-900">{capacity.pendingAppointments}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-600">Horaires</p>
                    <p className="font-semibold text-gray-900">
                      {capacity.businessHours.start} - {capacity.businessHours.end}
                    </p>
                  </div>
                </div>
              </div>

              {/* Open/Closed status */}
              <div className="mt-3">
                {capacity.isOpenNow ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Ouvert maintenant
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    Fermé
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh indicator */}
      <div className="text-center text-sm text-gray-500">
        <p>Les données sont actualisées automatiquement chaque minute</p>
      </div>
    </div>
  );
}
