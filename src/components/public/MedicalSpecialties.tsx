import { Activity, Smile, Microscope, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Specialty {
  id: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

// Activity: physical movement/rehabilitation (Kinésithérapie)
// Smile: oral/dental health (Dentisterie)
// Microscope: laboratory analysis (Laboratoire)
// UserCheck: credentialed specialist encounter (Consultation spécialisée)
const SPECIALTIES: Specialty[] = [
  {
    id: 'kinesitherapie',
    label: 'Kinésithérapie',
    icon: Activity,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'dentisterie',
    label: 'Dentisterie',
    icon: Smile,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    id: 'laboratoire',
    label: 'Laboratoire',
    icon: Microscope,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'consultation-specialisee',
    label: 'Consultation spécialisée',
    icon: UserCheck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
];

export function MedicalSpecialties() {
  return (
    <section aria-label="Spécialités médicales" className="w-full py-8 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {SPECIALTIES.map(({ id, label, icon: Icon, iconBg, iconColor }) => (
          <div
            key={id}
            className="flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500"
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBg}`}
              aria-hidden="true"
            >
              <Icon className={`w-7 h-7 ${iconColor}`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 text-center leading-snug">
              {label}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}
