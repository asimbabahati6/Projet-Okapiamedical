import { AlertTriangle, X, Clock } from 'lucide-react';
import { useRBAC } from '@/contexts/RBACContext';
import { ROLE_DISPLAY_NAMES } from '@/utils/roleMapping';
import { useEffect, useState } from 'react';
import { simulationAuditService } from '@/services/simulationAuditService';

export function SimulationModeBanner() {
  const { isSimulationMode, userRole, actualRole, activeSession, endSimulation, simulationModeState } = useRBAC();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (activeSession) {
      const shouldWarn = simulationAuditService.shouldWarnAboutExpiry(activeSession);
      setShowWarning(shouldWarn);
    }
  }, [activeSession]);

  if (!isSimulationMode && simulationModeState !== 'LOCKED') return null;

  if (simulationModeState === 'LOCKED') {
    return (
      <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Mode Simulation Verrouillé</p>
              <p className="text-sm text-red-100">
                Le mode simulation a été temporairement désactivé par l'administrateur
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-semibold">MODE SIMULATION ACTIF</p>
            <p className="text-sm text-amber-100">
              Rôle réel: <span className="font-medium">{ROLE_DISPLAY_NAMES[actualRole as keyof typeof ROLE_DISPLAY_NAMES] || actualRole}</span>
              {' → '}
              Simulé: <span className="font-medium">{ROLE_DISPLAY_NAMES[userRole as keyof typeof ROLE_DISPLAY_NAMES] || userRole}</span>
            </p>
            {activeSession && activeSession.auto_end_minutes && (
              <div className="flex items-center gap-2 mt-1 text-xs">
                <Clock className="w-3 h-3" />
                {activeSession.minutes_remaining !== undefined && activeSession.minutes_remaining > 0 ? (
                  <span className={showWarning ? 'font-bold text-amber-900' : ''}>
                    Temps restant: {Math.floor(activeSession.minutes_remaining)} minutes
                    {showWarning && ' - La session va bientôt expirer!'}
                  </span>
                ) : (
                  <span className="font-bold text-amber-900">Session expirée</span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => endSimulation('user')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors font-medium"
        >
          <X className="w-4 h-4" />
          Quitter la Simulation
        </button>
      </div>
    </div>
  );
}
