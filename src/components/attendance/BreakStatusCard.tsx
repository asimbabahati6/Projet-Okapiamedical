import { Clock, Coffee, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { BreakTimingInfo } from '../../utils/breakManagement';
import { formatTimeRemaining, formatDuration } from '../../utils/breakManagement';

interface BreakStatusCardProps {
  timingInfo: BreakTimingInfo;
  isOnBreak: boolean;
}

export default function BreakStatusCard({ timingInfo, isOnBreak }: BreakStatusCardProps) {
  if (!isOnBreak) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Éligibilité à la Pause</h3>
          <Coffee className="w-6 h-6 text-gray-400" />
        </div>

        {timingInfo.canTakeBreak ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Pause Autorisée</p>
              <p className="text-sm text-green-700">
                Vous avez travaillé {timingInfo.workHoursBeforeBreak.toFixed(2)} heures
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900">Pause Disponible Dans</p>
              <p className="text-sm text-yellow-700">
                {formatDuration(Math.floor(timingInfo.timeUntilBreakEligible * 3600))} restantes
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Temps travaillé : {timingInfo.workHoursBeforeBreak.toFixed(2)}h / 4h
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              timingInfo.canTakeBreak ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{
              width: `${Math.min(100, (timingInfo.workHoursBeforeBreak / 4) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Progression vers l'éligibilité à la pause (4 heures requises)
        </p>
      </div>
    );
  }

  const getBreakStatus = () => {
    if (timingInfo.hasExceededLimit) {
      return {
        color: 'red',
        icon: AlertTriangle,
        title: 'Pause Dépassée - Terminaison Automatique',
        message: 'Votre pause sera terminée automatiquement par le système',
      };
    }
    if (timingInfo.hasReachedWarning) {
      return {
        color: 'orange',
        icon: AlertTriangle,
        title: 'Attention - Limite de Temps Approche',
        message: 'Veuillez terminer votre pause rapidement',
      };
    }
    return {
      color: 'blue',
      icon: Coffee,
      title: 'Pause en Cours',
      message: 'Profitez de votre pause',
    };
  };

  const status = getBreakStatus();
  const Icon = status.icon;
  const progressPercentage = (timingInfo.breakDurationMinutes / timingInfo.breakWarningThreshold) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Statut de la Pause</h3>
        <Icon className={`w-6 h-6 text-${status.color}-600`} />
      </div>

      <div className={`flex items-center gap-3 p-4 bg-${status.color}-50 border border-${status.color}-200 rounded-lg mb-4`}>
        <Icon className={`w-6 h-6 text-${status.color}-600 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`font-medium text-${status.color}-900`}>{status.title}</p>
          <p className={`text-sm text-${status.color}-700`}>{status.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-gray-600" />
            <p className="text-sm text-gray-600">Durée Écoulée</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatTimeRemaining(timingInfo.breakDurationSeconds)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {timingInfo.breakDurationMinutes} minutes
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <p className="text-sm text-gray-600">Temps Restant</p>
          </div>
          <p className={`text-3xl font-bold ${timingInfo.hasReachedWarning ? 'text-red-600' : 'text-gray-900'}`}>
            {formatTimeRemaining(timingInfo.remainingBreakSeconds)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {timingInfo.remainingBreakMinutes} minutes
          </p>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            timingInfo.hasExceededLimit
              ? 'bg-red-600'
              : timingInfo.hasReachedWarning
              ? 'bg-orange-500'
              : 'bg-blue-500'
          }`}
          style={{
            width: `${Math.min(100, progressPercentage)}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span>0 min</span>
        <span>30 min</span>
        <span>60 min</span>
      </div>

      {timingInfo.isEarlyBreak && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note :</strong> Cette pause a été prise avant d'avoir effectué 4 heures de travail (
            {timingInfo.workHoursBeforeBreak.toFixed(2)}h travaillées)
          </p>
        </div>
      )}
    </div>
  );
}
