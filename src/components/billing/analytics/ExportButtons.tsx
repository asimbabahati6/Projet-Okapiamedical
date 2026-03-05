import { Download, FileText, Table } from 'lucide-react';
import { BillingAnalyticsData, BillingStatistics } from '../../../types/billingAnalytics';
import { exportAnalyticsToCSV, exportSummaryTableToCSV, formatPeriodLabel } from '../../../utils/billingExport';
import { Invoice } from '../../../types/database';

interface ExportButtonsProps {
  data: BillingAnalyticsData | null;
  periodType: 'today' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  dayStats?: BillingStatistics;
  weekStats?: BillingStatistics;
  monthStats?: BillingStatistics;
  invoices?: Invoice[];
}

export function ExportButtons({
  data,
  periodType,
  startDate,
  endDate,
  dayStats,
  weekStats,
  monthStats
}: ExportButtonsProps) {
  function handleExportFullAnalytics() {
    if (!data) return;
    const periodLabel = formatPeriodLabel(periodType, startDate, endDate);
    exportAnalyticsToCSV(data, periodLabel);
  }

  function handleExportSummaryTable() {
    if (!dayStats || !weekStats || !monthStats) return;
    exportSummaryTableToCSV(dayStats, weekStats, monthStats);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportSummaryTable}
        disabled={!dayStats || !weekStats || !monthStats}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exporter le tableau récapitulatif"
      >
        <Table className="w-4 h-4" />
        <span className="text-sm font-medium">Tableau</span>
      </button>

      <button
        onClick={handleExportFullAnalytics}
        disabled={!data}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exporter le rapport complet"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">Export Complet CSV</span>
      </button>
    </div>
  );
}
