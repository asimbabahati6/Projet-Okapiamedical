import { useState } from 'react';
import { Calendar, Camera, X, Check, Loader2, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  subServices: string[];
  imageUrl: string;
  defaultImageUrl: string;
  isAdmin?: boolean;
  isEditing?: boolean;
  isSaving?: boolean;
  onBook: () => void;
  onOpenEditor?: (id: string) => void;
  onCloseEditor?: () => void;
  onSaveImage?: (id: string, url: string) => void;
  onResetImage?: (id: string, defaultUrl: string) => void;
}

export function ServiceCard({
  id,
  title,
  icon: Icon,
  description,
  subServices,
  imageUrl,
  defaultImageUrl,
  isAdmin = false,
  isEditing = false,
  isSaving = false,
  onBook,
  onOpenEditor,
  onCloseEditor,
  onSaveImage,
  onResetImage,
}: ServiceCardProps) {
  const [imageInput, setImageInput] = useState(imageUrl);
  const [imgError, setImgError] = useState(false);

  const displayImage = imgError ? defaultImageUrl : imageUrl;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden h-[200px] flex-shrink-0 bg-gray-100">
        <img
          src={displayImage}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Admin edit button */}
        {isAdmin && !isEditing && onOpenEditor && (
          <button
            onClick={() => onOpenEditor(id)}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 rounded-lg p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
            title="Modifier l'image"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Admin image editor */}
      {isAdmin && isEditing && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">URL de l'image</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="https://images.pexels.com/..."
              className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              disabled={isSaving}
              onClick={() => onSaveImage?.(id, imageInput)}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              title="Sauvegarder"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onResetImage?.(id, defaultImageUrl)}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onCloseEditor}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              title="Annuler"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {/* Title + icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 text-justify leading-relaxed line-clamp-3 mb-4">
          {description}
        </p>

        {/* Sub-services */}
        <ul className="space-y-1.5 mb-6 flex-1">
          {subServices.slice(0, 4).map((sub) => (
            <li key={sub} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              {sub}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={onBook}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
        >
          <Calendar className="w-4 h-4" />
          Prendre rendez-vous
        </button>
      </div>
    </div>
  );
}
