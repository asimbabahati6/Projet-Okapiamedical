import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CLINIC_LAT = -4.3716655824942405;
const CLINIC_LNG = 15.253661517603327;
const GEOFENCE_RADIUS_METERS = 250;
const MIN_GPS_ACCURACY_METERS = 125;
const EXEMPT_ROLES = ['super_admin', 'hospital_admin', 'directeur_general'];

export interface GeofencingState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distanceFromOffice: number | null;
  isWithinZone: boolean;
  isExemptRole: boolean;
  canPunch: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGeofencing() {
  const { profile } = useAuth();
  const watchIdRef = useRef<number | null>(null);

  const roleName = profile?.role?.name ?? '';
  const isExemptRole = EXEMPT_ROLES.includes(roleName);

  const [state, setState] = useState<GeofencingState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    distanceFromOffice: null,
    isWithinZone: false,
    isExemptRole,
    canPunch: isExemptRole,
    isLoading: !isExemptRole,
    error: null,
    lastUpdated: null,
  });

  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const distance = haversineDistance(latitude, longitude, CLINIC_LAT, CLINIC_LNG);
      const accuracyOk = accuracy <= MIN_GPS_ACCURACY_METERS;
      const withinZone = distance <= GEOFENCE_RADIUS_METERS && accuracyOk;

      setState(prev => ({
        ...prev,
        latitude,
        longitude,
        accuracy,
        distanceFromOffice: Math.round(distance),
        isWithinZone: withinZone,
        isExemptRole,
        canPunch: withinZone || isExemptRole,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      }));
    },
    [isExemptRole]
  );

  const handleError = useCallback(
    (error: GeolocationPositionError) => {
      let message: string;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Accès GPS refusé. Veuillez autoriser la géolocalisation dans les paramètres de votre appareil.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Position GPS indisponible. Vérifiez que le GPS est activé sur votre appareil.';
          break;
        case error.TIMEOUT:
          message = 'Délai GPS dépassé. Veuillez réessayer.';
          break;
        default:
          message = 'Erreur GPS inconnue.';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
        canPunch: isExemptRole,
        isExemptRole,
      }));
    },
    [isExemptRole]
  );

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur.',
        canPunch: isExemptRole,
        isExemptRole,
      }));
      return;
    }

    if (isExemptRole) {
      setState(prev => ({ ...prev, isLoading: false, canPunch: true, isExemptRole: true }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    };

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, options);

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      ...options,
      maximumAge: 5000,
    });
  }, [isExemptRole, handlePosition, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    stopWatching();
    startWatching();
  }, [startWatching, stopWatching]);

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  return { ...state, refresh };
}
