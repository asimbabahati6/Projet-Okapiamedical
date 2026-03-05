import { useState } from 'react';
import { FileText, Plus, Users, Zap, Download } from 'lucide-react';
import { EnhancedDocumentGenerator } from '../../components/documents/EnhancedDocumentGenerator';
import { DocumentTypeSelector } from '../../components/documents/DocumentTypeSelector';
import { PatientDocumentList } from '../../components/documents/PatientDocumentList';
import { DocumentGenerationTable } from '../../components/documents/DocumentGenerationTable';
import { BulkGenerationModal } from '../../components/documents/BulkGenerationModal';
import { PatientWithDocuments } from '../../types/medicalDocuments';

export function DocumentsPage() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithDocuments | undefined>();
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [filterDocumentType, setFilterDocumentType] = useState<string>('');

  const handleSelectPatient = (patient: PatientWithDocuments, documentType: string) => {
    setSelectedPatient(patient);
    setSelectedDocumentType(documentType);
    setShowGenerator(true);
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
    setSelectedPatient(undefined);
    setSelectedDocumentType('');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents Médicaux</h1>
            <p className="mt-1 text-sm text-gray-500">
              Générez des documents professionnels avec le branding OKAPIA MEDICAL
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2 shadow-md"
            >
              <Zap className="w-5 h-5" />
              Génération en Masse
            </button>
            <button
              onClick={() => setShowGenerator(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Nouveau Document
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <DocumentGenerationTable />
      </div>

      <div className="mb-6">
        <DocumentTypeSelector
          selectedType={filterDocumentType}
          onSelectType={setFilterDocumentType}
        />
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Patients avec Documents Assignés</h3>
            <p className="text-sm text-blue-800">
              Sélectionnez un patient et un type de document pour générer un nouveau document médical.
              Chaque document sera automatiquement sauvegardé avec l'historique complet des actions.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Formats d'Export Disponibles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900">PDF</h5>
                <p className="text-xs text-gray-500">Format universel pour impression et partage</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-13">
              <li>• En-tête OKAPIA MEDICAL sur chaque page</li>
              <li>• Formatage professionnel</li>
              <li>• Prêt à imprimer</li>
              <li>• Téléchargement instantané</li>
            </ul>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Word (DOCX)</h5>
                <p className="text-xs text-gray-500">Format éditable pour modifications</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-13">
              <li>• En-tête et pied de page automatiques</li>
              <li>• Styles professionnels</li>
              <li>• Modifiable après export</li>
              <li>• Compatible Microsoft Word</li>
            </ul>
          </div>
        </div>
      </div>

      <PatientDocumentList
        onSelectPatient={handleSelectPatient}
        selectedDocumentType={filterDocumentType}
      />

      {showGenerator && (
        <EnhancedDocumentGenerator
          onClose={handleCloseGenerator}
          patient={selectedPatient}
          documentType={selectedDocumentType}
        />
      )}

      {showBulkModal && (
        <BulkGenerationModal onClose={() => setShowBulkModal(false)} />
      )}
    </div>
  );
}
