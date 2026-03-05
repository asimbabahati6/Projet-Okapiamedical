import { useState, useEffect } from 'react';
import { Shield, Users, CheckCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import {
  getStaffAccessStatus,
  restoreAllStaffAccess,
  verifySuperAdminAccess,
  type AccountRestorationResult,
  type StaffAccessStatus
} from '../../utils/restoreStaffAccess';
import { useAuth } from '../../contexts/AuthContext';

export function RestoreStaffAccess() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [status, setStatus] = useState<StaffAccessStatus | null>(null);
  const [superAdminStatus, setSuperAdminStatus] = useState<any>(null);
  const [restorationResult, setRestorationResult] = useState<AccountRestorationResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setStatusLoading(true);
    try {
      const [accessStatus, superAdmin] = await Promise.all([
        getStaffAccessStatus(),
        verifySuperAdminAccess()
      ]);
      setStatus(accessStatus);
      setSuperAdminStatus(superAdmin);
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    setRestorationResult(null);
    try {
      const result = await restoreAllStaffAccess(profile?.id);
      setRestorationResult(result);
      await loadStatus();
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error restoring access:', error);
    } finally {
      setLoading(false);
    }
  }

  if (statusLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement du statut...</p>
        </div>
      </div>
    );
  }

  const hasInactiveStaff = status && status.inactiveStaff > 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Gestion des Accès Staff</h2>
        </div>
        <p className="text-blue-100">
          Restaurez l'accès à la plateforme pour tous les employés et le super utilisateur
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Employés</span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{status?.totalStaff || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Comptes Actifs</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{status?.activeStaff || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Comptes Inactifs</span>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{status?.inactiveStaff || 0}</p>
        </div>
      </div>

      {superAdminStatus && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Statut Super Administrateur
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{superAdminStatus.superAdminCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{superAdminStatus.activeSuperAdmins}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactifs</p>
              <p className="text-2xl font-bold text-orange-600">{superAdminStatus.inactiveSuperAdmins}</p>
            </div>
          </div>
        </div>
      )}

      {status && status.roleBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Rôle</h3>
          <div className="space-y-3">
            {status.roleBreakdown.map((role) => (
              <div key={role.roleName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 capitalize">{role.roleName}</p>
                  <p className="text-sm text-gray-600">
                    {role.active} actif{role.active > 1 ? 's' : ''} / {role.total} total
                  </p>
                </div>
                {role.inactive > 0 && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {role.inactive} inactif{role.inactive > 1 ? 's' : ''}
                  </span>
                )}
                {role.inactive === 0 && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasInactiveStaff && !showConfirmation && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">
                Comptes Inactifs Détectés
              </h3>
              <p className="text-orange-800 mb-4">
                {status.inactiveStaff} compte{status.inactiveStaff > 1 ? 's' : ''} employé{status.inactiveStaff > 1 ? 's' : ''} désactivé{status.inactiveStaff > 1 ? 's' : ''} trouvé{status.inactiveStaff > 1 ? 's' : ''}.
                Cliquez sur le bouton ci-dessous pour restaurer leur accès.
              </p>
              <button
                onClick={() => setShowConfirmation(true)}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Restaurer les Accès
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasInactiveStaff && !restorationResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">
                Tous les Accès sont Actifs
              </h3>
              <p className="text-green-800">
                Tous les employés et le super utilisateur ont actuellement accès à la plateforme.
                Aucune action de restauration n'est nécessaire.
              </p>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-600">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Confirmer la Restauration d'Accès
          </h3>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">Cette action va:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Réactiver tous les comptes staff désactivés</li>
                  <li>Restaurer l'accès au backend pour tous les employés</li>
                  <li>Garantir l'accès complet pour le super utilisateur</li>
                  <li>Maintenir la restriction pour les patients</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRestore}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Restauration en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Confirmer la Restauration
                </>
              )}
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {restorationResult && (
        <div className={`rounded-xl shadow-lg p-6 ${
          restorationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {restorationResult.success ? (
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                restorationResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {restorationResult.success
                  ? 'Accès restauré avec succès pour tous les employés et le Super User.'
                  : 'Erreur lors de la restauration'}
              </h3>

              {restorationResult.success && restorationResult.reactivatedCount > 0 && (
                <div className="space-y-3">
                  <p className="text-green-800">
                    <strong>{restorationResult.reactivatedCount}</strong> compte{restorationResult.reactivatedCount > 1 ? 's' : ''} réactivé{restorationResult.reactivatedCount > 1 ? 's' : ''} avec succès.
                  </p>
                  <div className="bg-white rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">Comptes restaurés:</p>
                    <ul className="space-y-1">
                      {restorationResult.accountsRestored.map((account) => (
                        <li key={account.id} className="text-sm text-gray-700">
                          • {account.name} <span className="text-gray-500">({account.role})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {restorationResult.success && restorationResult.reactivatedCount === 0 && (
                <p className="text-green-800">
                  {restorationResult.errors[0] || 'Tous les comptes sont déjà actifs.'}
                </p>
              )}

              {!restorationResult.success && restorationResult.errors.length > 0 && (
                <div className="mt-2">
                  {restorationResult.errors.map((error, index) => (
                    <p key={index} className="text-red-800 text-sm">• {error}</p>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-600 mt-4">
                Date: {new Date(restorationResult.timestamp).toLocaleString('fr-FR')}
              </p>

              <button
                onClick={() => {
                  setRestorationResult(null);
                  loadStatus();
                }}
                className="mt-4 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
