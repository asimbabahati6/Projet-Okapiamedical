import { useState } from 'react';
import { X, User, Calendar, Clock, Phone, Mail, MapPin, FileText, Video, AlertCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Appointment } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';
import { useAppointmentActions } from '../../hooks/useAppointmentActions';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { DeleteAppointmentModal } from './DeleteAppointmentModal';

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdate?: () => void;
}

export function AppointmentDetailsModal({ appointment, onClose, onUpdate }: AppointmentDetailsModalProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const { cancelAppointment, deleteAppointment, canCancelAppointment, canDeleteAppointment } = useAppointmentActions();

  async function handleCancelConfirm(reason: string) {
    await cancelAppointment(appointment.id, reason);
    setShowCancelModal(false);
    setActionSuccess('cancel');
    setTimeout(() => {
      onUpdate?.();
      onClose();
    }, 2000);
  }

  async function handleDeleteConfirm() {
    await deleteAppointment(appointment.id);
    setShowDeleteModal(false);
    setActionSuccess('delete');
    setTimeout(() => {
      onUpdate?.();
      onClose();
    }, 2000);
  }

  if (actionSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {actionSuccess === 'cancel' ? 'Rendez-vous Annulé' : 'Rendez-vous Supprimé'}
            </h3>
            <p className="text-gray-600">
              {actionSuccess === 'cancel'
                ? 'Le rendez-vous a été annulé avec succès. Les parties concernées seront notifiées.'
                : 'Le rendez-vous a été supprimé définitivement de la base de données.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      no_show: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
      no_show: 'Absent',
    };
    return labels[status as keyof typeof labels] || status;
  }

  function getTypeIcon(type: string) {
    return type === 'telemedicine' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />;
  }

  function getTypeLabel(type: string) {
    return type === 'telemedicine' ? 'Télémédecine' : 'Présentiel';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Détails du Rendez-vous</h2>
            <p className="text-sm text-gray-600">{appointment.appointment_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
                {appointment.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                {appointment.status === 'cancelled' && <AlertCircle className="w-4 h-4" />}
                {getStatusLabel(appointment.status)}
              </span>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                appointment.appointment_type === 'telemedicine'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {getTypeIcon(appointment.appointment_type)}
                {getTypeLabel(appointment.appointment_type)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date du rendez-vous</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Heure</p>
                  <p className="font-semibold text-gray-900">
                    {appointment.appointment_time.substring(0, 5)}
                  </p>
                  {appointment.estimated_duration && (
                    <p className="text-xs text-gray-500">Durée estimée: {appointment.estimated_duration} min</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations Patient
              </h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom complet</p>
                    <p className="font-medium text-gray-900">
                      {appointment.patient?.first_name} {appointment.patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numéro patient</p>
                    <p className="font-medium text-gray-900">{appointment.patient?.patient_number}</p>
                  </div>
                  {appointment.patient?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="font-medium text-gray-900">{appointment.patient.phone}</p>
                      </div>
                    </div>
                  )}
                  {appointment.patient?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{appointment.patient.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Médecin
              </h4>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="font-medium text-gray-900">
                      {formatDoctorName(appointment.doctor?.user_profile?.full_name)}
                    </p>
                  </div>
                  {appointment.doctor?.specialization && (
                    <div>
                      <p className="text-sm text-gray-600">Spécialisation</p>
                      <p className="font-medium text-gray-900">{appointment.doctor.specialization}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {appointment.reason && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Motif de consultation
                </h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{appointment.reason}</p>
                </div>
              </div>
            )}

            {appointment.notes && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Notes</h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              </div>
            )}

            {appointment.special_requirements && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Exigences spéciales
                </h4>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-gray-900">{appointment.special_requirements}</p>
                </div>
              </div>
            )}

            {appointment.cancelled_at && appointment.cancellation_reason && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Raison d'annulation
                </h4>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-gray-900">{appointment.cancellation_reason}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Annulé le: {new Date(appointment.cancelled_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-700">Créé le</p>
                <p>{new Date(appointment.created_at).toLocaleString('fr-FR')}</p>
              </div>
              {appointment.checked_in_at && (
                <div>
                  <p className="font-medium text-gray-700">Enregistré le</p>
                  <p>{new Date(appointment.checked_in_at).toLocaleString('fr-FR')}</p>
                </div>
              )}
              {appointment.completed_at && (
                <div>
                  <p className="font-medium text-gray-700">Terminé le</p>
                  <p>{new Date(appointment.completed_at).toLocaleString('fr-FR')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              {canCancelAppointment(appointment) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Annuler le Rendez-vous
                </button>
              )}
              {canDeleteAppointment(appointment) && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer Définitivement
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelAppointmentModal
          appointment={appointment}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {showDeleteModal && (
        <DeleteAppointmentModal
          appointment={appointment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
