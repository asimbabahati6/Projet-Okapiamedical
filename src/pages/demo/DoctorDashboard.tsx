import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, FlaskConical, Pill, Users, Plus,
  ArrowRight, Clock, CheckCircle2, AlertCircle, TrendingUp,
  X, Stethoscope, ChevronRight,
} from 'lucide-react';
import { useWorkflow } from '../../contexts/WorkflowContext';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    brouillon: 'bg-gray-100 text-gray-600',
    en_cours: 'bg-blue-100 text-blue-700',
    terminee: 'bg-emerald-100 text-emerald-700',
  };
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    en_cours: 'En cours',
    terminee: 'Terminée',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function TypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    initial: 'Première consultation',
    follow_up: 'Suivi',
    routine: 'Routine',
    emergency: 'Urgence',
    telemedicine: 'Télémédecine',
  };
  return <span className="text-xs text-gray-500">{labels[type] ?? type}</span>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const WORKFLOW_STEPS = [
  {
    role: 'medecin',
    icon: Stethoscope,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    label: 'Médecin',
    action: 'Crée une consultation',
    detail: 'Prescrit des examens labo et une ordonnance',
  },
  {
    role: 'laborantin',
    icon: FlaskConical,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    label: 'Laborantin',
    action: 'Traite les examens',
    detail: 'Démarre et valide les demandes d\'analyses',
  },
  {
    role: 'pharmacien',
    icon: Pill,
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    label: 'Pharmacien',
    action: 'Délivre les médicaments',
    detail: 'Prépare et remet les ordonnances aux patients',
  },
];

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { consultations, labRequests, prescriptions } = useWorkflow();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const today = new Date().toDateString();
  const todayConsultations = consultations.filter(c => new Date(c.created_at).toDateString() === today);
  const pendingLab = labRequests.filter(r => r.status === 'en_attente').length;
  const toDeliver = prescriptions.filter(p => p.status === 'a_delivrer').length;
  const totalPatients = new Set(consultations.map(c => c.patient_id)).size;

  const kpis = [
    {
      label: 'Consultations aujourd\'hui',
      value: todayConsultations.length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      delta: `${consultations.length} total`,
    },
    {
      label: 'Demandes labo en attente',
      value: pendingLab,
      icon: FlaskConical,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      delta: `${labRequests.filter(r => r.status === 'en_cours').length} en cours`,
      alert: pendingLab > 2,
    },
    {
      label: 'Ordonnances à délivrer',
      value: toDeliver,
      icon: Pill,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      delta: `${prescriptions.filter(p => p.status === 'delivree').length} délivrées`,
      alert: toDeliver > 1,
    },
    {
      label: 'Patients suivis',
      value: totalPatients,
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      delta: 'fichiers actifs',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding workflow banner */}
      {!bannerDismissed && (
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>

          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute top-3 right-3 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Mode démonstration RBAC</p>
            <h2 className="text-lg font-bold text-white mb-1">Workflow médical en 3 étapes</h2>
            <p className="text-sm text-slate-300 mb-4">
              Utilisez le sélecteur de rôle en haut à droite pour changer de perspective et suivre le parcours complet d'une consultation.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {WORKFLOW_STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.role} className="flex items-center gap-2">
                    <div className="flex items-center gap-2.5 bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${step.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{step.label}</p>
                        <p className="text-xs text-slate-400 truncate">{step.action}</p>
                      </div>
                    </div>
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/demo/nouvelle-consultation')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Commencer : créer une consultation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/demo/nouvelle-consultation')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle consultation
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {kpi.alert && (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
              <div className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <TrendingUp className="w-3 h-3" />
                {kpi.delta}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent consultations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Consultations récentes</h2>
          <button
            onClick={() => navigate('/demo/consultations')}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {consultations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune consultation enregistrée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {consultations.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">
                    {c.patient_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm truncate">{c.patient_name}</span>
                    <span className="text-xs text-gray-400 font-mono">{c.consultation_number}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TypeLabel type={c.consultation_type} />
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500 truncate">{c.chief_complaint}</span>
                  </div>
                </div>

                {/* Status & time */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={c.consultation_status} />
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500">{formatDate(c.created_at)}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatTime(c.created_at)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {c.lab_requests.length > 0 && (
                    <span title={`${c.lab_requests.length} demande(s) labo`} className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
                      <FlaskConical className="w-3 h-3 text-emerald-600" />
                    </span>
                  )}
                  {c.prescriptions.length > 0 && (
                    <span title={`${c.prescriptions.length} ordonnance(s)`} className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                      <Pill className="w-3 h-3 text-orange-500" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending items grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending lab */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Examens en attente</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {pendingLab}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {labRequests.filter(r => r.status === 'en_attente').slice(0, 4).map(lr => (
              <div key={lr.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${lr.priority === 'urgent' || lr.priority === 'stat' ? 'bg-red-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{lr.patient_name}</div>
                  <div className="text-xs text-gray-500 truncate">{lr.tests.join(', ')}</div>
                </div>
                {lr.priority === 'urgent' && (
                  <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full flex-shrink-0">Urgent</span>
                )}
              </div>
            ))}
            {pendingLab === 0 && (
              <div className="flex items-center gap-2 px-5 py-4 text-gray-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Aucune demande en attente
              </div>
            )}
          </div>
        </div>

        {/* Pending prescriptions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Ordonnances à délivrer</h3>
            </div>
            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              {toDeliver}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {prescriptions.filter(p => p.status === 'a_delivrer').slice(0, 4).map(pr => (
              <div key={pr.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-2 h-2 rounded-full bg-orange-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{pr.patient_name}</div>
                  <div className="text-xs text-gray-500">{pr.items.length} médicament(s)</div>
                </div>
                <span className="text-xs text-gray-400 font-mono flex-shrink-0">{pr.prescription_number}</span>
              </div>
            ))}
            {toDeliver === 0 && (
              <div className="flex items-center gap-2 px-5 py-4 text-gray-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Toutes les ordonnances ont été délivrées
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
