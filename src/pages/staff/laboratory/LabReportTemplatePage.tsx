import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, CheckCircle, FlaskConical, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { logActivity } from '../../../utils/activityLogger';
import { downloadLabReportPDF, type LabReportData, type LabReportParameter } from '../../../utils/generateLabReportPDF';

const EDITABLE_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'doctor', 'medecin', 'biologist', 'biologiste', 'directeur_general'];
const VALIDATE_ROLES = ['admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general'];

interface ReportForm {
  id: string | null;
  order_number: string;
  report_date: string;
  patient_name: string;
  patient_number: string;
  patient_dob: string;
  patient_gender: string;
  patient_id: string | null;
  analysis_name: string;
  specimen_type: string;
  priority: string;
  requested_date: string;
  prescriber: string;
  biologist: string;
  parameters: LabReportParameter[];
  interpretation: string;
  status: string;
  lab_order_id: string | null;
}

function emptyForm(): ReportForm {
  return {
    id: null,
    order_number: '',
    report_date: new Date().toISOString().split('T')[0],
    patient_name: '',
    patient_number: '',
    patient_dob: '',
    patient_gender: '',
    patient_id: null,
    analysis_name: '',
    specimen_type: '',
    priority: 'normal',
    requested_date: new Date().toISOString().split('T')[0],
    prescriber: '',
    biologist: '',
    parameters: [],
    interpretation: '',
    status: 'brouillon',
    lab_order_id: null,
  };
}

