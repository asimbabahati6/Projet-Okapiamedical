import { supabase } from '../lib/supabase';
import { MedicalStaff, UserProfile } from '../types/database';
import { formatDoctorName } from './formatDoctorName';

interface DoctorWithWorkload extends MedicalStaff {
  user_profile?: UserProfile;
  patient_count?: number;
}

export async function assignDoctorToPatient(
  preferredDoctorId?: string,
  departmentId?: string
): Promise<string | null> {
  try {
    if (preferredDoctorId) {
      const { data: preferredDoctor, error } = await supabase
        .from('medical_staff')
        .select('id, is_accepting_patients')
        .eq('id', preferredDoctorId)
        .eq('is_accepting_patients', true)
        .maybeSingle();

      if (!error && preferredDoctor) {
        return preferredDoctor.id;
      }
    }

    let query = supabase
      .from('medical_staff')
      .select(`
        *,
        user_profile:user_profiles(
          id,
          full_name,
          department_id
        )
      `)
      .eq('is_accepting_patients', true);

    if (departmentId) {
      query = query.eq('user_profile.department_id', departmentId);
    }

    const { data: availableDoctors, error: doctorsError } = await query;

    if (doctorsError) {
      console.error('Error fetching available doctors:', doctorsError);
      return null;
    }

    if (!availableDoctors || availableDoctors.length === 0) {
      console.warn('No available doctors found');
      return null;
    }

    const doctorsWithWorkload: DoctorWithWorkload[] = [];

    for (const doctor of availableDoctors) {
      const { count, error: countError } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('primary_care_physician_id', doctor.id);

      if (!countError) {
        doctorsWithWorkload.push({
          ...doctor,
          patient_count: count || 0
        });
      } else {
        doctorsWithWorkload.push({
          ...doctor,
          patient_count: 0
        });
      }
    }

    doctorsWithWorkload.sort((a, b) => {
      const loadA = a.patient_count || 0;
      const loadB = b.patient_count || 0;

      if (loadA !== loadB) {
        return loadA - loadB;
      }

      const experienceA = a.years_of_experience || 0;
      const experienceB = b.years_of_experience || 0;
      return experienceB - experienceA;
    });

    const selectedDoctor = doctorsWithWorkload[0];

    console.log(`Assigned doctor: ${formatDoctorName(selectedDoctor.user_profile?.full_name)} (Current patients: ${selectedDoctor.patient_count})`);

    return selectedDoctor.id;

  } catch (error) {
    console.error('Error in assignDoctorToPatient:', error);
    return null;
  }
}

export async function getAvailableDoctorsForAssignment(departmentId?: string): Promise<DoctorWithWorkload[]> {
  try {
    let query = supabase
      .from('medical_staff')
      .select(`
        *,
        user_profile:user_profiles(
          id,
          full_name,
          department_id,
          phone
        )
      `)
      .eq('is_accepting_patients', true);

    if (departmentId) {
      query = query.eq('user_profile.department_id', departmentId);
    }

    const { data: doctors, error } = await query;

    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }

    if (!doctors || doctors.length === 0) {
      return [];
    }

    const doctorsWithWorkload: DoctorWithWorkload[] = [];

    for (const doctor of doctors) {
      const { count, error: countError } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('primary_care_physician_id', doctor.id);

      if (!countError) {
        doctorsWithWorkload.push({
          ...doctor,
          patient_count: count || 0
        });
      } else {
        doctorsWithWorkload.push({
          ...doctor,
          patient_count: 0
        });
      }
    }

    doctorsWithWorkload.sort((a, b) => (a.patient_count || 0) - (b.patient_count || 0));

    return doctorsWithWorkload;

  } catch (error) {
    console.error('Error in getAvailableDoctorsForAssignment:', error);
    return [];
  }
}

export async function reassignDoctor(
  patientId: string,
  newDoctorId: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patients')
      .update({
        primary_care_physician_id: newDoctorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId);

    if (error) {
      console.error('Error reassigning doctor:', error);
      return false;
    }

    console.log(`Patient ${patientId} reassigned to doctor ${newDoctorId}. Reason: ${reason || 'Not specified'}`);

    return true;

  } catch (error) {
    console.error('Error in reassignDoctor:', error);
    return false;
  }
}

export async function getDoctorPatientCount(doctorId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('primary_care_physician_id', doctorId);

    if (error) {
      console.error('Error getting doctor patient count:', error);
      return 0;
    }

    return count || 0;

  } catch (error) {
    console.error('Error in getDoctorPatientCount:', error);
    return 0;
  }
}
