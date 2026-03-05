import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface RadiologyImage {
  id: string;
  file_name: string;
  file_url: string;
  sequence_number: number;
  description?: string;
}

interface ImageViewerProps {
  images: RadiologyImage[];
  features?: {
    zoom?: boolean;
    pan?: boolean;
    rotate?: boolean;
    fullscreen?: boolean;
    download?: boolean;
    compare?: boolean;
  };
}

export default function ImageViewer({ images, features = {} }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    zoom: canZoom = true,
    rotate: canRotate = true,
    fullscreen: canFullscreen = true,
    download: canDownload = true,
    compare: canCompare = true
  } = features;

  const currentImage = images[currentIndex];

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 25);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25);
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetView();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetView();
    }
  };

  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.file_url;
    link.download = currentImage.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl p-12 text-center">
        <p className="text-gray-600">Aucune image disponible</p>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative'}`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-4 ${isFullscreen ? 'bg-gray-900' : 'bg-gray-100'} rounded-t-xl`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isFullscreen ? 'text-white' : 'text-gray-700'}`}>
            Image {currentIndex + 1} / {images.length}
          </span>
          {currentImage.description && (
            <span className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
              - {currentImage.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canZoom && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className={`p-2 rounded-lg transition-colors ${
                  isFullscreen
                    ? 'text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className={`text-sm font-medium min-w-16 text-center ${isFullscreen ? 'text-white' : 'text-gray-700'}`}>
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className={`p-2 rounded-lg transition-colors ${
                  isFullscreen
                    ? 'text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </>
          )}

          {canRotate && (
            <button
              onClick={handleRotate}
              className={`p-2 rounded-lg transition-colors ${
                isFullscreen
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RotateCw className="w-5 h-5" />
            </button>
          )}

          {canDownload && (
            <button
              onClick={handleDownload}
              className={`p-2 rounded-lg transition-colors ${
                isFullscreen
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Download className="w-5 h-5" />
            </button>
          )}

          {canFullscreen && (
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg transition-colors ${
                isFullscreen
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Image Display */}
      <div className={`relative ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-96'} bg-black rounded-b-xl overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={currentImage.file_url}
            alt={currentImage.file_name}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out'
            }}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && !isFullscreen && (
        <div className="flex gap-2 p-4 bg-gray-100 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                setCurrentIndex(index);
                resetView();
              }}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-cyan-500 ring-2 ring-cyan-200'
                  : 'border-gray-300 hover:border-cyan-300'
              }`}
            >
              <img
                src={image.file_url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
