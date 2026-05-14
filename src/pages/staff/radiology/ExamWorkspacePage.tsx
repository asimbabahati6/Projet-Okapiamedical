import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Save, CheckCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useRadiologyPermissions } from '../../../hooks/useRadiologyPermissions';

interface ExamDetails {
  id: string;
  patient_id: string;
  exam_type: string;
  modality: string;
  body_part: string;
  urgency_level: string;
  status: string;
  clinical_info: string;
  special_instructions: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
    patient_number: string;
    date_of_birth: string;
  };
  prescriber: {
    full_name: string;
  };
}

export default function ExamWorkspacePage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const permissions = useRadiologyPermissions();
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [reportData, setReportData] = useState({
    technique: '',
    findings: '',
    impression: '',
    recommendations: ''
  });

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number, date_of_birth),
          prescriber:user_profiles!radiology_exams_prescribed_by_fkey(full_name)
        `)
        .eq('id', examId)
        .single();

      if (error) throw error;
      setExam(data);

      if (data.status !== 'prescribed') {
        const { data: reportData } = await supabase
          .from('radiology_reports')
          .select('technique, findings, impression, recommendations')
          .eq('exam_id', examId)
          .single();

        if (reportData) {
          setReportData(reportData);
        }
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !permissions.canPerformExams) return;

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${examId}_${Date.now()}.${fileExt}`;
      const filePath = `radiology/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('medical-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        setUploadedImages(prev => [...prev, filePath]);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Erreur lors du téléchargement de l\'image');
      }
    }
  };

  const handleStartExam = async () => {
    if (!permissions.canPerformExams) return;

    try {
      const { error } = await supabase
        .from('radiology_exams')
        .update({ status: 'in_progress' })
        .eq('id', examId);

      if (error) throw error;
      await fetchExamDetails();
    } catch (error) {
      console.error('Error starting exam:', error);
    }
  };

  const handleSaveReport = async () => {
    if (!permissions.canPerformExams) return;

    setSaving(true);
    try {
      const { data: existingReport } = await supabase
        .from('radiology_reports')
        .select('id')
        .eq('exam_id', examId)
        .single();

      const reportPayload = {
        exam_id: examId,
        performed_by: profile?.id,
        technique: reportData.technique,
        findings: reportData.findings,
        impression: reportData.impression,
        recommendations: reportData.recommendations,
        status: 'draft'
      };

      if (existingReport) {
        await supabase
          .from('radiology_reports')
          .update(reportPayload)
          .eq('id', existingReport.id);
      } else {
        await supabase
          .from('radiology_reports')
          .insert(reportPayload);
      }

      alert('Rapport sauvegardé avec succès');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteExam = async () => {
    if (!permissions.canPerformExams) return;

    if (!reportData.findings || !reportData.impression) {
      alert('Veuillez remplir au minimum les sections Observations et Conclusion');
      return;
    }

    setSaving(true);
    try {
      await handleSaveReport();

      const { error: examError } = await supabase
        .from('radiology_exams')
        .update({ status: 'completed' })
        .eq('id', examId);

      if (examError) throw examError;

      const { error: reportError } = await supabase
        .from('radiology_reports')
        .update({ status: 'pending_validation' })
        .eq('exam_id', examId);

      if (reportError) throw reportError;

      alert('Examen terminé ! En attente de validation.');
      navigate('/staff/radiology/queue');
    } catch (error) {
      console.error('Error completing exam:', error);
      alert('Erreur lors de la finalisation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          <p className="text-gray-600 mt-4">Chargement de l'examen...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-red-600">Examen non trouvé</p>
        </div>
      </div>
    );
  }

  const canEdit = permissions.canPerformExams && exam.status !== 'validated';

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/staff/radiology/queue')}
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à la File d'Attente
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Espace de Travail</h1>
            <p className="text-gray-600 mt-1">
              Examen {exam.modality} - {exam.body_part}
            </p>
          </div>
          <div className="flex gap-3">
            {exam.status === 'prescribed' && canEdit && (
              <button
                onClick={handleStartExam}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Démarrer l'Examen
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <p className="text-sm text-gray-600 mb-1">Patient</p>
            <p className="font-bold text-gray-900">
              {exam.patient.first_name} {exam.patient.last_name}
            </p>
            <p className="text-sm text-gray-600">N° {exam.patient.patient_number}</p>
            <p className="text-sm text-gray-600">
              Né(e) le {new Date(exam.patient.date_of_birth).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Prescrit par</p>
            <p className="font-semibold text-gray-900">{exam.prescriber.full_name}</p>
            <p className="text-sm text-gray-600">
              Le {new Date(exam.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Renseignements cliniques</p>
            <p className="text-sm text-gray-900">{exam.clinical_info}</p>
          </div>
        </div>

        {canEdit && exam.status !== 'prescribed' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images DICOM
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-cyan-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.dcm"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Cliquez pour uploader des images
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  DICOM, JPEG, PNG acceptés
                </p>
              </label>
            </div>
            {uploadedImages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Image {idx + 1}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technique
            </label>
            <textarea
              value={reportData.technique}
              onChange={(e) => setReportData({ ...reportData, technique: e.target.value })}
              disabled={!canEdit || exam.status === 'prescribed'}
              rows={3}
              placeholder="Paramètres techniques, matériel utilisé..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations *
            </label>
            <textarea
              value={reportData.findings}
              onChange={(e) => setReportData({ ...reportData, findings: e.target.value })}
              disabled={!canEdit || exam.status === 'prescribed'}
              rows={6}
              placeholder="Description détaillée des observations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conclusion *
            </label>
            <textarea
              value={reportData.impression}
              onChange={(e) => setReportData({ ...reportData, impression: e.target.value })}
              disabled={!canEdit || exam.status === 'prescribed'}
              rows={4}
              placeholder="Diagnostic radiologique, interprétation..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommandations
            </label>
            <textarea
              value={reportData.recommendations}
              onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
              disabled={!canEdit || exam.status === 'prescribed'}
              rows={3}
              placeholder="Suite à donner, examens complémentaires..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {canEdit && exam.status !== 'prescribed' && (
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveReport}
              disabled={saving}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder Brouillon'}
            </button>
            <button
              onClick={handleCompleteExam}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {saving ? 'Finalisation...' : 'Terminer l\'Examen'}
            </button>
            <button
              onClick={() => navigate(`/staff/radiology/report-template/${examId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Voir le rapport
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
