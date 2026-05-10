import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Heart,
  Calendar,
  Clock,
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  Shield,
  Fingerprint,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Department, MedicalStaff } from '../../types/database';
import { useLanguage } from '../../contexts/LanguageContext';
import { BiometricEnrollment } from '../biometric/BiometricEnrollment';
import { isWebAuthnSupported } from '../../utils/webAuthnService';

interface DocumentUpload {
  type: 'voter_card' | 'drivers_license' | 'passport' | 'service_card' | 'national_id';
  number: string;
  expiryDate: string;
  frontImage: File | null;
  backImage: File | null;
  frontPreview: string | null;
  backPreview: string | null;
}

export function PatientRegistrationForm() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<(MedicalStaff & { user_profile?: any })[]>([]);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricCredentialId, setBiometricCredentialId] = useState<string>('');
  const [showBiometricStep, setShowBiometricStep] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    primary_phone: '',
    secondary_phone: '',
    primary_email: '',
    backup_email: '',
    street_address: '',
    city: '',
    postal_code: '',
    country: 'Republic of Congo',
    profession: '',
    employer: '',
    consultation_reason: '',
    medical_history: '',
    known_allergies: '',
    chronic_conditions: '',
    current_medications: '',
    current_physician_name: '',
    insurance_provider: '',
    insurance_policy_number: '',
    preferred_consultation_type: 'in-person' as 'in-person' | 'telemedicine' | 'either',
    preferred_days: [] as string[],
    preferred_time_start: '08:00',
    preferred_time_end: '18:00',
    preferred_doctor_id: '',
    preferred_department_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const baseSteps = [
    { number: 1, title: t.patientRegistration.steps.personal_info, icon: User },
    { number: 2, title: t.patientRegistration.steps.identity_docs, icon: FileCheck },
    { number: 3, title: t.patientRegistration.steps.medical_info, icon: Heart },
    { number: 4, title: t.patientRegistration.steps.preferences, icon: Calendar },
    { number: 5, title: t.patientRegistration.steps.review, icon: CheckCircle },
  ];

  const biometricStep = { number: 2.5, title: t.patientRegistration.steps.biometric, icon: Fingerprint };

  const steps = showBiometricStep && isWebAuthnSupported()
    ? [
        baseSteps[0],
        baseSteps[1],
        biometricStep,
        { ...baseSteps[2], number: 3.5 },
        { ...baseSteps[3], number: 4.5 },
        { ...baseSteps[4], number: 5.5 },
      ]
    : baseSteps;

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const documentTypes = [
    { value: 'voter_card', label: t.patientRegistration.identityDocs.voters_card },
    { value: 'drivers_license', label: t.patientRegistration.identityDocs.drivers_license },
    { value: 'passport', label: t.patientRegistration.identityDocs.passport },
    { value: 'service_card', label: t.patientRegistration.identityDocs.service_card },
    { value: 'national_id', label: t.patientRegistration.identityDocs.national_id },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter((d) => d !== day)
        : [...prev.preferred_days, day],
    }));
  };

  const addDocument = () => {
    setDocuments((prev) => [
      ...prev,
      {
        type: 'voter_card',
        number: '',
        expiryDate: '',
        frontImage: null,
        backImage: null,
        frontPreview: null,
        backPreview: null,
      },
    ]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (index: number, side: 'front' | 'back', file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(t.patientRegistration.validation.file_type_error);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t.patientRegistration.validation.file_size_error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocuments((prev) =>
        prev.map((doc, i) =>
          i === index
            ? {
                ...doc,
                [side === 'front' ? 'frontImage' : 'backImage']: file,
                [side === 'front' ? 'frontPreview' : 'backPreview']: e.target?.result as string,
              }
            : doc
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = t.patientRegistration.validation.first_name_required;
      if (!formData.last_name.trim()) newErrors.last_name = t.patientRegistration.validation.last_name_required;
      if (!formData.date_of_birth) newErrors.date_of_birth = t.patientRegistration.validation.dob_required;
      if (!formData.primary_phone.trim()) newErrors.primary_phone = t.patientRegistration.validation.phone_required;
      if (!formData.primary_email.trim()) newErrors.primary_email = t.patientRegistration.validation.email_required;
      if (!formData.street_address.trim()) newErrors.street_address = t.patientRegistration.validation.address_required;
      if (!formData.city.trim()) newErrors.city = t.patientRegistration.validation.city_required;
    }

    if (step === 2) {
      if (documents.length === 0) {
        newErrors.documents = t.patientRegistration.validation.documents_required;
      } else {
        documents.forEach((doc, index) => {
          if (!doc.number.trim()) {
            newErrors[`doc_${index}_number`] = t.patientRegistration.validation.doc_number_required;
          }
          if (!doc.frontImage) {
            newErrors[`doc_${index}_front`] = t.patientRegistration.validation.doc_front_required;
          }
        });
      }
    }

    if (step === 2.5) {
      setShowBiometricStep(true);
    }

    if (step === 3 || step === 3.5) {
      if (!formData.consultation_reason.trim()) {
        newErrors.consultation_reason = t.patientRegistration.validation.consultation_reason_required;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && isWebAuthnSupported()) {
        setShowBiometricStep(true);
        setCurrentStep(2.5);
      } else if (currentStep === 2.5) {
        setCurrentStep(3.5);
      } else if (currentStep === 3.5) {
        setCurrentStep(4.5);
      } else if (currentStep === 4.5) {
        setCurrentStep(5.5);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, showBiometricStep ? 5.5 : 5));
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2.5) {
      setCurrentStep(2);
    } else if (currentStep === 3.5) {
      if (showBiometricStep) {
        setCurrentStep(2.5);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 4.5) {
      setCurrentStep(3.5);
    } else if (currentStep === 5.5) {
      setCurrentStep(4.5);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const registrationData = {
        ...formData,
        preferred_doctor_id: formData.preferred_doctor_id || null,
        preferred_department_id: formData.preferred_department_id || null,
        payment_amount: 50.0,
        biometric_enrolled: biometricEnrolled,
        biometric_consent_given: biometricEnrolled,
        biometric_consent_date: biometricEnrolled ? new Date().toISOString() : null,
      };

      const { data: registration, error: registrationError } = await supabase
        .from('patient_registrations')
        .insert([registrationData])
        .select()
        .single();

      if (registrationError) throw registrationError;

      for (const doc of documents) {
        if (doc.frontImage) {
          const frontPath = `${registration.id}/${doc.type}_front_${Date.now()}.${doc.frontImage.name.split('.').pop()}`;
          await supabase.storage.from('identity-documents').upload(frontPath, doc.frontImage);

          let backPath = null;
          if (doc.backImage) {
            backPath = `${registration.id}/${doc.type}_back_${Date.now()}.${doc.backImage.name.split('.').pop()}`;
            await supabase.storage.from('identity-documents').upload(backPath, doc.backImage);
          }

          await supabase.from('identity_documents').insert([
            {
              registration_id: registration.id,
              document_type: doc.type,
              document_number: doc.number,
              document_expiry_date: doc.expiryDate || null,
              front_image_path: frontPath,
              back_image_path: backPath,
            },
          ]);
        }
      }

      await supabase.from('registration_verification_history').insert([
        {
          registration_id: registration.id,
          action_type: 'submitted',
          new_status: 'pending_verification',
          notes: 'Registration submitted by patient',
        },
      ]);

      setRegistrationId(registration.id);
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-green-500">
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.patientRegistration.success.title}</h2>
            <p className="text-lg text-gray-600 mb-6">
              {t.patientRegistration.success.message}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-sm font-semibold text-blue-900 mb-2">{t.patientRegistration.success.registration_id}</p>
              <p className="text-2xl font-bold text-blue-600 font-mono">{registrationId.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-blue-700 mt-4">
                {t.patientRegistration.success.save_id}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-yellow-900 mb-2">{t.patientRegistration.success.next_steps}</p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>{t.patientRegistration.success.step_1}</li>
                    <li>{t.patientRegistration.success.step_2}</li>
                    <li>{t.patientRegistration.success.step_3}</li>
                    <li>{t.patientRegistration.success.step_4}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-2">{t.patientRegistration.success.verification_time}</p>
              <p>{t.patientRegistration.success.email_updates} <strong>{formData.primary_email}</strong></p>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t.patientRegistration.success.return_home}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.patientRegistration.title}</h1>
          <p className="text-lg text-gray-600">{t.patientRegistration.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        currentStep >= step.number
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {currentStep > step.number ? <CheckCircle className="w-6 h-6" /> : step.number}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium text-center ${
                        currentStep >= step.number ? 'text-white' : 'text-blue-200'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                        currentStep > step.number ? 'bg-white' : 'bg-blue-500'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations Personnelles</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.last_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de Naissance *
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.date_of_birth && (
                      <p className="text-sm text-red-600 mt-1">{errors.date_of_birth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Masculin</option>
                      <option value="female">Féminin</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Téléphone Principal *
                    </label>
                    <input
                      type="tel"
                      value={formData.primary_phone}
                      onChange={(e) => handleInputChange('primary_phone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.primary_phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.primary_phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.primary_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Téléphone Secondaire
                    </label>
                    <input
                      type="tel"
                      value={formData.secondary_phone}
                      onChange={(e) => handleInputChange('secondary_phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Principal *
                    </label>
                    <input
                      type="email"
                      value={formData.primary_email}
                      onChange={(e) => handleInputChange('primary_email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.primary_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.primary_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.primary_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email de Secours
                    </label>
                    <input
                      type="email"
                      value={formData.backup_email}
                      onChange={(e) => handleInputChange('backup_email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={formData.street_address}
                    onChange={(e) => handleInputChange('street_address', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.street_address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.street_address && (
                    <p className="text-sm text-red-600 mt-1">{errors.street_address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Postal
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      Profession
                    </label>
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employeur
                    </label>
                    <input
                      type="text"
                      value={formData.employer}
                      onChange={(e) => handleInputChange('employer', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact d'Urgence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du Contact
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone du Contact
                      </label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lien de Parenté
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_relationship}
                        onChange={(e) =>
                          handleInputChange('emergency_contact_relationship', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Documents d'Identité</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Téléchargez au moins une pièce d'identité valide émise par le gouvernement
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addDocument}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Ajouter un Document
                  </button>
                </div>

                {errors.documents && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{errors.documents}</p>
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aucun document ajouté</p>
                    <button
                      type="button"
                      onClick={addDocument}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ajouter Votre Premier Document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type de Document *
                            </label>
                            <select
                              value={doc.type}
                              onChange={(e) =>
                                setDocuments((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, type: e.target.value as any } : d
                                  )
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              {documentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Numéro de Document *
                            </label>
                            <input
                              type="text"
                              value={doc.number}
                              onChange={(e) =>
                                setDocuments((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, number: e.target.value } : d
                                  )
                                )
                              }
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors[`doc_${index}_number`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`doc_${index}_number`] && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors[`doc_${index}_number`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Date d'Expiration (si applicable)
                            </label>
                            <input
                              type="date"
                              value={doc.expiryDate}
                              onChange={(e) =>
                                setDocuments((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, expiryDate: e.target.value } : d
                                  )
                                )
                              }
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Image Recto *
                            </label>
                            <div
                              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors ${
                                errors[`doc_${index}_front`]
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  e.target.files?.[0] &&
                                  handleFileSelect(index, 'front', e.target.files[0])
                                }
                                className="hidden"
                                id={`front-${index}`}
                              />
                              <label htmlFor={`front-${index}`} className="cursor-pointer">
                                {doc.frontPreview ? (
                                  <img
                                    src={doc.frontPreview}
                                    alt="Recto"
                                    className="w-full h-40 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="py-8">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Cliquez pour télécharger</p>
                                  </div>
                                )}
                              </label>
                            </div>
                            {errors[`doc_${index}_front`] && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors[`doc_${index}_front`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Image Verso (si applicable)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  e.target.files?.[0] &&
                                  handleFileSelect(index, 'back', e.target.files[0])
                                }
                                className="hidden"
                                id={`back-${index}`}
                              />
                              <label htmlFor={`back-${index}`} className="cursor-pointer">
                                {doc.backPreview ? (
                                  <img
                                    src={doc.backPreview}
                                    alt="Verso"
                                    className="w-full h-40 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="py-8">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Cliquez pour télécharger</p>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-2">Exigences pour les Documents :</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Images claires et lisibles</li>
                        <li>Tout le texte et les photos doivent être visibles</li>
                        <li>Taille de fichier limitée : 5 Mo par image</li>
                        <li>Formats acceptés : JPG, PNG</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2.5 && (
              <div className="space-y-6">
                <BiometricEnrollment
                  patientId={registrationId || 'temp-id'}
                  patientName={`${formData.first_name} ${formData.last_name}`}
                  onEnrollmentComplete={(success, credentialId) => {
                    setBiometricEnrolled(success);
                    if (credentialId) {
                      setBiometricCredentialId(credentialId);
                    }
                  }}
                  onSkip={() => {
                    setBiometricEnrolled(false);
                    handleNext();
                  }}
                />
              </div>
            )}

            {(currentStep === 3 || currentStep === 3.5) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.patientRegistration.medicalInfo.title}</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif de Consultation *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.consultation_reason}
                    onChange={(e) => handleInputChange('consultation_reason', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                      errors.consultation_reason ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Veuillez décrire votre principale préoccupation de santé ou raison de visite"
                  />
                  {errors.consultation_reason && (
                    <p className="text-sm text-red-600 mt-1">{errors.consultation_reason}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antécédents Médicaux
                  </label>
                  <textarea
                    rows={3}
                    value={formData.medical_history}
                    onChange={(e) => handleInputChange('medical_history', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Chirurgies antérieures, hospitalisations, maladies graves"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies Connues
                  </label>
                  <textarea
                    rows={3}
                    value={formData.known_allergies}
                    onChange={(e) => handleInputChange('known_allergies', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Médicaments, aliments, allergies environnementales"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maladies Chroniques
                  </label>
                  <textarea
                    rows={3}
                    value={formData.chronic_conditions}
                    onChange={(e) => handleInputChange('chronic_conditions', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Diabète, hypertension, asthme, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Médicaments Actuels
                  </label>
                  <textarea
                    rows={3}
                    value={formData.current_medications}
                    onChange={(e) => handleInputChange('current_medications', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Listez tous les médicaments que vous prenez actuellement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du Médecin Actuel
                  </label>
                  <input
                    type="text"
                    value={formData.current_physician_name}
                    onChange={(e) => handleInputChange('current_physician_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Si vous avez un médecin actuel"
                  />
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations d'Assurance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fournisseur d'Assurance
                      </label>
                      <input
                        type="text"
                        value={formData.insurance_provider}
                        onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de Police
                      </label>
                      <input
                        type="text"
                        value={formData.insurance_policy_number}
                        onChange={(e) =>
                          handleInputChange('insurance_policy_number', e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(currentStep === 4 || currentStep === 4.5) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Préférences de Rendez-vous</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de Consultation Préféré
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'in-person', label: 'Visite en Personne' },
                      { value: 'telemedicine', label: 'Consultation Vidéo' },
                      { value: 'either', label: 'Peu Importe' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('preferred_consultation_type', type.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.preferred_consultation_type === type.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <p className="font-medium">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Jours Préférés
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-2 px-4 rounded-lg border-2 transition-all capitalize ${
                          formData.preferred_days.includes(day)
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Heure la Plus Tôt
                    </label>
                    <input
                      type="time"
                      value={formData.preferred_time_start}
                      onChange={(e) => handleInputChange('preferred_time_start', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Heure la Plus Tard
                    </label>
                    <input
                      type="time"
                      value={formData.preferred_time_end}
                      onChange={(e) => handleInputChange('preferred_time_end', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Ces préférences nous aident à vous associer au médecin et à l'horaire les plus appropriés.
                    Nous ferons de notre mieux pour accommoder vos préférences lors de la planification de votre rendez-vous.
                  </p>
                </div>
              </div>
            )}

            {(currentStep === 5 || currentStep === 5.5) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Vérification et Soumission</h2>

                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Informations Personnelles</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-gray-600">Nom</dt>
                        <dd className="font-medium">
                          {formData.first_name} {formData.last_name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Date de Naissance</dt>
                        <dd className="font-medium">{formData.date_of_birth}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Téléphone Principal</dt>
                        <dd className="font-medium">{formData.primary_phone}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Email Principal</dt>
                        <dd className="font-medium">{formData.primary_email}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-gray-600">Adresse</dt>
                        <dd className="font-medium">
                          {formData.street_address}, {formData.city}, {formData.country}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Documents d'Identité</h3>
                    <p className="text-sm text-gray-700">
                      {documents.length} document(s) téléchargé(s)
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Informations Médicales</h3>
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-gray-600">Motif de Consultation</dt>
                        <dd className="font-medium">{formData.consultation_reason}</dd>
                      </div>
                      {formData.insurance_provider && (
                        <div>
                          <dt className="text-gray-600">Assurance</dt>
                          <dd className="font-medium">{formData.insurance_provider}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-2">Informations de Paiement</h3>
                        <p className="text-sm text-yellow-800 mb-3">
                          Des frais d'inscription de <strong>50,00 $</strong> sont requis pour compléter votre
                          inscription. Le paiement sera collecté par notre personnel de réception lors de
                          la vérification.
                        </p>
                        <p className="text-sm text-yellow-800">
                          Modes de paiement acceptés : Espèces, Carte, Mobile Money, Assurance
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-green-900 mb-2">
                          Prêt à Soumettre Votre Inscription
                        </h3>
                        <p className="text-sm text-green-800">
                          En soumettant cette inscription, vous confirmez que toutes les informations fournies
                          sont exactes et complètes. Notre équipe examinera vos documents et vous contactera
                          dans les 24 à 48 heures.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Précédent
                </button>
              )}

              {currentStep < (showBiometricStep && isWebAuthnSupported() ? 5.5 : 5) ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Continuer
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Soumission en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Soumettre l'Inscription
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
