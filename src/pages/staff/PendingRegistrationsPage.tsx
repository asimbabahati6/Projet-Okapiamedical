import { useState, useEffect } from 'react';
import { UserCheck, UserX, Shield, Clock, Search, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PendingUser {
  id: string;
  full_name: string;
  phone: string | null;
  account_status: 'pending' | 'active' | 'disabled';
  created_at: string;
  email?: string;
  role?: {
    name: string;
    description: string;
  };
}

type TabFilter = 'pending' | 'active' | 'disabled' | 'all';

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  hospital_admin: 'Administrateur Hospitalier',
  doctor: 'Medecin',
  nurse: 'Infirmier(ere)',
  pharmacist: 'Pharmacien(ne)',
  receptionist: 'Receptionniste',
  administrative_staff: 'Personnel Administratif',
  logistician: 'Logisticien',
  lab_technician: 'Laborantin',
  directeur_general: 'Directeur General',
  medecin_chef_staff: 'Medecin Chef de Staff',
  gestionnaire: 'Gestionnaire',
  radio_chef: 'Chef Radiologie',
  radio_tech: 'Technicien Radiologie',
  caissiere: 'Caissiere',
  technique: 'Technicien',
  hygiene: "Agent d'Hygiene",
  dentist: 'Dentiste',
  physical_therapist: 'Kinesitherapeute',
  super_admin: 'Super Administrateur',
  patient: 'Patient',
};

export default function PendingRegistrationsPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({ pending: 0, active: 0, disabled: 0, all: 0 });

  useEffect(() => {
    loadUsers();
  }, [activeTab]);

  async function loadUsers() {
    setLoading(true);
    try {
      let query = supabase
        .from('user_profiles')
        .select(`
          id, full_name, phone, account_status, created_at,
          role:roles(name, description)
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('account_status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch emails from auth view
      const { data: emailData } = await supabase
        .from('user_profiles_with_email')
        .select('id, email');

      const emailMap = new Map(emailData?.map(e => [e.id, e.email]) || []);

      const usersWithEmail = (data || []).map(u => ({
        ...u,
        email: emailMap.get(u.id) || '',
      }));

      setUsers(usersWithEmail);

      // Load counts
      const { count: pendingCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'pending');

      const { count: activeCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active');

      const { count: disabledCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'disabled');

      setCounts({
        pending: pendingCount || 0,
        active: activeCount || 0,
        disabled: disabledCount || 0,
        all: (pendingCount || 0) + (activeCount || 0) + (disabledCount || 0),
      });
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ account_status: 'active', is_active: true })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisable(userId: string) {
    if (userId === profile?.id) return;
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ account_status: 'disabled', is_active: false })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error disabling user:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: string) {
    if (userId === profile?.id) return;
    if (!confirm('Etes-vous sur de vouloir supprimer definitivement ce compte ? Cette action est irreversible.')) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.name.toLowerCase().includes(q)
    );
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" />En attente</span>;
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><UserCheck className="w-3 h-3" />Actif</span>;
      case 'disabled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><UserX className="w-3 h-3" />Desactive</span>;
      default:
        return null;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'pending', label: 'En attente', count: counts.pending },
    { key: 'active', label: 'Actifs', count: counts.active },
    { key: 'disabled', label: 'Desactives', count: counts.disabled },
    { key: 'all', label: 'Tous', count: counts.all },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Inscriptions</h1>
          <p className="text-gray-600 mt-1">Validez ou gerez les comptes du personnel</p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {counts.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">{counts.pending} inscription(s) en attente de validation</p>
            <p className="text-sm text-amber-700 mt-1">Ces personnes ne peuvent pas acceder a l'application tant que leur compte n'est pas valide.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun utilisateur trouve</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'pending' ? 'Aucune inscription en attente de validation.' : 'Aucun resultat pour votre recherche.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email || 'N/A'}</p>
                        {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                        <Shield className="w-3.5 h-3.5" />
                        {ROLE_DISPLAY_NAMES[user.role?.name || ''] || user.role?.name || 'Non defini'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.account_status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.account_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Valider
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          </>
                        )}
                        {user.account_status === 'active' && user.id !== profile?.id && (
                          <button
                            onClick={() => handleDisable(user.id)}
                            disabled={actionLoading === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Desactiver
                          </button>
                        )}
                        {user.account_status === 'disabled' && (
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoading === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Reactiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
