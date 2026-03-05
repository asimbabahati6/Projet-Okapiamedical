import { useState } from 'react';
import { Download, X, ZoomIn, File, FileText, FileSpreadsheet } from 'lucide-react';

interface FilePreviewProps {
  url: string;
  name: string;
  type: string;
  size?: number;
  onRemove?: () => void;
  onDownload?: () => void;
  variant?: 'staging' | 'message';
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('xlsx') || type.includes('xls'))
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  if (type.includes('word') || type.includes('doc'))
    return <FileText className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

function ImageSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 rounded-xl" style={{ width: 220, height: 160 }} />
  );
}

function Lightbox({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full mb-3 px-1">
          <span className="text-white/80 text-sm truncate max-w-xs">{name}</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <img
          src={url}
          alt={name}
          className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
        />
      </div>
    </div>
  );
}

export default function FilePreview({
  url,
  name,
  type,
  size,
  onRemove,
  onDownload,
  variant = 'message',
}: FilePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const imageExtensions = /\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i;
  const isImage = (type.startsWith('image/') || imageExtensions.test(name)) && !imageError;

  if (isImage) {
    return (
      <>
        <div
          className={`relative group ${variant === 'staging' ? 'cursor-default' : 'cursor-zoom-in'}`}
          style={{ width: 220, flexShrink: 0 }}
        >
          <div
            className="relative rounded-xl overflow-hidden border border-gray-200/80 shadow-sm"
            style={{ width: 220, height: 160 }}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gray-200" />
            )}
            <img
              src={url}
              alt={name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => { setImageError(true); setImageLoaded(true); }}
              onClick={() => variant === 'message' && setLightboxOpen(true)}
              className={`w-full h-full object-cover transition-all duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${variant === 'message' ? 'group-hover:brightness-90' : ''}`}
            />

            {imageLoaded && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-1.5 bg-gradient-to-t from-black/30 to-transparent">
                {variant === 'message' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                    className="p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                    title="Agrandir"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDownload && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                    className="p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                {onRemove && variant === 'message' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {variant === 'staging' && onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {variant === 'staging' && (
            <p className="text-xs text-gray-400 mt-1 text-center truncate px-1">{name}</p>
          )}
        </div>

        {lightboxOpen && (
          <Lightbox url={url} name={name} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 bg-white/60 rounded-xl border border-gray-200 hover:bg-white transition-colors max-w-[280px]">
      <div className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
        {getFileIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        {size !== undefined && (
          <p className="text-xs text-gray-400">{formatFileSize(size)}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}
