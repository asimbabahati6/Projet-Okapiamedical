import { useState } from 'react';
import { X, AlertTriangle, Calendar, User, Clock } from 'lucide-react';
import { Appointment } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface CancelAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function CancelAppointmentModal({ appointment, onClose, onConfirm }: CancelAppointmentModalProps) {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predefinedReasons = [
    'Conflit d\'horaire',
    'Patient indisponible',
    'Urgence médicale',
    'Demande du patient',
    'Médecin indisponible',
    'Conditions météorologiques',
    'Autre'
  ];

  const isFutureAppointment = new Date(appointment.appointment_date) > new Date();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalReason = selectedReason === 'Autre' ? reason : selectedReason;

    if (!finalReason.trim()) {
      setError('Veuillez sélectionner ou saisir une raison d\'annulation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm(finalReason);
    } catch (err) {
      setError('Échec de l\'annulation. Veuillez réessayer.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Annuler le Rendez-vous</h2>
              <p className="text-sm text-gray-600">{appointment.appointment_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Attention : Cette action ne peut pas être annulée
                </h3>
                <p className="text-sm text-red-800">
                  {isFutureAppointment
                    ? 'Le patient et le médecin seront notifiés de cette annulation.'
                    : 'Vous êtes sur le point d\'annuler un rendez-vous passé. Cette action affectera les statistiques.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-semibold text-gray-900 mb-3">Détails du Rendez-vous</h4>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-medium text-gray-900">
                  {appointment.patient?.first_name} {appointment.patient?.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Médecin</p>
                <p className="font-medium text-gray-900">
                  {formatDoctorName(appointment.doctor?.user_profile?.full_name)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Date et Heure</p>
                <p className="font-medium text-gray-900">
                  {new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {' à '}
                  {appointment.appointment_time.substring(0, 5)}
                </p>
              </div>
            </div>

            {appointment.reason && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Motif</p>
                  <p className="font-medium text-gray-900">{appointment.reason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Raison de l'annulation <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
              required
              disabled={loading}
            >
              <option value="">Sélectionner une raison...</option>
              {predefinedReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {selectedReason === 'Autre' && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Veuillez préciser la raison de l'annulation..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                required
                disabled={loading}
              />
            )}
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
              Retour
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Annulation...' : 'Confirmer l\'annulation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
