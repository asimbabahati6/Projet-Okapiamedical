import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  FlaskConical,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PatientStats {
  upcoming_appointments: number;
  new_results: number;
  active_prescriptions: number;
  total_consultations: number;
}

interface UpcomingAppointment {
  id: string;
  doctor_name: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface RecentResult {
  id: string;
  test_name: string;
  date: string;
  status: string;
  is_new: boolean;
}

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PatientStats>({
    upcoming_appointments: 0,
    new_results: 0,
    active_prescriptions: 0,
    total_consultations: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patient) return;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [appointmentsRes, resultsRes, prescriptionsRes, consultationsRes] =
        await Promise.all([
          supabase
            .from('appointments')
            .select('id, appointment_date, start_time, status, type, doctors!appointments_doctor_id_fkey(first_name, last_name)')
            .eq('patient_id', patient.id)
            .gte('appointment_date', today)
            .order('appointment_date')
            .order('start_time')
            .limit(3),
          supabase
            .from('lab_orders')
            .select('id, test_name, created_at, status, updated_at')
            .eq('patient_id', patient.id)
            .in('status', ['completed', 'validated', 'results_sent'])
            .order('updated_at', { ascending: false })
            .limit(5),
          supabase
            .from('prescriptions')
            .select('id')
            .eq('patient_id', patient.id)
            .eq('status', 'active'),
          supabase
            .from('consultations')
            .select('id')
            .eq('patient_id', patient.id)
        ]);

      const newResults = (resultsRes.data || []).filter(
        (result: any) => new Date(result.updated_at) > new Date(sevenDaysAgo)
      );

      setStats({
        upcoming_appointments: appointmentsRes.data?.length || 0,
        new_results: newResults.length,
        active_prescriptions: prescriptionsRes.data?.length || 0,
        total_consultations: consultationsRes.data?.length || 0
      });

      const appointments = (appointmentsRes.data || []).map((apt: any) => ({
        id: apt.id,
        doctor_name: `Dr. ${apt.doctors?.first_name} ${apt.doctors?.last_name}`,
        date: apt.appointment_date,
        time: apt.start_time,
        type: apt.type,
        status: apt.status
      }));

      setUpcomingAppointments(appointments);

      const results = (resultsRes.data || []).map((result: any) => ({
        id: result.id,
        test_name: result.test_name,
        date: result.updated_at,
        status: result.status,
        is_new: new Date(result.updated_at) > new Date(sevenDaysAgo)
      }));

      setRecentResults(results);
    } catch (error) {
      console.error('Error loading patient dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Prochains rendez-vous',
      value: stats.upcoming_appointments,
      icon: Calendar,
      color: 'teal',
      link: '/patient/appointments'
    },
    {
      title: 'Nouveaux résultats',
      value: stats.new_results,
      icon: FlaskConical,
      color: 'blue',
      link: '/patient/results'
    },
    {
      title: 'Ordonnances actives',
      value: stats.active_prescriptions,
      icon: FileText,
      color: 'purple',
      link: '/patient/prescriptions'
    },
    {
      title: 'Consultations totales',
      value: stats.total_consultations,
      icon: CheckCircle,
      color: 'green',
      link: '/patient/history'
    }
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmé', className: 'bg-green-100 text-green-800' },
      in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminé', className: 'bg-gray-100 text-gray-800' }
    };

    const badge = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getDaysUntil = (date: string) => {
    const target = new Date(date);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return `Dans ${diff} jours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon espace santé</h1>
        <p className="text-gray-600 mt-2">Bienvenue sur votre espace personnel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Prochains rendez-vous</h2>
              <Link
                to="/patient/appointments"
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucun rendez-vous à venir</p>
                <Link
                  to="/patient/appointments/book"
                  className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Prendre rendez-vous
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{appointment.doctor_name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString('fr-FR')} à{' '}
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium text-teal-600">
                        {getDaysUntil(appointment.date)}
                      </p>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Résultats récents</h2>
              <Link
                to="/patient/results"
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentResults.length === 0 ? (
              <div className="text-center py-12">
                <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun résultat récent</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FlaskConical className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{result.test_name}</h3>
                          {result.is_new && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(result.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/patient/results/${result.id}`}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      Voir
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg shadow-sm p-6 text-white">
        <h3 className="text-xl font-semibold mb-4">Besoin d'aide?</h3>
        <p className="mb-6">
          Notre équipe est disponible pour répondre à vos questions et vous accompagner dans
          votre parcours de soins.
        </p>
        <div className="flex space-x-4">
          <button className="px-6 py-2 bg-white text-teal-600 rounded-lg hover:bg-gray-100 font-medium">
            Contacter
          </button>
          <button className="px-6 py-2 border border-white text-white rounded-lg hover:bg-teal-600">
            FAQ
          </button>
        </div>
      </div>
    </div>
  );
};
