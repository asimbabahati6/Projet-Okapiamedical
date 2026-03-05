import { AlertTriangle, Clock, X } from 'lucide-react';

interface EarlyBreakWarningModalProps {
  workHours: number;
  onAccept: () => void;
  onCancel: () => void;
}

export default function EarlyBreakWarningModal({
  workHours,
  onAccept,
  onCancel
}: EarlyBreakWarningModalProps) {
  const hoursRemaining = Math.max(0, 4 - workHours);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Avertissement - Pause Anticipée
            </h3>
            <p className="text-yellow-600 font-medium">
              Vous n'avez pas encore effectué 4 heures de travail
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">Temps de Travail</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-sm text-yellow-700">Temps Effectué</p>
              <p className="text-2xl font-bold text-yellow-900">
                {workHours.toFixed(2)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-yellow-700">Temps Restant</p>
              <p className="text-2xl font-bold text-yellow-900">
                {hoursRemaining.toFixed(2)}h
              </p>
            </div>
          </div>

          <div className="w-full bg-yellow-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all"
              style={{ width: `${(workHours / 4) * 100}%` }}
            />
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Progression : {((workHours / 4) * 100).toFixed(0)}% des 4 heures recommandées
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Informations Importantes</h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>Les pauses anticipées sont autorisées mais déconseillées</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>Une notification sera envoyée à votre adresse email professionnelle</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>La durée maximale de pause reste de 60 minutes</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>Après votre pause, vous devrez travailler 4 heures supplémentaires avant le pointage de départ</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
          >
            Continuer Malgré Tout
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          En continuant, vous confirmez avoir pris connaissance de cet avertissement
        </p>
      </div>
    </div>
  );
}
