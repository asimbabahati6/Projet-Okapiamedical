import { useState } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { UserRole } from '@/config/rbac';
import { ROLE_DISPLAY_NAMES } from '@/utils/roleMapping';

interface SimulationConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string, autoEndMinutes?: number) => void;
  targetRole: UserRole;
  currentRole: UserRole;
  requireReason?: boolean;
}

export function SimulationConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  targetRole,
  currentRole,
  requireReason = false
}: SimulationConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [autoEndMinutes, setAutoEndMinutes] = useState<number | undefined>(undefined);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      alert('Veuillez indiquer une raison pour cette simulation');
      return;
    }

    if (!acknowledged) {
      alert('Veuillez confirmer que vous comprenez les limitations du mode simulation');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason || undefined, autoEndMinutes);
      handleClose();
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Erreur lors du démarrage de la simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setAutoEndMinutes(undefined);
    setAcknowledged(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-amber-500 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Confirmation de Simulation de Rôle</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-amber-600 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Attention: Mode Simulation</p>
                <p className="text-sm text-amber-800 mt-1">
                  Vous êtes sur le point d'activer le mode simulation. Ce mode est destiné aux tests uniquement.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Votre rôle actuel</p>
              <p className="font-semibold text-lg">
                {ROLE_DISPLAY_NAMES[currentRole as keyof typeof ROLE_DISPLAY_NAMES] || currentRole}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
              <p className="text-sm text-amber-700 mb-1">Rôle simulé</p>
              <p className="font-semibold text-lg text-amber-900">
                {ROLE_DISPLAY_NAMES[targetRole as keyof typeof ROLE_DISPLAY_NAMES] || targetRole}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la simulation {requireReason && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                rows={3}
                placeholder="Ex: Test des permissions pour la gestion des patients..."
                required={requireReason}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Durée maximale (optionnel)
              </label>
              <select
                value={autoEndMinutes || ''}
                onChange={(e) => setAutoEndMinutes(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Illimitée (jusqu'à arrêt manuel)</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 heure</option>
                <option value="120">2 heures</option>
                <option value="240">4 heures</option>
                <option value="480">8 heures</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                La session se terminera automatiquement après cette durée
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Limitations du mode simulation:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Toutes vos actions sont enregistrées dans un journal d'audit</li>
              <li>• Certaines opérations sensibles peuvent être désactivées</li>
              <li>• Vos permissions réelles ne changent pas</li>
              <li>• Les données créées/modifiées sont réelles, pas de "bac à sable"</li>
              <li>• Un administrateur peut mettre fin à votre session à tout moment</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">
              Je comprends que ce mode est destiné aux tests uniquement et que toutes mes actions seront enregistrées dans un journal d'audit.
            </span>
          </label>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg border-t">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!acknowledged || loading}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Démarrage...
              </>
            ) : (
              'Démarrer la Simulation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
