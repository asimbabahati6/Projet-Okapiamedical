import { useState, useEffect, useRef } from 'react';
import { Search, X, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ICD10Code } from '../../types/database';

interface ICD10AutocompleteProps {
  value: {
    code: string;
    description: string;
    isFreeText: boolean;
  } | null;
  onChange: (value: {
    code: string;
    description: string;
    isFreeText: boolean;
    icd10_code_id?: string;
  } | null) => void;
  placeholder?: string;
  className?: string;
}

export function ICD10Autocomplete({
  value,
  onChange,
  placeholder = 'Rechercher un code ICD-10 ou entrer du texte libre...',
  className = ''
}: ICD10AutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ICD10Code[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFreeTextMode, setIsFreeTextMode] = useState(value?.isFreeText || false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && !isFreeTextMode) {
      setSearchTerm(`${value.code} - ${value.description}`);
    } else if (value && isFreeTextMode) {
      setSearchTerm(value.description);
    }
  }, [value, isFreeTextMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2 && !isFreeTextMode) {
      searchICD10Codes(searchTerm);
    } else {
      setResults([]);
    }
  }, [searchTerm, isFreeTextMode]);

  async function searchICD10Codes(query: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('icd10_codes')
        .select('*')
        .or(`code.ilike.%${query}%,description_fr.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Error searching ICD-10 codes:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(code: ICD10Code) {
    onChange({
      code: code.code,
      description: code.description_fr,
      isFreeText: false,
      icd10_code_id: code.id
    });
    setSearchTerm(`${code.code} - ${code.description_fr}`);
    setIsOpen(false);
  }

  function handleFreeTextChange(text: string) {
    setSearchTerm(text);
    if (text.trim()) {
      onChange({
        code: '',
        description: text,
        isFreeText: true
      });
    } else {
      onChange(null);
    }
  }

  function handleClear() {
    setSearchTerm('');
    onChange(null);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function toggleMode() {
    const newMode = !isFreeTextMode;
    setIsFreeTextMode(newMode);
    setSearchTerm('');
    onChange(null);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {isFreeTextMode ? <Edit3 className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            const newValue = e.target.value;
            setSearchTerm(newValue);
            if (isFreeTextMode) {
              handleFreeTextChange(newValue);
            }
          }}
          onFocus={() => {
            if (!isFreeTextMode && searchTerm.length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Effacer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleMode}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              isFreeTextMode
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            title={isFreeTextMode ? 'Passer en mode ICD-10' : 'Passer en mode texte libre'}
          >
            {isFreeTextMode ? 'Texte libre' : 'ICD-10'}
          </button>
        </div>
      </div>

      {isOpen && !isFreeTextMode && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-3 text-center text-gray-500 text-sm">
              Recherche...
            </div>
          )}

          {!loading && results.length === 0 && searchTerm.length >= 2 && (
            <div className="p-3 text-center text-gray-500 text-sm">
              Aucun code trouvé
            </div>
          )}

          {!loading && results.map((code) => (
            <button
              key={code.id}
              type="button"
              onClick={() => handleSelect(code)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono font-semibold rounded">
                    {code.code}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">
                    {code.description_fr}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{code.category}</span>
                    {code.subcategory && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{code.subcategory}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-2 text-xs text-gray-600">
          {isFreeTextMode ? (
            <span className="flex items-center gap-1">
              <Edit3 className="w-3 h-3" />
              Mode texte libre
            </span>
          ) : value.code && (
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              Code: <span className="font-mono font-semibold">{value.code}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
