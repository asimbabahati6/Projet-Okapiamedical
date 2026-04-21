import { useState, useEffect } from 'react';
import { Calendar, Search, Plus, Clock, User, Phone, CheckCircle, XCircle, Download, Trash2, Ban, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../types/database';
import { AddAppointmentModal } from '../../components/appointments/AddAppointmentModal';
import { AppointmentDetailsModal } from '../../components/appointments/AppointmentDetailsModal';
import { AppointmentValidationModal } from '../../components/appointments/AppointmentValidationModal';
import { BulkActionsToolbar } from '../../components/appointments/BulkActionsToolbar';
import { CancelAppointmentModal } from '../../components/appointments/CancelAppointmentModal';
import { DeleteAppointmentModal } from '../../components/appointments/DeleteAppointmentModal';
import { useAppointmentActions } from '../../hooks/useAppointmentActions';
import { useAuth } from '../../contexts/AuthContext';

const VALIDATION_ROLES = ['medecin_chef_staff', 'caissiere', 'admin', 'super_admin', 'hospital_admin', 'medical_director'];

export function AppointmentsPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAppointment, setValidationAppointment] = useState<Appointment | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickActionAppointment, setQuickActionAppointment] = useState<Appointment | null>(null);
  const [showQuickCancel, setShowQuickCancel] = useState(false);
  const [showQuickDelete, setShowQuickDelete] = useState(false);
  const { cancelAppointment, deleteAppointment, canCancelAppointment, canDeleteAppointment } = useAppointmentActions();
  const userRoleName = (profile?.role as { name?: string } | null)?.name || '';
  const canValidate = VALIDATION_ROLES.includes(userRoleName);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          doctor:medical_staff(*, user_profile:user_profiles(*))
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true })
        .limit(100);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.appointment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${appointment.patient?.first_name} ${appointment.patient?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.user_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

    const today = new Date().toISOString().split('T')[0];
    const appointmentDate = appointment.appointment_date;
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' && appointmentDate === today) ||
      (dateFilter === 'upcoming' && appointmentDate >= today) ||
      (dateFilter === 'past' && appointmentDate < today);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    today: appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length,
    upcoming: appointments.filter(a => a.appointment_date >= new Date().toISOString().split('T')[0] && a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  function getTypeLabel(type: string) {
    const labels = {
      consultation: 'Consultation',
      follow_up: 'Suivi',
      emergency: 'Urgence',
    };
    return labels[type as keyof typeof labels] || type;
  }

  function toggleSelection(appointmentId: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(appointmentId)) {
      newSelected.delete(appointmentId);
    } else {
      newSelected.add(appointmentId);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredAppointments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAppointments.map(a => a.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectedAppointments = appointments.filter(a => selectedIds.has(a.id));

  function exportToCSV() {
    const headers = ['Numéro', 'Patient', 'Médecin', 'Date', 'Heure', 'Motif', 'Statut', 'Raison'];
    const rows = filteredAppointments.map(a => [
      a.appointment_number,
      a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '',
      a.doctor?.user_profile?.full_name || '',
      new Date(a.appointment_date).toLocaleDateString('fr-FR'),
      a.appointment_time.substring(0, 5),
      getTypeLabel(a.appointment_type),
      a.status,
      a.reason || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rendez-vous-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rendez-vous...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Rendez-vous</h1>
          <p className="text-gray-600">Planifier et gérer les rendez-vous patients</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouveau Rendez-vous
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
            </div>
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">À venir</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Complétés</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="bg-gray-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Annulés</p>
              <p className="text-3xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
            <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, patient ou médecin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Complété</option>
              <option value="cancelled">Annulé</option>
              <option value="no_show">Absent</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passés</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={filteredAppointments.length > 0 && selectedIds.size === filteredAppointments.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Rendez-vous
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médecin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucun rendez-vous trouvé
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(appointment.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(appointment.id)}
                        onChange={() => toggleSelection(appointment.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{appointment.appointment_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {appointment.patient?.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{appointment.doctor?.user_profile?.full_name}</p>
                      <p className="text-xs text-gray-500">{appointment.doctor?.specialization}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">{new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</p>
                          <p className="text-xs text-gray-500">{appointment.appointment_time.substring(0, 5)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getTypeLabel(appointment.appointment_type)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canValidate && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              setValidationAppointment(appointment);
                              setShowValidationModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Valider"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        {canCancelAppointment(appointment) && (
                          <button
                            onClick={() => {
                              setQuickActionAppointment(appointment);
                              setShowQuickCancel(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Annuler"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteAppointment(appointment) && (
                          <button
                            onClick={() => {
                              setQuickActionAppointment(appointment);
                              setShowQuickDelete(true);
                            }}
                            className="p-2 text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1"
                        >
                          Détails
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAppointments.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Affichage de {filteredAppointments.length} sur {appointments.length} rendez-vous
        </div>
      )}

      {showValidationModal && validationAppointment && (
        <AppointmentValidationModal
          appointment={validationAppointment}
          onClose={() => {
            setShowValidationModal(false);
            setValidationAppointment(null);
          }}
          onSuccess={() => {
            fetchAppointments();
            setShowValidationModal(false);
            setValidationAppointment(null);
          }}
        />
      )}

      {showAddModal && (
        <AddAppointmentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchAppointments();
            setShowAddModal(false);
          }}
        />
      )}

      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          onUpdate={() => {
            fetchAppointments();
            clearSelection();
          }}
        />
      )}

      {showQuickCancel && quickActionAppointment && (
        <CancelAppointmentModal
          appointment={quickActionAppointment}
          onClose={() => {
            setShowQuickCancel(false);
            setQuickActionAppointment(null);
          }}
          onConfirm={async (reason) => {
            await cancelAppointment(quickActionAppointment.id, reason);
            setShowQuickCancel(false);
            setQuickActionAppointment(null);
            fetchAppointments();
          }}
        />
      )}

      {showQuickDelete && quickActionAppointment && (
        <DeleteAppointmentModal
          appointment={quickActionAppointment}
          onClose={() => {
            setShowQuickDelete(false);
            setQuickActionAppointment(null);
          }}
          onConfirm={async () => {
            await deleteAppointment(quickActionAppointment.id);
            setShowQuickDelete(false);
            setQuickActionAppointment(null);
            fetchAppointments();
          }}
        />
      )}

      {selectedIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.size}
          selectedAppointments={selectedAppointments}
          onClearSelection={clearSelection}
          onSuccess={() => {
            fetchAppointments();
            clearSelection();
          }}
        />
      )}
    </div>
  );
}
