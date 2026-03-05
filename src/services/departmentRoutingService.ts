import { supabase } from '../lib/supabase';

export interface DepartmentRecommendation {
  departmentId: string;
  departmentName: string;
  matchScore: number;
  isEmergency: boolean;
  reason: string;
  capacityStatus: 'available' | 'moderate' | 'high' | 'unavailable';
  capacityPercentage: number;
}

export interface RoutingResult {
  success: boolean;
  recommendedDepartment: DepartmentRecommendation | null;
  alternativeDepartments: DepartmentRecommendation[];
  message: string;
  isAutomatic: boolean;
}

export interface PatientRoutingData {
  consultationReason: string;
  medicalHistory?: string;
  knownAllergies?: string;
  age?: number;
  gender?: string;
  isEmergency?: boolean;
}

class DepartmentRoutingService {
  async getRecommendedDepartment(
    routingData: PatientRoutingData
  ): Promise<RoutingResult> {
    try {
      const { consultationReason, age, isEmergency } = routingData;

      // Get department recommendations using database function
      const { data: recommendations, error: recError } = await supabase.rpc(
        'get_recommended_department',
        {
          consultation_reason: consultationReason,
          patient_age: age || null,
        }
      );

      if (recError) {
        console.error('Error getting department recommendations:', recError);
        return this.getDefaultDepartment();
      }

      if (!recommendations || recommendations.length === 0) {
        return this.getDefaultDepartment();
      }

      // Get capacity status for recommended departments
      const departmentIds = recommendations.map((r: any) => r.department_id);
      const capacityStatuses = await this.getDepartmentCapacities(departmentIds);

      // Enrich recommendations with capacity data
      const enrichedRecommendations: DepartmentRecommendation[] = recommendations.map((rec: any) => {
        const capacity = capacityStatuses.find((c) => c.department_id === rec.department_id);
        return {
          departmentId: rec.department_id,
          departmentName: rec.department_name,
          matchScore: rec.match_score,
          isEmergency: rec.is_emergency,
          reason: rec.reason,
          capacityStatus: capacity?.capacity_status || 'available',
          capacityPercentage: capacity?.capacity_percentage || 0,
        };
      });

      // Find best available department
      const bestDepartment = this.selectBestDepartment(
        enrichedRecommendations,
        isEmergency
      );

      if (!bestDepartment) {
        return this.getDefaultDepartment();
      }

      // Get alternatives (excluding the best one)
      const alternatives = enrichedRecommendations
        .filter((d) => d.departmentId !== bestDepartment.departmentId)
        .slice(0, 3);

      return {
        success: true,
        recommendedDepartment: bestDepartment,
        alternativeDepartments: alternatives,
        message: this.getRoutingMessage(bestDepartment, isEmergency),
        isAutomatic: true,
      };
    } catch (error) {
      console.error('Error in department routing:', error);
      return this.getDefaultDepartment();
    }
  }

  private async getDepartmentCapacities(departmentIds: string[]) {
    const { data, error } = await supabase
      .from('department_current_status')
      .select('*')
      .in('department_id', departmentIds);

    if (error) {
      console.error('Error fetching department capacities:', error);
      return [];
    }

    return data || [];
  }

  private selectBestDepartment(
    recommendations: DepartmentRecommendation[],
    isEmergency?: boolean
  ): DepartmentRecommendation | null {
    if (recommendations.length === 0) return null;

    // For emergencies, prioritize emergency-flagged departments
    if (isEmergency) {
      const emergencyDept = recommendations.find((d) => d.isEmergency);
      if (emergencyDept) return emergencyDept;
    }

    // Sort by match score and capacity availability
    const sorted = [...recommendations].sort((a, b) => {
      // First, avoid unavailable departments
      if (a.capacityStatus === 'unavailable' && b.capacityStatus !== 'unavailable') return 1;
      if (b.capacityStatus === 'unavailable' && a.capacityStatus !== 'unavailable') return -1;

      // Then prefer departments with better capacity
      const capacityWeight = this.getCapacityWeight(a.capacityStatus) -
                            this.getCapacityWeight(b.capacityStatus);
      if (capacityWeight !== 0) return capacityWeight;

      // Finally, use match score
      return b.matchScore - a.matchScore;
    });

    return sorted[0];
  }

  private getCapacityWeight(status: string): number {
    switch (status) {
      case 'available':
        return 3;
      case 'moderate':
        return 2;
      case 'high':
        return 1;
      case 'unavailable':
        return 0;
      default:
        return 2;
    }
  }

