import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, Activity, CheckCircle, Eye, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRadiologyPermissions } from '../../../hooks/useRadiologyPermissions';

interface RadiologyExam {
  id: string;
  patient_id: string;
  exam_type: string;
  modality: string;
  body_part: string;
  urgency_level: string;
  status: string;
  clinical_info: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  prescriber: {
    full_name: string;
  };
}

const STATUS_CONFIG = {
  prescribed: { label: 'Prescrit', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Activity },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  validated: { label: 'Validé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
};

const URGENCY_CONFIG = {
  routine: { label: 'Routine', color: 'bg-gray-100 text-gray-800' },
  urgent: { label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
  emergency: { label: 'Urgence', color: 'bg-red-100 text-red-800' }
};

export default function ExamQueuePage() {
  const navigate = useNavigate();
  const permissions = useRadiologyPermissions();
  const [exams, setExams] = useState<RadiologyExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  useEffect(() => {
    fetchExams();
  }, [statusFilter, urgencyFilter]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number),
          prescriber:user_profiles!radiology_exams_prescribed_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (urgencyFilter !== 'all') {
        query = query.eq('urgency_level', urgencyFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamClick = (examId: string) => {
    if (permissions.canPerformExams) {
      navigate(`/staff/radiology/workspace/${examId}`);
    } else {
      navigate(`/staff/radiology/viewer/${examId}`);
    }
  };

  const getExamTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      radiography: 'Radiographie',
      ct_scan: 'Scanner',
      mri: 'IRM',
      ultrasound: 'Échographie',
      mammography: 'Mammographie'
    };
    return types[type] || type;
  };

  const filteredExams = exams;

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/staff/radiology')}
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">File d'Attente</h1>
            <p className="text-gray-600 mt-1">Examens radiologiques en attente</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">{filteredExams.length} examen(s)</span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="prescribed">Prescrits</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminés</option>
              <option value="validated">Validés</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgence</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Toutes les urgences</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Urgence</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            <p className="text-gray-600 mt-4">Chargement des examens...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun examen trouvé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => {
              const statusConfig = STATUS_CONFIG[exam.status as keyof typeof STATUS_CONFIG];
              const urgencyConfig = URGENCY_CONFIG[exam.urgency_level as keyof typeof URGENCY_CONFIG];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={exam.id}
                  onClick={() => handleExamClick(exam.id)}
                  className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {exam.patient.first_name} {exam.patient.last_name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          N° {exam.patient.patient_number}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${urgencyConfig.color}`}>
                          {urgencyConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Type d'examen</p>
                          <p className="font-semibold text-gray-900">
                            {getExamTypeLabel(exam.exam_type)} ({exam.modality})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Partie du corps</p>
                          <p className="font-semibold text-gray-900">{exam.body_part}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Renseignements cliniques</p>
                        <p className="text-sm text-gray-900">{exam.clinical_info}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Prescrit par: {exam.prescriber.full_name}</span>
                        <span>•</span>
                        <span>Le {new Date(exam.created_at).toLocaleDateString('fr-FR')} à {new Date(exam.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </span>
                      <button className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
