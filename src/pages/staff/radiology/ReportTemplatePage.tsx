import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, CheckCircle, FileText, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { downloadRadiologyReportPDF, RadiologyReportData } from '../../../utils/generateRadiologyReportPDF';

const STORAGE_KEY = 'okapia_radio_rapport';

interface ExamData {
  id: string;
  exam_type: string;
  modality: string;
  body_part: string;
  urgency_level: string;
  clinical_info: string;
  status: string;
  created_at: string;
  performed_at?: string;
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
}

interface ReportData {
  technique: string;
  findings: string;
  impression: string;
  recommendations: string;
  status: string;
  performed_at?: string;
  validated_at?: string;
  performer?: { full_name: string };
  validator?: { full_name: string };
}

interface FormFields {
  numRapport: string;
  dateRapport: string;
  patientNom: string;
  numDossier: string;
  dateNaissance: string;
  sexe: string;
  examType: string;
  region: string;
  urgence: string;
  prescritLe: string;
  prescripteur: string;
  realisePar: string;
  indicationClinique: string;
  technique: string;
  observations: string;
  conclusion: string;
  recommandations: string;
  signatureNom: string;
}

const defaultFields: FormFields = {
  numRapport: '',
  dateRapport: new Date().toISOString().split('T')[0],
  patientNom: '',
  numDossier: '',
  dateNaissance: '',
  sexe: '',
  examType: '',
  region: '',
  urgence: '',
  prescritLe: '',
  prescripteur: '',
  realisePar: '',
  indicationClinique: '',
  technique: '',
  observations: '',
  conclusion: '',
  recommandations: '',
  signatureNom: '',
};

function getExamTypeLabel(type: string): string {
  const types: Record<string, string> = {
    radiography: 'Radiographie',
    ct_scan: 'Scanner (CT)',
    mri: 'IRM',
    ultrasound: 'Echographie',
    mammography: 'Mammographie',
  };
  return types[type] || type;
}

function getUrgencyLabel(level: string): string {
  const labels: Record<string, string> = {
    routine: 'Routine',
    urgent: 'Urgent',
    emergency: 'Urgence',
  };
  return labels[level] || level;
}

function EditableDiv({
  value,
  onChange,
  placeholder,
  className = '',
  minHeight = '32px',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    const text = ref.current?.innerText || '';
    onChange(text);
  };

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      data-placeholder={placeholder}
      className={`outline-none cursor-text transition-colors duration-150
        hover:bg-blue-50 hover:rounded focus:bg-blue-100 focus:rounded focus:ring-2 focus:ring-[#1a5fa5]
        empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic empty:before:pointer-events-none
        ${className}`}
      style={{ minHeight }}
    />
  );
}

