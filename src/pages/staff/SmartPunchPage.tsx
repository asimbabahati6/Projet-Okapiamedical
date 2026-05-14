import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Shield, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { PunchButton } from '../../components/smart-punch/PunchButton';
import { GeofenceStatus } from '../../components/smart-punch/GeofenceStatus';
import { TodayTimeline } from '../../components/smart-punch/TodayTimeline';
import { SelfieCapture } from '../../components/smart-punch/SelfieCapture';
import { GpsBlockingModal } from '../../components/smart-punch/GpsBlockingModal';
import { useGeofencing } from '../../hooks/useGeofencing';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayPunches, computeTodayStatus, createPunchRecord, type PunchRecord, type TodayStatus } from '../../services/smartPunchService';
import { uploadSelfie } from '../../services/selfieService';

type PunchType = 'check_in' | 'check_out' | 'break_start' | 'break_end';

const PUNCH_LABELS: Record<PunchType, string> = {
  check_in: 'Arrivée',
  check_out: 'Départ',
  break_start: 'Début pause',
  break_end: 'Fin pause',
};

export default function SmartPunchPage() {
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    checkIn: null,
    checkOut: null,
    breakStart: null,
    breakEnd: null,
    currentStatus: 'not_started',
    breakElapsedMinutes: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPunchType, setPendingPunchType] = useState<PunchType | null>(null);
  const [uploadingStatus, setUploadingStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { profile } = useAuth();
  const geo = useGeofencing();

  const staffId = profile?.id || '';

  const showBlockingModal = !geo.isExemptRole
    && !geo.isLoading
    && geo.errorType !== null
    && geo.errorType !== 'position_unavailable'
    && geo.signalQuality === null;

  const loadTodayData = useCallback(async () => {
    if (!staffId) return;
    try {
      const punches = await getTodayPunches(staffId);
      setRecords(punches);
      setTodayStatus(computeTodayStatus(punches));
    } catch (err) {
      console.error('Error loading today punches:', err);
    }
  }, [staffId]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  function handlePunchRequest(punchType: PunchType) {
    setPendingPunchType(punchType);
    setUploadingStatus('idle');
    setUploadError(null);
  }

  async function handleSelfieCapture(dataUrl: string) {
    if (!staffId || !pendingPunchType) return;
    setUploadingStatus('uploading');
    setUploadError(null);
    setIsLoading(true);
    try {
      const { storagePath, publicUrl } = await uploadSelfie(staffId, pendingPunchType, dataUrl);
      await createPunchRecord({
        staff_id: staffId,
        punch_type: pendingPunchType,
        gps_lat: geo.latitude,
        gps_lng: geo.longitude,
        gps_accuracy_meters: geo.accuracy,
        distance_from_office_meters: geo.distanceFromOffice,
        is_within_zone: geo.isWithinZone,
        is_remote_exception: geo.isExemptRole,
        remote_exception_role: geo.isExemptRole ? (profile?.role?.name || null) : null,
        selfie_url: publicUrl,
        selfie_storage_path: storagePath,
      });
      setUploadingStatus('success');
      await loadTodayData();
      setTimeout(() => {
        setPendingPunchType(null);
        setUploadingStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('Error during punch with selfie:', err);
      setUploadError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      setUploadingStatus('error');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancelSelfie() {
    setPendingPunchType(null);
    setUploadingStatus('idle');
    setUploadError(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-7 h-7 text-blue-600" />
            Smart Punch
          </h1>
          <p className="text-gray-500 mt-1">Pointage intelligent avec géolocalisation et vérification photo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Pointage du jour
            </h2>
            <PunchButton
              todayStatus={todayStatus}
              canPunch={geo.canPunch}
              isExemptRole={geo.isExemptRole}
              isLoading={isLoading}
              breakElapsedMinutes={todayStatus.breakElapsedMinutes}
              signalQuality={geo.signalQuality}
              onPunch={handlePunchRequest}
            />
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Camera className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Une photo d'identification est requise pour chaque pointage.</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Historique aujourd'hui
            </h2>
            <TodayTimeline records={records} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Géolocalisation
            </h2>
            <GeofenceStatus geo={geo} onRefresh={geo.refresh} />
          </div>
        </div>
      </div>

      {pendingPunchType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg">
                Photo d'identification
              </h3>
              <p className="text-blue-100 text-sm mt-0.5">
                Pointage : {PUNCH_LABELS[pendingPunchType]}
              </p>
            </div>

            <div className="p-6">
              {uploadingStatus === 'uploading' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <p className="text-gray-700 font-medium">Enregistrement du pointage...</p>
                </div>
              )}

              {uploadingStatus === 'success' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="w-14 h-14 text-green-600" />
                  <p className="text-green-700 font-semibold text-lg">Pointage enregistré !</p>
                </div>
              )}

              {uploadingStatus === 'error' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {uploadError}
                  </div>
                  <SelfieCapture
                    onCapture={handleSelfieCapture}
                    onCancel={handleCancelSelfie}
                    label="Reprendre la photo"
                  />
                </div>
              )}

              {uploadingStatus === 'idle' && (
                <SelfieCapture
                  onCapture={handleSelfieCapture}
                  onCancel={handleCancelSelfie}
                  label="Prenez votre photo d'identification"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showBlockingModal && (
        <GpsBlockingModal errorType={geo.errorType} onRetry={geo.refresh} />
      )}
    </div>
  );
}
