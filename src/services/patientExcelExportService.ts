import * as XLSX from 'xlsx';
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
  created_at: string;
}

interface ConsultationData {
  consultation_date: string;
  doctor_name: string;
  reason: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
}

interface AllergyData {
  allergen: string;
  severity: string;
  reaction: string | null;
  diagnosed_date: string | null;
}

interface MedicalHistoryData {
  condition: string;
  diagnosed_date: string | null;
  status: string;
  notes: string | null;
}

export async function exportSinglePatientToExcel(patientId: string): Promise<void> {
  try {
    const patient = await fetchPatientData(patientId);
    const consultations = await fetchConsultations(patientId);
    const allergies = await fetchAllergies(patientId);
    const medicalHistory = await fetchMedicalHistory(patientId);
    const physician = patient.primary_care_physician_id
      ? await fetchPhysician(patient.primary_care_physician_id)
      : null;

    const workbook = XLSX.utils.book_new();

    createGeneralInfoSheet(workbook, patient, physician);
    createConsultationsSheet(workbook, consultations);
    createMedicalHistorySheet(workbook, allergies, medicalHistory);

    const fileName = `Patient_${patient.patient_number}_${formatDateForFilename(new Date())}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Error exporting patient to Excel:', error);
    throw new Error('Erreur lors de la génération du fichier Excel. Veuillez réessayer.');
  }
}

export async function exportAllPatientsToExcel(filters?: {
  search?: string;
  bloodType?: string;
  gender?: string;
}): Promise<void> {
  try {
    const patients = await fetchAllPatients(filters);

    const workbook = XLSX.utils.book_new();

    const worksheetData = [
      [
        'N° Patient',
        'Nom Complet',
        'Âge',
        'Genre',
        'Groupe Sanguin',
        'Téléphone',
        'Email',
        'Ville',
        'Médecin Référent',
        'Spécialité Médecin',
        'Département Médecin',
        'Téléphone Médecin',
        'Email Médecin',
        'Date d\'inscription',
        'Dernière Consultation'
      ]
    ];

    for (const patient of patients) {
      const age = calculateAge(patient.date_of_birth);
      const gender = formatGender(patient.gender);
      const fullName = `${patient.first_name} ${patient.last_name}`;
      const lastConsultation = await getLastConsultationDate(patient.id);

      worksheetData.push([
        patient.patient_number,
        fullName,
        age.toString(),
        gender,
        patient.blood_type || 'Non renseigné',
        patient.phone,
        patient.email || 'Non renseigné',
        patient.city || 'Non renseigné',
        patient.physician_name || 'Non assigné',
        patient.physician_specialization || 'Non spécifié',
        patient.physician_department || 'Non assigné',
        patient.physician_phone || 'Non renseigné',
        patient.physician_email || 'Non renseigné',
        formatDate(new Date(patient.created_at)),
        lastConsultation ? formatDate(new Date(lastConsultation)) : 'Aucune'
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 8 },
      { wch: 10 },
      { wch: 15 },
      { wch: 18 },
      { wch: 30 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 30 },
      { wch: 18 },
      { wch: 20 }
    ];

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const bloodTypeCell = 'E' + (R + 1);
      const lastConsultCell = 'K' + (R + 1);

      if (worksheet[bloodTypeCell]) {
        const value = worksheet[bloodTypeCell].v;
        if (value && value !== 'Non renseigné') {
          worksheet[bloodTypeCell].s = {
            fill: { fgColor: { rgb: getBloodTypeColor(value) } },
            alignment: { horizontal: 'center' }
          };
        }
      }

      if (worksheet[lastConsultCell]) {
        const value = worksheet[lastConsultCell].v;
        if (value === 'Aucune' || isOlderThanOneYear(value)) {
          worksheet[lastConsultCell].s = {
            fill: { fgColor: { rgb: 'FEE2E2' } },
            font: { color: { rgb: 'DC2626' } }
          };
        }
      }
    }

    worksheet['!autofilter'] = { ref: `A1:K${worksheetData.length}` };
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liste Patients');

    const totalRow = worksheetData.length + 2;
    const summaryData = [
      [],
      ['STATISTIQUES GÉNÉRALES'],
      ['Total de patients:', patients.length.toString()],
      ['Exporté le:', formatDateTime(new Date())]
    ];

    const summaryStartRow = worksheetData.length + 1;
    summaryData.forEach((row, index) => {
      const rowIndex = summaryStartRow + index;
      row.forEach((cell, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        worksheet[cellAddress] = { v: cell, t: 's' };
      });
    });

    const fileName = `Patients_Complet_${formatDateForFilename(new Date())}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Error exporting all patients to Excel:', error);
    throw new Error('Erreur lors de la génération du fichier Excel. Veuillez réessayer.');
  }
}

