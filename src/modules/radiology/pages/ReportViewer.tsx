import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, CheckCircle2, FileText, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ImageViewer from '../components/ImageViewer';

interface ReportData {
  id: string;
  exam_id: string;
  technique: string;
  findings: string;
  conclusion: string;
  validated_at?: string;
  validated_by?: string;
  exam?: {
    exam_type: string;
    urgency_level: string;
    prescribed_at: string;
    patient?: {
      first_name: string;
      last_name: string;
      date_of_birth: string;
      gender: string;
      patient_number: string;
    };
  };
  images?: any[];
}

export default function ReportViewer() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients (
            first_name,
            last_name,
            date_of_birth,
            gender,
            patient_number
          )
        `)
        .eq('id', reportId)
        .single();

      if (examError) throw examError;

      const { data: reportData, error: reportError } = await supabase
        .from('radiology_reports')
        .select('*')
        .eq('exam_id', reportId)
        .single();

      if (reportError) throw reportError;

      setReport({
        ...reportData,
        exam: examData,
        images: []
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Rapport non trouvé</p>
        </div>
      </div>
    );
  }

  const patient = report.exam?.patient;
  const age = patient?.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/staff/radiology/queue')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Rapport d'imagerie - {report.exam?.exam_type}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(report.exam?.prescribed_at || '').toLocaleDateString('fr-FR')}
                </span>
                {report.validated_at && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Validé le {new Date(report.validated_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Rapport validé
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Informations patient</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium text-gray-900">
                      {patient?.first_name} {patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">N° Dossier</p>
                    <p className="font-medium text-gray-900">{patient?.patient_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Âge / Sexe</p>
                    <p className="font-medium text-gray-900">
                      {age} ans / {patient?.gender === 'male' ? 'Homme' : 'Femme'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images Section */}
      {report.images && report.images.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-600" />
            Clichés radiologiques
          </h2>
          <ImageViewer
            images={report.images}
            features={{
              zoom: true,
              rotate: true,
              fullscreen: true,
              download: true,
              compare: true
            }}
          />
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-cyan-600" />
          Compte-rendu
        </h2>

        {/* Technique Section */}
        <div className="border-l-4 border-cyan-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Technique</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.technique}</p>
        </div>

        {/* Findings Section */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Constatations</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.findings}</p>
        </div>

        {/* Conclusion Section */}
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conclusion</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.conclusion}</p>
        </div>

        {/* Signature */}
        {report.validated_at && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>
                Rapport validé le {new Date(report.validated_at).toLocaleDateString('fr-FR')} à{' '}
                {new Date(report.validated_at).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-cyan-600" />
          Historique des examens
        </h2>
        <p className="text-gray-600">
          Aucun examen antérieur du même type pour ce patient.
        </p>
      </div>
    </div>
  );
}
