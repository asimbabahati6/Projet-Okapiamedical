import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useRadiologyPermissions } from '../../../hooks/useRadiologyPermissions';
import { supabase } from '../../../lib/supabase';
import ImageUploader from '../components/ImageUploader';
import ReportEditor from '../components/ReportEditor';
import { ProtectedAction } from '../../../components/common/ProtectedAction';

interface ExamData {
  id: string;
  patient_id: string;
  exam_type: string;
  urgency_level: string;
  status: string;
  clinical_indication?: string;
  patient?: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
  };
}

export default function ExamWorkspace() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const permissions = useRadiologyPermissions();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [reportSections, setReportSections] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const fetchExam = async () => {
    try {
      const { data, error } = await supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients (
            first_name,
            last_name,
            date_of_birth,
            gender
          )
        `)
        .eq('id', examId)
        .single();

      if (error) throw error;
      setExam(data);
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (images: any[]) => {
    setUploadedImages(images);
  };

  const handleSaveReport = async (sections: any[]) => {
    setReportSections(sections);

    try {
      const { error } = await supabase
        .from('radiology_reports')
        .upsert({
          exam_id: examId,
          technique: sections.find(s => s.id === 'technique')?.content || '',
          findings: sections.find(s => s.id === 'findings')?.content || '',
          conclusion: sections.find(s => s.id === 'conclusion')?.content || '',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  };

  const handleCompleteExam = async () => {
    if (uploadedImages.length === 0) {
      alert('Veuillez télécharger au moins une image avant de terminer.');
      return;
    }

    const hasAllSections = reportSections.every(s => s.content.trim() !== '');
    if (!hasAllSections) {
      alert('Veuillez remplir toutes les sections du rapport.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('radiology_exams')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', examId);

      if (error) throw error;

      alert('Examen terminé avec succès!');
      navigate('/staff/radiology/queue');
    } catch (error) {
      console.error('Error completing exam:', error);
      alert('Erreur lors de la finalisation de l\'examen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateReport = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('radiology_exams')
        .update({
          status: 'validated',
          validated_at: new Date().toISOString()
        })
        .eq('id', examId);

      if (error) throw error;

      alert('Rapport validé avec succès!');
      navigate('/staff/radiology/queue');
    } catch (error) {
      console.error('Error validating report:', error);
      alert('Erreur lors de la validation du rapport');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReport = async () => {
    const reason = prompt('Motif du rejet:');
    if (!reason) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('radiology_exams')
        .update({
          status: 'in_progress',
          rejection_reason: reason
        })
        .eq('id', examId);

      if (error) throw error;

      alert('Rapport renvoyé pour révision');
      navigate('/staff/radiology/queue');
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('Erreur lors du rejet du rapport');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Examen non trouvé</p>
        </div>
      </div>
    );
  }

  const canModify = permissions.canPerformExams && exam.status !== 'validated';
  const canValidate = permissions.canValidateReports && exam.status === 'completed';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/staff/radiology/queue')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la file d'attente
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Espace de travail - {exam.exam_type}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Patient</p>
                    <p className="text-gray-900">
                      {exam.patient?.first_name} {exam.patient?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {exam.patient?.gender === 'male' ? 'Homme' : 'Femme'} •{' '}
                      {new Date().getFullYear() -
                        new Date(exam.patient?.date_of_birth || '').getFullYear()}{' '}
                      ans
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Indication clinique</p>
                    <p className="text-gray-900">{exam.clinical_indication || 'Non spécifiée'}</p>
                  </div>
                </div>
              </div>
            </div>

            {exam.status && (
              <div className="ml-4">
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    exam.status === 'validated'
                      ? 'bg-emerald-100 text-emerald-800'
                      : exam.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : exam.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {exam.status === 'validated'
                    ? 'Validé'
                    : exam.status === 'completed'
                    ? 'Terminé'
                    : exam.status === 'in_progress'
                    ? 'En cours'
                    : 'Prescrit'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Image Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Images et clichés</h2>
          <ImageUploader
            examId={examId || ''}
            onUploadSuccess={handleUploadSuccess}
            disabled={!canModify}
          />
        </div>

        {/* Report Editor Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <ReportEditor
            reportId={examId || ''}
            onSave={handleSaveReport}
            readOnly={!canModify}
          />
        </div>

        {/* Validation Panel (Chef Radio only) */}
        {canValidate && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Validation du rapport</h2>
            <p className="text-gray-600 mb-6">
              Vérifiez que toutes les informations sont correctes et que le rapport est complet
              avant de le valider.
            </p>
            <div className="flex gap-4">
              <ProtectedAction
                permission="radiology_validate_reports"
                onClick={handleValidateReport}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                {submitting ? 'Validation...' : 'Valider le rapport'}
              </ProtectedAction>

              <button
                onClick={handleRejectReport}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                Demander révision
              </button>
            </div>
          </div>
        )}

        {/* Complete Exam Button (Tech/Chef) */}
        {canModify && exam.status !== 'completed' && (
          <div className="flex justify-end">
            <button
              onClick={handleCompleteExam}
              disabled={submitting || uploadedImages.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {submitting ? 'Finalisation...' : 'Terminer l\'examen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
