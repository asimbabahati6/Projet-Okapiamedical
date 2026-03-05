import { useState, useEffect } from 'react';
import {
  Users, Activity, Calendar, TrendingUp, Download,
  Building2, User, Phone, Mail, BarChart3, Filter, Search, ChevronDown, ChevronUp,
  Plus, Edit2, Trash2, UserPlus, Briefcase, Eye, FolderOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  getDoctorsGlobalStats,
  getDepartmentMetrics,
  getDoctorsByDepartment,
  exportDoctorsDataCSV,
  GlobalStats,
  DepartmentMetrics,
  DoctorWorkload
} from '../../services/doctorAnalyticsService';
import { useToast } from '../../hooks/useToast';
import AddDoctorModal from '../../components/doctors/AddDoctorModal';
import AssignDoctorToPatientModal from '../../components/doctors/AssignDoctorToPatientModal';
import DoctorPatientsOverviewModal from '../../components/doctors/DoctorPatientsOverviewModal';
import DoctorAdminManagementModal from '../../components/doctors/DoctorAdminManagementModal';

interface Department {
  id: string;
  name: string;
}

export default function DoctorsDashboardPage() {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);
  const [departmentData, setDepartmentData] = useState<Record<string, DoctorWorkload[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAssignPatientModal, setShowAssignPatientModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [showPatientOverviewModal, setShowPatientOverviewModal] = useState(false);
  const [showAdminManagementModal, setShowAdminManagementModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWorkload | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedDepartments]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (deptsError) throw deptsError;
      setDepartments(depts || []);

      const stats = await getDoctorsGlobalStats({
        departmentIds: selectedDepartments.length > 0 ? selectedDepartments : undefined
      });
      setGlobalStats(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartmentDoctors(departmentId: string) {
    if (departmentData[departmentId]) {
      return;
    }

    try {
      const doctors = await getDoctorsByDepartment(departmentId);
      setDepartmentData(prev => ({ ...prev, [departmentId]: doctors }));
    } catch (error) {
      console.error('Error fetching department doctors:', error);
      showToast('Erreur lors du chargement des médecins', 'error');
    }
  }

  function toggleDepartment(departmentId: string) {
    if (expandedDepartment === departmentId) {
      setExpandedDepartment(null);
    } else {
      setExpandedDepartment(departmentId);
      fetchDepartmentDoctors(departmentId);
    }
  }

  function toggleDepartmentFilter(departmentId: string) {
    setSelectedDepartments(prev =>
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportDoctorsDataCSV({
        departmentIds: selectedDepartments.length > 0 ? selectedDepartments : undefined
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `medecins-rapport-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      showToast('Export réussi', 'success');
    } catch (error) {
      console.error('Error exporting:', error);
      showToast('Erreur lors de l\'export', 'error');
    } finally {
      setExporting(false);
    }
  }

  function handleEditDoctor(doctor: DoctorWorkload) {
    setSelectedDoctor(doctor);
    setShowEditDoctorModal(true);
  }

  async function handleDeleteDoctor(doctor: DoctorWorkload) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${doctor.doctorName} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', doctor.doctorId);

      if (error) throw error;

      showToast('Médecin désactivé avec succès', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  function handleViewPatients(doctor: DoctorWorkload) {
    setSelectedDoctor(doctor);
    setShowPatientOverviewModal(true);
  }

  function handleAdminManagement(doctor: DoctorWorkload) {
    setSelectedDoctor(doctor);
    setShowAdminManagementModal(true);
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { label: string; className: string }> = {
      available: { label: 'Disponible', className: 'bg-green-100 text-green-700' },
      in_consultation: { label: 'En consultation', className: 'bg-blue-100 text-blue-700' },
      unavailable: { label: 'Indisponible', className: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[status] || statusConfig.available;
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  }

  function getOccupancyColor(rate: number) {
    if (rate < 60) return 'text-green-600 bg-green-100';
    if (rate < 80) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Médecins</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de l'activité médicale</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAssignPatientModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Affecter un médecin à un patient"
          >
            <UserPlus className="w-4 h-4" />
            Affecter Médecin
          </button>

          <button
            onClick={() => setShowAddDoctorModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Créer un nouveau médecin"
          >
            <Plus className="w-4 h-4" />
            Nouveau Médecin
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" />
          Filtrer par département:
        </div>
        {departments.map(dept => (
          <button
            key={dept.id}
            onClick={() => toggleDepartmentFilter(dept.id)}
            className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
              selectedDepartments.includes(dept.id)
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {dept.name}
          </button>
        ))}
        {selectedDepartments.length > 0 && (
          <button
            onClick={() => setSelectedDepartments([])}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{globalStats.totalDoctors}</div>
            <div className="text-sm text-gray-600 mt-1">Médecins actifs</div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(globalStats.activeDoctors / globalStats.totalDoctors) * 100}%` }}
                />
              </div>
              <span className="text-gray-600">{globalStats.activeDoctors} disponibles</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Taux</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{globalStats.averageOccupancy}%</div>
            <div className="text-sm text-gray-600 mt-1">Occupation moyenne</div>
            <div className="mt-3">
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                globalStats.averageOccupancy < 60 ? 'bg-green-100 text-green-700' :
                globalStats.averageOccupancy < 80 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                <TrendingUp className="w-3 h-3" />
                {globalStats.averageOccupancy < 60 ? 'Optimal' :
                 globalStats.averageOccupancy < 80 ? 'Élevé' : 'Critique'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Aujourd'hui</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{globalStats.todayAppointments}</div>
            <div className="text-sm text-gray-600 mt-1">Rendez-vous du jour</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{globalStats.confirmedAppointments}</div>
                <div className="text-gray-500">Confirmés</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{globalStats.pendingAppointments}</div>
                <div className="text-gray-500">En attente</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{globalStats.completedAppointments}</div>
                <div className="text-gray-500">Terminés</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Patients</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{globalStats.totalPatients}</div>
            <div className="text-sm text-gray-600 mt-1">Patients suivis</div>
            <div className="mt-3 text-xs text-gray-600">
              Moyenne: <span className="font-semibold text-gray-900">{globalStats.averagePatientsPerDoctor}</span> patients/médecin
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Médecins par Département</h2>
              <p className="text-sm text-gray-600 mt-1">Cliquez sur un département pour voir les détails</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un médecin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="divide-y">
          {departments.map(dept => {
            const doctors = departmentData[dept.id] || [];
            const isExpanded = expandedDepartment === dept.id;
            const filteredDoctors = doctors.filter(doc =>
              doc.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div key={dept.id}>
                <button
                  onClick={() => toggleDepartment(dept.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {doctors.length} médecin{doctors.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6">
                    {filteredDoctors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Aucun médecin ne correspond à votre recherche' : 'Aucun médecin dans ce département'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médecin</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patients</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RDV Aujourd'hui</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux d'occupation</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredDoctors.map(doctor => (
                              <tr key={doctor.doctorId} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(doctor.doctorName)}`}
                                      alt={doctor.doctorName}
                                      className="w-10 h-10 rounded-full ring-2 ring-blue-100"
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900">{doctor.doctorName}</div>
                                      <div className="text-sm text-gray-600">{doctor.specialization}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm font-medium text-gray-900">{doctor.patientsAssigned}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm font-medium text-gray-900">{doctor.appointmentsToday}</div>
                                  <div className="text-xs text-gray-500">Semaine: {doctor.appointmentsWeek}</div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                                      <div
                                        className={`h-2 rounded-full ${
                                          doctor.occupancyRate < 60
                                            ? 'bg-green-500'
                                            : doctor.occupancyRate < 80
                                            ? 'bg-orange-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ width: `${doctor.occupancyRate}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{doctor.occupancyRate}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-yellow-500">★</span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {doctor.averageRating > 0 ? doctor.averageRating.toFixed(1) : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">{doctor.totalConsultations} consultations</div>
                                </td>
                                <td className="px-4 py-4">
                                  {getStatusBadge(doctor.status)}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleViewPatients(doctor)}
                                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                      title="Aperçu des patients"
                                    >
                                      <FolderOpen className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleAdminManagement(doctor)}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="Gestion administrative (HR, Paie, Horaires)"
                                    >
                                      <Briefcase className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditDoctor(doctor)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Modifier le médecin"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDoctor(doctor)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Supprimer le médecin"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Contacter par email"
                                    >
                                      <Mail className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Appeler"
                                    >
                                      <Phone className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AddDoctorModal
        isOpen={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onSuccess={() => fetchData()}
      />

      <AssignDoctorToPatientModal
        isOpen={showAssignPatientModal}
        onClose={() => setShowAssignPatientModal(false)}
        onSuccess={() => fetchData()}
      />

      {selectedDoctor && (
        <>
          <DoctorPatientsOverviewModal
            isOpen={showPatientOverviewModal}
            onClose={() => {
              setShowPatientOverviewModal(false);
              setSelectedDoctor(null);
            }}
            doctor={selectedDoctor}
          />

          <DoctorAdminManagementModal
            isOpen={showAdminManagementModal}
            onClose={() => {
              setShowAdminManagementModal(false);
              setSelectedDoctor(null);
            }}
            doctor={selectedDoctor}
          />
        </>
      )}
    </div>
  );
}
