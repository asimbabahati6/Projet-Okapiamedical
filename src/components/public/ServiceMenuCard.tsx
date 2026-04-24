import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Service, ServiceCategory } from '../../types/database';
import { useLanguage } from '../../contexts/LanguageContext';
import * as Icons from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope: Icons.Stethoscope,
  Scan: Icons.Scan,
  UserCheck: Icons.UserCheck,
  Activity: Icons.Activity,
  Smile: Icons.Smile,
  TestTube: Icons.TestTube,
  Search: Icons.Search,
  Dumbbell: Icons.Dumbbell,
  Microscope: Icons.Microscope,
  HeartPulse: Icons.HeartPulse,
  Syringe: Icons.Syringe,
  ClipboardList: Icons.ClipboardList,
  Pill: Icons.Pill,
  Scissors: Icons.Scissors,
  Heart: Icons.Heart,
};

interface ServiceMenuCardProps {
  category: ServiceCategory;
  services: Service[];
  onNavigate?: (page: string) => void;
  showSubmenu?: boolean;
}

export function ServiceMenuCard({ category, services, onNavigate, showSubmenu = true }: ServiceMenuCardProps) {
  const { language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const IconComponent = category.icon ? iconMap[category.icon] : Icons.Stethoscope;
  const hasSubServices = services.length > 1 || (services.length === 1 && services[0].name !== category.name);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
    if (hasSubServices && showSubmenu) {
      timeoutRef.current = setTimeout(() => {
        setShowMenu(true);
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(false);
    timeoutRef.current = setTimeout(() => {
      setShowMenu(false);
    }, 150);
  };

  const getCategoryName = (cat: ServiceCategory): string => {
    if (language === 'en') return cat.name_en;
    if (language === 'ar') return cat.name_ar;
    return cat.name;
  };

  const getServiceName = (service: Service): string => {
    if (language === 'en') return service.name_en;
    if (language === 'ar') return service.name_ar;
    return service.name;
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate('services');
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className={`w-full bg-white p-6 rounded-xl shadow-sm transition-all duration-300 text-center group ${
          isHovered ? 'shadow-lg scale-105' : 'hover:shadow-md'
        }`}
      >
        <div className="relative">
          <div className={`bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-3 transition-all duration-300 ${
            isHovered ? 'bg-blue-600 scale-110' : 'group-hover:bg-blue-200'
          }`}>
            {IconComponent && (
              <IconComponent className={`w-7 h-7 transition-colors duration-300 ${
                isHovered ? 'text-white' : 'text-blue-600'
              }`} />
            )}
          </div>
          {hasSubServices && showSubmenu && (
            <ChevronDown className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 text-blue-600 transition-transform duration-300 ${
              showMenu ? 'rotate-180' : ''
            }`} />
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
          {getCategoryName(category)}
        </h3>
      </button>

      {showMenu && hasSubServices && showSubmenu && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-fade-in"
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            setShowMenu(true);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45"></div>

          <div className="relative bg-white rounded-lg">
            {services.map((service) => {
              const ServiceIcon = service.icon ? iconMap[service.icon] : null;

              return (
                <button
                  key={service.id}
                  onClick={handleClick}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors duration-200 text-left group/item"
                >
                  {ServiceIcon && (
                    <div className="bg-blue-50 p-2 rounded-md flex-shrink-0 group-hover/item:bg-blue-100 transition-colors">
                      <ServiceIcon className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 group-hover/item:text-blue-600 font-medium">
                    {getServiceName(service)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
