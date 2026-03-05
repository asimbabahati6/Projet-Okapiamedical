import { useState, useEffect } from 'react';
import { X, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { MedicalStaff, UserProfile } from '../../types/database';
import { assignDoctorToPatient } from '../../utils/doctorAssignment';
import { formatDoctorName } from '../../utils/formatDoctorName';
import { PhotoUpload } from '../patient/PhotoUpload';
import { uploadPatientPhoto } from '../../services/patientPhotoService';
import SearchablePhysicianSelect from '../ui/SearchablePhysicianSelect';
import {
  personalInfoSchema,
  contactInfoSchema,
  emergencyContactSchema,
  insuranceInfoSchema,
} from '../../validation/patientSchemas';

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const completePatientSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  date_of_birth: z.string().min(1, 'La date de naissance est requise'),
  gender: z.enum(['male', 'female', 'other']),
  blood_group: z.string().optional(),
  phone: z.string().min(8, 'Le téléphone est requis'),
  email: z.string().email('Email invalide'),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
  primary_care_physician_id: z.string().optional(),
});

type PatientFormData = z.infer<typeof completePatientSchema>;

const steps = [
  { id: 1, title: 'Informations Personnelles' },
  { id: 2, title: 'Coordonnées' },
  { id: 3, title: 'Contact d\'Urgence' },
  { id: 4, title: 'Assurance & Médecin' },
];

export function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [physicians, setPhysicians] = useState<(MedicalStaff & { user_profile?: UserProfile })[]>([]);
  const [loadingPhysicians, setLoadingPhysicians] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(completePatientSchema),
    mode: 'onChange',
    defaultValues: {
      gender: 'male',
      blood_group: '',
    },
  });

  const watchedFields = watch();

  useEffect(() => {
    fetchPhysicians();
  }, []);

  async function fetchPhysicians() {
    try {
      const { data, error } = await supabase
        .from('medical_staff')
        .select(`
          *,
          user_profile:user_profiles(
            full_name,
            phone,
            department_id
          )
        `)
        .eq('is_accepting_patients', true)
        .order('user_profiles(full_name)');

      if (error) throw error;
      setPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    } finally {
      setLoadingPhysicians(false);
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);

    try {
      const patientNumber = `PAT-${Date.now().toString().slice(-8)}`;
      let photoUrl: string | undefined;

      const patientId = crypto.randomUUID();

      if (selectedPhoto) {
        const photoResult = await uploadPatientPhoto(selectedPhoto, patientId);
        if (photoResult.success) {
          photoUrl = photoResult.url;
        } else {
          showToast(photoResult.error || 'Erreur lors du téléchargement de la photo', 'warning');
        }
      }

      let assignedDoctorId = data.primary_care_physician_id;

      if (!assignedDoctorId) {
        const autoAssignedDoctorId = await assignDoctorToPatient();
        if (autoAssignedDoctorId) {
          assignedDoctorId = autoAssignedDoctorId;
        }
      }

      const { error } = await supabase
        .from('patients')
        .insert([
          {
            id: patientId,
            patient_number: patientNumber,
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            blood_group: data.blood_group || null,
            phone: data.phone,
            email: data.email,
            address: data.address,
            city: data.city,
            emergency_contact_name: data.emergency_contact_name || null,
            emergency_contact_phone: data.emergency_contact_phone || null,
            emergency_contact_relationship: data.emergency_contact_relationship || null,
            insurance_provider: data.insurance_provider || null,
            insurance_number: data.insurance_number || null,
            primary_care_physician_id: assignedDoctorId || null,
            profile_photo_url: photoUrl || null,
          },
        ]);

      if (error) throw error;

      showToast('Patient ajouté avec succès', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding patient:', error);
      showToast(error.message || 'Erreur lors de l\'ajout du patient', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof PatientFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['first_name', 'last_name', 'date_of_birth', 'gender'];
        break;
      case 2:
        fieldsToValidate = ['phone', 'email', 'address', 'city'];
        break;
      case 3:
        break;
      case 4:
        break;
    }

    const isStepValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate);

    if (isStepValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Ajouter un Nouveau Patient</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center hidden sm:block ${
                      currentStep === step.id ? 'font-semibold text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 mt-5 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations Personnelles
              </h3>

              <div className="flex justify-center mb-6">
                <PhotoUpload
                  currentPhotoUrl={photoPreview || undefined}
                  onPhotoChange={handlePhotoChange}
                  onPhotoRemove={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('first_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('last_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de Naissance <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date_of_birth')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Genre <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="male">Masculin</option>
                    <option value="female">Féminin</option>
                    <option value="other">Autre</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Groupe Sanguin
                  </label>
                  <select
                    {...register('blood_group')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Coordonnées
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('address')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('city')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact d'Urgence
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Contact
                  </label>
                  <input
                    {...register('emergency_contact_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    {...register('emergency_contact_phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relation
                  </label>
                  <input
                    {...register('emergency_contact_relationship')}
                    placeholder="Ex: Époux/se, Parent, Ami(e)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Assurance & Médecin Traitant
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assurance Médicale
                  </label>
                  <input
                    {...register('insurance_provider')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro d'Assurance
                  </label>
                  <input
                    {...register('insurance_number')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médecin Traitant
                  </label>
                  <SearchablePhysicianSelect
                    value={watch('primary_care_physician_id') || ''}
                    onChange={(value) => setValue('primary_care_physician_id', value)}
                    placeholder="Sélectionner un médecin traitant"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
        