import { useCallback } from 'react';
import { useRBAC } from '@/contexts/RBACContext';
import {
  securityBoundariesService,
  type SensitiveOperation,
  type OperationCheckResult
} from '@/services/securityBoundariesService';

export function useSecurityBoundaries() {
  const { isSimulationMode, currentSessionId } = useRBAC();

  const checkOperation = useCallback(
    (operation: SensitiveOperation): OperationCheckResult => {
      return securityBoundariesService.checkOperation(operation, isSimulationMode);
    },
    [isSimulationMode]
  );

  const confirmOperation = useCallback(
    async (operation: SensitiveOperation): Promise<boolean> => {
      const result = checkOperation(operation);

      if (!result.allowed) {
        alert(result.blockReason || 'Opération non autorisée');
        await securityBoundariesService.logOperationAttempt(operation, false);
        return false;
      }

      if (result.requiresConfirmation || result.warningMessage) {
        const dialog = securityBoundariesService.getOperationWarningDialog(
          operation,
          isSimulationMode
        );
        const confirmed = window.confirm(`${dialog.title}\n\n${dialog.message}`);

        await securityBoundariesService.logOperationAttempt(
          operation,
          confirmed,
          undefined,
          undefined,
          { user_confirmed: confirmed }
        );

        return confirmed;
      }

      return true;
    },
    [checkOperation, isSimulationMode]
  );

  const trackView = useCallback(
    async (resourceType: string, resourceId: string, details?: Record<string, any>) => {
      if (isSimulationMode && currentSessionId) {
        await securityBoundariesService.trackDataView(
          currentSessionId,
          resourceType,
          resourceId,
          details
        );
      }
    },
    [isSimulationMode, currentSessionId]
  );

  const trackModification = useCallback(
    async (
      resourceType: string,
      resourceId: string,
      operation: 'create' | 'update' | 'delete',
      details?: Record<string, any>
    ) => {
      if (isSimulationMode && currentSessionId) {
        await securityBoundariesService.trackDataModification(
          currentSessionId,
          resourceType,
          resourceId,
          operation,
          details
        );
      }
    },
    [isSimulationMode, currentSessionId]
  );

  return {
    checkOperation,
    confirmOperation,
    trackView,
    trackModification,
    isSimulationMode
  };
}
