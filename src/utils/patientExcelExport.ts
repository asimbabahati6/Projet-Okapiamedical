import * as XLSX from 'xlsx';
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
      consultation_fee?: number;
    };
  };
  insIdentity?: PatientINSIdentity | null;
  medicalHistory?: PatientMedicalHistory[];
  allergies?: PatientAllergyDetailed[];
  consultations?: Consultation[];
}

export function generatePatientExcel(data: PatientExportData) {
  const { patient, insIdentity, medicalHistory, allergies, consultations } = data;

  const workbook = XLSX.utils.book_new();

  const demographicsData = [
    ['FICHE PATIENT - INFORMATIONS DÉMOGRAPHIQUES'],
    [],
    ['Généré le:', `${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`],
    [],
    ['Numéro Patient', patient.patient_number],
    ['Prénom', patient.first_name],
    ['Nom', patient.last_name],
    ['Date de Naissance', new Date(patient.date_of_birth).toLocaleDateString('fr-FR')],
    ['Âge', `${calculateAge(patient.date_of_birth)} ans`],
    ['Sexe', patient.gender === 'male' ? 'Masculin' : 'Féminin'],
    ['Groupe Sanguin', patient.blood_group || 'Non spécifié'],
    [],
    ['COORDONNÉES'],
    ['Téléphone', patient.phone || 'N/A'],
    ['Email', patient.email || 'N/A'],
    ['Adresse', patient.address || 'N/A'],
    ['Ville', patient.city || 'N/A'],
    [],
    ['CONTACT D\'URGENCE'],
    ['Nom', patient.emergency_contact_name || 'N/A'],
    ['Téléphone', patient.emergency_contact_phone || 'N/A'],
    ['Relation', patient.emergency_contact_relationship || 'N/A'],
    [],
    ['ASSURANCE'],
    ['Fournisseur', patient.insurance_provider || 'N/A'],
    ['Numéro', patient.insurance_number || 'N/A'],
  ];

  if (patient.primary_care_physician) {
    demographicsData.push(
      [],
      ['MÉDECIN TRAITANT'],
      ['Nom', formatDoctorName(patient.primary_care_physician.user_profile?.full_name)],
      ['Spécialisation', patient.primary_care_physician.specialization || 'N/A'],
      ['Numéro de Licence', patient.primary_care_physician.license_number || 'N/A'],
      ['Tarif Consultation', patient.primary_care_physician.consultation_fee ? `${patient.primary_care_physician.consultation_fee} CDF` : 'N/A']
    );
  }

  const demographicsSheet = XLSX.utils.aoa_to_sheet(demographicsData);
  demographicsSheet['!cols'] = [{ width: 25 }, { width: 40 }];
  XLSX.utils.book_append_sheet(workbook, demographicsSheet, 'Informations');

  if (insIdentity) {
    const insData = [
      ['IDENTITÉ INS'],
      [],
      ['Numéro INS', insIdentity.ins_number || 'N/A'],
      ['Matricule INS-C', insIdentity.ins_c_matricule || 'N/A'],
      ['OID', insIdentity.oid || 'N/A'],
      ['Statut de Qualification', insIdentity.qualification_status || 'N/A'],
      ['Date de Validation', insIdentity.validation_date ? new Date(insIdentity.validation_date).toLocaleDateString('fr-FR') : 'N/A'],
      ['Validé par', insIdentity.validated_by || 'N/A'],
      ['Organisation Émettrice', insIdentity.issuing_organization || 'N/A'],
      ['OID de l\'Organisation', insIdentity.issuing_organization_oid || 'N/A'],
      ['Méthode de Vérification', insIdentity.verification_method || 'N/A'],
      ['Date de Dernière Vérification', insIdentity.last_verification_date ? new Date(insIdentity.last_verification_date).toLocaleDateString('fr-FR') : 'N/A'],
      ['Notes de Vérification', insIdentity.verification_notes || 'N/A'],
    ];

    const insSheet = XLSX.utils.aoa_to_sheet(insData);
    insSheet['!cols'] = [{ width: 30 }, { width: 40 }];
    XLSX.utils.book_append_sheet(workbook, insSheet, 'Identité INS');
  }

  if (allergies && allergies.length > 0) {
    const allergyHeaders = [
      ['ALLERGIES ET INTOLÉRANCES'],
      [],
      ['Allergène', 'Type', 'Sévérité', 'Statut', 'Réaction', 'Date Première Occurrence', 'Date Dernière Occurrence', 'Notes Cliniques']
    ];

    const allergyRows = allergies.map(allergy => [
      allergy.allergen_name,
      allergy.allergy_type,
      allergy.severity,
      allergy.status,
      allergy.reaction_description || 'N/A',
      allergy.first_occurrence_date ? new Date(allergy.first_occurrence_date).toLocaleDateString('fr-FR') : 'N/A',
      allergy.last_occurrence_date ? new Date(allergy.last_occurrence_date).toLocaleDateString('fr-FR') : 'N/A',
      allergy.clinical_notes || 'N/A'
    ]);

    const allergyData = [...allergyHeaders, ...allergyRows];
    const allergySheet = XLSX.utils.aoa_to_sheet(allergyData);
    allergySheet['!cols'] = [
      { width: 20 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 25 },
      { width: 18 },
      { width: 18 },
      { width: 30 }
    ];
    XLSX.utils.book_append_sheet(workbook, allergySheet, 'Allergies');
  }

  if (medicalHistory && medicalHistory.length > 0) {
    const historyHeaders = [
      ['ANTÉCÉDENTS MÉDICAUX'],
      [],
      ['Condition', 'Code ICD-10', 'Description ICD-10', 'Code SNOMED', 'Date Diagnostic', 'Date Résolution', 'Statut', 'Sévérité', 'Notes Cliniques', 'Traitement Actuel']
    ];

    const historyRows = medicalHistory.map(history => [
      history.condition_name,
      history.icd10_code || 'N/A',
      history.icd10_description || 'N/A',
      history.snomed_code || 'N/A',
      history.diagnosis_date ? new Date(history.diagnosis_date).toLocaleDateString('fr-FR') : 'N/A',
      history.resolution_date ? new Date(history.resolution_date).toLocaleDateString('fr-FR') : 'N/A',
      history.status,
      history.severity || 'N/A',
      history.clinical_notes || 'N/A',
      history.treatment_current || 'N/A'
    ]);

    const historyData = [...historyHeaders, ...historyRows];
    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    historySheet['!cols'] = [
      { width: 25 },
      { width: 12 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 35 },
      { width: 30 }
    ];
    XLSX.utils.book_append_sheet(workbook, historySheet, 'Antécédents');
  }

  if (consultations && consultations.length > 0) {
    const consultationHeaders = [
      ['HISTORIQUE DES CONSULTATIONS'],
      [],
      ['Date', 'Motif de Consultation', 'Diagnostic', 'Plan de Traitement', 'Médecin', 'Spécialisation', 'Date de Suivi']
    ];

    const consultationRows = consultations.map(consultation => [
      new Date(consultation.consultation_date).toLocaleDateString('fr-FR'),
      consultation.chief_complaint || 'N/A',
      consultation.diagnosis || 'N/A',
      consultation.treatment_plan || 'N/A',
      formatDoctorName((consultation as any).doctor?.user_profile?.full_name),
      (consultation as any).doctor?.specialization || 'N/A',
      consultation.follow_up_date ? new Date(consultation.follow_up_date).toLocaleDateString('fr-FR') : 'N/A'
    ]);

    const consultationData = [...consultationHeaders, ...consultationRows];
    const consultationSheet = XLSX.utils.aoa_to_sheet(consultationData);
    consultationSheet['!cols'] = [
      { width: 15 },
      { width: 30 },
      { width: 35 },
      { width: 35 },
      { width: 20 },
      { width: 20 },
      { width: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, consultationSheet, 'Consultations');
  }

  const summaryData = [
    ['RÉSUMÉ DU DOSSIER PATIENT'],
    [],
    ['Patient', `${patient.first_name} ${patient.last_name} (${patient.patient_number})`],
    ['Âge', `${calculateAge(patient.date_of_birth)} ans`],
    ['Groupe Sanguin', patient.blood_group || 'Non spécifié'],
    [],
    ['STATISTIQUES'],
    ['Nombre d\'allergies documentées', allergies?.length || 0],
    ['Nombre d\'antécédents médicaux', medicalHistory?.length || 0],
    ['Nombre de consultations', consultations?.length || 0],
    ['Médecin Traitant', patient.primary_care_physician?.user_profile?.full_name ? formatDoctorName(patient.primary_care_physician.user_profile.full_name) : 'Non assigné'],
    [],
    ['CONFORMITÉ'],
    ['Identité INS', insIdentity ? 'Documentée' : 'Non documentée'],
    ['Statut INS', insIdentity?.qualification_status || 'N/A'],
    [],
    ['MÉTADONNÉES'],
    ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
    ['Heure d\'export', new Date().toLocaleTimeString('fr-FR')],
    ['Système', 'Okapia Hospital Management System'],
    ['Version', '1.0'],
    ['Conformité', 'HAS, CNIL, INS, FHIR R4'],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ width: 35 }, { width: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

  const fileName = `Fiche-Patient-${patient.first_name}-${patient.last_name}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);

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
