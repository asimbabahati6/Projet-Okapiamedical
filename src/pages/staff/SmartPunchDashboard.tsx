import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, Clock, AlertTriangle, CheckCircle, XCircle,
  Download, RefreshCw, Search, Eye, Filter, TrendingUp,
  FileText, Coffee, Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceReport, getTodayDailySummary, type DailySummaryRow } from '../../services/smartPunchService';
import { exportSmartPunchToCSV, exportSmartPunchToPDF } from '../../services/smartPunchExportService';

const HR_ROLES = ['super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general', 'medecin_chef_staff'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  present: { label: 'Présent', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  on_break: { label: 'En pause', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  departed: { label: 'Sorti', color: 'text-gray-600', bg: 'bg-gray-50', dot: 'bg-gray-400' },
  absent: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-700', '-100').replace('-600', '-100')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

type FilterStatus = 'all' | 'present' | 'on_break' | 'departed' | 'absent' | 'late' | 'break_exceeded' | 'auto_closed';
type PeriodKey = 'today' | '7d' | '30d' | 'custom';

export default function SmartPunchDashboard() {
  const { profile, isRole } = useAuth();
  const isHR = isRole(HR_ROLES);

  const [rows, setRows] = useState<DailySummaryRow[]>([]);
  const [filtered, setFiltered] = useState<DailySummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selfieModal, setSelfieModal] = useState<{ url: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (period === 'today') {
        const data = await getTodayDailySummary();
        setRows(data);
      } else {
        const now = new Date();
        const end = now.toISOString().split('T')[0];
        let start = end;
        if (period === '7d') {
          const d = new Date(now); d.setDate(d.getDate() - 7);
          start = d.toISOString().split('T')[0];
        } else if (period === '30d') {
          const d = new Date(now); d.setDate(d.getDate() - 30);
          start = d.toISOString().split('T')[0];
        } else if (period === 'custom' && customStart && customEnd) {
          start = customStart;
        }
        const finalEnd = (period === 'custom' && customEnd) ? customEnd : end;
        const data = await getAttendanceReport(start, finalEnd);
        setRows(data as unknown as DailySummaryRow[]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let result = rows;
    if (search) {
      result = result.filter(r => r.full_name?.toLowerCase().includes(search.toLowerCase()));
    }
    switch (filterStatus) {
      case 'present': result = result.filter(r => r.current_status === 'present'); break;
      case 'on_break': result = result.filter(r => r.current_status === 'on_break'); break;
      case 'departed': result = result.filter(r => r.current_status === 'departed'); break;
      case 'absent': result = result.filter(r => r.current_status === 'absent'); break;
      case 'late': result = result.filter(r => r.is_late); break;
      case 'break_exceeded': result = result.filter(r => r.break_exceeded); break;
      case 'auto_closed': result = result.filter(r => r.auto_closed_checkout); break;
    }
    setFiltered(result);
  }, [rows, search, filterStatus]);

  const kpis = {
    total: rows.length,
    present: rows.filter(r => r.current_status !== 'absent').length,
    absent: rows.filter(r => r.current_status === 'absent').length,
    late: rows.filter(r => r.is_late).length,
    onBreak: rows.filter(r => r.current_status === 'on_break').length,
    breakExceeded: rows.filter(r => r.break_exceeded).length,
    autoClosed: rows.filter(r => r.auto_closed_checkout).length,
    presenceRate: rows.length > 0 ? Math.round((rows.filter(r => r.current_status !== 'absent').length / rows.length) * 100) : 0,
  };

  const getPeriodLabel = () => {
    if (period === 'today') return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    if (period === '7d') return '7 derniers jours';
    if (period === '30d') return '30 derniers jours';
    if (customStart && customEnd) return `${customStart} — ${customEnd}`;
    return '';
  };

  const handleExportCSV = () => {
    const now = new Date();
    exportSmartPunchToCSV(filtered, {
      startDate: now.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      periodLabel: getPeriodLabel(),
    });
  };

  const handleExportPDF = () => {
    const now = new Date();
    exportSmartPunchToPDF(filtered, {
      startDate: now.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      periodLabel: getPeriodLabel(),
    });
  };

  if (!isHR) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">Accès restreint</p>
          <p className="text-sm text-gray-500 mt-1">Ce tableau de bord est réservé aux RH et à la direction.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Selfie Modal */}
      {selfieModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelfieModal(null)}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Selfie — {selfieModal.name}</p>
              <button onClick={() => setSelfieModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <img src={selfieModal.url} alt="Selfie pointage" className="w-full object-cover max-h-80" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Tableau de Bord Smart Punch</h1>
              <p className="text-xs text-gray-500">Vue RH — {profile?.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={loadData} disabled={loading} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              Excel
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Period selector */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {(['today', '7d', '30d', 'custom'] as PeriodKey[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : 'Personnalisé'}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5" />
              <span className="text-gray-400 text-sm">→</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5" />
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard label="Total Personnel" value={kpis.total} icon={Users} color="text-gray-700" sub="employés actifs" />
          <KPICard label="Présents" value={kpis.present} icon={CheckCircle} color="text-green-600" sub={`${kpis.presenceRate}% taux`} />
          <KPICard label="Absents" value={kpis.absent} icon={XCircle} color="text-red-600" />
          <KPICard label="En Pause" value={kpis.onBreak} icon={Coffee} color="text-amber-600" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KPICard label="Retards" value={kpis.late} icon={Clock} color="text-amber-700" />
          <KPICard label="Pauses Dépassées" value={kpis.breakExceeded} icon={AlertTriangle} color="text-orange-600" />
          <KPICard label="Fermetures Auto" value={kpis.autoClosed} icon={TrendingUp} color="text-gray-600" />
        </div>

        {/* Filters + Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as FilterStatus)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="present">Présents</option>
              <option value="on_break">En pause</option>
              <option value="departed">Sortis</option>
              <option value="absent">Absents</option>
              <option value="late">Retards</option>
              <option value="break_exceeded">Pause dépassée</option>
              <option value="auto_closed">Fermeture auto</option>
            </select>
            <span className="text-xs text-gray-400">{filtered.length} résultat(s)</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                <Users className="w-8 h-8" />
                <p className="text-sm">Aucune donnée pour ces filtres</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Employé', 'Rôle', 'Arrivée', 'Départ', 'Pause', 'H. Trav.', 'Statut', 'Alertes', 'Selfies'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((row, i) => {
                    const statusCfg = STATUS_CONFIG[row.current_status] ?? STATUS_CONFIG.absent;
                    return (
                      <tr key={`${row.staff_id}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-800">{row.full_name}</p>
                          {row.punch_date && (
                            <p className="text-xs text-gray-400">{row.punch_date}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {row.role_name?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`font-medium ${row.is_late ? 'text-amber-600' : 'text-gray-700'}`}>
                            {formatTime(row.check_in_time)}
                          </span>
                          {row.is_late && (
                            <p className="text-xs text-amber-500">+{row.late_by_minutes}min</p>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                          {row.auto_closed_checkout ? (
                            <span className="text-gray-400 text-xs">Auto 20h</span>
                          ) : (
                            formatTime(row.check_out_time)
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {row.break_duration_minutes ? (
                            <span className={row.break_exceeded ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {row.break_duration_minutes}min
                              {row.break_exceeded && ` (+${row.break_exceeded_by_minutes})`}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                          {row.total_minutes_worked ? (
                            (() => {
                              const mins = Math.round(row.total_minutes_worked);
                              const h = Math.floor(mins / 60);
                              const m = mins % 60;
                              return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
                            })()
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.is_late && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-100">Retard</span>
                            )}
                            {row.break_exceeded && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-100">Pause +</span>
                            )}
                            {row.auto_closed_checkout && (
                              <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 text-xs rounded border border-gray-200">Auto</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            {row.check_in_selfie && (
                              <button
                                onClick={() => setSelfieModal({ url: row.check_in_selfie!, name: `${row.full_name} — Arrivée` })}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                title="Selfie arrivée"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {row.check_out_selfie && (
                              <button
                                onClick={() => setSelfieModal({ url: row.check_out_selfie!, name: `${row.full_name} — Départ` })}
                                className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                                title="Selfie départ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!row.check_in_selfie && !row.check_out_selfie && (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
