import { ReactNode } from 'react';

interface ButtonWithPermissionProps {
  hasPermission: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
  hideWhenNoPermission?: boolean;
}

export function ButtonWithPermission({
  hasPermission,
  children,
  onClick,
  className = "",
  tooltip = "Action non autorisée pour votre rôle",
  hideWhenNoPermission = false
}: ButtonWithPermissionProps) {
  if (!hasPermission && hideWhenNoPermission) {
    return null;
  }

  if (!hasPermission) {
    return (
      <div className="relative group">
        <button
          disabled
          className={`${className} opacity-50 cursor-not-allowed`}
          title={tooltip}
        >
          {children}
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
