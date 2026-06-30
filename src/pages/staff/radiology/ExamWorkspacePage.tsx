import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Save, CheckCircle, FileText, Image as ImageIcon, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
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

const EXAM_TYPE_LABELS: Record<string, string> = {
  radiography: 'Radiographie',
  ct_scan: 'Scanner (CT)',
  mri: 'IRM',
  ultrasound: 'Echographie',
  mammography: 'Mammographie',
};

const URGENCY_STYLES: Record<string, string> = {
  routine: 'bg-gray-100 text-gray-700',
  urgent: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
};

const VALIDATOR_ROLES = ['doctor', 'medecin', 'radio_chef', 'medical_director', 'medecin_chef_staff', 'super_admin', 'hospital_admin'];

export default function ExamWorkspacePage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const permissions = useRadiologyPermissions();
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');
  const [reportId, setReportId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [reportData, setReportData] = useState({
    technique: '',
    findings: '',
    impression: '',
    recommendations: ''
  });

  const canValidate = VALIDATOR_ROLES.includes(profile?.role?.name || '');

  useEffect(() => {
    if (examId) fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number, date_of_birth),
          prescriber:user_profiles!radiology_exams_prescribed_by_fkey(full_name)
        `)
        .eq('id', examId)
        .single();

      if (fetchErr) throw fetchErr;
      setExam(data);

      const { data: existingReport } = await supabase
        .from('radiology_reports')
        .select('id, technique, findings, impression, recommendations')
        .eq('exam_id', examId)
        .maybeSingle();

      if (existingReport) {
        setReportId(existingReport.id);
        setReportData({
          technique: existingReport.technique || '',
          findings: existingReport.findings || '',
          impression: existingReport.impression || '',
          recommendations: existingReport.recommendations || '',
        });
      }
    } catch (err) {
      console.error('Error fetching exam:', err);
      setError('Impossible de charger l\'examen.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `radiology/${examId}_${Date.now()}.${ext}`;
      try {
        const { error: uploadErr } = await supabase.storage.from('medical-images').upload(path, file);
        if (uploadErr) throw uploadErr;
        setUploadedImages(prev => [...prev, path]);
      } catch {
        setError('Erreur lors du telechargement de l\'image');
      }
    }
  };

  const handleStartExam = async () => {
    setSaving(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('radiology_exams')
        .update({ status: 'in_progress', performed_at: new Date().toISOString() })
        .eq('id', examId);
      if (err) throw err;
      await fetchExamDetails();
      setSaveSuccess('Examen demarre.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch {
      setError('Erreur au demarrage de l\'examen.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReport = async (submitForValidation = false) => {
    if (!exam) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        exam_id: examId,
        patient_id: exam.patient_id,
        created_by: profile?.id,
        performed_by: profile?.id,
        exam_type: exam.exam_type,
        clinical_indication: exam.clinical_info,
        technique: reportData.technique,
        findings: reportData.findings,
        impression: reportData.impression,
        recommendations: reportData.recommendations,
        conclusion: reportData.impression,
        technical_notes: reportData.technique,
        status: submitForValidation ? 'technical_review' : 'draft',
        performed_at: new Date().toISOString(),
      };

      if (reportId) {
        const { error: err } = await supabase
          .from('radiology_reports')
          .update(payload)
          .eq('id', reportId);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase
          .from('radiology_reports')
          .insert(payload)
          .select('id')
          .single();
        if (err) throw err;
        if (data) setReportId(data.id);
      }

      if (submitForValidation) {
        const { error: examErr } = await supabase
          .from('radiology_exams')
          .update({ status: 'completed' })
          .eq('id', examId);
        if (examErr) throw examErr;
        setSaveSuccess('Examen termine et soumis pour validation.');
        setTimeout(() => navigate('/staff/radiology/queue'), 1500);
      } else {
        setSaveSuccess('Rapport sauvegarde.');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error saving:', err);
      setError('Erreur lors de la sauvegarde du rapport.');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!reportId || !canValidate) return;
    setSaving(true);
    setError('');
    try {
      const { error: rErr } = await supabase
        .from('radiology_reports')
        .update({
          status: 'validated',
          validated_by: profile?.id,
          validated_at: new Date().toISOString(),
          is_locked: true,
        })
        .eq('id', reportId);
      if (rErr) throw rErr;

      const { error: eErr } = await supabase
        .from('radiology_exams')
        .update({ status: 'validated' })
        .eq('id', examId);
      if (eErr) throw eErr;

      setSaveSuccess('Rapport valide avec succes.');
      setTimeout(() => navigate('/staff/radiology/queue'), 1500);
    } catch {
      setError('Erreur lors de la validation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-20">
        <Loader2 className="w-10 h-10 text-cyan-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Chargement de l'examen...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8">
        <p className="text-center text-red-600 py-12">Examen non trouve</p>
      </div>
    );
  }

  const canEdit = permissions.canPerformExams && !['validated', 'completed'].includes(exam.status);
  const isStarted = exam.status !== 'prescribed';
  const isCompleted = exam.status === 'completed';
  const isValidated = exam.status === 'validated';

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/staff/radiology/queue')}
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour a la File d'Attente
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {saveSuccess}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Espace de Travail</h1>
            <p className="text-gray-500 mt-1">
              {EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type} - {exam.body_part}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${URGENCY_STYLES[exam.urgency_level] || ''}`}>
              {exam.urgency_level === 'urgent' ? 'Urgent' : exam.urgency_level === 'emergency' ? 'Urgence' : 'Routine'}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              isValidated ? 'bg-emerald-100 text-emerald-700' :
              isCompleted ? 'bg-green-100 text-green-700' :
              isStarted ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {isValidated ? 'Valide' : isCompleted ? 'Termine' : isStarted ? 'En cours' : 'Prescrit'}
            </span>
          </div>
        </div>

        {/* Patient + Clinical Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200">
            <p className="text-xs text-gray-500 font-medium mb-1.5">Patient</p>
            <p className="font-bold text-gray-900">{exam.patient.first_name} {exam.patient.last_name}</p>
            <p className="text-sm text-gray-600">N. {exam.patient.patient_number}</p>
            <p className="text-sm text-gray-600">Ne(e) le {new Date(exam.patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <p className="text-xs text-gray-500 font-medium mb-1.5">Prescrit par</p>
            <p className="font-semibold text-gray-900">{exam.prescriber.full_name}</p>
            <p className="text-sm text-gray-600">Le {new Date(exam.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="text-xs text-gray-500 font-medium mb-1.5">Renseignements cliniques</p>
            <p className="text-sm text-gray-900 leading-relaxed">{exam.clinical_info}</p>
          </div>
        </div>

        {/* Start Exam Button */}
        {exam.status === 'prescribed' && permissions.canPerformExams && (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <FileText className="w-10 h-10 text-cyan-500 mx-auto mb-3" />
            <p className="text-gray-700 mb-4 font-medium">Cet examen n'a pas encore ete demarre.</p>
            <button
              onClick={handleStartExam}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-5 h-5" />}
              Demarrer l'Examen
            </button>
          </div>
        )}

        {/* Image Upload */}
        {isStarted && canEdit && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Images DICOM</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-cyan-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.dcm"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Cliquez pour uploader des images</p>
                <p className="text-xs text-gray-400 mt-1">DICOM, JPEG, PNG acceptes</p>
              </label>
            </div>
            {uploadedImages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image {idx + 1}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Report Form */}
        {isStarted && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Technique</label>
              <textarea
                value={reportData.technique}
                onChange={(e) => setReportData({ ...reportData, technique: e.target.value })}
                disabled={!canEdit}
                rows={3}
                placeholder="Parametres techniques, materiel utilise, protocole..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Observations / Constatations <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reportData.findings}
                onChange={(e) => setReportData({ ...reportData, findings: e.target.value })}
                disabled={!canEdit}
                rows={6}
                placeholder="Description detaillee des observations radiologiques..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Conclusion <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reportData.impression}
                onChange={(e) => setReportData({ ...reportData, impression: e.target.value })}
                disabled={!canEdit}
                rows={4}
                placeholder="Diagnostic radiologique, interpretation..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Recommandations</label>
              <textarea
                value={reportData.recommendations}
                onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
                disabled={!canEdit}
                rows={3}
                placeholder="Suite a donner, examens complementaires..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isStarted && (
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
            {canEdit && (
              <>
                <button
                  onClick={() => handleSaveReport(false)}
                  disabled={saving}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder brouillon
                </button>
                <button
                  onClick={() => {
                    if (!reportData.findings || !reportData.impression) {
                      setError('Veuillez remplir au minimum les Observations et la Conclusion.');
                      return;
                    }
                    handleSaveReport(true);
                  }}
                  disabled={saving}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Soumettre pour validation
                </button>
              </>
            )}

            {isCompleted && canValidate && (
              <button
                onClick={handleValidate}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Valider le rapport
              </button>
            )}

            <button
              onClick={() => navigate(`/staff/radiology/report-template/${examId}`)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-medium text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              Apercu du rapport
            </button>
          </div>
        )}

        {/* Validated indicator */}
        {isValidated && (
          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Rapport valide</p>
              <p className="text-sm text-emerald-600">Ce rapport a ete valide et ne peut plus etre modifie.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
