import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  MapPin,
  Video,
  Stethoscope,
  User,
  Clock,
  CreditCard,
  Printer,
} from 'lucide-react';
import QRCode from 'qrcode';

interface BookingTicketData {
  id: string;
  ticketNumber: string;
  patientName: string;
  patientPhone: string;
  consultationType: 'presentiel' | 'visioconference';
  specialty: string;
  doctorName: string;
  reason: string;
  consultationFee: number;
  paymentStatus: 'pending' | 'paid';
  queuePosition: number;
}

interface BookingTicketStepProps {
  ticket: BookingTicketData;
}

export function BookingTicketStep({ ticket }: BookingTicketStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current && ticket.id) {
      QRCode.toCanvas(
        canvasRef.current,
        JSON.stringify({
          bookingId: ticket.id,
          ticket: ticket.ticketNumber,
          patient: ticket.patientName,
        }),
        {
          width: 160,
          margin: 2,
          color: { dark: '#0F172A', light: '#ffffff' },
        },
        () => setQrGenerated(true)
      );
    }
  }, [ticket.id, ticket.ticketNumber, ticket.patientName]);

  const isPaid = ticket.paymentStatus === 'paid';
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="max-w-md mx-auto"
    >
      {/* Ticket Card */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-gradient-to-br from-navy-800 to-navy-700 p-6 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-medical-500 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-medical-400 translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
              className="text-5xl font-black tracking-wider mb-1"
            >
              {ticket.ticketNumber}
            </motion.div>
            <p className="text-sm text-blue-200 font-medium">Votre ticket numérique</p>
          </div>
        </div>

        {/* Tear line */}
        <div className="relative">
          <div className="absolute left-0 top-0 w-4 h-4 bg-gray-100 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute right-0 top-0 w-4 h-4 bg-gray-100 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="border-t-2 border-dashed border-gray-200 mx-6" />
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                <User className="w-3 h-3" />
                Patient
              </div>
              <p className="font-bold text-navy-800 text-sm">{ticket.patientName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                <Stethoscope className="w-3 h-3" />
                Spécialité
              </div>
              <p className="font-bold text-navy-800 text-sm">{ticket.specialty}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                {ticket.consultationType === 'presentiel' ? (
                  <MapPin className="w-3 h-3" />
                ) : (
                  <Video className="w-3 h-3" />
                )}
                Type
              </div>
              <p className="font-bold text-navy-800 text-sm capitalize">
                {ticket.consultationType === 'presentiel' ? 'En personne' : 'Vidéo'}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                <User className="w-3 h-3" />
                Médecin
              </div>
              <p className="font-bold text-navy-800 text-sm">Dr. {ticket.doctorName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                <Clock className="w-3 h-3" />
                Date
              </div>
              <p className="font-bold text-navy-800 text-sm capitalize">{dateStr}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                <CreditCard className="w-3 h-3" />
                Montant
              </div>
              <p className="font-bold text-navy-800 text-sm">{ticket.consultationFee} USD</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center pt-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100"
            >
              <canvas ref={canvasRef} />
              {!qrGenerated && (
                <div className="w-[160px] h-[160px] flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-gray-300 animate-pulse" />
                </div>
              )}
            </motion.div>
          </div>

          <p className="text-xs text-center text-gray-400">
            Présentez ce QR code à l'accueil
          </p>
        </div>

        {/* Payment Status */}
        <div className="px-6 pb-6">
          <motion.div
            animate={{
              backgroundColor: isPaid
                ? 'rgb(220 252 231)'
                : 'rgb(255 247 237)',
              borderColor: isPaid
                ? 'rgb(187 247 208)'
                : 'rgb(253 230 138)',
            }}
            className="rounded-xl p-4 border-2 text-center"
          >
            {isPaid ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-bold text-green-800">Paiement validé</span>
              </motion.div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <motion.div
                    className="w-2.5 h-2.5 bg-orange-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="font-bold text-orange-800">En attente de paiement</span>
                </div>
                <p className="text-xs text-orange-700">
                  Veuillez vous rendre à la Caisse pour valider votre paiement
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Print Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={() => window.print()}
        className="mt-4 w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <Printer className="w-4 h-4" />
        Imprimer le ticket
      </motion.button>
    </motion.div>
  );
}
