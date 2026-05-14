import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Camera, Shield } from 'lucide-react';
import { PunchButton } from '../../components/smart-punch/PunchButton';
import { GeofenceStatus } from '../../components/smart-punch/GeofenceStatus';
import { TodayTimeline } from '../../components/smart-punch/TodayTimeline';
import { SelfieCapture } from '../../components/smart-punch/SelfieCapture';
import { GpsBlockingModal } from '../../components/smart-punch/GpsBlockingModal';
import { useGeofencing } from '../../hooks/useGeofencing';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayPunches, computeTodayStatus, createPunchRecord, type PunchRecord, type TodayStatus } from '../../services/smartPunchService';

export default function SmartPunchPage() {
  const [showSelfie, setShowSelfie] = useState(false);
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

  async function handlePunch(punchType: 'check_in' | 'check_out' | 'break_start' | 'break_end') {
    if (!staffId) return;
    setIsLoading(true);
    try {
      await createPunchRecord({
        staff_id: staffId,
        punch_type: punchType,
        gps_lat: geo.latitude,
        gps_lng: geo.longitude,
        gps_accuracy_meters: geo.accuracy,
        distance_from_office_meters: geo.distanceFromOffice,
        is_within_zone: geo.isWithinZone,
        is_remote_exception: geo.isExemptRole,
        remote_exception_role: geo.isExemptRole ? (profile?.role?.name || null) : null,
      });
      await loadTodayData();
    } catch (err) {
      console.error('Error creating punch:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-7 h-7 text-blue-600" />
            Smart Punch
          </h1>
          <p className="text-gray-500 mt-1">Pointage intelligent avec géolocalisation</p>
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
              onPunch={handlePunch}
            />
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Vérification
            </h2>
            <button
              onClick={() => setShowSelfie(true)}
              className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
            >
              Prendre un selfie de vérification
            </button>
          </div>
        </div>
      </div>

      {showSelfie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <SelfieCapture onCapture={() => setShowSelfie(false)} onCancel={() => setShowSelfie(false)} />
          </div>
        </div>
      )}

      {showBlockingModal && (
        <GpsBlockingModal errorType={geo.errorType} onRetry={geo.refresh} />
      )}
    </div>
  );
}
