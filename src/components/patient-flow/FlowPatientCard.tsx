import { useState } from 'react';
import { Clock, User, Building2, Stethoscope, Send, ChevronDown, ChevronUp, Play, CheckCircle2, FileText } from 'lucide-react';

export interface PatientAdmission {
  id: string;
  patient_id: string | null;
  admission_date: string;
  flow_type: 'exam_only' | 'new_patient';
  status: 'waiting' | 'in_progress' | 'completed' | 'report_sent';
  tag: 'EXTERNE' | 'INTERNE' | 'NOUVEAU';
  prescribing_doctor_name: string | null;
  prescribing_doctor_phone: string | null;
  prescribing_institution: string | null;
  exam_type: string | null;
  exam_acts: string[];
  department_id: string | null;
  assigned_doctor_id: string | null;
  reason: string | null;
  report_sent_at: string | null;
  report_sent_method: string | null;
  report_sent_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_number: string;
    phone: string | null;
  } | null;
  department?: {
    name: string;
  } | null;
}

interface FlowPatientCardProps {
  admission: PatientAdmission;
  onStatusChange: (id: string, status: PatientAdmission['status']) => void;
  onMarkReportSent: (id: string) => void;
}

const STATUS_CONFIG = {
  waiting: { label: 'En attente', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
  in_progress: { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  completed: { label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  report_sent: { label: 'Rapport envoyé', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

const TAG_CONFIG = {
  EXTERNE: { label: 'EXTERNE', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  INTERNE: { label: 'INTERNE', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  NOUVEAU: { label: 'NOUVEAU', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export function FlowPatientCard({ admission, onStatusChange, onMarkReportSent }: FlowPatientCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isExam = admission.flow_type === 'exam_only';
  const accentBorder = isExam ? 'border-l-blue-500' : 'border-l-green-500';
  const statusConfig = STATUS_CONFIG[admission.status];
  const tagConfig = TAG_CONFIG[admission.tag];
  const patientName = admission.patient
    ? `${admission.patient.last_name} ${admission.patient.first_name}`
    : 'Patient inconnu';

  const createdTime = new Date(admission.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  function getNextStatus(): PatientAdmission['status'] | null {
    if (admission.status === 'waiting') return 'in_progress';
    if (admission.status === 'in_progress') return 'completed';
    if (admission.status === 'completed' && isExam) return 'report_sent';
    return null;
  }

  const nextStatus = getNextStatus();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 border-l-4 ${accentBorder} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900 truncate">{patientName}</h4>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tagConfig.color}`}>
                {tagConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {createdTime}
              </span>
              {admission.department?.name && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {admission.department.name}
                </span>
              )}
              {admission.exam_type && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                  <FileText className="w-3 h-3" />
                  {admission.exam_type}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border ${statusConfig.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Réduire' : 'Détails'}
          </button>

          <div className="flex items-center gap-1.5">
            {nextStatus && (
              <button
                onClick={() => onStatusChange(admission.id, nextStatus)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  nextStatus === 'in_progress'
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : nextStatus === 'completed'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {nextStatus === 'in_progress' && <Play className="w-3 h-3" />}
                {nextStatus === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {nextStatus === 'report_sent' && <Send className="w-3 h-3" />}
                {nextStatus === 'in_progress' && 'Démarrer'}
                {nextStatus === 'completed' && 'Terminer'}
                {nextStatus === 'report_sent' && 'Rapport envoyé'}
              </button>
            )}
            {isExam && admission.status === 'completed' && (
              <button
                onClick={() => onMarkReportSent(admission.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                <Send className="w-3 h-3" />
                Envoyer rapport
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2 text-sm text-gray-600">
          {admission.patient?.patient_number && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>N° {admission.patient.patient_number}</span>
              {admission.patient.phone && <span className="text-gray-400">| {admission.patient.phone}</span>}
            </div>
          )}
          {isExam && admission.prescribing_doctor_name && (
            <div className="flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
              <span>Prescripteur: <strong>{admission.prescribing_doctor_name}</strong></span>
              {admission.prescribing_institution && (
                <span className="text-gray-400">({admission.prescribing_institution})</span>
              )}
            </div>
          )}
          {admission.exam_acts && admission.exam_acts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {admission.exam_acts.map((act, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {act}
                </span>
              ))}
            </div>
          )}
          {admission.reason && (
            <p className="text-gray-500 italic text-xs mt-1">{admission.reason}</p>
          )}
          {admission.report_sent_at && (
            <div className="flex items-center gap-2 text-blue-600 text-xs mt-1">
              <Send className="w-3 h-3" />
              Rapport envoyé le {new Date(admission.report_sent_at).toLocaleDateString('fr-FR')}
              {admission.report_sent_method && ` (${admission.report_sent_method})`}
            </div>
          )}
          {admission.notes && (
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{admission.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
