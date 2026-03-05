import { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, User, Activity, Search, Filter, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { Consultation, ConsultationDiagnosis } from '../../../types/database';
import { EnhancedAddConsultationModal } from '../../../components/consultations/EnhancedAddConsultationModal';
import { ConsultationDetailsModal } from '../../../components/consultations/ConsultationDetailsModal';

export function EnhancedConsultationsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  });

  useEffect(() => {
    fetchConsultations();
    fetchStats();
  }, [statusFilter]);

  async function fetchConsultations() {
    setLoading(true);
    try {
      let query = supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number, date_of_birth),
          diagnoses:consultation_diagnoses(*)
        `)
        .eq('doctor_id', profile?.id)
        .order('consultation_date', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('consultation_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      showToast('Erreur lors du chargement des consultations', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [todayResult, weekResult, monthResult, totalResult] = await Promise.all([
        supabase
          .from('consultations')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', profile?.id)
          .gte('consultation_date', today.toISOString()),

        supabase
          .from('consultations')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', profile?.id)
          .gte('consultation_date', startOfWeek.toISOString()),

        supabase
          .from('consultations')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', profile?.id)
          .gte('consultation_date', startOfMonth.toISOString()),

        supabase
          .from('consultations')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', profile?.id),
      ]);

      setStats({
        today: todayResult.count || 0,
        thisWeek: weekResult.count || 0,
        thisMonth: monthResult.count || 0,
        total: totalResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'initial':
        return 'Première consultation';
      case 'follow_up':
        return 'Suivi';
      case 'emergency':
        return 'Urgence';
      case 'routine':
        return 'Routine';
      case 'telemedicine':
        return 'Télémédecine';
      default:
        return type;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'reviewed':
        return 'Révisée';
      case 'archived':
        return 'Archivée';
      default:
        return status;
    }
  }

  function getPrimaryDiagnosis(diagnoses?: ConsultationDiagnosis[]) {
    if (!diagnoses || diagnoses.length === 0) return null;
    const primary = diagnoses.find(d => d.is_primary);
    return primary || diagnoses[0];
  }

  const filteredConsultations = consultations.filter(consultation => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${consultation.patient?.first_name} ${consultation.patient?.last_name}`.toLowerCase();
    const patientNumber = consultation.patient?.patient_number?.toLowerCase() || '';
    const consultationNumber = consultation.consultation_number?.toLowerCase() || '';
    const chiefComplaint = consultation.chief_complaint?.toLowerCase() || '';

    return (
      patientName.includes(searchLower) ||
      patientNumber.includes(searchLower) ||
      consultationNumber.includes(searchLower) ||
      chiefComplaint.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Consultations</h1>
          <p className="text-gray-600 mt-2">Gérez vos consultations et dossiers médicaux</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Consultation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.today}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cette Semaine</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.thisWeek}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ce Mois-ci</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.thisMonth}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par patient, numéro, ou motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="reviewed">Révisée</option>
                <option value="archived">Archivée</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Aucune consultation trouvée' : 'Aucune consultation enregistrée'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer ma première consultation
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Consultation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnostic Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsultations.map((consultation) => {
                  const primaryDiagnosis = getPrimaryDiagnosis(consultation.diagnoses);
                  return (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-gray-900">
                          {consultation.consultation_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {consultation.patient?.first_name} {consultation.patient?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {consultation.patient?.patient_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(consultation.consultation_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(consultation.consultation_date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {getTypeLabel(consultation.consultation_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {consultation.chief_complaint}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {primaryDiagnosis ? (
                          <div className="max-w-xs">
                            {!primaryDiagnosis.free_text_diagnosis && primaryDiagnosis.icd10_code && (
                              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono font-semibold rounded mr-2">
                                {primaryDiagnosis.icd10_code}
                              </span>
                            )}
                            <span className="text-sm text-gray-900 truncate">
                              {primaryDiagnosis.icd10_description || primaryDiagnosis.free_text_diagnosis}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(consultation.consultation_status)}`}>
                          {getStatusLabel(consultation.consultation_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedConsultation(consultation);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <EnhancedAddConsultationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchConsultations();
            fetchStats();
          }}
        />
      )}

      {showDetailsModal && selectedConsultation && (
        <ConsultationDetailsModal
          consultation={selectedConsultation}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedConsultation(null);
          }}
        />
      )}
    </div>
  );
}