export default function ReportTemplatePage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(!!examId);
  const [fields, setFields] = useState<FormFields>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...defaultFields, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return { ...defaultFields };
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (examId) {
      fetchExamAndReport();
    }
  }, [examId]);

  const fetchExamAndReport = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('radiology_exams')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number, date_of_birth, gender),
          prescriber:user_profiles!radiology_exams_prescribed_by_fkey(full_name)
        `)
        .eq('id', examId)
        .maybeSingle();

      if (examError) throw examError;
      if (examData) {
        setExam(examData);

        const { data: reportData } = await supabase
          .from('radiology_reports')
          .select(`
            technique, findings, impression, recommendations, status, performed_at, validated_at,
            performer:user_profiles!radiology_reports_performed_by_fkey(full_name),
            validator:user_profiles!radiology_reports_validated_by_fkey(full_name)
          `)
          .eq('exam_id', examId)
          .maybeSingle();

        if (reportData) {
          setReport(reportData as unknown as ReportData);
        }
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const saveToLocalStorage = useCallback((data: FormFields) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }, []);

  const updateField = useCallback((key: keyof FormFields, value: string) => {
    setFields(prev => {
      const next = { ...prev, [key]: value };
      saveToLocalStorage(next);
      return next;
    });
  }, [saveToLocalStorage]);

  const handleSave = useCallback(() => {
    saveToLocalStorage(fields);
    showToast('Rapport sauvegarde dans le navigateur');
  }, [fields, saveToLocalStorage, showToast]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Reinitialiser tous les champs ?')) return;
    const fresh = { ...defaultFields, dateRapport: new Date().toISOString().split('T')[0] };
    setFields(fresh);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Formulaire reinitialise');
    window.location.reload();
  }, [showToast]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const patientName = exam ? exam.patient.last_name : fields.patientNom;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Radiologique${patientName ? ` - ${patientName}` : ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #1a1a1a; padding: 28px 32px; font-size: 12px; }
          .report-container { max-width: 780px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #1a5fa5; }
          .logo-section { display: flex; align-items: center; gap: 10px; }
          .logo-section img { width: 44px; height: 44px; object-fit: contain; }
          .clinic-name { font-size: 18px; font-weight: 700; color: #1a5fa5; }
          .clinic-sub { font-size: 10px; color: #555; }
          .clinic-info { text-align: right; font-size: 10px; color: #555; line-height: 1.65; }
          .title-zone { text-align: center; margin: 14px 0; }
          .main-title { font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
          .sub-title { font-size: 12px; color: #1a5fa5; margin-top: 4px; }
          .meta-row { display: flex; justify-content: space-between; font-size: 11px; color: #333; margin-bottom: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
          .info-box { border: 0.5px solid #c8d6e0; border-radius: 5px; overflow: hidden; }
          .info-box-head { background: #eaf2fb; padding: 5px 10px; font-size: 10px; font-weight: 700; color: #1a5fa5; letter-spacing: 0.05em; text-transform: uppercase; }
          .info-box-body { padding: 8px 10px; }
          .field-row { display: flex; align-items: baseline; gap: 4px; font-size: 11px; margin-bottom: 5px; }
          .field-label { color: #555; font-weight: normal; white-space: nowrap; }
          .field-val { font-weight: 500; }
          .interv-box { border: 0.5px solid #c8d6e0; border-radius: 5px; margin-bottom: 14px; overflow: hidden; }
          .interv-head { background: #eaf2fb; padding: 5px 10px; font-size: 10px; font-weight: 700; color: #1a5fa5; letter-spacing: 0.05em; text-transform: uppercase; }
          .interv-body { padding: 8px 14px; display: flex; gap: 32px; font-size: 11px; }
          .section { margin-bottom: 12px; }
          .sec-label { font-size: 10px; font-weight: 700; color: #1a5fa5; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 3px; }
          .sec-content { border-bottom: 1px solid #d0d7df; padding: 5px 6px; min-height: 24px; font-size: 11px; color: #333; line-height: 1.6; white-space: pre-wrap; }
          .sec-content.conclusion { font-weight: 600; }
          .sig-zone { text-align: right; margin-top: 18px; padding-top: 8px; }
          .sig-label { font-size: 11px; color: #333; margin-bottom: 28px; }
          .sig-line { border-top: 1px solid #333; width: 160px; margin-left: auto; margin-bottom: 2px; }
          .sig-sub { font-size: 9.5px; color: #666; text-align: center; width: 160px; margin-left: auto; }
          .sig-name { font-size: 11px; font-weight: 700; text-align: center; width: 160px; margin-left: auto; margin-top: 4px; }
          .footer-doc { border-top: 0.5px solid #c8d6e0; margin-top: 18px; padding-top: 8px; text-align: center; }
          .footer-doc p { font-size: 9px; color: #777; line-height: 1.6; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  const handleDownloadPdf = () => {
    const reportData = buildReportData();
    if (reportData) {
      downloadRadiologyReportPDF(reportData);
    }
  };

  const buildReportData = (): RadiologyReportData | null => {
    if (!exam) return null;

    return {
      reportNumber: examId ? `RAD-${examId.slice(0, 8).toUpperCase()}` : undefined,
      reportDate: new Date().toLocaleDateString('fr-FR'),
      patient: {
        firstName: exam.patient.first_name,
        lastName: exam.patient.last_name,
        patientNumber: exam.patient.patient_number,
        dateOfBirth: new Date(exam.patient.date_of_birth).toLocaleDateString('fr-FR'),
        gender: exam.patient.gender,
      },
      exam: {
        type: exam.exam_type,
        modality: exam.modality,
        bodyPart: exam.body_part,
        urgencyLevel: exam.urgency_level,
        prescribedDate: new Date(exam.created_at).toLocaleDateString('fr-FR'),
        performedDate: report?.performed_at
          ? new Date(report.performed_at).toLocaleDateString('fr-FR')
          : undefined,
      },
      prescriber: exam.prescriber.full_name,
      performer: report?.performer?.full_name,
      validator: report?.validator?.full_name,
      clinicalIndication: exam.clinical_info,
      technique: report?.technique || '',
      findings: report?.findings || '',
      conclusion: report?.impression || '',
      recommendations: report?.recommendations || '',
      status: report?.status || exam.status,
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  const isBlankTemplate = !examId || !exam;
  const today = new Date().toLocaleDateString('fr-FR');

  if (isBlankTemplate) {
    return <EditableTemplate
      fields={fields}
      updateField={updateField}
      handleSave={handleSave}
      handleReset={handleReset}
      handlePrint={handlePrint}
      printRef={printRef}
      toast={toast}
      navigate={navigate}
    />;
  }

  return <ReadOnlyReport
    exam={exam!}
    examId={examId!}
    report={report}
    today={today}
    printRef={printRef}
    handlePrint={handlePrint}
    handleDownloadPdf={handleDownloadPdf}
    navigate={navigate}
  />;
}

function EditableTemplate({
  fields,
  updateField,
  handleSave,
  handleReset,
  handlePrint,
  printRef,
  toast,
  navigate,
}: {
  fields: FormFields;
  updateField: (key: keyof FormFields, value: string) => void;
  handleSave: () => void;
  handleReset: () => void;
  handlePrint: () => void;
  printRef: React.RefObject<HTMLDivElement | null>;
  toast: string | null;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const selectClass = 'border-none border-b border-dashed border-gray-400 text-[11px] font-[Arial] bg-transparent text-gray-900 outline-none cursor-pointer py-[1px] px-[2px] focus:border-solid focus:border-[#1a5fa5] focus:bg-blue-50';

  const dateInputClass = 'border-0 border-b border-dashed border-gray-400 text-[11px] font-[Arial] text-gray-900 bg-transparent outline-none cursor-text focus:border-solid focus:border-[#1a5fa5] focus:bg-blue-50';

  return (
    <div className="p-8">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-report { box-shadow: none !important; border-radius: 0 !important; }
          [contenteditable]:hover, [contenteditable]:focus { background: transparent !important; box-shadow: none !important; }
        }
      `}</style>

      <button
        onClick={() => navigate('/staff/radiology')}
        className="flex items-center gap-2 text-[#1a5fa5] hover:text-blue-800 mb-6 no-print"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au module Radiologie
      </button>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-t-xl no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1a5fa5]" />
          <span className="text-sm font-semibold text-gray-700">Modele de rapport radiologique</span>
          <span className="bg-blue-100 text-[#1a5fa5] text-[10px] px-2 py-0.5 rounded-full font-semibold">Editable</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reinitialiser"
            className="flex items-center gap-1 px-2.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a5fa5] text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Report Body */}
      <div className="bg-gray-100 p-8 rounded-b-xl">
        <div ref={printRef} className="bg-white rounded-xl shadow-sm max-w-[780px] mx-auto px-8 py-7 print-report" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#1a1a1a' }}>

          {/* Header */}
          <div className="flex justify-between items-start mb-[18px] pb-[14px]" style={{ borderBottom: '2px solid #1a5fa5' }}>
            <div className="flex items-center gap-2.5">
              <img src="/Logo-Okapi-Medical.jpg" alt="OKAPIA Medical" className="w-11 h-11 object-contain" />
              <div>
                <div className="text-lg font-bold" style={{ color: '#1a5fa5', letterSpacing: '-0.3px' }}>OKAPIA Medical</div>
                <div className="text-[10px] text-gray-500">Centre d'Imagerie Medicale</div>
              </div>
            </div>
            <div className="text-right text-[10px] text-gray-500 leading-relaxed">
              <p>Chaussee Mzee Kabila n16.881</p>
              <p>Galerie Manfield, Kinshasa-Ngaliema</p>
              <p>Kinshasa, Republique Democratique du Congo</p>
              <p>Direction : +243 817 659 057</p>
              <p>Reception : +243 823 800 104</p>
              <p>Email : info@okapiahospital.com</p>
              <p>RCCM : CD/KIN/RCCM/25-B-00412</p>
            </div>
          </div>

          {/* Title Zone */}
          <div className="text-center my-3.5">
            <div className="text-[15px] font-bold tracking-wide">RAPPORT D'IMAGERIE MEDICALE</div>
            <div className="text-xs mt-1" style={{ color: '#1a5fa5' }}>
              [<EditableInline value={fields.examType || 'Type d\'examen'} onChange={v => updateField('examType', v)} />]
              {' '}&middot;{' '}
              [<EditableInline value={fields.region || 'Region anatomique'} onChange={v => updateField('region', v)} />]
            </div>
          </div>

          {/* Meta Row */}
          <div className="flex justify-between items-center mb-3 text-[11px] text-gray-700">
            <span className="flex items-center gap-1">
              <strong>N Rapport :</strong>
              <EditableInline value={fields.numRapport} onChange={v => updateField('numRapport', v)} placeholder="__________" />
            </span>
            <span className="flex items-center gap-1">
              <strong>Date :</strong>
              <input
                type="date"
                value={fields.dateRapport}
                onChange={e => updateField('dateRapport', e.target.value)}
                className={dateInputClass}
              />
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* Patient Box */}
            <div className="border border-gray-300 rounded overflow-hidden" style={{ borderWidth: '0.5px', borderColor: '#c8d6e0' }}>
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: '#eaf2fb', color: '#1a5fa5' }}>
                Informations Patient
              </div>
              <div className="p-2.5 space-y-1.5">
                <FieldRow label="Nom :">
                  <EditableInline value={fields.patientNom} onChange={v => updateField('patientNom', v)} />
                </FieldRow>
                <FieldRow label="N Dossier :">
                  <EditableInline value={fields.numDossier} onChange={v => updateField('numDossier', v)} />
                </FieldRow>
                <FieldRow label="Date de naissance :">
                  <input
                    type="date"
                    value={fields.dateNaissance}
                    onChange={e => updateField('dateNaissance', e.target.value)}
                    className={dateInputClass + ' flex-1'}
                  />
                </FieldRow>
                <FieldRow label="Sexe :">
                  <select
                    value={fields.sexe}
                    onChange={e => updateField('sexe', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">--</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Feminin">Feminin</option>
                  </select>
                </FieldRow>
              </div>
            </div>

            {/* Exam Details Box */}
            <div className="border border-gray-300 rounded overflow-hidden" style={{ borderWidth: '0.5px', borderColor: '#c8d6e0' }}>
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: '#eaf2fb', color: '#1a5fa5' }}>
                Details Examen
              </div>
              <div className="p-2.5 space-y-1.5">
                <FieldRow label="Type :">
                  <select
                    value={fields.examType}
                    onChange={e => updateField('examType', e.target.value)}
                    className={selectClass + ' flex-1'}
                  >
                    <option value="">-- Selectionner --</option>
                    <option value="Radiographie">Radiographie</option>
                    <option value="Echographie">Echographie</option>
                    <option value="Scanner (TDM)">Scanner (TDM)</option>
                    <option value="IRM">IRM</option>
                    <option value="Mammographie">Mammographie</option>
                    <option value="Osteodensitometrie">Osteodensitometrie</option>
                    <option value="Doppler">Doppler</option>
                  </select>
                </FieldRow>
                <FieldRow label="Region :">
                  <EditableInline value={fields.region} onChange={v => updateField('region', v)} />
                </FieldRow>
                <FieldRow label="Urgence :">
                  <select
                    value={fields.urgence}
                    onChange={e => updateField('urgence', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Non</option>
                    <option value="Oui — Urgent">Oui -- Urgent</option>
                    <option value="Semi-urgent">Semi-urgent</option>
                  </select>
                </FieldRow>
                <FieldRow label="Prescrit le :">
                  <input
                    type="date"
                    value={fields.prescritLe}
                    onChange={e => updateField('prescritLe', e.target.value)}
                    className={dateInputClass + ' flex-1'}
                  />
                </FieldRow>
              </div>
            </div>
          </div>

          {/* Intervenants */}
          <div className="border rounded overflow-hidden mb-3.5" style={{ borderWidth: '0.5px', borderColor: '#c8d6e0' }}>
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: '#eaf2fb', color: '#1a5fa5' }}>
              Intervenants
            </div>
            <div className="px-3.5 py-2 flex gap-8">
              <div className="flex items-baseline gap-1 text-[11px]">
                <span className="text-gray-500 whitespace-nowrap" style={{ color: '#1a5fa5' }}>Prescripteur :</span>
                <EditableInline value={fields.prescripteur} onChange={v => updateField('prescripteur', v)} />
              </div>
              <div className="flex items-baseline gap-1 text-[11px]">
                <span className="text-gray-500 whitespace-nowrap">Realise par :</span>
                <EditableInline value={fields.realisePar} onChange={v => updateField('realisePar', v)} />
              </div>
            </div>
          </div>

          {/* Report Sections */}
          <ReportSection label="Indication Clinique">
            <EditableDiv
              value={fields.indicationClinique}
              onChange={v => updateField('indicationClinique', v)}
              placeholder="Motif de l'examen, symptomes, contexte clinique..."
              className="border-b border-gray-300 px-1.5 py-1 text-[11px] text-gray-800 leading-relaxed"
            />
          </ReportSection>

          <ReportSection label="Technique">
            <EditableDiv
              value={fields.technique}
              onChange={v => updateField('technique', v)}
              placeholder="Protocole utilise, parametres techniques, produit de contraste..."
              className="border-b border-gray-300 px-1.5 py-1 text-[11px] text-gray-800 leading-relaxed"
            />
          </ReportSection>

          <ReportSection label="Observations / Constatations">
            <EditableDiv
              value={fields.observations}
              onChange={v => updateField('observations', v)}
              placeholder="Description detaillee des observations radiologiques, structures anatomiques examinees, anomalies detectees..."
              className="border-b border-gray-300 px-1.5 py-1 text-[11px] text-gray-800 leading-relaxed"
              minHeight="60px"
            />
          </ReportSection>

          <ReportSection label="Conclusion">
            <EditableDiv
              value={fields.conclusion}
              onChange={v => updateField('conclusion', v)}
              placeholder="Diagnostic radiologique, interpretation des resultats..."
              className="border-b border-gray-300 px-1.5 py-1 text-[11px] text-gray-800 leading-relaxed font-semibold"
              minHeight="44px"
            />
          </ReportSection>

          <ReportSection label="Recommandations">
            <EditableDiv
              value={fields.recommandations}
              onChange={v => updateField('recommandations', v)}
              placeholder="Conduite a tenir, examens complementaires, suivi..."
              className="border-b border-gray-300 px-1.5 py-1 text-[11px] text-gray-800 leading-relaxed"
            />
          </ReportSection>

          {/* Signature */}
          <div className="text-right mt-[18px] pt-2">
            <div className="text-[11px] text-gray-700 mb-7">Le Radiologue,</div>
            <div className="border-t border-gray-900 w-40 ml-auto mb-0.5" />
            <div className="text-[9.5px] text-gray-500 text-center w-40 ml-auto">Signature et cachet</div>
            <div className="text-[11px] font-bold text-center w-40 ml-auto mt-1">
              <EditableInline
                value={fields.signatureNom || 'Dr. ___________________'}
                onChange={v => updateField('signatureNom', v)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t mt-[18px] pt-2 text-center" style={{ borderColor: '#c8d6e0' }}>
            <p className="text-[9px] text-gray-500 leading-relaxed">
              Ce rapport est un document medical confidentiel<br />
              OKAPIA Medical - Chaussee Mzee Kabila n16.881, Kinshasa-Ngaliema - Tel : +243 817 659 057
            </p>
          </div>
        </div>
      </div>

      {/* Hint Bar */}
      <div className="no-print bg-blue-50 border-t border-blue-200 rounded-b-xl px-4 py-2 text-[11px] text-[#1a5fa5] flex items-center gap-1.5 -mt-3">
        <FileText className="w-3.5 h-3.5" />
        Cliquez sur n'importe quel champ pour le modifier - Les donnees sont sauvegardees localement dans votre navigateur
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-5 right-5 bg-[#1a5fa5] text-white px-4 py-2.5 rounded-lg text-sm z-50 transition-opacity duration-300 pointer-events-none ${toast ? 'opacity-100' : 'opacity-0'}`}
      >
        {toast}
      </div>
    </div>
  );
}

