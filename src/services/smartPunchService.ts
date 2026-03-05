import { supabase } from '../lib/supabase';

export interface PunchRecord {
  id: string;
  staff_id: string;
  punch_date: string;
  punch_type: 'check_in' | 'check_out' | 'break_start' | 'break_end';
  punched_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_accuracy_meters: number | null;
  distance_from_office_meters: number | null;
  is_within_zone: boolean;
  is_remote_exception: boolean;
  remote_exception_role: string | null;
  selfie_url: string | null;
  selfie_storage_path: string | null;
  break_duration_minutes: number | null;
  break_exceeded: boolean;
  break_exceeded_by_minutes: number;
  is_late: boolean;
  late_by_minutes: number;
  auto_closed: boolean;
  auto_closed_at: string | null;
  forgot_to_checkout_note: string | null;
  notes: string | null;
  created_at: string;
}

export interface TodayStatus {
  checkIn: PunchRecord | null;
  checkOut: PunchRecord | null;
  breakStart: PunchRecord | null;
  breakEnd: PunchRecord | null;
  currentStatus: 'not_started' | 'present' | 'on_break' | 'departed';
  breakElapsedMinutes: number | null;
}

export interface PunchInput {
  staff_id: string;
  punch_type: 'check_in' | 'check_out' | 'break_start' | 'break_end';
  gps_lat?: number | null;
  gps_lng?: number | null;
  gps_accuracy_meters?: number | null;
  distance_from_office_meters?: number | null;
  is_within_zone?: boolean;
  is_remote_exception?: boolean;
  remote_exception_role?: string | null;
  selfie_url?: string | null;
  selfie_storage_path?: string | null;
  device_info?: Record<string, unknown>;
  is_late?: boolean;
  late_by_minutes?: number;
}

export async function getTodayPunches(staffId: string): Promise<PunchRecord[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('smart_punch_records')
    .select('*')
    .eq('staff_id', staffId)
    .eq('punch_date', today)
    .order('punched_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PunchRecord[];
}

export function computeTodayStatus(records: PunchRecord[]): TodayStatus {
  const checkIn = records.find(r => r.punch_type === 'check_in') ?? null;
  const checkOut = records.find(r => r.punch_type === 'check_out') ?? null;
  const breakStart = records.find(r => r.punch_type === 'break_start') ?? null;
  const breakEnd = records.find(r => r.punch_type === 'break_end') ?? null;

  let currentStatus: TodayStatus['currentStatus'] = 'not_started';
  if (checkIn && !checkOut) {
    if (breakStart && !breakEnd) {
      currentStatus = 'on_break';
    } else {
      currentStatus = 'present';
    }
  } else if (checkOut) {
    currentStatus = 'departed';
  }

  let breakElapsedMinutes: number | null = null;
  if (breakStart && !breakEnd) {
    breakElapsedMinutes = Math.floor(
      (Date.now() - new Date(breakStart.punched_at).getTime()) / 60000
    );
  }

  return { checkIn, checkOut, breakStart, breakEnd, currentStatus, breakElapsedMinutes };
}

export async function createPunchRecord(input: PunchInput): Promise<PunchRecord> {
  const today = new Date().toISOString().split('T')[0];

  const workStartHour = 8;
  const workStartMinutes = workStartHour * 60;
  const graceMinutes = 15;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let isLate = false;
  let lateByMinutes = 0;
  if (input.punch_type === 'check_in') {
    const lateThreshold = workStartMinutes + graceMinutes;
    if (nowMinutes > lateThreshold) {
      isLate = true;
      lateByMinutes = nowMinutes - workStartMinutes;
    }
  }

  const { data, error } = await supabase
    .from('smart_punch_records')
    .insert({
      staff_id: input.staff_id,
      punch_date: today,
      punch_type: input.punch_type,
      gps_lat: input.gps_lat ?? null,
      gps_lng: input.gps_lng ?? null,
      gps_accuracy_meters: input.gps_accuracy_meters ?? null,
      distance_from_office_meters: input.distance_from_office_meters ?? null,
      is_within_zone: input.is_within_zone ?? false,
      is_remote_exception: input.is_remote_exception ?? false,
      remote_exception_role: input.remote_exception_role ?? null,
      selfie_url: input.selfie_url ?? null,
      selfie_storage_path: input.selfie_storage_path ?? null,
      device_info: input.device_info ?? {},
      is_late: isLate,
      late_by_minutes: lateByMinutes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PunchRecord;
}

export async function finalizeBreakRecord(
  breakStartRecord: PunchRecord,
  breakEndRecordId: string
): Promise<void> {
  const durationMs =
    Date.now() - new Date(breakStartRecord.punched_at).getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const exceeded = durationMinutes > 60;
  const exceededBy = exceeded ? durationMinutes - 60 : 0;

  await supabase
    .from('smart_punch_records')
    .update({
      break_duration_minutes: durationMinutes,
      break_exceeded: exceeded,
      break_exceeded_by_minutes: exceededBy,
    })
    .eq('id', breakEndRecordId);
}

export async function getAttendanceReport(
  startDate: string,
  endDate: string,
  staffId?: string
): Promise<PunchRecord[]> {
  let query = supabase
    .from('smart_punch_records')
    .select(`
      *,
      user_profiles!smart_punch_records_staff_id_fkey(full_name, department_id),
      roles(name)
    `)
    .gte('punch_date', startDate)
    .lte('punch_date', endDate)
    .order('punch_date', { ascending: false })
    .order('punched_at', { ascending: true });

  if (staffId) {
    query = query.eq('staff_id', staffId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PunchRecord[];
}

export interface DailySummaryRow {
  staff_id: string;
  full_name: string;
  role_name: string;
  punch_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  break_duration_minutes: number | null;
  break_exceeded: boolean | null;
  break_exceeded_by_minutes: number | null;
  is_late: boolean | null;
  late_by_minutes: number | null;
  auto_closed_checkout: boolean | null;
  current_status: 'absent' | 'present' | 'on_break' | 'departed';
  total_minutes_worked: number | null;
  check_in_selfie: string | null;
  check_out_selfie: string | null;
  check_in_distance: number | null;
  check_in_remote: boolean | null;
}

export async function getTodayDailySummary(): Promise<DailySummaryRow[]> {
  const { data, error } = await supabase
    .from('smart_punch_daily_summary')
    .select('*');

  if (error) throw error;
  return (data ?? []) as DailySummaryRow[];
}

export async function getGdprConsent(staffId: string): Promise<{
  exists: boolean;
  allGranted: boolean;
  withdrawn: boolean;
} | null> {
  const { data, error } = await supabase
    .from('gdpr_consents')
    .select('*')
    .eq('staff_id', staffId)
    .eq('charter_version', '1.0')
    .maybeSingle();

  if (error) throw error;
  if (!data) return { exists: false, allGranted: false, withdrawn: false };

  return {
    exists: true,
    allGranted: data.consent_gps && data.consent_photo && data.consent_data_processing,
    withdrawn: data.withdrawn ?? false,
  };
}

export async function saveGdprConsent(
  staffId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const { error } = await supabase.from('gdpr_consents').upsert({
    staff_id: staffId,
    charter_version: '1.0',
    consent_gps: true,
    consent_photo: true,
    consent_data_processing: true,
    consented_at: new Date().toISOString(),
    ip_address: ipAddress ?? null,
    user_agent: userAgent ?? null,
    withdrawn: false,
  }, { onConflict: 'staff_id,charter_version' });

  if (error) throw error;
}
