import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { validateImageFile, generateInitials } from '../../services/patientPhotoService';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  firstName?: string;
  lastName?: string;
  onPhotoSelect: (file: File) => void;
  onPhotoRemove: () => void;
  disabled?: boolean;
}

export function PhotoUpload({
  currentPhotoUrl,
  firstName = '',
  lastName = '',
  onPhotoSelect,
  onPhotoRemove,
  disabled = false,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError('');

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onPhotoSelect(file);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    onPhotoRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const initials = generateInitials(firstName, lastName);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div
          className={`w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center cursor-pointer transition-all ${
            isDragging ? 'border-blue-500 scale-105' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {preview ? (
            <img
              src={preview}
              alt="Patient"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-3xl font-bold">
              {initials || <Camera className="w-12 h-12" />}
            </div>
          )}
        </div>

        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {preview && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="text-center">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {preview ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG ou WEBP (max. 5MB)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
