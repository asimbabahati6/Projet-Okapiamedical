import React, { useState, useEffect } from 'react';
import {
  Truck,
  Car,
  Ambulance,
  Bike,
  MapPin,
  Fuel,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Navigation
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import type { Database } from '../../types/database';
import AddMissionModal from '../../components/transport/AddMissionModal';
import AddVehicleModal from '../../components/transport/AddVehicleModal';
import AddDriverModal from '../../components/transport/AddDriverModal';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type TransportMission = Database['public']['Tables']['transport_missions']['Row'];
type Driver = Database['public']['Tables']['drivers']['Row'];
type FuelRecord = Database['public']['Tables']['fuel_records']['Row'];

interface FleetStats {
  total: number;
  disponible: number;
  en_mission: number;
  en_maintenance: number;
  hors_service: number;
}

interface MissionWithDetails extends TransportMission {
  vehicle?: Vehicle;
  driver?: Driver;
}

export default function TransportManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'vehicles' | 'drivers' | 'fuel' | 'maintenance'>('overview');
  const [fleetStats, setFleetStats] = useState<FleetStats>({
    total: 0,
    disponible: 0,
    en_mission: 0,
    en_maintenance: 0,
    hors_service: 0
  });
  const [missions, setMissions] = useState<MissionWithDetails[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMissionStatus, setSelectedMissionStatus] = useState<string>('all');
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();

    const missionsChannel = supabase
      .channel('transport_missions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transport_missions' }, () => {
        loadMissions();
      })
      .subscribe();

    const vehiclesChannel = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        loadVehicles();
        loadFleetStats();
      })
      .subscribe();

    return () => {
      missionsChannel.unsubscribe();
      vehiclesChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'missions') {
      loadMissions();
    } else if (activeTab === 'vehicles') {
      loadVehicles();
    } else if (activeTab === 'drivers') {
      loadDrivers();
    }
  }, [activeTab, selectedMissionStatus]);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([
        loadFleetStats(),
        loadMissions(),
        loadVehicles(),
        loadDrivers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadFleetStats() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('status')
      .eq('is_active', true);

    if (error) throw error;

    const stats: FleetStats = {
      total: data?.length || 0,
      disponible: data?.filter(v => v.status === 'disponible').length || 0,
      en_mission: data?.filter(v => v.status === 'en_mission').length || 0,
      en_maintenance: data?.filter(v => v.status === 'en_maintenance').length || 0,
      hors_service: data?.filter(v => v.status === 'hors_service').length || 0
    };

    setFleetStats(stats);
  }

  async function loadMissions() {
    let query = supabase
      .from('transport_missions')
      .select(`
        *,
        vehicle:vehicles(*),
        driver:drivers(*)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (selectedMissionStatus !== 'all') {
      query = query.eq('status', selectedMissionStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    setMissions(data || []);
  }

  async function loadVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true)
      .order('vehicle_number');

    if (error) throw error;
    setVehicles(data || []);
  }

  async function loadDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (error) throw error;
    setDrivers(data || []);
  }

  function getVehicleIcon(vehicleType: string) {
    switch (vehicleType) {
      case 'ambulance_urgence':
      case 'ambulance_standard':
        return <Ambulance className="h-5 w-5" />;
      case 'voiture_service':
        return <Car className="h-5 w-5" />;
      case 'camionnette':
        return <Truck className="h-5 w-5" />;
      case 'moto':
        return <Bike className="h-5 w-5" />;
      default:
        return <Car className="h-5 w-5" />;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_mission':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hors_service':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'planifiee':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'en_attente':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completee':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'annulee':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgente':
        return 'bg-red-500 text-white';
      case 'elevee':
        return 'bg-orange-500 text-white';
      case 'normale':
        return 'bg-blue-500 text-white';
      case 'faible':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  function formatVehicleType(type: string): string {
    const types: Record<string, string> = {
      'ambulance_urgence': 'Ambulance Urgence',
      'ambulance_standard': 'Ambulance Standard',
      'voiture_service': 'Voiture de Service',
      'camionnette': 'Camionnette',
      'moto': 'Moto'
    };
    return types[type] || type;
  }

  function formatMissionType(type: string): string {
    const types: Record<string, string> = {
      'urgence': 'Urgence',
      'transport_patient': 'Transport Patient',
      'transfert_inter_hopital': 'Transfert Inter-hôpital',
      'transport_materiel': 'Transport Matériel',
      'livraison_pharmacie': 'Livraison Pharmacie',
      'autre': 'Autre'
    };
    return types[type] || type;
  }

  function formatStatus(status: string): string {
    const statuses: Record<string, string> = {
      'disponible': 'Disponible',
      'en_mission': 'En Mission',
      'en_maintenance': 'En Maintenance',
      'hors_service': 'Hors Service',
      'retire': 'Retiré',
      'planifiee': 'Planifiée',
      'en_attente': 'En Attente',
      'en_cours': 'En Cours',
      'completee': 'Complétée',
      'annulee': 'Annulée',
      'reportee': 'Reportée'
    };
    return statuses[status] || status;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Transport</h1>
          <p className="text-gray-600 mt-1">Gérez la flotte, les missions et les conducteurs</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualiser</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Véhicules</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{fleetStats.total}</p>
            </div>
            <Truck className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{fleetStats.disponible}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Mission</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{fleetStats.en_mission}</p>
            </div>
            <Navigation className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Maintenance</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{fleetStats.en_maintenance}</p>
            </div>
            <Wrench className="h-10 w-10 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hors Service</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{fleetStats.hors_service}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Truck },
              { id: 'missions', label: 'Missions', icon: MapPin },
              { id: 'vehicles', label: 'Véhicules', icon: Car },
              { id: 'drivers', label: 'Conducteurs', icon: CheckCircle },
              { id: 'fuel', label: 'Carburant', icon: Fuel },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Missions Actives</h3>
                  <div className="space-y-3">
                    {missions.filter(m => m.status === 'en_cours').slice(0, 5).map((mission) => (
                      <div key={mission.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{mission.mission_number}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(mission.priority)}`}>
                                {mission.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{formatMissionType(mission.mission_type)}</p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{mission.pickup_location} → {mission.destination_location}</span>
                            </div>
                            {mission.vehicle && (
                              <p className="text-xs text-gray-500 mt-1">
                                Véhicule: {mission.vehicle.vehicle_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {missions.filter(m => m.status === 'en_cours').length === 0 && (
                      <p className="text-gray-500 text-center py-8">Aucune mission active</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Véhicules Disponibles</h3>
                  <div className="space-y-3">
                    {vehicles.filter(v => v.status === 'disponible').slice(0, 5).map((vehicle) => (
                      <div key={vehicle.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-green-600">
                              {getVehicleIcon(vehicle.vehicle_type)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{vehicle.vehicle_number}</p>
                              <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                              <p className="text-xs text-gray-500">{formatVehicleType(vehicle.vehicle_type)}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(vehicle.status)}`}>
                            {formatStatus(vehicle.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {vehicles.filter(v => v.status === 'disponible').length === 0 && (
                      <p className="text-gray-500 text-center py-8">Aucun véhicule disponible</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes</h3>
                <div className="space-y-3">
                  {vehicles.filter(v => {
                    if (!v.insurance_expiry_date) return false;
                    const expiryDate = new Date(v.insurance_expiry_date);
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
                  }).map((vehicle) => {
                    const expiryDate = new Date(vehicle.insurance_expiry_date!);
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={vehicle.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200 flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Assurance expire bientôt - {vehicle.vehicle_number}</p>
                          <p className="text-sm text-gray-600">L'assurance expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })}

                  {vehicles.filter(v => {
                    if (!v.next_service_due_km || !v.current_mileage_km) return false;
                    return v.current_mileage_km >= v.next_service_due_km - 500;
                  }).map((vehicle) => (
                    <div key={`maintenance-${vehicle.id}`} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start space-x-3">
                      <Wrench className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Maintenance requise - {vehicle.vehicle_number}</p>
                        <p className="text-sm text-gray-600">
                          Kilométrage: {vehicle.current_mileage_km?.toLocaleString()} km
                          (Maintenance due à {vehicle.next_service_due_km?.toLocaleString()} km)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'missions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedMissionStatus}
                    onChange={(e) => setSelectedMissionStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les missions</option>
                    <option value="planifiee">Planifiées</option>
                    <option value="en_attente">En Attente</option>
                    <option value="en_cours">En Cours</option>
                    <option value="completee">Complétées</option>
                    <option value="annulee">Annulées</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowAddMissionModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouvelle Mission</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type / Priorité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trajet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conducteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horaires
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {missions.map((mission) => (
                      <tr key={mission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{mission.mission_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatMissionType(mission.mission_type)}</div>
                          <span className={`inline-flex text-xs px-2 py-1 rounded-full mt-1 ${getPriorityColor(mission.priority)}`}>
                            {mission.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{mission.pickup_location}</div>
                          <div className="text-sm text-gray-500">→ {mission.destination_location}</div>
                          {mission.distance_km && (
                            <div className="text-xs text-gray-400 mt-1">{mission.distance_km} km</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mission.vehicle ? (
                            <div className="flex items-center space-x-2">
                              {getVehicleIcon(mission.vehicle.vehicle_type)}
                              <span className="text-sm text-gray-900">{mission.vehicle.vehicle_number}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Non assigné</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mission.driver ? (
                            <div className="text-sm text-gray-900">
                              {mission.driver.first_name} {mission.driver.last_name}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Non assigné</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex text-xs px-3 py-1 rounded-full border ${getStatusColor(mission.status)}`}>
                            {formatStatus(mission.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {mission.scheduled_departure && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(mission.scheduled_departure).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {missions.length === 0 && (
                  <div className="text-center py-12">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Aucune mission trouvée</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Flotte de Véhicules</h3>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter Véhicule</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          vehicle.status === 'disponible' ? 'bg-green-100 text-green-600' :
                          vehicle.status === 'en_mission' ? 'bg-blue-100 text-blue-600' :
                          vehicle.status === 'en_maintenance' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {getVehicleIcon(vehicle.vehicle_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{vehicle.vehicle_number}</h4>
                          <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900">{formatVehicleType(vehicle.vehicle_type)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Année:</span>
                        <span className="text-gray-900">{vehicle.year}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Kilométrage:</span>
                        <span className="text-gray-900">{vehicle.current_mileage_km?.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Immatriculation:</span>
                        <span className="text-gray-900 font-mono">{vehicle.registration_plate}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className={`inline-flex text-xs px-3 py-1 rounded-full border ${getStatusColor(vehicle.status)}`}>
                        {formatStatus(vehicle.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {vehicles.length === 0 && (
                <div className="text-center py-12">
                  <Car className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Aucun véhicule trouvé</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Conducteurs</h3>
                <button
                  onClick={() => setShowAddDriverModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter Conducteur</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => {
                  const licenseExpiringSoon = new Date(driver.license_expiry_date) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

                  return (
                    <div key={driver.id} className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{driver.first_name} {driver.last_name}</h4>
                          <p className="text-sm text-gray-600">{driver.employee_number}</p>
                        </div>
                        {licenseExpiringSoon && (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type Permis:</span>
                          <span className="text-gray-900 uppercase">{driver.license_type.replace('permis_', '')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">N° Permis:</span>
                          <span className="text-gray-900 font-mono text-xs">{driver.license_number}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Expiration:</span>
                          <span className={licenseExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-900'}>
                            {new Date(driver.license_expiry_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {driver.phone_number && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Téléphone:</span>
                            <span className="text-gray-900">{driver.phone_number}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <span className={`inline-flex text-xs px-3 py-1 rounded-full border ${
                          driver.is_available
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {driver.is_available ? 'Disponible' : 'Non disponible'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {drivers.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Aucun conducteur trouvé</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fuel' && (
            <div className="text-center py-12">
              <Fuel className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Gestion du carburant - En développement</p>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Gestion de la maintenance - En développement</p>
            </div>
          )}
        </div>
      </div>

      <AddMissionModal
        isOpen={showAddMissionModal}
        onClose={() => setShowAddMissionModal(false)}
        onSuccess={() => {
          loadMissions();
          loadFleetStats();
        }}
      />

      <AddVehicleModal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        onSuccess={() => {
          loadVehicles();
          loadFleetStats();
        }}
      />

      <AddDriverModal
        isOpen={showAddDriverModal}
        onClose={() => setShowAddDriverModal(false)}
        onSuccess={loadDrivers}
      />
    </div>
  );
}
