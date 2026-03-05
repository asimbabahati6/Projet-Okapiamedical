import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface SimulationCountdownBannerProps {
  autoEndAt: string;
  simulatedRoleName: string;
  originalRoleName: string;
  onEndSimulation: () => void;
}

export function SimulationCountdownBanner({
  autoEndAt,
  simulatedRoleName,
  originalRoleName,
  onEndSimulation
}: SimulationCountdownBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [status, setStatus] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(autoEndAt).getTime();
      const remaining = Math.max(0, endTime - now);

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        onEndSimulation();
      } else if (remaining < 600000) {
        setStatus('critical');
      } else if (remaining < 1800000) {
        setStatus('warning');
      } else {
        setStatus('normal');
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [autoEndAt, onEndSimulation]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          pulse: true
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: AlertTriangle,
          pulse: false
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800',
          icon: Clock,
          pulse: false
        };
    }
  };

  const styles = getStatusStyles();
  const Icon = styles.icon;

  if (timeRemaining <= 0) {
    return null;
  }

  return (
    <div className={`${styles.bg} border-b border-${status === 'critical' ? 'red' : status === 'warning' ? 'yellow' : 'blue'}-200 px-4 py-3`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`${styles.pulse ? 'animate-pulse' : ''}`}>
              <Icon className={`w-5 h-5 ${styles.text}`} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${styles.text}`}>
                Mode Simulation:
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                {simulatedRoleName}
              </span>
              <span className={`text-sm ${styles.text}`}>
                (Rôle original: {originalRoleName})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${styles.text}`} />
              <span className={`font-mono font-bold ${styles.text}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            <button
              onClick={onEndSimulation}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                status === 'critical'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : status === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Retourner à mon rôle
            </button>
          </div>
        </div>

        {status === 'critical' && (
          <div className="mt-2 text-sm text-red-700 font-medium">
            ⚠️ Attention: La session expire dans moins de 10 minutes
          </div>
        )}
      </div>
    </div>
  );
}
