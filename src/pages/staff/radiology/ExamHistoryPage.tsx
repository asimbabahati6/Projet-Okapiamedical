import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, Filter, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface HistoricalExam {
  id: string;
  exam_type: string;
  modality: string;
  body_part: string;
  status: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  prescriber: {
    full_name: string;
  };
  report?: {
    id: string;
    validated_at: string;
  };
}

export default function ExamHistoryPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<HistoricalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, [modalityFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number),
          prescriber:user_profiles!radiology_exams_prescribed_by_fkey(full_name),
          report:radiology_reports(id, validated_at)
        `)
        .in('status', ['completed', 'validated'])
        .order('created_at', { ascending: false });

      if (modalityFilter !== 'all') {
        query = query.eq('modality', modalityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
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

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      !searchQuery ||
      exam.patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.patient.patient_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDateFrom = !dateFrom || new Date(exam.created_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(exam.created_at) <= new Date(dateTo);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const groupedByMonth = filteredExams.reduce((acc, exam) => {
    const date = new Date(exam.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(exam);
    return acc;
  }, {} as Record<string, HistoricalExam[]>);

  const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

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
            <h1 className="text-3xl font-bold text-gray-900">Historique des Examens</h1>
            <p className="text-gray-600 mt-1">Consultation des examens passés</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">{filteredExams.length} examen(s)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom du patient, n° dossier..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Modalité
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Toutes' },
              { value: 'CR', label: 'Radiographie (CR)' },
              { value: 'CT', label: 'Scanner (CT)' },
              { value: 'MR', label: 'IRM (MR)' },
              { value: 'US', label: 'Échographie (US)' },
              { value: 'MG', label: 'Mammographie (MG)' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setModalityFilter(option.value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  modalityFilter === option.value
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-medium'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            <p className="text-gray-600 mt-4">Chargement de l'historique...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun examen trouvé</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedMonths.map((monthKey) => {
              const [year, month] = monthKey.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric'
              });

              return (
                <div key={monthKey}>
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-cyan-600" />
                    <h2 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h2>
                    <span className="text-sm text-gray-500">
                      ({groupedByMonth[monthKey].length} examen{groupedByMonth[monthKey].length > 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="space-y-3">
                    {groupedByMonth[monthKey].map((exam) => (
                      <div
                        key={exam.id}
                        className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">
                                {exam.patient.first_name} {exam.patient.last_name}
                              </h3>
                              <span className="text-sm text-gray-500">
                                N° {exam.patient.patient_number}
                              </span>
                              {exam.status === 'validated' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Validé
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-2 text-sm">
                              <div>
                                <p className="text-gray-600">Type</p>
                                <p className="font-semibold text-gray-900">
                                  {getExamTypeLabel(exam.exam_type)} ({exam.modality})
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Région</p>
                                <p className="font-semibold text-gray-900">{exam.body_part}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Date</p>
                                <p className="font-semibold text-gray-900">
                                  {new Date(exam.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600">
                              Prescrit par: {exam.prescriber.full_name}
                            </p>
                          </div>

                          <button
                            onClick={() => navigate(`/staff/radiology/viewer/${exam.id}`)}
                            className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Voir le rapport
                          </button>
                        </div>
                      </div>
                    ))}
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
