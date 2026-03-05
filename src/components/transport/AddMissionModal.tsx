import { useState, useEffect } from 'react';
import { X, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import type { Database } from '../../types/database';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Driver = Database['public']['Tables']['drivers']['Row'];

interface AddMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMissionModal({
  isOpen,
  onClose,
  onSuccess
}: AddMissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    mission_type: 'transport_patient',
    priority: 'normale',
    pickup_location: '',
    destination_location: '',
    scheduled_departure: '',
    scheduled_arrival: '',
    vehicle_id: '',
    driver_id: '',
    patient_name: '',
    distance_km: '',
    special_requirements: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadVehiclesAndDrivers();
    }
  }, [isOpen]);

  const loadVehiclesAndDrivers = async () => {
    try {
      const [vehiclesResult, driversResult] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*')
          .eq('is_active', true)
          .eq('status', 'available')
          .order('registration_number'),
        supabase
          .from('drivers')
          .select('*')
          .eq('is_active', true)
          .eq('is_available', true)
          .order('last_name')
      ]);

      if (vehiclesResult.error) throw vehiclesResult.error;
      if (driversResult.error) throw driversResult.error;

      setVehicles(vehiclesResult.data || []);
      setDrivers(driversResult.data || []);
    } catch (error) {
      console.error('Error loading vehicles and drivers:', error);
      showToast('Erreur lors du chargement des données', 'error');
    }
  };

  const missionTypes = [
    { value: 'urgence', label: 'Urgence' },
    { value: 'transport_patient', label: 'Transport Patient' },
    { value: 'transfert_inter_hopital', label: 'Transfert Inter-hôpital' },
    { value: 'transport_materiel', label: 'Transport Matériel' },
    { value: 'livraison_pharmacie', label: 'Livraison Pharmacie' },
    { value: 'autre', label: 'Autre' }
  ];

  const priorities = [
    { value: 'urgente', label: 'Urgente', color: 'text-red-600' },
    { value: 'elevee', label: 'Élevée', color: 'text-orange-600' },
    { value: 'normale', label: 'Normale', color: 'text-blue-600' },
    { value: 'faible', label: 'Faible', color: 'text-gray-600' }
  ];

  const generateMissionNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MISS-${dateStr}-${randomStr}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pickup_location.trim() || !formData.destination_location.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const missionData = {
        mission_number: generateMissionNumber(),
        mission_type: formData.mission_type,
        priority: formData.priority,
        status: 'requested',
        requested_by: user?.id,
        pickup_location: formData.pickup_location.trim(),
        destination_location: formData.destination_location.trim(),
        scheduled_departure: formData.scheduled_departure || null,
        scheduled_arrival: formData.scheduled_arrival || null,
        assigned_vehicle_id: formData.vehicle_id || null,
        assigned_driver_id: formData.driver_id || null,
        patient_name: formData.patient_name.trim() || null,
        distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null,
        special_requirements: formData.special_requirements.trim() || null,
        notes: formData.notes.trim() || null
      };

      const { error } = await supabase
        .from('transport_missions')
        .insert([missionData]);

      if (error) throw error;

      // Update vehicle and driver status if assigned
      if (formData.vehicle_id) {
        await supabase
          .from('vehicles')
          .update({ status: 'in_mission' })
          .eq('id', formData.vehicle_id);
      }

      if (formData.driver_id) {
        await supabase
          .from('drivers')
          .update({ is_available: false })
          .eq('id', formData.driver_id);
      }

      showToast('Mission créée avec succès', 'success');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating mission:', error);
      showToast('Erreur lors de la création de la mission', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      mission_type: 'transport_patient',
      priority: 'normale',
      pickup_location: '',
      destination_location: '',
      scheduled_departure: '',
      scheduled_arrival: '',
      vehicle_id: '',
      driver_id: '',
      patient_name: '',
      distance_km: '',
      special_requirements: '',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  const showPatientField = formData.mission_type === 'transport_patient' ||
                          formData.mission_type === 'urgence' ||
                          formData.mission_type === 'transfert_inter_hopital';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Nouvelle Mission</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de mission <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.mission_type}
                onChange={(e) => setFormData({ ...formData, mission_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {missionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value} className={priority.color}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu de départ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                placeholder="Ex: Hôpital Principal, Kinshasa"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.destination_location}
                onChange={(e) => setFormData({ ...formData, destination_location: e.target.value })}
                placeholder="Ex: Clinique Saint-Luc, Gombe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure de départ
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_departure}
                onChange={(e) => setFormData({ ...formData, scheduled_departure: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure d'arrivée prévue
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_arrival}
                onChange={(e) => setFormData({ ...formData, scheduled_arrival: e.target.value })}
                min={formData.scheduled_departure || new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Véhicule assigné
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Non assigné</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration_number} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {vehicles.length} véhicule(s) disponible(s)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conducteur assigné
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Non assigné</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {drivers.length} conducteur(s) disponible(s)
              </p>
            </div>
          </div>

          {showPatientField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du patient
              </label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                placeholder="Nom complet du patient"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance estimée (km)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.distance_km}
              onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
              placeholder="0.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exigences spéciales
            </label>
            <textarea
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              placeholder="Ex: Équipement médical requis, accompagnant autorisé..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes additionnelles
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {formData.priority === 'urgente' && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Mission urgente</p>
                <p className="text-sm text-red-600 mt-1">
                  Cette mission sera traitée en priorité et nécessitera une attention immédiate.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Créer la mission</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
