import { supabase } from '../lib/supabase';

export interface GlobalStats {
  totalDoctors: number;
  activeDoctors: number;
  averageOccupancy: number;
  todayAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalPatients: number;
  averagePatientsPerDoctor: number;
}

export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  doctorCount: number;
  patientCount: number;
  appointmentsToday: number;
  appointmentsWeek: number;
  averageOccupancy: number;
  status: 'available' | 'busy' | 'critical';
}

export interface DoctorWorkload {
  doctorId: string;
  doctorName: string;
  specialization: string;
  departmentName: string;
  patientsAssigned: number;
  appointmentsToday: number;
  appointmentsWeek: number;
  appointmentsMonth: number;
  occupancyRate: number;
  averageRating: number;
  totalConsultations: number;
  status: 'available' | 'in_consultation' | 'unavailable';
  isAcceptingPatients: boolean;
}

export interface PatientSummary {
  id: string;
  fullName: string;
  dateOfBirth: string;
  lastVisit?: string;
  totalVisits: number;
  phone?: string;
}

export interface AnalyticsFilters {
  departmentIds?: string[];
  startDate?: string;
  endDate?: string;
  status?: string[];
}

export interface Period {
  start: string;
  end: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export async function getDoctorsGlobalStats(filters?: AnalyticsFilters): Promise<GlobalStats> {
  try {
    const today = new Date().toISOString().split('T')[0];

    let doctorsQuery = supabase
      .from('medical_staff')
      .select('id, is_accepting_patients, current_status');

    const { data: doctors, error: doctorsError } = await doctorsQuery;
    if (doctorsError) throw doctorsError;

    let appointmentsQuery = supabase
      .from('appointments')
      .select('id, status, appointment_date')
      .eq('appointment_date', today);

    if (filters?.departmentIds && filters.departmentIds.length > 0) {
      appointmentsQuery = appointmentsQuery.in('department_id', filters.departmentIds);
    }

    const { data: todayAppointments, error: appointmentsError } = await appointmentsQuery;
    if (appointmentsError) throw appointmentsError;

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, primary_care_physician_id');

    if (patientsError) throw patientsError;

    const totalDoctors = doctors?.length || 0;
    const activeDoctors = doctors?.filter(d => d.current_status === 'available').length || 0;
    const totalAppointments = todayAppointments?.length || 0;
    const confirmedAppointments = todayAppointments?.filter(a => a.status === 'confirmed').length || 0;
    const pendingAppointments = todayAppointments?.filter(a => a.status === 'scheduled').length || 0;
    const completedAppointments = todayAppointments?.filter(a => a.status === 'completed').length || 0;
    const totalPatients = patients?.filter(p => p.primary_care_physician_id).length || 0;

    return {
      totalDoctors,
      activeDoctors,
      averageOccupancy: totalDoctors > 0 ? Math.round((activeDoctors / totalDoctors) * 100) : 0,
      todayAppointments: totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      completedAppointments,
      totalPatients,
      averagePatientsPerDoctor: totalDoctors > 0 ? Math.round(totalPatients / totalDoctors) : 0
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
}

export async function getDepartmentMetrics(departmentId: string, period: Period): Promise<DepartmentMetrics> {
  try {
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', departmentId)
      .single();

    if (deptError) throw deptError;

    const { data: doctors, error: doctorsError } = await supabase
      .from('doctor_departments')
      .select('doctor_id')
      .eq('department_id', departmentId)
      .eq('is_active', true);

    if (doctorsError) throw doctorsError;

    const doctorIds = doctors?.map(d => d.doctor_id) || [];

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .in('primary_care_physician_id', doctorIds);

    if (patientsError) throw patientsError;

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: appointmentsToday, error: todayError } = await supabase
      .from('appointments')
      .select('id')
      .in('doctor_id', doctorIds)
      .eq('appointment_date', today);

    if (todayError) throw todayError;

    const { data: appointmentsWeek, error: weekError } = await supabase
      .from('appointments')
      .select('id')
      .in('doctor_id', doctorIds)
      .gte('appointment_date', weekAgo)
      .lte('appointment_date', today);

    if (weekError) throw weekError;

    const doctorCount = doctorIds.length;
    const appointmentsTodayCount = appointmentsToday?.length || 0;
    const averageOccupancy = doctorCount > 0 ? Math.round((appointmentsTodayCount / (doctorCount * 10)) * 100) : 0;

    let status: 'available' | 'busy' | 'critical' = 'available';
    if (averageOccupancy > 80) status = 'critical';
    else if (averageOccupancy > 60) status = 'busy';

    return {
      departmentId,
      departmentName: department.name,
      doctorCount,
      patientCount: patients?.length || 0,
      appointmentsToday: appointmentsTodayCount,
      appointmentsWeek: appointmentsWeek?.length || 0,
      averageOccupancy,
      status
    };
  } catch (error) {
    console.error('Error fetching department metrics:', error);
    throw error;
  }
}

export async function getDoctorWorkload(doctorId: string, dateRange: DateRange): Promise<DoctorWorkload> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, department_id, departments(name)')
      .eq('id', doctorId)
      .single();

    if (profileError) throw profileError;

    const { data: medical, error: medicalError } = await supabase
      .from('medical_staff')
      .select('specialization, is_accepting_patients, current_status, average_rating, total_consultations')
      .eq('id', doctorId)
      .single();

    if (medicalError) throw medicalError;

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .eq('primary_care_physician_id', doctorId);

    if (patientsError) throw patientsError;

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: appointmentsToday } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today);

    const { data: appointmentsWeek } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', weekAgo);

    const { data: appointmentsMonth } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', monthAgo);

    const appointmentsTodayCount = appointmentsToday?.length || 0;
    const occupancyRate = Math.min(100, Math.round((appointmentsTodayCount / 16) * 100));

    return {
      doctorId,
      doctorName: profile.full_name,
      specialization: medical.specialization || 'Non spécifié',
      departmentName: (profile.departments as any)?.name || 'Non assigné',
      patientsAssigned: patients?.length || 0,
      appointmentsToday: appointmentsTodayCount,
      appointmentsWeek: appointmentsWeek?.length || 0,
      appointmentsMonth: appointmentsMonth?.length || 0,
      occupancyRate,
      averageRating: medical.average_rating || 0,
      totalConsultations: medical.total_consultations || 0,
      status: medical.current_status || 'available',
      isAcceptingPatients: medical.is_accepting_patients || false
    };
  } catch (error) {
    console.error('Error fetching doctor workload:', error);
    throw error;
  }
}

