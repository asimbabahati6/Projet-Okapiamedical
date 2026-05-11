import { Heart, Thermometer, Weight, Activity, Lock, Unlock } from 'lucide-react';

export interface VitalSigns {
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;
  temperature: string;
  weight: string;
  oxygen_saturation: string;
}

interface NursePreConsultationProps {
  complaints: string;
  vitalSigns: VitalSigns;
  locked: boolean;
  isNurseView: boolean;
  onComplaintsChange: (val: string) => void;
  onVitalSignChange: (key: keyof VitalSigns, val: string) => void;
  onTransferToDoctor: () => void;
  onToggleEdit?: () => void;
}

export function NursePreConsultation({
  complaints,
  vitalSigns,
  locked,
  isNurseView,
  onComplaintsChange,
  onVitalSignChange,
  onTransferToDoctor,
  onToggleEdit,
}: NursePreConsultationProps) {
  const isReadOnly = locked && !isNurseView;
  const canEdit = isNurseView || !locked;

  return (
    <div className={`bg-white rounded-xl border ${locked ? 'border-teal-200' : 'border-gray-200'} overflow-hidden`}>
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
        locked ? 'bg-teal-50 border-teal-100' : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            locked ? 'bg-teal-100' : 'bg-blue-100'
          }`}>
            <Activity className={`w-4 h-4 ${locked ? 'text-teal-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Section Infirmier</h3>
            <p className="text-xs text-gray-500">Pré-consultation et signes vitaux</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {locked && (
            <span className="flex items-center gap-1 text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded-full font-medium">
              <Lock className="w-3 h-3" />
              Verrouillé
            </span>
          )}
          {locked && !isNurseView && onToggleEdit && (
            <button
              onClick={onToggleEdit}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Unlock className="w-3 h-3" />
              Éditer
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Complaints */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Plaintes principales
          </label>
          <textarea
            value={complaints}
            onChange={(e) => onComplaintsChange(e.target.value)}
            placeholder="Décrire les plaintes du patient..."
            rows={3}
            disabled={isReadOnly}
            className={`w-full px-4 py-3 border rounded-lg text-sm resize-none transition-colors ${
              isReadOnly
                ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent'
            }`}
          />
        </div>

        {/* Vital Signs Grid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Signes Vitaux
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <VitalSignInput
              icon={<Heart className="w-4 h-4 text-red-500" />}
              label="Tension Artérielle"
              unit="mmHg"
              placeholder="120/80"
              value={`${vitalSigns.blood_pressure_systolic}${vitalSigns.blood_pressure_diastolic ? '/' + vitalSigns.blood_pressure_diastolic : ''}`}
              onChange={(val) => {
                const parts = val.split('/');
                onVitalSignChange('blood_pressure_systolic', parts[0] || '');
                onVitalSignChange('blood_pressure_diastolic', parts[1] || '');
              }}
              disabled={isReadOnly}
            />
            <VitalSignInput
              icon={<Activity className="w-4 h-4 text-orange-500" />}
              label="Fréquence Cardiaque"
              unit="bpm"
              placeholder="72"
              value={vitalSigns.heart_rate}
              onChange={(val) => onVitalSignChange('heart_rate', val)}
              disabled={isReadOnly}
            />
            <VitalSignInput
              icon={<Thermometer className="w-4 h-4 text-amber-500" />}
              label="Température"
              unit="°C"
              placeholder="37.0"
              value={vitalSigns.temperature}
              onChange={(val) => onVitalSignChange('temperature', val)}
              disabled={isReadOnly}
            />
            <VitalSignInput
              icon={<Weight className="w-4 h-4 text-blue-500" />}
              label="Poids"
              unit="kg"
              placeholder="70"
              value={vitalSigns.weight}
              onChange={(val) => onVitalSignChange('weight', val)}
              disabled={isReadOnly}
            />
            <VitalSignInput
              icon={<Activity className="w-4 h-4 text-cyan-500" />}
              label="Saturation O2"
              unit="%"
              placeholder="98"
              value={vitalSigns.oxygen_saturation}
              onChange={(val) => onVitalSignChange('oxygen_saturation', val)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Transfer Button */}
        {canEdit && !locked && isNurseView && (
          <div className="pt-2">
            <button
              onClick={onTransferToDoctor}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm"
            >
              <Lock className="w-4 h-4" />
              Transférer au Médecin
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Cette action verrouille les champs infirmier et notifie le médecin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface VitalSignInputProps {
  icon: React.ReactNode;
  label: string;
  unit: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}

function VitalSignInput({ icon, label, unit, placeholder, value, onChange, disabled }: VitalSignInputProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      disabled ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-gray-300'
    } transition-colors`}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-500 font-medium mb-0.5">{label}</p>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full text-sm font-semibold bg-transparent outline-none ${
              disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-900 placeholder:text-gray-300'
            }`}
          />
          <span className="text-[10px] text-gray-400 shrink-0">{unit}</span>
        </div>
      </div>
    </div>
  );
}
