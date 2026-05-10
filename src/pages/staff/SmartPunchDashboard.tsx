import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AttendanceStat {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export default function SmartPunchDashboard() {
  const [stats, setStats] = useState<AttendanceStat>({ present: 0, absent: 0, late: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count: totalEmployees } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: presentCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'present');

      const total = totalEmployees || 0;
      const present = presentCount || 0;

      setStats({
        present,
        absent: Math.max(0, total - present),
        late: 0,
        total,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          Tableau de bord Pointage
        </h1>
        <p className="text-gray-500 mt-1">Suivi de la présence du personnel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Présents</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.present}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Absents</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.absent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Retards</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.late}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux présence</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '-' : `${attendanceRate}%`}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Pointages récents
          </h2>
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Les pointages du jour apparaîtront ici</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Tendance hebdomadaire
          </h2>
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Données insuffisantes pour le graphique</p>
          </div>
        </div>
      </div>
    </div>
  );
}
