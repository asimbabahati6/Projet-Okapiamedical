import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AccessDenied } from './AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, isPatient, canAccessBackend } = useAuth();

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

  if (isPatient()) {
    console.warn('Access denied: Patient attempting to access backend');
    return (
      <AccessDenied
        message="Accès réservé au personnel médical"
        description="En tant que patient, vous n'avez pas accès à l'espace de gestion du personnel médical. Veuillez utiliser l'espace patient pour consulter vos informations médicales et prendre rendez-vous."
        showHomeButton={true}
        showBackButton={false}
      />
    );
  }

  if (!canAccessBackend()) {
    console.warn('Access denied: User role not authorized for backend access');
    return (
      <AccessDenied
        message="Accès non autorisé"
        description="Votre rôle ne vous permet pas d'accéder à cet espace. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur."
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
