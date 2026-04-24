import { supabase } from '../lib/supabase';
import { PatientStatus } from '../types/database';

export async function checkPatientStatus(patientId: string): Promise<PatientStatus> {
  try {
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('primary_care_physician_id')
      .eq('id', patientId)
      .maybeSingle();

    if (patientError) {
      console.error('Error fetching patient:', patientError);
      throw patientError;
    }

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, appointment_date, status')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    const completedAppointments = appointments?.filter(
      app => app.status === 'completed'
    ) || [];

    const isNewPatient = !appointments || appointments.length === 0;
    const totalVisits = completedAppointments.length;
    const lastVisitDate = completedAppointments.length > 0
      ? completedAppointments[0].appointment_date
      : null;

    return {
      isNewPatient,
      primaryCarePhysicianId: patient?.primary_care_physician_id || null,
      lastVisitDate,
      totalVisits
    };
  } catch (error) {
    console.error('Error in checkPatientStatus:', error);
    return {
      isNewPatient: true,
      primaryCarePhysicianId: null,
      lastVisitDate: null,
      totalVisits: 0
    };
  }
}

export async function getReceptionists(): Promise<any[]> {
  try {
    const { data: receptionists, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        phone,
        role:roles(name)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching receptionists:', error);
      return [];
    }

    return receptionists?.filter(user => user.role?.name === 'receptionist') || [];
  } catch (error) {
    console.error('Error in getReceptionists:', error);
    return [];
  }
}

export function getRoutingType(
  isNewPatient: boolean,
  hasManualOverride: boolean,
  hasPrimaryCarePhysician: boolean
): 'new_patient_to_reception' | 'existing_patient_to_pcp' | 'manual_override' {
  if (hasManualOverride) {
    return 'manual_override';
  }

  if (isNewPatient) {
    return 'new_patient_to_reception';
  }

  if (hasPrimaryCarePhysician) {
    return 'existing_patient_to_pcp';
  }

  return 'manual_override';
}
