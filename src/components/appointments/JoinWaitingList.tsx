import { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, Phone, Mail, CheckCircle, AlertCircle, UserPlus, FileText, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MedicalStaff, Service, Department } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface JoinWaitingListProps {
  onClose: () => void;
  preselectedDoctor?: string;
  preselectedService?: string;
}

export function JoinWaitingList({ onClose, preselectedDoctor, preselectedService }: JoinWaitingListProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ isNewPatient: boolean; routingInfo: string } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<(MedicalStaff & { user_profile?: any })[]>([]);
  const [validationError, setValidationError] = useState('');

  const [formData, setFormData] = useState({
    patient_type: '' as 'new' | 'returning' | '',
    service_id: preselectedService || '',
    department_id: '',
    doctor_id: preselectedDoctor || '',
    appointment_type: 'either' as 'in-person' | 'telemedicine' | 'either',
    preferred_date: '',
    preferred_time_start: '08:00',
    preferred_time_end: '18:00',
    patient_name: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    fetchServices();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      fetchDoctorsByDepartment(formData.department_id);
    }
  }, [formData.department_id]);

  useEffect(() => {
    if (formData.service_id) {
      const selectedService = services.find(s => s.id === formData.service_id);
      if (selectedService?.department_id) {
        setFormData(prev => ({ ...prev, department_id: selectedService.department_id || '' }));
      }
    }
  }, [formData.service_id, services]);

  async function fetchServices() {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setServices(data);
  }

  async function fetchDepartments() {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setDepartments(data);
  }

  async function fetchDoctorsByDepartment(departmentId: string) {
    const { data } = await supabase
      .from('medical_staff')
      .select(`
        *,
        user_profile:user_profiles!inner(
          id,
          full_name,
          department_id
        )
      `)
      .eq('is_accepting_patients', true)
      .eq('user_profile.department_id', departmentId);

    if (data) setDoctors(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (!formData.patient_type) {
      setValidationError('Veuillez sélectionner si vous êtes un nouveau patient ou un patient de retour.');
      return;
    }

    setLoading(true);

    try {
      const isNewPatient = formData.patient_type === 'new';
      const routingDecision = isNewPatient ? 'to_reception' : 'to_physician';
      const routingNotes = isNewPatient
        ? 'Nouveau patient - inscription requise à la réception avant la consultation'
        : 'Patient de retour - peut se rendre directement chez le médecin assigné';

      const { error } = await supabase
        .from('appointment_waiting_list')
        .insert([{
          service_id: formData.service_id || null,
          department_id: formData.department_id || null,
          doctor_id: formData.doctor_id,
          appointment_type: formData.appointment_type,
          preferred_date: formData.preferred_date || null,
          preferred_time_start: formData.preferred_time_start,
          preferred_time_end: formData.preferred_time_end,
          patient_name: formData.patient_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          is_new_patient: isNewPatient,
          routing_decision: routingDecision,
          routing_notes: routingNotes,
          status: 'active',
        }]);

      if (error) throw error;

      setSuccessData({
        isNewPatient,
        routingInfo: routingDecision === 'to_reception'
          ? 'Vous serez dirigé vers la réception pour l\'inscription'
          : 'Vous serez dirigé vers votre médecin assigné'
      });
      setSuccess(true);
    } catch (error) {
      console.error('Error joining waiting list:', error);
      alert('Échec de l\'inscription à la liste d\'attente. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (success && successData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Vous êtes sur la liste !</h3>
            <p className="text-gray-600 mb-6">
              Nous vous avertirons dès qu'un créneau de rendez-vous correspondant à vos préférences se libère.
            </p>

            <div className={`rounded-lg p-4 mb-6 border-2 ${
              successData.isNewPatient
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-blue-50 border-blue-300'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                {successData.isNewPatient ? (
                  <UserPlus className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                ) : (
                  <User className="w-6 h-6 text-blue-600 flex-shrink-0" />
                )}
                <div className="text-left flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    successData.isNewPatient ? 'text-yellow-900' : 'text-blue-900'
                  }`}>
                    {successData.isNewPatient ? 'Inscription Nouveau Patient' : 'Patient de Retour'}
                  </h4>
                  <p className={`text-sm ${
                    successData.isNewPatient ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {successData.routingInfo}
                  </p>
                </div>
              </div>

              {successData.isNewPatient && (
                <div className="bg-white rounded-lg p-3 text-left space-y-2">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents à apporter :
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>Pièce d'identité valide émise par le gouvernement</li>
                    <li>Carte d'assurance (si applicable)</li>
                    <li>Liste des médicaments actuels</li>
                    <li>Informations sur l'historique médical</li>
                  </ul>
                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200">
                    <Clock className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Temps estimé :</strong> 10-15 minutes pour l'inscription, plus le temps de consultation
                    </p>
                  </div>
                </div>
              )}

              {!successData.isNewPatient && (
                <div className="bg-white rounded-lg p-3 text-left space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Veuillez vous rendre directement à la salle d'attente à votre arrivée. Votre dossier médical est déjà dans nos fichiers.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                    <Clock className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Attente estimée :</strong> 15-20 minutes après votre enregistrement
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rejoindre la Liste d'Attente</h2>
            <p className="text-sm text-gray-600 mt-1">Nous vous avertirons dès qu'une place se libère</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Rejoignez notre liste d'attente pour être notifié lorsque des rendez-vous se libèrent. Vous recevrez un email ou un SMS lorsqu'un créneau correspondant à vos préférences se libère.
            </p>
          </div>

          <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
            <label className="block text-lg font-bold text-gray-900 mb-4">
              Type de Patient *
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Veuillez sélectionner s'il s'agit de votre première visite à notre clinique ou si vous êtes un patient de retour.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, patient_type: 'new' });
                  setValidationError('');
                }}
                className={`group relative p-6 rounded-xl border-3 text-left transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                  formData.patient_type === 'new'
                    ? 'border-yellow-500 bg-yellow-50 shadow-lg ring-4 ring-yellow-200'
                    : 'border-gray-300 bg-white hover:border-yellow-400 hover:shadow-md'
                }`}
                aria-pressed={formData.patient_type === 'new'}
                aria-label="Select New Patient"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    formData.patient_type === 'new'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-yellow-100 group-hover:text-yellow-600'
                  }`}>
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${
                      formData.patient_type === 'new' ? 'text-yellow-900' : 'text-gray-900'
                    }`}>
                      Nouveau Patient
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      formData.patient_type === 'new' ? 'text-yellow-800' : 'text-gray-600'
                    }`}>
                      Première visite dans notre clinique. Vous serez dirigé vers la réception pour l'inscription.
                    </p>
                  </div>
                </div>
                {formData.patient_type === 'new' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, patient_type: 'returning' });
                  setValidationError('');
                }}
                className={`group relative p-6 rounded-xl border-3 text-left transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                  formData.patient_type === 'returning'
                    ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-200'
                    : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                }`}
                aria-pressed={formData.patient_type === 'returning'}
                aria-label="Select Returning Patient"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    formData.patient_type === 'returning'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${
                      formData.patient_type === 'returning' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      Patient de Retour
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      formData.patient_type === 'returning' ? 'text-blue-800' : 'text-gray-600'
                    }`}>
                      Vous avez des dossiers médicaux existants chez nous. Vous serez dirigé vers votre médecin assigné.
                    </p>
                  </div>
                </div>
                {formData.patient_type === 'returning' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                )}
              </button>
            </div>

            {validationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2" role="alert" aria-live="polite">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">{validationError}</p>
              </div>
            )}

            {formData.patient_type && (
              <div className={`mt-4 p-4 rounded-lg border-2 animate-fadeIn ${
                formData.patient_type === 'new'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                {formData.patient_type === 'new' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      À quoi s'attendre :
                    </p>
                    <ul className="text-sm text-yellow-800 space-y-1 ml-6 list-disc">
                      <li>10-15 minutes pour le processus d'inscription</li>
                      <li>Remplir les formulaires d'admission à la réception</li>
                      <li>Apporter une pièce d'identité valide et les informations d'assurance</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Enregistrement accéléré :
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                      <li>Processus simplifié pour les patients de retour</li>
                      <li>Vos dossiers sont déjà archivés</li>
                      <li>Acheminement direct vers votre médecin</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service (Optionnel)
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">N'importe quel service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médecin *
              </label>
              <select
                required
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez un médecin</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {formatDoctorName(doctor.user_profile?.full_name)} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif du Rendez-vous
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['in-person', 'telemedicine', 'either'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, appointment_type: type as any })}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.appointment_type === type
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {type === 'in-person' ? 'En personne' : type === 'telemedicine' ? 'Vidéo' : 'Peu importe'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date préférée (Optionnel)
              </label>
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Heure la plus tôt
              </label>
              <input
                type="time"
                value={formData.preferred_time_start}
                onChange={(e) => setFormData({ ...formData, preferred_time_start: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Heure la plus tard
              </label>
              <input
                type="time"
                value={formData.preferred_time_end}
                onChange={(e) => setFormData({ ...formData, preferred_time_end: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de Contact</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Adresse Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Numéro de Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Inscription...
                </>
              ) : (
                'Rejoindre la Liste d\'Attente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
