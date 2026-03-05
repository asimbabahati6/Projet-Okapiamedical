import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxxyvjrgbdpsttizkitl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4eHl2anJnYmRwc3R0aXpraXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODg3MzMsImV4cCI6MjA3NjQ2NDczM30.-QpzFoGD-nfGC_K-CJoSEPSN_akA3QrlwjwPGj3JabI';

const supabase = createClient(supabaseUrl, supabaseKey);

const frenchNames = {
  firstNames: ['Jean', 'Marie', 'Paul', 'Sophie', 'André', 'Claire', 'David', 'Emma', 'Pierre', 'Isabelle', 'François', 'Caroline', 'Michel', 'Nathalie', 'Philippe', 'Valérie', 'Jacques', 'Sylvie', 'Antoine', 'Martine'],
  lastNames: ['Dupont', 'Martin', 'Bernard', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier']
};

const congoNames = {
  firstNames: ['Koffi', 'Mbala', 'Lukeni', 'Kabila', 'Tshisekedi', 'Lumumba', 'Mobutu', 'Kimbangu', 'Kasai', 'Mbuyi', 'Ngoma', 'Kalala', 'Nzuzi', 'Bakwa', 'Lubaki', 'Mpiana', 'Ndombe', 'Kilolo', 'Banza', 'Mutombo'],
  lastNames: ['Mukendi', 'Ntumba', 'Kayembe', 'Mwamba', 'Ilunga', 'Kabongo', 'Tshombe', 'Mulamba', 'Nkulu', 'Kabeya', 'Kabila', 'Kazadi', 'Tshilombo', 'Mujinga', 'Kamanda', 'Nkashama', 'Tshimanga', 'Kabamba', 'Kanyama', 'Ngandu']
};

const arabicNames = {
  firstNames: ['Mohammed', 'Fatima', 'Ahmed', 'Aisha', 'Ali', 'Khadija', 'Omar', 'Zainab', 'Youssef', 'Mariam', 'Hassan', 'Layla', 'Ibrahim', 'Amina', 'Abdullah', 'Nour', 'Karim', 'Salma', 'Tariq', 'Yasmin'],
  lastNames: ['Al-Hashimi', 'Ben Ali', 'El-Sayed', 'Al-Mansour', 'Ben Omar', 'El-Aziz', 'Al-Rahman', 'Ben Youssef', 'El-Khalil', 'Al-Rashid', 'Ben Hassan', 'El-Amin', 'Al-Qadir', 'Ben Ibrahim', 'El-Mahdi', 'Al-Hakim', 'Ben Mohammed', 'El-Farouq', 'Al-Karim', 'Ben Ahmed']
};

const reasons = {
  Dentisterie: [
    'Douleur dentaire sévère', 'Nettoyage dentaire de routine', 'Extraction dentaire', 'Pose de couronne', 'Traitement de carie',
    'Consultation orthodontique', 'Blanchiment des dents', 'Implant dentaire', 'Douleur gingivale', 'Urgence dentaire',
    'Contrôle post-opératoire', 'Détartrage', 'Traitement de canal', 'Prothèse dentaire', 'Consultation esthétique',
    'Dent cassée', 'Sensibilité dentaire', 'Abcès dentaire', 'Saignement gingival', 'Ajustement d\'appareil'
  ],
  Radiographie: [
    'Radiographie pulmonaire', 'Échographie abdominale', 'Scanner thoracique', 'IRM cérébrale', 'Mammographie',
    'Radiographie osseuse', 'Échographie cardiaque', 'Scanner abdominal', 'Échographie pelvienne', 'Radiographie dentaire panoramique',
    'Doppler vasculaire', 'Scanner vertébral', 'Échographie thyroïdienne', 'Radiographie des sinus', 'IRM articulaire',
    'Échographie obstétrique', 'Scanner crânien', 'Radiographie articulaire', 'Angiographie', 'Scintigraphie osseuse'
  ],
  'Endoscopie digestive': [
    'Gastroscopie diagnostique', 'Coloscopie de dépistage', 'Endoscopie thérapeutique', 'Biopsie gastrique', 'Polypectomie',
    'Contrôle post-opératoire', 'Recherche H. pylori', 'Investigation hémorragie digestive', 'Surveillance œsophage de Barrett', 'Endoscopie urgente',
    'Dilatation œsophagienne', 'Consultation pré-endoscopique', 'Suivi maladie inflammatoire', 'Retrait corps étranger', 'Ligature varices',
    'Capsule endoscopique', 'Mucosectomie', 'Investigation douleurs abdominales', 'Contrôle ulcère', 'Rectoscopie'
  ],
  Kinésithérapie: [
    'Rééducation post-opératoire', 'Traitement lombalgie', 'Thérapie manuelle', 'Rééducation sportive', 'Massage thérapeutique',
    'Traitement tendinite', 'Rééducation après fracture', 'Traitement sciatique', 'Drainage lymphatique', 'Rééducation neurologique',
    'Thérapie posturale', 'Traitement arthrose', 'Rééducation respiratoire', 'Électrothérapie', 'Traitement entorse',
    'Rééducation périnéale', 'Ultrasons thérapeutiques', 'Traitement canal carpien', 'Rééducation vertébrale', 'Ondes de choc'
  ],
  Consultation: [
    'Consultation générale', 'Bilan de santé', 'Suivi médical', 'Renouvellement ordonnance', 'Certificat médical',
    'Consultation urgente', 'Fièvre persistante', 'Douleurs thoraciques', 'Problème respiratoire', 'Maux de tête sévères',
    'Fatigue chronique', 'Troubles digestifs', 'Hypertension', 'Diabète - suivi', 'Vaccination',
    'Résultats d\'examens', 'Douleurs articulaires', 'Infection urinaire', 'Allergie', 'Bilan pré-opératoire'
  ]
};

const specialRequirements = [
  null, null, null, null, null, null,
  'Besoin d\'un interprète anglais',
  'Besoin d\'un interprète arabe',
  'Accès fauteuil roulant',
  'Allergies: pénicilline',
  'Femme enceinte',
  'Patient diabétique',
  'Besoin d\'assistance',
  'Personne âgée',
  'Enfant en bas âge'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePatient() {
  const nameSource = Math.random() < 0.4 ? frenchNames : Math.random() < 0.7 ? congoNames : arabicNames;
  const firstName = getRandomElement(nameSource.firstNames);
  const lastName = getRandomElement(nameSource.lastNames);
  const patientNumber = `PAT${String(100000 + Math.floor(Math.random() * 900000))}`;
  const phone = `+243 ${String(800 + Math.floor(Math.random() * 99))} ${String(100 + Math.floor(Math.random() * 900))} ${String(100 + Math.floor(Math.random() * 900))}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
  const genders = ['male', 'female', 'other'];
  const gender = getRandomElement(genders);
  const year = 1950 + Math.floor(Math.random() * 60);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const dateOfBirth = `${year}-${month}-${day}`;

  return {
    patient_number: patientNumber,
    first_name: firstName,
    last_name: lastName,
    date_of_birth: dateOfBirth,
    gender,
    phone,
    email,
    address: 'Kinshasa, RDC',
    city: 'Kinshasa',
    blood_group: getRandomElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
  };
}

function generateAppointmentDate() {
  const today = new Date();
  const daysOffset = Math.floor(Math.random() * 120) - 60;
  const appointmentDate = new Date(today);
  appointmentDate.setDate(today.getDate() + daysOffset);
  return appointmentDate.toISOString().split('T')[0];
}

function generateAppointmentTime() {
  const hour = 8 + Math.floor(Math.random() * 12);
  const minute = Math.random() < 0.5 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}:00`;
}

async function main() {
  console.log('🏥 Starting test appointment data generation...\n');

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, name_en, estimated_duration_minutes, department_id')
    .eq('is_active', true);

  if (servicesError || !services || services.length === 0) {
    console.error('❌ Error fetching services:', servicesError);
    return;
  }

  console.log(`✅ Found ${services.length} active services\n`);

  let { data: doctors, error: doctorsError } = await supabase
    .from('medical_staff')
    .select('id, user_profile:user_profiles(department_id)')
    .eq('is_accepting_patients', true)
    .limit(10);

  if (doctorsError) {
    console.error('❌ Error fetching doctors:', doctorsError);
    return;
  }

  if (!doctors || doctors.length === 0) {
    console.log('⚠️  No doctors found, fetching all medical staff...');
    const result = await supabase
      .from('medical_staff')
      .select('id, user_profile:user_profiles(department_id)')
      .limit(10);

    doctors = result.data || [];

    if (doctors.length === 0) {
      console.error('❌ No medical staff found in database');
      return;
    }
  }

  console.log(`✅ Found ${doctors.length} doctors\n`);

  const statuses: Array<'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'> =
    ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

  const appointmentTypes: Array<'in-person' | 'telemedicine'> = ['in-person', 'telemedicine'];

  let totalCreated = 0;

  for (const service of services) {
    const serviceName = service.name || service.name_en || 'Consultation';
    console.log(`\n📋 Generating appointments for service: ${serviceName}`);

    const serviceReasons = reasons[serviceName as keyof typeof reasons] || reasons['Consultation'];

    for (let i = 0; i < 20; i++) {
      try {
        const patient = generatePatient();
        const { data: createdPatient, error: patientError } = await supabase
          .from('patients')
          .insert([patient])
          .select()
          .single();

        if (patientError) {
          console.error(`  ⚠️  Patient creation error: ${patientError.message}`);
          continue;
        }

        const doctor = getRandomElement(doctors);
        const appointmentDate = generateAppointmentDate();
        const appointmentTime = generateAppointmentTime();
        const status = getRandomElement(statuses);
        const appointmentType = getRandomElement(appointmentTypes);
        const reason = getRandomElement(serviceReasons);
        const specialReq = getRandomElement(specialRequirements);
        const estimatedDuration = service.estimated_duration_minutes || 30;

        const appointment = {
          patient_id: createdPatient.id,
          doctor_id: doctor.id,
          department_id: service.department_id,
          service_id: service.id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status,
          appointment_type: appointmentType,
          reason,
          special_requirements: specialReq,
          estimated_duration: estimatedDuration,
          preferred_language: getRandomElement(['fr', 'en', 'ar']),
          appointment_number: `APT${String(100000 + totalCreated)}`
        };

        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert([appointment]);

        if (appointmentError) {
          console.error(`  ⚠️  Appointment creation error: ${appointmentError.message}`);
        } else {
          totalCreated++;
          if ((i + 1) % 5 === 0) {
            console.log(`  ✓ Created ${i + 1}/20 appointments`);
          }
        }
      } catch (error) {
        console.error(`  ⚠️  Unexpected error:`, error);
      }
    }
  }

  console.log(`\n\n🎉 Successfully created ${totalCreated} test appointments!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - ${services.length} services processed`);
  console.log(`   - ${totalCreated} appointments created`);
  console.log(`   - ${totalCreated} patients created`);
}

main().catch(console.error);
