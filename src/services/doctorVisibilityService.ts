import { supabase } from '../lib/supabase';

export interface VisibilityCheck {
  id: string;
  full_name: string;
  email: string;
  visibility_status: string;
  visibility_priority: number;
  is_accepting_patients: boolean;
  dept_is_public: boolean;
  user_is_active: boolean;
  current_status: string;
  available_days_count: number;
}

export interface ActivationResult {
  doctor_id: string;
  activation_steps: Array<{
    step: string;
    action: string;
    success: boolean;
  }>;
  total_steps: number;
  timestamp: string;
}

export interface BulkActivationResult {
  total_processed: number;
  total_activated: number;
  results: Array<{
    doctor_id: string;
    doctor_name: string;
    previous_status: string;
    success: boolean;
    error?: string;
  }>;
  timestamp: string;
}

export const doctorVisibilityService = {
  async getAllDoctors(): Promise<VisibilityCheck[]> {
    const { data, error } = await supabase
      .from('doctors_visibility_status')
      .select('*')
      .order('visibility_priority', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getInvisibleDoctors(): Promise<VisibilityCheck[]> {
    const { data, error } = await supabase
      .from('invisible_doctors_report')
      .select('*')
      .order('visibility_priority', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async activateDoctor(doctorId: string): Promise<ActivationResult> {
    const { data, error } = await supabase.rpc('activate_doctor', {
      doctor_id: doctorId
    });

    if (error) throw error;
    return data as ActivationResult;
  },

  async bulkActivateInvisible(): Promise<BulkActivationResult> {
    const { data, error } = await supabase.rpc('bulk_activate_invisible_doctors');

    if (error) throw error;
    return data as BulkActivationResult;
  },

  async checkDoctorVisibility(doctorId: string): Promise<VisibilityCheck | null> {
    const { data, error } = await supabase
      .from('doctors_visibility_status')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  },

  async getDepartmentDoctors(departmentId: string): Promise<VisibilityCheck[]> {
    const { data, error } = await supabase
      .from('doctors_visibility_status')
      .select('*')
      .eq('department_id', departmentId)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getVisibilityStats() {
    const allDoctors = await this.getAllDoctors();

    const stats = {
      total: allDoctors.length,
      visible: allDoctors.filter(d => d.visibility_status === 'Visible').length,
      invisible: allDoctors.filter(d => d.visibility_status !== 'Visible').length,
      critical: allDoctors.filter(d => d.visibility_priority >= 1 && d.visibility_priority <= 2).length,
      high: allDoctors.filter(d => d.visibility_priority >= 3 && d.visibility_priority <= 4).length,
      medium: allDoctors.filter(d => d.visibility_priority >= 5 && d.visibility_priority <= 7).length,
      byStatus: {} as Record<string, number>
    };

    allDoctors.forEach(doctor => {
      const status = doctor.visibility_status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return stats;
  },

  async fixDoctorVisibilityManually(doctorId: string, fixes: {
    activateUser?: boolean;
    enablePatientAcceptance?: boolean;
    setStatusAvailable?: boolean;
    makeDepartmentPublic?: boolean;
    createAvailabilitySchedule?: boolean;
  }) {
    const results = [];

    try {
      if (fixes.activateUser) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', doctorId);

        results.push({
          action: 'Activate user profile',
          success: !error,
          error: error?.message
        });
      }

      if (fixes.enablePatientAcceptance) {
        const { error } = await supabase
          .from('medical_staff')
          .update({
            is_accepting_patients: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', doctorId);

        results.push({
          action: 'Enable patient acceptance',
          success: !error,
          error: error?.message
        });
      }

      if (fixes.setStatusAvailable) {
        const { error } = await supabase
          .from('medical_staff')
          .update({
            current_status: 'available',
            updated_at: new Date().toISOString()
          })
          .eq('id', doctorId);

        results.push({
          action: 'Set status to available',
          success: !error,
          error: error?.message
        });
      }

      if (fixes.makeDepartmentPublic) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('department_id')
          .eq('id', doctorId)
          .single();

        if (profile?.department_id) {
          const { error } = await supabase
            .from('departments')
            .update({
              is_public: true,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.department_id);

          results.push({
            action: 'Make department public',
            success: !error,
            error: error?.message
          });
        }
      }

      if (fixes.createAvailabilitySchedule) {
        for (let day = 1; day <= 5; day++) {
          const { error } = await supabase
            .from('doctor_availability_calendar')
            .upsert({
              doctor_id: doctorId,
              day_of_week: day,
              is_available: true,
              capacity_percentage: 100
            }, {
              onConflict: 'doctor_id,day_of_week'
            });

          if (error) {
            results.push({
              action: `Create availability for day ${day}`,
              success: false,
              error: error.message
            });
          }
        }

        results.push({
          action: 'Create availability schedule',
          success: true
        });
      }

      return {
        doctorId,
        results,
        success: results.every(r => r.success)
      };
    } catch (error: any) {
      return {
        doctorId,
        results,
        success: false,
        error: error.message
      };
    }
  },

  async validateDoctorData(doctorId: string) {
    const issues = [];

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*, departments(*)')
      .eq('id', doctorId)
      .single();

    const { data: staff } = await supabase
      .from('medical_staff')
      .select('*')
      .eq('id', doctorId)
      .single();

    const { data: availability } = await supabase
      .from('doctor_availability_calendar')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('is_available', true);

    if (!profile) {
      issues.push({ field: 'user_profiles', message: 'No user profile found' });
    } else {
      if (!profile.is_active) {
        issues.push({ field: 'is_active', message: 'User is inactive' });
      }
      if (!profile.department_id) {
        issues.push({ field: 'department_id', message: 'No department assigned' });
      } else if (profile.departments && !profile.departments.is_public) {
        issues.push({ field: 'department.is_public', message: 'Department is not public' });
      }
    }

    if (!staff) {
      issues.push({ field: 'medical_staff', message: 'No medical staff record found' });
    } else {
      if (!staff.is_accepting_patients) {
        issues.push({ field: 'is_accepting_patients', message: 'Not accepting patients' });
      }
      if (!staff.specialization) {
        issues.push({ field: 'specialization', message: 'No specialization set' });
      }
      if (staff.current_status === 'inactive' || staff.current_status === 'unavailable') {
        issues.push({ field: 'current_status', message: `Status is ${staff.current_status}` });
      }
    }

    if (!availability || availability.length === 0) {
      issues.push({ field: 'availability', message: 'No availability schedule set' });
    }

    return {
      doctorId,
      valid: issues.length === 0,
      issues
    };
  }
};
