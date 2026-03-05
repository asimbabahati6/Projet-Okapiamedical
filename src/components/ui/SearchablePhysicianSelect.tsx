import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, UserCheck, Stethoscope, X } from 'lucide-react';

interface PhysicianOption {
  id: string;
  name: string;
  specialization: string | null;
  rpps_number: string | null;
  is_accepting_patients: boolean;
}

interface SearchablePhysicianSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  physicians: PhysicianOption[];
  loading?: boolean;
  error?: string;
  placeholder?: string;
}

export default function SearchablePhysicianSelect({
  value,
  onChange,
  physicians,
  loading = false,
  error,
  placeholder = "Rechercher un médecin..."
}: SearchablePhysicianSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPhysician = physicians.find(p => p.id === value);

  const filteredPhysicians = physicians.filter(physician => {
    const searchLower = searchTerm.toLowerCase();
    return (
      physician.name.toLowerCase().includes(searchLower) ||
      (physician.specialization?.toLowerCase().includes(searchLower)) ||
      (physician.rpps_number?.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredPhysicians.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredPhysicians[focusedIndex]) {
          handleSelect(filteredPhysicians[focusedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Chargement des médecins...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full px-4 py-3 border rounded-lg cursor-pointer transition-all ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${error ? 'border-red-500' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          {selectedPhysician ? (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{selectedPhysician.name}</div>
                {selectedPhysician.specialization && (
                  <div className="text-xs text-gray-600">{selectedPhysician.specialization}</div>
                )}
              </div>
              {selectedPhysician.is_accepting_patients && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <UserCheck className="w-3 h-3" />
                  Accepte
                </span>
              )}
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Search className="w-4 h-4" />
              <span>Aucun médecin sélectionné (assignation automatique)</span>
            </div>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {filteredPhysicians.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Stethoscope className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">Aucun médecin trouvé</p>
                <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleSelect('')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700">Aucun médecin sélectionné</div>
                      <div className="text-xs text-gray-500">Assignation automatique</div>
                    </div>
                  </div>
                </button>

                {filteredPhysicians.map((physician, index) => (
                  <button
                    key={physician.id}
                    onClick={() => handleSelect(physician.id)}
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                      focusedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                    } ${value === physician.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">
                          {physician.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{physician.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {physician.specialization && (
                            <span className="text-xs text-gray-600">{physician.specialization}</span>
                          )}
                          {physician.rpps_number && (
                            <span className="text-xs text-gray-400">RPPS: {physician.rpps_number}</span>
                          )}
                        </div>
                      </div>
                      {physician.is_accepting_patients && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex-shrink-0">
                          <UserCheck className="w-3 h-3" />
                          Accepte
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Si aucun médecin n'est sélectionné, un médecin sera assigné automatiquement
      </p>
    </div>
  );
}
