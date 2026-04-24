import { motion } from 'framer-motion';
import { Clock, Users, Stethoscope, MapPin, Video, Wifi } from 'lucide-react';

interface BookingWaitingStepProps {
  ticketNumber: string;
  queuePosition: number;
  totalInQueue: number;
  doctorName: string;
  consultationType: 'presentiel' | 'visioconference';
  roomNumber?: string;
  videoLink?: string;
  patientStatus: 'pending' | 'paid' | 'called';
}

export function BookingWaitingStep({
  ticketNumber,
  queuePosition,
  totalInQueue,
  doctorName,
  consultationType,
  roomNumber,
  videoLink,
  patientStatus,
}: BookingWaitingStepProps) {
  const estimatedWait = Math.max(0, (queuePosition - 1) * 15);
  const isCalled = patientStatus === 'called';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-lg mx-auto"
    >
      {/* Queue Position */}
      <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden">
        {/* Animated background ring */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-56 h-56 rounded-full border-2 border-dashed border-medical-200 opacity-50" />
        </motion.div>

        <div className="relative z-10">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Votre position
          </p>

          <motion.div
            key={queuePosition}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-4 ${
              isCalled
                ? 'bg-gradient-to-br from-green-500 to-green-600 animate-queue-pulse'
                : 'bg-gradient-to-br from-navy-800 to-navy-700'
            }`}
          >
            {isCalled ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <Stethoscope className="w-12 h-12 text-white" />
              </motion.div>
            ) : (
              <span className="text-4xl font-black text-white">
                {queuePosition}
              </span>
            )}
          </motion.div>

          {isCalled ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-bold text-green-700 mb-1">
                C'est votre tour !
              </h3>
              <p className="text-sm text-green-600">
                Le Dr. {doctorName} vous attend
              </p>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-bold text-navy-800">{ticketNumber}</span>
                {' '}sur{' '}
                <span className="font-bold text-navy-800">{totalInQueue}</span> en attente
              </p>
              <div className="flex items-center justify-center gap-2 text-medical-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  ~{estimatedWait} min d'attente estimee
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Doctor & Location Info */}
      {isCalled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-5 border-2 ${
            consultationType === 'presentiel'
              ? 'bg-medical-50 border-medical-200'
              : 'bg-teal-50 border-teal-200'
          }`}
        >
          {consultationType === 'presentiel' ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-medical-500 text-white flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rendez-vous a</p>
                <p className="font-bold text-navy-800 text-lg">
                  Bureau {roomNumber || 'A-101'}
                </p>
                <p className="text-xs text-gray-500">
                  Dr. {doctorName}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Consultation video</p>
                <p className="font-bold text-navy-800 text-lg">
                  Dr. {doctorName}
                </p>
                {videoLink && (
                  <a
                    href={videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:text-teal-700 underline font-medium"
                  >
                    Rejoindre la video
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Queue List */}
      {!isCalled && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-medical-500" />
            <h4 className="font-bold text-navy-800 text-sm">File d'attente</h4>
            <div className="ml-auto flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-green-600 font-medium">En direct</span>
            </div>
          </div>

          <div className="space-y-2">
            {Array.from({ length: Math.min(totalInQueue, 8) }, (_, i) => {
              const pos = i + 1;
              const isCurrentUser = pos === queuePosition;
              return (
                <motion.div
                  key={pos}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    isCurrentUser
                      ? 'bg-medical-50 border border-medical-200'
                      : pos < queuePosition
                      ? 'opacity-40'
                      : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrentUser
                        ? 'bg-medical-500 text-white'
                        : pos < queuePosition
                        ? 'bg-gray-200 text-gray-400 line-through'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {pos}
                  </div>
                  <span
                    className={`text-sm ${
                      isCurrentUser
                        ? 'font-bold text-medical-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {isCurrentUser ? `${ticketNumber} (Vous)` : `T-${String(pos).padStart(3, '0')}`}
                  </span>
                  {isCurrentUser && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-medical-500 rounded-full"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