export default function LabReportTemplatePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const reportIdParam = searchParams.get('reportId');
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const userRole = profile?.role?.name || '';

  const canEdit = EDITABLE_ROLES.includes(userRole);
  const canValidate = VALIDATE_ROLES.includes(userRole);

  const [form, setForm] = useState<ReportForm>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateField = useCallback((field: keyof ReportForm, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, [orderId, patientIdParam, reportIdParam]);

  async function loadInitialData() {
    setLoading(true);
    try {
      // If reportId is provided, load existing report
      if (reportIdParam) {
        const { data, error } = await supabase
          .from('lab_reports')
          .select('*')
          .eq('id', reportIdParam)
          .maybeSingle();
        if (!error && data) {
          setForm({
            id: data.id,
            order_number: data.order_number,
            report_date: data.report_date,
            patient_name: data.patient_name,
            patient_number: data.patient_number,
            patient_dob: data.patient_dob,
            patient_gender: data.patient_gender,
            patient_id: data.patient_id,
            analysis_name: data.analysis_name,
            specimen_type: data.specimen_type,
            priority: data.priority,
            requested_date: data.requested_date,
            prescriber: data.prescriber,
            biologist: data.biologist,
            parameters: (data.parameters as LabReportParameter[]) || [],
            interpretation: data.interpretation,
            status: data.status,
            lab_order_id: data.lab_order_id,
          });
          setLoading(false);
          return;
        }
      }

      // If orderId is provided, load from lab_orders
      if (orderId) {
        const { data, error } = await supabase
          .from('lab_orders')
          .select(`
            *,
            patient:patients(id, first_name, last_name, patient_number, date_of_birth, gender),
            test:lab_tests!lab_orders_test_id_fkey(test_name, test_code, category, specimen_type, normal_range, unit),
            prescriber:user_profiles!lab_orders_doctor_id_fkey(full_name),
            performer:user_profiles!lab_orders_performed_by_fkey(full_name)
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (!error && data) {
          const patient = data.patient as { id: string; first_name: string; last_name: string; patient_number: string; date_of_birth: string; gender: string } | null;
          const test = data.test as { test_name: string; specimen_type: string; normal_range: string; unit: string } | null;
          const prescriber = data.prescriber as { full_name: string } | null;
          const performer = data.performer as { full_name: string } | null;

          let params: LabReportParameter[] = [];
          if (data.result_value) {
            try {
              const parsed = typeof data.result_value === 'string' ? JSON.parse(data.result_value) : data.result_value;
              if (parsed.parameters) {
                params = parsed.parameters.map((p: Record<string, string | boolean>) => ({
                  name: p.name || p.parameter || '',
                  value: p.value || '',
                  unit: p.unit || '',
                  reference: p.reference || p.reference_range || '',
                  isAbnormal: !!p.isAbnormal,
                }));
              }
            } catch {
              if (test) {
                params = [{
                  name: test.test_name,
                  value: data.result_value as string,
                  unit: test.unit || '',
                  reference: test.normal_range || '',
                  isAbnormal: data.is_abnormal || false,
                }];
              }
            }
          }

          setForm({
            id: null,
            order_number: data.order_number,
            report_date: new Date().toISOString().split('T')[0],
            patient_name: patient ? `${patient.last_name} ${patient.first_name}` : '',
            patient_number: patient?.patient_number || '',
            patient_dob: patient?.date_of_birth || '',
            patient_gender: patient?.gender || '',
            patient_id: patient?.id || null,
            analysis_name: test?.test_name || '',
            specimen_type: test?.specimen_type || '',
            priority: data.priority || 'normal',
            requested_date: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : '',
            prescriber: prescriber?.full_name || '',
            biologist: performer?.full_name || '',
            parameters: params,
            interpretation: '',
            status: 'brouillon',
            lab_order_id: orderId,
          });
        }
      }

      // If patientId is provided, auto-fill patient info
      if (patientIdParam && !orderId) {
        const { data } = await supabase
          .from('patients')
          .select('id, first_name, last_name, patient_number, date_of_birth, gender')
          .eq('id', patientIdParam)
          .maybeSingle();
        if (data) {
          setForm(prev => ({
            ...prev,
            patient_name: `${data.last_name} ${data.first_name}`,
            patient_number: data.patient_number,
            patient_dob: data.date_of_birth || '',
            patient_gender: data.gender || '',
            patient_id: data.id,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Auto-save debounce
  useEffect(() => {
    if (!canEdit || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (form.order_number || form.patient_name || form.parameters.length > 0) {
        handleSave(true);
      }
    }, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form]);

  async function handleSave(isAuto = false) {
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload = {
        order_number: form.order_number,
        report_date: form.report_date,
        patient_name: form.patient_name,
        patient_number: form.patient_number,
        patient_dob: form.patient_dob,
        patient_gender: form.patient_gender,
        patient_id: form.patient_id,
        analysis_name: form.analysis_name,
        specimen_type: form.specimen_type,
        priority: form.priority,
        requested_date: form.requested_date,
        prescriber: form.prescriber,
        biologist: form.biologist,
        parameters: form.parameters,
        interpretation: form.interpretation,
        status: form.status,
        lab_order_id: form.lab_order_id,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { error } = await supabase.from('lab_reports').update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('lab_reports')
          .insert({ ...payload, created_by: profile?.id })
          .select('id')
          .single();
        if (error) throw error;
        setForm(prev => ({ ...prev, id: data.id }));
      }

      if (!isAuto) {
        logActivity('create', 'laboratory', `Rapport labo sauvegarde: ${form.order_number || 'nouveau'}`);
      }
      setSaveMessage(isAuto ? 'Sauvegarde automatique' : 'Sauvegarde reussie');
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (err) {
      console.error('Error saving report:', err);
      setSaveMessage('Erreur de sauvegarde');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  function addParameterRow() {
    setForm(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', value: '', unit: '', reference: '', isAbnormal: false }],
    }));
  }

  function removeParameterRow(idx: number) {
    setForm(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== idx),
    }));
  }

  function updateParameter(idx: number, field: keyof LabReportParameter, value: string | boolean) {
    setForm(prev => ({
      ...prev,
      parameters: prev.parameters.map((p, i) => i === idx ? { ...p, [field]: value } : p),
    }));
  }

  function handleDownloadPdf() {
    const reportData = buildReportData();
    if (reportData) {
      downloadLabReportPDF(reportData);
      logActivity('generate', 'laboratory', `Rapport labo PDF genere: ${form.order_number}`);
    }
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;

    logActivity('print', 'laboratory', `Rapport labo imprime: ${form.order_number}`);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Rapport Laboratoire - ${form.order_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1a1a1a;padding:40px}
.report-container{max-width:800px;margin:0 auto}
input,textarea,select{border:none;background:transparent;font:inherit;color:inherit;outline:none}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid #1e40af}
.logo-section{display:flex;align-items:center;gap:12px}
.logo-section img{width:60px;height:60px;object-fit:contain}
.clinic-name{font-size:22px;font-weight:700;color:#1e40af}
.clinic-info{text-align:right;font-size:11px;color:#555;line-height:1.6}
.report-title{text-align:center;margin:24px 0}
.report-title h2{font-size:20px;font-weight:700;color:#1a1a1a;margin-bottom:6px}
.report-title .subtitle{font-size:14px;color:#1e40af;font-weight:600}
.report-meta{display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:20px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px}
.info-box h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;font-weight:700}
.info-box p{font-size:12px;color:#333;margin:4px 0}
.info-box .label{font-weight:600}
.intervenants{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:24px}
.intervenants h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:8px;font-weight:700}
.intervenants p{font-size:12px;color:#333;margin:3px 0}
.section{border-top:1px solid #e5e7eb;padding-top:16px;margin-top:16px}
.section h3{font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
thead{background:#1e40af}
thead th{padding:10px 12px;text-align:left;color:white;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
tbody tr{border-bottom:1px solid #e5e7eb}
tbody tr:nth-child(even){background:#f8fafc}
tbody td{padding:10px 12px;font-size:11px}
.value-abnormal{color:#dc2626;font-weight:700}
.status-normal{background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
.status-abnormal{background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
.interpretation{margin-top:16px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px}
.interpretation h3{font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;margin-bottom:8px}
.interpretation p{font-size:12px;color:#333;line-height:1.7;white-space:pre-wrap}
.signature-area{margin-top:40px;display:flex;justify-content:flex-end}
.signature-block{text-align:center;min-width:200px}
.signature-block p{font-size:11px;color:#555}
.signature-line{border-top:1px solid #333;margin-top:40px;padding-top:6px}
.footer{margin-top:40px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center}
.footer p{font-size:9px;color:#999;margin:3px 0}
@media print{body{padding:20px}input,textarea,select{border:none!important;background:transparent!important}}
</style></head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  }

  function buildReportData(): LabReportData | null {
    return {
      orderNumber: form.order_number,
      reportDate: form.report_date ? new Date(form.report_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      patient: {
        firstName: form.patient_name.split(' ').slice(1).join(' '),
        lastName: form.patient_name.split(' ')[0] || '',
        patientNumber: form.patient_number,
        dateOfBirth: form.patient_dob ? new Date(form.patient_dob).toLocaleDateString('fr-FR') : '',
        gender: form.patient_gender,
      },
      analysis: {
        testName: form.analysis_name,
        testCode: '',
        category: '',
        specimenType: form.specimen_type,
        priority: form.priority,
        requestedDate: form.requested_date ? new Date(form.requested_date).toLocaleDateString('fr-FR') : '',
      },
      prescriber: form.prescriber,
      performer: form.biologist,
      parameters: form.parameters,
      interpretation: form.interpretation,
      status: form.status,
    };
  }

  // Shared input style for editable/readonly mode
  const inputClass = canEdit
    ? 'border-b border-dashed border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none px-1 print:border-none'
    : 'bg-transparent border-none outline-none cursor-default';

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600 mt-4">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <div className="p-8">
      {/* Navigation */}
      <button
        onClick={() => navigate('/staff/laboratory')}
        className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 print:hidden"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au Laboratoire
      </button>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border border-gray-200 bg-gray-50 rounded-t-xl mb-0 print:hidden">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-green-600" />
          <h2 className="text-sm font-semibold text-gray-700">
            Rapport d'analyses medicales
          </h2>
          {saveMessage && (
            <span className="text-xs text-green-600 font-medium ml-2">{saveMessage}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Status selector */}
          {canEdit && (
            <select
              value={form.status}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'valide' && !canValidate) return;
                updateField('status', val);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="brouillon">Brouillon</option>
              <option value="valide" disabled={!canValidate}>Valide</option>
              <option value="envoye">Envoye</option>
            </select>
          )}

          {canEdit && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Sauvegarder
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Generer PDF
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-gray-100 p-8 rounded-b-xl print:bg-white print:p-0">
        <div ref={printRef} className="bg-white rounded-xl shadow-sm max-w-[800px] mx-auto p-10 print:shadow-none print:rounded-none">
          {/* Header */}
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
              RAPPORT D'ANALYSES MEDICALES
            </h2>
            <p className="text-sm font-semibold text-blue-700">
              <input
                type="text"
                value={form.analysis_name}
                onChange={(e) => updateField('analysis_name', e.target.value)}
                readOnly={!canEdit}
                placeholder="[Type d'analyse]"
                className={`text-center ${inputClass} w-64`}
              />
            </p>
          </div>

          {/* Report meta */}
          <div className="flex justify-between text-xs text-gray-500 mb-6">
            <span className="flex items-center gap-1">
              N Ordre:{' '}
              <input
                type="text"
                value={form.order_number}
                onChange={(e) => updateField('order_number', e.target.value)}
                readOnly={!canEdit}
                placeholder="_______________"
                className={`${inputClass} w-32`}
              />
            </span>
            <span className="flex items-center gap-1">
              Date:{' '}
              <input
                type="date"
                value={form.report_date}
                onChange={(e) => updateField('report_date', e.target.value)}
                readOnly={!canEdit}
                className={`${inputClass} w-36`}
              />
            </span>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Patient box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                Informations Patient
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Nom :</span>{' '}
                  <input
                    type="text"
                    value={form.patient_name}
                    onChange={(e) => updateField('patient_name', e.target.value)}
                    readOnly={!canEdit}
                    placeholder="________________________________"
                    className={`${inputClass} w-44`}
                  />
                </p>
                <p><span className="font-semibold">N Dossier :</span>{' '}
                  <input
                    type="text"
                    value={form.patient_number}
                    onChange={(e) => updateField('patient_number', e.target.value)}
                    readOnly={!canEdit}
                    placeholder="__________________________"
                    className={`${inputClass} w-36`}
                  />
                </p>
                <p><span className="font-semibold">Date de naissance :</span>{' '}
                  <input
                    type="date"
                    value={form.patient_dob}
                    onChange={(e) => updateField('patient_dob', e.target.value)}
                    readOnly={!canEdit}
                    className={`${inputClass} w-36`}
                  />
                </p>
                <p><span className="font-semibold">Sexe :</span>{' '}
                  <select
                    value={form.patient_gender}
                    onChange={(e) => updateField('patient_gender', e.target.value)}
                    disabled={!canEdit}
                    className={`${inputClass} w-28`}
                  >
                    <option value="">---</option>
                    <option value="male">Masculin</option>
                    <option value="female">Feminin</option>
                  </select>
                </p>
              </div>
            </div>

            {/* Analysis details box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                Details Analyse
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Analyse :</span>{' '}
                  <input
                    type="text"
                    value={form.analysis_name}
                    onChange={(e) => updateField('analysis_name', e.target.value)}
                    readOnly={!canEdit}
                    placeholder="____________________________"
                    className={`${inputClass} w-36`}
                  />
                </p>
                <p><span className="font-semibold">Echantillon :</span>{' '}
                  <input
                    type="text"
                    value={form.specimen_type}
                    onChange={(e) => updateField('specimen_type', e.target.value)}
                    readOnly={!canEdit}
                    placeholder="________________________"
                    className={`${inputClass} w-32`}
                  />
                </p>
                <p><span className="font-semibold">Priorite :</span>{' '}
                  <select
                    value={form.priority}
                    onChange={(e) => updateField('priority', e.target.value)}
                    disabled={!canEdit}
                    className={`${inputClass} w-28`}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT (Immediat)</option>
                  </select>
                </p>
                <p><span className="font-semibold">Demande le :</span>{' '}
                  <input
                    type="date"
                    value={form.requested_date}
                    onChange={(e) => updateField('requested_date', e.target.value)}
                    readOnly={!canEdit}
                    className={`${inputClass} w-36`}
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Intervenants */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
              Intervenants
            </h4>
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
              <p><span className="font-semibold">Prescripteur :</span> Dr.{' '}
                <input
                  type="text"
                  value={form.prescriber}
                  onChange={(e) => updateField('prescriber', e.target.value)}
                  readOnly={!canEdit}
                  placeholder="_____________________"
                  className={`${inputClass} w-40`}
                />
              </p>
              <p><span className="font-semibold">Biologiste :</span>{' '}
                <input
                  type="text"
                  value={form.biologist}
                  onChange={(e) => updateField('biologist', e.target.value)}
                  readOnly={!canEdit}
                  placeholder="__________________________"
                  className={`${inputClass} w-40`}
                />
              </p>
            </div>
          </div>

          {/* Results Table */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                Resultats
              </h3>
              {canEdit && (
                <button
                  onClick={addParameterRow}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium print:hidden"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une ligne
                </button>
              )}
            </div>

            <table className="w-full mb-4">
              <thead>
                <tr className="bg-blue-700 text-white text-[10px] uppercase tracking-wide">
                  <th className="py-2.5 px-3 text-left">Parametre</th>
                  <th className="py-2.5 px-3 text-center w-24">Valeur</th>
                  <th className="py-2.5 px-3 text-center w-20">Unite</th>
                  <th className="py-2.5 px-3 text-center w-28">Reference</th>
                  <th className="py-2.5 px-3 text-center w-20">Statut</th>
                  {canEdit && <th className="py-2.5 px-3 text-center w-10 print:hidden"></th>}
                </tr>
              </thead>
              <tbody>
                {form.parameters.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="py-6 text-center text-gray-400 text-sm">
                      Aucun resultat. {canEdit && 'Cliquez "Ajouter une ligne" pour commencer.'}
                    </td>
                  </tr>
                ) : (
                  form.parameters.map((param, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => updateParameter(idx, 'name', e.target.value)}
                          readOnly={!canEdit}
                          placeholder="Parametre"
                          className={`text-sm font-medium text-gray-800 w-full ${inputClass}`}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => updateParameter(idx, 'value', e.target.value)}
                          readOnly={!canEdit}
                          placeholder="---"
                          className={`text-sm font-semibold text-center w-full ${param.isAbnormal ? 'text-red-600' : 'text-gray-900'} ${inputClass}`}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          value={param.unit}
                          onChange={(e) => updateParameter(idx, 'unit', e.target.value)}
                          readOnly={!canEdit}
                          placeholder="unite"
                          className={`text-sm text-gray-600 text-center w-full ${inputClass}`}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          value={param.reference}
                          onChange={(e) => updateParameter(idx, 'reference', e.target.value)}
                          readOnly={!canEdit}
                          placeholder="ref"
                          className={`text-sm text-gray-500 text-center w-full ${inputClass}`}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {canEdit ? (
                          <label className="inline-flex items-center gap-1 cursor-pointer print:hidden">
                            <input
                              type="checkbox"
                              checked={param.isAbnormal}
                              onChange={(e) => updateParameter(idx, 'isAbnormal', e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-[10px] text-gray-500">Anormal</span>
                          </label>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            param.isAbnormal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {param.isAbnormal ? 'ANORMAL' : 'Normal'}
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-2 px-1 text-center print:hidden">
                          <button
                            onClick={() => removeParameterRow(idx)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Interpretation */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
              Interpretation du Biologiste
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[60px]">
              {canEdit ? (
                <textarea
                  value={form.interpretation}
                  onChange={(e) => updateField('interpretation', e.target.value)}
                  placeholder="Commentaires et interpretation des resultats par le biologiste..."
                  rows={4}
                  className="w-full bg-transparent text-sm text-gray-800 leading-relaxed resize-none focus:outline-none print:resize-none"
                />
              ) : (
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {form.interpretation || <span className="text-gray-400 italic">Aucune interpretation saisie.</span>}
                </p>
              )}
            </div>
          </div>

          {/* Signature Area */}
          <div className="mt-12 flex justify-end">
            <div className="text-center min-w-[200px]">
              <p className="text-sm text-gray-600 mb-10">Le Biologiste,</p>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-700">
                  {form.biologist || '________________________'}
                </p>
              </div>
            </div>
          </div>

          {/* Validation badge */}
          {form.status === 'valide' && (
            <div className="mt-4 flex items-center gap-2 text-green-700 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              Rapport valide
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-200 text-center">
            <p className="text-[10px] italic text-gray-500 mb-2">
              Ce rapport est un document medical confidentiel. Les resultats doivent etre interpretes par un medecin.
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
