import { Eye, Lock } from 'lucide-react';

interface ReadOnlyBadgeProps {
  message?: string;
  className?: string;
}

export function ReadOnlyBadge({
  message = "Mode Consultation - Lecture Seule",
  className = ""
}: ReadOnlyBadgeProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-amber-600" />
        <Lock className="w-3 h-3 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-amber-800">{message}</p>
        <p className="text-xs text-amber-600 mt-0.5">
          Vous pouvez consulter les informations mais pas les modifier
        </p>
      </div>
    </div>
  );
}
