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

export interface LabReportParameter {
  name: string;
  value: string;
  unit: string;
  reference: string;
  isAbnormal: boolean;
}

export interface LabReportData {
  orderNumber: string;
  reportDate: string;
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
    dateOfBirth: string;
    gender: string;
  };
  analysis: {
    testName: string;
    testCode: string;
    category: string;
    specimenType: string;
    priority: string;
    requestedDate: string;
    completedDate?: string;
  };
  prescriber: string;
  performer?: string;
  approver?: string;
  parameters: LabReportParameter[];
  interpretation: string;
  status: string;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    normal: 'Normal',
    urgent: 'Urgent',
    stat: 'STAT (Immediat)',
  };
  return labels[priority] || priority;
}

export function generateLabReportPDF(data: LabReportData): jsPDF {
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
  doc.text("RAPPORT D'ANALYSES MEDICALES", pageWidth / 2, y, { align: 'center' });

  // Subtitle
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text(`${data.analysis.testName} (${data.analysis.category})`, pageWidth / 2, y, { align: 'center' });

  // Order number and date
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`N Ordre: ${data.orderNumber}`, margin, y);
  doc.text(`Date: ${data.reportDate}`, pageWidth - margin, y, { align: 'right' });

  // Patient and analysis info boxes
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

  // Analysis info box
  const rightBoxX = margin + boxWidth + 6;
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 210, 225);
  doc.roundedRect(rightBoxX, y, boxWidth, 36, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILS ANALYSE', rightBoxX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Analyse: ${data.analysis.testName}`, rightBoxX + 4, y + 13);
  doc.text(`Echantillon: ${data.analysis.specimenType}`, rightBoxX + 4, y + 19);
  doc.text(`Priorite: ${getPriorityLabel(data.analysis.priority)}`, rightBoxX + 4, y + 25);
  doc.text(`Demande le: ${data.analysis.requestedDate}`, rightBoxX + 4, y + 31);

  // Intervenants
  y += 42;
  doc.setFillColor(240, 248, 255);
  doc.setDrawColor(180, 210, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVENANTS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(`Prescripteur: Dr. ${data.prescriber}`, margin + 4, y + 11);
  if (data.performer) {
    doc.text(`Biologiste: ${data.performer}`, pageWidth / 2, y + 11);
  }

  // Results table
  y += 22;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTATS', margin, y);
  y += 4;

  const tableData = data.parameters.map((param) => [
    param.name,
    param.value,
    param.unit,
    param.reference,
    param.isAbnormal ? 'ANORMAL' : 'Normal',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Parametre', 'Valeur', 'Unite', 'Reference', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
    },
    didParseCell(hookData) {
      if (hookData.section === 'body' && hookData.column.index === 4) {
        const isAbnormal = hookData.cell.raw === 'ANORMAL';
        if (isAbnormal) {
          hookData.cell.styles.textColor = [220, 38, 38];
          hookData.cell.styles.fontStyle = 'bold';
        } else {
          hookData.cell.styles.textColor = [22, 163, 74];
        }
      }
      if (hookData.section === 'body' && hookData.column.index === 1) {
        const rowIdx = hookData.row.index;
        if (data.parameters[rowIdx]?.isAbnormal) {
          hookData.cell.styles.textColor = [220, 38, 38];
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y + 40;

  // Interpretation
  let interpY = finalY + 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, interpY, pageWidth - margin, interpY);
  interpY += 7;

  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERPRETATION DU BIOLOGISTE', margin, interpY);
  interpY += 6;

  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');

  if (data.interpretation) {
    const lines = doc.splitTextToSize(data.interpretation, pageWidth - margin * 2);
    for (const line of lines) {
      if (interpY > 260) {
        doc.addPage();
        interpY = 20;
      }
      doc.text(line, margin, interpY);
      interpY += 4.5;
    }
  }

  // Signature area
  if (interpY > 235) {
    doc.addPage();
    interpY = 20;
  }
  interpY += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, interpY, pageWidth - margin, interpY);
  interpY += 12;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('Le Biologiste,', pageWidth - 70, interpY);
  interpY += 20;
  doc.setLineWidth(0.2);
  doc.line(pageWidth - 85, interpY, pageWidth - margin, interpY);
  interpY += 5;
  if (data.performer) {
    doc.setFontSize(8);
    doc.text(data.performer, pageWidth - 70, interpY);
  }

  // Validation
  if (data.status === 'completed' && data.approver) {
    interpY += 12;
    doc.setFontSize(8);
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.text(`Valide par ${data.approver}`, margin, interpY);
    if (data.analysis.completedDate) {
      doc.setFont('helvetica', 'normal');
      doc.text(` le ${data.analysis.completedDate}`, margin + doc.getTextWidth(`Valide par ${data.approver}`) + 2, interpY);
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
  doc.text('Ce rapport est un document medical confidentiel. Les resultats doivent etre interpretes par un medecin.', margin, footerY + 5);
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

export function downloadLabReportPDF(data: LabReportData): void {
  const doc = generateLabReportPDF(data);
  const filename = `Rapport_Labo_${data.orderNumber}_${data.patient.lastName}.pdf`;
  doc.save(filename);
}
