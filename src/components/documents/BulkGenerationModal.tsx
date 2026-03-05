import { useState } from 'react';
import { X, Download, Loader2, Check, FileText, FileArchive } from 'lucide-react';
import { DOCUMENT_TYPE_LIST, DocumentTypeConfig } from '../../config/documentTypes';
import { getMockPatientByIndex } from '../../utils/mockPatients';
import { generateDocumentContent } from '../../utils/documentContentGenerator';
import { exportMedicalDocumentToPDF, exportMedicalDocumentToWord, MedicalDocumentData } from '../../utils/medicalDocumentExport';
import { useToast } from '../../hooks/useToast';

interface BulkGenerationModalProps {
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'word' | 'both';

interface GenerationProgress {
  current: number;
  total: number;
  currentDocument: string;
  status: 'idle' | 'generating' | 'complete' | 'error';
}

export function BulkGenerationModal({ onClose }: BulkGenerationModalProps) {
  const { success, error: showError } = useToast();
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<ExportFormat>('both');
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    currentDocument: '',
    status: 'idle',
  });

  const handleSelectAll = () => {
    if (selectedTypes.size === DOCUMENT_TYPE_LIST.length) {
      setSelectedTypes(new Set());
    } else {
      setSelectedTypes(new Set(DOCUMENT_TYPE_LIST.map(d => d.type)));
    }
  };

  const handleToggleType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const handleGenerate = async () => {
    if (selectedTypes.size === 0) {
      showError('Veuillez sélectionner au moins un type de document');
      return;
    }

    const selectedDocs = DOCUMENT_TYPE_LIST.filter(d => selectedTypes.has(d.type));
    const totalDocs = selectedDocs.length * (exportFormat === 'both' ? 2 : 1);

    setProgress({
      current: 0,
      total: totalDocs,
      currentDocument: '',
      status: 'generating',
    });

    try {
      let currentIndex = 0;

      for (let i = 0; i < selectedDocs.length; i++) {
        const docType = selectedDocs[i];
        const patient = getMockPatientByIndex(i);
        const sections = generateDocumentContent(docType.type, patient);

        const documentData: MedicalDocumentData = {
          title: docType.name,
          patientName: `${patient.first_name} ${patient.last_name}`,
          patientNumber: patient.patient_number,
          documentDate: new Date().toLocaleDateString('fr-FR'),
          sections,
        };

        if (exportFormat === 'pdf' || exportFormat === 'both') {
          setProgress(prev => ({
            ...prev,
            current: currentIndex + 1,
            currentDocument: `${docType.name} - ${patient.first_name} ${patient.last_name}.pdf`,
          }));

          await new Promise(resolve => setTimeout(resolve, 300));
          exportMedicalDocumentToPDF(documentData);
          currentIndex++;
        }

        if (exportFormat === 'word' || exportFormat === 'both') {
          setProgress(prev => ({
            ...prev,
            current: currentIndex + 1,
            currentDocument: `${docType.name} - ${patient.first_name} ${patient.last_name}.docx`,
          }));

          await new Promise(resolve => setTimeout(resolve, 300));
          await exportMedicalDocumentToWord(documentData);
          currentIndex++;
        }
      }

      setProgress({
        current: totalDocs,
        total: totalDocs,
        currentDocument: 'Terminé!',
        status: 'complete',
      });

      success(`${totalDocs} document(s) générés avec succès!`);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error generating documents:', err);
      setProgress(prev => ({ ...prev, status: 'error' }));
      showError('Erreur lors de la génération des documents');
    }
  };

  const isGenerating = progress.status === 'generating';
  const isComplete = progress.status === 'complete';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileArchive className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Génération en Masse</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {progress.status === 'idle' && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sélectionner les Types de Documents
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedTypes.size === DOCUMENT_TYPE_LIST.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DOCUMENT_TYPE_LIST.map(docType => {
                    const Icon = docType.icon;
                    const isSelected = selectedTypes.has(docType.type);

                    return (
                      <button
                        key={docType.type}
                        onClick={() => handleToggleType(docType.type)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? `${docType.bgColor} ${docType.borderColor} shadow-md`
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <Icon
                              className="w-5 h-5"
                              style={{ color: isSelected ? docType.color : '#6B7280' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isSelected ? 'font-semibold' : 'text-gray-700'
                              }`}
                              style={isSelected ? { color: docType.color } : {}}
                            >
                              {docType.name}
                            </p>
                          </div>
                          {isSelected && (
                            <Check
                              className="w-5 h-5 flex-shrink-0"
                              style={{ color: docType.color }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedTypes.size > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">{selectedTypes.size}</span> type(s) sélectionné(s)
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Format d'Export</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      exportFormat === 'pdf'
                        ? 'bg-red-50 border-red-300 shadow-md'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FileText
                      className={`w-6 h-6 mx-auto mb-2 ${
                        exportFormat === 'pdf' ? 'text-red-600' : 'text-gray-400'
                      }`}
                    />
                    <p
                      className={`text-sm font-medium text-center ${
                        exportFormat === 'pdf' ? 'text-red-900' : 'text-gray-700'
                      }`}
                    >
                      PDF uniquement
                    </p>
                  </button>

                  <button
                    onClick={() => setExportFormat('word')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      exportFormat === 'word'
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Download
                      className={`w-6 h-6 mx-auto mb-2 ${
                        exportFormat === 'word' ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <p
                      className={`text-sm font-medium text-center ${
                        exportFormat === 'word' ? 'text-blue-900' : 'text-gray-700'
                      }`}
                    >
                      Word uniquement
                    </p>
                  </button>

                  <button
                    onClick={() => setExportFormat('both')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      exportFormat === 'both'
                        ? 'bg-green-50 border-green-300 shadow-md'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <FileArchive
                      className={`w-6 h-6 mx-auto mb-2 ${
                        exportFormat === 'both' ? 'text-green-600' : 'text-gray-400'
                      }`}
                    />
                    <p
                      className={`text-sm font-medium text-center ${
                        exportFormat === 'both' ? 'text-green-900' : 'text-gray-700'
                      }`}
                    >
                      PDF + Word
                    </p>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Résumé</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>• Documents à générer: <span className="font-semibold">{selectedTypes.size}</span></p>
                  <p>• Format: <span className="font-semibold">
                    {exportFormat === 'pdf' ? 'PDF' : exportFormat === 'word' ? 'Word' : 'PDF + Word'}
                  </span></p>
                  <p>• Fichiers totaux: <span className="font-semibold">
                    {selectedTypes.size * (exportFormat === 'both' ? 2 : 1)}
                  </span></p>
                </div>
              </div>
            </>
          )}

          {(isGenerating || isComplete) && (
            <div className="py-8">
              <div className="text-center mb-6">
                {isComplete ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isComplete ? 'Génération Terminée!' : 'Génération en Cours...'}
                </h3>
                <p className="text-gray-600">
                  {progress.current} / {progress.total} fichiers
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progression</span>
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isComplete ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              {progress.currentDocument && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    {isComplete ? 'Dernier fichier:' : 'Fichier en cours:'}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{progress.currentDocument}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {progress.status === 'idle' && (
          <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleGenerate}
              disabled={selectedTypes.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Générer {selectedTypes.size > 0 && `(${selectedTypes.size * (exportFormat === 'both' ? 2 : 1)})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
