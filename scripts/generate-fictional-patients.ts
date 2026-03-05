import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env file manually
const envPath = resolve(process.cwd(), '.env');
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('Error reading .env file:', error);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FIRST_NAMES_MALE = [
  'Jean', 'Pierre', 'André', 'François', 'Jacques', 'Marcel', 'Antoine', 'Michel',
  'Joseph', 'Emmanuel', 'David', 'Daniel', 'Thomas', 'Paul', 'Marc'
];

const FIRST_NAMES_FEMALE = [
  'Marie', 'Jeanne', 'Anne', 'Sophie', 'Claire', 'Catherine', 'Élise', 'Françoise',
  'Lucie', 'Charlotte', 'Isabelle', 'Hélène', 'Nathalie', 'Émilie', 'Céline'
];

const LAST_NAMES = [
  'Mwanza', 'Kabila', 'Tshisekedi', 'Mobutu', 'Lumumba', 'Kasongo', 'Mukendi',
  'Nkulu', 'Ilunga', 'Kalala', 'Mulamba', 'Ndala', 'Kabongo', 'Mpiana', 'Kikwit',
  'Luboya', 'Muteba', 'Kamanda', 'Ngoy', 'Kayembe'
];

const CITIES = [
  'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani', 'Goma',
  'Bukavu', 'Matadi', 'Kolwezi', 'Kikwit'
];

