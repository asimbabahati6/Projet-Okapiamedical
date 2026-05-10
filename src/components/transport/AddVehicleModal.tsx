import { useState } from 'react';
import { X, Car, Ambulance, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVehicleModal({
  isOpen,
  onClose,
  onSuccess
}: AddVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'equipment' | 'service'>('basic');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    vehicle_number: '',
    registration_plate: '',
    vin_number: '',
    vehicle_type: 'voiture_service',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    seating_capacity: 4,
    cargo_capacity_kg: '',
    has_medical_equipment: false,
    has_oxygen: false,
    has_stretcher: false,
    has_defibrillator: false,
    purchase_date: '',
    purchase_price: '',
    current_mileage_km: '0',
    next_service_due_km: '',
    insurance_expiry_date: '',
    home_location: 'Hospital Main Parking',
    notes: ''
  });

  const vehicleTypes = [
    { value: 'ambulance_urgence', label: 'Ambulance Urgence', icon: Ambulance },
    { value: 'ambulance_standard', label: 'Ambulance Standard', icon: Ambulance },
    { value: 'voiture_service', label: 'Voiture de Service', icon: Car },
    { value: 'camionnette', label: 'Camionnette', icon: Truck },
    { value: 'moto', label: 'Moto', icon: Car }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_number.trim() || !formData.make.trim() || !formData.model.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setLoading(true);

    try {
      const vehicleData = {
        registration_number: formData.vehicle_number.trim(),
        vin_number: formData.vin_number.trim() || null,
        vehicle_type: formData.vehicle_type,
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: formData.year,
        color: formData.color.trim() || null,
        seating_capacity: formData.seating_capacity,
        cargo_capacity_kg: formData.cargo_capacity_kg ? parseFloat(formData.cargo_capacity_kg) : null,
        has_medical_equipment: formData.has_medical_equipment,
        has_oxygen: formData.has_oxygen,
        has_stretcher: formData.has_stretcher,
        has_defibrillator: formData.has_defibrillator,
        status: 'available',
        current_mileage_km: parseFloat(formData.current_mileage_km),
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        next_service_due_mileage_km: formData.next_service_due_km ? parseFloat(formData.next_service_due_km) : null,
        home_location: formData.home_location,
        is_active: true,
        notes: formData.notes.trim() || null
      };

      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData]);

      if (error) throw error;

      showToast('Véhicule ajouté avec succès', 'success');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      if (error.code === '23505') {
        showToast('Ce numéro de véhicule existe déjà', 'error');
      } else {
        showToast('Erreur lors de l\'ajout du véhicule', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vehicle_number: '',
      registration_plate: '',
      vin_number: '',
      vehicle_type: 'voiture_service',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      seating_capacity: 4,
      cargo_capacity_kg: '',
      has_medical_equipment: false,
      has_oxygen: false,
      has_stretcher: false,
      has_defibrillator: false,
      purchase_date: '',
      purchase_price: '',
      current_mileage_km: '0',
      next_service_due_km: '',
      insurance_expiry_date: '',
      home_location: 'Hospital Main Parking',
      notes: ''
    });
    setActiveTab('basic');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Ajouter un Véhicule</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'basic', label: 'Informations de base' },
              { id: 'equipment', label: 'Équipement' },
              { id: 'service', label: 'Service & Finance' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro du véhicule <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    placeholder="Ex: VH-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plaque d'immatriculation
                  </label>
                  <input
                    type="text"
                    value={formData.registration_plate}
                    onChange={(e) => setFormData({ ...formData, registration_plate: e.target.value })}
                    placeholder="Ex: CD-123-ABC"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro VIN
                </label>
                <input
                  type="text"
                  value={formData.vin_number}
                  onChange={(e) => setFormData({ ...formData, vin_number: e.target.value })}
                  placeholder="Numéro d'identification du véhicule"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de véhicule <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {vehicleTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, vehicle_type: type.value })}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                          formData.vehicle_type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium text-center">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marque <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="Ex: Toyota, Mercedes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modèle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ex: Hilux, Sprinter"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ex: Blanc, Bleu"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité de sièges
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.seating_capacity}
                    onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité de chargement (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cargo_capacity_kg}
                    onChange={(e) => setFormData({ ...formData, cargo_capacity_kg: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Équipement médical</p>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_medical_equipment}
                    onChange={(e) => setFormData({ ...formData, has_medical_equipment: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Équipement médical</span>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_oxygen}
                    onChange={(e) => setFormData({ ...formData, has_oxygen: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Oxygène</span>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_stretcher}
                    onChange={(e) => setFormData({ ...formData, has_stretcher: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Brancard</span>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_defibrillator}
                    onChange={(e) => setFormData({ ...formData, has_defibrillator: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Défibrillateur</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'achat
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix d'achat (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kilométrage actuel (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_mileage_km}
                    onChange={(e) => setFormData({ ...formData, current_mileage_km: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prochain entretien (km)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.next_service_due_km}
                    onChange={(e) => setFormData({ ...formData, next_service_due_km: e.target.value })}
                    placeholder="Ex: 5000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'expiration de l'assurance
                </label>
                <input
                  type="date"
                  value={formData.insurance_expiry_date}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emplacement de base
                </label>
                <input
                  type="text"
                  value={formData.home_location}
                  onChange={(e) => setFormData({ ...formData, home_location: e.target.value })}
                  placeholder="Ex: Hospital Main Parking"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informations supplémentaires..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'service' ? 'equipment' : 'basic')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Précédent
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>

              {activeTab !== 'service' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'basic' ? 'equipment' : 'service')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Ajout...</span>
                    </>
                  ) : (
                    <>
                      <Car className="w-4 h-4" />
                      <span>Ajouter le véhicule</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
