import { MapPinOff, RefreshCw, Settings, Smartphone, Globe } from 'lucide-react';
import type { GpsErrorType } from '../../hooks/useGeofencing';

interface Props {
  errorType: GpsErrorType;
  onRetry: () => void;
}

function getInstructions(errorType: GpsErrorType) {
  switch (errorType) {
    case 'permission_denied':
      return {
        title: 'Accès GPS refusé',
        description: 'Le navigateur n\'a pas la permission d\'accéder à votre position. Le pointage nécessite la géolocalisation.',
        steps: [
          { icon: Globe, text: 'Cliquez sur l\'icône de cadenas (ou d\'information) dans la barre d\'adresse de votre navigateur.' },
          { icon: Settings, text: 'Recherchez le paramètre "Position" ou "Localisation" et autorisez l\'accès.' },
          { icon: RefreshCw, text: 'Rechargez ensuite cette page pour que la modification soit prise en compte.' },
        ],
      };
    case 'position_unavailable':
      return {
        title: 'Signal GPS indisponible',
        description: 'Le capteur GPS ne parvient pas à déterminer votre position. Ce problème est fréquent en intérieur à Kinshasa.',
        steps: [
          { icon: Smartphone, text: 'Vérifiez que le GPS (localisation) est activé dans les paramètres de votre appareil.' },
          { icon: Globe, text: 'Rapprochez-vous d\'une fenêtre ou sortez brièvement pour améliorer le signal.' },
          { icon: RefreshCw, text: 'Attendez quelques secondes puis appuyez sur "Réessayer" ci-dessous.' },
        ],
      };
    case 'timeout':
      return {
        title: 'Délai GPS dépassé',
        description: 'Le capteur GPS n\'a pas répondu dans le temps imparti (10 secondes).',
        steps: [
          { icon: Smartphone, text: 'Assurez-vous d\'avoir une bonne connexion réseau (Wi-Fi ou données mobiles).' },
          { icon: Globe, text: 'Si vous êtes en intérieur, déplacez-vous vers un endroit avec une meilleure réception.' },
          { icon: RefreshCw, text: 'Appuyez sur "Réessayer" pour relancer la détection GPS.' },
        ],
      };
    case 'not_supported':
      return {
        title: 'GPS non supporté',
        description: 'Votre navigateur ne prend pas en charge la géolocalisation.',
        steps: [
          { icon: Globe, text: 'Utilisez un navigateur moderne (Chrome, Firefox, Safari, Edge).' },
          { icon: Smartphone, text: 'Assurez-vous que votre appareil dispose d\'un capteur GPS.' },
          { icon: RefreshCw, text: 'Essayez d\'ouvrir cette page dans un autre navigateur.' },
        ],
      };
    default:
      return {
        title: 'Erreur de géolocalisation',
        description: 'Une erreur inattendue est survenue lors de l\'accès au GPS.',
        steps: [
          { icon: RefreshCw, text: 'Rechargez la page et réessayez.' },
        ],
      };
  }
}

export function GpsBlockingModal({ errorType, onRetry }: Props) {
  const info = getInstructions(errorType);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-red-50 px-6 py-5 flex items-center gap-4 border-b border-red-100">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <MapPinOff className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-900">{info.title}</h2>
            <p className="text-sm text-red-700 mt-0.5">{info.description}</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Instructions :</h3>
          <ol className="space-y-3">
            {info.steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <StepIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold text-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer la localisation
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Le pointage est impossible sans validation GPS.
          </p>
        </div>
      </div>
    </div>
  );
}