function EditableInline({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const handleBlur = () => {
    onChange(ref.current?.innerText || '');
  };

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, []);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className="inline-block min-w-[40px] border-b border-dashed border-gray-400 px-[3px] py-[1px] text-gray-900 outline-none cursor-text
        hover:bg-blue-50 focus:border-solid focus:border-[#1a5fa5] focus:bg-blue-50"
      data-placeholder={placeholder}
    />
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1 text-[11px]">
      <span className="text-gray-500 whitespace-nowrap shrink-0">{label}</span>
      {children}
    </div>
  );
}

function ReportSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#1a5fa5', letterSpacing: '0.06em' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyReport({
  exam,
  examId,
  report,
  today,
  printRef,
  handlePrint,
  handleDownloadPdf,
  navigate,
}: {
  exam: ExamData;
  examId: string;
  report: ReportData | null;
  today: string;
  printRef: React.RefObject<HTMLDivElement | null>;
  handlePrint: () => void;
  handleDownloadPdf: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/staff/radiology')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 print:hidden"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au module Radiologie
      </button>

      <div className="flex items-center justify-between px-6 py-3 border border-gray-200 bg-gray-50 rounded-t-xl mb-0 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">Rapport radiologique</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="bg-gray-100 p-8 rounded-b-xl print:bg-white print:p-0">
        <div ref={printRef} className="bg-white rounded-xl shadow-sm max-w-[800px] mx-auto p-10 print:shadow-none print:rounded-none">
          <div className="flex justify-between items-start pb-5 border-b-[3px] border-blue-700 mb-6">
            <div className="flex items-center gap-3">
              <img src="/Logo-Okapi-Medical.jpg" alt="OKAPIA Medical" className="w-14 h-14 object-contain" />
              <span className="text-2xl font-bold text-blue-700">OKAPIA Medical</span>
            </div>
            <div className="text-right text-xs text-gray-500 leading-relaxed">
              <p>Chaussee Mzee Kabila n16.881</p>
              <p>Galerie Manfield, Kinshasa-Ngaliema</p>
              <p>Kinshasa, Republique Democratique du Congo</p>
              <p>Direction : +243 817 659 057</p>
              <p>Reception : +243 823 800 104</p>
              <p>Email : info@okapiahospital.com</p>
              <p>RCCM : CD/KIN/RCCM/25-B-00412</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">RAPPORT D'IMAGERIE MEDICALE</h2>
            <p className="text-sm font-semibold text-blue-700">
              {getExamTypeLabel(exam.exam_type)} - {exam.body_part}
            </p>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <span>N Rapport: RAD-{examId.slice(0, 8).toUpperCase()}</span>
            <span>Date: {today}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Informations Patient</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Nom :</span> {exam.patient.last_name} {exam.patient.first_name}</p>
                <p><span className="font-semibold">N Dossier :</span> {exam.patient.patient_number}</p>
                <p><span className="font-semibold">Date de naissance :</span> {new Date(exam.patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                <p><span className="font-semibold">Sexe :</span> {exam.patient.gender === 'male' ? 'Masculin' : 'Feminin'}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">Details Examen</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Type :</span> {getExamTypeLabel(exam.exam_type)} ({exam.modality})</p>
                <p><span className="font-semibold">Region :</span> {exam.body_part}</p>
                <p><span className="font-semibold">Urgence :</span> {getUrgencyLabel(exam.urgency_level)}</p>
                <p><span className="font-semibold">Prescrit le :</span> {new Date(exam.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Intervenants</h4>
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
              <p><span className="font-semibold">Prescripteur :</span> Dr. {exam.prescriber.full_name}</p>
              {report?.performer && <p><span className="font-semibold">Realise par :</span> {report.performer.full_name}</p>}
              {report?.validator && <p><span className="font-semibold">Valide par :</span> Dr. {report.validator.full_name}</p>}
            </div>
          </div>

          <div className="space-y-0">
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Indication Clinique</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {exam.clinical_info || <span className="text-gray-400 italic">Aucune indication clinique</span>}
              </p>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Technique</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {report?.technique || <span className="text-gray-400 italic">Non renseigne</span>}
              </p>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Observations / Constatations</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {report?.findings || <span className="text-gray-400 italic">Non renseigne</span>}
              </p>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Conclusion</h3>
              <p className="text-sm text-gray-900 font-semibold whitespace-pre-wrap leading-relaxed">
                {report?.impression || <span className="text-gray-400 italic font-normal">Non renseigne</span>}
              </p>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Recommandations</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {report?.recommendations || <span className="text-gray-400 italic">Non renseigne</span>}
              </p>
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <div className="text-center min-w-[200px]">
              <p className="text-sm text-gray-600 mb-10">Le Radiologue,</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-700">{report?.performer?.full_name || '________________________'}</p>
              </div>
            </div>
          </div>

          {report?.status === 'validated' && report.validator && (
            <div className="mt-4 flex items-center gap-2 text-green-700 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              Rapport valide par Dr. {report.validator.full_name}
              {report.validated_at && (
                <span className="font-normal text-gray-500">
                  le {new Date(report.validated_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          )}

          <div className="mt-10 pt-4 border-t border-gray-200 text-center">
            <p className="text-[10px] italic text-gray-500 mb-2">Ce rapport est un document medical confidentiel.</p>
            <p className="text-[10px] text-gray-400">
              OKAPIA Medical - Chaussee Mzee Kabila n16.881, Kinshasa-Ngaliema - Tel. +243 817 659 057
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Genere le {today} a {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
