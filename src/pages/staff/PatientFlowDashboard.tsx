import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Plus, Search, Calendar, FileSearch, UserPlus, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FlowPatientCard, type PatientAdmission } from '../../components/patient-flow/FlowPatientCard';
import { ReportStatusBadge } from '../../components/patient-flow/ReportStatusBadge';
import { AdmissionFormModal } from '../../components/patient-flow/AdmissionFormModal';

export default function PatientFlowDashboard() {
  const [admissions, setAdmissions] = useState<PatientAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const loadAdmissions = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

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

  const filtered = admissions.filter(a => {
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

  const examAdmissions = filtered.filter(a => a.flow_type === 'exam_only');
  const newPatientAdmissions = filtered.filter(a => a.flow_type === 'new_patient');

  const totalExams = admissions.filter(a => a.flow_type === 'exam_only').length;
  const totalNewPatients = admissions.filter(a => a.flow_type === 'new_patient').length;
  const reportsSent = admissions.filter(a => a.flow_type === 'exam_only' && a.status === 'report_sent').length;
  const pendingCount = admissions.filter(a => a.status === 'waiting').length;

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

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
            Gestion des admissions journalières
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle admission
        </button>
      </div>

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
            <option value="completed">Terminé</option>
            <option value="report_sent">Rapport envoyé</option>
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
      {loading ? (
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
                <p className="text-xs text-gray-500">Patients recommandés - Examen seul</p>
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

      {/* Admission Modal */}
      <AdmissionFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadAdmissions}
      />
    </div>
  );
}
