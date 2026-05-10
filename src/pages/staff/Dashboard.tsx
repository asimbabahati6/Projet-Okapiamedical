import { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRBAC } from '../../contexts/RBACContext';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  todayPatients: number;
  onDutyStaff: number;
  monthlyRevenue: number;
  criticalAlerts: number;
  pendingAppointments: number;
  activeConsultations: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const { userRole } = useRBAC();
  const [stats, setStats] = useState<DashboardStats>({
    todayPatients: 0,
    onDutyStaff: 0,
    monthlyRevenue: 0,
    criticalAlerts: 0,
    pendingAppointments: 0,
    activeConsultations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [patientsRes, staffRes, appointmentsRes, consultationsRes] = await Promise.all([
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),

        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .gte('appointment_date', today)
          .eq('status', 'scheduled'),

        supabase
          .from('consultations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfMonth)
      ]);

      setStats({
        todayPatients: patientsRes.count || 0,
        onDutyStaff: staffRes.count || 0,
        monthlyRevenue: 115,
        criticalAlerts: 0,
        pendingAppointments: appointmentsRes.count || 0,
        activeConsultations: consultationsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRoleDisplayName = () => {
    const roleMap: Record<string, string> = {
      'directeur_general': 'Directeur Général',
      'medecin_chef_staff': 'Médecin Chef de Staff',
      'gestionnaire': 'Gestionnaire',
      'radio_chef': 'Chef Radiologie',
      'radio_tech': 'Technicien Radiologie',
      'caissiere': 'Caissière',
      'technique': 'Technicien',
      'hygiene': 'Agent d\'Hygiène',
      'lab_technician': 'Laborantin',
      'doctor': 'Médecin',
      'nurse': 'Infirmier(ère)',
      'pharmacist': 'Pharmacien(ne)',
      'receptionist': 'Réceptionniste',
      'admin': 'Administrateur'
    };
    return roleMap[userRole] || userRole;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tableau de Bord
        </h1>
        <p className="text-lg text-gray-600">
          Vue d'ensemble de la clinique médicale
        </p>
      </div>

      <div className="bg-blue-600 rounded-xl shadow-sm p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Taux de Change du Jour</p>
              <p className="text-2xl font-bold">1 USD = 2 500 CDF</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors">
            Gérer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.todayPatients}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Patients Aujourd'hui</h3>
          <p className="text-xs text-gray-500">Total enregistrés</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.onDutyStaff}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Personnel de Garde</h3>
          <p className="text-xs text-gray-500">Actuellement actif</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-gray-900">{stats.monthlyRevenue} FC</span>
              <p className="text-xs text-gray-500 mt-1">${(stats.monthlyRevenue / 2500).toFixed(2)}</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Revenu Mensuel</h3>
          <p className="text-xs text-gray-500">Ce mois</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.criticalAlerts}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Alertes Critiques</h3>
          <p className="text-xs text-gray-500">Nécessitent attention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Rendez-vous à Venir
          </h2>
          <div className="space-y-3">
            {stats.pendingAppointments > 0 ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stats.pendingAppointments} rendez-vous planifiés</p>
                    <p className="text-xs text-gray-600">À partir d'aujourd'hui</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun rendez-vous planifié</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Consultations du Mois
          </h2>
          <div className="space-y-3">
            {stats.activeConsultations > 0 ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stats.activeConsultations} consultations</p>
                    <p className="text-xs text-gray-600">Ce mois</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune consultation ce mois</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Bienvenue, {profile?.full_name}</h3>
            <p className="text-sm opacity-90">Rôle: {getRoleDisplayName()}</p>
          </div>
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
            <p className="text-xs opacity-75">Système</p>
            <p className="font-semibold">Opérationnel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
