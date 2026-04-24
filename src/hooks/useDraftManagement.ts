import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { EmployeeFormData, DraftMetadata, StepNumber } from '../types/employeeForm';
import { calculateOverallCompletionPercentage } from '../validation/employeeValidation';

export function useDraftManagement(
  formData: EmployeeFormData,
  currentStep: StepNumber,
  completedSteps: StepNumber[],
  userId: string | undefined
) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastDataRef = useRef<string>('');

  const saveDraft = useCallback(async (
    draftName?: string
  ): Promise<{ success: boolean; draftId?: string; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    setIsSaving(true);

    try {
      const draftData = {
        draft_name: draftName || null,
        draft_data: formData,
        current_step: currentStep,
        completed_steps: completedSteps,
        created_by: userId,
      };

      if (draftId) {
        const { error } = await supabase
          .from('employee_drafts')
          .update(draftData)
          .eq('id', draftId);

        if (error) throw error;

        setLastSaved(new Date());
        return { success: true, draftId };
      } else {
        const { data, error } = await supabase
          .from('employee_drafts')
          .insert([draftData])
          .select()
          .single();

        if (error) throw error;

        setDraftId(data.id);
        setLastSaved(new Date());
        return { success: true, draftId: data.id };
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  }, [formData, currentStep, completedSteps, userId, draftId]);

  const loadDraft = useCallback(async (
    id: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('employee_drafts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setDraftId(id);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error loading draft:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const deleteDraft = useCallback(async (
    id?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetId = id || draftId;

    if (!targetId) {
      return { success: false, error: 'Aucun brouillon à supprimer' };
    }

    try {
      const { error } = await supabase
        .from('employee_drafts')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      if (targetId === draftId) {
        setDraftId(null);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      return { success: false, error: error.message };
    }
  }, [draftId]);

  const listUserDrafts = useCallback(async (): Promise<{
    success: boolean;
    drafts?: DraftMetadata[];
    error?: string;
  }> => {
    if (!userId) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const { data, error } = await supabase
        .from('employee_drafts')
        .select('*')
        .eq('created_by', userId)
        .eq('is_published', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const drafts: DraftMetadata[] = (data || []).map((draft) => ({
        id: draft.id,
        name: draft.draft_name || `Brouillon du ${new Date(draft.created_at).toLocaleDateString()}`,
        currentStep: draft.current_step as StepNumber,
        completedSteps: draft.completed_steps as StepNumber[],
        lastUpdated: draft.updated_at,
        completionPercentage: calculateOverallCompletionPercentage(draft.draft_data),
      }));

      return { success: true, drafts };
    } catch (error: any) {
      console.error('Error listing drafts:', error);
      return { success: false, error: error.message };
    }
  }, [userId]);

  const publishDraft = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!draftId) {
      return { success: false, error: 'Aucun brouillon à publier' };
    }

    try {
      const { error } = await supabase
        .from('employee_drafts')
        .update({ is_published: true })
        .eq('id', draftId);

      if (error) throw error;

      setDraftId(null);
      return { success: true };
    } catch (error: any) {
      console.error('Error publishing draft:', error);
      return { success: false, error: error.message };
    }
  }, [draftId]);

  useEffect(() => {
    if (!autoSaveEnabled || !userId) return;

    const currentData = JSON.stringify({ formData, currentStep, completedSteps });

    if (currentData === lastDataRef.current) {
      return;
    }

    lastDataRef.current = currentData;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 30000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, currentStep, completedSteps, autoSaveEnabled, userId, saveDraft]);

  return {
    draftId,
    isSaving,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    saveDraft,
    loadDraft,
    deleteDraft,
    listUserDrafts,
    publishDraft,
  };
}
