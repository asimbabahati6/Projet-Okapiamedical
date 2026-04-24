import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { EmployeeDocument } from '../../services/employeeService';

interface DocumentPreviewModalProps {
  document: EmployeeDocument;
  documents: EmployeeDocument[];
  onClose: () => void;
  onNavigate?: (document: EmployeeDocument) => void;
}

export function DocumentPreviewModal({ document, documents, onClose, onNavigate }: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);

  const currentIndex = documents.findIndex((doc) => doc.id === document.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < documents.length - 1;

  const isImage = document.file_url.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPdf = document.file_url.match(/\.pdf$/i);

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(documents[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(documents[currentIndex + 1]);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.file_url;
    link.download = document.document_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex items-center justify-between">
        <div className="text-white">
          <h3 className="text-lg font-semibold">{document.document_name}</h3>
          <p className="text-sm text-gray-300">{document.document_type}</p>
        </div>

        <div className="flex items-center gap-2">
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white text-sm px-2">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-600 mx-2"></div>
            </>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center w-full h-full p-20">
        {hasPrevious && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="max-w-full max-h-full overflow-auto">
          {isImage ? (
            <img
              src={document.file_url}
              alt={document.document_name}
              style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}
              className="mx-auto"
            />
          ) : isPdf ? (
            <iframe
              src={document.file_url}
              className="w-full h-full min-w-[800px] min-h-[600px] bg-white"
              title={document.document_name}
            />
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600">
                Aperçu non disponible pour ce type de fichier
              </p>
              <button
                onClick={handleDownload}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Télécharger le fichier
              </button>
            </div>
          )}
        </div>

        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
