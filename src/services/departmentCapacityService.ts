import { supabase } from '../lib/supabase';

export interface DepartmentCapacity {
  departmentId: string;
  departmentName: string;
  currentPatientsToday: number;
  pendingAppointments: number;
  availableDoctors: number;
  maxPatientsPerDay: number;
  capacityPercentage: number;
  capacityStatus: 'available' | 'moderate' | 'high' | 'unavailable';
  isOpenNow: boolean;
  businessHours: {
    start: string;
    end: string;
  };
}

export interface CapacityAlert {
  departmentId: string;
  departmentName: string;
  alertType: 'approaching_capacity' | 'high_capacity' | 'at_capacity' | 'overflow';
  currentPercentage: number;
  thresholdPercentage: number;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class DepartmentCapacityService {
  async getDepartmentCapacity(departmentId: string): Promise<DepartmentCapacity | null> {
    const { data, error } = await supabase
      .from('department_current_status')
      .select('*')
      .eq('department_id', departmentId)
      .single();

    if (error) {
      console.error('Error fetching department capacity:', error);
      return null;
    }

    return this.mapToCapacityModel(data);
  }

  async getAllDepartmentCapacities(): Promise<DepartmentCapacity[]> {
    const { data, error } = await supabase
      .from('department_current_status')
      .select('*')
      .order('department_name');

    if (error) {
      console.error('Error fetching all department capacities:', error);
      return [];
    }

    return (data || []).map((d) => this.mapToCapacityModel(d));
  }

  async getCapacityAlerts(): Promise<CapacityAlert[]> {
    const { data, error } = await supabase
      .from('department_current_status')
      .select('*')
      .gte('capacity_percentage', 50);

    if (error) {
      console.error('Error fetching capacity alerts:', error);
      return [];
    }

    return (data || [])
      .map((dept) => this.createCapacityAlert(this.mapToCapacityModel(dept)))
      .filter((alert): alert is CapacityAlert => alert !== null);
  }

  async checkCapacityThreshold(departmentId: string): Promise<{
    exceedsThreshold: boolean;
    currentPercentage: number;
    threshold: number;
    shouldAlert: boolean;
  }> {
    const { data: status } = await supabase
      .from('department_current_status')
      .select('*')
      .eq('department_id', departmentId)
      .single();

    const { data: config } = await supabase
      .from('department_capacity_config')
      .select('alert_threshold_percentage, notify_on_capacity_alert')
      .eq('department_id', departmentId)
      .single();

    if (!status || !config) {
      return {
        exceedsThreshold: false,
        currentPercentage: 0,
        threshold: 80,
        shouldAlert: false,
      };
    }

    const currentPercentage = status.capacity_percentage || 0;
    const threshold = config.alert_threshold_percentage || 80;
    const exceedsThreshold = currentPercentage >= threshold;
    const shouldAlert = exceedsThreshold && config.notify_on_capacity_alert;

    return {
      exceedsThreshold,
      currentPercentage,
      threshold,
      shouldAlert,
    };
  }

  async updateDepartmentCapacityConfig(
    departmentId: string,
    config: {
      maxPatientsPerDay?: number;
      maxQueueLength?: number;
      alertThresholdPercentage?: number;
      autoRouteOverflow?: boolean;
      overflowDepartmentId?: string | null;
      businessHoursStart?: string;
      businessHoursEnd?: string;
    }
  ): Promise<boolean> {
    const { error } = await supabase
      .from('department_capacity_config')
      .update({
        max_patients_per_day: config.maxPatientsPerDay,
        max_queue_length: config.maxQueueLength,
        alert_threshold_percentage: config.alertThresholdPercentage,
        auto_route_overflow: config.autoRouteOverflow,
        overflow_department_id: config.overflowDepartmentId,
        business_hours_start: config.businessHoursStart,
        business_hours_end: config.businessHoursEnd,
      })
      .eq('department_id', departmentId);

    if (error) {
      console.error('Error updating department capacity config:', error);
      return false;
    }

    return true;
  }

  async getDepartmentWorkloadDistribution(): Promise<{
    totalPatients: number;
    averageLoad: number;
    departments: Array<{
      name: string;
      load: number;
      percentage: number;
    }>;
  }> {
    const capacities = await this.getAllDepartmentCapacities();
    const totalPatients = capacities.reduce((sum, d) => sum + d.currentPatientsToday, 0);
    const averageLoad = totalPatients / capacities.length || 0;

    const departments = capacities.map((dept) => ({
      name: dept.departmentName,
      load: dept.currentPatientsToday,
      percentage: totalPatients > 0 ? (dept.currentPatientsToday / totalPatients) * 100 : 0,
    }));

    return {
      totalPatients,
      averageLoad,
      departments,
    };
  }

  async getOverflowDepartment(departmentId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('department_capacity_config')
      .select('overflow_department_id, auto_route_overflow')
      .eq('department_id', departmentId)
      .single();

    if (error || !data || !data.auto_route_overflow) {
      return null;
    }

    // Check if overflow department has capacity
    if (data.overflow_department_id) {
      const capacity = await this.getDepartmentCapacity(data.overflow_department_id);
      if (capacity && capacity.capacityStatus !== 'unavailable') {
        return data.overflow_department_id;
      }
    }

    return null;
  }

  async predictCapacityForDate(departmentId: string, date: Date): Promise<{
    predictedPatients: number;
    predictedCapacityPercentage: number;
    recommendation: string;
  }> {
    // Get historical data for same day of week
    const dayOfWeek = date.getDay();

    const { data: historicalAppointments } = await supabase
      .from('appointments')
      .select('id, appointment_date')
      .eq('department_id', departmentId)
      .gte('appointment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('appointment_date', new Date().toISOString());

    // Simple average-based prediction
    const appointments = historicalAppointments || [];
    const sameDayAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getDay() === dayOfWeek;
    });

    const avgPatients = sameDayAppointments.length / 4 || 10; // Assume 4 weeks of data

    const { data: config } = await supabase
      .from('department_capacity_config')
      .select('max_patients_per_day')
      .eq('department_id', departmentId)
      .single();

    const maxPatients = config?.max_patients_per_day || 50;
    const predictedPercentage = (avgPatients / maxPatients) * 100;

    let recommendation = '';
    if (predictedPercentage < 50) {
      recommendation = 'Capacité disponible - accepter les rendez-vous normalement';
    } else if (predictedPercentage < 80) {
      recommendation = 'Charge modérée prévue - surveiller la capacité';
    } else {
      recommendation = 'Forte charge prévue - limiter les nouveaux rendez-vous';
    }

    return {
      predictedPatients: Math.round(avgPatients),
      predictedCapacityPercentage: Math.round(predictedPercentage),
      recommendation,
    };
  }

