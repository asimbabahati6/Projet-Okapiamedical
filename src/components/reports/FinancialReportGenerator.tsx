import { useState } from 'react';
import { FileText, Download, Calendar, Settings, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { ReportConfiguration, ReportPeriod, ReportPeriodType, ReportTemplateType } from '../../types/financialReport';
import { generateCompleteFinancialReport } from '../../services/reportOrchestrator';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function FinancialReportGenerator() {
  const { profile } = useAuth();
  const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [template, setTemplate] = useState<ReportTemplateType>('standard');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const period = calculatePeriod();
      if (!period) {
        setError('Veuillez sélectionner une période valide');
        setGenerating(false);
        return;
      }

      setProgress(20);

      const configuration: ReportConfiguration = {
        period,
        template,
        language: 'fr',
        includeCharts,
        includeComparison,
        includeRecommendations: true,
        includeExecutiveSummary: true,
        detailLevel: 'standard'
      };

      setProgress(30);

      const { reportData, pdfBlob } = await generateCompleteFinancialReport(configuration);

      setProgress(70);

      const fileName = `rapport-financier-${reportData.reportInfo.reportNumber}.pdf`;

      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('financial-reports')
        .upload(`reports/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      }

      const fileUrl = uploadData?.path || null;

      setProgress(90);

      const { error: dbError } = await supabase
        .from('financial_reports')
        .insert({
          report_number: reportData.reportInfo.reportNumber,
          period_type: period.type,
          start_date: period.startDate.toISOString(),
          end_date: period.endDate.toISOString(),
          file_url: fileUrl,
          file_size: pdfBlob.size,
          generated_by: profile?.id || '',
          metadata: {
            template,
            language: 'fr',
            pageCount: 10,
            includesCharts: includeCharts
          }
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      setProgress(100);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Error generating report:', err);
      setError('Une erreur est survenue lors de la génération du rapport');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const calculatePeriod = (): ReportPeriod | null => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let label: string;

    switch (periodType) {
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        label = `${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        break;

      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        label = `T${quarter + 1} ${now.getFullYear()}`;
        break;

      case 'annual':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        label = `Année ${now.getFullYear()}`;
        break;

      case 'custom':
        if (!startDate || !endDate) return null;
        start = new Date(startDate);
        end = new Date(endDate);
        label = `${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`;
        break;

      default:
        return null;
    }

    return { type: periodType, startDate: start, endDate: end, label };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Générateur de Rapport Financier</h2>
          <p className="text-gray-600 text-sm">Créez un rapport financier professionnel complet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Période
          </label>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as ReportPeriodType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monthly">Mensuel (Mois en cours)</option>
            <option value="quarterly">Trimestriel (Trimestre en cours)</option>
            <option value="annual">Annuel (Année en cours)</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Settings className="w-4 h-4 inline mr-1" />
            Type de Rapport
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as ReportTemplateType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="standard">Standard (15 pages)</option>
            <option value="executive">Exécutif (5 pages)</option>
            <option value="detailed">Détaillé (Complet)</option>
          </select>
        </div>

        {periodType === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Options Avancées</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Inclure les graphiques et visualisations</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeComparison}
              onChange={(e) => setIncludeComparison(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Inclure la comparaison avec période précédente</span>
          </label>
        </div>
      </div>

      {generating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-900">
              Génération en cours... {progress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-blue-700 mt-2">
            {progress < 30 && 'Récupération des données financières...'}
            {progress >= 30 && progress < 70 && 'Calcul des ratios et analyse...'}
            {progress >= 70 && progress < 90 && 'Génération du PDF...'}
            {progress >= 90 && 'Finalisation...'}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Succès</p>
            <p className="text-sm text-green-700">Le rapport a été généré et téléchargé avec succès</p>
          </div>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
      >
        {generating ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Générer le Rapport PDF
          </>
        )}
      </button>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Contenu du Rapport</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Page de couverture avec logo OKAPIA MEDICAL</li>
          <li>• Résumé exécutif avec score de santé financière</li>
          <li>• Compte de résultat détaillé</li>
          <li>• Bilan comptable (Actifs, Passifs, Capitaux propres)</li>
          <li>• Tableau des flux de trésorerie</li>
          <li>• Ratios financiers (liquidité, rentabilité, efficacité, endettement)</li>
          <li>• Analyse des tendances et comparaison période précédente</li>
          <li>• Alertes financières et recommandations stratégiques</li>
        </ul>
      </div>
    </div>
  );
}
