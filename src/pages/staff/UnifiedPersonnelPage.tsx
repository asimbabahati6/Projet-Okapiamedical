import { useState } from 'react';
import { Users, TrendingUp, AlertCircle, CheckCircle, X, User, Briefcase, Stethoscope, Phone, Mail, MapPin, Calendar, Award, DollarSign, FileText } from 'lucide-react';
import { UnifiedEmployeeDirectory } from '../../components/unified/UnifiedEmployeeDirectory';
import { UnifiedEmployee } from '../../types/unifiedPersonnel';

export default function UnifiedPersonnelPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<UnifiedEmployee | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  function handleEmployeeSelect(employee: UnifiedEmployee) {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setSelectedEmployee(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Gestion Unifiée du Personnel
          </h1>
          <p className="text-gray-600 mt-2">
            Vue 360° de tous vos employés - Personnel médical et administratif centralisé
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">Système de Gestion Intégré</h3>
          <p className="text-sm text-blue-800 mt-1">
            Cette interface combine les données RH (contrats, salaires, présence) et médicales (spécialités, credentials)
            en une vue unifiée. Chaque employé peut avoir un profil médical, administratif, ou les deux (hybride).
          </p>
        </div>
      </div>

      {/* Main Directory */}
      <UnifiedEmployeeDirectory onEmployeeSelect={handleEmployeeSelect} />

      {/* Employee Details Modal */}
      {detailsOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.full_name}</h2>
                  <p className="text-gray-600">{selectedEmployee.role_name || 'Sans rôle'}</p>
                </div>
              </div>
              <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status & Profile Type */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedEmployee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedEmployee.is_active ? '✓ Actif' : 'Inactif'}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedEmployee.profile_type === 'hybrid' ? 'bg-purple-100 text-purple-800' :
                  selectedEmployee.profile_type === 'medical' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedEmployee.profile_type === 'hybrid' ? '🏥 Profil Hybride (Médical + RH)' :
                   selectedEmployee.profile_type === 'medical' ? '⚕️ Personnel Médical' :
                   '💼 Personnel Administratif'}
                </span>
                <div className="ml-auto">
                  <div className="text-sm text-gray-600 text-right mb-1">
                    Complétude du profil
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          selectedEmployee.profile_completeness >= 80 ? 'bg-green-500' :
                          selectedEmployee.profile_completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedEmployee.profile_completeness}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedEmployee.profile_completeness}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Informations de Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedEmployee.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedEmployee.phone}</span>
                    </div>
                  )}
                  {selectedEmployee.department_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedEmployee.department_name}</span>
                    </div>
                  )}
                  {selectedEmployee.department_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Dép: {selectedEmployee.department_phone}</span>
                    </div>
                  )}
                  {selectedEmployee.department_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedEmployee.department_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* HR Employee Data */}
              {selectedEmployee.is_hr_employee && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    Informations RH
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmployee.employee_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">N° Employé:</span>
                        <span className="font-medium text-gray-900">{selectedEmployee.employee_number}</span>
                      </div>
                    )}
                    {selectedEmployee.hire_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Embauché le:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedEmployee.hire_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {selectedEmployee.contract_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Type contrat:</span>
                        <span className="font-medium text-gray-900 capitalize">{selectedEmployee.contract_type}</span>
                      </div>
                    )}
                    {selectedEmployee.employment_status && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Statut:</span>
                        <span className="font-medium text-gray-900 capitalize">{selectedEmployee.employment_status}</span>
                      </div>
                    )}
                    {selectedEmployee.salary_amount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Salaire:</span>
                        <span className="font-medium text-gray-900">
                          {selectedEmployee.salary_amount.toLocaleString()} {selectedEmployee.salary_currency}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  {selectedEmployee.emergency_contact_name && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Contact d'Urgence</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Nom: </span>
                          <span className="font-medium text-gray-900">{selectedEmployee.emergency_contact_name}</span>
                        </div>
                        {selectedEmployee.emergency_contact_phone && (
                          <div className="text-sm">
                            <span className="text-gray-600">Tél: </span>
                            <span className="font-medium text-gray-900">{selectedEmployee.emergency_contact_phone}</span>
                          </div>
                        )}
                        {selectedEmployee.emergency_contact_relationship && (
                          <div className="text-sm">
                            <span className="text-gray-600">Relation: </span>
                            <span className="font-medium text-gray-900">{selectedEmployee.emergency_contact_relationship}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Medical Staff Data */}
              {selectedEmployee.is_medical_staff && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    Informations Médicales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmployee.specialization && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Spécialité:</span>
                        <span className="font-medium text-gray-900">{selectedEmployee.specialization}</span>
                      </div>
                    )}
                    {selectedEmployee.license_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">N° Licence:</span>
                        <span className="font-medium text-gray-900">{selectedEmployee.license_number}</span>
                      </div>
                    )}
                    {selectedEmployee.years_of_experience !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Expérience:</span>
                        <span className="font-medium text-gray-900">{selectedEmployee.years_of_experience} ans</span>
                      </div>
                    )}
                    {selectedEmployee.consultation_fee && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Tarif consultation:</span>
                        <span className="font-medium text-gray-900">{selectedEmployee.consultation_fee} USD</span>
                      </div>
                    )}
                  </div>

                  {/* Professional Credentials */}
                  {(selectedEmployee.rpps_number || selectedEmployee.adeli_number) && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Credentials Professionnels</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedEmployee.rpps_number && (
                          <div className="text-sm">
                            <span className="text-gray-600">RPPS: </span>
                            <span className="font-medium text-gray-900">{selectedEmployee.rpps_number}</span>
                          </div>
                        )}
                        {selectedEmployee.adeli_number && (
                          <div className="text-sm">
                            <span className="text-gray-600">ADELI: </span>
                            <span className="font-medium text-gray-900">{selectedEmployee.adeli_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  {(selectedEmployee.total_consultations || selectedEmployee.average_rating) && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Performance</p>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedEmployee.total_consultations && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{selectedEmployee.total_consultations}</p>
                            <p className="text-xs text-gray-600">Consultations</p>
                          </div>
                        )}
                        {selectedEmployee.average_rating && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{selectedEmployee.average_rating.toFixed(1)} ⭐</p>
                            <p className="text-xs text-gray-600">Note Moyenne</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Capabilities */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedEmployee.is_accepting_patients && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        ✓ Accepte nouveaux patients
                      </span>
                    )}
                    {selectedEmployee.telemedicine_enabled && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        ✓ Télémédecine
                      </span>
                    )}
                    {selectedEmployee.can_prescribe_controlled_substances && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        ✓ Prescription substances contrôlées
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-gray-500 flex items-center justify-between pt-4 border-t border-gray-200">
                <span>
                  Créé le {new Date(selectedEmployee.profile_created_at).toLocaleDateString('fr-FR')}
                </span>
                <span>
                  Modifié le {new Date(selectedEmployee.profile_updated_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
