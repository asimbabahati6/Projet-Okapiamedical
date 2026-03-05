import { Eye, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

export function ReadOnlyBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
      <Eye className="w-3 h-3" />
      Lecture seule
    </div>
  );
}

export function RestrictedAccessBadge({ message }: { message: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
      <Lock className="w-3 h-3" />
      {message}
    </div>
  );
}

export function FullAccessBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
      <CheckCircle className="w-3 h-3" />
      Accès complet
    </div>
  );
}

export function LimitedAccessBadge({ message }: { message?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
      <AlertTriangle className="w-3 h-3" />
      {message || 'Accès limité'}
    </div>
  );
}
