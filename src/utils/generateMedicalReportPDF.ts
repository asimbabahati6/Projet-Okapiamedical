import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OKAPIA_LOGO_BASE64 } from './logoBase64';

const CLINIC_NAME = 'OKAPIA Medical';
const CLINIC_ADDRESS = 'Chaussee Mzee Kabila n16.881';
const CLINIC_CITY = 'Galerie Manfield Kinshasa-Ngaliema';
const CLINIC_COUNTRY = 'Kinshasa, Republique Democratique du Congo';
const CLINIC_DIRECTION = '+243 817 659 057';
const CLINIC_RECEPTION = '+243 823 800 104';
const CLINIC_EMAIL = 'info@okapiahospital.com';
const CLINIC_RCCM = 'CD/KIN/RCCM/25-B-00412';

export interface MedicalReportVitalSigns {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  weight: string;
  oxygenSaturation: string;
}

export interface MedicalReportData {
  consultationNumber?: string;
  reportDate: string;
  consultationType?: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
    dateOfBirth: string;
    gender: string;
  };
  doctor: string;
  complaints: string;
  vitalSigns: MedicalReportVitalSigns;
  medicalHistory: string;
  illnessHistory: string;
  additionalAnamnesis: string;
  physicalExamination: string;
  diagnosis: string;
  paraclinicalExams: string[];
  treatmentPlan: string;
  followUpDate?: string;
  notes?: string;
}

function addSection(doc: jsPDF, title: string, content: string, y: number, margin: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (y > 255) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');

  if (content) {
    const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 4.5;
    }
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text('Non renseigne', margin, y);
    y += 4.5;
  }

  y += 4;
  return y;
}

