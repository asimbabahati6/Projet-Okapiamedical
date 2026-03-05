import { Shield, X } from 'lucide-react';
import { useRBAC } from '@/contexts/RBACContext';
import { ROLE_DISPLAY_NAMES } from '@/utils/roleMapping';

export function SimulationFloatingBadge() {
  const { isSimulationMode, userRole, endSimulation } = useRBAC();

  if (!isSimulationMode) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-amber-500 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-3 border-2 border-amber-600">
        <Shield className="w-5 h-5" />
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide">Simulation</span>
          <span className="text-sm font-bold">
            {ROLE_DISPLAY_NAMES[userRole as keyof typeof ROLE_DISPLAY_NAMES] || userRole}
          </span>
        </div>
        <button
          onClick={() => endSimulation('user')}
          className="ml-2 p-1 hover:bg-amber-600 rounded-full transition-colors"
          title="Quitter la simulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
