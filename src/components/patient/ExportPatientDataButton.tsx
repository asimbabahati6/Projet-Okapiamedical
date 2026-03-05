import { useState } from 'react';
import { Download, FileJson, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface ExportPatientDataButtonProps {
  patientId: string;
  patientName: string;
}

export function ExportPatientDataButton({ patientId, patientName }: ExportPatientDataButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  async function handleExportFHIR() {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/generate-patient-fhir-record?patient_id=${patientId}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export FHIR');
      }

      const fhirData = await response.json();

      const blob = new Blob([JSON.stringify(fhirData, null, 2)], {
        type: 'application/fhir+json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fiche-patient-${patientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Fiche patient exportée au format FHIR avec succès', 'success');
      setShowModal(false);
    } catch (error) {
      console.error('Error exporting FHIR:', error);
      showToast('Erreur lors de l\'export de la fiche patient', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportJSON() {
    setIsExporting(true);
    try {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          primary_care_physician:medical_staff!primary_care_physician_id(
            id,
            license_number,
            specialization,
            user_profile:user_profiles(full_name, phone)
          )
        `)
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      const { data: insIdentity } = await supabase
        .from('patient_ins_identity')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      const { data: medicalHistory } = await supabase
        .from('patient_medical_history')
        .select('*')
        .eq('patient_id', patientId);

      const { data: familyHistory } = await supabase
        .from('patient_family_history')
        .select('*')
        .eq('patient_id', patientId);

      const { data: allergies } = await supabase
        .from('patient_allergies_detailed')
        .select('*')
        .eq('patient_id', patientId);

      const { data: riskFactors } = await supabase
        .from('patient_risk_factors')
        .select('*')
        .eq('patient_id', patientId);

      const { data: consents } = await supabase
        .from('patient_consents')
        .select('*')
        .eq('patient_id', patientId);

      const { data: advanceDirectives } = await supabase
        .from('patient_advance_directives')
        .select('*')
        .eq('patient_id', patientId);

      const { data: consultations } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('consultation_date', { ascending: false });

      const patientRecord = {
        metadata: {
          export_date: new Date().toISOString(),
          system: 'Okapia Hospital Management System',
          version: '1.0',
          conformity: ['HAS', 'CNIL', 'INS', 'FHIR R4'],
        },
        patient_info: patient,
        ins_identity: insIdentity,
        medical_history: medicalHistory,
        family_history: familyHistory,
        allergies: allergies,
        risk_factors: riskFactors,
        consents: consents,
        advance_directives: advanceDirectives,
        consultations: consultations,
      };

      const blob = new Blob([JSON.stringify(patientRecord, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fiche-patient-complete-${patientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await supabase.from('patient_data_access_log').insert({
        patient_id: patientId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        access_type: 'export',
        accessed_sections: ['complete_record'],
        access_reason: 'Complete JSON Export',
      });

      showToast('Fiche patient complète exportée avec succès', 'success');
      setShowModal(false);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      showToast('Erreur lors de l\'export de la fiche patient', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        Exporter Fiche
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Exporter la Fiche Patient
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Choisissez le format d'export conforme aux standards internationaux
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Conformité et Traçabilité
                    </p>
                    <p className="text-xs text-blue-800">
                      Tous les exports sont conformes aux standards français (HAS, CNIL, INS) et
                      internationaux (FHIR R4, HL7). L'accès sera automatiquement tracé dans
                      les journaux d'audit pour conformité RGPD.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportFHIR}
                  disabled={isExporting}
                  className="p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <FileJson className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        Format FHIR R4
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Standard international HL7 FHIR pour interopérabilité
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Conforme FHIR R4</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Profils français (INS)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Interopérable</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExportJSON}
                  disabled={isExporting}
                  className="p-6 border-2 border-green-300 rounded-lg hover:bg-green-50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        Format JSON Complet
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Fiche complète avec toutes les données structurées
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Données complètes</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Structure native</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Facilement lisible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {isExporting && (
                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Export en cours...</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={isExporting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
