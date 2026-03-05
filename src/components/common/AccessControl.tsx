import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from '../../contexts/RBACContext';
import { Lock, Eye } from 'lucide-react';

export type AccessControlMode = 'hide' | 'disable' | 'readonly' | 'redirect';

interface AccessControlProps {
  permission: string | string[];
  mode?: AccessControlMode;
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
  readOnlyMessage?: string;
  children: ReactNode;
}

export function AccessControl({
  permission,
  mode = 'hide',
  requireAll = false,
  fallback,
  redirectTo = '/staff/dashboard',
  readOnlyMessage,
  children
}: AccessControlProps) {
  const { hasPermission } = useRBAC();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p))
    : permissions.some(p => hasPermission(p));

  if (hasAccess) {
    return <>{children}</>;
  }

  switch (mode) {
    case 'hide':
      return fallback ? <>{fallback}</> : null;

    case 'disable':
      return (
        <div className="relative">
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Accès restreint</span>
            </div>
          </div>
        </div>
      );

    case 'readonly':
      return (
        <div className="relative">
          {children}
          <div className="absolute top-2 right-2">
            <div className="bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-blue-200">
              <Eye className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                {readOnlyMessage || 'Lecture seule'}
              </span>
            </div>
          </div>
        </div>
      );

    case 'redirect':
      return <Navigate to={redirectTo} replace />;

    default:
      return fallback ? <>{fallback}</> : null;
  }
}
