import { useEffect, useState } from 'react';
import { Search, Filter, Play, Eye, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRadiologyPermissions } from '../../../hooks/useRadiologyPermissions';
import { supabase } from '../../../lib/supabase';
import { ProtectedAction } from '../../../components/common/ProtectedAction';

interface RadiologyExam {
  id: string;
  patient_id: string;
  exam_type: string;
  urgency_level: 'urgent' | 'normal' | 'routine';
  status: 'prescribed' | 'in_progress' | 'completed' | 'validated';
  prescribed_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
}

export default function ExamQueue() {
  const permissions = useRadiologyPermissions();
  const navigate = useNavigate();
  const [exams, setExams] = useState<RadiologyExam[]>([]);
  const [filteredExams, setFilteredExams] = useState<RadiologyExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, statusFilter, urgencyFilter, examTypeFilter]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients (
            first_name,
            last_name,
            patient_number
          )
        `)
        .order('prescribed_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExams = () => {
    let filtered = [...exams];

    if (searchTerm) {
      filtered = filtered.filter(
        (exam) =>
          exam.patient?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exam.patient?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exam.patient?.patient_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.status === statusFilter);
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.urgency_level === urgencyFilter);
    }

    if (examTypeFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.exam_type === examTypeFilter);
    }

    setFilteredExams(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      prescribed: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      validated: 'bg-emerald-100 text-emerald-800'
    };
    const labels = {
      prescribed: 'Prescrit',
      in_progress: 'En cours',
      completed: 'Terminé',
      validated: 'Validé'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      routine: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    const labels = {
      urgent: 'Urgent',
      normal: 'Normal',
      routine: 'Routine'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badges[urgency as keyof typeof badges]}`}>
        {labels[urgency as keyof typeof labels]}
      </span>
    );
  };

  const handleStartExam = async (examId: string) => {
    navigate(`/staff/radiology/workspace/${examId}`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">File d'attente</h1>
        <p className="text-gray-600 mt-1">Examens radiologiques prescrits</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="prescribed">Prescrit</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="validated">Validé</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">Toutes urgences</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="routine">Routine</option>
          </select>

          {/* Exam Type Filter */}
          <select
            value={examTypeFilter}
            onChange={(e) => setExamTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="radiography">Radiographie</option>
            <option value="ct_scan">Scanner</option>
            <option value="mri">IRM</option>
            <option value="ultrasound">Échographie</option>
          </select>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            <p className="text-gray-600 mt-4">Chargement des examens...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucun examen trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-cyan-50 border-b border-cyan-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">
                  Type d'imagerie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">
                  Urgence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">
                  Date prescription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">
                        {exam.patient?.first_name} {exam.patient?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        N° {exam.patient?.patient_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exam.exam_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getUrgencyBadge(exam.urgency_level)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(exam.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(exam.prescribed_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {exam.status === 'prescribed' && permissions.canPerformExams && (
                      <ProtectedAction
                        permission="radiology_perform_exams"
                        onClick={() => handleStartExam(exam.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Démarrer
                      </ProtectedAction>
                    )}
                    {exam.status === 'in_progress' && permissions.canPerformExams && (
                      <button
                        onClick={() => navigate(`/staff/radiology/workspace/${exam.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Continuer
                      </button>
                    )}
                    {exam.status === 'completed' && permissions.canValidateReports && (
                      <ProtectedAction
                        permission="radiology_validate_reports"
                        onClick={() => navigate(`/staff/radiology/workspace/${exam.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Valider
                      </ProtectedAction>
                    )}
                    {exam.status === 'validated' && (
                      <button
                        onClick={() => navigate(`/staff/radiology/viewer/${exam.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
