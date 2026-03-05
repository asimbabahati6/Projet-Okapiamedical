import { useState, useEffect } from 'react';
import { FileText, Download, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { FinancialReportGenerator } from '../reports/FinancialReportGenerator';
import { DemoDataManager } from '../reports/DemoDataManager';
import { FinancialReportActions } from '../reports/FinancialReportActions';
import { SavedFinancialReport } from '../../types/financialReport';
import { supabase } from '../../lib/supabase';

interface FinancialReportsSectionProps {
  onReportLinked?: (reportId: string) => void;
  currentPeriod?: { start: string; end: string };
}

export function FinancialReportsSection({ onReportLinked, currentPeriod }: FinancialReportsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [reports, setReports] = useState<SavedFinancialReport[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select(`
          *,
          user:user_profiles(full_name)
        `)
        .order('generated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: SavedFinancialReport) => {
    if (!report.file_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('financial-reports')
        .download(`reports/${report.file_url}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-financier-${report.report_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Erreur lors du téléchargement du rapport');
    }
  };

  const handleDelete = async (reportId: string, fileUrl: string | null) => {
    try {
      if (fileUrl) {
        await supabase.storage
          .from('financial-reports')
          .remove([`reports/${fileUrl}`]);
      }

      const { error } = await supabase
        .from('financial_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Erreur lors de la suppression du rapport');
    }
  };

  const handleLinkReport = async (reportId: string) => {
    if (!currentPeriod) {
      alert('Veuillez sélectionner une période de facturation');
      return;
    }

    try {
      const { error } = await supabase
        .from('billing_financial_reports')
        .insert({
          billing_period_start: currentPeriod.start,
          billing_period_end: currentPeriod.end,
          financial_report_id: reportId,
          display_options: {
            includeSummary: true,
            includeMetrics: true,
            includeCharts: true,
            includeComparison: false,
            includeRecommendations: true,
            position: 'before-kpi',
            displayFormat: 'card',
            autoUpdate: false
          },
          auto_update: false
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      if (onReportLinked) {
        onReportLinked(reportId);
      }

      alert('Rapport lié avec succès à cette période de facturation !');
    } catch (error) {
      console.error('Error linking report:', error);
      alert('Erreur lors de la liaison du rapport');
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div id="financial-reports-section" className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between hover:from-blue-100 hover:to-green-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Rapports Financiers</h3>
            <p className="text-sm text-gray-600">
              {reports.length} rapport{reports.length > 1 ? 's' : ''} disponible{reports.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-6 h-6 text-gray-600" />
        ) : (
          <ChevronDown className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 bg-white border-2 border-gray-200 rounded-xl p-6 animate-fadeIn">
          <div className="mb-6">
            <DemoDataManager />
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {showGenerator ? 'Masquer le Générateur' : 'Nouveau Rapport'}
            </button>
          </div>

          {showGenerator && (
            <div className="mb-6 animate-fadeIn">
              <FinancialReportGenerator />
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-xl font-bold text-gray-900">Liste des Rapports</h4>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport disponible</h3>
                <p className="text-gray-600">Générez votre premier rapport financier pour commencer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Rapport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taille
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Généré le
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {report.report_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(report.start_date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-gray-500">
                            au {new Date(report.end_date).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {getPeriodTypeLabel(report.period_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(report.file_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.generated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <FinancialReportActions
                            report={report}
                            onDownload={handleDownload}
                            onDelete={handleDelete}
                            onLink={handleLinkReport}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
