import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Download, Filter, Search, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import SupervisorBreakEscalations from '../../components/attendance/SupervisorBreakEscalations';
import { useAuth } from '../../contexts/AuthContext';

interface ComplianceRecord {
  staff_id: string;
  staff_name: string;
  date: string;
  check_in_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  hours_before_break: number;
  break_duration_minutes: number;
  break_warning_sent: boolean;
  break_exceeded_notification_sent: boolean;
  forced_by_system: boolean;
  supervisor_notified: boolean;
  compliance_status: string;
}

interface ComplianceStats {
  totalBreaks: number;
  compliantBreaks: number;
  warningsIssued: number;
  violationsForced: number;
  complianceRate: number;
}

export default function BreakCompliancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7');

  useEffect(() => {
    fetchComplianceData();
  }, [dateFilter]);

  async function fetchComplianceData() {
    try {
      setLoading(true);
      const daysAgo = parseInt(dateFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('break_compliance_report')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(data: ComplianceRecord[]) {
    const totalBreaks = data.length;
    const compliantBreaks = data.filter((r) => r.compliance_status === 'Conforme').length;
    const warningsIssued = data.filter((r) => r.break_warning_sent).length;
    const violationsForced = data.filter((r) => r.forced_by_system).length;
    const complianceRate = totalBreaks > 0 ? (compliantBreaks / totalBreaks) * 100 : 100;

    setStats({
      totalBreaks,
      compliantBreaks,
      warningsIssued,
      violationsForced,
      complianceRate,
    });
  }

  function exportToCSV() {
    const filteredRecords = getFilteredRecords();

    const headers = [
      'Employé',
      'Date',
      'Heure Arrivée',
      'Début Pause',
      'Fin Pause',
      'Heures Avant Pause',
      'Durée Pause (min)',
      'Avertissement Envoyé',
      'Terminée Automatiquement',
      'Statut',
    ];

    const rows = filteredRecords.map((r) => [
      r.staff_name,
      new Date(r.date).toLocaleDateString('fr-FR'),
      r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('fr-FR') : '',
      r.break_start_time ? new Date(r.break_start_time).toLocaleTimeString('fr-FR') : '',
      r.break_end_time ? new Date(r.break_end_time).toLocaleTimeString('fr-FR') : '',
      r.hours_before_break?.toFixed(2) || '',
      r.break_duration_minutes || '',
      r.break_warning_sent ? 'Oui' : 'Non',
      r.forced_by_system ? 'Oui' : 'Non',
      r.compliance_status,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `break-compliance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function getFilteredRecords() {
    return records.filter((record) => {
      const matchesSearch = record.staff_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'compliant' && record.compliance_status === 'Conforme') ||
        (statusFilter === 'warning' && record.break_warning_sent) ||
        (statusFilter === 'violated' && record.forced_by_system);

      return matchesSearch && matchesStatus;
    });
  }

  const filteredRecords = getFilteredRecords();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Conformité des Pauses</h1>
        <p className="text-gray-600 mt-2">Surveillance et analyse des pauses du personnel</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Coffee className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-gray-600">Total Pauses</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalBreaks}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-gray-600">Conformes</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.compliantBreaks}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-gray-600">Avertissements</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.warningsIssued}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-gray-600">Violations</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.violationsForced}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-gray-600">Taux Conformité</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.complianceRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Supervisor Escalations */}
      <SupervisorBreakEscalations supervisorId={user?.id || ''} />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un employé
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom de l'employé..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Tous</option>
                <option value="compliant">Conformes</option>
                <option value="warning">Avertissements</option>
                <option value="violated">Violations</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="7">7 derniers jours</option>
                <option value="14">14 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">90 derniers jours</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exporter en CSV
          </button>
        </div>
      </div>

      {/* Compliance Records Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée Pause
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heures Avant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{record.staff_name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(record.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{record.break_duration_minutes} min</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.hours_before_break?.toFixed(2)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.compliance_status === 'Conforme'
                          ? 'bg-green-100 text-green-800'
                          : record.forced_by_system
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {record.compliance_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune donnée de conformité trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { Coffee } from 'lucide-react';
