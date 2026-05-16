import { useState } from 'react';
import { Heart, Thermometer, Weight, Activity, Lock, Unlock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

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
  transferredAt?: string | null;
  onComplaintsChange: (val: string) => void;
  onVitalSignChange: (key: keyof VitalSigns, val: string) => void;
  onTransferToDoctor: () => void;
  onToggleEdit?: () => void;
}

// ─── Détection des signes vitaux anormaux ────────────────────────────────────
function getVitalAlerts(vs: VitalSigns): { label: string; value: string; severity: 'warning' | 'danger' }[] {
  const alerts: { label: string; value: string; severity: 'warning' | 'danger' }[] = [];

  const sys = parseFloat(vs.blood_pressure_systolic);
  const dia = parseFloat(vs.blood_pressure_diastolic);
  if (!isNaN(sys)) {
    if (sys >= 180) alerts.push({ label: 'Tension systolique', value: `${sys} mmHg`, severity: 'danger' });
    else if (sys >= 140) alerts.push({ label: 'Tension systolique', value: `${sys} mmHg`, severity: 'warning' });
    else if (sys < 90) alerts.push({ label: 'Tension systolique basse', value: `${sys} mmHg`, severity: 'danger' });
  }
  if (!isNaN(dia)) {
    if (dia >= 120) alerts.push({ label: 'Tension diastolique', value: `${dia} mmHg`, severity: 'danger' });
    else if (dia >= 90) alerts.push({ label: 'Tension diastolique', value: `${dia} mmHg`, severity: 'warning' });
  }

  const hr = parseFloat(vs.heart_rate);
  if (!isNaN(hr)) {
    if (hr >= 120 || hr < 40) alerts.push({ label: 'Fréquence cardiaque', value: `${hr} bpm`, severity: 'danger' });
    else if (hr >= 100 || hr < 60) alerts.push({ label: 'Fréquence cardiaque', value: `${hr} bpm`, severity: 'warning' });
  }

  const temp = parseFloat(vs.temperature);
  if (!isNaN(temp)) {
    if (temp >= 40 || temp < 35) alerts.push({ label: 'Température', value: `${temp}°C`, severity: 'danger' });
    else if (temp >= 38.5) alerts.push({ label: 'Température', value: `${temp}°C`, severity: 'warning' });
  }

  const spo2 = parseFloat(vs.oxygen_saturation);
  if (!isNaN(spo2)) {
    if (spo2 < 90) alerts.push({ label: 'Saturation O2', value: `${spo2}%`, severity: 'danger' });
    else if (spo2 < 95) alerts.push({ label: 'Saturation O2', value: `${spo2}%`, severity: 'warning' });
  }

  return alerts;
}