export function generateMedicalReportPDF(data: MedicalReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Logo
  try {
    doc.addImage(
      `data:image/jpeg;base64,${OKAPIA_LOGO_BASE64}`,
      'JPEG',
      margin,
      10,
      30,
      30
    );
  } catch {
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text(CLINIC_NAME, margin, 25);
  }

  // Clinic info - right aligned
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(CLINIC_NAME, pageWidth - margin, 16, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(CLINIC_ADDRESS, pageWidth - margin, 22, { align: 'right' });
  doc.text(CLINIC_CITY, pageWidth - margin, 26.5, { align: 'right' });
  doc.text(CLINIC_COUNTRY, pageWidth - margin, 31, { align: 'right' });
  doc.text(`Direction: ${CLINIC_DIRECTION}`, pageWidth - margin, 35.5, { align: 'right' });
  doc.text(`Reception: ${CLINIC_RECEPTION}`, pageWidth - margin, 40, { align: 'right' });
  doc.text(CLINIC_EMAIL, pageWidth - margin, 44.5, { align: 'right' });
  doc.text(`RCCM: ${CLINIC_RCCM}`, pageWidth - margin, 49, { align: 'right' });

  // Header separator
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.8);
  doc.line(margin, 53, pageWidth - margin, 53);

  // Title
  let y = 63;
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT MEDICAL', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text('Compte-Rendu de Consultation', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Meta info
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  if (data.consultationNumber) {
    doc.text(`N Consultation: ${data.consultationNumber}`, margin, y);
  }
  doc.text(`Date: ${data.reportDate}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Patient & consultation info boxes
  const boxWidth = (pageWidth - margin * 2 - 6) / 2;

  // Patient info
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 210, 225);
  doc.roundedRect(margin, y, boxWidth, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nom: ${data.patient.lastName} ${data.patient.firstName}`, margin + 4, y + 12);
  doc.text(`N Dossier: ${data.patient.patientNumber}`, margin + 4, y + 18);
  doc.text(`Date de naissance: ${data.patient.dateOfBirth}`, margin + 4, y + 24);
  doc.text(`Sexe: ${data.patient.gender === 'male' ? 'Masculin' : 'Feminin'}`, margin + 4, y + 30);

  // Consultation info
  const rightBoxX = margin + boxWidth + 6;
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 210, 225);
  doc.roundedRect(rightBoxX, y, boxWidth, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSULTATION', rightBoxX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Medecin: Dr. ${data.doctor}`, rightBoxX + 4, y + 12);
  doc.text(`Date: ${data.reportDate}`, rightBoxX + 4, y + 18);
  doc.text(`Type: ${data.consultationType || 'Consultation generale'}`, rightBoxX + 4, y + 24);
  if (data.followUpDate) {
    doc.text(`Suivi: ${data.followUpDate}`, rightBoxX + 4, y + 30);
  }

  y += 40;

  // Vital signs table
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNES VITAUX', margin, y);
  y += 4;

  const vs = data.vitalSigns;
  const vitalData = [
    ['Tension Arterielle', vs.bloodPressureSystolic && vs.bloodPressureDiastolic ? `${vs.bloodPressureSystolic}/${vs.bloodPressureDiastolic}` : '-', 'mmHg'],
    ['Frequence Cardiaque', vs.heartRate || '-', 'bpm'],
    ['Temperature', vs.temperature || '-', 'C'],
    ['Poids', vs.weight || '-', 'kg'],
    ['Saturation O2', vs.oxygenSaturation || '-', '%'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Parametre', 'Valeur', 'Unite']],
    body: vitalData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2 - 40,
  });

  const tableEndY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 40;
  y = tableEndY + 8;

  // Motif de consultation
  y = addSection(doc, 'MOTIF DE CONSULTATION / PLAINTES PRINCIPALES', data.complaints, y, margin);

  // Anamnese sections
  if (data.medicalHistory) {
    y = addSection(doc, 'ANTECEDENTS MEDICAUX', data.medicalHistory, y, margin);
  }
  if (data.illnessHistory) {
    y = addSection(doc, 'HISTOIRE DE LA MALADIE', data.illnessHistory, y, margin);
  }
  if (data.additionalAnamnesis) {
    y = addSection(doc, "COMPLEMENT D'ANAMNESE", data.additionalAnamnesis, y, margin);
  }

  // Physical examination
  y = addSection(doc, 'EXAMEN PHYSIQUE', data.physicalExamination, y, margin);

  // Diagnosis
  y = addSection(doc, 'DIAGNOSTIC / APPRECIATION', data.diagnosis, y, margin);

  // Paraclinical exams
  if (data.paraclinicalExams.length > 0) {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('EXAMENS PARACLINIQUES DEMANDES', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    for (const exam of data.paraclinicalExams) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`  - ${exam}`, margin, y);
      y += 4.5;
    }
    y += 4;
  }

  // Treatment
  y = addSection(doc, 'TRAITEMENT / CONDUITE A TENIR', data.treatmentPlan, y, margin);

  // Follow-up
  if (data.followUpDate) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE DE SUIVI:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(data.followUpDate, margin + 35, y);
    y += 8;
  }

  // Notes
  if (data.notes) {
    y = addSection(doc, 'NOTES COMPLEMENTAIRES', data.notes, y, margin);
  }

  // Signature area
  if (y > 235) {
    doc.addPage();
    y = 20;
  }
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('Le Medecin traitant,', pageWidth - 70, y);
  y += 20;
  doc.setLineWidth(0.2);
  doc.line(pageWidth - 85, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.text(`Dr. ${data.doctor}`, pageWidth - 70, y);

  // Footer
  const footerY = 275;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('Ce rapport est un document medical confidentiel. Il ne peut etre communique sans le consentement du patient.', margin, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${CLINIC_NAME} - ${CLINIC_ADDRESS}, ${CLINIC_CITY} - Tel. ${CLINIC_DIRECTION}`,
    margin,
    footerY + 10
  );
  doc.text(
    `Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin,
    footerY + 10,
    { align: 'right' }
  );

  return doc;
}

export function downloadMedicalReportPDF(data: MedicalReportData): void {
  const doc = generateMedicalReportPDF(data);
  const filename = `Rapport_Medical_${data.patient.lastName}_${data.reportDate.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
