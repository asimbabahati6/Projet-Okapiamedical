import { useState, useEffect, useCallback, useRef } from 'react';
import { Fingerprint, Clock, Calendar, CheckCircle, AlertCircle, Loader2, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGeofencing } from '../../hooks/useGeofencing';
import { GDPRConsentModal } from '../../components/smart-punch/GDPRConsentModal';
import { GeofenceStatus } from '../../components/smart-punch/GeofenceStatus';
import { PunchButton } from '../../components/smart-punch/PunchButton';
import { SelfieCapture } from '../../components/smart-punch/SelfieCapture';
import { TodayTimeline } from '../../components/smart-punch/TodayTimeline';
import {
  getTodayPunches,
  computeTodayStatus,
  createPunchRecord,
  finalizeBreakRecord,
  getGdprConsent,
  type PunchRecord,
  type TodayStatus,
} from '../../services/smartPunchService';
import { uploadSelfie } from '../../services/selfieService';
import { sendPunchAlert } from '../../services/punchNotificationService';

type PageState = 'loading' | 'gdpr_required' | 'ready' | 'selfie_capture' | 'punching' | 'success';

const PUNCH_LABELS: Record<string, string> = {
  check_in: "Pointage Arrivée",
  check_out: "Pointage Départ",
  break_start: "Début de Pause",
  break_end: "Retour de Pause",
};

function CurrentTimeClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-gray-900 tabular-nums tracking-tight">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-sm text-gray-500 mt-1 capitalize">
        {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}

