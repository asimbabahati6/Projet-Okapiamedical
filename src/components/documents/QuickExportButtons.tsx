import { useState } from 'react';
import { FileText, Download, Check, X, Loader2 } from 'lucide-react';
import { exportMedicalDocumentToPDF, exportMedicalDocumentToWord, MedicalDocumentData } from '../../utils/medicalDocumentExport';
import { useToast } from '../../hooks/useToast';

interface QuickExportButtonsProps {
  documentData: MedicalDocumentData;
  documentType: string;
  patientName: string;
}

type ExportStatus = 'ready' | 'loading' | 'success' | 'error';

export function QuickExportButtons({ documentData, documentType, patientName }: QuickExportButtonsProps) {
  const { success, error: showError } = useToast();
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('ready');
  const [wordStatus, setWordStatus] = useState<ExportStatus>('ready');

  const handlePDFExport = async () => {
    try {
      setPdfStatus('loading');
      await new Promise(resolve => setTimeout(resolve, 500));

      exportMedicalDocumentToPDF(documentData);

      setPdfStatus('success');
      success('Document PDF téléchargé avec succès');

      setTimeout(() => setPdfStatus('ready'), 2000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setPdfStatus('error');
      showError('Erreur lors de l\'export PDF');

      setTimeout(() => setPdfStatus('ready'), 2000);
    }
  };

  const handleWordExport = async () => {
    try {
      setWordStatus('loading');
      await new Promise(resolve => setTimeout(resolve, 500));

      await exportMedicalDocumentToWord(documentData);

      setWordStatus('success');
      success('Document Word téléchargé avec succès');

      setTimeout(() => setWordStatus('ready'), 2000);
    } catch (err) {
      console.error('Error exporting Word:', err);
      setWordStatus('error');
      showError('Erreur lors de l\'export Word');

      setTimeout(() => setWordStatus('ready'), 2000);
    }
  };

  const getButtonClass = (status: ExportStatus, baseColor: string) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 min-w-[120px] justify-center';

    switch (status) {
      case 'loading':
        return `${baseClasses} bg-gray-400 text-white cursor-wait`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white`;
      case 'error':
        return `${baseClasses} bg-red-600 text-white`;
      case 'ready':
      default:
        return `${baseClasses} ${baseColor} hover:opacity-90 shadow-md hover:shadow-lg`;
    }
  };

  const getButtonContent = (status: ExportStatus, label: string, Icon: any) => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Export...</span>
          </>
        );
      case 'success':
        return (
          <>
            <Check className="w-4 h-4" />
            <span>Téléchargé</span>
          </>
        );
      case 'error':
        return (
          <>
            <X className="w-4 h-4" />
            <span>Erreur</span>
          </>
        );
      case 'ready':
      default:
        return (
          <>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </>
        );
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePDFExport}
        disabled={pdfStatus === 'loading'}
        className={getButtonClass(pdfStatus, 'bg-red-600 text-white')}
        title="Télécharger en PDF"
      >
        {getButtonContent(pdfStatus, 'PDF', FileText)}
      </button>

      <button
        onClick={handleWordExport}
        disabled={wordStatus === 'loading'}
        className={getButtonClass(wordStatus, 'bg-blue-600 text-white')}
        title="Télécharger en Word (DOCX)"
      >
        {getButtonContent(wordStatus, 'Word', Download)}
      </button>
    </div>
  );
}
