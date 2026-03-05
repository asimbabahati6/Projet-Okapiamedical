import { useState } from 'react';
import { X, User, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDriverModal({
  isOpen,
  onClose,
  onSuccess
}: AddDriverModalProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    employee_number: '',
    phone_number: '',
    email: '',
    license_number: '',
    license_type: 'permis_b',
    license_issue_date: '',
    license_expiry_date: '',
    has_ambulance_certification: false,
    ambulance_cert_expiry: '',
    has_first_aid_training: false,
    first_aid_cert_expiry: '',
    notes: ''
  });

  const licenseTypes = [
    { value: 'permis_b', label: 'Permis B (Véhicules légers)' },
    { value: 'permis_c', label: 'Permis C (Poids lourds)' },
    { value: 'permis_d', label: 'Permis D (Transport de personnes)' },
    { value: 'permis_e', label: 'Permis E (Remorque)' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.last_name.trim() ||
        !formData.employee_number.trim() || !formData.license_number.trim() ||
        !formData.license_expiry_date) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const expiryDate = new Date(formData.license_expiry_date);
    if (expiryDate <= new Date()) {
      showToast('La date d\'expiration du permis doit être dans le futur', 'error');
      return;
    }

    if (formData.has_ambulance_certification && !formData.ambulance_cert_expiry) {
      showToast('Veuillez indiquer la date d\'expiration de la certification ambulance', 'error');
      return;
    }

    if (formData.has_first_aid_training && !formData.first_aid_cert_expiry) {
      showToast('Veuillez indiquer la date d\'expiration de la formation premiers secours', 'error');
      return;
    }

    setLoading(true);

    try {
      const driverData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        employee_number: formData.employee_number.trim(),
        phone_number: formData.phone_number.trim() || null,
        email: formData.email.trim() || null,
        license_number: formData.license_number.trim(),
        license_type: formData.license_type,
        license_issue_date: formData.license_issue_date || null,
        license_expiry_date: formData.license_expiry_date,
        has_ambulance_certification: formData.has_ambulance_certification,
        ambulance_cert_expiry: formData.ambulance_cert_expiry || null,
        has_first_aid_training: formData.has_first_aid_training,
        first_aid_cert_expiry: formData.first_aid_cert_expiry || null,
        is_available: true,
        is_active: true,
        total_missions: 0,
        total_km_driven: 0,
        notes: formData.notes.trim() || null
      };

      const { error } = await supabase
        .from('drivers')
        .insert([driverData]);

      if (error) throw error;

      showToast('Conducteur ajouté avec succès', 'success');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating driver:', error);
      if (error.code === '23505') {
        if (error.message.includes('license_number')) {
          showToast('Ce numéro de permis existe déjà', 'error');
        } else if (error.message.includes('employee_number')) {
          showToast('Ce numéro d\'employé existe déjà', 'error');
        } else {
          showToast('Cette entrée existe déjà', 'error');
        }
      } else {
        showToast('Erreur lors de l\'ajout du conducteur', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      employee_number: '',
      phone_number: '',
      email: '',
      license_number: '',
      license_type: 'permis_b',
      license_issue_date: '',
      license_expiry_date: '',
      has_ambulance_certification: false,
      ambulance_cert_expiry: '',
      has_first_aid_training: false,
      first_aid_cert_expiry: '',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  const licenseExpiringSoon = formData.license_expiry_date &&
    new Date(formData.license_expiry_date) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Ajouter un Conducteur</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Jean"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Dupont"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° Employé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  placeholder="EMP-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+243 XXX XXX XXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="conducteur@exemple.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Permis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° Permis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="Ex: 1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de permis <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.license_type}
                  onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {licenseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de délivrance
                </label>
                <input
                  type="date"
                  value={formData.license_issue_date}
                  onChange={(e) => setFormData({ ...formData, license_issue_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'expiration <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.license_expiry_date}
                  onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {licenseExpiringSoon && (
              <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mt-4">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Avertissement</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Ce permis expire dans moins de 60 jours. Assurez-vous qu'il soit renouvelé avant l'affectation.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_ambulance_certification}
                    onChange={(e) => setFormData({ ...formData, has_ambulance_certification: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Certification Ambulancier</span>
                </label>
                {formData.has_ambulance_certification && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'expiration <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.ambulance_cert_expiry}
                      onChange={(e) => setFormData({ ...formData, ambulance_cert_expiry: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={formData.has_ambulance_certification}
                    />
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_first_aid_training}
                    onChange={(e) => setFormData({ ...formData, has_first_aid_training: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Formation Premiers Secours</span>
                </label>
                {formData.has_first_aid_training && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'expiration <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.first_aid_cert_expiry}
                      onChange={(e) => setFormData({ ...formData, first_aid_cert_expiry: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={formData.has_first_aid_training}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires sur le conducteur..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

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
                  <span>Ajout...</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Ajouter le conducteur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
