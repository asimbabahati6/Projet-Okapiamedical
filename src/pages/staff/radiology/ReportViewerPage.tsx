import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, CheckCircle, Download, Printer } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ReportDetails {
  id: string;
  exam_id: string;
  technique: string;
  findings: string;
  impression: string;
  recommendations: string;
  status: string;
  performed_at: string;
  validated_at: string;
  exam: {
    exam_type: string;
    modality: string;
    body_part: string;
    urgency_level: string;
    clinical_info: string;
    created_at: string;
    patient: {
      first_name: string;
      last_name: string;
      patient_number: string;
      date_of_birth: string;
      gender: string;
    };
    prescriber: {
      full_name: string;
    };
  };
  performer: {
    full_name: string;
  };
  validator?: {
    full_name: string;
  };
}

export default function ReportViewerPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      fetchReport();
    }
  }, [examId]);

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('radiology_reports')
        .select(`
          *,
          exam:radiology_exams!radiology_reports_exam_id_fkey(
            exam_type,
            modality,
            body_part,
            urgency_level,
            clinical_info,
            created_at,
            patient:patients(first_name, last_name, patient_number, date_of_birth, gender),
            prescriber:user_profiles!radiology_exams_prescribed_by_fkey(full_name)
          ),
          performer:user_profiles!radiology_reports_performed_by_fkey(full_name),
          validator:user_profiles!radiology_reports_validated_by_fkey(full_name)
        `)
        .eq('exam_id', examId)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Fonctionnalité de téléchargement PDF à venir');
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          <p className="text-gray-600 mt-4">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/staff/radiology/queue')}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la File d'Attente
        </button>
        <div className="text-center py-12">
          <p className="text-red-600">Rapport non trouvé ou pas encore créé</p>
        </div>
      </div>
    );
  }

  const exam = report.exam;
  const patient = exam.patient;

  return (
    <div className="p-8">
      <div className="print:hidden">
        <button
          onClick={() => navigate('/staff/radiology/queue')}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la File d'Attente
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg print:shadow-none">
        <div className="print:hidden p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rapport Radiologique</h1>
              <p className="text-sm text-gray-600">
                {report.status === 'validated' ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Validé
                  </span>
                ) : (
                  'En attente de validation'
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Télécharger
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
          </div>
        </div>

        <div className="p-8 print:p-8">
          <div className="text-center mb-8 print:mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              RAPPORT D'IMAGERIE MÉDICALE
            </h2>
            <p className="text-lg text-cyan-600 font-semibold">
              {getExamTypeLabel(exam.exam_type)} - {exam.body_part}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 print:mb-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-600 print:hidden" />
                  <h3 className="font-bold text-gray-900">Informations Patient</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nom :</span> {patient.first_name} {patient.last_name}</p>
                  <p><span className="font-medium">N° Patient :</span> {patient.patient_number}</p>
                  <p><span className="font-medium">Date de naissance :</span> {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-medium">Sexe :</span> {patient.gender === 'male' ? 'Masculin' : 'Féminin'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600 print:hidden" />
                  <h3 className="font-bold text-gray-900">Dates</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Prescription :</span> {new Date(exam.created_at).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-medium">Réalisation :</span> {new Date(report.performed_at).toLocaleDateString('fr-FR')}</p>
                  {report.validated_at && (
                    <p><span className="font-medium">Validation :</span> {new Date(report.validated_at).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
                <h3 className="font-bold text-gray-900 mb-3">Détails Examen</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Type :</span> {getExamTypeLabel(exam.exam_type)}</p>
                  <p><span className="font-medium">Modalité :</span> {exam.modality}</p>
                  <p><span className="font-medium">Région :</span> {exam.body_part}</p>
                  <p><span className="font-medium">Urgence :</span> {exam.urgency_level === 'routine' ? 'Routine' : exam.urgency_level === 'urgent' ? 'Urgent' : 'Urgence'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
                <h3 className="font-bold text-gray-900 mb-3">Intervenants</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Prescripteur :</span> Dr. {exam.prescriber.full_name}</p>
                  <p><span className="font-medium">Réalisé par :</span> {report.performer.full_name}</p>
                  {report.validator && (
                    <p><span className="font-medium">Validé par :</span> Dr. {report.validator.full_name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 print:space-y-4">
            <div className="border-t border-gray-200 pt-6 print:pt-4">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Renseignements Cliniques</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{exam.clinical_info}</p>
            </div>

            {report.technique && (
              <div className="border-t border-gray-200 pt-6 print:pt-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Technique</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{report.technique}</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6 print:pt-4">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Observations</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{report.findings}</p>
            </div>

            <div className="border-t border-gray-200 pt-6 print:pt-4">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Conclusion</h3>
              <p className="text-gray-800 whitespace-pre-wrap font-medium">{report.impression}</p>
            </div>

            {report.recommendations && (
              <div className="border-t border-gray-200 pt-6 print:pt-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Recommandations</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{report.recommendations}</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600 print:mt-6 print:pt-4">
            <p>Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
            {report.status === 'validated' && report.validator && (
              <p className="mt-2 flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                Rapport validé par Dr. {report.validator.full_name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
