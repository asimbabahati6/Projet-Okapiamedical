import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  hasPermission: boolean;
  fallbackMessage?: string;
  redirectTo?: string;
  showFallback?: boolean;
}

export function PermissionGuard({
  children,
  hasPermission,
  fallbackMessage = "Vous n'avez pas les permissions nécessaires pour accéder à cette page",
  redirectTo,
  showFallback = true
}: PermissionGuardProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasPermission && redirectTo) {
      navigate(redirectTo);
    }
  }, [hasPermission, redirectTo, navigate]);

  if (!hasPermission) {
    if (redirectTo) {
      return null;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Accès Refusé</h3>
          <p className="text-gray-600 mb-4">{fallbackMessage}</p>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
