import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface SkillsTagInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  label: string;
  placeholder?: string;
  error?: string;
  maxSkills?: number;
  maxSkillLength?: number;
}

export function SkillsTagInput({
  value,
  onChange,
  label,
  placeholder = 'Ajouter une compétence...',
  error,
  maxSkills = 15,
  maxSkillLength = 50,
}: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAddSkill = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }

    if (trimmedValue.length > maxSkillLength) {
      setInputError(`Maximum ${maxSkillLength} caractères`);
      return;
    }

    if (value.includes(trimmedValue)) {
      setInputError('Cette compétence existe déjà');
      return;
    }

    if (value.length >= maxSkills) {
      setInputError(`Maximum ${maxSkills} compétences`);
      return;
    }

    onChange([...value, trimmedValue]);
    setInputValue('');
    setInputError('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    } else if (e.key === ',' && inputValue.trim()) {
      e.preventDefault();
      handleAddSkill();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
  };

  const handleClearAll = () => {
    onChange([]);
    setInputValue('');
    setInputError('');
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Tout effacer
          </button>
        )}
      </div>

      <div
        className={`
          w-full min-h-[42px] px-3 py-2 bg-white border rounded-lg
          flex flex-wrap gap-2 items-center
          transition-colors
          ${error || inputError ? 'border-red-500 focus-within:ring-red-200' : 'border-gray-300 focus-within:ring-blue-200'}
          focus-within:ring-2
        `}
      >
        {value.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill)}
              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              aria-label={`Supprimer ${skill}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            maxLength={maxSkillLength}
            className="flex-1 outline-none bg-transparent text-sm"
            disabled={value.length >= maxSkills}
          />

          {inputValue.trim() && (
            <button
              type="button"
              onClick={handleAddSkill}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              aria-label="Ajouter la compétence"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {(error || inputError) && (
        <p className="text-sm text-red-600">{error || inputError}</p>
      )}

      <p className="text-xs text-gray-500">
        {value.length}/{maxSkills} compétences • Appuyez sur Entrée ou , pour ajouter
      </p>
    </div>
  );
}
