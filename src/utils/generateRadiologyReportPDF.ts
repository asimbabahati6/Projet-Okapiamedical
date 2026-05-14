import jsPDF from 'jspdf';
import { OKAPIA_LOGO_BASE64 } from './logoBase64';

const CLINIC_NAME = 'OKAPIA Medical';
const CLINIC_ADDRESS = 'Chaussee Mzee Kabila n16.881';
const CLINIC_CITY = 'Galerie Manfield Kinshasa-Ngaliema';
const CLINIC_COUNTRY = 'Kinshasa, Republique Democratique du Congo';
const CLINIC_DIRECTION = '+243 817 659 057';
const CLINIC_RECEPTION = '+243 823 800 104';
const CLINIC_EMAIL = 'info@okapiahospital.com';
const CLINIC_RCCM = 'CD/KIN/RCCM/25-B-00412';

export interface RadiologyReportData {
  reportNumber?: string;
  reportDate: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
    dateOfBirth: string;
    gender: string;
  };
  exam: {
    type: string;
    modality: string;
    bodyPart: string;
    urgencyLevel: string;
    prescribedDate: string;
    performedDate?: string;
  };
  prescriber: string;
  performer?: string;
  validator?: string;
  clinicalIndication: string;
  technique: string;
  findings: string;
  conclusion: string;
  recommendations?: string;
  status: string;
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

export function generateRadiologyReportPDF(data: RadiologyReportData): jsPDF {
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

  // Report title
  let y = 63;
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text("RAPPORT D'IMAGERIE MEDICALE", pageWidth / 2, y, { align: 'center' });

  // Exam type subtitle
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text(`${getExamTypeLabel(data.exam.type)} - ${data.exam.bodyPart}`, pageWidth / 2, y, { align: 'center' });

  // Report number and date
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  if (data.reportNumber) {
    doc.text(`N Rapport: ${data.reportNumber}`, margin, y);
  }
  doc.text(`Date: ${data.reportDate}`, pageWidth - margin, y, { align: 'right' });

  // Patient and exam info boxes
  y += 10;
  const boxWidth = (pageWidth - margin * 2 - 6) / 2;

  // Patient info box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 210, 225);
  doc.roundedRect(margin, y, boxWidth, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS PATIENT', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nom: ${data.patient.lastName} ${data.patient.firstName}`, margin + 4, y + 13);
  doc.text(`N Dossier: ${data.patient.patientNumber}`, margin + 4, y + 19);
  doc.text(`Date de naissance: ${data.patient.dateOfBirth}`, margin + 4, y + 25);
  doc.text(`Sexe: ${data.patient.gender === 'male' ? 'Masculin' : 'Feminin'}`, margin + 4, y + 31);

  // Exam info box
  const rightBoxX = margin + boxWidth + 6;
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 210, 225);
  doc.roundedRect(rightBoxX, y, boxWidth, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILS EXAMEN', rightBoxX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Type: ${getExamTypeLabel(data.exam.type)} (${data.exam.modality})`, rightBoxX + 4, y + 13);
  doc.text(`Region: ${data.exam.bodyPart}`, rightBoxX + 4, y + 19);
  doc.text(`Urgence: ${getUrgencyLabel(data.exam.urgencyLevel)}`, rightBoxX + 4, y + 25);
  doc.text(`Prescrit le: ${data.exam.prescribedDate}`, rightBoxX + 4, y + 31);

  // Intervenants
  y += 42;
  doc.setFillColor(240, 248, 255);
  doc.setDrawColor(180, 210, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVENANTS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Prescripteur: Dr. ${data.prescriber}`, margin + 4, y + 13);
  if (data.performer) {
    doc.text(`Realise par: ${data.performer}`, pageWidth / 2, y + 13);
  }
  if (data.validator) {
    doc.text(`Valide par: Dr. ${data.validator}`, margin + 4, y + 13 + (data.performer ? 0 : 6));
  }

  // Report sections
  y += 26;

  const drawSection = (title: string, content: string, isBold = false) => {
    if (!content) return;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
    for (const line of lines) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 3;
  };

  drawSection('INDICATION CLINIQUE', data.clinicalIndication);
  drawSection('TECHNIQUE', data.technique);
  drawSection('OBSERVATIONS / CONSTATATIONS', data.findings);
  drawSection('CONCLUSION', data.conclusion, true);
  if (data.recommendations) {
    drawSection('RECOMMANDATIONS', data.recommendations);
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
  doc.text('Le Radiologue,', pageWidth - 70, y);
  y += 20;
  doc.setLineWidth(0.2);
  doc.line(pageWidth - 85, y, pageWidth - margin, y);
  y += 5;
  if (data.performer) {
    doc.setFontSize(8);
    doc.text(data.performer, pageWidth - 70, y);
  }

  if (data.status === 'validated' && data.validator) {
    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.text(`Valide par Dr. ${data.validator}`, margin, y);
    if (data.exam.performedDate) {
      doc.setFont('helvetica', 'normal');
      doc.text(` le ${data.exam.performedDate}`, margin + doc.getTextWidth(`Valide par Dr. ${data.validator}`) + 2, y);
    }
  }

  // Footer
  const footerY = 275;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('Ce rapport est un document medical confidentiel.', margin, footerY + 5);
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

export function downloadRadiologyReportPDF(data: RadiologyReportData): void {
  const doc = generateRadiologyReportPDF(data);
  const filename = data.reportNumber
    ? `Rapport_Radio_${data.reportNumber}.pdf`
    : `Rapport_Radio_${data.patient.lastName}_${data.reportDate.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
