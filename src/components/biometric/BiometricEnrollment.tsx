import { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerWebAuthnCredential,
  WebAuthnError,
} from '../../utils/webAuthnService';

interface BiometricEnrollmentProps {
  patientId: string;
  patientName: string;
  onEnrollmentComplete?: (success: boolean, credentialId?: string) => void;
  onSkip?: () => void;
}

type EnrollmentState = 'idle' | 'checking' | 'consent' | 'enrolling' | 'success' | 'error';

export function BiometricEnrollment({
  patientId,
  patientName,
  onEnrollmentComplete,
  onSkip,
}: BiometricEnrollmentProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<EnrollmentState>('checking');
  const [isSupported, setIsSupported] = useState(false);
  const [hasDevice, setHasDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState<WebAuthnError | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

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
          message: t.patientRegistration.biometric.no_device,
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

  function handleStartEnrollment() {
    setState('consent');
  }

  function handleConsentAccept() {
    setConsentGiven(true);
    startEnrollment();
  }

  function handleConsentDecline() {
    handleSkip();
  }

  async function startEnrollment() {
    setState('enrolling');
    setError(null);

    const result = await registerWebAuthnCredential(patientId, patientName, deviceName || undefined);

    if (result.success && result.credential) {
      setState('success');
      onEnrollmentComplete?.(true, result.credential.id);
    } else {
      setState('error');
      setError(result.error || null);
      onEnrollmentComplete?.(false);
    }
  }

  function handleRetry() {
    setState('idle');
    setError(null);
  }

  function handleSkip() {
    onSkip?.();
  }

  if (state === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (state === 'consent') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {t.patientRegistration.biometric.consent_title}
          </h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-sm text-gray-800 leading-relaxed">
            {t.patientRegistration.biometric.consent_text}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleConsentDecline}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t.patientRegistration.biometric.consent_decline}
          </button>
          <button
            type="button"
            onClick={handleConsentAccept}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t.patientRegistration.biometric.consent_accept}
          </button>
        </div>
      </div>
    );
  }

  if (state === 'enrolling') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-25"></div>
          <div className="relative bg-blue-100 w-32 h-32 rounded-full flex items-center justify-center">
            <Fingerprint className="w-20 h-20 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {t.patientRegistration.biometric.scanning}
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          {t.patientRegistration.biometric.place_finger}
        </p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {t.patientRegistration.biometric.success}
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          {t.patientRegistration.biometric.benefit_1}
        </p>
      </div>
    );
  }

  if (state === 'error' && error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {t.patientRegistration.biometric.error}
          </h3>
          <p className="text-red-600">{error.message}</p>
        </div>

        <div className="flex gap-4">
          {isSupported && hasDevice && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t.patientRegistration.biometric.retry}
            </button>
          )}
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t.patientRegistration.biometric.skip_enrollment}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Fingerprint className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.patientRegistration.biometric.enroll_title}
        </h2>
        <p className="text-gray-600">
          {t.patientRegistration.biometric.enroll_description}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          {t.patientRegistration.biometric.benefits_title}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>{t.patientRegistration.biometric.benefit_1}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>{t.patientRegistration.biometric.benefit_2}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>{t.patientRegistration.biometric.benefit_3}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>{t.patientRegistration.biometric.benefit_4}</span>
          </li>
        </ul>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.patientRegistration.biometric.device_name}
        </label>
        <input
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder={t.patientRegistration.biometric.device_placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleSkip}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          {t.patientRegistration.biometric.skip_enrollment}
        </button>
        <button
          type="button"
          onClick={handleStartEnrollment}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Fingerprint className="w-5 h-5" />
          {t.patientRegistration.biometric.start_enrollment}
        </button>
      </div>
    </div>
  );
}
