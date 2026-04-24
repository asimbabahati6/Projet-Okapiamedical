import { LogIn, LogOut, Coffee, ArrowRight, Loader as Loader2, Lock } from 'lucide-react';
import type { TodayStatus } from '../../services/smartPunchService';

interface Props {
  todayStatus: TodayStatus;
  canPunch: boolean;
  isExemptRole: boolean;
  isLoading: boolean;
  breakElapsedMinutes: number | null;
  onPunch: (type: 'check_in' | 'check_out' | 'break_start' | 'break_end') => void;
}

const BREAK_LIMIT = 60;
const BREAK_WARNING = 55;

export function PunchButton({ todayStatus, canPunch, isExemptRole, isLoading, breakElapsedMinutes, onPunch }: Props) {
  const { currentStatus } = todayStatus;

  const isBreakWarning = breakElapsedMinutes !== null && breakElapsedMinutes >= BREAK_WARNING;
  const isBreachExceeded = breakElapsedMinutes !== null && breakElapsedMinutes >= BREAK_LIMIT;

  const buttonConfig = (() => {
    switch (currentStatus) {
      case 'not_started':
        return {
          label: 'Pointer l\'arrivée',
          sublabel: 'Commencer la journée',
          icon: LogIn,
          punchType: 'check_in' as const,
          colorClass: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200',
          ringClass: 'ring-blue-200',
        };
      case 'present':
        return {
          label: 'Prendre une pause',
          sublabel: 'Démarrer la pause (60 min max)',
          icon: Coffee,
          punchType: 'break_start' as const,
          colorClass: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-200',
          ringClass: 'ring-amber-200',
        };
      case 'on_break':
        return {
          label: isBreachExceeded ? 'Pause dépassée !' : 'Retour de pause',
          sublabel: breakElapsedMinutes !== null
            ? isBreachExceeded
              ? `Dépassement de ${breakElapsedMinutes - BREAK_LIMIT} min`
              : `Pause en cours: ${breakElapsedMinutes} / ${BREAK_LIMIT} min`
            : 'Reprendre le travail',
          icon: ArrowRight,
          punchType: 'break_end' as const,
          colorClass: isBreachExceeded
            ? 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200'
            : isBreakWarning
            ? 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200'
            : 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-200',
          ringClass: isBreachExceeded ? 'ring-red-200' : isBreakWarning ? 'ring-orange-200' : 'ring-green-200',
        };
      case 'departed':
        return {
          label: 'Journée terminée',
          sublabel: 'Vous avez déjà pointé votre sortie',
          icon: LogOut,
          punchType: 'check_out' as const,
          colorClass: 'from-gray-400 to-gray-500 shadow-gray-200',
          ringClass: 'ring-gray-200',
        };
      default:
        return null;
    }
  })();

  if (!buttonConfig) return null;

  const isDisabled = !canPunch || isLoading || (currentStatus as string) === 'departed';
  const Icon = buttonConfig.icon;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Break progress bar (only when on break) */}
      {currentStatus === 'on_break' && breakElapsedMinutes !== null && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-500">Durée de pause</span>
            <span className={`text-xs font-semibold ${
              isBreachExceeded ? 'text-red-600' : isBreakWarning ? 'text-orange-500' : 'text-gray-700'
            }`}>
              {breakElapsedMinutes} / {BREAK_LIMIT} min
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isBreachExceeded ? 'bg-red-500' : isBreakWarning ? 'bg-orange-400' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, (breakElapsedMinutes / BREAK_LIMIT) * 100)}%` }}
            />
          </div>
          {isBreakWarning && !isBreachExceeded && (
            <p className="text-xs text-orange-600 mt-1.5 text-center font-medium animate-pulse">
              ⚠ Retournez au travail dans {BREAK_LIMIT - breakElapsedMinutes} minute(s)
            </p>
          )}
          {isBreachExceeded && (
            <p className="text-xs text-red-600 mt-1.5 text-center font-semibold animate-pulse">
              ⛔ Pause dépassée de {breakElapsedMinutes - BREAK_LIMIT} minute(s) !
            </p>
          )}
        </div>
      )}

      {/* Main punch button */}
      <div className="relative">
        {/* Animated ring (only when active and enabled) */}
        {!isDisabled && (currentStatus as string) !== 'departed' && (
          <span className={`absolute inset-0 rounded-full ring-8 ${buttonConfig.ringClass} animate-ping opacity-30`} />
        )}

        <button
          onClick={() => !isDisabled && onPunch(buttonConfig.punchType)}
          disabled={isDisabled}
          className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 text-white font-bold text-sm transition-all transform active:scale-95
            ${isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              : `bg-gradient-to-br ${buttonConfig.colorClass} shadow-xl hover:scale-105 cursor-pointer`
            }
          `}
        >
          {isLoading ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : isDisabled && !isExemptRole && (currentStatus as string) !== 'departed' ? (
            <>
              <Lock className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-500 text-center px-4 leading-tight">
                Hors zone de pointage
              </span>
            </>
          ) : (
            <>
              <Icon className="w-10 h-10" />
              <span className="text-center px-2 leading-tight">{buttonConfig.label}</span>
            </>
          )}
        </button>
      </div>

      <p className={`text-sm text-center max-w-xs ${
        isDisabled && (currentStatus as string) !== 'departed' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {isDisabled && !isExemptRole && (currentStatus as string) !== 'departed'
          ? 'Rapprochez-vous du bureau OKAPIA Medical pour activer le pointage.'
          : buttonConfig.sublabel
        }
      </p>
    </div>
  );
}
