import { X, Calendar, User, FileText, Activity, Pill, Edit, Printer, Share2 } from 'lucide-react';
import { Consultation } from '../../types/database';

interface ConsultationDetailsModalProps {
  consultation: Consultation;
  onClose: () => void;
  onEdit?: (consultation: Consultation) => void;
}

export function ConsultationDetailsModal({
  consultation,
  onClose,
  onEdit
}: ConsultationDetailsModalProps) {
  const primaryDiagnosis = consultation.diagnoses?.find(d => d.is_primary);
  const secondaryDiagnoses = consultation.diagnoses?.filter(d => !d.is_primary) || [];

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'reviewed':
        return 'Révisée';
      case 'archived':
        return 'Archivée';
      default:
        return status;
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'initial':
        return 'Première consultation';
      case 'follow_up':
        return 'Suivi';
      case 'emergency':
        return 'Urgence';
      case 'routine':
        return 'Routine';
      case 'telemedicine':
        return 'Télémédecine';
      default:
        return type;
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Détails de la Consultation</h2>
              <p className="text-sm text-gray-600">{consultation.consultation_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(consultation)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Imprimer"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* En-tête */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600 mb-1">Date</div>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {new Date(consultation.consultation_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(consultation.consultation_date).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Statut</div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(consultation.consultation_status)}`}>
                {getStatusLabel(consultation.consultation_status)}
              </span>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Type</div>
              <div className="font-medium text-gray-900">
                {getTypeLabel(consultation.consultation_type)}
              </div>
            </div>
          </div>

          {/* Informations Patient */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Informations Patient
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Nom</div>
                <div className="font-medium text-gray-900">
                  {consultation.patient?.first_name} {consultation.patient?.last_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">N° Patient</div>
                <div className="font-mono font-medium text-gray-900">
                  {consultation.patient?.patient_number}
                </div>
              </div>
            </div>
          </div>

          {/* Motif de consultation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Motif de Consultation</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-900">{consultation.chief_complaint}</p>
            </div>
          </div>

          {/* Histoire de la maladie */}
          {consultation.history_of_present_illness && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Histoire de la Maladie Actuelle</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.history_of_present_illness}</p>
              </div>
            </div>
          )}

          {/* Signes Vitaux */}
          {consultation.vital_signs && Object.keys(consultation.vital_signs).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Signes Vitaux
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {consultation.vital_signs.temperature && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Température</div>
                    <div className="text-lg font-bold text-gray-900">
                      {consultation.vital_signs.temperature}°C
                    </div>
                  </div>
                )}
                {consultation.vital_signs.blood_pressure_systolic && consultation.vital_signs.blood_pressure_diastolic && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Tension Artérielle</div>
                    <div className="text-lg font-bold text-gray-900">
                      {consultation.vital_signs.blood_pressure_systolic}/{consultation.vital_signs.blood_pressure_diastolic}
                    </div>
                  </div>
                )}
                {consultation.vital_signs.heart_rate && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Fréquence Cardiaque</div>
                    <div className="text-lg font-bold text-gray-900">
                      {consultation.vital_signs.heart_rate} bpm
                    </div>
                  </div>
                )}
                {consultation.vital_signs.respiratory_rate && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Fréquence Respiratoire</div>
                    <div className="text-lg font-bold text-gray-900">
                      {consultation.vital_signs.respiratory_rate}/min
                    </div>
                  </div>
                )}
                {consultation.vital_signs.weight && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Poids</div>
                    <div className="text-lg font-bold text-gray-900">
                      {consultation.vital_signs.weight} kg
                    </div>
                  </div>
                )}
                {consultation.vital_signs.height && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Taille</div>
                    <div className="text-lg font-bold text-gray-900">
                      {consultation.vital_signs.height} cm
                    </div>
                  </div>
                )}
                {consultation.bmi && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700 mb-1">IMC</div>
                    <div className="text-lg font-bold text-blue-900">
                      {consultation.bmi}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Examen Physique */}
          {consultation.physical_examination && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Examen Physique</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.physical_examination}</p>
              </div>
            </div>
          )}

          {/* Diagnostics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Diagnostics
            </h3>
            <div className="space-y-3">
              {primaryDiagnosis && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-900 text-xs font-semibold rounded">
                          Diagnostic Principal
                        </span>
                        {!primaryDiagnosis.free_text_diagnosis && primaryDiagnosis.icd10_code && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono font-semibold rounded">
                            {primaryDiagnosis.icd10_code}
                          </span>
                        )}
                        {primaryDiagnosis.free_text_diagnosis && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                            Texte libre
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium">
                        {primaryDiagnosis.icd10_description || primaryDiagnosis.free_text_diagnosis}
                      </p>
                      {primaryDiagnosis.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Note: {primaryDiagnosis.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {secondaryDiagnoses.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Diagnostics Secondaires ({secondaryDiagnoses.length})
                  </div>
                  {secondaryDiagnoses.map((diagnosis, index) => (
                    <div key={diagnosis.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {!diagnosis.free_text_diagnosis && diagnosis.icd10_code && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono font-semibold rounded">
                                {diagnosis.icd10_code}
                              </span>
                            )}
                            {diagnosis.free_text_diagnosis && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                Texte libre
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900">
                            {diagnosis.icd10_description || diagnosis.free_text_diagnosis}
                          </p>
                          {diagnosis.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              Note: {diagnosis.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!primaryDiagnosis && secondaryDiagnoses.length === 0 && (
                <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
                  Aucun diagnostic enregistré
                </div>
              )}
            </div>
          </div>

          {/* Plan de Traitement */}
          {consultation.treatment_plan && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-green-600" />
                Plan de Traitement
              </h3>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{consultation.treatment_plan}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {consultation.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes Additionnelles</h3>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.notes}</p>
              </div>
            </div>
          )}

          {/* Date de Suivi */}
          {consultation.follow_up_date && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Date de Suivi Prévue</div>
                  <div className="text-blue-700">
                    {new Date(consultation.follow_up_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Métadonnées */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Créée le:</span>{' '}
                {new Date(consultation.created_at).toLocaleString('fr-FR')}
              </div>
              <div>
                <span className="font-medium">Dernière modification:</span>{' '}
                {new Date(consultation.updated_at).toLocaleString('fr-FR')}
              </div>
              {consultation.duration_minutes && (
                <div>
                  <span className="font-medium">Durée:</span> {consultation.duration_minutes} minutes
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
          >
            Fermer
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(consultation)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
