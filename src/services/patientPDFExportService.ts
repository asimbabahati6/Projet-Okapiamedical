import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../lib/supabase';

interface PatientData {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_type: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  primary_care_physician_id: string | null;
}

interface ConsultationData {
  id: string;
  consultation_date: string;
  reason: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  doctor_name: string;
}

interface PhysicianData {
  name: string;
  specialization: string | null;
  rpps_number: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
}

interface InsuranceData {
  provider_name: string;
  policy_number: string;
}

interface ExportOptions {
  includeConsultations?: boolean;
  includeMedicalHistory?: boolean;
  includeAllergies?: boolean;
}

export async function exportPatientToPDF(
  patientId: string,
  options: ExportOptions = {
    includeConsultations: true,
    includeMedicalHistory: true,
    includeAllergies: true
  }
): Promise<void> {
  try {
    const patientData = await fetchPatientData(patientId);
    const consultations = options.includeConsultations
      ? await fetchConsultations(patientId)
      : [];
    const physician = patientData.primary_care_physician_id
      ? await fetchPhysician(patientData.primary_care_physician_id)
      : null;
    const insurance = await fetchInsurance(patientId);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;

    yPosition = addHeader(doc, yPosition);
    yPosition = addPatientInfo(doc, patientData, yPosition);

    if (physician) {
      yPosition = addPhysicianInfo(doc, physician, yPosition);
    }

    if (insurance) {
      yPosition = addInsuranceInfo(doc, insurance, yPosition);
    }

    if (options.includeConsultations && consultations.length > 0) {
      yPosition = addConsultationsTable(doc, consultations, yPosition);
    }

    addFooter(doc);
    addWatermark(doc);

    const fileName = `Patient_${patientData.patient_number}_${formatDate(new Date())}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting patient to PDF:', error);
    throw new Error('Erreur lors de la génération du PDF. Veuillez réessayer.');
  }
}

async function fetchPatientData(patientId: string): Promise<PatientData> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (error) throw error;
  return data;
}

async function fetchConsultations(patientId: string): Promise<ConsultationData[]> {
  const { data, error } = await supabase
    .from('consultations')
    .select(`
      id,
      consultation_date,
      reason,
      diagnosis,
      treatment,
      notes,
      doctor:doctor_id(
        user_profile:user_profiles(full_name)
      )
    `)
    .eq('patient_id', patientId)
    .order('consultation_date', { ascending: false })
    .limit(50);

  if (error) throw error;

  return data.map(consultation => ({
    id: consultation.id,
    consultation_date: consultation.consultation_date,
    reason: consultation.reason,
    diagnosis: consultation.diagnosis,
    treatment: consultation.treatment,
    notes: consultation.notes,
    doctor_name: consultation.doctor?.user_profile?.full_name || 'Non spécifié'
  }));
}

async function fetchPhysician(physicianId: string): Promise<PhysicianData | null> {
  const { data, error } = await supabase
    .from('medical_staff')
    .select(`
      rpps_number,
      specialization,
      user_profile:user_profiles(
        full_name,
        email,
        phone,
        department_id,
        departments(name)
      )
    `)
    .eq('id', physicianId)
    .single();

  if (error) return null;

  return {
    name: data.user_profile?.full_name || 'Non spécifié',
    specialization: data.specialization,
    rpps_number: data.rpps_number,
    email: data.user_profile?.email || null,
    phone: data.user_profile?.phone || null,
    department: data.user_profile?.departments?.name || null
  };
}

async function fetchInsurance(patientId: string): Promise<InsuranceData | null> {
  const { data, error } = await supabase
    .from('insurances')
    .select('provider_name, policy_number')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

function addHeader(doc: jsPDF, yPosition: number): number {
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('OKAPIA Medical', 15, 15);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Fiche Patient Médicale', 15, 23);

  doc.setFontSize(10);
  doc.text(`Date d'émission: ${formatDate(new Date())}`, 15, 30);

  doc.setTextColor(0, 0, 0);
  return 45;
}

function addPatientInfo(doc: jsPDF, patient: PatientData, yPosition: number): number {
  doc.setFillColor(243, 244, 246);
  doc.rect(10, yPosition, 190, 8, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('INFORMATIONS PERSONNELLES', 15, yPosition + 6);

  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const fullName = `${patient.first_name} ${patient.last_name}`.toUpperCase();
  const age = calculateAge(patient.date_of_birth);
  const gender = patient.gender === 'male' ? 'Homme' : patient.gender === 'female' ? 'Femme' : 'Autre';

  const patientInfo = [
    ['Nom complet:', fullName],
    ['N° Patient:', patient.patient_number],
    ['Date de naissance:', `${formatDate(new Date(patient.date_of_birth))} (${age} ans)`],
    ['Genre:', gender],
    ['Groupe sanguin:', patient.blood_type || 'Non renseigné'],
    ['Téléphone:', patient.phone],
    ['Email:', patient.email || 'Non renseigné'],
    ['Adresse:', patient.address || 'Non renseigné'],
    ['Ville:', patient.city || 'Non renseigné']
  ];

  patientInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 65, yPosition);
    yPosition += 7;
  });

  return yPosition + 5;
}

