import { useState, useEffect, useCallback } from 'react';
import { MedicalBookingSystem } from '../../components/booking/MedicalBookingSystem';
import { AppointmentLookup } from '../../components/appointments/AppointmentLookup';
import { JoinWaitingList } from '../../components/appointments/JoinWaitingList';
import { List, UserPlus, Calendar, Clock, User, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppointmentsProps {
  preselectedDoctorId?: string | null;
}

interface BookingQueueEntry {
  id: string;
  ticket_number: string;
  patient_name: string;
  doctor_name: string;
  specialty: string;
  consultation_type: string;
  patient_status: string;
  payment_status: string;
  queue_position: number;
  created_at: string;
}

export function Appointments({ preselectedDoctorId }: AppointmentsProps = {}) {
  const [showLookup, setShowLookup] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);
  const [recentBookings, setRecentBookings] = useState<BookingQueueEntry[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchRecentBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('booking_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentBookings(data);
      }
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentBookings();
  }, [fetchRecentBookings]);

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending:   'En attente',
      paid:      'Payé',
      called:    'Appelé',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending:   'bg-yellow-100 text-yellow-800',
      paid:      'bg-blue-100 text-blue-800',
      called:    'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  return (
    <>
      {showLookup && <AppointmentLookup onClose={() => setShowLookup(false)} />}
      {showWaitingList && <JoinWaitingList onClose={() => setShowWaitingList(false)} />}

      {/* Quick actions bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setShowLookup(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Gérer un rendez-vous</span>
            <span className="sm:hidden">Existant</span>
          </button>
          <button
            onClick={() => setShowWaitingList(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Liste d'attente</span>
            <span className="sm:hidden">Attente</span>
          </button>
        </div>
      </div>

      {/* Formulaire de réservation */}
      <MedicalBookingSystem onAppointmentCreated={fetchRecentBookings} />

      {/* Liste des rendez-vous récents */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Rendez-vous récents
          </h2>
          <button
            onClick={fetchRecentBookings}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBookings ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingBookings && recentBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : recentBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
            Aucun rendez-vous pour l'instant
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {b.ticket_number}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(b.patient_status)}`}>
                        {getStatusLabel(b.patient_status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-1">
                      <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{b.patient_name}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Dr. {b.doctor_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(b.created_at).toLocaleString('fr-FR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Position</p>
                    <p className="text-lg font-bold text-blue-600">#{b.queue_position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}