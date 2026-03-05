import { useState, useCallback, useMemo } from 'react';

export type LabOrderStatus = 'pending' | 'in_progress' | 'completed' | 'validated' | 'cancelled';
export type LabOrderPriority = 'normal' | 'urgent';

export interface LabOrderFilter {
  status?: LabOrderStatus[];
  priority?: LabOrderPriority[];
  searchQuery?: string;
}

export function useLabOrderFilters() {
  const [activeFilter, setActiveFilter] = useState<LabOrderFilter>({});
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Filtrer pour afficher la file d'attente (En attente + Urgent)
  const showQueue = useCallback(() => {
    setActiveFilter({
      status: ['pending', 'in_progress']
    });
    setIsFilterActive(true);
  }, []);

  // Filtrer uniquement les urgents
  const showUrgent = useCallback(() => {
    setActiveFilter({
      priority: ['urgent']
    });
    setIsFilterActive(true);
  }, []);

  // Filtrer les complétés
  const showCompleted = useCallback(() => {
    setActiveFilter({
      status: ['completed']
    });
    setIsFilterActive(true);
  }, []);

  // Réinitialiser les filtres
  const clearFilters = useCallback(() => {
    setActiveFilter({});
    setIsFilterActive(false);
  }, []);

  // Appliquer un filtre personnalisé
  const applyFilter = useCallback((filter: LabOrderFilter) => {
    setActiveFilter(filter);
    setIsFilterActive(true);
  }, []);

  // Vérifier si un filtre spécifique est actif
  const isQueueFilterActive = useMemo(() => {
    return isFilterActive &&
           activeFilter.status?.includes('pending') &&
           activeFilter.status?.includes('in_progress');
  }, [isFilterActive, activeFilter]);

  const isUrgentFilterActive = useMemo(() => {
    return isFilterActive && activeFilter.priority?.includes('urgent');
  }, [isFilterActive, activeFilter]);

  const isCompletedFilterActive = useMemo(() => {
    return isFilterActive && activeFilter.status?.includes('completed');
  }, [isFilterActive, activeFilter]);

  return {
    activeFilter,
    isFilterActive,
    isQueueFilterActive,
    isUrgentFilterActive,
    isCompletedFilterActive,
    showQueue,
    showUrgent,
    showCompleted,
    clearFilters,
    applyFilter
  };
}
