import { User, GraduationCap, Phone, Briefcase, CreditCard, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { StepNumber, STEP_NAMES } from '../../types/employeeForm';

interface TabNavigationProps {
  currentTab: StepNumber;
  onTabChange: (tab: StepNumber) => void;
  tabErrors: Record<number, number>;
}

const TAB_ICONS = {
  1: User,
  2: GraduationCap,
  3: Phone,
  4: Briefcase,
  5: CreditCard,
  6: UserPlus,
  7: CheckCircle2,
};

export function TabNavigation({ currentTab, onTabChange, tabErrors }: TabNavigationProps) {
  const tabs = [1, 2, 3, 4, 5, 6, 7] as StepNumber[];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const isActive = currentTab === tab;
          const hasErrors = tabErrors[tab] > 0;

          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap
                ${isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{STEP_NAMES[tab]}</span>
              {hasErrors && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
