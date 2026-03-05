import { useState } from 'react';
import { Download, TrendingUp, Share2, Copy, Trash2, MoreVertical, ExternalLink, Link } from 'lucide-react';
import { SavedFinancialReport } from '../../types/financialReport';
import { useNavigate } from 'react-router-dom';

interface FinancialReportActionsProps {
  report: SavedFinancialReport;
  onDownload: (report: SavedFinancialReport) => void;
  onDelete: (reportId: string, fileUrl: string | null) => void;
  onLink?: (reportId: string) => void;
}

export function FinancialReportActions({ report, onDownload, onDelete, onLink }: FinancialReportActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleViewInBilling = () => {
    const startDate = new Date(report.start_date).toISOString().split('T')[0];
    const endDate = new Date(report.end_date).toISOString().split('T')[0];
    navigate(`/staff/billing?start=${startDate}&end=${endDate}`);
  };

  const handleAnalyze = () => {
    navigate('/staff/billing-analytics');
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/reports/${report.report_number}`;

    if (navigator.share) {
      navigator.share({
        title: `Rapport Financier ${report.report_number}`,
        text: `Rapport financier du ${new Date(report.start_date).toLocaleDateString('fr-FR')} au ${new Date(report.end_date).toLocaleDateString('fr-FR')}`,
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  const handleDuplicate = () => {
    alert('Fonctionnalité de duplication à venir');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Plus d'actions"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  onDownload(report);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                Télécharger PDF
              </button>

              {onLink && (
                <button
                  onClick={() => {
                    onLink(report.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-colors"
                >
                  <Link className="w-4 h-4 text-green-600" />
                  Lier à cette période
                </button>
              )}

              <button
                onClick={() => {
                  handleViewInBilling();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-blue-600" />
                Voir dans Facturation
              </button>

              <button
                onClick={() => {
                  handleAnalyze();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-3 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Analyser
              </button>

              <button
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors"
              >
                <Share2 className="w-4 h-4 text-indigo-600" />
                Partager
              </button>

              <button
                onClick={() => {
                  handleDuplicate();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-yellow-50 flex items-center gap-3 transition-colors"
              >
                <Copy className="w-4 h-4 text-yellow-600" />
                Dupliquer
              </button>

              <div className="border-t border-gray-200 my-1" />

              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
                    onDelete(report.id, report.file_url);
                  }
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
