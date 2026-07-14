import { X, Calendar, Clock, User, MapPin, FileText } from 'lucide-react';
import { Appointment } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function AppointmentDetailsModal({ appointment, onClose, onCancel, onDelete }: AppointmentDetailsModalProps) {
  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-amber-100 text-amber-800',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Planifie',
    confirmed: 'Confirme',
    cancelled: 'Annule',
    completed: 'Termine',
    'in-progress': 'En cours',
  };

  const appt = appointment as any;
  const patientName = appt.patient
    ? `${appt.patient.first_name || ''} ${appt.patient.last_name || ''}`.trim()
    : appt.patient_name || 'Patient inconnu';
  const doctorName = appt.doctor
    ? formatDoctorName(appt.doctor)
    : appt.doctor_name || '';
  const status = appt.status || 'scheduled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Details du Rendez-vous</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.scheduled}`}>
              {statusLabels[status] || status}
            </span>
          </div>

          {/* Patient */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Patient</p>
              <p className="text-gray-900 font-semibold">{patientName}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-gray-900">
                {appt.date
                  ? new Date(appt.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Non definie'}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Heure</p>
              <p className="text-gray-900">{appt.time || appt.start_time || 'Non definie'}</p>
            </div>
          </div>

          {/* Doctor */}
          {doctorName && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Medecin</p>
                <p className="text-gray-900">{doctorName}</p>
              </div>
            </div>
          )}

          {/* Department */}
          {appt.department_name && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Departement</p>
                <p className="text-gray-900">{appt.department_name}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {appt.notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-gray-700 text-sm">{appt.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          {onDelete && status !== 'completed' && status !== 'cancelled' && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Supprimer
            </button>
          )}
          {onCancel && status !== 'completed' && status !== 'cancelled' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Annuler le RDV
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetailsModal;
