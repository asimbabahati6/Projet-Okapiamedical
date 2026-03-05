import { LogIn, LogOut, Coffee, ArrowRight, Camera, Clock, AlertCircle } from 'lucide-react';
import type { PunchRecord } from '../../services/smartPunchService';

interface Props {
  records: PunchRecord[];
}

const PUNCH_CONFIG = {
  check_in: { label: "Arrivée", icon: LogIn, color: "text-blue-600 bg-blue-50 border-blue-100" },
  check_out: { label: "Départ", icon: LogOut, color: "text-gray-600 bg-gray-50 border-gray-200" },
  break_start: { label: "Début pause", icon: Coffee, color: "text-amber-600 bg-amber-50 border-amber-100" },
  break_end: { label: "Retour pause", icon: ArrowRight, color: "text-green-600 bg-green-50 border-green-100" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface SelfieThumbProps {
  url: string | null;
  punchType: string;
}

function SelfieThumb({ url, punchType }: SelfieThumbProps) {
  if (!url) return (
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0" title="Pas de selfie">
      <Camera className="w-4 h-4 text-gray-300" />
    </div>
  );

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={`Selfie — ${punchType}`}>
      <img
        src={url}
        alt="Selfie"
        className="w-10 h-10 rounded-lg object-cover border border-gray-200 hover:scale-150 hover:shadow-xl transition-transform duration-200 cursor-zoom-in"
      />
    </a>
  );
}

export function TodayTimeline({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
        <Clock className="w-10 h-10" />
        <p className="text-sm">Aucun pointage enregistré aujourd'hui</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record, idx) => {
        const config = PUNCH_CONFIG[record.punch_type];
        const Icon = config.icon;

        return (
          <div key={record.id} className="flex items-start gap-3 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {idx < records.length - 1 && (
                <div className="w-px h-4 bg-gray-200 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{config.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTime(record.punched_at)}</p>
                </div>
                <SelfieThumb url={record.selfie_url} punchType={record.punch_type} />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {record.is_late && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-full font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Retard {record.late_by_minutes}min
                  </span>
                )}
                {record.break_exceeded && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-full font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Pause +{record.break_exceeded_by_minutes}min
                  </span>
                )}
                {record.is_remote_exception && (
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-full">
                    Accès distant
                  </span>
                )}
                {record.auto_closed && (
                  <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-full">
                    Fermeture auto.
                  </span>
                )}
                {record.distance_from_office_meters !== null && !record.is_remote_exception && (
                  <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 text-xs rounded-full">
                    {record.distance_from_office_meters}m du bureau
                  </span>
                )}
                {record.break_duration_minutes && (
                  <span className="px-2 py-0.5 bg-green-50 border border-green-100 text-green-700 text-xs rounded-full">
                    Durée pause: {record.break_duration_minutes}min
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
