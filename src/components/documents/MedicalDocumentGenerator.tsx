import { useState } from 'react';
import { FileText, Download, X, Plus, Trash2, Table as TableIcon, List, Type } from 'lucide-react';
import { exportMedicalDocumentToPDF, exportMedicalDocumentToWord, DocumentSection, MedicalDocumentData } from '../../utils/medicalDocumentExport';
import { useToast } from '../../hooks/useToast';

interface MedicalDocumentGeneratorProps {
  onClose: () => void;
  prefilledData?: Partial<MedicalDocumentData>;
}

type SectionType = 'text' | 'table' | 'list';

export function MedicalDocumentGenerator({ onClose, prefilledData }: MedicalDocumentGeneratorProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [documentData, setDocumentData] = useState<MedicalDocumentData>({
    title: prefilledData?.title || '',
    patientName: prefilledData?.patientName || '',
    patientNumber: prefilledData?.patientNumber || '',
    documentDate: prefilledData?.documentDate || new Date().toLocaleDateString('fr-FR'),
    sections: prefilledData?.sections || [],
    footerText: prefilledData?.footerText || '',
  });

  const [currentSection, setCurrentSection] = useState<DocumentSection>({
    title: '',
    content: '',
    type: 'text',
  });

  const [tableHeaders, setTableHeaders] = useState<string[]>(['']);
  const [tableRows, setTableRows] = useState<string[][]>([['']]);

  const handleAddSection = () => {
    if (!currentSection.title) {
      showToast('Veuillez entrer un titre de section', 'error');
      return;
    }

    let sectionToAdd: DocumentSection = { ...currentSection };

    if (currentSection.type === 'table') {
      if (tableHeaders.some(h => !h.trim()) || tableRows.some(row => row.some(cell => !cell.trim()))) {
        showToast('Veuillez remplir toutes les cellules du tableau', 'error');
        return;
      }
      sectionToAdd.tableData = {
        headers: tableHeaders,
        rows: tableRows,
      };
      sectionToAdd.content = '';
    } else if (currentSection.type === 'list') {
      if (typeof currentSection.content === 'string' && !currentSection.content.trim()) {
        showToast('Veuillez entrer du contenu pour la liste', 'error');
        return;
      }
      sectionToAdd.content = typeof currentSection.content === 'string'
        ? currentSection.content.split('\n').filter(line => line.trim())
        : currentSection.content;
    } else {
      if (!currentSection.content || (typeof currentSection.content === 'string' && !currentSection.content.trim())) {
        showToast('Veuillez entrer du contenu', 'error');
        return;
      }
    }

    setDocumentData({
      ...documentData,
      sections: [...documentData.sections, sectionToAdd],
    });

    setCurrentSection({ title: '', content: '', type: 'text' });
    setTableHeaders(['']);
    setTableRows([['']]);
    showToast('Section ajoutée avec succès', 'success');
  };

  const handleRemoveSection = (index: number) => {
    setDocumentData({
      ...documentData,
      sections: documentData.sections.filter((_, i) => i !== index),
    });
    showToast('Section supprimée', 'success');
  };

  const handleExportPDF = async () => {
    if (!documentData.title) {
      showToast('Veuillez entrer un titre de document', 'error');
      return;
    }

    if (documentData.sections.length === 0) {
      showToast('Veuillez ajouter au moins une section', 'error');
      return;
    }

    try {
      setLoading(true);
      exportMedicalDocumentToPDF(documentData);
      showToast('Document PDF généré avec succès', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Erreur lors de la génération du PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = async () => {
    if (!documentData.title) {
      showToast('Veuillez entrer un titre de document', 'error');
      return;
    }

    if (documentData.sections.length === 0) {
      showToast('Veuillez ajouter au moins une section', 'error');
      return;
    }

    try {
      setLoading(true);
      await exportMedicalDocumentToWord(documentData);
      showToast('Document Word généré avec succès', 'success');
    } catch (error) {
      console.error('Error generating Word document:', error);
      showToast('Erreur lors de la génération du document Word', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addTableColumn = () => {
    setTableHeaders([...tableHeaders, '']);
    setTableRows(tableRows.map(row => [...row, '']));
  };

  const addTableRow = () => {
    setTableRows([...tableRows, Array(tableHeaders.length).fill('')]);
  };

  const updateTableHeader = (index: number, value: string) => {
    const newHeaders = [...tableHeaders];
    newHeaders[index] = value;
    setTableHeaders(newHeaders);
  };

  const updateTableCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...tableRows];
    newRows[rowIndex][colIndex] = value;
    setTableRows(newRows);
  };

  const removeTableColumn = (index: number) => {
    if (tableHeaders.length <= 1) return;
    setTableHeaders(tableHeaders.filter((_, i) => i !== index));
    setTableRows(tableRows.map(row => row.filter((_, i) => i !== index)));
  };

  const removeTableRow = (index: number) => {
    if (tableRows.length <= 1) return;
    setTableRows(tableRows.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Générateur de Documents Médicaux</h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Informations du Document</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du Document *
                  </label>
                  <input
                    type="text"
                    value={documentData.title}
                    onChange={(e) => setDocumentData({ ...documentData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Rapport de Consultation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={documentData.documentDate}
                    onChange={(e) => setDocumentData({ ...documentData, documentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Patient</label>
                  <input
                    type="text"
                    value={documentData.patientName}
                    onChange={(e) => setDocumentData({ ...documentData, patientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom complet du patient"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° Patient</label>
                  <input
                    type="text"
                    value={documentData.patientNumber}
                    onChange={(e) => setDocumentData({ ...documentData, patientNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Numéro d'identification"
                  />
                </div>
              </div>
            </div>

            {documentData.sections.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  Sections Ajoutées ({documentData.sections.length})
                </h3>
                <div className="space-y-3">
                  {documentData.sections.map((section, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {section.type === 'table' ? (
                          <TableIcon className="w-5 h-5 text-blue-600" />
                        ) : section.type === 'list' ? (
                          <List className="w-5 h-5 text-green-600" />
                        ) : (
                          <Type className="w-5 h-5 text-gray-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{section.title}</p>
                          <p className="text-sm text-gray-500">
                            {section.type === 'table' ? 'Tableau' : section.type === 'list' ? 'Liste' : 'Texte'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSection(index)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une Section</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de la Section *
                  </label>
                  <input
                    type="text"
                    value={currentSection.title}
                    onChange={(e) => setCurrentSection({ ...currentSection, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Diagnostic, Traitement, Observations"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de Contenu</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentSection({ ...currentSection, type: 'text', content: '' })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                        currentSection.type === 'text'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Type className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">Texte</span>
                    </button>
                    <button
                      onClick={() => setCurrentSection({ ...currentSection, type: 'list', content: '' })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                        currentSection.type === 'list'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <List className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">Liste</span>
                    </button>
                    <button
                      onClick={() => setCurrentSection({ ...currentSection, type: 'table', content: '' })}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                        currentSection.type === 'table'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <TableIcon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">Tableau</span>
                    </button>
                  </div>
                </div>

                {currentSection.type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenu *</label>
                    <textarea
                      value={typeof currentSection.content === 'string' ? currentSection.content : ''}
                      onChange={(e) => setCurrentSection({ ...currentSection, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Entrez le contenu de la section..."
                    />
                  </div>
                )}

                {currentSection.type === 'list' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Éléments de Liste * (un par ligne)
                    </label>
                    <textarea
                      value={typeof currentSection.content === 'string' ? currentSection.content : ''}
                      onChange={(e) => setCurrentSection({ ...currentSection, content: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Élément 1&#10;Élément 2&#10;Élément 3"
                    />
                  </div>
                )}

                {currentSection.type === 'table' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Tableau</label>
                      <div className="flex gap-2">
                        <button
                          onClick={addTableColumn}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          + Colonne
                        </button>
                        <button
                          onClick={addTableRow}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          + Ligne
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            {tableHeaders.map((header, index) => (
                              <th key={index} className="border border-gray-300 p-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={header}
                                    onChange={(e) => updateTableHeader(index, e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder={`En-tête ${index + 1}`}
                                  />
                                  {tableHeaders.length > 1 && (
                                    <button
                                      onClick={() => removeTableColumn(index)}
                                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td key={colIndex} className="border border-gray-300 p-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => updateTableCell(rowIndex, colIndex, e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="Valeur"
                                    />
                                    {colIndex === row.length - 1 && tableRows.length > 1 && (
                                      <button
                                        onClick={() => removeTableRow(rowIndex)}
                                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddSection}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter la Section
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texte de Pied de Page (Optionnel)</label>
              <input
                type="text"
                value={documentData.footerText}
                onChange={(e) => setDocumentData({ ...documentData, footerText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Par défaut: Document Confidentiel - Usage Médical Uniquement - OKAPIA MEDICAL"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {loading ? 'Génération...' : 'Exporter en PDF'}
          </button>
          <button
            onClick={handleExportWord}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {loading ? 'Génération...' : 'Exporter en Word'}
          </button>
        </div>
      </div>
    </div>
  );
}