function addPhysicianInfo(doc: jsPDF, physician: PhysicianData, yPosition: number): number {
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(14, 165, 233);
  doc.rect(10, yPosition, 190, 10, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MÉDECIN RÉFÉRENT', 15, yPosition + 7);

  yPosition += 15;

  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(1);
  doc.rect(10, yPosition, 190, 55);

  yPosition += 8;

  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${physician.name}`, 15, yPosition);

  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const physicianInfo = [
    ['Spécialité:', physician.specialization || 'Non spécifié'],
    ['Département:', physician.department || 'Non assigné'],
    ['N° RPPS:', physician.rpps_number || 'Non renseigné'],
    ['Email:', physician.email || 'Non renseigné'],
    ['Téléphone:', physician.phone || 'Non renseigné']
  ];

  physicianInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(label, 15, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.text(value, 65, yPosition);
    yPosition += 7;
  });

  return yPosition + 10;
}

function addInsuranceInfo(doc: jsPDF, insurance: InsuranceData, yPosition: number): number {
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(243, 244, 246);
  doc.rect(10, yPosition, 190, 8, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('ASSURANCE', 15, yPosition + 6);

  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.setFont('helvetica', 'bold');
  doc.text('Fournisseur:', 15, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(insurance.provider_name, 65, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('N° Police:', 15, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(insurance.policy_number, 65, yPosition);
  yPosition += 7;

  return yPosition + 5;
}

function addConsultationsTable(doc: jsPDF, consultations: ConsultationData[], yPosition: number): number {
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(243, 244, 246);
  doc.rect(10, yPosition, 190, 8, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('HISTORIQUE DES CONSULTATIONS', 15, yPosition + 6);

  yPosition += 12;

  if (consultations.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Aucune consultation enregistrée', 15, yPosition);
    return yPosition + 10;
  }

  const tableData = consultations.map(consultation => [
    formatDate(new Date(consultation.consultation_date)),
    consultation.doctor_name,
    consultation.reason || '-',
    consultation.diagnosis || '-',
    truncateText(consultation.treatment || '-', 40)
  ]);

  (doc as any).autoTable({
    startY: yPosition,
    head: [['Date', 'Médecin', 'Motif', 'Diagnostic', 'Traitement']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55]
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 10, right: 10 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
      4: { cellWidth: 45 }
    }
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

function addFooter(doc: jsPDF): void {
  const pageCount = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'italic');

    const footerText = 'Document confidentiel - Usage médical uniquement';
    const timestamp = `Généré le ${formatDate(new Date())} à ${formatTime(new Date())}`;

    doc.text(footerText, 105, 285, { align: 'center' });
    doc.text(timestamp, 105, 290, { align: 'center' });
    doc.text(`Page ${i} / ${pageCount}`, 190, 290, { align: 'right' });
  }
}

function addWatermark(doc: jsPDF): void {
  const pageCount = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');

    doc.text('CONFIDENTIEL', 105, 150, {
      align: 'center',
      angle: 45
    });

    doc.restoreGraphicsState();
  }
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
