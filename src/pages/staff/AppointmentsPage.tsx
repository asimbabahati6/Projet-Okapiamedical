import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Clock, User, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  appointment_number: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  doctor_name?: string;
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_number, appointment_date, appointment_time, status, reason')
        .order('appointment_date', { ascending: false })
        .limit(50);

      if (data) {
        setAppointments(data.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          appointment_number: a.appointment_number as string,
          appointment_date: a.appointment_date as string,
          appointment_time: a.appointment_time as string,
          status: (a.status as string) || 'pending',
          reason: a.reason as string | null,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = appointments.filter(a => {
    const matchesSearch = a.appointment_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return map[status] || status;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-7 h-7 text-blue-600" />
            Rendez-vous
          </h1>
          <p className="text-gray-500 mt-1">Gestion des rendez-vous et consultations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          <Plus className="w-4 h-4" />
          Nouveau rendez-vous
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Aujourd'hui", count: appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length, color: 'blue' },
          { label: 'En attente', count: appointments.filter(a => a.status === 'pending').length, color: 'yellow' },
          { label: 'Confirmés', count: appointments.filter(a => a.status === 'confirmed').length, color: 'green' },
          { label: 'Total', count: appointments.length, color: 'gray' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmés</option>
            <option value="completed">Terminés</option>
            <option value="cancelled">Annulés</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun rendez-vous trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N°</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Heure</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Motif</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{apt.appointment_number}</td>
                    <td className="px-4 py-3 text-gray-600">{apt.appointment_date}</td>
                    <td className="px-4 py-3 text-gray-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {apt.appointment_time}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{apt.reason || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(apt.status)}`}>
                        {statusLabel(apt.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
