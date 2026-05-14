import { MapPin, RefreshCw, ShieldCheck, AlertTriangle, Loader2, WifiOff, Navigation, Signal, SignalLow, SignalZero } from 'lucide-react';
import type { GeofencingState, SignalQuality } from '../../hooks/useGeofencing';

interface Props {
  geo: GeofencingState;
  onRefresh: () => void;
}

function getStatusConfig(geo: GeofencingState): {
  level: 'green' | 'yellow' | 'red';
  label: string;
  sublabel: string;
  badgeText: string;
} {
  const { signalQuality, isWithinZone, distanceFromOffice } = geo;

  if (signalQuality === 'insufficient') {
    return {
      level: 'red',
      label: 'Signal insuffisant',
      sublabel: 'Précision GPS trop faible pour valider la position.',
      badgeText: 'Signal faible',
    };
  }

  if (!isWithinZone) {
    return {
      level: 'red',
      label: 'Hors zone',
      sublabel: `Vous êtes à ${distanceFromOffice}m — le rayon autorisé est de 100m.`,
      badgeText: 'Hors zone',
    };
  }

  if (signalQuality === 'weak') {
    return {
      level: 'yellow',
      label: 'Zone détectée (Signal faible)',
      sublabel: 'Position validée, mais la précision GPS est limitée.',
      badgeText: 'Signal faible',
    };
  }

  return {
    level: 'green',
    label: 'Zone autorisée',
    sublabel: `Vous êtes à ${distanceFromOffice}m du centre.`,
    badgeText: 'En zone',
  };
}

function SignalIcon({ quality }: { quality: SignalQuality }) {
  if (quality === 'good') return <Signal className="w-3.5 h-3.5 text-green-600" />;
  if (quality === 'weak') return <SignalLow className="w-3.5 h-3.5 text-amber-600" />;
  return <SignalZero className="w-3.5 h-3.5 text-red-500" />;
}

const levelStyles = {
  green: {
    container: 'bg-green-50 border-green-200',
    icon: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'text-green-800',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
    distance: 'text-green-700',
  },
  yellow: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    distance: 'text-amber-700',
  },
  red: {
    container: 'bg-red-50 border-red-200',
    icon: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    distance: 'text-red-700',
  },
};

export function GeofenceStatus({ geo, onRefresh }: Props) {
  if (geo.isExemptRole) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800">Accès distant autorisé</p>
            <p className="text-xs text-blue-600">Votre rôle vous permet de pointer depuis n'importe quel lieu.</p>
          </div>
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

  if (geo.error && !geo.signalQuality) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">GPS indisponible</p>
            <p className="text-xs text-red-600 leading-relaxed">{geo.error}</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Navigation className="w-4 h-4" />
          Forcer la relocalisation
        </button>
      </div>
    );
  }

  const config = getStatusConfig(geo);
  const styles = levelStyles[config.level];
  const distance = geo.distanceFromOffice;
  const accuracy = geo.accuracy ? Math.round(geo.accuracy) : null;

  return (
    <div className="space-y-3">
      <div className={`px-4 py-3 rounded-xl border transition-all ${styles.container}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${styles.icon}`}>
            {config.level === 'red'
              ? <AlertTriangle className={`w-4 h-4 ${styles.iconColor}`} />
              : <MapPin className={`w-4 h-4 ${styles.iconColor}`} />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold ${styles.title}`}>
                {config.label}
              </p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`} />
                {config.badgeText}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{config.sublabel}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {distance !== null && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">
                  <span className={`font-semibold ${styles.distance}`}>{distance}m</span>
                  <span className="text-gray-400"> / 100m</span>
                </span>
              </div>
            )}
            {accuracy !== null && (
              <div className="flex items-center gap-1.5">
                <SignalIcon quality={geo.signalQuality} />
                <span className="text-xs text-gray-500">
                  ±{accuracy}m
                </span>
              </div>
            )}
          </div>
          {geo.lastUpdated && (
            <span className="text-xs text-gray-400">
              {geo.lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
      >
        <Navigation className="w-4 h-4" />
        Forcer la relocalisation
      </button>
    </div>
  );
}
