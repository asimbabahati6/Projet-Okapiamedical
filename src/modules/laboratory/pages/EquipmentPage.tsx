import React, { useState } from 'react';
import { Package, CheckCircle, AlertTriangle, Wrench, Calendar, Activity } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'operational' | 'maintenance' | 'broken';
  last_maintenance: string;
  next_maintenance: string;
  usage_hours: number;
}

const mockEquipment: Equipment[] = [
  {
    id: 'eq1',
    name: 'Automate d\'hématologie',
    type: 'Analyseur automatique',
    status: 'operational',
    last_maintenance: '2026-01-15',
    next_maintenance: '2026-04-15',
    usage_hours: 1250
  },
  {
    id: 'eq2',
    name: 'Centrifugeuse haute vitesse',
    type: 'Centrifugation',
    status: 'operational',
    last_maintenance: '2026-02-01',
    next_maintenance: '2026-05-01',
    usage_hours: 850
  },
  {
    id: 'eq3',
    name: 'Analyseur de biochimie',
    type: 'Analyseur automatique',
    status: 'maintenance',
    last_maintenance: '2026-02-20',
    next_maintenance: '2026-02-28',
    usage_hours: 2100
  },
  {
    id: 'eq4',
    name: 'Microscope optique (Zeiss)',
    type: 'Microscopie',
    status: 'operational',
    last_maintenance: '2025-12-10',
    next_maintenance: '2026-03-10',
    usage_hours: 3200
  },
  {
    id: 'eq5',
    name: 'Spectrophotomètre UV-Vis',
    type: 'Spectroscopie',
    status: 'operational',
    last_maintenance: '2026-01-20',
    next_maintenance: '2026-04-20',
    usage_hours: 980
  },
  {
    id: 'eq6',
    name: 'Réfrigérateur 4°C',
    type: 'Conservation',
    status: 'operational',
    last_maintenance: '2026-02-10',
    next_maintenance: '2026-08-10',
    usage_hours: 4380
  },
  {
    id: 'eq7',
    name: 'Incubateur bactériologique',
    type: 'Microbiologie',
    status: 'operational',
    last_maintenance: '2026-01-25',
    next_maintenance: '2026-04-25',
    usage_hours: 1560
  },
  {
    id: 'eq8',
    name: 'Agitateur magnétique',
    type: 'Préparation',
    status: 'broken',
    last_maintenance: '2025-11-30',
    next_maintenance: '2026-03-01',
    usage_hours: 1890
  }
];

export const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
  const [reportingIssue, setReportingIssue] = useState<string | null>(null);

  const handleReportIssue = (equipmentId: string, equipmentName: string) => {
    setReportingIssue(equipmentId);

    setTimeout(() => {
      setEquipment(items =>
        items.map(item =>
          item.id === equipmentId ? { ...item, status: 'maintenance' as const } : item
        )
      );
      alert(`Panne signalée pour ${equipmentName}. L'équipe de maintenance a été notifiée.`);
      setReportingIssue(null);
    }, 1000);
  };

  const operationalCount = equipment.filter(eq => eq.status === 'operational').length;
  const maintenanceCount = equipment.filter(eq => eq.status === 'maintenance').length;
  const brokenCount = equipment.filter(eq => eq.status === 'broken').length;

  const getStatusConfig = (status: Equipment['status']) => {
    switch (status) {
      case 'operational':
        return {
          label: 'Opérationnel',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'maintenance':
        return {
          label: 'En maintenance',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: Wrench,
          iconColor: 'text-yellow-600'
        };
      case 'broken':
        return {
          label: 'Hors service',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Équipements</h1>
        <p className="text-gray-600 mt-2">Gérez les équipements du laboratoire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-700 font-medium">Opérationnels</p>
              <p className="text-2xl font-bold text-green-900">{operationalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">En maintenance</p>
              <p className="text-2xl font-bold text-yellow-900">{maintenanceCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-700 font-medium">Hors service</p>
              <p className="text-2xl font-bold text-red-900">{brokenCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((eq) => {
          const statusConfig = getStatusConfig(eq.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={eq.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className={`${statusConfig.bgColor} px-4 py-3 border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className={`w-5 h-5 ${statusConfig.iconColor}`} />
                    <h3 className="font-semibold text-gray-900">{eq.name}</h3>
                  </div>
                  <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span>{eq.type}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Statut:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Heures d'utilisation:</span>
                    <span className="font-medium text-gray-900">{eq.usage_hours}h</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-600">Dernière maintenance</p>
                      <p className="font-medium text-gray-900">
                        {new Date(eq.last_maintenance).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-600">Prochain entretien</p>
                      <p className="font-medium text-gray-900">
                        {new Date(eq.next_maintenance).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {eq.status === 'operational' && (
                  <button
                    onClick={() => handleReportIssue(eq.id, eq.name)}
                    disabled={reportingIssue === eq.id}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {reportingIssue === eq.id ? 'Signalement...' : 'Signaler une panne'}
                  </button>
                )}

                {eq.status === 'maintenance' && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                    <Wrench className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">Maintenance en cours</span>
                  </div>
                )}

                {eq.status === 'broken' && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Équipement hors service</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
