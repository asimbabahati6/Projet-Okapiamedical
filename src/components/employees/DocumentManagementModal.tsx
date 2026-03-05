import { useState, useEffect } from 'react';
import { X, Eye, Trash2, FileText, Calendar, User, HardDrive } from 'lucide-react';
import { Employee } from '../../types/drcClinic';
import { DOCUMENT_TYPE_COLORS } from '../../types/documents';
import {
  EmployeeDocument,
  getEmployeeDocuments,
  addEmployeeDocument,
  deleteEmployeeDocument,
} from '../../services/employeeService';
import { uploadFile, deleteFile, formatFileSize } from '../../services/fileUploadService';
import { useToast } from '../../hooks/useToast';
import { DocumentUploadZone } from './DocumentUploadZone';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { useAuth } from '../../contexts/AuthContext';

interface DocumentManagementModalProps {
  employee: Employee;
  onClose: () => void;
}

export function DocumentManagementModal({ employee, onClose }: DocumentManagementModalProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState<EmployeeDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDocuments();
  }, [employee.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getEmployeeDocuments(employee.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      showToast('Erreur lors du chargement des documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, documentType: string) => {
    try {
      const uploadResult = await uploadFile(file, employee.id);

      const result = await addEmployeeDocument(
        employee.id,
        documentType,
        file.name,
        uploadResult.url,
        file.size,
        user?.id || ''
      );

      if (result.success) {
        showToast('Document téléchargé avec succès', 'success');
        await loadDocuments();
      } else {
        await deleteFile(uploadResult.path);
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      showToast(error.message || 'Erreur lors du téléchargement', 'error');
      throw error;
    }
  };

  const handleDelete = async (document: EmployeeDocument) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${document.document_name}" ?`)) {
      return;
    }

    try {
      setDeletingId(document.id);

      const filePath = document.file_url.split('/').pop() || '';
      const result = await deleteEmployeeDocument(document.id, document.file_url);

      if (result.success) {
        try {
          await deleteFile(`${employee.id}/${filePath}`);
        } catch (error) {
          console.error('Error deleting file from storage:', error);
        }

        showToast('Document supprimé avec succès', 'success');
        await loadDocuments();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = (document: EmployeeDocument) => {
    setPreviewDocument(document);
  };

  const getDocumentColor = (type: string) => {
    return DOCUMENT_TYPE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Documents de l'Employé</h2>
              <p className="text-sm text-gray-600 mt-1">
                {employee.first_name} {employee.last_name} - {employee.employee_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <DocumentUploadZone onUpload={handleUpload} disabled={loading} />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Documents existants ({documents.length})
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Aucun document</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Téléchargez le premier document ci-dessus
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const colors = getDocumentColor(doc.document_type);
                    const isDeleting = deletingId === doc.id;

                    return (
                      <div
                        key={doc.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {doc.document_name}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}
                                >
                                  {doc.document_type}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <HardDrive className="w-3.5 h-3.5" />
                                  <span>{formatFileSize(doc.file_size)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>

                              {doc.notes && (
                                <p className="text-sm text-gray-600 mt-2">{doc.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handlePreview(doc)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Aperçu"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleDelete(doc)}
                              disabled={isDeleting}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Supprimer"
                            >
                              {isDeleting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          documents={documents}
          onClose={() => setPreviewDocument(null)}
          onNavigate={(doc) => setPreviewDocument(doc)}
        />
      )}
    </>
  );
}
