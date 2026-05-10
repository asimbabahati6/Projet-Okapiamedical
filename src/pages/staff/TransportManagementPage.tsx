import { useState } from 'react';
import { Truck, Plus, MapPin, Clock, Users } from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  status: 'available' | 'in_transit' | 'maintenance';
  currentMission?: string;
}

const DEMO_VEHICLES: Vehicle[] = [
  { id: '1', plate: 'KIN-2024-A01', driver: 'Jean Kabongo', status: 'available' },
  { id: '2', plate: 'KIN-2024-A02', driver: 'Pierre Mukendi', status: 'in_transit', currentMission: 'Transport patient - Hôpital Central' },
  { id: '3', plate: 'KIN-2024-A03', driver: 'Marie Tshilombo', status: 'maintenance' },
];

export default function TransportManagementPage() {
  const [vehicles] = useState<Vehicle[]>(DEMO_VEHICLES);

  const statusBadge = (status: Vehicle['status']) => {
    const map = {
      available: 'bg-green-100 text-green-800',
      in_transit: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
    };
    const labels = {
      available: 'Disponible',
      in_transit: 'En mission',
      maintenance: 'Maintenance',
    };
    return { className: map[status], label: labels[status] };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-7 h-7 text-blue-600" />
            Transport
          </h1>
          <p className="text-gray-500 mt-1">Gestion de la flotte et des missions de transport</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          <Plus className="w-4 h-4" />
          Nouvelle mission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disponibles</p>
              <p className="text-xl font-bold text-gray-900">
                {vehicles.filter(v => v.status === 'available').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En mission</p>
              <p className="text-xl font-bold text-gray-900">
                {vehicles.filter(v => v.status === 'in_transit').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-xl font-bold text-gray-900">
                {vehicles.filter(v => v.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            Flotte de véhicules
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {vehicles.map((vehicle) => {
            const badge = statusBadge(vehicle.status);
            return (
              <div key={vehicle.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{vehicle.plate}</p>
                  <p className="text-sm text-gray-500">Chauffeur: {vehicle.driver}</p>
                  {vehicle.currentMission && (
                    <p className="text-xs text-blue-600 mt-0.5">{vehicle.currentMission}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
