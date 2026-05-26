import { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, Plus, Search, Calendar, FileSearch, UserPlus, RefreshCw, Filter,
  Users, Phone, MapPin, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logActivity } from '../../utils/activityLogger';
import { FlowPatientCard, type PatientAdmission } from '../../components/patient-flow/FlowPatientCard';
import { ReportStatusBadge } from '../../components/patient-flow/ReportStatusBadge';
import { AdmissionFormModal } from '../../components/patient-flow/AdmissionFormModal';
import { ExamAssignmentModal } from '../../components/patient-flow/ExamAssignmentModal';

type TabView = 'admissions' | 'registry';

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  city: string | null;
  created_at: string;
}

const LAB_ROLES = ['laboratory', 'lab_technician', 'biologiste', 'biologist'];

export default function PatientFlowDashboard() {
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';
  const canAdmit = !LAB_ROLES.includes(userRole);

  const [activeTab, setActiveTab] = useState<TabView>('admissions');

  // Admissions state
  const [admissions, setAdmissions] = useState<PatientAdmission[]>([]);
  const [admissionsLoading, setAdmissionsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  // Patient registry state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showExamAssignmentModal, setShowExamAssignmentModal] = useState(false);
  const [newlyCreatedPatient, setNewlyCreatedPatient] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [patientForm, setPatientForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'M',
    date_of_birth: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const loadAdmissions = useCallback(async () => {
    setAdmissionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_admissions')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number, phone),
          department:departments(name)
        `)
        .eq('admission_date', selectedDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAdmissions(data || []);
    } catch (err) {
      console.error('Error loading admissions:', err);
    } finally {
      setAdmissionsLoading(false);
    }
  }, [selectedDate]);

  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, gender, date_of_birth, city, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setPatients(data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          full_name: `${p.last_name || ''} ${p.first_name || ''}`.trim(),
          phone: (p.phone as string) || '',
          gender: (p.gender as string) || '',
          date_of_birth: p.date_of_birth as string | null,
          city: p.city as string | null,
          created_at: p.created_at as string,
        })));
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  useEffect(() => {
    if (activeTab === 'registry' && patients.length === 0) {
      loadPatients();
    }
  }, [activeTab, patients.length, loadPatients]);

  async function handleStatusChange(id: string, newStatus: PatientAdmission['status']) {
    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'report_sent') {
      updates.report_sent_at = new Date().toISOString();
    }
    const { error } = await supabase.from('patient_admissions').update(updates).eq('id', id);
    if (!error) {
      setAdmissions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  }

  async function handleMarkReportSent(id: string) {
    const updates = {
      status: 'report_sent' as const,
      report_sent_at: new Date().toISOString(),
      report_sent_method: 'phone',
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('patient_admissions').update(updates).eq('id', id);
    if (!error) {
      setAdmissions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  }

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date();
      const patientNumber = `PAT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

      const { data: insertedPatient, error } = await supabase.from('patients').insert({
        patient_number: patientNumber,
        first_name: patientForm.first_name,
        last_name: patientForm.last_name,
        gender: patientForm.gender,
        date_of_birth: patientForm.date_of_birth,
        phone: patientForm.phone || null,
        email: patientForm.email || null,
        city: patientForm.city || null,
        address: patientForm.address || null,
        blood_group: patientForm.blood_group || null,
        emergency_contact_name: patientForm.emergency_contact_name || null,
        emergency_contact_phone: patientForm.emergency_contact_phone || null,
      }).select('id').maybeSingle();

      if (error) throw error;

      logActivity('create', 'patients', `Nouveau patient: ${patientForm.first_name} ${patientForm.last_name}`);

      const createdName = `${patientForm.last_name} ${patientForm.first_name}`;
      const createdId = insertedPatient?.id;

      setShowPatientModal(false);
      setPatientForm({ first_name: '', last_name: '', gender: 'M', date_of_birth: '', phone: '', email: '', city: '', address: '', blood_group: '', emergency_contact_name: '', emergency_contact_phone: '' });
      loadPatients();

      if (createdId) {
        setNewlyCreatedPatient({ id: createdId, name: createdName });
        setShowExamAssignmentModal(true);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
    } finally {
      setSaving(false);
    }
  }

  // Admission filters
  const filteredAdmissions = admissions.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const patientName = a.patient ? `${a.patient.first_name} ${a.patient.last_name}`.toLowerCase() : '';
      const patientNum = a.patient?.patient_number?.toLowerCase() || '';
      const prescriber = a.prescribing_doctor_name?.toLowerCase() || '';
      if (!patientName.includes(q) && !patientNum.includes(q) && !prescriber.includes(q)) return false;
    }
    return true;
  });

  const examAdmissions = filteredAdmissions.filter(a => a.flow_type === 'exam_only');
  const newPatientAdmissions = filteredAdmissions.filter(a => a.flow_type === 'new_patient');

  const totalExams = admissions.filter(a => a.flow_type === 'exam_only').length;
  const totalNewPatients = admissions.filter(a => a.flow_type === 'new_patient').length;
  const reportsSent = admissions.filter(a => a.flow_type === 'exam_only' && a.status === 'report_sent').length;
  const pendingCount = admissions.filter(a => a.status === 'waiting').length;

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Patient registry filters
  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <GitBranch className="w-7 h-7 text-gray-700" />
            Flux Patients
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestion des admissions et registre des patients
          </p>
        </div>
        {canAdmit && (
          <button
            onClick={() => activeTab === 'admissions' ? setShowAdmissionModal(true) : setShowPatientModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'admissions' ? 'Nouvelle admission' : 'Nouveau patient'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          <button
            onClick={() => setActiveTab('admissions')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'admissions'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Admissions du jour
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'registry'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Registre des Patients
          </button>
        </nav>
      </div>

      {/* Admissions Tab */}
      {activeTab === 'admissions' && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total du jour</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{admissions.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-blue-100 p-4">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Examens</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{totalExams}</p>
            </div>
            <div className="bg-white rounded-xl border border-green-100 p-4">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Nouveaux patients</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{totalNewPatients}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">En attente</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher patient ou prescripteur..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Aujourd'hui
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="waiting">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Termine</option>
                <option value="report_sent">Rapport envoye</option>
              </select>
            </div>

            <button
              onClick={loadAdmissions}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Report Status */}
          {totalExams > 0 && (
            <ReportStatusBadge totalExams={totalExams} reportsSent={reportsSent} />
          )}

          {/* Split Columns */}
          {admissionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exam Column */}
              <div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-500">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileSearch className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Flux Examen</h2>
                    <p className="text-xs text-gray-500">Patients recommandes - Examen seul</p>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                    {examAdmissions.length}
                  </span>
                </div>

                {examAdmissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Aucun examen pour {isToday ? "aujourd'hui" : 'cette date'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {examAdmissions.map(admission => (
                      <FlowPatientCard
                        key={admission.id}
                        admission={admission}
                        onStatusChange={handleStatusChange}
                        onMarkReportSent={handleMarkReportSent}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* New Patient Column */}
              <div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-500">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <UserPlus className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Flux Nouveau Patient</h2>
                    <p className="text-xs text-gray-500">Parcours de soins complet</p>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    {newPatientAdmissions.length}
                  </span>
                </div>

                {newPatientAdmissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Aucun nouveau patient pour {isToday ? "aujourd'hui" : 'cette date'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newPatientAdmissions.map(admission => (
                      <FlowPatientCard
                        key={admission.id}
                        admission={admission}
                        onStatusChange={handleStatusChange}
                        onMarkReportSent={handleMarkReportSent}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Patient Registry Tab */}
      {activeTab === 'registry' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Total patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{patients.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Hommes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{patients.filter(p => p.gender === 'M').length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Femmes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{patients.filter(p => p.gender === 'F').length}</p>
            </div>
          </div>

          {/* Patient List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou telephone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {patientsLoading ? (
              <div className="p-12 text-center text-gray-400">Chargement...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun patient trouve</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="p-4 hover:bg-gray-50 flex items-center gap-4 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-semibold text-sm">
                        {patient.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{patient.full_name}</p>
                      <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500">
                        {patient.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>
                        )}
                        {patient.city && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{patient.city}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(patient.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Admission Modal */}
      <AdmissionFormModal
        isOpen={showAdmissionModal}
        onClose={() => setShowAdmissionModal(false)}
        onSuccess={loadAdmissions}
      />

      {/* Create Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nouveau patient</h2>
              <button onClick={() => setShowPatientModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePatient} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.last_name}
                    onChange={(e) => setPatientForm({ ...patientForm, last_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Nom de famille"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.first_name}
                    onChange={(e) => setPatientForm({ ...patientForm, first_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Prenom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
                  <select
                    required
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Feminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                  <input
                    type="date"
                    required
                    value={patientForm.date_of_birth}
                    onChange={(e) => setPatientForm({ ...patientForm, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="+243..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={patientForm.city}
                    onChange={(e) => setPatientForm({ ...patientForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Ville"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Groupe sanguin</label>
                  <select
                    value={patientForm.blood_group}
                    onChange={(e) => setPatientForm({ ...patientForm, blood_group: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">-- Non renseigne --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Adresse complete"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact d'urgence</label>
                  <input
                    type="text"
                    value={patientForm.emergency_contact_name}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Nom du contact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tel. urgence</label>
                  <input
                    type="tel"
                    value={patientForm.emergency_contact_phone}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact_phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="+243..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExamAssignmentModal && newlyCreatedPatient && (
        <ExamAssignmentModal
          isOpen={showExamAssignmentModal}
          onClose={() => {
            setShowExamAssignmentModal(false);
            setNewlyCreatedPatient(null);
          }}
          onSuccess={() => {
            loadAdmissions();
          }}
          patientId={newlyCreatedPatient.id}
          patientName={newlyCreatedPatient.name}
        />
      )}
    </div>
  );
}