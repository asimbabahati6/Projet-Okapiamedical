import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { logActivity } from '../../utils/activityLogger';
import { ToastContainer } from '../../components/Toast';

interface Appointment {
  id: string;
  appointment_number: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  doctor_name?: string;
  patient_name?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Department {
  id: string;
  name: string;
}

// ✅ Correction doublon "Dr. Dr."
function formatDoctorName(name?: string): string {
  if (!name) return '—';
  return name.startsWith('Dr') ? name : `Dr. ${name}`;
}

export function AppointmentsPage() {
  const { user, profile } = useAuth();
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    department_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    appointment_type: 'consultation',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      // ✅ Deux requêtes en parallèle
      const [{ data: apts, error: e1 }, { data: queue, error: e2 }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, appointment_number, appointment_date, appointment_time, status, reason')
          .order('appointment_date', { ascending: false })
          .limit(50),
        supabase
          .from('booking_queue')
          .select('id, ticket_number, appointment_date, appointment_time, patient_status, reason, doctor_name, patient_name')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (e1) { showError('Erreur chargement rendez-vous.'); return; }
      if (e2) { showError("Erreur chargement file d'attente."); return; }

      const fromAppointments: Appointment[] = (apts || []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        appointment_number: a.appointment_number as string,
        appointment_date: (a.appointment_date as string) || '—',
        appointment_time: (a.appointment_time as string) || '—',
        status: (a.status as string) || 'pending',
        reason: a.reason as string | null,
        doctor_name: undefined,
        patient_name: undefined,
      }));

      const fromQueue: Appointment[] = (queue || []).map((q: Record<string, unknown>) => ({
        id: q.id as string,
        appointment_number: q.ticket_number as string,
        appointment_date: (q.appointment_date as string) || '—',
        appointment_time: (q.appointment_time as string) || '—',
        status:
          q.patient_status === 'called' ? 'confirmed'
          : q.patient_status === 'paid' ? 'confirmed'
          : 'pending',
        reason: q.reason as string | null,
        doctor_name: q.doctor_name as string | undefined,
        patient_name: q.patient_name as string | undefined,
      }));

      setAppointments([...fromQueue, ...fromAppointments]);
    } catch (error) {
      console.error('Error:', error);
      showError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }

  async function openNewAppointmentModal() {
    setShowModal(true);
    const [{ data: pats }, { data: deps }] = await Promise.all([
      supabase.from('patients').select('id, first_name, last_name, phone').order('last_name').limit(200),
      supabase.from('departments').select('id, name').order('name'),
    ]);
    if (pats) setPatients(pats);
    if (deps) setDepartments(deps);
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date();
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const appointmentNumber = `RDV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}-${rand}`;

      const { error } = await supabase.from('appointments').insert({
        appointment_number: appointmentNumber,
        patient_id: form.patient_id || null,
        department_id: form.department_id || null,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        reason: form.reason || null,
        appointment_type: form.appointment_type,
        status: 'pending',
        created_by: profile ? user?.id : null,
      });

      if (error) throw error;

      logActivity('create', 'appointments', `Nouveau rendez-vous cree: ${appointmentNumber}`);
      setShowModal(false);
      setForm({ patient_id: '', department_id: '', appointment_date: '', appointment_time: '', reason: '', appointment_type: 'consultation' });
      showSuccess('Rendez-vous créé avec succès');
      await fetchAppointments();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('Error creating appointment:', err);
      const message = (err && typeof err === 'object' && 'message' in err) ? String((err as { message: string }).message) : 'Erreur inconnue';
      showError(`Échec de la création du rendez-vous: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  const filtered = appointments.filter(a => {
    const matchesSearch =
      a.appointment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.doctor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
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
        <button
          onClick={openNewAppointmentModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau rendez-vous
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Aujourd'hui", count: appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length },
          { label: 'En attente', count: appointments.filter(a => a.status === 'pending').length },
          { label: 'Confirmés', count: appointments.filter(a => a.status === 'confirmed').length },
          { label: 'Total', count: appointments.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par N°, patient ou médecin..."
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Médecin</th>
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
                    <td className="px-4 py-3 text-gray-600 text-sm">{apt.patient_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{formatDoctorName(apt.doctor_name)}</td>
                    <td className="px-4 py-3 text-gray-600">{apt.appointment_date}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {apt.appointment_time}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{apt.reason || '—'}</td>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nouveau rendez-vous</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="">-- Sélectionner un patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.last_name} {p.first_name} {p.phone ? `(${p.phone})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="">-- Sélectionner un département --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" required value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                  <input type="time" required value={form.appointment_time}
                    onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Suivi</option>
                  <option value="emergency">Urgence</option>
                  <option value="telemedicine">Téléconsultation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={2} placeholder="Motif de la consultation..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