export default function SmartPunchPage() {
  const { user, profile } = useAuth();
  const geo = useGeofencing();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    checkIn: null, checkOut: null, breakStart: null, breakEnd: null,
    currentStatus: 'not_started', breakElapsedMinutes: null,
  });
  const [pendingPunchType, setPendingPunchType] = useState<'check_in' | 'check_out' | 'break_start' | 'break_end' | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [breakTimer, setBreakTimer] = useState<number | null>(null);
  const breakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadTodayData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const recs = await getTodayPunches(user.id);
      setRecords(recs);
      const status = computeTodayStatus(recs);
      setTodayStatus(status);
      return status;
    } catch {
      showToast('error', 'Erreur lors du chargement des pointages.');
    }
  }, [user?.id, showToast]);

  // Break timer
  useEffect(() => {
    if (todayStatus.currentStatus === 'on_break' && todayStatus.breakStart) {
      const tick = () => {
        const elapsed = Math.floor((Date.now() - new Date(todayStatus.breakStart!.punched_at).getTime()) / 60000);
        setBreakTimer(elapsed);
      };
      tick();
      breakTimerRef.current = setInterval(tick, 30000);
    } else {
      setBreakTimer(null);
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    }
    return () => { if (breakTimerRef.current) clearInterval(breakTimerRef.current); };
  }, [todayStatus.currentStatus, todayStatus.breakStart]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const consent = await getGdprConsent(user.id);
        if (!consent || !consent.allGranted || consent.withdrawn) {
          setPageState('gdpr_required');
        } else {
          await loadTodayData();
          setPageState('ready');
        }
      } catch {
        setPageState('ready');
        await loadTodayData();
      }
    })();
  }, [user?.id, loadTodayData]);

  const handleGdprAccepted = useCallback(async () => {
    await loadTodayData();
    setPageState('ready');
  }, [loadTodayData]);

  const handlePunchRequest = useCallback((type: 'check_in' | 'check_out' | 'break_start' | 'break_end') => {
    setPendingPunchType(type);
    setPageState('selfie_capture');
  }, []);

  const handleSelfieCapture = useCallback(async (dataUrl: string) => {
    if (!user?.id || !pendingPunchType) return;
    setPageState('punching');

    try {
      // Upload selfie
      let selfieUrl: string | null = null;
      let selfiePath: string | null = null;
      try {
        const uploaded = await uploadSelfie(user.id, pendingPunchType, dataUrl);
        selfieUrl = uploaded.publicUrl;
        selfiePath = uploaded.storagePath;
      } catch {
        // Non-blocking: continue without selfie if upload fails
      }

      // Create punch record
      const record = await createPunchRecord({
        staff_id: user.id,
        punch_type: pendingPunchType,
        gps_lat: geo.latitude,
        gps_lng: geo.longitude,
        gps_accuracy_meters: geo.accuracy,
        distance_from_office_meters: geo.distanceFromOffice,
        is_within_zone: geo.isWithinZone,
        is_remote_exception: geo.isExemptRole,
        remote_exception_role: geo.isExemptRole ? (profile?.role?.name ?? null) : null,
        selfie_url: selfieUrl,
        selfie_storage_path: selfiePath,
        device_info: { userAgent: navigator.userAgent, platform: navigator.platform },
      });

      // Finalize break duration if this is break_end
      if (pendingPunchType === 'break_end' && todayStatus.breakStart) {
        await finalizeBreakRecord(todayStatus.breakStart, record.id);
      }

      // Reload data
      const newStatus = await loadTodayData();

      // Send alerts if needed
      if (record.is_late && profile?.full_name) {
        sendPunchAlert({
          type: 'late_arrival',
          employeeName: profile.full_name,
          employeeEmail: user.email ?? '',
          staffId: user.id,
          punchRecordId: record.id,
          minutesLate: record.late_by_minutes,
          date: new Date().toISOString(),
        });
      }

      if (pendingPunchType === 'break_end' && newStatus) {
        const updated = newStatus.breakEnd ?? record;
        if (updated && 'break_exceeded' in updated && updated.break_exceeded && profile?.full_name) {
          sendPunchAlert({
            type: 'break_exceeded',
            employeeName: profile.full_name,
            employeeEmail: user.email ?? '',
            staffId: user.id,
            punchRecordId: record.id,
            minutesExceeded: (updated as PunchRecord).break_exceeded_by_minutes,
            date: new Date().toISOString(),
          });
        }
      }

      showToast('success', `${PUNCH_LABELS[pendingPunchType]} enregistré avec succès.`);
      setPageState('success');
      setTimeout(() => setPageState('ready'), 2000);
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message ?? 'Erreur lors du pointage. Veuillez réessayer.');
      setPageState('ready');
    } finally {
      setPendingPunchType(null);
    }
  }, [user, pendingPunchType, geo, profile, todayStatus.breakStart, loadTodayData, showToast]);

  const handleSelfieCancel = useCallback(() => {
    setPendingPunchType(null);
    setPageState('ready');
  }, []);

  // Render
  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (pageState === 'gdpr_required') {
    return <GDPRConsentModal onAccepted={handleGdprAccepted} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Smart Punch</h1>
              <p className="text-xs text-gray-500">Pointage géosécurisé — OKAPIA Medical</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">{profile?.full_name ?? '—'}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role?.name?.replace(/_/g, ' ') ?? ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Main punch panel */}
        <div className="lg:col-span-3 space-y-4">

          {/* Clock */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <CurrentTimeClock />
          </div>

          {/* GPS Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <GeofenceStatus geo={geo} onRefresh={geo.refresh} />
          </div>

          {/* Selfie capture overlay */}
          {pageState === 'selfie_capture' && pendingPunchType && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-800">
                  Selfie — {PUNCH_LABELS[pendingPunchType]}
                </p>
              </div>
              <SelfieCapture
                label={`Photo pour: ${PUNCH_LABELS[pendingPunchType]}`}
                onCapture={handleSelfieCapture}
                onCancel={handleSelfieCancel}
              />
            </div>
          )}

          {/* Punch button */}
          {(pageState === 'ready' || pageState === 'punching' || pageState === 'success') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
              {pageState === 'success' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-green-800">Pointage enregistré !</p>
                </div>
              ) : (
                <PunchButton
                  todayStatus={todayStatus}
                  canPunch={geo.canPunch}
                  isExemptRole={geo.isExemptRole}
                  isLoading={pageState === 'punching'}
                  breakElapsedMinutes={breakTimer}
                  onPunch={handlePunchRequest}
                />
              )}
            </div>
          )}

          {/* Status summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`bg-white rounded-xl border p-3 text-center ${
              todayStatus.checkIn ? 'border-blue-100' : 'border-gray-100'
            }`}>
              <p className="text-xs text-gray-500 mb-1">Arrivée</p>
              <p className={`text-sm font-bold ${todayStatus.checkIn ? 'text-blue-700' : 'text-gray-300'}`}>
                {todayStatus.checkIn
                  ? new Date(todayStatus.checkIn.punched_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : '—'
                }
              </p>
              {todayStatus.checkIn?.is_late && (
                <p className="text-xs text-amber-600 mt-0.5">+{todayStatus.checkIn.late_by_minutes}min retard</p>
              )}
            </div>
            <div className={`bg-white rounded-xl border p-3 text-center ${
              todayStatus.currentStatus === 'on_break' ? 'border-amber-100' : 'border-gray-100'
            }`}>
              <p className="text-xs text-gray-500 mb-1">Pause</p>
              <p className={`text-sm font-bold ${
                todayStatus.currentStatus === 'on_break' ? 'text-amber-600' :
                todayStatus.breakEnd ? 'text-green-600' : 'text-gray-300'
              }`}>
                {todayStatus.currentStatus === 'on_break' && breakTimer !== null
                  ? `${breakTimer}min`
                  : todayStatus.breakEnd
                  ? `${todayStatus.breakEnd.break_duration_minutes}min`
                  : '—'
                }
              </p>
            </div>
            <div className={`bg-white rounded-xl border p-3 text-center ${
              todayStatus.checkOut ? 'border-gray-200' : 'border-gray-100'
            }`}>
              <p className="text-xs text-gray-500 mb-1">Départ</p>
              <p className={`text-sm font-bold ${todayStatus.checkOut ? 'text-gray-700' : 'text-gray-300'}`}>
                {todayStatus.checkOut
                  ? new Date(todayStatus.checkOut.punched_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : '—'
                }
              </p>
              {todayStatus.checkOut?.auto_closed && (
                <p className="text-xs text-gray-500 mt-0.5">Auto</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">
                Activité du jour — {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </h2>
            </div>
            <TodayTimeline records={records} />
          </div>

          {/* Info card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Règles du système</p>
            <ul className="space-y-1.5">
              {[
                `Pointage requis dans un rayon de 20m du bureau`,
                `Pause limitée à 60 minutes`,
                `Selfie obligatoire à chaque pointage`,
                `Fermeture automatique à 20h00 si oubli`,
              ].map(rule => (
                <li key={rule} className="flex items-start gap-2 text-xs text-blue-700">
                  <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
