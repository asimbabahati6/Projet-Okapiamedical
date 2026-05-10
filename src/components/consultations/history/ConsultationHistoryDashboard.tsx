import { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, Download, Filter, List, Calendar as CalendarIcon, RefreshCw, X } from 'lucide-react';
import { useConsultationHistory } from '../../../hooks/consultation/useConsultationHistory';
import { usePermissions } from '../../../hooks/consultation/usePermissions';
import { StatisticsCards } from './StatisticsCards';
import { ConsultationFiltersPanel } from './ConsultationFiltersPanel';
import { SmartSearchBar } from './SmartSearchBar';
import { ConsultationTable } from './ConsultationTable';
import { Pagination } from './Pagination';
import { TimelineChart } from '../charts/TimelineChart';
import { DiagnosisDistributionChart } from '../charts/DiagnosisDistributionChart';
import { HeatmapCalendar } from '../charts/HeatmapCalendar';
import { PatientDetailsModal } from '../../patients/PatientDetailsModal';
import { ConsultationWithDetails, ViewMode, TimeSeriesData, DiagnosisDistribution, HeatmapCell } from '../../../types/consultationHistory';
import { supabase } from '../../../lib/supabase';

export function ConsultationHistoryDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationWithDetails | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisDistribution[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);

  const {
    consultations,
    statistics,
    loading,
    error,
    filters,
    page,
    pageSize,
    totalCount,
    totalPages,
    updateFilters,
    clearFilters,
    refresh,
    goToPage,
    changePageSize,
  } = useConsultationHistory({
    startDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })(),
    endDate: new Date()
  });

  const { permissions } = usePermissions();

  const fetchChartData = useCallback(async () => {
    try {
      let query = supabase
        .from('consultations')
        .select('consultation_date, diagnosis');

      if (filters.startDate) {
        query = query.gte('consultation_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('consultation_date', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const timeSeriesMap = new Map<string, number>();
        const diagnosisMap = new Map<string, number>();
        const heatmapMap = new Map<string, number>();

        data.forEach((consultation) => {
          const date = new Date(consultation.consultation_date);
          const dayKey = date.toISOString().split('T')[0];

          timeSeriesMap.set(dayKey, (timeSeriesMap.get(dayKey) || 0) + 1);

          const day = date.getDay();
          const week = Math.floor((date.getDate() - 1) / 7);
          const heatmapKey = `${day}-${week}`;
          heatmapMap.set(heatmapKey, (heatmapMap.get(heatmapKey) || 0) + 1);

          if (consultation.diagnosis) {
            diagnosisMap.set(
              consultation.diagnosis,
              (diagnosisMap.get(consultation.diagnosis) || 0) + 1
            );
          }
        });

        const timeSeries: TimeSeriesData[] = Array.from(timeSeriesMap.entries())
          .map(([period, count]) => ({ period: new Date(period), count }))
          .sort((a, b) => a.period.getTime() - b.period.getTime());

        setTimeSeriesData(timeSeries);

        const totalDiagnoses = Array.from(diagnosisMap.values()).reduce((a, b) => a + b, 0);
        const diagnoses: DiagnosisDistribution[] = Array.from(diagnosisMap.entries())
          .map(([diagnosis, count]) => ({
            diagnosis,
            count,
            percentage: (count / totalDiagnoses) * 100
          }))
          .sort((a, b) => b.count - a.count);

        setDiagnosisData(diagnoses);

        const heatmap: HeatmapCell[] = Array.from(heatmapMap.entries())
          .map(([key, value]) => {
            const [day, week] = key.split('-').map(Number);
            const date = new Date();
            date.setDate(date.getDate() - ((date.getDay() - day + 7) % 7));
            return { date, value, day, week };
          });

        setHeatmapData(heatmap);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    if (viewMode === 'charts' || viewMode === 'analytics') {
      fetchChartData();
    }
  }, [viewMode, fetchChartData]);

  const handleConsultationClick = (consultation: ConsultationWithDetails) => {
    setSelectedConsultation(consultation);
    logAuditEvent(consultation.id, 'viewed');
  };

  async function logAuditEvent(consultationId: string, action: string) {
    try {
      await supabase.rpc('log_consultation_audit', {
        p_consultation_id: consultationId,
        p_action: action
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (!permissions.can_export) {
      alert('Vous n\'avez pas les permissions pour exporter les données');
      return;
    }

    if (format === 'csv') {
      const headers = ['Date', 'Patient', 'Médecin', 'Diagnostic', 'Traitement', 'Suivi'];
      const rows = consultations.map(c => [
        new Date(c.consultation_date).toLocaleDateString('fr-FR'),
        c.patient ? `${c.patient.first_name} ${c.patient.last_name}` : 'N/A',
        c.doctor?.user_profile?.full_name || '',
        c.diagnosis || '',
        c.treatment_plan || '',
        c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString('fr-FR') : ''
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consultations-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      consultations.forEach(c => logAuditEvent(c.id, 'exported_csv'));
    }
  };

  const viewButtons = useMemo(() => [
    { mode: 'list' as ViewMode, icon: List, label: 'Liste' },
    { mode: 'charts' as ViewMode, icon: BarChart3, label: 'Graphiques' },
    { mode: 'calendar' as ViewMode, icon: CalendarIcon, label: 'Calendrier' },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historique des Consultations</h1>
          <p className="text-gray-600 mt-1">
            Analysez et gérez l'historique complet des consultations médicales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {permissions.can_export && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                Exporter
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                >
                  Exporter CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Exporter Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
                >
                  Exporter PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {statistics && <StatisticsCards statistics={statistics} />}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="flex gap-4">
            <SmartSearchBar
              value={filters.searchTerm || ''}
              onChange={(value) => updateFilters({ searchTerm: value })}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-all ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <ConsultationFiltersPanel
          filters={filters}
          onFiltersChange={updateFilters}
          onClear={clearFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-1">
          {viewButtons.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-medium">Erreur de chargement</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          <ConsultationTable
            consultations={consultations}
            onConsultationClick={handleConsultationClick}
            loading={loading}
          />
          {!loading && consultations.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
            />
          )}
        </>
      )}

      {viewMode === 'charts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Évolution des Consultations
            </h3>
            <TimelineChart data={timeSeriesData} width={1000} height={400} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top 10 Diagnostics
              </h3>
              <DiagnosisDistributionChart data={diagnosisData} width={500} height={500} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Calendrier de Charge
              </h3>
              <HeatmapCalendar data={heatmapData} width={500} height={200} />
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-center text-gray-600 py-8">
            Vue calendrier en cours de développement
          </p>
        </div>
      )}

      {selectedConsultation?.patient && (
        <PatientDetailsModal
          patient={selectedConsultation.patient}
          onClose={() => setSelectedConsultation(null)}
          onEdit={() => {}}
        />
      )}
    </div>
  );
}
