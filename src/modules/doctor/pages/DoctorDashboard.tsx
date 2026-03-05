import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Users,
  FileText,
  FlaskConical,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';

interface DashboardStats {
  today_appointments: number;
  this_week_consultations: number;
  pending_lab_orders: number;
  active_prescriptions: number;
}

interface TodayAppointment {
  id: string;
  patient_name: string;
  time: string;
  status: string;
  reason?: string;
}

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    today_appointments: 0,
    this_week_consultations: 0,
    pending_lab_orders: 0,
    active_prescriptions: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctor) return;

      const today = new Date().toISOString().split('T')[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const [appointmentsRes, consultationsRes, labOrdersRes, prescriptionsRes] =
        await Promise.all([
          supabase
            .from('appointments')
            .select('id, appointment_date, start_time, status, reason, patients(first_name, last_name)')
            .eq('doctor_id', doctor.id)
            .eq('appointment_date', today)
            .order('start_time'),
          supabase
            .from('consultations')
            .select('id')
            .eq('doctor_id', doctor.id)
            .gte('created_at', startOfWeek.toISOString()),
          supabase
            .from('lab_orders')
            .select('id')
            .eq('doctor_id', doctor.id)
            .in('status', ['prescribed', 'pending_sample', 'in_progress']),
          supabase
            .from('prescriptions')
            .select('id')
            .eq('doctor_id', doctor.id)
            .eq('status', 'active')
        ]);

      setStats({
        today_appointments: appointmentsRes.data?.length || 0,
        this_week_consultations: consultationsRes.data?.length || 0,
        pending_lab_orders: labOrdersRes.data?.length || 0,
        active_prescriptions: prescriptionsRes.data?.length || 0
      });

      const appointments = (appointmentsRes.data || []).map((apt: any) => ({
        id: apt.id,
        patient_name: `${apt.patients?.first_name} ${apt.patients?.last_name}`,
        time: apt.start_time,
        status: apt.status,
        reason: apt.reason
      }));

      setTodayAppointments(appointments);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Rendez-vous aujourd\'hui',
      value: stats.today_appointments,
      icon: Calendar,
      color: 'blue',
      link: '/doctor/schedule'
    },
    {
      title: 'Consultations cette semaine',
      value: stats.this_week_consultations,
      icon: Activity,
      color: 'green',
      link: '/doctor/consultations'
    },
    {
      title: 'Analyses en attente',
      value: stats.pending_lab_orders,
      icon: FlaskConical,
      color: 'yellow',
      link: '/doctor/lab-orders'
    },
    {
      title: 'Prescriptions actives',
      value: stats.active_prescriptions,
      icon: FileText,
      color: 'purple',
      link: '/doctor/prescriptions'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmé', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Terminé', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Médecin</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre activité</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Agenda d'aujourd'hui</h2>
              <Link
                to="/doctor/schedule"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun rendez-vous aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{appointment.patient_name}</h3>
                        <p className="text-sm text-gray-600">
                          {appointment.reason || 'Consultation générale'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{appointment.time}</p>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link
                to="/doctor/consultations/new"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                Nouvelle consultation
              </Link>
              <Link
                to="/doctor/prescriptions/new"
                className="block w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center"
              >
                Nouvelle prescription
              </Link>
              <Link
                to="/doctor/lab-orders/new"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
              >
                Prescrire analyse
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-8 h-8" />
              <h3 className="font-semibold text-lg">Performance</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-blue-100 text-sm">Consultations/semaine</p>
                <p className="text-2xl font-bold">
                  {stats.this_week_consultations}
                </p>
              </div>
              <div className="pt-3 border-t border-blue-500">
                <p className="text-blue-100 text-sm">Taux de satisfaction</p>
                <p className="text-2xl font-bold">4.8/5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
