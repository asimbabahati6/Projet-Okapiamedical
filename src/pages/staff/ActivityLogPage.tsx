import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Search, Filter, Download, ChevronLeft, ChevronRight,
  RefreshCw, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general'];
const PAGE_SIZE = 50;

const ACTION_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  login: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Connexion' },
  logout: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Deconnexion' },
  create: { bg: 'bg-green-100', text: 'text-green-800', label: 'Creation' },
  update: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Modification' },
  delete: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suppression' },
  validate: { bg: 'bg-green-100', text: 'text-green-800', label: 'Validation' },
  cancel: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulation' },
  transfer: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Transfert' },
  close: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cloture' },
  generate: { bg: 'bg-green-100', text: 'text-green-800', label: 'Generation' },
  print: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Impression' },
  approve: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approbation' },
  return: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Retour' },
};

const MODULE_LABELS: Record<string, string> = {
  auth: 'Authentification',
  patients: 'Patients',
  appointments: 'Rendez-vous',
  consultations: 'Consultations',
  reports: 'Rapports',
  expenses: 'Depenses',
  roles: 'Roles',
  users: 'Utilisateurs',
  pharmacy: 'Pharmacie',
  laboratory: 'Laboratoire',
  radiology: 'Radiologie',
};

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export default function ActivityLogPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';

  useEffect(() => {
    if (profile && !ADMIN_ROLES.includes(userRole)) {
      navigate('/staff/dashboard');
    }
  }, [profile, userRole, navigate]);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search) {
        query = query.or(`user_name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (filterModule) query = query.eq('module', filterModule);
      if (filterAction) query = query.eq('action', filterAction);
      if (filterRole) query = query.eq('user_role', filterRole);
      if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);

      const { data, count, error } = await query;
      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterModule, filterAction, filterRole, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('activity_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs(prev => [payload.new as ActivityLog, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotalCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function exportCSV() {
    const headers = ['Date/Heure', 'Utilisateur', 'Role', 'Module', 'Action', 'Description'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('fr-FR'),
      log.user_name,
      log.user_role,
      MODULE_LABELS[log.module] || log.module,
      ACTION_BADGES[log.action]?.label || log.action,
      log.description,
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_activite_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Journal d'Activite</h1>
              <p className="text-gray-600 mt-1">Historique complet de toutes les actions du systeme</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Rechercher par nom ou description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterModule}
            onChange={(e) => { setFilterModule(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tous les modules</option>
            {Object.entries(MODULE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_BADGES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tous les roles</option>
            <option value="admin">Admin</option>
            <option value="medical_director">Directeur Medical</option>
            <option value="doctor">Medecin</option>
            <option value="nurse">Infirmier</option>
            <option value="receptionist">Receptionniste</option>
            <option value="pharmacist">Pharmacien</option>
            <option value="caissiere">Caissiere</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-gray-400 text-sm">a</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="text-gray-500 mt-3">Chargement...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                        Aucune activite trouvee
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const badge = ACTION_BADGES[log.action] || { bg: 'bg-gray-100', text: 'text-gray-800', label: log.action };
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-700">
                            {new Date(log.created_at).toLocaleDateString('fr-FR')}{' '}
                            <span className="text-gray-400">{new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.user_name || '-'}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">
                            {log.user_role}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                              {MODULE_LABELS[log.module] || log.module}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {log.description}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {totalCount} entree{totalCount !== 1 ? 's' : ''} au total - Page {page + 1} / {Math.max(totalPages, 1)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
