import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, User, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface BreakEscalation {
  id: string;
  staff_id: string;
  break_exceeded_minutes: number;
  escalated_at: string;
  acknowledged_at: string | null;
  notes: string | null;
  staff: {
    full_name: string;
    email: string;
  };
}

interface SupervisorBreakEscalationsProps {
  supervisorId: string;
}

export default function SupervisorBreakEscalations({ supervisorId }: SupervisorBreakEscalationsProps) {
  const { showToast } = useToast();
  const [escalations, setEscalations] = useState<BreakEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState<BreakEscalation | null>(null);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [acknowledgementNotes, setAcknowledgementNotes] = useState('');

  useEffect(() => {
    fetchEscalations();

    const subscription = supabase
      .channel('break_escalations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'break_escalations',
          filter: `supervisor_id=eq.${supervisorId}`,
        },
        () => {
          fetchEscalations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supervisorId]);

  async function fetchEscalations() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('break_escalations')
        .select(`
          *,
          staff:user_profiles!break_escalations_staff_id_fkey(
            full_name,
            email
          )
        `)
        .eq('supervisor_id', supervisorId)
        .order('escalated_at', { ascending: false });

      if (error) throw error;
      setEscalations(data || []);
    } catch (error) {
      console.error('Error fetching escalations:', error);
      showToast('Erreur lors du chargement des escalades', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge() {
    if (!selectedEscalation) return;

    try {
      const { error } = await supabase
        .from('break_escalations')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: supervisorId,
          notes: acknowledgementNotes || null,
        })
        .eq('id', selectedEscalation.id);

      if (error) throw error;

      showToast('Escalade accusée réception avec succès', 'success');
      setShowAcknowledgeModal(false);
      setSelectedEscalation(null);
      setAcknowledgementNotes('');
      fetchEscalations();
    } catch (error) {
      console.error('Error acknowledging escalation:', error);
      showToast('Erreur lors de l\'accusé de réception', 'error');
    }
  }

  const pendingEscalations = escalations.filter((e) => !e.acknowledged_at);
  const acknowledgedEscalations = escalations.filter((e) => e.acknowledged_at);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Escalations */}
      {pendingEscalations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Escalades en Attente
              </h3>
              <p className="text-sm text-gray-600">
                {pendingEscalations.length} violation{pendingEscalations.length > 1 ? 's' : ''} nécessitant votre attention
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingEscalations.map((escalation) => (
              <div
                key={escalation.id}
                className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <User className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        {escalation.staff.full_name}
                      </p>
                      <p className="text-sm text-red-700 mb-2">
                        {escalation.staff.email}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-red-800">
                        <Clock className="w-4 h-4" />
                        <span>
                          Pause dépassée de {escalation.break_exceeded_minutes - 60} minutes
                        </span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        Escaladé le{' '}
                        {new Date(escalation.escalated_at).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEscalation(escalation);
                      setShowAcknowledgeModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Accuser Réception
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acknowledged Escalations */}
      {acknowledgedEscalations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Escalades Traitées
              </h3>
              <p className="text-sm text-gray-600">
                Historique des violations accusées réception
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {acknowledgedEscalations.map((escalation) => (
              <div
                key={escalation.id}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {escalation.staff.full_name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Pause dépassée de {escalation.break_exceeded_minutes - 60} minutes
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Accusé réception le{' '}
                      {escalation.acknowledged_at &&
                        new Date(escalation.acknowledged_at).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                    </p>
                    {escalation.notes && (
                      <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded border border-gray-200">
                        <strong>Notes :</strong> {escalation.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {escalations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune Escalade
          </h3>
          <p className="text-gray-600">
            Il n'y a actuellement aucune violation de pause à signaler
          </p>
        </div>
      )}

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && selectedEscalation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Accuser Réception de l'Escalade
                </h3>
                <p className="text-gray-600">
                  {selectedEscalation.staff.full_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAcknowledgeModal(false);
                  setSelectedEscalation(null);
                  setAcknowledgementNotes('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 mb-2">
                <strong>Détails de la Violation :</strong>
              </p>
              <p className="text-sm text-red-800">
                Pause dépassée de {selectedEscalation.break_exceeded_minutes - 60} minutes
              </p>
              <p className="text-sm text-red-800">
                Durée totale : {selectedEscalation.break_exceeded_minutes} minutes
              </p>
              <p className="text-xs text-red-700 mt-2">
                Escaladé le{' '}
                {new Date(selectedEscalation.escalated_at).toLocaleString('fr-FR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optionnel)
              </label>
              <textarea
                value={acknowledgementNotes}
                onChange={(e) => setAcknowledgementNotes(e.target.value)}
                placeholder="Ajoutez des notes concernant cette violation et les actions prises..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAcknowledgeModal(false);
                  setSelectedEscalation(null);
                  setAcknowledgementNotes('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAcknowledge}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Confirmer l'Accusé de Réception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
