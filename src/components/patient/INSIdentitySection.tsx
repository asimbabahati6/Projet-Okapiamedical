import { Shield, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { PatientINSIdentity } from '../../types/database';
import { formatINSQualificationStatus, getINSQualificationColor } from '../../utils/medicalCodes';

interface INSIdentitySectionProps {
  insIdentity: PatientINSIdentity | null;
  loading?: boolean;
}

export function INSIdentitySection({ insIdentity, loading = false }: INSIdentitySectionProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!insIdentity) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-900 mb-1">
              Identité INS Non Configurée
            </h4>
            <p className="text-xs text-yellow-700">
              L'identité nationale de santé (INS) n'a pas encore été enregistrée pour ce patient.
              Veuillez compléter les informations INS pour garantir la conformité réglementaire.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function getQualificationIcon() {
    switch (insIdentity.qualification_status) {
      case 'qualifié':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'provisoire':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'en_cours_validation':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'non_qualifié':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            Identité Nationale de Santé (INS)
          </h4>
          <p className="text-xs text-gray-600">
            Système d'identification national conforme aux standards français
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-1">Numéro INS</p>
          <p className="text-lg font-mono font-bold text-blue-900">
            {insIdentity.ins_number || 'Non attribué'}
          </p>
          {insIdentity.oid && (
            <p className="text-xs text-blue-600 mt-1">OID: {insIdentity.oid}</p>
          )}
        </div>

        <div className={`p-4 border rounded-lg ${getINSQualificationColor(insIdentity.qualification_status)}`}>
          <div className="flex items-center gap-2 mb-1">
            {getQualificationIcon()}
            <p className="text-xs font-medium">Statut de Qualification</p>
          </div>
          <p className="text-lg font-semibold">
            {formatINSQualificationStatus(insIdentity.qualification_status)}
          </p>
          {insIdentity.validation_date && (
            <p className="text-xs mt-1">
              Validé le {new Date(insIdentity.validation_date).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      {insIdentity.ins_c_matricule && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Matricule INS-C</p>
          <p className="text-sm font-mono font-semibold text-gray-900">
            {insIdentity.ins_c_matricule}
          </p>
        </div>
      )}

      {(insIdentity.issuing_organization || insIdentity.verification_method) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insIdentity.issuing_organization && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Organisme Émetteur</p>
              <p className="text-sm font-medium text-gray-900">
                {insIdentity.issuing_organization}
              </p>
              {insIdentity.issuing_organization_oid && (
                <p className="text-xs text-gray-600 mt-1">
                  OID: {insIdentity.issuing_organization_oid}
                </p>
              )}
            </div>
          )}

          {insIdentity.verification_method && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Méthode de Vérification</p>
              <p className="text-sm font-medium text-gray-900">
                {insIdentity.verification_method}
              </p>
              {insIdentity.last_verification_date && (
                <p className="text-xs text-gray-600 mt-1">
                  Dernière vérification: {new Date(insIdentity.last_verification_date).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {insIdentity.verification_notes && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-1">Notes de Vérification</p>
          <p className="text-sm text-blue-900">{insIdentity.verification_notes}</p>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <Shield className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-gray-900 mb-1">Conformité Réglementaire</p>
          <p className="text-xs text-gray-600">
            Les données INS sont conformes aux standards de l'Agence du Numérique en Santé (ANS)
            et respectent les exigences d'identitovigilance du système de santé français.
          </p>
        </div>
      </div>
    </div>
  );
}
