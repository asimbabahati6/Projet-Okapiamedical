import { Activity, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { PatientMedicalHistory } from '../../types/database';
import { getSeverityColor, getStatusColor } from '../../utils/medicalCodes';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface MedicalHistorySectionProps {
  medicalHistory: PatientMedicalHistory[];
  loading?: boolean;
}

export function MedicalHistorySection({ medicalHistory, loading = false }: MedicalHistorySectionProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (medicalHistory.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Aucun antécédent médical enregistré</p>
      </div>
    );
  }

  const activeConditions = medicalHistory.filter(h =>
    h.status === 'actif' || h.status === 'chronique' || h.status === 'récurrent'
  );
  const resolvedConditions = medicalHistory.filter(h =>
    h.status === 'résolu' || h.status === 'rémission'
  );

  return (
    <div className="space-y-4">
      {activeConditions.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-600" />
            Conditions Actives ({activeConditions.length})
          </h5>
          <div className="space-y-2">
            {activeConditions.map((condition) => (
              <div
                key={condition.id}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h6 className="text-sm font-semibold text-gray-900">{condition.condition_name}</h6>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(condition.status)}`}>
                        {condition.status.charAt(0).toUpperCase() + condition.status.slice(1)}
                      </span>
                      {condition.severity && (
                        <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(condition.severity)}`}>
                          {condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1)}
                        </span>
                      )}
                    </div>

                    {condition.icd10_code && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded border border-blue-200">
                          CIM-10: {condition.icd10_code}
                        </span>
                        {condition.icd10_description && (
                          <span className="text-xs text-gray-600">{condition.icd10_description}</span>
                        )}
                      </div>
                    )}

                    {condition.clinical_notes && (
                      <p className="text-xs text-gray-700 mb-2">{condition.clinical_notes}</p>
                    )}

                    {condition.treatment_current && (
                      <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded mt-2">
                        <FileText className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-green-700 font-medium">Traitement actuel:</p>
                          <p className="text-xs text-green-800">{condition.treatment_current}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {condition.diagnosis_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Diagnostic: {new Date(condition.diagnosis_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {condition.recorded_by_user && (
                        <span>Par: {formatDoctorName(condition.recorded_by_user.full_name)}</span>
                      )}
                    </div>
                  </div>

                  {(condition.severity === 'sévère' || condition.severity === 'critique') && (
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolvedConditions.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Conditions Résolues ({resolvedConditions.length})
          </h5>
          <div className="space-y-2">
            {resolvedConditions.map((condition) => (
              <div
                key={condition.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h6 className="text-sm font-medium text-gray-700">{condition.condition_name}</h6>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(condition.status)}`}>
                        {condition.status.charAt(0).toUpperCase() + condition.status.slice(1)}
                      </span>
                    </div>

                    {condition.icd10_code && (
                      <span className="text-xs bg-gray-100 text-gray-600 font-mono px-2 py-0.5 rounded">
                        CIM-10: {condition.icd10_code}
                      </span>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {condition.diagnosis_date && (
                        <span>
                          Diagnostic: {new Date(condition.diagnosis_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {condition.resolution_date && (
                        <span>
                          Résolu: {new Date(condition.resolution_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
