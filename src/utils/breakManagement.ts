import { supabase } from '../lib/supabase';

export interface AttendanceSettings {
  work_start_time: string;
  work_end_time: string;
  grace_period_minutes: number;
  break_duration_minutes: number;
  require_geolocation: boolean;
  geolocation_enabled?: boolean;
  clinic_latitude?: number;
  clinic_longitude?: number;
  max_distance_meters?: number;
  min_gps_accuracy_meters?: number;
  break_warning_threshold_minutes: number;
  max_break_duration_minutes: number;
  minimum_work_hours_before_break: number;
  minimum_work_hours_after_break: number;
  checkout_grace_window_hours: number;
  early_break_warning_enabled: boolean;
}

export interface BreakTimingInfo {
  workHoursBeforeBreak: number;
  breakDurationMinutes: number;
  breakDurationSeconds: number;
  canTakeBreak: boolean;
  isEarlyBreak: boolean;
  breakWarningThreshold: number;
  hasReachedWarning: boolean;
  hasExceededLimit: boolean;
  shouldForceEnd: boolean;
  remainingBreakMinutes: number;
  remainingBreakSeconds: number;
  timeUntilBreakEligible: number;
  workHoursAfterBreak: number;
  minimum_work_hours_after_break: number;
  canCheckout: boolean;
  checkoutEligibleAt: Date | null;
  checkoutWindowClosesAt: Date | null;
  isInCheckoutWindow: boolean;
}

export function calculateWorkHours(checkInTime: string | null, endTime: Date = new Date()): number {
  if (!checkInTime) return 0;
  const checkIn = new Date(checkInTime);
  const diffMs = endTime.getTime() - checkIn.getTime();
  return diffMs / (1000 * 60 * 60);
}

export function calculateBreakDurationMinutes(
  breakStartTime: string | null,
  breakEndTime: string | null = null,
  currentTime: Date = new Date()
): number {
  if (!breakStartTime) return 0;
  const breakStart = new Date(breakStartTime);
  const breakEnd = breakEndTime ? new Date(breakEndTime) : currentTime;
  const diffMs = breakEnd.getTime() - breakStart.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

export function calculateBreakDurationSeconds(
  breakStartTime: string | null,
  breakEndTime: string | null = null,
  currentTime: Date = new Date()
): number {
  if (!breakStartTime) return 0;
  const breakStart = new Date(breakStartTime);
  const breakEnd = breakEndTime ? new Date(breakEndTime) : currentTime;
  const diffMs = breakEnd.getTime() - breakStart.getTime();
  return Math.floor(diffMs / 1000);
}

export function getBreakTimingInfo(
  checkInTime: string | null,
  breakStartTime: string | null,
  breakEndTime: string | null,
  settings: AttendanceSettings,
  currentTime: Date = new Date()
): BreakTimingInfo {
  const workHoursBeforeBreak = calculateWorkHours(checkInTime, breakStartTime ? new Date(breakStartTime) : currentTime);
  const breakDurationMinutes = calculateBreakDurationMinutes(breakStartTime, breakEndTime, currentTime);
  const breakDurationSeconds = calculateBreakDurationSeconds(breakStartTime, breakEndTime, currentTime);

  const canTakeBreak = workHoursBeforeBreak >= settings.minimum_work_hours_before_break;
  const isEarlyBreak = !canTakeBreak && breakStartTime !== null;

  const hasReachedWarning = breakDurationMinutes >= settings.break_warning_threshold_minutes;
  const hasExceededLimit = breakDurationMinutes >= settings.max_break_duration_minutes;
  const shouldForceEnd = hasExceededLimit && breakStartTime !== null && breakEndTime === null;

  const remainingBreakMinutes = Math.max(0, settings.max_break_duration_minutes - breakDurationMinutes);
  const remainingBreakSeconds = Math.max(0, (settings.max_break_duration_minutes * 60) - breakDurationSeconds);

  const timeUntilBreakEligible = Math.max(0, settings.minimum_work_hours_before_break - workHoursBeforeBreak);

  let workHoursAfterBreak = 0;
  let checkoutEligibleAt: Date | null = null;
  let checkoutWindowClosesAt: Date | null = null;
  let isInCheckoutWindow = false;

  if (breakEndTime) {
    const breakEnd = new Date(breakEndTime);
    workHoursAfterBreak = calculateWorkHours(breakEndTime, currentTime);
    checkoutEligibleAt = new Date(breakEnd.getTime() + (settings.minimum_work_hours_after_break * 60 * 60 * 1000));
    checkoutWindowClosesAt = new Date(checkoutEligibleAt.getTime() + (settings.checkout_grace_window_hours * 60 * 60 * 1000));
    isInCheckoutWindow = currentTime >= checkoutEligibleAt && currentTime <= checkoutWindowClosesAt;
  }

  const canCheckout = breakEndTime !== null && workHoursAfterBreak >= settings.minimum_work_hours_after_break;

  return {
    workHoursBeforeBreak,
    breakDurationMinutes,
    breakDurationSeconds,
    canTakeBreak,
    isEarlyBreak,
    breakWarningThreshold: settings.break_warning_threshold_minutes,
    hasReachedWarning,
    hasExceededLimit,
    shouldForceEnd,
    remainingBreakMinutes,
    remainingBreakSeconds,
    timeUntilBreakEligible,
    workHoursAfterBreak,
    minimum_work_hours_after_break: settings.minimum_work_hours_after_break,
    canCheckout,
    checkoutEligibleAt,
    checkoutWindowClosesAt,
    isInCheckoutWindow,
  };
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export async function sendBreakNotification(
  type: 'warning_30min' | 'exceeded_60min' | 'supervisor_escalation' | 'early_break_warning',
  staffId: string,
  attendanceRecordId: string,
  staffEmail: string,
  staffName: string,
  breakDuration?: number,
  workHoursBeforeBreak?: number,
  supervisorEmail?: string,
  supervisorName?: string
): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-break-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        staffId,
        attendanceRecordId,
        staffEmail,
        staffName,
        breakDuration,
        workHoursBeforeBreak,
        supervisorEmail,
        supervisorName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending break notification:', error);
    return false;
  }
}

