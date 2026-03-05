import { useState } from 'react';
import { X, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { Appointment } from '../../types/database';

interface DeleteAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAppointmentModal({ appointment, onClose, onConfirm }: DeleteAppointmentModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CONFIRMATION_TEXT = 'SUPPRIMER';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (confirmText !== CONFIRMATION_TEXT) {
      setError(`Veuillez saisir "${CONFIRMATION_TEXT}" pour confirmer`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm();
    } catch (err) {
      setError('Échec de la suppression. Veuillez réessayer.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6" />
            <h2 className="text-xl font-bold">Suppression Définitive</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-700 rounded transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">
                  ATTENTION : Action Irréversible
                </h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Cette action supprimera définitivement le rendez-vous</li>
                  <li>• Toutes les données liées seront perdues</li>
                  <li>• Cette opération ne peut pas être annulée</li>
                  <li>• Les statistiques seront affectées</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Rendez-vous à supprimer :</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Numéro :</span> {appointment.appointment_number}</p>
              <p><span className="font-medium">Patient :</span> {appointment.patient?.first_name} {appointment.patient?.last_name}</p>
              <p><span className="font-medium">Date :</span> {new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</p>
              <p><span className="font-medium">Statut :</span> {appointment.status}</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Alternative recommandée :</p>
                <p>Pour conserver l'historique, il est recommandé d'<strong>annuler</strong> le rendez-vous plutôt que de le supprimer définitivement.</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Pour confirmer, tapez <span className="font-mono font-bold text-red-600">{CONFIRMATION_TEXT}</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Saisir le texte de confirmation"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono uppercase"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || confirmText !== CONFIRMATION_TEXT}
            >
              {loading ? 'Suppression...' : 'Supprimer Définitivement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
