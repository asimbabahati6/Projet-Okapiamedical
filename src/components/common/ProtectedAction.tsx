import { ReactNode, ButtonHTMLAttributes } from 'react';
import { useRBAC } from '../../contexts/RBACContext';
import { Lock } from 'lucide-react';

interface ProtectedActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permission: string | string[];
  requireAll?: boolean;
  tooltip?: string;
  children: ReactNode;
}

export function ProtectedAction({
  permission,
  requireAll = false,
  tooltip,
  disabled,
  className = '',
  children,
  onClick,
  ...props
}: ProtectedActionProps) {
  const { hasPermission } = useRBAC();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p))
    : permissions.some(p => hasPermission(p));

  if (!hasAccess) {
    return (
      <div className="relative group">
        <button
          disabled={true}
          className={`${className} opacity-50 cursor-not-allowed`}
          {...props}
        >
          <Lock className="w-4 h-4 inline mr-1" />
          {children}
        </button>
        {tooltip && (
          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      disabled={disabled}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