  private mapToCapacityModel(data: any): DepartmentCapacity {
    return {
      departmentId: data.department_id,
      departmentName: data.department_name || 'Unknown',
      currentPatientsToday: data.current_patients_today || 0,
      pendingAppointments: data.pending_appointments || 0,
      availableDoctors: data.available_doctors || 0,
      maxPatientsPerDay: data.max_patients_per_day || 50,
      capacityPercentage: Math.round(data.capacity_percentage || 0),
      capacityStatus: data.capacity_status || 'available',
      isOpenNow: data.is_open_now || false,
      businessHours: {
        start: data.business_hours_start || '08:00',
        end: data.business_hours_end || '18:00',
      },
    };
  }

  private createCapacityAlert(capacity: DepartmentCapacity): CapacityAlert | null {
    const { capacityPercentage, departmentName, departmentId } = capacity;

    if (capacityPercentage >= 100) {
      return {
        departmentId,
        departmentName,
        alertType: 'at_capacity',
        currentPercentage: capacityPercentage,
        thresholdPercentage: 100,
        message: `${departmentName} est à pleine capacité (${capacityPercentage}%)`,
        priority: 'critical',
      };
    }

    if (capacityPercentage >= 90) {
      return {
        departmentId,
        departmentName,
        alertType: 'overflow',
        currentPercentage: capacityPercentage,
        thresholdPercentage: 90,
        message: `${departmentName} approche la capacité maximale (${capacityPercentage}%)`,
        priority: 'high',
      };
    }

    if (capacityPercentage >= 80) {
      return {
        departmentId,
        departmentName,
        alertType: 'high_capacity',
        currentPercentage: capacityPercentage,
        thresholdPercentage: 80,
        message: `${departmentName} a une charge élevée (${capacityPercentage}%)`,
        priority: 'high',
      };
    }

    if (capacityPercentage >= 70) {
      return {
        departmentId,
        departmentName,
        alertType: 'approaching_capacity',
        currentPercentage: capacityPercentage,
        thresholdPercentage: 70,
        message: `${departmentName} approche sa capacité (${capacityPercentage}%)`,
        priority: 'medium',
      };
    }

    return null;
  }

  async refreshCapacityData(): Promise<void> {
    // Force refresh of the view by querying it
    // In Supabase, views are computed on-the-fly, so this ensures fresh data
    await this.getAllDepartmentCapacities();
  }
}

export const departmentCapacityService = new DepartmentCapacityService();
