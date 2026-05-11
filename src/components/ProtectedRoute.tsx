import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AccessDenied } from './AccessDenied';
import { Clock, LogOut, ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, isPatient, canAccessBackend, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/admin" replace />;
  }

  if (profile.account_status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Compte en attente de validation</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Votre compte a bien ete cree. Un administrateur doit valider votre inscription avant que vous puissiez acceder a l'application.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Vous recevrez une notification lorsque votre compte sera active.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Se deconnecter
          </button>
        </div>
      </div>
    );
  }

  if (profile.account_status === 'disabled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Compte desactive</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Votre compte a ete desactive par un administrateur. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administration.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Se deconnecter
          </button>
        </div>
      </div>
    );
  }

  if (isPatient()) {
    return (
      <AccessDenied
        message="Acces reserve au personnel medical"
        description="En tant que patient, vous n'avez pas acces a l'espace de gestion du personnel medical. Veuillez utiliser l'espace patient pour consulter vos informations medicales et prendre rendez-vous."
        showHomeButton={true}
        showBackButton={false}
      />
    );
  }

  if (!canAccessBackend()) {
    return (
      <AccessDenied
        message="Acces non autorise"
        description="Votre role ne vous permet pas d'acceder a cet espace. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur."
        showHomeButton={true}
        showBackButton={false}
      />
    );
  }

  if (requireAdmin) {
    const isAdmin = profile.role?.name === 'hospital_admin' || profile.role?.name === 'super_admin';
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