export function NursePreConsultation({
  complaints,
  vitalSigns,
  locked,
  isNurseView,
  transferredAt,
  onComplaintsChange,
  onVitalSignChange,
  onTransferToDoctor,
  onToggleEdit,
}: NursePreConsultationProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const isReadOnly = locked && !isNurseView;
  const canEdit = isNurseView || !locked;
  const vitalAlerts = getVitalAlerts(vitalSigns);
  const hasAlerts = vitalAlerts.length > 0;

  // Vérifier que les champs minimaux sont remplis avant de transférer
  const canTransfer = complaints.trim().length > 0 &&
    vitalSigns.blood_pressure_systolic !== '' &&
    vitalSigns.heart_rate !== '' &&
    vitalSigns.temperature !== '';

  function handleTransferClick() {
    if (hasAlerts) {
      setShowConfirm(true);
    } else {
      onTransferToDoctor();
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className={`bg-white rounded-xl border ${locked ? 'border-teal-200' : 'border-gray-200'} overflow-hidden`}>
      {/* Header */}
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
              Transféré au médecin
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

      {/* ✅ Horodatage du transfert */}
      {locked && transferredAt && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-teal-50/60 border-b border-teal-100 text-xs text-teal-700">
          <Clock className="w-3.5 h-3.5" />
          Transféré le <strong className="ml-1">{formatDate(transferredAt)}</strong>
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Complaints */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Plaintes principales <span className="text-red-400">*</span>
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
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Signes Vitaux <span className="text-red-400">*</span>
            </label>
            {/* ✅ Indicateur alertes */}
            {hasAlerts && (
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                vitalAlerts.some(a => a.severity === 'danger')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <AlertTriangle className="w-3 h-3" />
                {vitalAlerts.length} alerte{vitalAlerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

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
              alert={vitalAlerts.find(a => a.label.includes('Tension'))?.severity}
            />
            <VitalSignInput
              icon={<Activity className="w-4 h-4 text-orange-500" />}
              label="Fréquence Cardiaque"
              unit="bpm"
              placeholder="72"
              value={vitalSigns.heart_rate}
              onChange={(val) => onVitalSignChange('heart_rate', val)}
              disabled={isReadOnly}
              alert={vitalAlerts.find(a => a.label.includes('cardiaque'))?.severity}
            />
            <VitalSignInput
              icon={<Thermometer className="w-4 h-4 text-amber-500" />}
              label="Température"
              unit="°C"
              placeholder="37.0"
              value={vitalSigns.temperature}
              onChange={(val) => onVitalSignChange('temperature', val)}
              disabled={isReadOnly}
              alert={vitalAlerts.find(a => a.label.includes('Température'))?.severity}
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
              alert={vitalAlerts.find(a => a.label.includes('Saturation'))?.severity}
            />
          </div>
        </div>

        {/* ✅ Panneau d'alertes signes vitaux */}
        {hasAlerts && !isReadOnly && (
          <div className={`rounded-lg border p-3 space-y-1.5 ${
            vitalAlerts.some(a => a.severity === 'danger')
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <p className={`text-xs font-semibold flex items-center gap-1.5 ${
              vitalAlerts.some(a => a.severity === 'danger') ? 'text-red-700' : 'text-amber-700'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Signes vitaux anormaux détectés
            </p>
            {vitalAlerts.map((alert, i) => (
              <div key={i} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                alert.severity === 'danger' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <span>{alert.label}</span>
                <span className="font-semibold">{alert.value}</span>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-1">Ces valeurs seront signalées au médecin.</p>
          </div>
        )}

        {/* Champs obligatoires manquants */}
        {!canTransfer && !locked && isNurseView && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Remplissez les plaintes, la tension, la fréquence cardiaque et la température avant de transférer.
          </p>
        )}

        {/* Transfer Button */}
        {canEdit && !locked && isNurseView && (
          <div className="pt-2">
            {/* ✅ Modal de confirmation si alertes */}
            {showConfirm && (
              <div className="mb-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Confirmer le transfert malgré les alertes ?
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Des signes vitaux anormaux ont été détectés. Voulez-vous quand même transférer au médecin ?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowConfirm(false); onTransferToDoctor(); }}
                    className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors"
                  >
                    Oui, transférer quand même
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-3 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleTransferClick}
              disabled={!canTransfer}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg transition-colors font-medium text-sm shadow-sm ${
                canTransfer
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              Transférer au Médecin
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Cette action verrouille les champs infirmier et notifie le médecin
            </p>
          </div>
        )}

        {/* ✅ Badge confirmation après transfert */}
        {locked && (
          <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg border border-teal-200">
            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <p className="text-sm text-teal-700 font-medium">
              Fiche transmise au médecin avec succès
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VitalSignInput ───────────────────────────────────────────────────────────

interface VitalSignInputProps {
  icon: React.ReactNode;
  label: string;
  unit: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
  alert?: 'warning' | 'danger';
}

function VitalSignInput({ icon, label, unit, placeholder, value, onChange, disabled, alert }: VitalSignInputProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      disabled ? 'bg-gray-50 border-gray-100' :
      alert === 'danger' ? 'bg-red-50 border-red-300' :
      alert === 'warning' ? 'bg-amber-50 border-amber-300' :
      'bg-white border-gray-200 hover:border-gray-300'
    }`}>
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
              disabled ? 'text-gray-600 cursor-not-allowed' :
              alert === 'danger' ? 'text-red-700' :
              alert === 'warning' ? 'text-amber-700' :
              'text-gray-900 placeholder:text-gray-300'
            }`}
          />
          <span className="text-[10px] text-gray-400 shrink-0">{unit}</span>
        </div>
      </div>
      {alert && (
        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${alert === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
      )}
    </div>
  );
}
