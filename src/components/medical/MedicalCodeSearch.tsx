import { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';
import { searchMedicalCodes } from '../../utils/medicalCodes';
import { MedicalCodeSearchResult } from '../../types/database';

interface MedicalCodeSearchProps {
  codeSystem: 'icd10' | 'ccam' | 'loinc' | 'snomed';
  onCodeSelect: (code: MedicalCodeSearchResult) => void;
  selectedCode?: string | null;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function MedicalCodeSearch({
  codeSystem,
  onCodeSelect,
  selectedCode = null,
  placeholder = 'Rechercher un code médical...',
  label,
  required = false,
}: MedicalCodeSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<MedicalCodeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<MedicalCodeSearchResult | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = setTimeout(async () => {
        setIsSearching(true);
        const searchResults = await searchMedicalCodes(searchTerm, codeSystem, 15);
        setResults(searchResults);
        setIsSearching(false);
        setShowResults(true);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, codeSystem]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectCode(result: MedicalCodeSearchResult) {
    setSelectedResult(result);
    setSearchTerm(result.label);
    setShowResults(false);
    onCodeSelect(result);
  }

  function handleClearSelection() {
    setSelectedResult(null);
    setSearchTerm('');
    setResults([]);
    onCodeSelect({ code: '', label: '', description: null, category: null, relevance: 0 });
  }

  function getSystemLabel(): string {
    switch (codeSystem) {
      case 'icd10':
        return 'CIM-10';
      case 'ccam':
        return 'CCAM';
      case 'loinc':
        return 'LOINC';
      case 'snomed':
        return 'SNOMED CT';
      default:
        return 'Code';
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {(searchTerm || selectedResult) && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {selectedResult && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold text-green-900">
                {selectedResult.code}
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {getSystemLabel()}
              </span>
            </div>
            <p className="text-sm text-green-800 font-medium mt-1">{selectedResult.label}</p>
            {selectedResult.description && (
              <p className="text-xs text-green-700 mt-1">{selectedResult.description}</p>
            )}
          </div>
        </div>
      )}

      {showResults && results.length > 0 && !selectedResult && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs text-gray-600 font-medium">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {results.map((result, index) => (
              <button
                key={`${result.code}-${index}`}
                type="button"
                onClick={() => handleSelectCode(result)}
                className="w-full p-3 text-left hover:bg-blue-50 transition-colors focus:bg-blue-50 focus:outline-none"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-blue-900">
                        {result.code}
                      </span>
                      {result.category && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {result.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 font-medium mt-1">{result.label}</p>
                    {result.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{result.description}</p>
                    )}
                  </div>

                  <div className="flex items-center text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {Math.round(result.relevance * 100)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && searchTerm.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            Aucun code trouvé pour "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
