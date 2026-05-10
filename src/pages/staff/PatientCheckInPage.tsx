import { useState, useEffect, useRef } from 'react';
import { Search, Users, Clock, CheckCircle, AlertCircle, UserPlus, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Patient, Appointment, PatientCheckIn } from '../../types/database';
import { PatientCheckInModal } from '../../components/checkin/PatientCheckInModal';
import { WaitingQueueDisplay } from '../../components/checkin/WaitingQueueDisplay';
import { useAuth } from '../../contexts/AuthContext';

type ActiveFilter = 'all' | 'today' | 'waiting' | 'new' | 'registration';

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return value;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  active: boolean;
  onClick: () => void;
}

function StatCard({ title, value, icon: Icon, color, active, onClick }: StatCardProps) {
  const displayed = useCountUp(value);

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-6 text-left w-full transition-all duration-200 group
        ${active
          ? 'ring-2 ring-offset-1 ring-blue-500 shadow-md scale-[1.02]'
          : 'hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 cursor-pointer'
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold transition-colors ${active ? 'text-blue-600' : 'text-gray-900'}`}>
            {displayed}
          </p>
        </div>
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${active ? 'scale-110' : ''}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {active && (
        <p className="text-xs text-blue-500 mt-2 font-medium">Filtre actif — cliquez pour réinitialiser</p>
      )}
    </button>
  );
}

export function PatientCheckInPage() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<PatientCheckIn[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    waitingPatients: 0,
    newPatients: 0,
    inRegistration: 0,
  });

  useEffect(() => {
    fetchTodayAppointments();
    fetchRecentCheckIns();
    fetchStats();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  async function fetchTodayAppointments() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          doctor:medical_staff(*, user_profile:user_profiles(*))
        `)
        .eq('appointment_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setTodayAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }

  async function fetchRecentCheckIns() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('patient_checkins')
        .select(`
          *,
          patient:patients(*),
          appointment:appointments(*),
          checked_in_by_user:user_profiles!patient_checkins_checked_in_by_fkey(full_name)
        `)
        .gte('checkin_time', today)
        .order('checkin_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecentCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    }
  }

  async function fetchStats() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [checkIns, waiting, newPatients, inReg] = await Promise.all([
        supabase
          .from('patient_checkins')
          .select('id', { count: 'exact' })
          .gte('checkin_time', today),
        supabase
          .from('waiting_queue')
          .select('id', { count: 'exact' })
          .eq('status', 'waiting'),
        supabase
          .from('patient_checkins')
          .select('id', { count: 'exact' })
          .gte('checkin_time', today)
          .eq('is_new_patient', true),
        supabase
          .from('patient_checkins')
          .select('id', { count: 'exact' })
          .eq('status', 'in_registration'),
      ]);

      setStats({
        todayCheckIns: checkIns.count || 0,
        waitingPatients: waiting.count || 0,
        newPatients: newPatients.count || 0,
        inRegistration: inReg.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function searchPatients() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,patient_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePatientSelect(patient: Patient) {
    setSelectedPatient(patient);
    const appointment = todayAppointments.find(apt => apt.patient_id === patient.id);
    setSelectedAppointment(appointment || null);
    setShowCheckInModal(true);
  }

  function handleAppointmentCheckIn(appointment: Appointment) {
    if (appointment.patient) {
      setSelectedPatient(appointment.patient);
      setSelectedAppointment(appointment);
      setShowCheckInModal(true);
    }
  }

  function handleCheckInSuccess() {
    setShowCheckInModal(false);
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setSearchTerm('');
    setSearchResults([]);
    fetchTodayAppointments();
    fetchRecentCheckIns();
    fetchStats();
  }

  function handleFilterClick(filter: ActiveFilter) {
    setActiveFilter(prev => prev === filter ? 'all' : filter);
  }

  const filteredCheckIns = recentCheckIns.filter(c => {
    if (activeFilter === 'all' || activeFilter === 'today' || activeFilter === 'waiting') return true;
    if (activeFilter === 'new') return c.is_new_patient === true;
    if (activeFilter === 'registration') return c.status === 'in_registration';
    return true;
  });

  const showWaitingQueue = activeFilter === 'all' || activeFilter === 'waiting';
  const showAppointments = activeFilter === 'all' || activeFilter === 'today';

  const statCards: { title: string; value: number; icon: React.ElementType; color: string; filter: ActiveFilter }[] = [
    {
      title: "Enregistrements aujourd'hui",
      value: stats.todayCheckIns,
      icon: CheckCircle,
      color: 'bg-blue-500',
      filter: 'today',
    },
    {
      title: 'Patients en attente',
      value: stats.waitingPatients,
      icon: Clock,
      color: 'bg-yellow-500',
      filter: 'waiting',
    },
    {
      title: 'Nouveaux patients',
      value: stats.newPatients,
      icon: UserPlus,
      color: 'bg-green-500',
      filter: 'new',
    },
    {
      title: 'En inscription',
      value: stats.inRegistration,
      icon: Activity,
      color: 'bg-orange-500',
      filter: 'registration',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enregistrement des Patients</h1>
          <p className="text-gray-600 mt-1">Accueil et gestion des arrivées</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.filter}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            active={activeFilter === card.filter}
            onClick={() => handleFilterClick(card.filter)}
          />
        ))}
      </div>

      {activeFilter !== 'all' && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="font-medium">Filtre actif :</span>
          <span>{statCards.find(c => c.filter === activeFilter)?.title}</span>
          <button
            onClick={() => setActiveFilter('all')}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Effacer le filtre
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rechercher un Patient</h2>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Nom, prénom, numéro de patient, ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          N° {patient.patient_number} • {patient.phone}
                        </p>
                      </div>
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchTerm.length >= 2 && !loading && searchResults.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Aucun patient trouvé</p>
              </div>
            )}
          </div>

          {showAppointments && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rendez-vous d'Aujourd'hui
              </h2>

              {todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Aucun rendez-vous pour aujourd'hui</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {todayAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      onClick={() => handleAppointmentCheckIn(appointment)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </p>
                        <span className="text-sm font-medium text-blue-600">
                          {appointment.appointment_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>N° {appointment.patient?.patient_number}</span>
                        <span>•</span>
                        <span>{appointment.doctor?.user_profile?.full_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Derniers Enregistrements
              {activeFilter !== 'all' && activeFilter !== 'waiting' && (
                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  filtré
                </span>
              )}
            </h2>

            {filteredCheckIns.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Aucun enregistrement</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCheckIns.slice(0, 10).map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm text-gray-900">
                        {checkIn.patient?.first_name} {checkIn.patient?.last_name}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        checkIn.is_new_patient
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {checkIn.is_new_patient ? 'Nouveau' : 'Existant'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{checkIn.queue_number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(checkIn.checkin_time).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showWaitingQueue && <WaitingQueueDisplay onRefresh={fetchStats} />}
        </div>
      </div>

      {showCheckInModal && selectedPatient && (
        <PatientCheckInModal
          patient={selectedPatient}
          appointment={selectedAppointment}
          onClose={() => {
            setShowCheckInModal(false);
            setSelectedPatient(null);
            setSelectedAppointment(null);
          }}
          onSuccess={handleCheckInSuccess}
        />
      )}
    </div>
  );
}
