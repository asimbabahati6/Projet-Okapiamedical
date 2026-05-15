import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BookingStepper } from './BookingStepper';
import { BookingRegistrationStep } from './BookingRegistrationStep';
import { BookingTicketStep } from './BookingTicketStep';
import { BookingWaitingStep } from './BookingWaitingStep';

interface BookingEntry {
  id: string;
  ticket_number: string;
  patient_name: string;
  patient_phone: string;
  consultation_type: 'presentiel' | 'visioconference';
  specialty: string;
  doctor_id: string;
  doctor_name: string;
  reason: string;
  consultation_fee: number;
  payment_status: 'pending' | 'paid';
  patient_status: 'pending' | 'paid' | 'called';
  queue_position: number;
  room_number: string | null;
  video_link: string | null;
}

interface MedicalBookingSystemProps {
  onAppointmentCreated?: () => void;
}

export function MedicalBookingSystem({ onAppointmentCreated }: MedicalBookingSystemProps = {}) {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [simulatingCall, setSimulatingCall] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!booking) return;

    const channel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'booking_queue', filter: `id=eq.${booking.id}` },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setBooking((prev) => prev ? {
            ...prev,
            payment_status: (updated.payment_status as 'pending' | 'paid') || prev.payment_status,
            patient_status: (updated.patient_status as 'pending' | 'paid' | 'called') || prev.patient_status,
            queue_position: (updated.queue_position as number) ?? prev.queue_position,
            room_number: (updated.room_number as string) || prev.room_number,
            video_link: (updated.video_link as string) || prev.video_link,
          } : prev);

          if (updated.payment_status === 'paid' && step === 2) {
            setStep(3);
            setSimulatingPayment(false);
          }
          if (updated.patient_status === 'called' && step === 3) {
            setStep(4);
            setSimulatingCall(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, step]);

  async function handleRegistration(data: {
    patientName: string;
    patientPhone: string;
    consultationType: 'presentiel' | 'visioconference';
    specialty: string;
    departmentId: string;
    doctorId: string;
    doctorName: string;
    reason: string;
    consultationFee: number;
    appointmentDate: string; // ✅ nouveau
    appointmentTime: string; // ✅ nouveau
  }) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { count } = await supabase
        .from('booking_queue')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', data.doctorId)
        .in('patient_status', ['pending', 'paid']);

      const position = (count || 0) + 1;
      const ticketNumber = `T-${Date.now().toString(36).toUpperCase()}`;

      const { data: inserted, error } = await supabase
        .from('booking_queue')
        .insert({
          ticket_number: ticketNumber,
          patient_name: data.patientName,
          patient_phone: data.patientPhone,
          consultation_type: data.consultationType,
          specialty: data.specialty,
          department_id: data.departmentId,
          doctor_id: data.doctorId,
          doctor_name: data.doctorName,
          reason: data.reason,
          consultation_fee: data.consultationFee,
          appointment_date: data.appointmentDate, // ✅ nouveau
          appointment_time: data.appointmentTime, // ✅ nouveau
          payment_status: 'pending',
          patient_status: 'pending',
          queue_position: position,
        })
        .select()
        .single();

      if (error) throw error;

      setBooking({
        id: inserted.id,
        ticket_number: ticketNumber,
        patient_name: data.patientName,
        patient_phone: data.patientPhone,
        consultation_type: data.consultationType,
        specialty: data.specialty,
        doctor_id: data.doctorId,
        doctor_name: data.doctorName,
        reason: data.reason,
        consultation_fee: data.consultationFee,
        payment_status: 'pending',
        patient_status: 'pending',
        queue_position: position,
        room_number: null,
        video_link: null,
      });
      setTotalInQueue(position);
      setStep(2);
      onAppointmentCreated?.();
    } catch (err: unknown) {
      console.error('Error creating booking:', err);
      const message = (err && typeof err === 'object' && 'message' in err) ? String((err as { message: string }).message) : 'Erreur inconnue';
      setErrorMessage(`Echec de l'inscription: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulatePayment() {
    if (!booking) return;
    setSimulatingPayment(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase
        .from('booking_queue')
        .update({ payment_status: 'paid', patient_status: 'paid' })
        .eq('id', booking.id);

      if (error) throw error;

      setBooking((prev) => prev ? { ...prev, payment_status: 'paid', patient_status: 'paid' } : prev);
      setStep(3);
    } catch (err: unknown) {
      console.error('Error:', err);
      setErrorMessage('Le paiement a echoue. Veuillez reessayer.');
    } finally {
      setSimulatingPayment(false);
    }
  }

  async function handleSimulateDoctorCall() {
    if (!booking) return;
    setSimulatingCall(true);
    setErrorMessage(null);
    try {
      const room = `Salle ${Math.floor(Math.random() * 10) + 1}`;
      const videoLink = booking.consultation_type === 'visioconference'
        ? `https://meet.okapia.cd/${booking.id.slice(0, 8)}`
        : null;

      const { error } = await supabase
        .from('booking_queue')
        .update({
          patient_status: 'called',
          room_number: room,
          video_link: videoLink,
        })
        .eq('id', booking.id);

      if (error) throw error;

      setBooking((prev) => prev ? { ...prev, patient_status: 'called', room_number: room, video_link: videoLink } : prev);
      setStep(4);
    } catch (err: unknown) {
      console.error('Error:', err);
      setErrorMessage('Erreur lors de la notification.');
    } finally {
      setSimulatingCall(false);
    }
  }

  function handleReset() {
    setStep(1);
    setBooking(null);
    setSimulatingPayment(false);
    setSimulatingCall(false);
    setErrorMessage(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <BookingStepper currentStep={step} />
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="mt-1 text-xs text-red-500 underline hover:text-red-700"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="registration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BookingRegistrationStep onSubmit={handleRegistration} loading={submitting} />
            </motion.div>
          )}

          {step === 2 && booking && (
            <motion.div key="ticket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BookingTicketStep
                ticket={{
                  id: booking.id,
                  ticketNumber: booking.ticket_number,
                  patientName: booking.patient_name,
                  patientPhone: booking.patient_phone,
                  consultationType: booking.consultation_type,
                  specialty: booking.specialty,
                  doctorName: booking.doctor_name,
                  reason: booking.reason,
                  consultationFee: booking.consultation_fee,
                  paymentStatus: booking.payment_status,
                  queuePosition: booking.queue_position,
                }}
                onSimulatePayment={handleSimulatePayment}
                simulatingPayment={simulatingPayment}
              />
            </motion.div>
          )}

          {step === 3 && booking && (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BookingWaitingStep
                ticketNumber={booking.ticket_number}
                queuePosition={booking.queue_position}
                totalInQueue={totalInQueue}
                doctorName={booking.doctor_name}
                consultationType={booking.consultation_type}
                roomNumber={booking.room_number || undefined}
                videoLink={booking.video_link || undefined}
                patientStatus={booking.patient_status}
                onSimulateDoctorCall={handleSimulateDoctorCall}
                simulatingCall={simulatingCall}
              />
            </motion.div>
          )}

          {step === 4 && booking && (
            <motion.div key="consultation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center space-y-6 py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                >
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900">Consultation en cours</h2>
                <p className="text-gray-600">
                  {booking.consultation_type === 'visioconference'
                    ? 'Votre teleconsultation est prete.'
                    : `Rendez-vous en ${booking.room_number || 'salle de consultation'}.`}
                </p>
                {booking.video_link && (
                  <a
                    href={booking.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Rejoindre la teleconsultation
                  </a>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nouveau rendez-vous
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
