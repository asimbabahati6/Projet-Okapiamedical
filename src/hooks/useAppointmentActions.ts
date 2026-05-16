import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types/database';
import { logActivity } from '../utils/activityLogger';

export function useAppointmentActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelAppointment(appointmentId: string, reason: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      await supabase
        .from('appointment_modifications')
        .insert([{
          appointment_id: appointmentId,
          modification_type: 'cancelled',
          reason: reason,
          modified_at: new Date().toISOString(),
        }]);

      logActivity('cancel', 'appointments', `Rendez-vous annule: ${appointmentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de l\'annulation du rendez-vous';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function deleteAppointment(appointmentId: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (deleteError) throw deleteError;

      logActivity('delete', 'appointments', `Rendez-vous supprime: ${appointmentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de la suppression du rendez-vous';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function bulkCancelAppointments(appointmentIds: string[], reason: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .in('id', appointmentIds);

      if (updateError) throw updateError;

      const modifications = appointmentIds.map(id => ({
        appointment_id: id,
        modification_type: 'cancelled',
        reason: reason,
        modified_at: new Date().toISOString(),
      }));

      await supabase
        .from('appointment_modifications')
        .insert(modifications);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de l\'annulation en masse';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function bulkDeleteAppointments(appointmentIds: string[]): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .in('id', appointmentIds);

      if (deleteError) throw deleteError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de la suppression en masse';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function canCancelAppointment(appointment: Appointment): boolean {
    return appointment.status !== 'cancelled' && appointment.status !== 'completed';
  }

  function canDeleteAppointment(appointment: Appointment): boolean {
    return appointment.status === 'cancelled' || appointment.status === 'no_show';
  }

  return {
    loading,
    error,
    cancelAppointment,
    deleteAppointment,
    bulkCancelAppointments,
    bulkDeleteAppointments,
    canCancelAppointment,
    canDeleteAppointment,
  };
}
