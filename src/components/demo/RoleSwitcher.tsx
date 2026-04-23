import { Stethoscope, FlaskConical, Pill } from 'lucide-react';
import { useWorkflow, type DemoRole } from '../../contexts/WorkflowContext';

const ROLES: { key: DemoRole; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  {
    key: 'medecin',
    label: 'Médecin',
    sublabel: 'Dr. Amani Katebe',
    icon: Stethoscope,
    color: 'text-blue-600',
    bg: 'bg-white',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    activeBorder: 'border-blue-600',
  },
  {
    key: 'laborantin',
    label: 'Laborantin',
    sublabel: 'Serge Ndombe',
    icon: FlaskConical,
    color: 'text-emerald-600',
    bg: 'bg-white',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    activeBorder: 'border-emerald-600',
  },
  {
    key: 'pharmacien',
    label: 'Pharmacien',
    sublabel: 'Grâce Mutombo',
    icon: Pill,
    color: 'text-orange-500',
    bg: 'bg-white',
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
    activeBorder: 'border-orange-500',
  },
];

export function RoleSwitcher() {
  const { role, setRole } = useWorkflow();

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
      {ROLES.map(r => {
        const Icon = r.icon;
        const isActive = role === r.key;
        return (
          <button
            key={r.key}
            onClick={() => setRole(r.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? `${r.activeBg} ${r.activeText} shadow-sm`
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RoleBadge() {
  const { role } = useWorkflow();
  const r = ROLES.find(x => x.key === role)!;
  const Icon = r.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${r.activeBg} ${r.activeText}`}>
      <Icon className="w-3 h-3" />
      <span>{r.label}</span>
      <span className="opacity-75">— {r.sublabel}</span>
    </div>
  );
}
