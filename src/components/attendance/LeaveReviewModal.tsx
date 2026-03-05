import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface Leave {
  id: string;
  staff: { full_name: string; email: string };
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  review_notes?: string;
}

interface LeaveReviewModalProps {
  leave: Leave;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeaveReviewModal({ leave, isAdmin, onClose, onSuccess }: LeaveReviewModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleReview(newStatus: 'approved' | 'rejected') {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: newStatus,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', leave.id);

      if (error) throw error;

      showToast(`Demande ${newStatus === 'approved' ? 'approuvée' : 'refusée'}`, 'success');
      onSuccess();
    } catch (error) {
      console.error('Error reviewing leave:', error);
      showToast('Erreur lors de la révision', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Détails de la Demande</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Employé</p>
              <p className="font-medium text-gray-900">{leave.staff.full_name}</p>
              <p className="text-sm text-gray-600">{leave.staff.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type de congé</p>
              <p className="font-medium text-gray-900">{leave.leave_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date de début</p>
              <p className="font-medium text-gray-900">
                {new Date(leave.start_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de fin</p>
              <p className="font-medium text-gray-900">
                {new Date(leave.end_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Durée totale</p>
            <p className="font-medium text-gray-900">{leave.total_days} jour{leave.total_days > 1 ? 's' : ''}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Motif</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">{leave.reason}</p>
            </div>
          </div>

          {isAdmin && leave.status === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes de révision (optionnel)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ajoutez des notes concernant votre décision..."
              />
            </div>
          )}

          {leave.review_notes && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Notes de révision</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">{leave.review_notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          {isAdmin && leave.status === 'pending' ? (
            <>
              <button
                onClick={() => handleReview('rejected')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Refuser
              </button>
              <button
                onClick={() => handleReview('approved')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                Approuver
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
