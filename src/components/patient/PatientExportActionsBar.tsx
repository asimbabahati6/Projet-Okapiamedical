import { useState } from 'react';
import { FileDown, Table, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { exportPatientToPDF } from '../../services/patientPDFExportService';
import { exportSinglePatientToExcel } from '../../services/patientExcelExportService';

interface PatientExportActionsBarProps {
  patientId: string;
  patientNumber: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

type ExportType = 'pdf' | 'excel' | 'fhir' | null;

export default function PatientExportActionsBar({
  patientId,
  patientNumber,
  onSuccess,
  onError
}: PatientExportActionsBarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ExportType>(null);
  const [lastExported, setLastExported] = useState<ExportType>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportingType('pdf');
    setLastExported(null);

    try {
      await exportPatientToPDF(patientId, {
        includeConsultations: true,
        includeMedicalHistory: true,
        includeAllergies: true
      });

      setLastExported('pdf');
      onSuccess?.('Export PDF généré avec succès');

      setTimeout(() => setLastExported(null), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      onError?.('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportingType('excel');
    setLastExported(null);

    try {
      await exportSinglePatientToExcel(patientId);

      setLastExported('excel');
      onSuccess?.('Export Excel téléchargé avec succès');

      setTimeout(() => setLastExported(null), 3000);
    } catch (error) {
      console.error('Excel export error:', error);
      onError?.('Erreur lors de la génération du fichier Excel. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  const handleExportFHIR = async () => {
    setIsExporting(true);
    setExportingType('fhir');
    setLastExported(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-patient-fhir-record`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ patientId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate FHIR record');
      }

      const fhirData = await response.json();
      const blob = new Blob([JSON.stringify(fhirData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Patient_${patientNumber}_FHIR.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLastExported('fhir');
      onSuccess?.('Export FHIR (JSON) téléchargé avec succès');

      setTimeout(() => setLastExported(null), 3000);
    } catch (error) {
      console.error('FHIR export error:', error);
      onError?.('Erreur lors de la génération du fichier FHIR. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
      <span className="text-sm font-medium text-gray-700">Actions d'export:</span>

      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group"
        title="Exporter en PDF"
      >
        {exportingType === 'pdf' ? (
          <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
        ) : lastExported === 'pdf' ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <FileDown className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-sm font-medium text-gray-700">PDF</span>
      </button>

      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group"
        title="Exporter en Excel"
      >
        {exportingType === 'excel' ? (
          <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
        ) : lastExported === 'excel' ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Table className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-sm font-medium text-gray-700">Excel</span>
      </button>

      <button
        onClick={handleExportFHIR}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group"
        title="Exporter en FHIR (JSON)"
      >
        {exportingType === 'fhir' ? (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        ) : lastExported === 'fhir' ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Download className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-sm font-medium text-gray-700">FHIR</span>
      </button>

      {isExporting && (
        <div className="flex items-center gap-2 ml-auto">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600 font-medium">
            Export en cours...
          </span>
        </div>
      )}

      {lastExported && !isExporting && (
        <div className="flex items-center gap-2 ml-auto animate-fade-in">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            Téléchargé!
          </span>
        </div>
      )}
    </div>
  );
}
