import { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  authenticateWithWebAuthn,
  WebAuthnError,
} from '../../utils/webAuthnService';
import { supabase } from '../../lib/supabase';

interface BiometricCheckInProps {
  onAuthenticationSuccess?: (patientId: string, patientData: any) => void;
  onAuthenticationFailed?: () => void;
  onUseAlternative?: () => void;
}

type CheckInState = 'idle' | 'checking' | 'authenticating' | 'success' | 'error';

export function BiometricCheckIn({
  onAuthenticationSuccess,
  onAuthenticationFailed,
  onUseAlternative,
}: BiometricCheckInProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<CheckInState>('checking');
  const [isSupported, setIsSupported] = useState(false);
  const [hasDevice, setHasDevice] = useState(false);
  const [error, setError] = useState<WebAuthnError | null>(null);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    checkSupport();
  }, []);

  async function checkSupport() {
    const supported = isWebAuthnSupported();
    setIsSupported(supported);

    if (supported) {
      const available = await isPlatformAuthenticatorAvailable();
      setHasDevice(available);
      setState(available ? 'idle' : 'error');

      if (!available) {
        setError({
          type: 'no_device',
          message: t.biometricCheckIn.no_credentials,
        });
      }
    } else {
      setState('error');
      setError({
        type: 'not_supported',
        message: t.patientRegistration.biometric.not_supported,
      });
    }
  }

  async function handleAuthenticate() {
    setState('authenticating');
    setError(null);

    const result = await authenticateWithWebAuthn();

    if (result.success && result.patientId) {
      const { data: registration } = await supabase
        .from('patient_registrations')
        .select('*')
        .eq('id', result.patientId)
        .single();

      if (registration) {
        setPatientData(registration);
        setState('success');
        onAuthenticationSuccess?.(result.patientId, registration);
      } else {
        setState('error');
        setError({
          type: 'unknown',
          message: t.biometricCheckIn.no_credentials,
        });
        onAuthenticationFailed?.();
      }
    } else {
      setState('error');
      setError(result.error || null);
      onAuthenticationFailed?.();
    }
  }

  function handleRetry() {
    setState('idle');
    setError(null);
  }

  function handleUseAlternative() {
    onUseAlternative?.();
  }

  if (state === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-600 text-sm">{t.common.loading}</p>
      </div>
    );
  }

  if (state === 'authenticating') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-25"></div>
          <div className="relative bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center">
            <Fingerprint className="w-14 h-14 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {t.biometricCheckIn.scanning}
        </h3>
        <p className="text-gray-600 text-sm text-center max-w-md">
          {t.biometricCheckIn.place_finger}
        </p>
      </div>
    );
  }

  if (state === 'success' && patientData) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {t.biometricCheckIn.success}
        </h3>
        <p className="text-gray-600 mb-4">
          {t.biometricCheckIn.welcome_back}, {patientData.first_name}!
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {patientData.first_name} {patientData.last_name}
              </p>
              <p className="text-sm text-gray-600">{patientData.primary_email}</p>
            </div>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-medium">{t.appointments.phone}:</span> {patientData.primary_phone}
            </p>
            <p>
              <span className="font-medium">{t.patientRegistration.personalInfo.date_of_birth}:</span>{' '}
              {new Date(patientData.date_of_birth).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error' && error) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {t.biometricCheckIn.error}
          </h3>
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>

        <div className="flex gap-3">
          {isSupported && hasDevice && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {t.biometricCheckIn.try_again}
            </button>
          )}
          <button
            type="button"
            onClick={handleUseAlternative}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            {t.biometricCheckIn.use_alternative}
          </button>
        </div>

        {!isSupported || !hasDevice && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              {t.biometricCheckIn.not_enrolled}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
          <Fingerprint className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {t.biometricCheckIn.title}
        </h3>
        <p className="text-gray-600 text-sm">
          {t.biometricCheckIn.subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={handleAuthenticate}
        className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <Fingerprint className="w-5 h-5" />
        {t.biometricCheckIn.scan_finger}
      </button>

      <button
        type="button"
        onClick={handleUseAlternative}
        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        {t.biometricCheckIn.use_alternative}
      </button>
    </div>
  );
}
