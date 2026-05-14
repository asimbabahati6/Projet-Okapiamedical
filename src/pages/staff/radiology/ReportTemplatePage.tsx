import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { downloadRadiologyReportPDF, RadiologyReportData } from '../../../utils/generateRadiologyReportPDF';

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

export default function ReportTemplatePage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(!!examId);

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

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Radiologique${exam ? ` - ${exam.patient.last_name}` : ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; }
          .report-container { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid #1e40af; }
          .logo-section { display: flex; align-items: center; gap: 12px; }
          .logo-section img { width: 60px; height: 60px; object-fit: contain; }
          .clinic-name { font-size: 22px; font-weight: 700; color: #1e40af; }
          .clinic-info { text-align: right; font-size: 11px; color: #555; line-height: 1.6; }
          .report-title { text-align: center; margin: 24px 0; }
          .report-title h2 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
          .report-title .subtitle { font-size: 14px; color: #1e40af; font-weight: 600; }
          .report-meta { display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .info-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; font-weight: 700; }
          .info-box p { font-size: 12px; color: #333; margin: 4px 0; }
          .info-box .label { font-weight: 600; }
          .intervenants { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-bottom: 24px; }
          .intervenants h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 700; }
          .intervenants p { font-size: 12px; color: #333; margin: 3px 0; }
          .section { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; }
          .section h3 { font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .section p { font-size: 12px; color: #333; line-height: 1.7; white-space: pre-wrap; }
          .section.conclusion p { font-weight: 600; }
          .signature-area { margin-top: 40px; display: flex; justify-content: flex-end; }
          .signature-block { text-align: center; min-width: 200px; }
          .signature-block p { font-size: 11px; color: #555; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 6px; }
          .validation-badge { margin-top: 16px; display: flex; align-items: center; gap: 6px; color: #166534; font-size: 11px; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; }
          .footer p { font-size: 9px; color: #999; margin: 3px 0; }
          .footer .confidential { font-style: italic; font-size: 10px; color: #666; margin-bottom: 6px; }
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

  return (
    <div className="p-8">
      {/* Navigation */}
      <button
        onClick={() => navigate('/staff/radiology')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 print:hidden"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au module Radiologie
      </button>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border border-gray-200 bg-gray-50 rounded-t-xl mb-0 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">
            {isBlankTemplate ? 'Modele de rapport radiologique' : 'Rapport radiologique'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          {!isBlankTemplate && (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-gray-100 p-8 rounded-b-xl print:bg-white print:p-0">
        <div ref={printRef} className="bg-white rounded-xl shadow-sm max-w-[800px] mx-auto p-10 print:shadow-none print:rounded-none">
          {/* Header - same as invoice */}
          <div className="flex justify-between items-start pb-5 border-b-[3px] border-blue-700 mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/Logo-Okapi-Medical.jpg"
                alt="OKAPIA Medical"
                className="w-14 h-14 object-contain"
              />
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

          {/* Report Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              RAPPORT D'IMAGERIE MEDICALE
            </h2>
            {exam && (
              <p className="text-sm font-semibold text-blue-700">
                {getExamTypeLabel(exam.exam_type)} - {exam.body_part}
              </p>
            )}
            {isBlankTemplate && (
              <p className="text-sm font-semibold text-blue-700">
                [Type d'examen] - [Region anatomique]
              </p>
            )}
          </div>

          {/* Report meta */}
          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <span>
              N Rapport: {exam ? `RAD-${examId?.slice(0, 8).toUpperCase()}` : '_______________'}
            </span>
            <span>Date: {today}</span>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Patient box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                Informations Patient
              </h4>
              {exam ? (
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Nom :</span> {exam.patient.last_name} {exam.patient.first_name}</p>
                  <p><span className="font-semibold">N Dossier :</span> {exam.patient.patient_number}</p>
                  <p><span className="font-semibold">Date de naissance :</span> {new Date(exam.patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-semibold">Sexe :</span> {exam.patient.gender === 'male' ? 'Masculin' : 'Feminin'}</p>
                </div>
              ) : (
                <div className="space-y-1 text-sm text-gray-400">
                  <p>Nom : ________________________________</p>
                  <p>N Dossier : __________________________</p>
                  <p>Date de naissance : ___________________</p>
                  <p>Sexe : _______________________________</p>
                </div>
              )}
            </div>

            {/* Exam details box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                Details Examen
              </h4>
              {exam ? (
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Type :</span> {getExamTypeLabel(exam.exam_type)} ({exam.modality})</p>
                  <p><span className="font-semibold">Region :</span> {exam.body_part}</p>
                  <p><span className="font-semibold">Urgence :</span> {getUrgencyLabel(exam.urgency_level)}</p>
                  <p><span className="font-semibold">Prescrit le :</span> {new Date(exam.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              ) : (
                <div className="space-y-1 text-sm text-gray-400">
                  <p>Type : _______________________________</p>
                  <p>Region : _____________________________</p>
                  <p>Urgence : ____________________________</p>
                  <p>Prescrit le : ________________________</p>
                </div>
              )}
            </div>
          </div>

          {/* Intervenants */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
              Intervenants
            </h4>
            {exam ? (
              <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
                <p><span className="font-semibold">Prescripteur :</span> Dr. {exam.prescriber.full_name}</p>
                {report?.performer && (
                  <p><span className="font-semibold">Realise par :</span> {report.performer.full_name}</p>
                )}
                {report?.validator && (
                  <p><span className="font-semibold">Valide par :</span> Dr. {report.validator.full_name}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-400">
                <p>Prescripteur : Dr. _____________________</p>
                <p>Realise par : _________________________</p>
              </div>
            )}
          </div>

          {/* Report Sections */}
          <div className="space-y-0">
            {/* Clinical Indication */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Indication Clinique
              </h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {exam?.clinical_info || (isBlankTemplate && (
                  <span className="text-gray-400 italic">
                    Motif de l'examen, symptomes, contexte clinique...
                  </span>
                ))}
              </p>
            </div>

            {/* Technique */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Technique
              </h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {report?.technique || (isBlankTemplate && (
                  <span className="text-gray-400 italic">
                    Protocole utilise, parametres techniques, produit de contraste...
                  </span>
                ))}
              </p>
            </div>

            {/* Observations */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Observations / Constatations
              </h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {report?.findings || (isBlankTemplate && (
                  <span className="text-gray-400 italic">
                    Description detaillee des observations radiologiques, structures anatomiques examinees, anomalies detectees...
                  </span>
                ))}
              </p>
            </div>

            {/* Conclusion */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Conclusion
              </h3>
              <p className="text-sm text-gray-900 font-semibold whitespace-pre-wrap leading-relaxed">
                {report?.impression || (isBlankTemplate && (
                  <span className="text-gray-400 italic font-normal">
                    Diagnostic radiologique, interpretation des resultats...
                  </span>
                ))}
              </p>
            </div>

            {/* Recommendations */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Recommandations
              </h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {report?.recommendations || (isBlankTemplate && (
                  <span className="text-gray-400 italic">
                    Conduite a tenir, examens complementaires, suivi...
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Signature Area */}
          <div className="mt-12 flex justify-end">
            <div className="text-center min-w-[200px]">
              <p className="text-sm text-gray-600 mb-10">Le Radiologue,</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-700">
                  {report?.performer?.full_name || '________________________'}
                </p>
              </div>
            </div>
          </div>

          {/* Validation badge */}
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

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-200 text-center">
            <p className="text-[10px] italic text-gray-500 mb-2">
              Ce rapport est un document medical confidentiel.
            </p>
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
