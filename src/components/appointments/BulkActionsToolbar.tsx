import { useState } from 'react';
import { XCircle, Trash2, X, Download } from 'lucide-react';
import { Appointment } from '../../types/database';
import { useAppointmentActions } from '../../hooks/useAppointmentActions';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedAppointments: Appointment[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedAppointments,
  onClearSelection,
  onSuccess
}: BulkActionsToolbarProps) {
  const [showBulkCancelModal, setShowBulkCancelModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { bulkCancelAppointments, bulkDeleteAppointments } = useAppointmentActions();

  const canCancelSelected = selectedAppointments.some(
    a => a.status !== 'cancelled' && a.status !== 'completed'
  );

  const canDeleteSelected = selectedAppointments.some(
    a => a.status === 'cancelled' || a.status === 'no_show'
  );

  async function handleBulkCancel() {
    if (!reason.trim()) return;

    setLoading(true);
    try {
      const idsToCancel = selectedAppointments
        .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
        .map(a => a.id);

      await bulkCancelAppointments(idsToCancel, reason);
      setShowBulkCancelModal(false);
      onSuccess();
      onClearSelection();
    } catch (error) {
      console.error('Bulk cancel failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (confirmText !== 'SUPPRIMER') return;

    setLoading(true);
    try {
      const idsToDelete = selectedAppointments
        .filter(a => a.status === 'cancelled' || a.status === 'no_show')
        .map(a => a.id);

      await bulkDeleteAppointments(idsToDelete);
      setShowBulkDeleteModal(false);
      onSuccess();
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportSelected() {
    const headers = ['Numéro', 'Patient', 'Médecin', 'Date', 'Heure', 'Statut', 'Motif'];
    const rows = selectedAppointments.map(a => [
      a.appointment_number,
      `${a.patient?.first_name} ${a.patient?.last_name}`,
      a.doctor?.user_profile?.full_name || '',
      new Date(a.appointment_date).toLocaleDateString('fr-FR'),
      a.appointment_time.substring(0, 5),
      a.status,
      a.reason || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rendez-vous-selection-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
        <div className="bg-blue-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-700 px-3 py-1 rounded-full font-bold text-lg">
              {selectedCount}
            </div>
            <span className="font-medium">
              {selectedCount === 1 ? 'rendez-vous sélectionné' : 'rendez-vous sélectionnés'}
            </span>
          </div>

          <div className="h-8 w-px bg-blue-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={exportSelected}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium flex items-center gap-2"
              title="Exporter la sélection"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>

            {canCancelSelected && (
              <button
                onClick={() => setShowBulkCancelModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Annuler les rendez-vous sélectionnés"
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            )}

            {canDeleteSelected && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2 bg-red-800 hover:bg-red-900 rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Supprimer définitivement"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}

            <button
              onClick={onClearSelection}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
              title="Annuler la sélection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showBulkCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Annuler {selectedCount} rendez-vous
            </h3>
            <p className="text-gray-600 mb-4">
              Vous êtes sur le point d'annuler {selectedCount} rendez-vous. Cette action notifiera tous les patients et médecins concernés.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Raison de l'annulation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Saisir la raison..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkCancelModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={loading}
              >
                Retour
              </button>
              <button
                onClick={handleBulkCancel}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                disabled={loading || !reason.trim()}
              >
                {loading ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">
              Suppression définitive de {selectedCount} rendez-vous
            </h3>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold">
                ATTENTION : Cette action est irréversible !
              </p>
              <p className="text-red-700 text-sm mt-2">
                Tous les rendez-vous sélectionnés seront définitivement supprimés de la base de données.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tapez <span className="font-mono font-bold text-red-600">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono uppercase"
                disabled={loading}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                disabled={loading || confirmText !== 'SUPPRIMER'}
              >
                {loading ? 'Suppression...' : 'Supprimer Définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