const STREETS = [
  'Avenue Kasa-Vubu', 'Boulevard du 30 Juin', 'Avenue de la Libération', 'Rue Tabora',
  'Avenue Wagenia', 'Rue Lukusa', 'Avenue Sendwe', 'Boulevard Lumumba',
  'Rue Colonel Ebeya', 'Avenue Kabinda', 'Rue Kisangani', 'Avenue Mobutu'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const ALLERGIES = [
  ['Pénicilline', 'Arachides'],
  ['Lactose'],
  ['Pollen', 'Acariens'],
  ['Aspirine'],
  ['Fruits de mer'],
  ['Œufs'],
  ['Poussière'],
  []
];

const CHRONIC_CONDITIONS = [
  ['Hypertension'],
  ['Diabète Type 2'],
  ['Asthme'],
  ['Hypertension', 'Diabète Type 2'],
  ['Arthrite'],
  [],
  ['Migraine chronique'],
  []
];

const MEDICATIONS = [
  ['Amlodipine 10mg - 1x par jour', 'Aspirine 100mg - 1x par jour'],
  ['Metformine 500mg - 2x par jour'],
  ['Ventoline - au besoin'],
  ['Losartan 50mg - 1x par jour'],
  ['Ibuprofène 400mg - au besoin'],
  [],
  ['Paracétamol 500mg - au besoin'],
  []
];

const INSURANCE_PROVIDERS = [
  'SONAS', 'Générale Assurances', 'RAWSUR', 'SORAS', 'AXA Congo',
  'Allianz Congo', 'SECOR', 'SOGECA', 'CONGO ASSURANCES', 'Auto-assuré'
];

const RELATIONSHIPS = ['Épouse', 'Époux', 'Mère', 'Père', 'Frère', 'Sœur', 'Fils', 'Fille', 'Ami(e)'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  const prefix = randomElement(['+243 998', '+243 997', '+243 899', '+243 898', '+243 999']);
  return `${prefix} ${randomInt(100, 999)} ${randomInt(100, 999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.fr', 'hotmail.com', 'outlook.com', 'email.com'];
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return `${cleanFirst}.${cleanLast}${randomInt(1, 99)}@${randomElement(domains)}`;
}

function generatePatientNumber(index: number): string {
  const base = 6041001 + index;
  return `PAT-${base}`;
}

function generateAddress(): string {
  const number = randomInt(10, 999);
  return `${randomElement(STREETS)} ${number}`;
}

async function generateFictionalPatients() {
  console.log('🏥 Starting fictional patient generation...\n');

  try {
    // First, get available medical staff to assign as primary care physicians
    const { data: medicalStaff, error: staffError } = await supabase
      .from('medical_staff')
      .select('id, user_profile:user_profiles(full_name)')
      .limit(10);

    if (staffError) {
      console.error('Error fetching medical staff:', staffError);
      throw staffError;
    }

    if (!medicalStaff || medicalStaff.length === 0) {
      console.log('⚠️  No medical staff found. Patients will be created without primary care physicians.');
    } else {
      console.log(`✓ Found ${medicalStaff.length} medical staff members\n`);
    }

    const patients = [];
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 85, 0, 1);
    const maxDate = new Date(today.getFullYear() - 18, 11, 31);

    for (let i = 0; i < 20; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const firstName = gender === 'male'
        ? randomElement(FIRST_NAMES_MALE)
        : randomElement(FIRST_NAMES_FEMALE);
      const lastName = randomElement(LAST_NAMES);
      const dateOfBirth = randomDate(minDate, maxDate);
      const city = randomElement(CITIES);

      const patient = {
        patient_number: generatePatientNumber(i),
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
        gender,
        blood_group: randomElement(BLOOD_GROUPS),
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        address: generateAddress(),
        city,
        emergency_contact_name: `${randomElement(gender === 'male' ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE)} ${randomElement(LAST_NAMES)}`,
        emergency_contact_phone: generatePhone(),
        emergency_contact_relationship: randomElement(RELATIONSHIPS),
        insurance_provider: randomElement(INSURANCE_PROVIDERS),
        insurance_number: `INS-${randomInt(100000, 999999)}`,
        allergies: randomElement(ALLERGIES),
        chronic_conditions: randomElement(CHRONIC_CONDITIONS),
        primary_care_physician_id: medicalStaff && medicalStaff.length > 0
          ? randomElement(medicalStaff).id
          : null,
      };

      patients.push(patient);
    }

    // Insert patients in batch
    console.log('💾 Inserting 20 fictional patients into database...\n');

    const { data: insertedPatients, error: insertError } = await supabase
      .from('patients')
      .insert(patients)
      .select();

    if (insertError) {
      console.error('❌ Error inserting patients:', insertError);
      throw insertError;
    }

    console.log('✅ Successfully inserted 20 fictional patients!\n');
    console.log('📊 Summary Report:\n');
    console.log('═'.repeat(80));

    insertedPatients?.forEach((patient, index) => {
      const age = Math.floor((today.getTime() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      console.log(`\n${index + 1}. ${patient.first_name} ${patient.last_name}`);
      console.log(`   Patient Number: ${patient.patient_number}`);
      console.log(`   Age: ${age} years | Gender: ${patient.gender === 'male' ? 'Male' : 'Female'} | Blood: ${patient.blood_group}`);
      console.log(`   Phone: ${patient.phone}`);
      console.log(`   Email: ${patient.email}`);
      console.log(`   Address: ${patient.address}, ${patient.city}`);
      console.log(`   Insurance: ${patient.insurance_provider} (${patient.insurance_number})`);
      console.log(`   Emergency Contact: ${patient.emergency_contact_name} (${patient.emergency_contact_relationship})`);
      console.log(`   Emergency Phone: ${patient.emergency_contact_phone}`);
      if (patient.allergies && patient.allergies.length > 0) {
        console.log(`   Allergies: ${patient.allergies.join(', ')}`);
      }
      if (patient.chronic_conditions && patient.chronic_conditions.length > 0) {
        console.log(`   Chronic Conditions: ${patient.chronic_conditions.join(', ')}`);
      }
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Patient generation completed successfully!');
    console.log(`📍 Total patients created: ${insertedPatients?.length || 0}`);

  } catch (error) {
    console.error('\n❌ Fatal error during patient generation:', error);
    process.exit(1);
  }
}

// Run the script
generateFictionalPatients()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
