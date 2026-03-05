import { Clock, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { BreakTimingInfo } from '../../utils/breakManagement';
import { formatDuration } from '../../utils/breakManagement';

interface CheckoutEligibilityCardProps {
  timingInfo: BreakTimingInfo;
  hasCheckedOut: boolean;
}

export default function CheckoutEligibilityCard({ timingInfo, hasCheckedOut }: CheckoutEligibilityCardProps) {
  if (hasCheckedOut) {
    return null;
  }

  if (!timingInfo.checkoutEligibleAt) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pointage de Départ</h3>
          <LogOut className="w-6 h-6 text-gray-400" />
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <Clock className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Non Disponible</p>
            <p className="text-sm text-gray-600">
              Terminez votre pause pour activer le pointage de départ
            </p>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const canCheckoutNow = timingInfo.canCheckout;
  const isInWindow = timingInfo.isInCheckoutWindow;

  if (canCheckoutNow && isInWindow) {
    const timeRemaining = timingInfo.checkoutWindowClosesAt
      ? Math.floor((timingInfo.checkoutWindowClosesAt.getTime() - now.getTime()) / 1000)
      : 0;

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pointage de Départ</h3>
          <LogOut className="w-6 h-6 text-green-600" />
        </div>

        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900">Départ Autorisé</p>
            <p className="text-sm text-green-700">
              Vous pouvez maintenant effectuer votre pointage de départ
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">Fenêtre de Pointage</span>
          </div>
          <p className="text-sm text-yellow-700 mb-2">
            Vous avez une fenêtre de 2 heures pour effectuer votre départ
          </p>
          <p className="text-2xl font-bold text-yellow-900">
            {formatDuration(timeRemaining)} restantes
          </p>
        </div>

        <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{
              width: `${(timingInfo.workHoursAfterBreak / timingInfo.minimum_work_hours_after_break) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Temps travaillé après pause : {timingInfo.workHoursAfterBreak.toFixed(2)}h / 4h
        </p>
      </div>
    );
  }

  if (canCheckoutNow && !isInWindow) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pointage de Départ</h3>
          <LogOut className="w-6 h-6 text-red-600" />
        </div>

        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Fenêtre de Pointage Expirée</p>
            <p className="text-sm text-red-700">
              Veuillez contacter votre superviseur pour effectuer le pointage manuellement
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timeUntilEligible = timingInfo.checkoutEligibleAt
    ? Math.floor((timingInfo.checkoutEligibleAt.getTime() - now.getTime()) / 1000)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pointage de Départ</h3>
        <LogOut className="w-6 h-6 text-gray-400" />
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-blue-900">Départ Disponible Dans</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {formatDuration(timeUntilEligible)}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-700 mb-2">
          Temps travaillé après pause : <strong>{timingInfo.workHoursAfterBreak.toFixed(2)}h</strong>
        </p>
        <p className="text-sm text-gray-700 mb-3">
          Temps requis : <strong>4 heures</strong>
        </p>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, (timingInfo.workHoursAfterBreak / 4) * 100)}%`,
            }}
          />
        </div>
      </div>

      {timingInfo.checkoutEligibleAt && (
        <p className="text-xs text-gray-600 text-center mt-4">
          Départ autorisé à partir de{' '}
          {timingInfo.checkoutEligibleAt.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
