import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Droplet, Heart, AlertCircle, FileText, ExternalLink, Stethoscope, Award, Shield, Activity } from 'lucide-react';
import { Patient, Consultation, PatientINSIdentity, PatientMedicalHistory, PatientAllergyDetailed } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { INSIdentitySection } from '../patient/INSIdentitySection';
import { MedicalHistorySection } from '../patient/MedicalHistorySection';
import { AllergiesSection } from '../patient/AllergiesSection';
import { ExportPatientDataButton } from '../patient/ExportPatientDataButton';
import { formatDoctorName } from '../../utils/formatDoctorName';
import { Badge } from '../ui/Badge';
import { generateInitials } from '../../services/patientPhotoService';
import PatientExportActionsBar from '../patient/PatientExportActionsBar';
import PhysicianBadgeCard from '../patient/PhysicianBadgeCard';
import { useToast } from '../../hooks/useToast';

interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
}

type PatientWithPhysician = Omit<Patient, 'primary_care_physician'> & {
  primary_care_physician?: {
    id: string;
    license_number: string | null;
    specialization: string | null;
    consultation_fee: number | null;
    user_profile?: {
      full_name: string;
      phone: string | null;
      department_id: string | null;
    };
  };
};

export function PatientDetailsModal({ patient: initialPatient, onClose, onEdit }: PatientDetailsModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [patient, setPatient] = useState<PatientWithPhysician>(initialPatient);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [loadingPhysician, setLoadingPhysician] = useState(true);

  const [insIdentity, setInsIdentity] = useState<PatientINSIdentity | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<PatientMedicalHistory[]>([]);
  const [allergies, setAllergies] = useState<PatientAllergyDetailed[]>([]);
  const [loadingEnhancedData, setLoadingEnhancedData] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ins' | 'history' | 'allergies' | 'consultations'>('overview');

  useEffect(() => {
    fetchPatientWithPhysician();
    fetchConsultations();
    fetchEnhancedData();
  }, [initialPatient.id]);

  async function fetchPatientWithPhysician() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          primary_care_physician:medical_staff!primary_care_physician_id(
            id,
            license_number,
            specialization,
            consultation_fee,
            user_profile:user_profiles(
              full_name,
              phone,
              department_id
            )
          )
        `)
        .eq('id', initialPatient.id)
        .single();

      if (error) throw error;
      if (data) {
        setPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient with physician:', error);
    } finally {
      setLoadingPhysician(false);
    }
  }

  async function fetchConsultations() {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:medical_staff!doctor_id(
            id,
            license_number,
            specialization,
            user_profile:user_profiles(
              full_name,
              phone
            )
          )
        `)
        .eq('patient_id', initialPatient.id)
        .order('consultation_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoadingConsultations(false);
    }
  }

  async function fetchEnhancedData() {
    try {
      const [insResponse, historyResponse, allergiesResponse] = await Promise.all([
        supabase
          .from('patient_ins_identity')
          .select('*')
          .eq('patient_id', initialPatient.id)
          .maybeSingle(),
        supabase
          .from('patient_medical_history')
          .select(`
            *,
            recorded_by_user:user_profiles!recorded_by(full_name),
            verified_by_user:user_profiles!verified_by(full_name)
          `)
          .eq('patient_id', initialPatient.id)
          .order('diagnosis_date', { ascending: false }),
        supabase
          .from('patient_allergies_detailed')
          .select(`
            *,
            recorded_by_user:user_profiles!recorded_by(full_name),
            verified_by_user:user_profiles!verified_by(full_name)
          `)
          .eq('patient_id', initialPatient.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!insResponse.error && insResponse.data) {
        setInsIdentity(insResponse.data);
      }
      if (!historyResponse.error && historyResponse.data) {
        setMedicalHistory(historyResponse.data);
      }
      if (!allergiesResponse.error && allergiesResponse.data) {
        setAllergies(allergiesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching enhanced data:', error);
    } finally {
      setLoadingEnhancedData(false);
    }
  }

  function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  function handleConsultationClick(consultationId: string) {
    onClose();
    navigate('/staff/consultations', { state: { consultationId } });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Détails du Patient</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <PatientExportActionsBar
            patientId={patient.id}
            patientNumber={patient.patient_number}
            onSuccess={(message) => showToast(message, 'success')}
            onError={(message) => showToast(message, 'error')}
          />

          <div className="flex gap-2 overflow-x-auto px-6 py-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('ins')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ins'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Identité INS
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Antécédents
            </button>
            <button
              onClick={() => setActiveTab('allergies')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'allergies'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Allergies
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'consultations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Consultations
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-gray-200 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {patient.profile_photo_url ? (
                  <img
                    src={patient.profile_photo_url}
                    alt={`${patient.first_name} ${patient.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-2xl font-bold">
                    {generateInitials(patient.first_name, patient.last_name)}
                  </div>
                )}
              </div>
              {patient.blood_group && (
                <div className="absolute -bottom-2 -right-2">
                  <Badge variant={patient.blood_group as any} size="sm">
                    {patient.blood_group}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h3>
              <p className="text-gray-600 font-mono text-sm">N° {patient.patient_number}</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-500">
                  {calculateAge(patient.date_of_birth)} ans
                </p>
                <span className="text-gray-300">•</span>
                <p className="text-sm text-gray-500">
                  {patient.gender === 'male' ? 'Masculin' : patient.gender === 'female' ? 'Féminin' : 'Autre'}
                </p>
              </div>
            </div>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              Modifier
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date de Naissance</p>
                    <p className="font-medium text-gray-900">
                      {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Droplet className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Groupe Sanguin</p>
                    <p className="font-medium text-gray-900">{patient.blood_group || 'Non spécifié'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900">{patient.phone || 'Non spécifié'}</p>
                  </div>
                </div>

                {patient.email && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{patient.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="font-medium text-gray-900">
                      {patient.address || 'Non spécifié'}
                      {patient.city && `, ${patient.city}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact d'Urgence</h4>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{patient.emergency_contact_name}</p>
                      {patient.emergency_contact_relationship && (
                        <p className="text-sm text-gray-600">{patient.emergency_contact_relationship}</p>
                      )}
                      <p className="text-sm text-gray-900 mt-1">{patient.emergency_contact_phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Médecin Traitant
              </h4>
              {loadingPhysician ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <PhysicianBadgeCard
                  physician={patient.primary_care_physician ? {
                    id: patient.primary_care_physician.id,
                    name: formatDoctorName(patient.primary_care_physician.user_profile?.full_name),
                    specialization: patient.primary_care_physician.specialization,
                    rpps_number: patient.primary_care_physician.license_number,
                    email: null,
                    phone: patient.primary_care_physician.user_profile?.phone || null,
                    department: null
                  } : null}
                  onChangePhysician={() => {
                    onClose();
                    onEdit();
                  }}
                />
              )}
            </div>

            {(patient.insurance_provider || patient.insurance_number) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Assurance</h4>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-2">
                    {patient.insurance_provider && (
                      <div>
                        <p className="text-sm text-gray-600">Fournisseur</p>
                        <p className="font-medium text-gray-900">{patient.insurance_provider}</p>
                      </div>
                    )}
                    {patient.insurance_number && (
                      <div>
                        <p className="text-sm text-gray-600">Numéro</p>
                        <p className="font-medium text-gray-900">{patient.insurance_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(patient.allergies || patient.chronic_conditions) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations Médicales</h4>
                <div className="space-y-3">
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Heart className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">Allergies</p>
                          <p className="text-sm text-red-700 mt-1">{patient.allergies.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">Conditions Chroniques</p>
                          <p className="text-sm text-yellow-700 mt-1">{patient.chronic_conditions.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Historique des Consultations
              </h4>
              {loadingConsultations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : consultations.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Aucune consultation enregistrée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {consultations.map((consultation) => (
                    <button
                      key={consultation.id}
                      onClick={() => handleConsultationClick(consultation.id)}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                              Consultation ID: {consultation.id.substring(0, 8)}...
                            </span>
                            <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <p className="text-sm text-gray-900 font-medium mb-1">
                            {consultation.chief_complaint || 'Consultation générale'}
                          </p>

                          {consultation.diagnosis && (
                            <p className="text-xs text-gray-600 mb-2">
                              <span className="font-semibold">Diagnostic:</span> {consultation.diagnosis}
                            </p>
                          )}

                          {consultation.vital_signs && Object.keys(consultation.vital_signs).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {consultation.vital_signs.blood_pressure && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  TA: {consultation.vital_signs.blood_pressure}
                                </span>
                              )}
                              {consultation.vital_signs.heart_rate && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  FC: {consultation.vital_signs.heart_rate} bpm
                                </span>
                              )}
                              {consultation.vital_signs.temperature && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                  T°: {consultation.vital_signs.temperature}°C
                                </span>
                              )}
                            </div>
                          )}

                          {consultation.treatment_plan && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              <span className="font-semibold">Traitement:</span> {consultation.treatment_plan}
                            </p>
                          )}

                          {consultation.follow_up_date && (
                            <p className="text-xs text-purple-600 mb-2">
                              <span className="font-semibold">Suivi:</span> {new Date(consultation.follow_up_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-200">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(consultation.consultation_date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            {consultation.doctor?.user_profile && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" />
                                {formatDoctorName(consultation.doctor.user_profile.full_name)}
                              </span>
                            )}
                            {consultation.doctor?.specialization && (
                              <span className="text-blue-600">
                                ({consultation.doctor.specialization})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
            </>
          )}

          {activeTab === 'ins' && (
            <div>
              <INSIdentitySection insIdentity={insIdentity} loading={loadingEnhancedData} />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Antécédents Médicaux</h3>
              <MedicalHistorySection medicalHistory={medicalHistory} loading={loadingEnhancedData} />
            </div>
          )}

          {activeTab === 'allergies' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergies et Intolérances</h3>
              <AllergiesSection allergies={allergies} loading={loadingEnhancedData} />
            </div>
          )}

          {activeTab === 'consultations' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des Consultations</h3>
              {loadingConsultations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : consultations.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Aucune consultation enregistrée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {consultations.map((consultation) => (
                    <button
                      key={consultation.id}
                      onClick={() => handleConsultationClick(consultation.id)}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                              Consultation ID: {consultation.id.substring(0, 8)}...
                            </span>
                            <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <p className="text-sm text-gray-900 font-medium mb-1">
                            {consultation.chief_complaint || 'Consultation générale'}
                          </p>

                          {consultation.diagnosis && (
                            <p className="text-xs text-gray-600 mb-2">
                              <span className="font-semibold">Diagnostic:</span> {consultation.diagnosis}
                            </p>
                          )}

                          {consultation.vital_signs && Object.keys(consultation.vital_signs).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {consultation.vital_signs.blood_pressure && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  TA: {consultation.vital_signs.blood_pressure}
                                </span>
                              )}
                              {consultation.vital_signs.heart_rate && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  FC: {consultation.vital_signs.heart_rate} bpm
                                </span>
                              )}
                              {consultation.vital_signs.temperature && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                  T°: {consultation.vital_signs.temperature}°C
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-200">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(consultation.consultation_date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            {consultation.doctor?.user_profile && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" />
                                {formatDoctorName(consultation.doctor.user_profile.full_name)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
