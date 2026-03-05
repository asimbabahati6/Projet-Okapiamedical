import { AlertTriangle, Heart, ShieldAlert } from 'lucide-react';
import { PatientAllergyDetailed } from '../../types/database';
import { getSeverityColor, getStatusColor, getAllergyTypeIcon } from '../../utils/medicalCodes';

interface AllergiesSectionProps {
  allergies: PatientAllergyDetailed[];
  loading?: boolean;
}

export function AllergiesSection({ allergies, loading = false }: AllergiesSectionProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (allergies.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <Heart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Aucune allergie connue</p>
      </div>
    );
  }

  const activeAllergies = allergies.filter(a => a.status === 'actif' || a.status === 'confirmé');
  const inactiveAllergies = allergies.filter(a => a.status === 'résolu' || a.status === 'suspecté');
  const severeAllergies = activeAllergies.filter(a => a.severity === 'sévère' || a.severity === 'anaphylaxie');

  return (
    <div className="space-y-4">
      {severeAllergies.length > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-bold text-red-900 mb-1">
                ALERTE: Allergies Sévères
              </h5>
              <p className="text-xs text-red-800">
                Ce patient présente {severeAllergies.length} allergie{severeAllergies.length > 1 ? 's' : ''} sévère{severeAllergies.length > 1 ? 's' : ''}.
                Vérifier avant toute prescription ou intervention.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeAllergies.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Allergies Actives ({activeAllergies.length})
          </h5>
          <div className="space-y-2">
            {activeAllergies.map((allergy) => (
              <div
                key={allergy.id}
                className={`p-4 border-2 rounded-lg ${
                  allergy.severity === 'sévère' || allergy.severity === 'anaphylaxie'
                    ? 'bg-red-50 border-red-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {getAllergyTypeIcon(allergy.allergy_type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h6 className="text-sm font-bold text-gray-900">{allergy.allergen_name}</h6>
                      <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${getSeverityColor(allergy.severity)}`}>
                        {allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {allergy.allergy_type.charAt(0).toUpperCase() + allergy.allergy_type.slice(1)}
                      </span>
                    </div>

                    {allergy.reaction_description && (
                      <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-xs text-orange-700 font-medium mb-0.5">Réaction:</p>
                        <p className="text-xs text-orange-900">{allergy.reaction_description}</p>
                      </div>
                    )}

                    {allergy.snomed_code && (
                      <div className="mb-2">
                        <span className="text-xs bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded border border-blue-200">
                          SNOMED CT: {allergy.snomed_code}
                        </span>
                      </div>
                    )}

                    {allergy.treatment_administered && (
                      <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-green-700 font-medium mb-0.5">Traitement administré:</p>
                        <p className="text-xs text-green-800">{allergy.treatment_administered}</p>
                      </div>
                    )}

                    {allergy.clinical_notes && (
                      <p className="text-xs text-gray-700 mb-2">{allergy.clinical_notes}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {allergy.first_occurrence_date && (
                        <span>
                          Première occurrence: {new Date(allergy.first_occurrence_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {allergy.last_occurrence_date && (
                        <span>
                          Dernière: {new Date(allergy.last_occurrence_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {(allergy.severity === 'sévère' || allergy.severity === 'anaphylaxie') && (
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveAllergies.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3">
            Autres Allergies ({inactiveAllergies.length})
          </h5>
          <div className="space-y-2">
            {inactiveAllergies.map((allergy) => (
              <div
                key={allergy.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl opacity-50 flex-shrink-0">
                    {getAllergyTypeIcon(allergy.allergy_type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h6 className="text-sm font-medium text-gray-700">{allergy.allergen_name}</h6>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(allergy.status)}`}>
                        {allergy.status.charAt(0).toUpperCase() + allergy.status.slice(1)}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {allergy.allergy_type}
                      </span>
                    </div>

                    {allergy.first_occurrence_date && (
                      <p className="text-xs text-gray-500">
                        Première occurrence: {new Date(allergy.first_occurrence_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
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
