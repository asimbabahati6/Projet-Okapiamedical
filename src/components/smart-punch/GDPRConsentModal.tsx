import { useState } from 'react';
import { Shield, MapPin, Camera, Database, CheckCircle, AlertCircle, X, Eye, Trash2, Edit } from 'lucide-react';
import { saveGdprConsent } from '../../services/smartPunchService';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onAccepted: () => void;
}

export function GDPRConsentModal({ onAccepted }: Props) {
  const { user } = useAuth();
  const [consentGps, setConsentGps] = useState(false);
  const [consentPhoto, setConsentPhoto] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const allChecked = consentGps && consentPhoto && consentData;

  const handleAccept = async () => {
    if (!allChecked || !user?.id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await saveGdprConsent(user.id, undefined, navigator.userAgent);
      onAccepted();
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-5 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Charte de Confidentialité</h2>
              <p className="text-sm text-gray-500">Smart Punch — Version 1.0 — OKAPIA Medical</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              Avant d'utiliser le système de pointage Smart Punch, vous devez prendre connaissance
              de la présente charte et donner votre consentement éclairé conformément au
              <strong> Règlement Général sur la Protection des Données (RGPD)</strong>.
            </p>
          </div>

          {/* Section GPS */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => setActiveSection(activeSection === 'gps' ? null : 'gps')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-800 text-sm">Géolocalisation GPS</span>
              </div>
              <span className="text-gray-400 text-xs">{activeSection === 'gps' ? '▲' : '▼'}</span>
            </button>
            {activeSection === 'gps' && (
              <div className="px-4 py-4 border-t border-gray-100 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <strong>Usage limité aux moments de pointage uniquement.</strong> Votre position GPS
                    est collectée exclusivement au moment où vous cliquez sur le bouton de pointage.
                    Il n'y a aucune surveillance continue de votre localisation.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Le système vérifie que vous êtes dans un rayon de <strong>20 mètres</strong> du
                    site OKAPIA Medical pour valider votre présence physique.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Les coordonnées GPS sont chiffrées et stockées de manière sécurisée dans nos
                    serveurs hébergés en Europe.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section Selfie */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => setActiveSection(activeSection === 'photo' ? null : 'photo')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-medium text-gray-800 text-sm">Capture photographique (Selfie)</span>
              </div>
              <span className="text-gray-400 text-xs">{activeSection === 'photo' ? '▲' : '▼'}</span>
            </button>
            {activeSection === 'photo' && (
              <div className="px-4 py-4 border-t border-gray-100 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Une photo de votre visage est capturée à chaque pointage (arrivée et départ)
                    à des fins de <strong>vérification d'identité et de prévention de la fraude</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Les photos sont <strong>compressées</strong> avant stockage, ne sont accessibles
                    qu'aux responsables RH et à la direction, et sont protégées par des politiques
                    d'accès strictes.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Ces photos ne sont <strong>pas utilisées</strong> à des fins de reconnaissance
                    faciale automatisée. Elles servent uniquement de preuve documentaire en cas
                    de litige.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section Données */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => setActiveSection(activeSection === 'data' ? null : 'data')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-800 text-sm">Traitement et conservation des données</span>
              </div>
              <span className="text-gray-400 text-xs">{activeSection === 'data' ? '▲' : '▼'}</span>
            </button>
            {activeSection === 'data' && (
              <div className="px-4 py-4 border-t border-gray-100 space-y-3">
                <p className="text-sm font-medium text-gray-800">Durée de conservation :</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    Enregistrements de pointage : <strong>2 ans</strong> après la fin du contrat
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    Photos de pointage : <strong>12 mois</strong> glissants
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    Données GPS : <strong>12 mois</strong> glissants
                  </li>
                </ul>
                <p className="text-sm font-medium text-gray-800 mt-3">Vos droits :</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg text-center">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600">Accès à vos données</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg text-center">
                    <Edit className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600">Rectification</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg text-center">
                    <Trash2 className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-600">Suppression</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pour exercer vos droits, contactez le DPO à l'adresse :
                  <span className="font-medium text-gray-700"> dpo@okapiamedical.com</span>
                </p>
              </div>
            )}
          </div>

          {/* Consentements à cocher */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">
              Veuillez cocher chaque consentement pour continuer :
            </p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentGps}
                onChange={e => setConsentGps(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                J'accepte la <strong>collecte de ma position GPS</strong> lors de chaque pointage
                à des fins de vérification de présence.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentPhoto}
                onChange={e => setConsentPhoto(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                J'accepte la <strong>capture et le stockage de photos</strong> (selfies) lors de mes
                pointages à des fins d'authentification et de prévention de fraude.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentData}
                onChange={e => setConsentData(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                J'ai pris connaissance de la présente charte de confidentialité et j'accepte le
                <strong> traitement de mes données personnelles</strong> conformément aux politiques
                décrites ci-dessus.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Vous pouvez retirer votre consentement à tout moment depuis les paramètres de votre profil.
            Le retrait du consentement peut empêcher l'utilisation du système Smart Punch.
          </p>

          {/* Bouton */}
          <button
            onClick={handleAccept}
            disabled={!allChecked || isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              allChecked && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </span>
            ) : allChecked ? (
              'Accepter et Continuer'
            ) : (
              'Cochez tous les consentements pour continuer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
