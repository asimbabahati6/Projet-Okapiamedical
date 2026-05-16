import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Clock, AlertTriangle, Monitor, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general'];

const PIE_COLORS = ['#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#ca8a04', '#6366f1', '#dc2626', '#0891b2'];

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

const ACTION_LABELS: Record<string, string> = {
  login: 'Connexion',
  logout: 'Deconnexion',
  create: 'Creation',
  update: 'Modification',
  delete: 'Suppression',
  validate: 'Validation',
  cancel: 'Annulation',
  transfer: 'Transfert',
  close: 'Cloture',
  generate: 'Generation',
  print: 'Impression',
  approve: 'Approbation',
  return: 'Retour',
};

interface UserLoginStat {
  user_name: string;
  user_role: string;
  login_count: number;
  last_login: string;
}

interface ActionStat {
  action: string;
  count: number;
}

interface ModuleStat {
  module: string;
  count: number;
}

export default function StaffAccessDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';

  useEffect(() => {
    if (profile && !ADMIN_ROLES.includes(userRole)) {
      navigate('/staff/dashboard');
    }
  }, [profile, userRole, navigate]);

  const [loading, setLoading] = useState(true);
  const [todayLogins, setTodayLogins] = useState<UserLoginStat[]>([]);
  const [lastLogins, setLastLogins] = useState<UserLoginStat[]>([]);
  const [actionStats, setActionStats] = useState<ActionStat[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStat[]>([]);
  const [recentOnline, setRecentOnline] = useState<UserLoginStat[]>([]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [totalTodayActions, setTotalTodayActions] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const last30Min = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      // Today's logins per user
      const { data: todayData } = await supabase
        .from('activity_logs')
        .select('user_name, user_role, created_at')
        .eq('action', 'login')
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false });

      // Aggregate today's logins
      const loginMap = new Map<string, UserLoginStat>();
      (todayData || []).forEach(row => {
        const existing = loginMap.get(row.user_name);
        if (existing) {
          existing.login_count++;
        } else {
          loginMap.set(row.user_name, {
            user_name: row.user_name,
            user_role: row.user_role,
            login_count: 1,
            last_login: row.created_at,
          });
        }
      });
      setTodayLogins(Array.from(loginMap.values()).sort((a, b) => b.login_count - a.login_count));

      // Last login per user (all time)
      const { data: lastLoginData } = await supabase
        .from('activity_logs')
        .select('user_name, user_role, created_at')
        .eq('action', 'login')
        .order('created_at', { ascending: false })
        .limit(200);

      const lastMap = new Map<string, UserLoginStat>();
      (lastLoginData || []).forEach(row => {
        if (!lastMap.has(row.user_name)) {
          lastMap.set(row.user_name, {
            user_name: row.user_name,
            user_role: row.user_role,
            login_count: 1,
            last_login: row.created_at,
          });
        }
      });
      setLastLogins(Array.from(lastMap.values()).slice(0, 20));

      // Users online recently (login within last 30 min without a logout after)
      const { data: recentData } = await supabase
        .from('activity_logs')
        .select('user_name, user_role, created_at')
        .eq('action', 'login')
        .gte('created_at', last30Min)
        .order('created_at', { ascending: false });

      const onlineMap = new Map<string, UserLoginStat>();
      (recentData || []).forEach(row => {
        if (!onlineMap.has(row.user_name)) {
          onlineMap.set(row.user_name, {
            user_name: row.user_name,
            user_role: row.user_role,
            login_count: 1,
            last_login: row.created_at,
          });
        }
      });
      setRecentOnline(Array.from(onlineMap.values()));

      // Action stats (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: actionsData } = await supabase
        .from('activity_logs')
        .select('action')
        .gte('created_at', weekAgo);

      const actionsCount: Record<string, number> = {};
      (actionsData || []).forEach(row => {
        actionsCount[row.action] = (actionsCount[row.action] || 0) + 1;
      });
      setActionStats(
        Object.entries(actionsCount)
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      // Module stats (last 7 days)
      const { data: modulesData } = await supabase
        .from('activity_logs')
        .select('module')
        .gte('created_at', weekAgo);

      const modulesCount: Record<string, number> = {};
      (modulesData || []).forEach(row => {
        modulesCount[row.module] = (modulesCount[row.module] || 0) + 1;
      });
      setModuleStats(
        Object.entries(modulesCount)
          .map(([module, count]) => ({ module, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Total today actions
      const { count: todayActionsCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);
      setTotalTodayActions(todayActionsCount || 0);

      // Failed attempts (look for action 'login' with description containing 'echou')
      const { count: failedCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login')
        .ilike('description', '%echou%')
        .gte('created_at', todayISO);
      setFailedAttempts(failedCount || 0);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Acces Staff</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble des connexions et de l'activite du personnel</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Connexions Aujourd'hui</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{todayLogins.length}</p>
          <p className="text-xs text-gray-500 mt-1">utilisateurs distincts</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Actions Aujourd'hui</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTodayActions}</p>
          <p className="text-xs text-gray-500 mt-1">actions enregistrees</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">En ligne</span>
            <Monitor className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{recentOnline.length}</p>
          <p className="text-xs text-gray-500 mt-1">connectes (30 dernieres min)</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Tentatives Echouees</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{failedAttempts}</p>
          <p className="text-xs text-gray-500 mt-1">aujourd'hui</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequent Actions Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Actions les plus frequentes (7 jours)</h2>
          {actionStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={actionStats.map(s => ({ name: ACTION_LABELS[s.action] || s.action, count: s.count }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Pas de donnees disponibles</p>
          )}
        </div>

        {/* Most Used Modules Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Modules les plus utilises (7 jours)</h2>
          {moduleStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={moduleStats.map(s => ({ name: MODULE_LABELS[s.module] || s.module, value: s.count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {moduleStats.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Pas de donnees disponibles</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Online Users + Last Logins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Online */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="font-bold text-gray-900">Utilisateurs Connectes</h2>
            <span className="ml-auto text-xs text-gray-500">30 dernieres minutes</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
            {recentOnline.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">Aucun utilisateur en ligne</div>
            ) : (
              recentOnline.map((u, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                      {u.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.user_name}</p>
                      <p className="text-xs text-gray-500">{u.user_role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(u.last_login).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Last Logins */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="font-bold text-gray-900">Derniere Connexion par Utilisateur</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
            {lastLogins.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">Aucune donnee</div>
            ) : (
              lastLogins.map((u, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.user_name}</p>
                    <p className="text-xs text-gray-500">{u.user_role}</p>
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(u.last_login).toLocaleDateString('fr-FR')}{' '}
                    {new Date(u.last_login).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Today's Connections Detail */}
      {todayLogins.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Connexions Aujourd'hui par Utilisateur</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Nb Connexions</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Derniere</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayLogins.map((u, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.user_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{u.user_role}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-xs font-bold">
                        {u.login_count}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(u.last_login).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
