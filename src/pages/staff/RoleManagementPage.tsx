import { useState, useEffect } from 'react';
import { Shield, Users, Play, X, Search, ListFilter as Filter, Clock, TriangleAlert as AlertTriangle } from 'lucide-react';
import { useRBAC } from '@/contexts/RBACContext';
import { getAllSimulatorRoles, ROLE_DISPLAY_NAMES, type RBACRole } from '@/utils/roleMapping';
import { ROLE_PERMISSIONS, type UserRole } from '@/config/rbac';
import { simulationAuditService, type SimulationSession, type SimulationStatistics } from '@/services/simulationAuditService';
import { SimulationConfirmDialog } from '@/components/simulation/SimulationConfirmDialog';

export function RoleManagementPage() {
  const { actualRole, isSimulationMode, startSimulation, canUseSimulation, simulationSettings } = useRBAC();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<RBACRole | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeSessions, setActiveSessions] = useState<SimulationSession[]>([]);
  const [statistics, setStatistics] = useState<SimulationStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [sessions, stats] = await Promise.all([
        simulationAuditService.getActiveSessions(),
        simulationAuditService.getStatistics()
      ]);

      setActiveSessions(sessions);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading role management data:', error);
    } finally {
      setLoading(false);
    }
  }

  const availableRoles = getAllSimulatorRoles();
  const filteredRoles = availableRoles.filter(role =>
    ROLE_DISPLAY_NAMES[role].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSimulateRole = (role: RBACRole) => {
    if (isSimulationMode) {
      alert('Vous êtes déjà en mode simulation. Veuillez quitter la simulation actuelle avant d\'en démarrer une nouvelle.');
      return;
    }

    setSelectedRole(role);
    setShowConfirmDialog(true);
  };

  const handleConfirmSimulation = async (reason?: string, autoEndMinutes?: number) => {
    if (!selectedRole) return;

    try {
      await startSimulation(selectedRole as UserRole, reason, autoEndMinutes);
      setShowConfirmDialog(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Erreur lors du démarrage de la simulation');
    }
  };

  const handleForceEndSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette session de simulation?')) {
      return;
    }

    try {
      await simulationAuditService.forceEndSession(sessionId, actualRole);
      await loadData();
    } catch (error) {
      console.error('Error force-ending session:', error);
      alert('Erreur lors de la fermeture de la session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Gestion des Rôles
          </h1>
          <p className="text-gray-600 mt-1">
            Simulez différents rôles pour tester les permissions et fonctionnalités
          </p>
        </div>
      </div>

      {!canUseSimulation && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Accès non autorisé</p>
            <p className="text-sm text-red-700 mt-1">
              Votre rôle ({ROLE_DISPLAY_NAMES[actualRole as RBACRole]}) n'a pas la permission d'utiliser le mode simulation.
            </p>
          </div>
        </div>
      )}

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessions Totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total_sessions}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessions Actives</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{statistics.active_sessions}</p>
              </div>
              <Play className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs Uniques</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{statistics.unique_users}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Durée Moyenne</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {Math.round(statistics.avg_session_duration_minutes)}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un rôle..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rôles Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => {
              const permissions = ROLE_PERMISSIONS[role] || [];
              const isCurrentRole = role === actualRole;

              return (
                <div
                  key={role}
                  className={`border rounded-lg p-4 transition-all ${
                    isCurrentRole
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{ROLE_DISPLAY_NAMES[role]}</h3>
                      <p className="text-xs text-gray-500 mt-1">{role}</p>
                    </div>
                    {isCurrentRole && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Actuel
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {(permissions as string[]).includes('*') ? (
                        <span className="text-green-600 font-medium">Toutes les permissions</span>
                      ) : (
                        <span>{permissions.length} permissions</span>
                      )}
                    </p>
                    {!(permissions as string[]).includes('*') && (
                      <div className="flex flex-wrap gap-1">
                        {permissions.slice(0, 3).map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {perm}
                          </span>
                        ))}
                        {permissions.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            +{permissions.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSimulateRole(role)}
                    disabled={!canUseSimulation || isCurrentRole || isSimulationMode}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Simuler ce rôle
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sessions Actives ({activeSessions.length})
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {ROLE_DISPLAY_NAMES[session.actual_role as RBACRole]} → {' '}
                            <span className="text-amber-600">
                              {ROLE_DISPLAY_NAMES[session.simulated_role as RBACRole]}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Démarrée: {new Date(session.started_at).toLocaleString('fr-FR')}
                          </p>
                          {session.reason && (
                            <p className="text-sm text-gray-500 mt-1 italic">
                              Raison: {session.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleForceEndSession(session.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <X className="w-4 h-4" />
                      Terminer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedRole && (
        <SimulationConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setSelectedRole(null);
          }}
          onConfirm={handleConfirmSimulation}
          targetRole={selectedRole as UserRole}
          currentRole={actualRole}
          requireReason={simulationSettings?.require_reason || false}
        />
      )}
    </div>
  );
}