export async function logBreakAction(
  staffId: string,
  attendanceRecordId: string | null,
  actionType: 'break_start' | 'break_warning' | 'break_exceeded' | 'break_forced_end' | 'break_end' | 'early_break_taken',
  systemTriggered: boolean = false,
  workHours?: number,
  breakDuration?: number,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('break_audit_log').insert({
      staff_id: staffId,
      attendance_record_id: attendanceRecordId,
      action_type: actionType,
      action_timestamp: new Date().toISOString(),
      system_triggered: systemTriggered,
      work_hours_at_action: workHours,
      break_duration_at_action: breakDuration,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Error logging break action:', error);
  }
}

export async function forceEndBreak(
  attendanceRecordId: string,
  staffId: string,
  staffEmail: string,
  staffName: string,
  breakDuration: number
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({
        break_end_time: now,
        break_forced_end_time: now,
        forced_by_system: true,
        break_exceeded_notification_sent: true,
        supervisor_notified: true,
      })
      .eq('id', attendanceRecordId);

    if (updateError) throw updateError;

    await logBreakAction(
      staffId,
      attendanceRecordId,
      'break_forced_end',
      true,
      undefined,
      breakDuration,
      { reason: 'Exceeded maximum break duration', duration_minutes: breakDuration }
    );

    await sendBreakNotification(
      'exceeded_60min',
      staffId,
      attendanceRecordId,
      staffEmail,
      staffName,
      breakDuration
    );

    const { data: supervisor } = await supabase.rpc('find_staff_supervisor', { staff_user_id: staffId });

    if (supervisor) {
      const { data: supervisorProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', supervisor)
        .single();

      if (supervisorProfile?.email) {
        await sendBreakNotification(
          'supervisor_escalation',
          staffId,
          attendanceRecordId,
          staffEmail,
          staffName,
          breakDuration,
          undefined,
          supervisorProfile.email,
          supervisorProfile.full_name
        );

        await supabase.from('break_escalations').insert({
          staff_id: staffId,
          supervisor_id: supervisor,
          attendance_record_id: attendanceRecordId,
          break_exceeded_minutes: breakDuration,
          escalated_at: now,
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error forcing break end:', error);
    return false;
  }
}

export async function checkAndHandleBreakWarning(
  attendanceRecordId: string,
  staffId: string,
  staffEmail: string,
  staffName: string,
  breakDuration: number,
  warningAlreadySent: boolean
): Promise<boolean> {
  if (warningAlreadySent) return false;

  try {
    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({ break_warning_sent: true })
      .eq('id', attendanceRecordId);

    if (updateError) throw updateError;

    await logBreakAction(
      staffId,
      attendanceRecordId,
      'break_warning',
      true,
      undefined,
      breakDuration,
      { threshold_minutes: 30 }
    );

    const success = await sendBreakNotification(
      'warning_30min',
      staffId,
      attendanceRecordId,
      staffEmail,
      staffName,
      breakDuration
    );

    return success;
  } catch (error) {
    console.error('Error handling break warning:', error);
    return false;
  }
}
