import { MapPin, RefreshCw, ShieldCheck, AlertTriangle, Loader2, WifiOff } from 'lucide-react';
import type { GeofencingState } from '../../hooks/useGeofencing';

interface Props {
  geo: GeofencingState;
  onRefresh: () => void;
}

export function GeofenceStatus({ geo, onRefresh }: Props) {
  if (geo.isExemptRole) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-800">Accès distant autorisé</p>
          <p className="text-xs text-blue-600">Votre rôle vous permet de pointer depuis n'importe quel lieu.</p>
        </div>
      </div>
    );
  }

  if (geo.isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-700">Localisation en cours...</p>
          <p className="text-xs text-gray-500">Veuillez patienter pendant la détection GPS.</p>
        </div>
      </div>
    );
  }

  if (geo.error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <WifiOff className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">GPS indisponible</p>
          <p className="text-xs text-red-600 truncate">{geo.error}</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex-shrink-0 p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
          title="Réessayer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const isWithin = geo.isWithinZone;
  const distance = geo.distanceFromOffice;
  const accuracy = geo.accuracy ? Math.round(geo.accuracy) : null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
      isWithin
        ? 'bg-green-50 border-green-100'
        : 'bg-amber-50 border-amber-100'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isWithin ? 'bg-green-100' : 'bg-amber-100'
      }`}>
        {isWithin
          ? <MapPin className="w-4 h-4 text-green-600" />
          : <AlertTriangle className="w-4 h-4 text-amber-600" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${isWithin ? 'text-green-800' : 'text-amber-800'}`}>
            {isWithin ? 'Zone autorisée' : 'Hors zone de pointage'}
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isWithin ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isWithin ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
            {isWithin ? 'En zone' : 'Hors zone'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {distance !== null && (
            <p className="text-xs text-gray-600">
              Distance : <span className="font-medium">{distance}m</span>
              <span className="text-gray-400"> / rayon 20m</span>
            </p>
          )}
          {accuracy !== null && (
            <p className="text-xs text-gray-400">Précision ±{accuracy}m</p>
          )}
        </div>
      </div>

      {distance !== null && (
        <div className="flex-shrink-0 text-right">
          <div className={`text-lg font-bold ${isWithin ? 'text-green-700' : 'text-amber-700'}`}>
            {distance}m
          </div>
          <button
            onClick={onRefresh}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            title="Actualiser"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
