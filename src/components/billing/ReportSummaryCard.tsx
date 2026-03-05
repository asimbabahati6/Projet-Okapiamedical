import { FileText, TrendingUp, DollarSign, Calendar, X, ExternalLink } from 'lucide-react';
import { SavedFinancialReport } from '../../types/financialReport';

interface ReportSummaryCardProps {
  report: SavedFinancialReport;
  onRemove?: () => void;
  onExpand?: () => void;
}

export function ReportSummaryCard({ report, onRemove, onExpand }: ReportSummaryCardProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const mockMetrics = {
    totalInvoiced: 125000 + Math.random() * 50000,
    totalCollected: 98000 + Math.random() * 40000,
    outstandingBalance: 15000 + Math.random() * 10000,
    recoveryRate: 75 + Math.random() * 20
  };

  const handleViewDetails = () => {
    const reportsSection = document.getElementById('financial-reports-section');
    if (reportsSection) {
      reportsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const accordionButton = reportsSection.querySelector('button');
        if (accordionButton && accordionButton.getAttribute('aria-expanded') === 'false') {
          accordionButton.click();
        }
      }, 300);
    }
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{report.report_number}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              {formatDate(report.start_date)} - {formatDate(report.end_date)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {getPeriodTypeLabel(report.period_type)}
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-50 rounded-lg transition-colors"
              title="Retirer"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600">Facturé</span>
          </div>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(mockMetrics.totalInvoiced)}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-600">Collecté</span>
          </div>
          <p className="text-lg font-bold text-blue-700">
            {formatCurrency(mockMetrics.totalCollected)}
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-gray-600">Solde</span>
          </div>
          <p className="text-lg font-bold text-orange-700">
            {formatCurrency(mockMetrics.outstandingBalance)}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-600">Taux</span>
          </div>
          <p className="text-lg font-bold text-purple-700">
            {mockMetrics.recoveryRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <button
        onClick={handleViewDetails}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <ExternalLink className="w-4 h-4" />
        Voir Détails Complets
      </button>
    </div>
  );
}
