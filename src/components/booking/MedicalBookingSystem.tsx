import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BookingStepper } from './BookingStepper';
import { BookingRegistrationStep } from './BookingRegistrationStep';
import { BookingTicketStep } from './BookingTicketStep';
import { BookingWaitingStep } from './BookingWaitingStep';
import { SMSNotificationToast } from './SMSNotificationToast';
import type { SMSToast } from './SMSNotificationToast';

interface BookingData {
  id: string;
  appointmentId: string;
  ticketNumber: string;
  patientName: string;
  patientPhone: string;
  consultationType: 'presentiel' | 'visioconference';
  specialty: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  reason: string;
  consultationFee: number;
  paymentStatus: 'pending' | 'paid';
  patientStatus: 'pending' | 'paid' | 'called';
  queuePosition: number;
  roomNumber: string;
  videoLink: string;
}

export function MedicalBookingSystem() {
  const [currentStep, setCurrentStep] = useState(1);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [smsToasts, setSmsToasts] = useState<SMSToast[]>([]);

  const addSmsToast = useCallback((type: SMSToast['type'], message: string, detail?: string) => {
    const id = Math.random().toString(36).substring(2);
    setSmsToasts((prev) => [...prev, { id, type, message, detail }]);
  }, []);

  const dismissSmsToast = useCallback((id: string) => {
    setSmsToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Realtime subscription for booking updates
  useEffect(() => {
    if (!booking?.id) return;

    const channel = supabase
      .channel(`booking-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'booking_queue',
          filter: `id=eq.${booking.id}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;

          setBooking((prev) => {
            if (!prev) return prev;

            const newPaymentStatus = (updated.payment_status as string) || prev.paymentStatus;
            const newPatientStatus = (updated.patient_status as string) || prev.patientStatus;
            const newQueuePosition = (updated.queue_position as number) ?? prev.queuePosition;
            const newRoom = (updated.room_number as string) || prev.roomNumber;
            const newVideoLink = (updated.video_link as string) || prev.videoLink;

            // Payment confirmed -> fire SMS + move to waiting
            if (newPaymentStatus === 'paid' && prev.paymentStatus === 'pending') {
              addSmsToast(
                'payment',
                'Paiement confirme !',
                `Merci de patienter en salle d'attente. Position: ${newQueuePosition}`
              );

              // Log SMS to database
              logSMS(
                prev.patientPhone,
                `Votre paiement a ete valide. Position en file d'attente: ${newQueuePosition}. Merci de patienter.`,
                'payment_confirmation',
                prev.id
              );

              setTimeout(() => setCurrentStep(3), 1500);
            }

            // Doctor called -> fire SMS + move to consultation
            if (newPatientStatus === 'called' && prev.patientStatus !== 'called') {
              const locationMsg =
                prev.consultationType === 'presentiel'
                  ? `Bureau ${newRoom || 'A-101'}`
                  : `Lien video: ${newVideoLink || 'consultation.okapia.com'}`;

              addSmsToast(
                'doctor_call',
                `Le Dr. ${prev.doctorName} est pret a vous recevoir`,
                locationMsg
              );

              logSMS(
                prev.patientPhone,
                `Le Dr. ${prev.doctorName} est pret a vous recevoir en ${locationMsg}.`,
                'doctor_call',
                prev.id
              );

              setTimeout(() => setCurrentStep(4), 2000);
            }

            return {
              ...prev,
              paymentStatus: newPaymentStatus as BookingData['paymentStatus'],
              patientStatus: newPatientStatus as BookingData['patientStatus'],
              queuePosition: newQueuePosition,
              roomNumber: newRoom,
              videoLink: newVideoLink,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, addSmsToast]);

  // Fetch total queue count
  useEffect(() => {
    if (currentStep >= 3 && booking) {
      fetchQueueCount();
      const interval = setInterval(fetchQueueCount, 10000);
      return () => clearInterval(interval);
    }
  }, [currentStep, booking]);

  async function fetchQueueCount() {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('booking_queue')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .in('payment_status', ['paid'])
      .in('patient_status', ['paid']);

    setTotalInQueue(count || 0);
  }

  async function logSMS(phone: string, message: string, type: string, bookingId: string) {
    await supabase.from('sms_notifications').insert({
      recipient_phone: phone,
      message,
      notification_type: type,
      related_record_type: 'booking_queue',
      related_record_id: bookingId,
      status: 'sent',
      provider: 'simulation',
      sent_at: new Date().toISOString(),
    });
  }

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
  }) {
    setRegistrationLoading(true);

    try {
      // Generate ticket number
      const { data: ticketData } = await supabase.rpc('generate_daily_ticket_number');
      const ticketNumber = ticketData || `T-${String(Date.now()).slice(-3)}`;

      // Create appointment record
      const { data: appointment, error: aptErr } = await supabase
        .from('appointments')
        .insert({
          appointment_number: `APT${Date.now()}`,
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: new Date().toTimeString().split(' ')[0],
          doctor_id: data.doctorId,
          department_id: data.departmentId,
          status: 'pending',
          appointment_type: data.consultationType === 'visioconference' ? 'telemedicine' : 'in-person',
          reason: data.reason,
          estimated_duration: 30,
        })
        .select('id')
        .single();

      if (aptErr) throw aptErr;

      // Count existing queue entries for position
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('booking_queue')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`);

      const queuePosition = (count || 0) + 1;

      // Insert booking queue entry
      const { data: queueEntry, error: qErr } = await supabase
        .from('booking_queue')
        .insert({
          appointment_id: appointment.id,
          ticket_number: ticketNumber,
          patient_name: data.patientName,
          patient_phone: data.patientPhone,
          consultation_type: data.consultationType,
          specialty: data.specialty,
          reason: data.reason,
          doctor_id: data.doctorId,
          doctor_name: data.doctorName,
          department_id: data.departmentId,
          payment_status: 'pending',
          patient_status: 'pending',
          queue_position: queuePosition,
          consultation_fee: data.consultationFee,
        })
        .select()
        .single();

      if (qErr) throw qErr;

      setBooking({
        id: queueEntry.id,
        appointmentId: appointment.id,
        ticketNumber,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        consultationType: data.consultationType,
        specialty: data.specialty,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        departmentId: data.departmentId,
        reason: data.reason,
        consultationFee: data.consultationFee,
        paymentStatus: 'pending',
        patientStatus: 'pending',
        queuePosition,
        roomNumber: '',
        videoLink: '',
      });

      setCurrentStep(2);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setRegistrationLoading(false);
    }
  }

  function handleReset() {
    setCurrentStep(1);
    setBooking(null);
    setSmsToasts([]);
    setTotalInQueue(0);
  }

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-medical-500/[0.04] -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-navy-800/[0.03] translate-y-1/3 -translate-x-1/3" />
      </div>

      {/* SMS Toasts */}
      <SMSNotificationToast toasts={smsToasts} onDismiss={dismissSmsToast} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-800 tracking-tight">
              Prise de Rendez-vous
            </h1>
          </div>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
            Systeme moderne de gestion des consultations medicales
          </p>
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <BookingStepper currentStep={currentStep} />
        </motion.div>

        {/* Step Content */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit">
                <BookingRegistrationStep
                  onSubmit={handleRegistration}
                  loading={registrationLoading}
                />
              </motion.div>
            )}

            {currentStep === 2 && booking && (
              <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit">
                <BookingTicketStep
                  ticket={{
                    id: booking.id,
                    ticketNumber: booking.ticketNumber,
                    patientName: booking.patientName,
                    patientPhone: booking.patientPhone,
                    consultationType: booking.consultationType,
                    specialty: booking.specialty,
                    doctorName: booking.doctorName,
                    reason: booking.reason,
                    consultationFee: booking.consultationFee,
                    paymentStatus: booking.paymentStatus,
                    queuePosition: booking.queuePosition,
                  }}
                />
              </motion.div>
            )}

            {currentStep === 3 && booking && (
              <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit">
                <BookingWaitingStep
                  ticketNumber={booking.ticketNumber}
                  queuePosition={booking.queuePosition}
                  totalInQueue={Math.max(totalInQueue, booking.queuePosition)}
                  doctorName={booking.doctorName}
                  consultationType={booking.consultationType}
                  roomNumber={booking.roomNumber}
                  videoLink={booking.videoLink}
                  patientStatus={booking.patientStatus}
                />
              </motion.div>
            )}

            {currentStep === 4 && booking && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>

                <h2 className="text-2xl font-bold text-navy-800 mb-2">
                  Consultation en cours
                </h2>
                <p className="text-gray-600 mb-1">
                  {booking.consultationType === 'presentiel'
                    ? `Rendez-vous au Bureau ${booking.roomNumber || 'A-101'}`
                    : 'Votre consultation video est en cours'}
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Dr. {booking.doctorName} - {booking.specialty}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-800 text-white font-semibold hover:bg-navy-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nouveau rendez-vous
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
