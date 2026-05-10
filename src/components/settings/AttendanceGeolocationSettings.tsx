import { useState, useEffect } from 'react';
import { MapPin, Save, Loader2, AlertCircle, CheckCircle, Lock, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCurrentPosition,
  formatCoordinates,
  formatDistance,
  GeolocationError,
  isRoleExemptFromProximity,
} from '../../utils/geolocation';

interface GeolocationSettings {
  clinic_latitude: number;
  clinic_longitude: number;
  max_distance_meters: number;
  min_gps_accuracy_meters: number;
  geolocation_enabled: boolean;
}

export function AttendanceGeolocationSettings() {
  const { showToast } = useToast();
  const { profile, isRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    distance?: number;
    message: string;
  } | null>(null);

  const canModifySettings = isRole(['super_admin', 'hospital_admin']);
  const userRole = profile?.role?.name;

  const [settings, setSettings] = useState<GeolocationSettings>({
    clinic_latitude: -4.37,
    clinic_longitude: 15.25,
    max_distance_meters: 5,
    min_gps_accuracy_meters: 3.0,
    geolocation_enabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          clinic_latitude: data.clinic_latitude || -4.37,
          clinic_longitude: data.clinic_longitude || 15.25,
          max_distance_meters: data.max_distance_meters || 5,
          min_gps_accuracy_meters: data.min_gps_accuracy_meters || 3.0,
          geolocation_enabled: data.geolocation_enabled ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching geolocation settings:', error);
      showToast('Erreur lors du chargement des paramètres', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('attendance_settings')
        .update({
          clinic_latitude: settings.clinic_latitude,
          clinic_longitude: settings.clinic_longitude,
          max_distance_meters: settings.max_distance_meters,
          min_gps_accuracy_meters: settings.min_gps_accuracy_meters,
          geolocation_enabled: settings.geolocation_enabled,
        })
        .eq('id', (await supabase.from('attendance_settings').select('id').single()).data?.id);

      if (error) throw error;

      showToast('Paramètres de géolocalisation enregistrés avec succès', 'success');
    } catch (error) {
      console.error('Error saving geolocation settings:', error);
      showToast('Erreur lors de l\'enregistrement des paramètres', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestLocation() {
    setTesting(true);
    setTestResult(null);

    try {
      const position = await getCurrentPosition();

      const distance = calculateDistanceFromClinic(
        position.latitude,
        position.longitude
      );

      const isValid = distance <= settings.max_distance_meters;

      setTestResult({
        success: isValid,
        distance,
        message: isValid
          ? `Vous êtes dans la zone autorisée (${formatDistance(distance)})`
          : `Vous êtes en dehors de la zone autorisée (${formatDistance(distance)}). Distance maximale: ${formatDistance(settings.max_distance_meters)}`,
      });
    } catch (error) {
      const gpsError = error as GeolocationError;
      setTestResult({
        success: false,
        message: `Erreur GPS: ${gpsError.message}`,
      });
    } finally {
      setTesting(false);
    }
  }

  function calculateDistanceFromClinic(lat: number, lon: number): number {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat - settings.clinic_latitude);
    const dLon = toRadians(lon - settings.clinic_longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(settings.clinic_latitude)) *
        Math.cos(toRadians(lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadiusKm * c * 1000 * 100) / 100;
  }

  function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async function useCurrentLocation() {
    try {
      const position = await getCurrentPosition();
      setSettings({
        ...settings,
        clinic_latitude: position.latitude,
        clinic_longitude: position.longitude,
      });
      showToast('Coordonnées mises à jour avec votre position actuelle', 'success');
    } catch (error) {
      const gpsError = error as GeolocationError;
      showToast(`Erreur GPS: ${gpsError.message}`, 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Validation Géographique de la Présence
            </h2>
            <p className="text-gray-600 text-sm">
              Configurer la validation par géolocalisation pour garantir que les employés sont
              physiquement présents à la clinique lors du pointage.
            </p>
          </div>
          {!canModifySettings && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Lecture seule</span>
            </div>
          )}
        </div>
      </div>

      {!canModifySettings && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">
                Accès en lecture seule
              </p>
              <p className="text-sm text-blue-700">
                Seuls les Super Administrateurs et les Administrateurs peuvent modifier les paramètres de géolocalisation. Vous pouvez consulter les paramètres actuels et tester votre position.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Activer la validation GPS</h3>
            <p className="text-sm text-gray-600 mt-1">
              Exiger la géolocalisation pour tous les pointages
            </p>
          </div>
          <label className={`relative inline-flex items-center ${canModifySettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="checkbox"
              checked={settings.geolocation_enabled}
              onChange={(e) =>
                canModifySettings && setSettings({ ...settings, geolocation_enabled: e.target.checked })
              }
              disabled={!canModifySettings}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {settings.geolocation_enabled && (
          <>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Coordonnées de Référence
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Position actuelle de la clinique</p>
                    <p className="text-blue-700">
                      {formatCoordinates(settings.clinic_latitude, settings.clinic_longitude)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude (degrés)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.clinic_latitude}
                    onChange={(e) =>
                      canModifySettings && setSettings({
                        ...settings,
                        clinic_latitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={!canModifySettings}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valeurs négatives pour Sud, positives pour Nord
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude (degrés)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.clinic_longitude}
                    onChange={(e) =>
                      canModifySettings && setSettings({
                        ...settings,
                        clinic_longitude: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={!canModifySettings}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valeurs négatives pour Ouest, positives pour Est
                  </p>
                </div>
              </div>

              <button
                onClick={useCurrentLocation}
                disabled={!canModifySettings}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin className="w-4 h-4" />
                Utiliser ma position actuelle
              </button>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Paramètres de Validation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance maximale autorisée (mètres)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.max_distance_meters}
                    onChange={(e) =>
                      canModifySettings && setSettings({
                        ...settings,
                        max_distance_meters: parseInt(e.target.value) || 5,
                      })
                    }
                    disabled={!canModifySettings}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Distance maximale depuis la clinique pour valider le pointage
                  </p>
                  <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Exigence de Proximité par Rôle
                      </p>
                      <p className="text-xs text-blue-800 mb-2">
                        Cette exigence de distance s'applique à tous les rôles du personnel, à l'exception des rôles administratifs privilégiés.
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-blue-800">
                            <strong>Proximité requise:</strong> Médecin, Infirmier, Pharmacien, Réceptionniste, Personnel Administratif, Logisticien
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-blue-800">
                            <strong>Exemption accordée:</strong> Super Administrateur (super_admin), Administrateur (hospital_admin)
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2 italic">
                        Toutes les tentatives de pointage sont enregistrées dans l'audit avec les détails de distance et de rôle.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Précision GPS minimale requise (mètres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="20"
                    value={settings.min_gps_accuracy_meters}
                    onChange={(e) =>
                      canModifySettings && setSettings({
                        ...settings,
                        min_gps_accuracy_meters: parseFloat(e.target.value) || 3,
                      })
                    }
                    disabled={!canModifySettings}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Précision minimale du signal GPS pour accepter le pointage
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tester la Configuration</h3>

              <button
                onClick={handleTestLocation}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Tester ma position actuelle
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          testResult.success ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {testResult.success ? 'Test réussi' : 'Test échoué'}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          testResult.success ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t">
          {canModifySettings ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer les paramètres
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Lock className="w-4 h-4" />
              <span>Modifications réservées aux administrateurs</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
