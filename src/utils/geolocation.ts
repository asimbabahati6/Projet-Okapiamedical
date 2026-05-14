export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

export interface GeolocationValidationResult {
  isValid: boolean;
  distance: number;
  reason?: string;
  exemptionApplied?: boolean;
  userRole?: string;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = earthRadiusKm * c;

  return Math.round(distanceKm * 1000 * 100) / 100;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export async function getCurrentPosition(
  options: PositionOptions = {}
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 'POSITION_UNAVAILABLE',
        message: 'La géolocalisation n\'est pas supportée par votre navigateur',
      } as GeolocationError);
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorCode: GeolocationError['code'] = 'UNKNOWN';
        let errorMessage = 'Erreur lors de la récupération de la position GPS';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorCode = 'PERMISSION_DENIED';
            errorMessage =
              'Permission de géolocalisation refusée. Veuillez activer la géolocalisation dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorCode = 'POSITION_UNAVAILABLE';
            errorMessage =
              'Position GPS indisponible. Assurez-vous que le GPS est activé sur votre appareil.';
            break;
          case error.TIMEOUT:
            errorCode = 'TIMEOUT';
            errorMessage =
              'Délai d\'attente dépassé pour obtenir la position GPS. Veuillez réessayer.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }

        reject({
          code: errorCode,
          message: errorMessage,
        } as GeolocationError);
      },
      defaultOptions
    );
  });
}

export function isRoleExemptFromProximity(userRole?: string): boolean {
  if (!userRole) return false;
  const exemptRoles = ['super_admin', 'hospital_admin', 'directeur_general'];
  return exemptRoles.includes(userRole);
}

export function validatePosition(
  userPosition: GeolocationPosition,
  clinicLat: number,
  clinicLon: number,
  maxDistanceMeters: number,
  minAccuracyMeters: number,
  userRole?: string
): GeolocationValidationResult {
  if (userPosition.accuracy > minAccuracyMeters) {
    return {
      isValid: false,
      distance: 0,
      reason: `Précision GPS insuffisante (${userPosition.accuracy.toFixed(1)}m). Une précision d'au moins ${minAccuracyMeters}m est requise.`,
      exemptionApplied: false,
      userRole,
    };
  }

  const distance = calculateDistance(
    userPosition.latitude,
    userPosition.longitude,
    clinicLat,
    clinicLon
  );

  const privilegedRoles = ['super_admin', 'hospital_admin', 'directeur_general'];
  const isPrivilegedUser = userRole && privilegedRoles.includes(userRole);

  if (distance > maxDistanceMeters && !isPrivilegedUser) {
    return {
      isValid: false,
      distance,
      reason: `Vous êtes trop éloigné de la clinique OKAPIA Medical (${distance.toFixed(1)}m). Vous devez être à moins de ${maxDistanceMeters}m pour valider votre présence. Cette exigence s'applique à votre rôle.`,
      exemptionApplied: false,
      userRole,
    };
  }

  const exemptionApplied = isPrivilegedUser && distance > maxDistanceMeters;

  return {
    isValid: true,
    distance,
    reason: exemptionApplied
      ? `Accès privilégié accordé - Exemption de proximité pour le rôle ${userRole}`
      : undefined,
    exemptionApplied,
    userRole,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1) {
    return `${Math.round(meters * 100)} cm`;
  } else if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  } else {
    return `${(meters / 1000).toFixed(2)} km`;
  }
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`;
}

export function getGeolocationErrorHelp(error: GeolocationError): string {
  switch (error.code) {
    case 'PERMISSION_DENIED':
      return `
        Pour activer la géolocalisation:
        - Chrome/Edge: Cliquez sur l'icône de cadenas dans la barre d'adresse, puis activez "Position"
        - Firefox: Cliquez sur l'icône d'information dans la barre d'adresse, puis autorisez la géolocalisation
        - Safari: Allez dans Préférences > Sites web > Localisation, et autorisez ce site
      `;
    case 'POSITION_UNAVAILABLE':
      return `
        Pour améliorer le signal GPS:
        - Assurez-vous que le GPS est activé sur votre appareil
        - Rapprochez-vous d'une fenêtre ou sortez à l'extérieur
        - Attendez quelques secondes pour que le GPS se stabilise
        - Rechargez la page et réessayez
      `;
    case 'TIMEOUT':
      return `
        Le GPS prend trop de temps à répondre:
        - Vérifiez votre connexion réseau
        - Assurez-vous que le GPS de votre appareil fonctionne
        - Réessayez dans quelques instants
      `;
    default:
      return `
        En cas de problème persistant:
        - Vérifiez les paramètres de confidentialité de votre navigateur
        - Essayez avec un autre navigateur
        - Contactez l'administrateur si le problème persiste
      `;
  }
}

export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

export async function checkGeolocationPermission(): Promise<PermissionState | null> {
  if (!('permissions' in navigator)) {
    return null;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    return null;
  }
}

export function getDeviceInfo(): Record<string, unknown> {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    timestamp: new Date().toISOString(),
  };
}
