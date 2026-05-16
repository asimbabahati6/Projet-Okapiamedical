import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, CheckCircle, Download, Printer, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { downloadRadiologyReportPDF, type RadiologyReportData } from '../../../utils/generateRadiologyReportPDF';

const EDITOR_ROLES = ['doctor', 'medecin', 'radiologist', 'admin', 'medical_director', 'radio_chef', 'radio_tech', 'medecin_chef_staff'];

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
  const { profile } = useAuth();
  const canEdit = EDITOR_ROLES.includes(profile?.role?.name || '');

  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [clinicalInfo, setClinicalInfo] = useState('');
  const [technique, setTechnique] = useState('');
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [examType, setExamType] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [prescribedDate, setPrescribedDate] = useState('');
  const [prescriberName, setPrescriberName] = useState('');
  const [performerName, setPerformerName] = useState('');

  useEffect(() => {
    if (examId) fetchReport();
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
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setReport(data);
        setTechnique(data.technique || '');
        setFindings(data.findings || '');
        setImpression(data.impression || '');
        setRecommendations(data.recommendations || '');
        setClinicalInfo(data.exam?.clinical_info || '');
        setExamType(data.exam?.exam_type || '');
        setBodyPart(data.exam?.body_part || '');
        setUrgencyLevel(data.exam?.urgency_level || '');
        setPrescribedDate(data.exam?.created_at ? new Date(data.exam.created_at).toISOString().split('T')[0] : '');
        setPrescriberName(data.exam?.prescriber?.full_name || '');
        setPerformerName(data.performer?.full_name || '');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report || !canEdit) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const { error } = await supabase
        .from('radiology_reports')
        .update({
          technique,
          findings,
          impression,
          recommendations,
        })
        .eq('id', report.id);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    const patient = report.exam.patient;
    const pdfData: RadiologyReportData = {
      reportDate: new Date().toISOString().split('T')[0],
      patient: {
        firstName: patient.first_name,
        lastName: patient.last_name,
        patientNumber: patient.patient_number,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
      },
      exam: {
        type: examType,
        modality: report.exam.modality,
        bodyPart,
        urgencyLevel,
        prescribedDate: prescribedDate,
        performedDate: report.performed_at ? new Date(report.performed_at).toISOString().split('T')[0] : undefined,
      },
      prescriber: prescriberName,
      performer: performerName,
      validator: report.validator?.full_name,
      clinicalIndication: clinicalInfo,
      technique,
      findings,
      conclusion: impression,
      recommendations,
      status: report.status,
    };
    downloadRadiologyReportPDF(pdfData);
  };

  const handlePrint = () => window.print();

  const getExamTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      radiography: 'Radiographie',
      ct_scan: 'Scanner',
      mri: 'IRM',
      ultrasound: 'Echographie',
      mammography: 'Mammographie',
    };
    return types[type] || type;
  };

  const getUrgencyLabel = (level: string) => {
    const levels: Record<string, string> = {
      routine: 'Routine',
      urgent: 'Urgent',
      emergency: 'Urgence',
    };
    return levels[level] || level;
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
          Retour a la File d'Attente
        </button>
        <div className="text-center py-12">
          <p className="text-red-600">Rapport non trouve ou pas encore cree</p>
        </div>
      </div>
    );
  }

  const exam = report.exam;
  const patient = exam.patient;
  const inputClass = canEdit
    ? 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all'
    : 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-not-allowed';
  const textareaClass = canEdit
    ? 'w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none'
    : 'w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-not-allowed resize-none';

  return (
    <div className="p-8">
      <div className="print:hidden">
        <button
          onClick={() => navigate('/staff/radiology/queue')}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour a la File d'Attente
        </button>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg print:shadow-none">
        {/* Header */}
        <div className="print:hidden p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rapport Radiologique</h1>
              <p className="text-sm text-gray-600">
                {report.status === 'validated' ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Valide
                  </span>
                ) : (
                  'En attente de validation'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Generer PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Save success banner */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            Rapport sauvegarde avec succes
          </div>
        )}

        {!canEdit && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            Mode lecture seule. Vous n'avez pas les droits pour modifier ce rapport.
          </div>
        )}

        <div className="p-8 print:p-8 space-y-8">
          {/* Patient info (read-only always) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">Informations Patient</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-600">Nom :</span> {patient.first_name} {patient.last_name}</p>
                <p><span className="font-medium text-gray-600">N. Patient :</span> {patient.patient_number}</p>
                <p><span className="font-medium text-gray-600">Date de naissance :</span> {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                <p><span className="font-medium text-gray-600">Sexe :</span> {patient.gender === 'male' ? 'Masculin' : 'Feminin'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">Details de l'examen</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type d'examen</label>
                  {canEdit ? (
                    <select value={examType} onChange={(e) => setExamType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                      <option value="radiography">Radiographie</option>
                      <option value="ct_scan">Scanner</option>
                      <option value="mri">IRM</option>
                      <option value="ultrasound">Echographie</option>
                      <option value="mammography">Mammographie</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-800">{getExamTypeLabel(examType)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Region anatomique</label>
                  <input type="text" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}
                    disabled={!canEdit} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Urgence</label>
                  {canEdit ? (
                    <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Urgence</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-800">{getUrgencyLabel(urgencyLevel)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prescription and Personnel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prescrit le</label>
              <input type="date" value={prescribedDate} onChange={(e) => setPrescribedDate(e.target.value)}
                disabled={!canEdit} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prescripteur</label>
              <input type="text" value={prescriberName} onChange={(e) => setPrescriberName(e.target.value)}
                disabled={!canEdit} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Realise par</label>
              <input type="text" value={performerName} onChange={(e) => setPerformerName(e.target.value)}
                disabled={!canEdit} className={inputClass} />
            </div>
          </div>

          {/* Clinical indication */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Indication clinique</label>
            <textarea value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)}
              disabled={!canEdit} rows={3} className={textareaClass}
              placeholder="Renseignements cliniques et indication de l'examen..." />
          </div>

          {/* Technique */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Technique</label>
            <textarea value={technique} onChange={(e) => setTechnique(e.target.value)}
              disabled={!canEdit} rows={3} className={textareaClass}
              placeholder="Protocole et technique d'acquisition..." />
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Observations / Constatations</label>
            <textarea value={findings} onChange={(e) => setFindings(e.target.value)}
              disabled={!canEdit} rows={6} className={textareaClass}
              placeholder="Description detaillee des constatations radiologiques..." />
          </div>

          {/* Conclusion */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Conclusion</label>
            <textarea value={impression} onChange={(e) => setImpression(e.target.value)}
              disabled={!canEdit} rows={4} className={textareaClass}
              placeholder="Conclusion diagnostique..." />
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Recommandations</label>
            <textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)}
              disabled={!canEdit} rows={3} className={textareaClass}
              placeholder="Recommandations et suivi suggere..." />
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>Document genere le {new Date().toLocaleDateString('fr-FR')} a {new Date().toLocaleTimeString('fr-FR')}</p>
            {report.status === 'validated' && report.validator && (
              <p className="mt-2 flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                Rapport valide par Dr. {report.validator.full_name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
