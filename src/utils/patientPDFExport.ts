import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, PatientINSIdentity, PatientMedicalHistory, PatientAllergyDetailed, Consultation } from '../types/database';
import { formatDoctorName } from './formatDoctorName';

interface PatientExportData {
  patient: Patient & {
    primary_care_physician?: {
      user_profile?: {
        full_name: string;
      };
      specialization?: string;
      license_number?: string;
    };
  };
  insIdentity?: PatientINSIdentity | null;
  medicalHistory?: PatientMedicalHistory[];
  allergies?: PatientAllergyDetailed[];
  consultations?: Consultation[];
}

export function generatePatientPDF(data: PatientExportData) {
  const doc = new jsPDF();
  const { patient, insIdentity, medicalHistory, allergies, consultations } = data;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHE PATIENT', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS PERSONNELLES', 14, yPosition);
  yPosition += 7;

  const personalInfo = [
    ['Numéro Patient', patient.patient_number],
    ['Nom Complet', `${patient.first_name} ${patient.last_name}`],
    ['Date de Naissance', new Date(patient.date_of_birth).toLocaleDateString('fr-FR')],
    ['Âge', calculateAge(patient.date_of_birth).toString() + ' ans'],
    ['Sexe', patient.gender === 'male' ? 'Masculin' : 'Féminin'],
    ['Groupe Sanguin', patient.blood_group || 'Non spécifié'],
    ['Téléphone', patient.phone || 'N/A'],
    ['Email', patient.email || 'N/A'],
    ['Adresse', `${patient.address || ''}, ${patient.city || ''}`],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: personalInfo,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  if (patient.primary_care_physician) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉDECIN TRAITANT', 14, yPosition);
    yPosition += 7;

    const physicianInfo = [
      ['Nom', formatDoctorName(patient.primary_care_physician.user_profile?.full_name)],
      ['Spécialisation', patient.primary_care_physician.specialization || 'N/A'],
      ['Numéro de Licence', patient.primary_care_physician.license_number || 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: physicianInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  if (patient.emergency_contact_name || patient.emergency_contact_phone) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT D\'URGENCE', 14, yPosition);
    yPosition += 7;

    const emergencyInfo = [
      ['Nom', patient.emergency_contact_name || 'N/A'],
      ['Téléphone', patient.emergency_contact_phone || 'N/A'],
      ['Relation', patient.emergency_contact_relationship || 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: emergencyInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  if (insIdentity) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('IDENTITÉ INS', 14, yPosition);
    yPosition += 7;

    const insInfo = [
      ['Numéro INS', insIdentity.ins_number || 'N/A'],
      ['Matricule INS-C', insIdentity.ins_c_matricule || 'N/A'],
      ['OID', insIdentity.oid || 'N/A'],
      ['Statut de Qualification', insIdentity.qualification_status || 'N/A'],
      ['Date de Validation', insIdentity.validation_date ? new Date(insIdentity.validation_date).toLocaleDateString('fr-FR') : 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: insInfo,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  if (allergies && allergies.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ALLERGIES ET INTOLÉRANCES', 14, yPosition);
    yPosition += 7;

    const allergyData = allergies.map(allergy => [
      allergy.allergen_name,
      allergy.allergy_type,
      allergy.severity,
      allergy.status
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Allergène', 'Type', 'Sévérité', 'Statut']],
      body: allergyData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [220, 53, 69], textColor: 255 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  if (medicalHistory && medicalHistory.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ANTÉCÉDENTS MÉDICAUX', 14, yPosition);
    yPosition += 7;

    const historyData = medicalHistory.map(history => [
      history.condition_name,
      history.icd10_code || 'N/A',
      history.diagnosis_date ? new Date(history.diagnosis_date).toLocaleDateString('fr-FR') : 'N/A',
      history.status,
      history.severity || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Condition', 'Code ICD-10', 'Date', 'Statut', 'Sévérité']],
      body: historyData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [13, 110, 253], textColor: 255 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  if (consultations && consultations.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTORIQUE DES CONSULTATIONS (10 dernières)', 14, yPosition);
    yPosition += 7;

    const consultationData = consultations.slice(0, 10).map(consultation => [
      new Date(consultation.consultation_date).toLocaleDateString('fr-FR'),
      consultation.chief_complaint || 'N/A',
      consultation.diagnosis || 'N/A',
      formatDoctorName((consultation as any).doctor?.user_profile?.full_name)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Motif', 'Diagnostic', 'Médecin']],
      body: consultationData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [25, 135, 84], textColor: 255 }
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} sur ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Document Confidentiel - Usage Médical Uniquement',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  const fileName = `Fiche-Patient-${patient.first_name}-${patient.last_name}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return fileName;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
