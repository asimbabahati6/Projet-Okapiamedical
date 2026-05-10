import { useState } from 'react';
import { Clock, MapPin, Camera, Shield } from 'lucide-react';
import { PunchButton } from '../../components/smart-punch/PunchButton';
import { GeofenceStatus } from '../../components/smart-punch/GeofenceStatus';
import { TodayTimeline } from '../../components/smart-punch/TodayTimeline';
import { SelfieCapture } from '../../components/smart-punch/SelfieCapture';

export default function SmartPunchPage() {
  const [showSelfie, setShowSelfie] = useState(false);

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
            <PunchButton />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Historique aujourd'hui
            </h2>
            <TodayTimeline />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Géolocalisation
            </h2>
            <GeofenceStatus />
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
    </div>
  );
}
