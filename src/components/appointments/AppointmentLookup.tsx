import { useState } from 'react';
import { Search, Calendar, Clock, User, Video, MapPin, AlertCircle, CheckCircle, X, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../types/database';
import { formatDoctorName } from '../../utils/formatDoctorName';

interface AppointmentLookupProps {
  onClose: () => void;
  onModify?: (appointment: Appointment) => void;
}

export function AppointmentLookup({ onClose, onModify }: AppointmentLookupProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAppointment(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          doctor:medical_staff(*, user_profile:user_profiles(*)),
          service:services(*),
          department:departments(*)
        `)
        .eq('confirmation_code', confirmationCode.toUpperCase())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('No appointment found with this confirmation code.');
        return;
      }

      if (data.patient?.email?.toLowerCase() !== email.toLowerCase()) {
        setError('Email does not match the appointment record.');
        return;
      }

      setAppointment(data as Appointment);
    } catch (err) {
      console.error('Error looking up appointment:', err);
      setError('Failed to look up appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!appointment || !cancelReason.trim()) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancelReason,
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      await supabase
        .from('appointment_modifications')
        .insert([{
          appointment_id: appointment.id,
          modification_type: 'cancelled',
          old_values: { status: appointment.status },
          new_values: { status: 'cancelled', cancellation_reason: cancelReason },
          reason: cancelReason,
        }]);

      setCancelSuccess(true);
      setShowCancelForm(false);
      setAppointment(null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canModify = appointment &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'completed' &&
    new Date(appointment.appointment_date) > new Date();

  const canCancel = appointment &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'completed';

  if (cancelSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Cancellation Confirmed</h3>
            <p className="text-gray-600 mb-6">
              Your appointment has been successfully cancelled. You will receive a confirmation email shortly.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Manage Your Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!appointment && !showCancelForm ? (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Code
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Find Appointment
                  </>
                )}
              </button>
            </form>
          ) : appointment && !showCancelForm ? (
            <div className="space-y-6">
              <div className={`border-l-4 rounded-lg p-6 ${
                appointment.status === 'cancelled' ? 'border-red-500 bg-red-50' :
                appointment.status === 'completed' ? 'border-green-500 bg-green-50' :
                appointment.status === 'confirmed' ? 'border-blue-500 bg-blue-50' :
                'border-yellow-500 bg-yellow-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`text-lg font-bold capitalize ${
                      appointment.status === 'cancelled' ? 'text-red-700' :
                      appointment.status === 'completed' ? 'text-green-700' :
                      appointment.status === 'confirmed' ? 'text-blue-700' :
                      'text-yellow-700'
                    }`}>
                      {appointment.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Confirmation Code</p>
                    <p className="text-lg font-bold text-gray-900">{appointment.confirmation_code}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-700 mb-2">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-semibold">Date</span>
                  </div>
                  <p className="text-gray-900">{new Date(appointment.appointment_date).toLocaleDateString()}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-700 mb-2">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-semibold">Time</span>
                  </div>
                  <p className="text-gray-900">{appointment.appointment_time.slice(0, 5)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-700 mb-2">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-semibold">Doctor</span>
                  </div>
                  <p className="text-gray-900">{formatDoctorName(appointment.doctor?.user_profile?.full_name)}</p>
                  <p className="text-sm text-gray-600">{appointment.doctor?.specialization}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-700 mb-2">
                    {appointment.appointment_type === 'telemedicine' ? (
                      <Video className="w-5 h-5 mr-2 text-blue-600" />
                    ) : (
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    )}
                    <span className="font-semibold">Motif</span>
                  </div>
                  <p className="text-gray-900 capitalize">{appointment.appointment_type}</p>
                </div>
              </div>

              {appointment.reason && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-700 mb-2">Reason for Visit</p>
                  <p className="text-gray-900">{appointment.reason}</p>
                </div>
              )}

              {appointment.special_requirements && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-700 mb-2">Special Requirements</p>
                  <p className="text-gray-900">{appointment.special_requirements}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {canCancel && (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel Appointment
                  </button>
                )}
                {canModify && onModify && (
                  <button
                    onClick={() => onModify(appointment)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-5 h-5" />
                    Modify
                  </button>
                )}
              </div>
            </div>
          ) : showCancelForm && appointment ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Are you sure you want to cancel?</p>
                  <p className="text-sm text-yellow-800">
                    This action cannot be undone. Please provide a reason for cancellation.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you need to cancel..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancelReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading || !cancelReason.trim()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
