import { useState, useCallback } from 'react';
import { Upload, X, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface UploadedImage {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  sequence_number: number;
  description?: string;
  view_type?: string;
}

interface ImageUploaderProps {
  examId: string;
  onUploadSuccess: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

export default function ImageUploader({ examId, onUploadSuccess, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const ACCEPTED_FORMATS = ['.dcm', '.jpg', '.jpeg', '.png', '.pdf'];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      await handleFiles(files);
    },
    [disabled, examId]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    const files = Array.from(e.target.files);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setError(null);

    for (const file of files) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_FORMATS.includes(extension)) {
        setError(`Format non supporté : ${file.name}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`Fichier trop volumineux : ${file.name} (max 50 MB)`);
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${examId}_${Date.now()}.${fileExt}`;
      const filePath = `radiology/${examId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('medical-images')
        .getPublicUrl(filePath);

      const newImage: UploadedImage = {
        id: Date.now().toString(),
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        sequence_number: uploadedImages.length + 1
      };

      const updatedImages = [...uploadedImages, newImage];
      setUploadedImages(updatedImages);
      onUploadSuccess(updatedImages);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors du téléchargement du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = uploadedImages.filter((img) => img.id !== imageId);
    setUploadedImages(updatedImages);
    onUploadSuccess(updatedImages);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-cyan-500 bg-cyan-50'
            : 'border-gray-300 bg-gray-50 hover:border-cyan-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        >
          <Upload className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Glissez vos images ici ou cliquez pour parcourir
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Formats acceptés : {ACCEPTED_FORMATS.join(', ')}
          </p>
          <p className="text-xs text-gray-500">Taille maximale : 50 MB par fichier</p>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <p className="text-sm text-blue-700">Téléchargement en cours...</p>
        </div>
      )}

      {/* Uploaded Images List */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Images téléchargées ({uploadedImages.length})
          </h4>
          <div className="space-y-2">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileImage className="w-8 h-8 text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {image.file_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Séquence {image.sequence_number} · {formatFileSize(image.file_size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={disabled}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