function createGeneralInfoSheet(
  workbook: XLSX.WorkBook,
  patient: PatientData,
  physician: { name: string; specialization: string | null; rpps_number: string | null } | null
): void {
  const age = calculateAge(patient.date_of_birth);
  const gender = formatGender(patient.gender);

  const data = [
    ['OKAPIA Medical - Fiche Patient'],
    [],
    ['INFORMATIONS PERSONNELLES'],
    ['N° Patient', patient.patient_number],
    ['Nom', patient.first_name],
    ['Prénom', patient.last_name],
    ['Date de naissance', formatDate(new Date(patient.date_of_birth))],
    ['Âge', `${age} ans`],
    ['Genre', gender],
    ['Groupe sanguin', patient.blood_type || 'Non renseigné'],
    [],
    ['COORDONNÉES'],
    ['Téléphone', patient.phone],
    ['Email', patient.email || 'Non renseigné'],
    ['Adresse', patient.address || 'Non renseigné'],
    ['Ville', patient.city || 'Non renseigné'],
    []
  ];

  if (physician) {
    data.push(
      ['MÉDECIN RÉFÉRENT'],
      ['Nom', `Dr. ${physician.name}`],
      ['Spécialité', physician.specialization || 'Non spécifié'],
      ['N° RPPS', physician.rpps_number || 'Non renseigné'],
      []
    );
  }

  data.push(
    ['INFORMATIONS SYSTÈME'],
    ['Date d\'inscription', formatDate(new Date(patient.created_at))],
    ['Document généré le', formatDateTime(new Date())]
  );

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [{ wch: 25 }, { wch: 40 }];

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    const cellA = 'A' + (R + 1);
    const cellB = 'B' + (R + 1);

    if (worksheet[cellA] && !worksheet[cellB]) {
      worksheet[cellA].s = {
        font: { bold: true, sz: 12, color: { rgb: '1F2937' } },
        fill: { fgColor: { rgb: 'F3F4F6' } }
      };
    } else if (worksheet[cellA] && worksheet[cellB]) {
      worksheet[cellA].s = {
        font: { bold: true },
        alignment: { horizontal: 'right' }
      };
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Informations Générales');
}

function createConsultationsSheet(
  workbook: XLSX.WorkBook,
  consultations: ConsultationData[]
): void {
  const data = [
    ['Date', 'Médecin', 'Motif', 'Diagnostic', 'Traitement', 'Notes']
  ];

  if (consultations.length === 0) {
    data.push(['Aucune consultation enregistrée', '', '', '', '', '']);
  } else {
    consultations.forEach(consultation => {
      data.push([
        formatDate(new Date(consultation.consultation_date)),
        consultation.doctor_name,
        consultation.reason,
        consultation.diagnosis || '-',
        consultation.treatment || '-',
        consultation.notes || '-'
      ]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 30 },
    { wch: 35 },
    { wch: 40 }
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2563EB' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  if (consultations.length > 0) {
    worksheet['!autofilter'] = { ref: `A1:F${data.length}` };
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultations');
}

function createMedicalHistorySheet(
  workbook: XLSX.WorkBook,
  allergies: AllergyData[],
  medicalHistory: MedicalHistoryData[]
): void {
  const data: any[][] = [
    ['ALLERGIES'],
    []
  ];

  if (allergies.length === 0) {
    data.push(['Aucune allergie enregistrée']);
  } else {
    data.push(['Allergène', 'Sévérité', 'Réaction', 'Date de diagnostic']);
    allergies.forEach(allergy => {
      data.push([
        allergy.allergen,
        allergy.severity,
        allergy.reaction || '-',
        allergy.diagnosed_date ? formatDate(new Date(allergy.diagnosed_date)) : '-'
      ]);
    });
  }

  data.push([]);
  data.push(['CONDITIONS MÉDICALES']);
  data.push([]);

  if (medicalHistory.length === 0) {
    data.push(['Aucun antécédent médical enregistré']);
  } else {
    data.push(['Condition', 'Date de diagnostic', 'Statut', 'Notes']);
    medicalHistory.forEach(history => {
      data.push([
        history.condition,
        history.diagnosed_date ? formatDate(new Date(history.diagnosed_date)) : '-',
        history.status,
        history.notes || '-'
      ]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 25 },
    { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historique Médical');
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
    .order('consultation_date', { ascending: false });

  if (error) throw error;

  return data.map(consultation => ({
    consultation_date: consultation.consultation_date,
    doctor_name: consultation.doctor?.user_profile?.full_name || 'Non spécifié',
    reason: consultation.reason,
    diagnosis: consultation.diagnosis,
    treatment: consultation.treatment,
    notes: consultation.notes
  }));
}

async function fetchAllergies(patientId: string): Promise<AllergyData[]> {
  const { data, error } = await supabase
    .from('patient_allergies')
    .select('allergen, severity, reaction, diagnosed_date')
    .eq('patient_id', patientId)
    .order('diagnosed_date', { ascending: false });

  if (error) return [];
  return data || [];
}

async function fetchMedicalHistory(patientId: string): Promise<MedicalHistoryData[]> {
  const { data, error } = await supabase
    .from('patient_medical_history')
    .select('condition, diagnosed_date, status, notes')
    .eq('patient_id', patientId)
    .order('diagnosed_date', { ascending: false });

  if (error) return [];
  return data || [];
}

async function fetchPhysician(physicianId: string): Promise<{ name: string; specialization: string | null; rpps_number: string | null } | null> {
  const { data, error } = await supabase
    .from('medical_staff')
    .select(`
      rpps_number,
      specialization,
      user_profile:user_profiles(full_name)
    `)
    .eq('id', physicianId)
    .single();

  if (error) return null;

  return {
    name: data.user_profile?.full_name || 'Non spécifié',
    specialization: data.specialization,
    rpps_number: data.rpps_number
  };
}

async function fetchAllPatients(filters?: {
  search?: string;
  bloodType?: string;
  gender?: string;
}): Promise<any[]> {
  let query = supabase
    .from('patients')
    .select(`
      *,
      physician:medical_staff!primary_care_physician_id(
        specialization,
        user_profile:user_profiles(
          full_name,
          email,
          phone,
          department_id,
          departments(name)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,patient_number.ilike.%${filters.search}%`);
  }

  if (filters?.bloodType) {
    query = query.eq('blood_type', filters.bloodType);
  }

  if (filters?.gender) {
    query = query.eq('gender', filters.gender);
  }

  const { data, error } = await query.limit(1000);

  if (error) throw error;

  return data.map(patient => ({
    ...patient,
    physician_name: patient.physician?.user_profile?.full_name || null,
    physician_specialization: patient.physician?.specialization || null,
    physician_department: patient.physician?.user_profile?.departments?.name || null,
    physician_phone: patient.physician?.user_profile?.phone || null,
    physician_email: patient.physician?.user_profile?.email || null
  }));
}

async function getLastConsultationDate(patientId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('consultations')
    .select('consultation_date')
    .eq('patient_id', patientId)
    .order('consultation_date', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data?.consultation_date || null;
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

function formatGender(gender: string): string {
  const genderMap: { [key: string]: string } = {
    male: 'Homme',
    female: 'Femme',
    other: 'Autre'
  };
  return genderMap[gender] || gender;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr} à ${hours}:${minutes}`;
}

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function getBloodTypeColor(bloodType: string): string {
  const colors: { [key: string]: string } = {
    'A+': 'FEE2E2',
    'A-': 'FECACA',
    'B+': 'DBEAFE',
    'B-': 'BFDBFE',
    'AB+': 'FCE7F3',
    'AB-': 'FBCFE8',
    'O+': 'D1FAE5',
    'O-': 'A7F3D0'
  };
  return colors[bloodType] || 'F3F4F6';
}

function isOlderThanOneYear(dateStr: string): boolean {
  if (!dateStr || dateStr === 'Aucune') return false;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return false;

  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return date < oneYearAgo;
}
