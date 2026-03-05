import { useState, useEffect } from 'react';
import { X, FileText, ChevronRight, ChevronLeft, CheckCircle, Calendar } from 'lucide-react';
import { SavedFinancialReport } from '../../types/financialReport';
import { supabase } from '../../lib/supabase';

interface ReportInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (reportId: string, options: InsertOptions) => void;
  currentPeriod?: { start: Date; end: Date };
}

export interface InsertOptions {
  includeSummary: boolean;
  includeMetrics: boolean;
  includeCharts: boolean;
  includeComparison: boolean;
  includeRecommendations: boolean;
  position: 'header' | 'before-kpi' | 'after-kpi';
  displayFormat: 'card' | 'table' | 'chart';
  autoUpdate: boolean;
}

export function ReportInsertModal({ isOpen, onClose, onInsert, currentPeriod }: ReportInsertModalProps) {
  const [step, setStep] = useState(1);
  const [reports, setReports] = useState<SavedFinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const [options, setOptions] = useState<InsertOptions>({
    includeSummary: true,
    includeMetrics: true,
    includeCharts: true,
    includeComparison: false,
    includeRecommendations: true,
    position: 'before-kpi',
    displayFormat: 'card',
    autoUpdate: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterType === 'all') return true;
    return report.period_type === filterType;
  });

  const selectedReport = reports.find(r => r.id === selectedReportId);

  const handleInsert = () => {
    if (selectedReportId) {
      onInsert(selectedReportId, options);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPeriodTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      annual: 'Annuel',
      custom: 'Personnalisé'
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Insérer Rapport Financier</h2>
              <p className="text-green-100 text-sm mt-1">
                Liez un rapport à cette page de facturation
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    s === step
                      ? 'bg-white text-green-600 scale-110'
                      : s < step
                      ? 'bg-green-400 text-white'
                      : 'bg-green-800 text-green-300'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-8 h-1 ${s < step ? 'bg-green-400' : 'bg-green-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sélectionner un Rapport
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choisissez le rapport financier à insérer dans cette page
                </p>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Tous les types</option>
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="annual">Annuel</option>
                  <option value="custom">Personnalisé</option>
                </select>
                <span className="text-sm text-gray-600">
                  {filteredReports.length} rapport{filteredReports.length > 1 ? 's' : ''} disponible{filteredReports.length > 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mx-auto mb-4" />
                  <p className="text-gray-600">Chargement des rapports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun rapport disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {filteredReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selectedReportId === report.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className={`w-5 h-5 ${selectedReportId === report.id ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className="font-semibold text-gray-900">{report.report_number}</span>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {getPeriodTypeLabel(report.period_type)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {formatDate(report.start_date)} - {formatDate(report.end_date)}
                          </div>
                        </div>
                        {selectedReportId === report.id && (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedReport && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Options d'Insertion
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choisissez les sections à inclure
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900">Rapport sélectionné</p>
                <p className="text-base font-semibold text-gray-900">{selectedReport.report_number}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedReport.start_date)} - {formatDate(selectedReport.end_date)}
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSummary}
                    onChange={(e) => setOptions({ ...options, includeSummary: e.target.checked })}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Résumé exécutif</span>
                    <p className="text-xs text-gray-600">Vue d'ensemble du rapport</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeMetrics}
                    onChange={(e) => setOptions({ ...options, includeMetrics: e.target.checked })}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Métriques de facturation</span>
                    <p className="text-xs text-gray-600">KPI et statistiques clés</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeCharts}
                    onChange={(e) => setOptions({ ...options, includeCharts: e.target.checked })}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Graphiques de tendance</span>
                    <p className="text-xs text-gray-600">Visualisations des données</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeComparison}
                    onChange={(e) => setOptions({ ...options, includeComparison: e.target.checked })}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Analyse comparative</span>
                    <p className="text-xs text-gray-600">Comparaison avec périodes précédentes</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeRecommendations}
                    onChange={(e) => setOptions({ ...options, includeRecommendations: e.target.checked })}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Recommandations</span>
                    <p className="text-xs text-gray-600">Suggestions d'amélioration</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && selectedReport && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuration
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Définissez comment le rapport sera affiché
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position d'Insertion
                </label>
                <select
                  value={options.position}
                  onChange={(e) => setOptions({ ...options, position: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="header">En-tête de page</option>
                  <option value="before-kpi">Avant les KPI</option>
                  <option value="after-kpi">Après les KPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format d'Affichage
                </label>
                <select
                  value={options.displayFormat}
                  onChange={(e) => setOptions({ ...options, displayFormat: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="card">Carte (Recommandé)</option>
                  <option value="table">Tableau</option>
                  <option value="chart">Graphique</option>
                </select>
              </div>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.autoUpdate}
                  onChange={(e) => setOptions({ ...options, autoUpdate: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Mise à jour automatique</span>
                  <p className="text-xs text-gray-600">
                    Actualiser automatiquement les données si le rapport est régénéré
                  </p>
                </div>
              </label>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-semibold text-green-900 mb-2">Prévisualisation</h4>
                <div className="space-y-1 text-xs text-gray-700">
                  <p>✓ {options.includeSummary ? 'Avec' : 'Sans'} résumé exécutif</p>
                  <p>✓ {options.includeMetrics ? 'Avec' : 'Sans'} métriques</p>
                  <p>✓ {options.includeCharts ? 'Avec' : 'Sans'} graphiques</p>
                  <p>✓ {options.includeComparison ? 'Avec' : 'Sans'} comparaison</p>
                  <p>✓ Position: {options.position === 'header' ? 'En-tête' : options.position === 'before-kpi' ? 'Avant KPI' : 'Après KPI'}</p>
                  <p>✓ Format: {options.displayFormat === 'card' ? 'Carte' : options.displayFormat === 'table' ? 'Tableau' : 'Graphique'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !selectedReportId) {
                    alert('Veuillez sélectionner un rapport');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleInsert}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Insérer le Rapport
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
