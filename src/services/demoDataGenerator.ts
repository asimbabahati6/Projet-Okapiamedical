import { supabase } from '../lib/supabase';
import { generateCongoleseFullName, generatePhone, generateAddress } from '../utils/congoleseNames';
import { selectRandomService, generateServicePrice } from '../utils/medicalServiceTypes';

interface DemoPatient {
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  phone: string;
  address: string;
  city: string;
}

interface DemoInvoice {
  invoice_number: string;
  patient_id: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'pending' | 'paid';
  payment_method: string | null;
  payment_date: string | null;
  notes: string;
  created_at: string;
}

export async function generateDemoDataset(): Promise<{
  patients: number;
  invoices: number;
  totalRevenue: number;
  success: boolean;
  error?: string;
}> {
  try {
    console.log('Starting demo dataset generation...');

    const patients = generateDemoPatients(40);
    console.log(`Generated ${patients.length} demo patients`);

    const insertedPatients = await insertPatientsToSupabase(patients);
    console.log(`Inserted ${insertedPatients.length} patients to Supabase`);

    if (insertedPatients.length === 0) {
      throw new Error('Failed to insert patients');
    }

    const invoices = generateDemoInvoices(insertedPatients, 150);
    console.log(`Generated ${invoices.length} demo invoices`);

    const insertedInvoices = await insertInvoicesToSupabase(invoices);
    console.log(`Inserted ${insertedInvoices.length} invoices to Supabase`);

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    return {
      patients: insertedPatients.length,
      invoices: insertedInvoices.length,
      totalRevenue,
      success: true
    };

  } catch (error: any) {
    console.error('Error generating demo dataset:', error);
    return {
      patients: 0,
      invoices: 0,
      totalRevenue: 0,
      success: false,
      error: error.message
    };
  }
}

function generateDemoPatients(count: number): DemoPatient[] {
  const patients: DemoPatient[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let fullName = generateCongoleseFullName();

    while (usedNames.has(fullName)) {
      fullName = generateCongoleseFullName();
    }
    usedNames.add(fullName);

    const [lastName, ...firstNameParts] = fullName.split(' ');
    const firstName = firstNameParts.join(' ');

    const age = 18 + Math.floor(Math.random() * 60);
    const birthYear = 2024 - age;
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;

    patients.push({
      patient_number: `P-2024-${String(i + 1).padStart(4, '0')}`,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      phone: generatePhone(),
      address: generateAddress(),
      city: 'Kinshasa'
    });
  }

  return patients;
}

async function insertPatientsToSupabase(patients: DemoPatient[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('patients')
    .insert(patients)
    .select('id, patient_number, first_name, last_name');

  if (error) {
    console.error('Error inserting patients:', error);
    return [];
  }

  return data || [];
}

function generateDemoInvoices(patients: any[], totalCount: number): DemoInvoice[] {
  const invoices: DemoInvoice[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-06-30');
  const dateRange = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < totalCount; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const service = selectRandomService();
    const amount = generateServicePrice(service);

    const invoiceDate = new Date(startDate.getTime() + Math.random() * dateRange);

    const isPaid = Math.random() < 0.70;

    let paymentDate = null;
    let paidAmount = 0;
    let balance = amount;
    let status: 'pending' | 'paid' = 'pending';
    let paymentMethod = null;

    if (isPaid) {
      const daysDelay = Math.floor(Math.random() * 30);
      paymentDate = new Date(invoiceDate);
      paymentDate.setDate(paymentDate.getDate() + daysDelay);

      paidAmount = amount;
      balance = 0;
      status = 'paid';
      paymentMethod = ['Espèces', 'Carte bancaire', 'Mobile Money', 'Virement'][Math.floor(Math.random() * 4)];
    }

    invoices.push({
      invoice_number: `FAC-2024-${String(i + 1).padStart(4, '0')}`,
      patient_id: patient.id,
      total_amount: amount,
      paid_amount: paidAmount,
      balance: balance,
      status: status,
      payment_method: paymentMethod,
      payment_date: paymentDate ? paymentDate.toISOString() : null,
      notes: `${service.name} - ${service.code}`,
      created_at: invoiceDate.toISOString()
    });
  }

  return invoices.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

async function insertInvoicesToSupabase(invoices: DemoInvoice[]): Promise<any[]> {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoices)
    .select('*');

  if (error) {
    console.error('Error inserting invoices:', error);
    return [];
  }

  return data || [];
}

export async function checkDemoDataExists(): Promise<boolean> {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', 'FAC-2024-%')
    .limit(1);

  if (error) {
    console.error('Error checking demo data:', error);
    return false;
  }

  return (data && data.length > 0) || false;
}

export async function deleteDemoData(): Promise<boolean> {
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .like('invoice_number', 'FAC-2024-%');

    if (invoices && invoices.length > 0) {
      await supabase
        .from('invoices')
        .delete()
        .like('invoice_number', 'FAC-2024-%');
    }

    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .like('patient_number', 'P-2024-%');

    if (patients && patients.length > 0) {
      await supabase
        .from('patients')
        .delete()
        .like('patient_number', 'P-2024-%');
    }

    return true;
  } catch (error) {
    console.error('Error deleting demo data:', error);
    return false;
  }
}
