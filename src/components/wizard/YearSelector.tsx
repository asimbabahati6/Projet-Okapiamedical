import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface YearSelectorProps {
  value: number | '';
  onChange: (year: number) => void;
  label: string;
  error?: string;
  required?: boolean;
  maxYear?: number;
  minYear?: number;
}

export function YearSelector({
  value,
  onChange,
  label,
  error,
  required = false,
  maxYear = new Date().getFullYear(),
  minYear = 1950,
}: YearSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  const filteredYears = searchTerm
    ? years.filter((year) => year.toString().includes(searchTerm))
    : years;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (year: number) => {
    onChange(year);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col gap-1" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2 text-left bg-white border rounded-lg
            flex items-center justify-between
            transition-colors
            ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}
            ${isOpen ? 'ring-2 ring-blue-200' : ''}
            hover:border-gray-400
          `}
        >
          <span className={value === '' ? 'text-gray-400' : 'text-gray-900'}>
            {value || 'Sélectionner une année'}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto max-h-48">
              {filteredYears.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Aucune année trouvée
                </div>
              ) : (
                filteredYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleSelect(year)}
                    className={`
                      w-full px-4 py-2 text-left text-sm
                      transition-colors
                      ${year === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    {year}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
