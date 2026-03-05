import React, { createContext, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotifications } from './NotificationContext';
import {
  LabOrderStatus,
  NotificationType,
  NotificationPriority,
  UserRole
} from '@/core/types/enums';
import { LabOrder } from '@/core/types/models';

interface WorkflowContextType {
  createLabOrder: (orderData: Partial<LabOrder>) => Promise<string | null>;
  processLabOrder: (orderId: string, technicianId: string) => Promise<void>;
  submitLabResults: (orderId: string, results: any, fileUrl?: string) => Promise<void>;
  validateLabResults: (orderId: string, validatorId: string) => Promise<void>;
  notifyResultsReady: (orderId: string) => Promise<void>;
  createPrescription: (prescriptionData: any) => Promise<string | null>;
  dispensePrescription: (prescriptionId: string, pharmacistId: string) => Promise<void>;
  confirmAppointment: (appointmentId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification, showToast } = useNotifications();

  const createLabOrder = useCallback(async (orderData: Partial<LabOrder>) => {
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .insert([
          {
            ...orderData,
            status: LabOrderStatus.PRESCRIBED,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const labTechs = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('role', UserRole.LAB_TECHNICIAN);

      if (labTechs.data) {
        for (const tech of labTechs.data) {
          await addNotification({
            user_id: tech.user_id,
            type: NotificationType.LAB_ORDER_CREATED,
            priority: orderData.urgency === 'stat' ? NotificationPriority.URGENT : NotificationPriority.MEDIUM,
            title: 'Nouvelle demande d\'analyse',
            message: `Nouvelle demande d'analyse: ${orderData.test_name}`,
            data: { lab_order_id: data.id, urgency: orderData.urgency },
            read: false
          });
        }
      }

      showToast('Succès', 'Demande d\'analyse créée avec succès', 'success');
      return data.id;
    } catch (error) {
      console.error('Error creating lab order:', error);
      showToast('Erreur', 'Impossible de créer la demande d\'analyse', 'error');
      return null;
    }
  }, [addNotification, showToast]);

  const processLabOrder = useCallback(async (orderId: string, technicianId: string) => {
    try {
      const { error } = await supabase
        .from('lab_orders')
        .update({
          status: LabOrderStatus.IN_PROGRESS,
          processing_started_at: new Date().toISOString(),
          assigned_technician_id: technicianId
        })
        .eq('id', orderId);

      if (error) throw error;

      showToast('Succès', 'Analyse en cours de traitement', 'success');
    } catch (error) {
      console.error('Error processing lab order:', error);
      showToast('Erreur', 'Impossible de démarrer le traitement', 'error');
    }
  }, [showToast]);

  const submitLabResults = useCallback(async (orderId: string, results: any, fileUrl?: string) => {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('lab_orders')
        .select('*, doctor:doctors!lab_orders_doctor_id_fkey(user_id)')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('lab_orders')
        .update({
          status: LabOrderStatus.COMPLETED,
          results,
          results_file_url: fileUrl,
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      if (order.doctor?.user_id) {
        await addNotification({
          user_id: order.doctor.user_id,
          type: NotificationType.LAB_RESULTS_READY,
          priority: NotificationPriority.HIGH,
          title: 'Résultats disponibles',
          message: `Les résultats de l'analyse ${order.test_name} sont disponibles`,
          data: { lab_order_id: orderId },
          read: false
        });
      }

      showToast('Succès', 'Résultats soumis avec succès', 'success');
    } catch (error) {
      console.error('Error submitting lab results:', error);
      showToast('Erreur', 'Impossible de soumettre les résultats', 'error');
    }
  }, [addNotification, showToast]);

  const validateLabResults = useCallback(async (orderId: string, validatorId: string) => {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('lab_orders')
        .select('*, doctor:doctors!lab_orders_doctor_id_fkey(user_id), patient:patients(user_id)')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('lab_orders')
        .update({
          status: LabOrderStatus.VALIDATED,
          validated_by: validatorId,
          validated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await notifyResultsReady(orderId);

      showToast('Succès', 'Résultats validés et envoyés', 'success');
    } catch (error) {
      console.error('Error validating lab results:', error);
      showToast('Erreur', 'Impossible de valider les résultats', 'error');
    }
  }, [showToast]);

  const notifyResultsReady = useCallback(async (orderId: string) => {
    try {
      const { data: order, error } = await supabase
        .from('lab_orders')
        .select('*, doctor:doctors!lab_orders_doctor_id_fkey(user_id), patient:patients(user_id)')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (order.doctor?.user_id) {
        await addNotification({
          user_id: order.doctor.user_id,
          type: NotificationType.LAB_RESULTS_READY,
          priority: NotificationPriority.HIGH,
          title: 'Résultats validés',
          message: `Les résultats de ${order.test_name} ont été validés`,
          data: { lab_order_id: orderId },
          read: false
        });
      }

      if (order.patient?.user_id) {
        await addNotification({
          user_id: order.patient.user_id,
          type: NotificationType.LAB_RESULTS_READY,
          priority: NotificationPriority.MEDIUM,
          title: 'Résultats disponibles',
          message: 'Vos résultats d\'analyse sont disponibles',
          data: { lab_order_id: orderId },
          read: false
        });
      }

      const { error: statusError } = await supabase
        .from('lab_orders')
        .update({ status: LabOrderStatus.RESULTS_SENT })
        .eq('id', orderId);

      if (statusError) throw statusError;
    } catch (error) {
      console.error('Error notifying results ready:', error);
    }
  }, [addNotification]);

  const createPrescription = useCallback(async (prescriptionData: any) => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert([prescriptionData])
        .select()
        .single();

      if (error) throw error;

      const { data: pharmacists } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('role', UserRole.PHARMACIST);

      if (pharmacists) {
        for (const pharmacist of pharmacists) {
          await addNotification({
            user_id: pharmacist.user_id,
            type: NotificationType.PRESCRIPTION_CREATED,
            priority: NotificationPriority.MEDIUM,
            title: 'Nouvelle prescription',
            message: 'Une nouvelle prescription a été créée',
            data: { prescription_id: data.id },
            read: false
          });
        }
      }

      showToast('Succès', 'Prescription créée avec succès', 'success');
      return data.id;
    } catch (error) {
      console.error('Error creating prescription:', error);
      showToast('Erreur', 'Impossible de créer la prescription', 'error');
      return null;
    }
  }, [addNotification, showToast]);

  const dispensePrescription = useCallback(async (prescriptionId: string, pharmacistId: string) => {
    try {
      const { data: prescription, error: fetchError } = await supabase
        .from('prescriptions')
        .select('*, doctor:doctors!prescriptions_doctor_id_fkey(user_id), patient:patients(user_id)')
        .eq('id', prescriptionId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('prescriptions')
        .update({
          status: 'completed',
          dispensed_at: new Date().toISOString(),
          dispensed_by: pharmacistId
        })
        .eq('id', prescriptionId);

      if (updateError) throw updateError;

      if (prescription.doctor?.user_id) {
        await addNotification({
          user_id: prescription.doctor.user_id,
          type: NotificationType.PRESCRIPTION_DISPENSED,
          priority: NotificationPriority.LOW,
          title: 'Prescription dispensée',
          message: 'Une prescription a été dispensée',
          data: { prescription_id: prescriptionId },
          read: false
        });
      }

      showToast('Succès', 'Prescription dispensée', 'success');
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      showToast('Erreur', 'Impossible de dispenser la prescription', 'error');
    }
  }, [addNotification, showToast]);

  const confirmAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*, patient:patients(user_id)')
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      if (appointment.patient?.user_id) {
        await addNotification({
          user_id: appointment.patient.user_id,
          type: NotificationType.APPOINTMENT_CONFIRMED,
          priority: NotificationPriority.MEDIUM,
          title: 'Rendez-vous confirmé',
          message: `Votre rendez-vous du ${new Date(appointment.appointment_date).toLocaleDateString()} est confirmé`,
          data: { appointment_id: appointmentId },
          read: false
        });
      }

      showToast('Succès', 'Rendez-vous confirmé', 'success');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      showToast('Erreur', 'Impossible de confirmer le rendez-vous', 'error');
    }
  }, [addNotification, showToast]);

  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    try {
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*, patient:patients(user_id), doctor:doctors!appointments_doctor_id_fkey(user_id)')
        .eq('id', appointmentId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: reason ? `Annulé: ${reason}` : 'Annulé'
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      const usersToNotify = [
        appointment.patient?.user_id,
        appointment.doctor?.user_id
      ].filter(Boolean);

      for (const userId of usersToNotify) {
        await addNotification({
          user_id: userId!,
          type: NotificationType.APPOINTMENT_CANCELLED,
          priority: NotificationPriority.HIGH,
          title: 'Rendez-vous annulé',
          message: `Le rendez-vous du ${new Date(appointment.appointment_date).toLocaleDateString()} a été annulé${reason ? `: ${reason}` : ''}`,
          data: { appointment_id: appointmentId },
          read: false
        });
      }

      showToast('Succès', 'Rendez-vous annulé', 'success');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      showToast('Erreur', 'Impossible d\'annuler le rendez-vous', 'error');
    }
  }, [addNotification, showToast]);

  return (
    <WorkflowContext.Provider
      value={{
        createLabOrder,
        processLabOrder,
        submitLabResults,
        validateLabResults,
        notifyResultsReady,
        createPrescription,
        dispensePrescription,
        confirmAppointment,
        cancelAppointment
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
