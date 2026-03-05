import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

interface Props {
  onCapture: (dataUrl: string) => void;
  onCancel?: () => void;
  label?: string;
}

type CaptureState = 'idle' | 'streaming' | 'captured' | 'error';

export function SelfieCapture({ onCapture, onCancel, label = 'Prendre un selfie' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCapturedDataUrl(null);
    setVideoReady(false);
    setCaptureState('streaming');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 800 }, height: { ideal: 600 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError') {
        setError('Accès à la caméra refusé. Veuillez autoriser la caméra dans les paramètres de votre navigateur.');
      } else if (e.name === 'NotFoundError') {
        setError('Aucune caméra détectée sur cet appareil.');
      } else {
        setError('Impossible d\'accéder à la caméra. Veuillez réessayer.');
      }
      setCaptureState('error');
    }
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  useEffect(() => {
    if (captureState === 'streaming' && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [captureState]);

  const triggerCountdown = useCallback(() => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        capturePhoto();
      }
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);
    setCaptureState('captured');
    stopStream();
  }, [stopStream]);

  const retake = useCallback(() => {
    setCapturedDataUrl(null);
    setVideoReady(false);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedDataUrl) {
      onCapture(capturedDataUrl);
    }
  }, [capturedDataUrl, onCapture]);

  if (captureState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
          <Camera className="w-10 h-10 text-blue-500" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-sm text-gray-500 mt-1">
            Une photo sera prise pour confirmer votre identité.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Ouvrir la caméra
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    );
  }

  if (captureState === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-medium text-red-800">Erreur d'accès à la caméra</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ width: '100%', maxWidth: 380, aspectRatio: '4/3', minHeight: 240 }}>
        {captureState === 'streaming' && (
          <>
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-white/70 text-xs">Initialisation...</span>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setVideoReady(true)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)', opacity: videoReady ? 1 : 0 }}
            />
            {/* Oval face guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="border-2 border-white/60 rounded-full"
                style={{ width: '160px', height: '200px' }}
              />
            </div>
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="text-white text-7xl font-bold animate-ping">{countdown}</span>
              </div>
            )}
          </>
        )}

        {captureState === 'captured' && capturedDataUrl && (
          <img
            src={capturedDataUrl}
            alt="Photo capturée"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <p className="text-xs text-gray-500 text-center">
        {captureState === 'streaming'
          ? 'Placez votre visage dans le cadre oval'
          : 'Vérifiez que votre photo est claire'}
      </p>

      {captureState === 'streaming' && (
        <div className="flex gap-3">
          <button
            onClick={triggerCountdown}
            disabled={countdown !== null}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {countdown !== null ? `Prise dans ${countdown}s...` : 'Prendre la photo (3s)'}
          </button>
          {onCancel && (
            <button
              onClick={() => { stopStream(); onCancel(); }}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {captureState === 'captured' && (
        <div className="flex gap-3">
          <button
            onClick={confirmCapture}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Utiliser cette photo
          </button>
          <button
            onClick={retake}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reprendre
          </button>
        </div>
      )}
    </div>
  );
}
