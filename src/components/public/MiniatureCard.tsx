import { LucideIcon } from 'lucide-react';

interface MiniatureCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  image?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'thumbnail';
}

export function MiniatureCard({
  icon: Icon,
  title,
  description,
  image,
  onClick,
  className = '',
  variant = 'default',
}: MiniatureCardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden';

  const variantClasses = {
    default: 'p-4',
    compact: 'p-3',
    thumbnail: 'p-2',
  };

  const sizeClasses = {
    default: 'min-h-[120px]',
    compact: 'min-h-[80px]',
    thumbnail: 'min-h-[60px]',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[variant]} ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {image && (
          <div
            className={`flex-shrink-0 rounded-md overflow-hidden ${
              variant === 'thumbnail' ? 'w-12 h-12' : variant === 'compact' ? 'w-16 h-16' : 'w-20 h-20'
            }`}
          >
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {!image && Icon && (
          <div
            className={`flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center ${
              variant === 'thumbnail' ? 'w-10 h-10' : variant === 'compact' ? 'w-12 h-12' : 'w-14 h-14'
            }`}
          >
            <Icon
              className={`text-blue-600 ${
                variant === 'thumbnail' ? 'w-5 h-5' : variant === 'compact' ? 'w-6 h-6' : 'w-7 h-7'
              }`}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-gray-900 truncate ${
              variant === 'thumbnail' ? 'text-xs' : variant === 'compact' ? 'text-sm' : 'text-base'
            }`}
          >
            {title}
          </h3>
          {description && (
            <p
              className={`text-gray-600 mt-1 ${
                variant === 'thumbnail'
                  ? 'text-[10px] line-clamp-1'
                  : variant === 'compact'
                  ? 'text-xs line-clamp-2'
                  : 'text-sm line-clamp-3'
              }`}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface MiniatureGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export function MiniatureGrid({
  children,
  columns = 3,
  gap = 'medium',
  className = ''
}: MiniatureGridProps) {
  const gapClasses = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}
