import { useState } from 'react';
import { X, Loader as Loader2, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const patientSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  date_of_birth: z.string().min(1, 'La date de naissance est requise'),
  gender: z.enum(['male', 'female', 'other'] as const, { error: 'Le sexe est requis' }),
  email: z.string().email('Format email invalide'),
  phone: z.string().min(8, 'Le téléphone doit contenir au moins 8 caractères'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const, {
    error: 'Le groupe sanguin est requis',
  }),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, 'La ville est requise'),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const patientNumber = `PAT-${randomSuffix}`;
      const patientId = crypto.randomUUID();

      const { error } = await supabase.from('patients').insert([
        {
          id: patientId,
          patient_number: patientNumber,
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          blood_group: data.blood_group,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
        },
      ]);

      if (error) throw error;

      showToast(`Patient ${data.first_name} ${data.last_name} ajouté avec succès`, 'success');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding patient:', error);
      showToast(error.message || "Erreur lors de l'ajout du patient", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 z-10 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ajouter un Patient</h2>
                <p className="text-sm text-gray-500">Remplissez les informations du nouveau patient</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Identite
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prenom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('first_name')}
                  placeholder="Ex: Jean"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.first_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.first_name && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('last_name')}
                  placeholder="Ex: Dupont"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.last_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.last_name && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date de Naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.date_of_birth ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.date_of_birth && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.date_of_birth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('gender')}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.gender ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <option value="">Selectionner...</option>
                  <option value="male">Masculin</option>
                  <option value="female">Feminin</option>
                  <option value="other">Autre</option>
                </select>
                {errors.gender && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.gender.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="patient@exemple.com"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telephone <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone')}
                  placeholder="+243 XXX XXX XXX"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('address')}
                  placeholder="Ex: Avenue Kasa-Vubu"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.address && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('city')}
                  placeholder="Ex: Kinshasa"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.city.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Medical
            </h3>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Groupe Sanguin <span className="text-red-500">*</span>
              </label>
              <select
                {...register('blood_group')}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.blood_group ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                }`}
              >
                <option value="">Selectionner...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.blood_group && (
                <p className="mt-1.5 text-xs text-red-600">{errors.blood_group.message}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Enregistrement...' : 'Enregistrer le Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
