import { useState, useMemo } from 'react';
import { FileText, Users, Download, RefreshCw } from 'lucide-react';
import { DOCUMENT_TYPE_LIST, getDocumentTypeConfig } from '../../config/documentTypes';
import { getMockPatientByIndex, getAllMockPatients } from '../../utils/mockPatients';
import { generateDocumentContent } from '../../utils/documentContentGenerator';
import { MedicalDocumentData } from '../../utils/medicalDocumentExport';
import { QuickExportButtons } from './QuickExportButtons';

export function DocumentGenerationTable() {
  const [refreshKey, setRefreshKey] = useState(0);

  const documentAssignments = useMemo(() => {
    return DOCUMENT_TYPE_LIST.map((docType, index) => {
      const patient = getMockPatientByIndex(index);
      const sections = generateDocumentContent(docType.type, patient);

      const documentData: MedicalDocumentData = {
        title: docType.name,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientNumber: patient.patient_number,
        documentDate: new Date().toLocaleDateString('fr-FR'),
        sections,
        footerText: 'Document Confidentiel - Usage Médical Uniquement - OKAPIA MEDICAL',
      };

      return {
        documentType: docType,
        patient,
        documentData,
      };
    });
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Tableau de Génération Rapide</h3>
              <p className="text-sm text-blue-100">
                {DOCUMENT_TYPE_LIST.length} types de documents • Exports PDF et Word disponibles
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
            title="Régénérer avec de nouveaux patients"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Type de Document
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Patient Assigné
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Formats d'Export
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documentAssignments.map((assignment, index) => {
              const Icon = assignment.documentType.icon;

              return (
                <tr
                  key={`${assignment.documentType.type}-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 ${assignment.documentType.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: assignment.documentType.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.documentType.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignment.documentType.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.patient.first_name} {assignment.patient.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignment.patient.patient_number} • {assignment.patient.city}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <QuickExportButtons
                        documentData={assignment.documentData}
                        documentType={assignment.documentType.type}
                        patientName={`${assignment.patient.first_name} ${assignment.patient.last_name}`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>
              <span className="font-semibold text-gray-900">{documentAssignments.length}</span> documents
              prêts à être exportés
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span className="text-xs text-gray-600">PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="text-xs text-gray-600">Word</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