  private async getDefaultDepartment(): Promise<RoutingResult> {
    // Try to get general medicine or first available department
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .or('name.ilike.%médecine générale%,name.ilike.%general%')
      .limit(1);

    if (departments && departments.length > 0) {
      const dept = departments[0];
      const { data: capacity } = await supabase
        .from('department_current_status')
        .select('*')
        .eq('department_id', dept.id)
        .single();

      return {
        success: true,
        recommendedDepartment: {
          departmentId: dept.id,
          departmentName: dept.name,
          matchScore: 30,
          isEmergency: false,
          reason: 'Service par défaut - Médecine générale',
          capacityStatus: capacity?.capacity_status || 'available',
          capacityPercentage: capacity?.capacity_percentage || 0,
        },
        alternativeDepartments: [],
        message: 'Aucune correspondance spécifique trouvée. Le patient sera dirigé vers la médecine générale.',
        isAutomatic: false,
      };
    }

    // No department available
    return {
      success: false,
      recommendedDepartment: null,
      alternativeDepartments: [],
      message: 'Aucun service disponible. Veuillez sélectionner manuellement un service.',
      isAutomatic: false,
    };
  }

  private getRoutingMessage(
    department: DepartmentRecommendation,
    isEmergency?: boolean
  ): string {
    if (isEmergency) {
      return `Patient urgent assigné au service ${department.departmentName}`;
    }

    if (department.capacityStatus === 'high') {
      return `Service ${department.departmentName} recommandé (attention: charge élevée ${department.capacityPercentage}%)`;
    }

    if (department.capacityStatus === 'moderate') {
      return `Service ${department.departmentName} recommandé (charge modérée ${department.capacityPercentage}%)`;
    }

    return `Service ${department.departmentName} recommandé - ${department.reason}`;
  }

  async checkDepartmentCapacity(departmentId: string): Promise<{
    canAcceptPatient: boolean;
    capacityPercentage: number;
    status: string;
    message: string;
  }> {
    const { data, error } = await supabase
      .from('department_current_status')
      .select('*')
      .eq('department_id', departmentId)
      .single();

    if (error || !data) {
      return {
        canAcceptPatient: true,
        capacityPercentage: 0,
        status: 'unknown',
        message: 'Impossible de vérifier la capacité du service',
      };
    }

    const canAccept = data.capacity_status !== 'unavailable';
    let message = '';

    switch (data.capacity_status) {
      case 'available':
        message = `Service disponible (${data.capacity_percentage}% de capacité)`;
        break;
      case 'moderate':
        message = `Service à charge modérée (${data.capacity_percentage}% de capacité)`;
        break;
      case 'high':
        message = `Service à forte charge (${data.capacity_percentage}% de capacité)`;
        break;
      case 'unavailable':
        message = 'Service à pleine capacité. Veuillez choisir un autre service.';
        break;
      default:
        message = 'Statut du service inconnu';
    }

    return {
      canAcceptPatient: canAccept,
      capacityPercentage: data.capacity_percentage || 0,
      status: data.capacity_status,
      message,
    };
  }

  async getDepartmentWithCapacity(preferredDepartmentId?: string): Promise<string | null> {
    // If preferred department has capacity, use it
    if (preferredDepartmentId) {
      const capacity = await this.checkDepartmentCapacity(preferredDepartmentId);
      if (capacity.canAcceptPatient) {
        return preferredDepartmentId;
      }
    }

    // Otherwise, find department with best capacity
    const { data: departments } = await supabase
      .from('department_current_status')
      .select('*')
      .neq('capacity_status', 'unavailable')
      .order('capacity_percentage', { ascending: true })
      .limit(1);

    if (departments && departments.length > 0) {
      return departments[0].department_id;
    }

    return null;
  }

  async getAllDepartmentsWithCapacity() {
    const { data, error } = await supabase
      .from('department_current_status')
      .select('*')
      .order('department_name');

    if (error) {
      console.error('Error fetching departments with capacity:', error);
      return [];
    }

    return data || [];
  }

  async routeEmergencyPatient(patientData: PatientRoutingData): Promise<RoutingResult> {
    // Get emergency department or department with best capacity
    const { data: emergencyDepts } = await supabase
      .from('department_capacity_config')
      .select('department_id, departments(id, name)')
      .eq('is_emergency_department', true)
      .limit(1);

    if (emergencyDepts && emergencyDepts.length > 0) {
      const dept = emergencyDepts[0];
      const capacity = await this.checkDepartmentCapacity(dept.department_id);

      return {
        success: true,
        recommendedDepartment: {
          departmentId: dept.department_id,
          departmentName: (dept as any).departments.name,
          matchScore: 100,
          isEmergency: true,
          reason: 'Service d\'urgence',
          capacityStatus: capacity.status as any,
          capacityPercentage: capacity.capacityPercentage,
        },
        alternativeDepartments: [],
        message: 'Patient urgent assigné au service d\'urgence',
        isAutomatic: true,
      };
    }

    // Fallback to regular routing with emergency flag
    return this.getRecommendedDepartment({ ...patientData, isEmergency: true });
  }
}

export const departmentRoutingService = new DepartmentRoutingService();
