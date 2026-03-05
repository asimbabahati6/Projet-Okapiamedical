import { simulationAuditService } from './simulationAuditService';

export const SENSITIVE_OPERATIONS = {
  delete_patient: 'Suppression de patient',
  delete_appointment: 'Suppression de rendez-vous',
  delete_prescription: 'Suppression d\'ordonnance',
  delete_consultation: 'Suppression de consultation',
  delete_lab_order: 'Suppression d\'analyse',
  modify_medical_record: 'Modification de dossier médical',
  dispense_medication_real: 'Délivrance réelle de médicament',
  approve_payment: 'Approbation de paiement',
  change_user_role: 'Changement de rôle utilisateur',
  delete_user: 'Suppression d\'utilisateur',
  modify_billing: 'Modification de facturation',
  delete_employee: 'Suppression d\'employé',
  approve_contract: 'Approbation de contrat',
  financial_transaction: 'Transaction financière',
  data_export: 'Export de données',
  system_settings: 'Paramètres système'
} as const;

export type SensitiveOperation = keyof typeof SENSITIVE_OPERATIONS;

export interface OperationCheckResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  warningMessage?: string;
  blockReason?: string;
}

class SecurityBoundariesService {
  private currentSessionId: string | null = null;

  setCurrentSessionId(sessionId: string | null) {
    this.currentSessionId = sessionId;
  }

  checkOperation(
    operation: SensitiveOperation,
    isSimulationMode: boolean
  ): OperationCheckResult {
    if (!isSimulationMode) {
      return {
        allowed: true,
        requiresConfirmation: this.isHighRiskOperation(operation)
      };
    }

    const operationConfig = this.getOperationConfig(operation);

    if (operationConfig.blockInSimulation) {
      return {
        allowed: false,
        requiresConfirmation: false,
        blockReason: `Cette opération "${SENSITIVE_OPERATIONS[operation]}" est bloquée en mode simulation pour des raisons de sécurité.`
      };
    }

    if (operationConfig.warnInSimulation) {
      return {
        allowed: true,
        requiresConfirmation: true,
        warningMessage: `Vous êtes en mode simulation. L'opération "${SENSITIVE_OPERATIONS[operation]}" sera enregistrée dans le journal d'audit.`
      };
    }

    return {
      allowed: true,
      requiresConfirmation: false
    };
  }

  async logOperationAttempt(
    operation: SensitiveOperation,
    allowed: boolean,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await simulationAuditService.logAction({
        sessionId: this.currentSessionId,
        actionType: allowed ? `operation_${operation}` : `blocked_${operation}`,
        resourceType,
        resourceId,
        details: {
          ...details,
          operation,
          operation_label: SENSITIVE_OPERATIONS[operation],
          allowed
        }
      });
    } catch (error) {
      console.error('Error logging operation attempt:', error);
    }
  }

  private getOperationConfig(operation: SensitiveOperation) {
    const configs: Record<
      SensitiveOperation,
      { blockInSimulation: boolean; warnInSimulation: boolean }
    > = {
      delete_patient: { blockInSimulation: true, warnInSimulation: false },
      delete_appointment: { blockInSimulation: false, warnInSimulation: true },
      delete_prescription: { blockInSimulation: true, warnInSimulation: false },
      delete_consultation: { blockInSimulation: true, warnInSimulation: false },
      delete_lab_order: { blockInSimulation: false, warnInSimulation: true },
      modify_medical_record: { blockInSimulation: false, warnInSimulation: true },
      dispense_medication_real: { blockInSimulation: true, warnInSimulation: false },
      approve_payment: { blockInSimulation: true, warnInSimulation: false },
      change_user_role: { blockInSimulation: true, warnInSimulation: false },
      delete_user: { blockInSimulation: true, warnInSimulation: false },
      modify_billing: { blockInSimulation: false, warnInSimulation: true },
      delete_employee: { blockInSimulation: true, warnInSimulation: false },
      approve_contract: { blockInSimulation: true, warnInSimulation: false },
      financial_transaction: { blockInSimulation: true, warnInSimulation: false },
      data_export: { blockInSimulation: false, warnInSimulation: true },
      system_settings: { blockInSimulation: true, warnInSimulation: false }
    };

    return configs[operation] || { blockInSimulation: false, warnInSimulation: true };
  }

  private isHighRiskOperation(operation: SensitiveOperation): boolean {
    const highRiskOps: SensitiveOperation[] = [
      'delete_patient',
      'delete_user',
      'delete_employee',
      'change_user_role',
      'approve_payment',
      'financial_transaction',
      'system_settings'
    ];

    return highRiskOps.includes(operation);
  }

  getOperationWarningDialog(
    operation: SensitiveOperation,
    isSimulationMode: boolean
  ): { title: string; message: string; confirmText: string } {
    const operationLabel = SENSITIVE_OPERATIONS[operation];

    if (isSimulationMode) {
      return {
        title: 'Confirmation requise - Mode Simulation',
        message: `Vous êtes sur le point d'effectuer l'opération "${operationLabel}" en mode simulation. Cette action sera enregistrée dans le journal d'audit. Voulez-vous continuer?`,
        confirmText: 'Continuer en simulation'
      };
    }

    return {
      title: 'Confirmation requise',
      message: `Vous êtes sur le point d'effectuer l'opération sensible "${operationLabel}". Cette action est irréversible. Êtes-vous sûr de vouloir continuer?`,
      confirmText: 'Confirmer l\'opération'
    };
  }

  async trackPageNavigation(
    sessionId: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    try {
      await simulationAuditService.logAction({
        sessionId,
        actionType: 'navigate',
        details: {
          from: fromPath,
          to: toPath,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking navigation:', error);
    }
  }

  async trackDataView(
    sessionId: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await simulationAuditService.logAction({
        sessionId,
        actionType: 'view',
        resourceType,
        resourceId,
        details
      });
    } catch (error) {
      console.error('Error tracking data view:', error);
    }
  }

  async trackDataModification(
    sessionId: string,
    resourceType: string,
    resourceId: string,
    operation: 'create' | 'update' | 'delete',
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await simulationAuditService.logAction({
        sessionId,
        actionType: operation,
        resourceType,
        resourceId,
        details
      });
    } catch (error) {
      console.error('Error tracking data modification:', error);
    }
  }

  getSensitiveOperationsReport(sessionId: string): Promise<any[]> {
    return simulationAuditService.getSessionActions(sessionId);
  }

  getSandboxMode(): boolean {
    return false;
  }
}

export const securityBoundariesService = new SecurityBoundariesService();
