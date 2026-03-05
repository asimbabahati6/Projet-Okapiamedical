import { useState } from 'react';
import { Database, Trash2, Download, Loader, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { generateDemoDataset, checkDemoDataExists, deleteDemoData } from '../../services/demoDataGenerator';
import { generateMedicalActivityReport } from '../../services/medicalActivityReportGenerator';

export function DemoDataManager() {
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [dataExists, setDataExists] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkData = async () => {
    const exists = await checkDemoDataExists();
    setDataExists(exists);
  };

  useState(() => {
    checkData();
  });

  const handleGenerateData = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const result = await generateDemoDataset();

      if (result.success) {
        setResult(result);
        setDataExists(true);
      } else {
        setError(result.error || 'Erreur lors de la génération');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteData = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les données de démonstration ?')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const success = await deleteDemoData();
      if (success) {
        setDataExists(false);
        setResult(null);
        alert('Données de démonstration supprimées avec succès');
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setError(null);

    try {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-06-30');

      const pdfBlob = await generateMedicalActivityReport(startDate, endDate);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-activite-medicale-jan-juin-2024.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-8 h-8 text-purple-600" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">Données de Démonstration</h3>
          <p className="text-sm text-gray-600">40 patients, 150 factures sur 6 mois (Jan-Juin 2024)</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Données générées avec succès !</p>
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600">Patients</p>
                <p className="text-lg font-bold text-green-700">{result.patients}</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600">Factures</p>
                <p className="text-lg font-bold text-green-700">{result.invoices}</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600">CA Total</p>
                <p className="text-lg font-bold text-green-700">
                  ${result.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Contenu du Dataset</h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            40 patients congolais fictifs (noms authentiques)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            150 factures médicales (Jan-Juin 2024)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Répartition : Consultation (40%), Examen (35%), Traitement (25%)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Statuts : Payée (70%), En attente (30%)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Montants : 50-2000 USD selon le service
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        {!dataExists ? (
          <button
            onClick={handleGenerateData}
            disabled={generating}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Générer les Données
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {generatingReport ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Générer le Rapport PDF
                </>
              )}
            </button>

            <button
              onClick={handleDeleteData}
              disabled={deleting}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {deleting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Supprimer
                </>
              )}
            </button>
          </>
        )}
      </div>

      {dataExists && !result && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            Des données de démonstration existent déjà dans la base de données
          </p>
        </div>
      )}
    </div>
  );
}
