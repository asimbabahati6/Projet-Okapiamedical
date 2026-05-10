import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  PhoneCall,
  User,
  Clock,
  MapPin,
  Video,
  RefreshCw,
  Stethoscope,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WaitingPatient {
  id: string;
  ticket_number: string;
  patient_name: string;
  patient_phone: string;
  consultation_type: string;
  specialty: string;
  reason: string;
  consultation_fee: number;
  queue_position: number;
  payment_status: string;
  patient_status: string;
  created_at: string;
}

export function DoctorNotificationPanel() {
  const [patients, setPatients] = useState<WaitingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPaidPatients();

    const channel = supabase
      .channel('doctor-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booking_queue' },
        () => fetchPaidPatients()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPaidPatients() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('booking_queue')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .eq('payment_status', 'paid')
        .in('patient_status', ['paid', 'called'])
        .order('queue_position', { ascending: true });

      if (error) throw error;
      setPatients(data || []);

      const called = new Set<string>();
      (data || []).forEach((p) => {
        if (p.patient_status === 'called') called.add(p.id);
      });
      setCalledIds(called);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCallPatient(patient: WaitingPatient) {
    setCallingId(patient.id);

    try {
      const roomNumber = `A-${String(Math.floor(Math.random() * 20) + 101)}`;
      const videoLink = patient.consultation_type === 'visioconference'
        ? `https://consultation.okapia.com/room/${patient.ticket_number.toLowerCase()}`
        : '';

      await supabase
        .from('booking_queue')
        .update({
          patient_status: 'called',
          room_number: roomNumber,
          video_link: videoLink,
          sms_called_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id);

      setCalledIds((prev) => new Set([...prev, patient.id]));
      fetchPaidPatients();
    } catch (err) {
      console.error('Error calling patient:', err);
    } finally {
      setCallingId(null);
    }
  }

  const waitingPatients = patients.filter((p) => p.patient_status === 'paid');
  const calledPatients = patients.filter((p) => p.patient_status === 'called');

  function getWaitTime(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-500 to-medical-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            Patients en attente
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Patients ayant payé, prêts pour consultation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">{waitingPatients.length} en attente</span>
          </div>
          <button
            onClick={fetchPaidPatients}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Waiting Patients */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-medical-500 border-t-transparent" />
        </div>
      ) : waitingPatients.length === 0 && calledPatients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <Stethoscope className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="font-medium text-gray-400 mb-1">Aucun patient en attente</p>
          <p className="text-sm text-gray-300">
            Les patients apparaîtront ici après paiement
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Waiting */}
          {waitingPatients.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                En attente d'appel ({waitingPatients.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AnimatePresence>
                  {waitingPatients.map((patient) => (
                    <motion.div
                      key={patient.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {patient.ticket_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 truncate">{patient.patient_name}</h4>
                            {patient.consultation_type === 'presentiel' ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-medical-50 text-medical-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Présentiel
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-600 flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Vidéo
                              </span>
                            )}
                          </div>

                          {patient.reason && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{patient.reason}</span>
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getWaitTime(patient.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Position {patient.queue_position}
                            </span>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCallPatient(patient)}
                        disabled={callingId === patient.id}
                        className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-medical-500 to-medical-600 text-white font-semibold text-sm hover:shadow-lg transition-shadow disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {callingId === patient.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <PhoneCall className="w-4 h-4" />
                            Appeler le patient
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Called */}
          {calledPatients.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Appelés ({calledPatients.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {calledPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-green-50 rounded-2xl border border-green-200 p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {patient.ticket_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-green-800 text-sm truncate">{patient.patient_name}</p>
                      <p className="text-xs text-green-600">En consultation</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
