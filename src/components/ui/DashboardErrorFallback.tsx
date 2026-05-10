import { WifiOff, RefreshCw } from 'lucide-react';

interface DashboardErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function DashboardErrorFallback({
  message = 'Impossible de charger les données. Vérifiez votre connexion et réessayez.',
  onRetry,
}: DashboardErrorFallbackProps) {
  return (
    <div className="bg-white border border-red-100 rounded-xl p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <WifiOff className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Erreur de chargement
      </h3>
      <p className="text-gray-600 text-sm max-w-sm mx-auto mb-5">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}
