import { useState } from 'react';
import {
  FlaskConical, Clock, CheckCircle2, Activity,
  AlertTriangle, Play, ClipboardCheck, Filter, X,
  TrendingUp, BarChart2, ShieldOff,
} from 'lucide-react';
import { useWorkflow, type LabRequestStatus } from '../../contexts/WorkflowContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: LabRequestStatus }) {
  const map: Record<LabRequestStatus, { bg: string; text: string; label: string; dot: string }> = {
    en_attente: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente', dot: 'bg-amber-400' },
    en_cours:   { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'En cours',   dot: 'bg-blue-500' },
    termine:    { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Terminé',  dot: 'bg-emerald-500' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'urgent') return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-md"><AlertTriangle className="w-3 h-3" />Urgent</span>;
  if (priority === 'stat') return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-md"><AlertTriangle className="w-3 h-3" />STAT</span>;
  return <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-md">Normal</span>;
}

function formatRelativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

type FilterStatus = 'all' | LabRequestStatus;

// ---------------------------------------------------------------------------
// Access denied guard
// ---------------------------------------------------------------------------

function AccessDenied() {
  const { setRole } = useWorkflow();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
        <ShieldOff className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Accès restreint</h2>
      <p className="text-gray-500 max-w-sm text-sm">
        Cette section est réservée aux <strong>laborantins</strong>.
        Veuillez changer de rôle pour accéder aux demandes d'examens.
      </p>
      <button
        onClick={() => setRole('laborantin')}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        <FlaskConical className="w-4 h-4" />
        Passer en mode Laborantin
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function LabPage() {
  const { role, labRequests, updateLabRequestStatus } = useWorkflow();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (role !== 'laborantin') return <AccessDenied />;

  const filtered = labRequests.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || r.patient_name.toLowerCase().includes(q) || r.order_number.toLowerCase().includes(q) || r.tests.some(t => t.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const counts = {
    all: labRequests.length,
    en_attente: labRequests.filter(r => r.status === 'en_attente').length,
    en_cours: labRequests.filter(r => r.status === 'en_cours').length,
    termine: labRequests.filter(r => r.status === 'termine').length,
  };

  async function handleAction(id: string, nextStatus: LabRequestStatus) {
    setActionLoading(id);
    await new Promise(r => setTimeout(r, 400));
    updateLabRequestStatus(id, nextStatus);
    setActionLoading(null);
  }

  const tabs: { key: FilterStatus; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'Toutes', count: counts.all, color: 'text-gray-600' },
    { key: 'en_attente', label: 'En attente', count: counts.en_attente, color: 'text-amber-600' },
    { key: 'en_cours', label: 'En cours', count: counts.en_cours, color: 'text-blue-600' },
    { key: 'termine', label: 'Terminées', count: counts.termine, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes d'examens</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de la file d'attente du laboratoire</p>
        </div>

        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-center px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="text-xl font-bold text-amber-700">{counts.en_attente}</div>
            <div className="text-xs text-amber-600">En attente</div>
          </div>
          <div className="text-center px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="text-xl font-bold text-blue-700">{counts.en_cours}</div>
            <div className="text-xs text-blue-600">En cours</div>
          </div>
          <div className="text-center px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="text-xl font-bold text-emerald-700">{counts.termine}</div>
            <div className="text-xs text-emerald-600">Terminées</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par patient, N° ordre, examen…"
            className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === tab.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${filterStatus === tab.key ? tab.color : 'text-gray-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucune demande trouvée</p>
            <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">N° Ordre</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Examens demandés</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Priorité</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Statut</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Reçu</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition-colors group">
                    {/* Order number */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        {req.order_number}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-emerald-600">{req.patient_name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{req.patient_name}</div>
                          <div className="text-xs text-gray-400">Dr. {req.doctor_name.replace('Dr. ', '')}</div>
                        </div>
                      </div>
                    </td>

                    {/* Tests */}
                    <td className="px-4 py-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {req.tests.slice(0, 3).map(t => (
                          <span key={t} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md border border-emerald-100">
                            {t}
                          </span>
                        ))}
                        {req.tests.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-md">
                            +{req.tests.length - 3}
                          </span>
                        )}
                      </div>
                      {req.notes && (
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={req.notes}>{req.notes}</p>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4">
                      <PriorityBadge priority={req.priority} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Time */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(req.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {req.status === 'en_attente' && (
                        <button
                          onClick={() => handleAction(req.id, 'en_cours')}
                          disabled={actionLoading === req.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {actionLoading === req.id ? 'Traitement…' : 'Démarrer'}
                        </button>
                      )}
                      {req.status === 'en_cours' && (
                        <button
                          onClick={() => handleAction(req.id, 'termine')}
                          disabled={actionLoading === req.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          {actionLoading === req.id ? 'Validation…' : 'Valider résultats'}
                        </button>
                      )}
                      {req.status === 'termine' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Terminé
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>{filtered.length} demande(s) affichée(s)</span>
          <div className="flex items-center gap-1">
            <BarChart2 className="w-3 h-3" />
            <span>{Math.round((counts.termine / Math.max(counts.all, 1)) * 100)}% traité(s) aujourd'hui</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Laborantin dashboard (simple stats page)
// ---------------------------------------------------------------------------

export function LaborantinDashboard() {
  const { role, labRequests } = useWorkflow();
  if (role !== 'laborantin') return <AccessDenied />;

  const pending = labRequests.filter(r => r.status === 'en_attente');
  const inProgress = labRequests.filter(r => r.status === 'en_cours');
  const done = labRequests.filter(r => r.status === 'termine');
  const urgent = labRequests.filter(r => r.priority === 'urgent' || r.priority === 'stat');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord — Laboratoire</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de l'activité du laboratoire</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'En attente', value: pending.length, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100' },
          { label: 'En cours d\'analyse', value: inProgress.length, icon: Activity, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' },
          { label: 'Terminées', value: done.length, icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' },
          { label: 'Urgent / STAT', value: urgent.length, icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500', border: 'border-red-100' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-white rounded-2xl border ${kpi.border} p-5 shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
              <div className="text-xs font-medium text-gray-500">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {urgent.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-800">Demandes urgentes en attente</h3>
          </div>
          <div className="space-y-2">
            {urgent.filter(r => r.status !== 'termine').map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-red-100">
                <div>
                  <span className="font-medium text-gray-900 text-sm">{r.patient_name}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-sm text-gray-600">{r.tests.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <PriorityBadge priority={r.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Progression du traitement</h3>
        </div>
        <div className="space-y-3">
          {(['en_attente', 'en_cours', 'termine'] as LabRequestStatus[]).map(status => {
            const count = labRequests.filter(r => r.status === status).length;
            const pct = Math.round((count / Math.max(labRequests.length, 1)) * 100);
            const colors: Record<LabRequestStatus, string> = {
              en_attente: 'bg-amber-400',
              en_cours: 'bg-blue-500',
              termine: 'bg-emerald-500',
            };
            const labels: Record<LabRequestStatus, string> = {
              en_attente: 'En attente',
              en_cours: 'En cours',
              termine: 'Terminé',
            };
            return (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{labels[status]}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${colors[status]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
