import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Printer, Download, FileText, Plus, X,
  Heart, Thermometer, Weight, Activity, User, Calendar
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { downloadMedicalReportPDF, type MedicalReportData } from '../../../utils/generateMedicalReportPDF';

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
  date_of_birth: string;
  gender: string;
}

export default function MedicalReportPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(!!consultationId);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
// ✅ Restriction : seul le médecin peut accéder au rapport médical
useEffect(() => {
  if (profile && profile.role !== 'doctor' && profile.role !== 'medecin' && profile.role !== 'admin' && profile.role !== 'medical_director') {
    navigate('/staff/dashboard');
  }
}, [profile, navigate]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [consultationNumber, setConsultationNumber] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [consultationType, setConsultationType] = useState('Consultation generale');
  const [complaints, setComplaints] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [illnessHistory, setIllnessHistory] = useState('');
  const [additionalAnamnesis, setAdditionalAnamnesis] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [paraclinicalExams, setParaclinicalExams] = useState<string[]>([]);
  const [newExam, setNewExam] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(id, first_name, last_name, patient_number, date_of_birth, gender)
        `)
        .eq('id', consultationId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const patient = data.patient as PatientOption | null;
        if (patient) {
          setSelectedPatient(patient);
          setPatientSearch(`${patient.last_name} ${patient.first_name}`);
        }

        setConsultationNumber(data.consultation_number || '');
        setReportDate(
          data.consultation_date
            ? new Date(data.consultation_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
        setConsultationType(data.consultation_type || 'Consultation generale');
        setComplaints(data.nurse_complaints || data.chief_complaint || '');
        setMedicalHistory(data.medical_history || '');
        setIllnessHistory(data.illness_history || data.history_of_present_illness || '');
        setAdditionalAnamnesis(data.additional_anamnesis || '');
        setPhysicalExamination(data.physical_examination || '');
        setDiagnosis(data.diagnosis || '');
        setTreatmentPlan(data.treatment_plan || '');
        setNotes(data.notes || '');

        if (data.follow_up_date) {
          setFollowUpDate(data.follow_up_date);
        }

        if (data.vital_signs) {
          const vs = typeof data.vital_signs === 'string' ? JSON.parse(data.vital_signs) : data.vital_signs;
          setBpSystolic(vs.blood_pressure_systolic || vs.systolic || '');
          setBpDiastolic(vs.blood_pressure_diastolic || vs.diastolic || '');
          setHeartRate(vs.heart_rate || vs.heartRate || '');
          setTemperature(vs.temperature || '');
          setWeight(vs.weight || '');
          setOxygenSaturation(vs.oxygen_saturation || vs.oxygenSaturation || '');
        }

        if (data.paraclinical_exams) {
          const exams = typeof data.paraclinical_exams === 'string'
            ? JSON.parse(data.paraclinical_exams)
            : data.paraclinical_exams;
          if (Array.isArray(exams)) {
            setParaclinicalExams(exams.map((e: string | { name?: string }) => typeof e === 'string' ? e : (e.name || String(e))));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching consultation:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (term: string) => {
    setPatientSearch(term);
    if (term.length < 2) {
      setPatients([]);
      setShowPatientDropdown(false);
      return;
    }
    const { data } = await supabase
      .from('patients')
      .select('id, first_name, last_name, patient_number, date_of_birth, gender')
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,patient_number.ilike.%${term}%`)
      .limit(8);

    if (data) {
      setPatients(data);
      setShowPatientDropdown(true);
    }
  };

  const selectPatient = (p: PatientOption) => {
    setSelectedPatient(p);
    setPatientSearch(`${p.last_name} ${p.first_name}`);
    setShowPatientDropdown(false);
  };

  const addExam = () => {
    if (!newExam.trim()) return;
    setParaclinicalExams([...paraclinicalExams, newExam.trim()]);
    setNewExam('');
  };

  const removeExam = (idx: number) => {
    setParaclinicalExams(paraclinicalExams.filter((_, i) => i !== idx));
  };

  const buildReportData = (): MedicalReportData | null => {
    if (!selectedPatient) return null;
    return {
      consultationNumber,
      reportDate: new Date(reportDate).toLocaleDateString('fr-FR'),
      consultationType,
      patient: {
        firstName: selectedPatient.first_name,
        lastName: selectedPatient.last_name,
        patientNumber: selectedPatient.patient_number,
        dateOfBirth: selectedPatient.date_of_birth
          ? new Date(selectedPatient.date_of_birth).toLocaleDateString('fr-FR')
          : '',
        gender: selectedPatient.gender,
      },
      doctor: profile?.full_name || 'Non specifie',
      complaints,
      vitalSigns: {
        bloodPressureSystolic: bpSystolic,
        bloodPressureDiastolic: bpDiastolic,
        heartRate,
        temperature,
        weight,
        oxygenSaturation,
      },
      medicalHistory,
      illnessHistory,
      additionalAnamnesis,
      physicalExamination,
      diagnosis,
      paraclinicalExams,
      treatmentPlan,
      followUpDate: followUpDate ? new Date(followUpDate).toLocaleDateString('fr-FR') : undefined,
      notes: notes || undefined,
    };
  };

  const handleDownloadPdf = () => {
    const data = buildReportData();
    if (data) downloadMedicalReportPDF(data);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Rapport Medical${selectedPatient ? ` - ${selectedPatient.last_name}` : ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1a1a1a;padding:40px}
.report{max-width:800px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #1e40af;margin-bottom:24px}
.logo-area{display:flex;align-items:center;gap:12px}
.logo-area img{width:56px;height:56px;object-fit:contain}
.clinic-name{font-size:20px;font-weight:700;color:#1e40af}
.clinic-info{text-align:right;font-size:10px;color:#666;line-height:1.6}
.title{text-align:center;margin:20px 0}
.title h2{font-size:18px;font-weight:700}
.title .subtitle{font-size:13px;color:#1e40af;font-weight:600;margin-top:4px}
.meta{display:flex;justify-content:space-between;font-size:10px;color:#888;margin-bottom:16px}
.boxes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px}
.box h4{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px;font-weight:700}
.box p{font-size:11px;margin:3px 0;color:#333}
.lbl{font-weight:600}
.section{border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px}
.section h3{font-size:10px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.section p,.section li{font-size:11px;color:#333;line-height:1.6}
.section ul{padding-left:16px}
.section li{margin:3px 0}
.vitals-table{width:100%;border-collapse:collapse;margin:8px 0 16px}
.vitals-table th{background:#1e40af;color:white;padding:6px 10px;font-size:9px;text-transform:uppercase;text-align:left}
.vitals-table td{padding:6px 10px;font-size:11px;border-bottom:1px solid #e5e7eb}
.vitals-table tr:nth-child(even){background:#f8fafc}
.signature{margin-top:40px;text-align:right;padding-right:20px}
.signature p{font-size:11px;color:#555}
.signature .line{border-top:1px solid #333;width:180px;margin:30px 0 4px auto;padding-top:4px}
.footer{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center}
.footer p{font-size:8px;color:#aaa;margin:2px 0}
.footer .conf{font-style:italic;font-size:9px;color:#888;margin-bottom:4px}
@media print{body{padding:20px}}
</style></head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 mt-4">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </button>

      {/* Title + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rapport Medical</h1>
            <p className="text-sm text-gray-500">Formulaire de compte-rendu de consultation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={!selectedPatient}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!selectedPatient}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="space-y-5">
          {/* Patient Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Informations Patient
            </h3>
            <div className="relative">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => searchPatients(e.target.value)}
                onFocus={() => patients.length > 0 && setShowPatientDropdown(true)}
                placeholder="Rechercher un patient (nom, prenom ou N dossier)..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showPatientDropdown && patients.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-sm flex items-center justify-between border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium text-gray-900">{p.last_name} {p.first_name}</span>
                      <span className="text-xs text-gray-400">{p.patient_number}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPatient && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                <p className="font-medium">{selectedPatient.last_name} {selectedPatient.first_name}</p>
                <p className="text-xs text-blue-600">N {selectedPatient.patient_number} - {selectedPatient.gender === 'male' ? 'M' : 'F'}</p>
              </div>
            )}
          </div>

          {/* Consultation meta */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Details de la consultation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={consultationType} onChange={(e) => setConsultationType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Consultation generale</option>
                  <option>Consultation de suivi</option>
                  <option>Consultation specialisee</option>
                  <option>Urgence</option>
                  <option>Controle post-operatoire</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">N Consultation</label>
                <input type="text" value={consultationNumber} onChange={(e) => setConsultationNumber(e.target.value)} placeholder="AUTO" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date de suivi</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* Vital signs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              Signes Vitaux
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <VitalInput icon={<Heart className="w-3.5 h-3.5 text-red-500" />} label="TA Systolique" unit="mmHg" value={bpSystolic} onChange={setBpSystolic} placeholder="120" />
              <VitalInput icon={<Heart className="w-3.5 h-3.5 text-red-500" />} label="TA Diastolique" unit="mmHg" value={bpDiastolic} onChange={setBpDiastolic} placeholder="80" />
              <VitalInput icon={<Activity className="w-3.5 h-3.5 text-orange-500" />} label="Freq. Cardiaque" unit="bpm" value={heartRate} onChange={setHeartRate} placeholder="72" />
              <VitalInput icon={<Thermometer className="w-3.5 h-3.5 text-amber-500" />} label="Temperature" unit="C" value={temperature} onChange={setTemperature} placeholder="37.0" />
              <VitalInput icon={<Weight className="w-3.5 h-3.5 text-blue-500" />} label="Poids" unit="kg" value={weight} onChange={setWeight} placeholder="70" />
              <VitalInput icon={<Activity className="w-3.5 h-3.5 text-cyan-500" />} label="Saturation O2" unit="%" value={oxygenSaturation} onChange={setOxygenSaturation} placeholder="98" />
            </div>
          </div>

          {/* Complaints */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Motif / Plaintes principales</label>
            <textarea value={complaints} onChange={(e) => setComplaints(e.target.value)} rows={3} placeholder="Decrire le motif de consultation et les plaintes du patient..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* Anamnesis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Anamnese</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Antecedents medicaux</label>
              <textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} rows={2} placeholder="Antecedents medicaux, chirurgicaux, familiaux..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Histoire de la maladie</label>
              <textarea value={illnessHistory} onChange={(e) => setIllnessHistory(e.target.value)} rows={3} placeholder="Debut, circonstances d'apparition, evolution..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Complement d'anamnese</label>
              <textarea value={additionalAnamnesis} onChange={(e) => setAdditionalAnamnesis(e.target.value)} rows={2} placeholder="Informations complementaires..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          {/* Physical examination */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Examen physique</label>
            <textarea value={physicalExamination} onChange={(e) => setPhysicalExamination(e.target.value)} rows={4} placeholder="Inspection, palpation, percussion, auscultation..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* Diagnosis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Diagnostic / Appreciation</label>
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} placeholder="Diagnostic principal, hypotheses diagnostiques..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* Paraclinical exams */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Examens paracliniques demandes</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newExam}
                onChange={(e) => setNewExam(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExam(); } }}
                placeholder="Ajouter un examen..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={addExam} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {paraclinicalExams.length > 0 && (
              <div className="space-y-1.5">
                {paraclinicalExams.map((exam, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="flex-1 text-sm text-gray-700">{exam}</span>
                    <button onClick={() => removeExam(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Treatment */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Traitement / Conduite a tenir</label>
            <textarea value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} rows={4} placeholder="Prescriptions, recommandations, conduite a tenir..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Notes complementaires</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observations additionnelles..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="bg-gray-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Apercu du rapport
            </h3>
            <div ref={printRef} className="report bg-white rounded-lg shadow-sm p-8 text-sm">
              {/* Header */}
              <div className="header flex justify-between items-start pb-4 border-b-[3px] border-blue-700 mb-5">
                <div className="logo-area flex items-center gap-3">
                  <img src="/Logo-Okapi-Medical.jpg" alt="OKAPIA" className="w-12 h-12 object-contain" />
                  <span className="clinic-name text-xl font-bold text-blue-700">OKAPIA Medical</span>
                </div>
                <div className="clinic-info text-right text-[10px] text-gray-500 leading-relaxed">
                  <p>Chaussee Mzee Kabila n16.881</p>
                  <p>Galerie Manfield, Kinshasa-Ngaliema</p>
                  <p>Kinshasa, RDC</p>
                  <p>Dir: +243 817 659 057</p>
                  <p>Rec: +243 823 800 104</p>
                  <p>info@okapiahospital.com</p>
                  <p>RCCM: CD/KIN/RCCM/25-B-00412</p>
                </div>
              </div>

              {/* Title */}
              <div className="title text-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">RAPPORT MEDICAL</h2>
                <p className="subtitle text-sm font-semibold text-blue-700">Compte-Rendu de Consultation</p>
              </div>

              {/* Meta */}
              <div className="meta flex justify-between text-[10px] text-gray-400 mb-4">
                <span>N Consultation: {consultationNumber || '---'}</span>
                <span>Date: {reportDate ? new Date(reportDate).toLocaleDateString('fr-FR') : '---'}</span>
              </div>

              {/* Info boxes */}
              <div className="boxes grid grid-cols-2 gap-3 mb-4">
                <div className="box bg-gray-50 border border-gray-200 rounded-md p-3">
                  <h4 className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Patient</h4>
                  {selectedPatient ? (
                    <div className="text-[11px] space-y-0.5">
                      <p><span className="lbl font-semibold">Nom:</span> {selectedPatient.last_name} {selectedPatient.first_name}</p>
                      <p><span className="lbl font-semibold">N:</span> {selectedPatient.patient_number}</p>
                      <p><span className="lbl font-semibold">Sexe:</span> {selectedPatient.gender === 'male' ? 'M' : 'F'}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-300 italic">Selectionnez un patient</p>
                  )}
                </div>
                <div className="box bg-gray-50 border border-gray-200 rounded-md p-3">
                  <h4 className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Consultation</h4>
                  <div className="text-[11px] space-y-0.5">
                    <p><span className="lbl font-semibold">Medecin:</span> Dr. {profile?.full_name || '---'}</p>
                    <p><span className="lbl font-semibold">Date:</span> {reportDate ? new Date(reportDate).toLocaleDateString('fr-FR') : '---'}</p>
                    <p><span className="lbl font-semibold">Type:</span> {consultationType}</p>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              {(bpSystolic || heartRate || temperature || weight || oxygenSaturation) && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-2">Signes Vitaux</h3>
                  <table className="vitals-table w-full text-[10px] border-collapse">
                    <tbody>
                      {bpSystolic && <tr className="border-b border-gray-100"><td className="py-1 font-medium">Tension Art.</td><td className="py-1">{bpSystolic}/{bpDiastolic} mmHg</td></tr>}
                      {heartRate && <tr className="border-b border-gray-100"><td className="py-1 font-medium">Freq. Card.</td><td className="py-1">{heartRate} bpm</td></tr>}
                      {temperature && <tr className="border-b border-gray-100"><td className="py-1 font-medium">Temperature</td><td className="py-1">{temperature} C</td></tr>}
                      {weight && <tr className="border-b border-gray-100"><td className="py-1 font-medium">Poids</td><td className="py-1">{weight} kg</td></tr>}
                      {oxygenSaturation && <tr className="border-b border-gray-100"><td className="py-1 font-medium">Sat. O2</td><td className="py-1">{oxygenSaturation}%</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Content sections */}
              {complaints && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Motif de consultation</h3>
                  <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{complaints}</p>
                </div>
              )}
              {medicalHistory && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Antecedents</h3>
                  <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{medicalHistory}</p>
                </div>
              )}
              {illnessHistory && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Histoire de la maladie</h3>
                  <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{illnessHistory}</p>
                </div>
              )}
              {physicalExamination && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Examen physique</h3>
                  <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{physicalExamination}</p>
                </div>
              )}
              {diagnosis && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Diagnostic</h3>
                  <p className="text-[11px] text-gray-700 whitespace-pre-wrap font-medium">{diagnosis}</p>
                </div>
              )}
              {paraclinicalExams.length > 0 && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Examens paracliniques</h3>
                  <ul className="list-disc pl-4 text-[11px] text-gray-700">
                    {paraclinicalExams.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              {treatmentPlan && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Traitement</h3>
                  <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{treatmentPlan}</p>
                </div>
              )}
              {followUpDate && (
                <div className="section border-t border-gray-200 pt-3 mt-3">
                  <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Suivi</h3>
                  <p className="text-[11px] text-gray-700">Prochain rendez-vous: {new Date(followUpDate).toLocaleDateString('fr-FR')}</p>
                </div>
              )}

              {/* Signature */}
              <div className="signature mt-10 text-right pr-4">
                <p className="text-[11px] text-gray-600">Le Medecin traitant,</p>
                <div className="line border-t border-gray-400 w-44 ml-auto mt-8 pt-1">
                  <p className="text-[11px] text-gray-700">Dr. {profile?.full_name || '_______________'}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="footer mt-8 pt-3 border-t border-gray-200 text-center">
                <p className="conf text-[9px] italic text-gray-500">Ce rapport est un document medical confidentiel.</p>
                <p className="text-[8px] text-gray-400">OKAPIA Medical - Chaussee Mzee Kabila n16.881 - Tel. +243 817 659 057</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalInput({ icon, label, unit, value, onChange, placeholder }: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 font-medium">{label}</p>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full text-sm font-semibold bg-transparent outline-none text-gray-900 placeholder:text-gray-300"
          />
          <span className="text-[9px] text-gray-400 shrink-0">{unit}</span>
        </div>
      </div>
    </div>
  );
}
