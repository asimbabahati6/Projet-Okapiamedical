import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ConsultationWithDetails, ConsultationFilters, ConsultationStatistics } from '../../types/consultationHistory';

export function useConsultationHistory(initialFilters?: ConsultationFilters) {
  const [consultations, setConsultations] = useState<ConsultationWithDetails[]>([]);
  const [statistics, setStatistics] = useState<ConsultationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ConsultationFilters>(initialFilters || {});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(
            id,
            first_name,
            last_name,
            patient_number,
            date_of_birth,
            gender,
            phone
          ),
          doctor:medical_staff!doctor_id(
            id,
            license_number,
            specialization,
            user_profile:user_profiles(
              id,
              full_name,
              phone,
              department_id
            )
          )
        `, { count: 'exact' })
        .order('consultation_date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('consultation_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('consultation_date', filters.endDate.toISOString());
      }
      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }
      if (filters.diagnosisSearch) {
        query = query.ilike('diagnosis', `%${filters.diagnosisSearch}%`);
      }
      if (filters.searchTerm) {
        query = query.or(`
          chief_complaint.ilike.%${filters.searchTerm}%,
          diagnosis.ilike.%${filters.searchTerm}%,
          treatment_plan.ilike.%${filters.searchTerm}%
        `);
      }

      if (filters.statusFilter && filters.statusFilter !== 'all') {
        if (filters.statusFilter === 'with_follow_up') {
          query = query.not('follow_up_date', 'is', null);
        } else if (filters.statusFilter === 'follow_up_pending') {
          query = query.not('follow_up_date', 'is', null)
            .gte('follow_up_date', new Date().toISOString());
        } else if (filters.statusFilter === 'follow_up_overdue') {
          query = query.not('follow_up_date', 'is', null)
            .lt('follow_up_date', new Date().toISOString());
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setConsultations(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des consultations');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  const fetchStatistics = useCallback(async () => {
    try {
      const { data, error: statsError } = await supabase
        .rpc('get_consultation_statistics', {
          p_start_date: filters.startDate?.toISOString(),
          p_end_date: filters.endDate?.toISOString()
        });

      if (statsError) throw statsError;
      setStatistics(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchConsultations();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, pageSize]);

  const updateFilters = useCallback((newFilters: Partial<ConsultationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchConsultations();
    fetchStatistics();
  }, [fetchConsultations, fetchStatistics]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  return {
    consultations,
    statistics,
    loading,
    error,
    filters,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    updateFilters,
    clearFilters,
    refresh,
    goToPage,
    changePageSize,
  };
}