export async function getDoctorPatients(doctorId: string, includeInactive: boolean = false): Promise<PatientSummary[]> {
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, date_of_birth, phone')
      .eq('primary_care_physician_id', doctorId)
      .order('last_name');

    if (error) throw error;

    const patientSummaries = await Promise.all(
      (patients || []).map(async (patient) => {
        const { data: visits } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('patient_id', patient.id)
          .eq('status', 'completed')
          .order('appointment_date', { ascending: false })
          .limit(1);

        return {
          id: patient.id,
          fullName: `${patient.first_name} ${patient.last_name}`,
          dateOfBirth: patient.date_of_birth,
          lastVisit: visits?.[0]?.appointment_date,
          totalVisits: visits?.length || 0,
          phone: patient.phone
        };
      })
    );

    return patientSummaries;
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    throw error;
  }
}

export async function calculateOccupancyRate(doctorId: string, date: string): Promise<number> {
  try {
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    const { data: schedule, error: scheduleError } = await supabase
      .from('doctor_schedule_templates')
      .select('start_time, end_time, slot_duration')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (scheduleError || !schedule) return 0;

    const startTime = parseTime(schedule.start_time);
    const endTime = parseTime(schedule.end_time);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    const totalSlots = Math.floor(totalMinutes / schedule.slot_duration);

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed', 'completed']);

    if (appointmentsError) return 0;

    const bookedSlots = appointments?.length || 0;
    return totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
  } catch (error) {
    console.error('Error calculating occupancy rate:', error);
    return 0;
  }
}

function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function getTodayAppointments(doctorId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        status,
        reason,
        patients (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .order('appointment_time');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching today appointments:', error);
    return [];
  }
}

export async function exportDoctorsDataCSV(filters?: AnalyticsFilters): Promise<string> {
  try {
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        department_id,
        departments (name),
        medical_staff (
          specialization,
          is_accepting_patients,
          average_rating,
          total_consultations
        )
      `)
      .eq('role', 'doctor');

    if (filters?.departmentIds && filters.departmentIds.length > 0) {
      query = query.in('department_id', filters.departmentIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const headers = [
      'ID',
      'Nom Complet',
      'Email',
      'Téléphone',
      'Département',
      'Spécialité',
      'Accepte Patients',
      'Note Moyenne',
      'Total Consultations'
    ];

    const rows = (data || []).map(doctor => {
      const medical = (doctor.medical_staff as any)?.[0] || {};
      const department = (doctor.departments as any);

      return [
        doctor.id,
        doctor.full_name,
        doctor.email || '',
        doctor.phone || '',
        department?.name || '',
        medical.specialization || '',
        medical.is_accepting_patients ? 'Oui' : 'Non',
        medical.average_rating || '0',
        medical.total_consultations || '0'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting doctors data:', error);
    throw error;
  }
}

export async function getDoctorsByDepartment(departmentId: string): Promise<DoctorWorkload[]> {
  try {
    const { data: doctorDepts, error } = await supabase
      .from('doctor_departments')
      .select('doctor_id')
      .eq('department_id', departmentId)
      .eq('is_active', true);

    if (error) throw error;

    const doctorIds = doctorDepts?.map(d => d.doctor_id) || [];
    const workloads = await Promise.all(
      doctorIds.map(id =>
        getDoctorWorkload(id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        })
      )
    );

    return workloads;
  } catch (error) {
    console.error('Error fetching doctors by department:', error);
    throw error;
  }
}
