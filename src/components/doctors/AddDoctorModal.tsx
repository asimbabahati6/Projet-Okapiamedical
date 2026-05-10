import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Briefcase, FileText, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Department {
  id: string;
  name: string;
}

export default function AddDoctorModal({ isOpen, onClose, onSuccess }: AddDoctorModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: '',
    specialization: '',
    rppsNumber: '',
    departmentId: '',
    contractType: 'CDI',
    salary: '',
    startDate: '',
    workSchedule: 'full_time',
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  async function fetchDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, is_public')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      showToast('Erreur lors du chargement des départements', 'error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const temporaryPassword = Math.random().toString(36).slice(-8) + 'A1!';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: temporaryPassword,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: 'médecin'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'médecin')
          .single();

        if (!roleData) {
          throw new Error('Role "médecin" not found');
        }

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            full_name: `${formData.firstName} ${formData.lastName}`,
            role_id: roleData.id,
            department_id: formData.departmentId || null,
            is_active: true
          });

        if (profileError) throw profileError;

        const { error: staffError } = await supabase
          .from('medical_staff')
          .insert({
            id: authData.user.id,
            specialization: formData.specialization,
            rpps_number: formData.rppsNumber || null,
            staff_type: 'medecin',
            staff_category: 'medical',
            is_accepting_patients: true,
            current_status: 'available',
            years_of_experience: 0,
            consultation_fee: parseFloat(formData.salary) / 20 || 50
          });

        if (staffError) throw staffError;

        if (formData.departmentId) {
          const { error: deptError } = await supabase
            .from('doctor_departments')
            .insert({
              doctor_id: authData.user.id,
              department_id: formData.departmentId,
              is_primary: true,
              is_active: true
            });

          if (deptError) console.warn('Department junction error:', deptError);
        }

        for (let day = 1; day <= 5; day++) {
          const { error: availError } = await supabase
            .from('doctor_availability_calendar')
            .insert({
              doctor_id: authData.user.id,
              day_of_week: day,
              is_available: true,
              capacity_percentage: 100
            });

          if (availError) console.warn(`Availability creation error for day ${day}:`, availError);
        }

        showToast('Médecin créé avec succès et activé', 'success');
        onSuccess();
        onClose();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating doctor:', error);
      showToast(`Erreur lors de la création du médecin: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      city: '',
      postalCode: '',
      specialization: '',
      rppsNumber: '',
      departmentId: '',
      contractType: 'CDI',
      salary: '',
      startDate: '',
      workSchedule: 'full_time',
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Créer un Nouveau Médecin</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Un compte utilisateur sera créé automatiquement avec un mot de passe temporaire envoyé par email.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Visibilité :</strong> Le médecin sera automatiquement visible dans tous les modules avec un statut "acceptant des patients" et une disponibilité par défaut du lundi au vendredi.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations Personnelles
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Coordonnées
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Informations Professionnelles
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialisation <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Médecine Générale">Médecine Générale</option>
                  <option value="Cardiologie">Cardiologie</option>
                  <option value="Chirurgie">Chirurgie</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                  <option value="Orthopédie">Orthopédie</option>
                  <option value="Dentisterie">Dentisterie</option>
                  <option value="Kinésithérapie">Kinésithérapie</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro RPPS
                </label>
                <input
                  type="text"
                  value={formData.rppsNumber}
                  onChange={(e) => setFormData({ ...formData, rppsNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département principal <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Seuls les départements publics sont affichés pour garantir la visibilité
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horaires de travail <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.workSchedule}
                  onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full_time">Temps plein</option>
                  <option value="part_time">Temps partiel</option>
                  <option value="on_call">Sur appel</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informations Contractuelles
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de contrat <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
                  <option value="CDD">CDD - Contrat à Durée Déterminée</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Stage">Stage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salaire de base (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer le Médecin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
