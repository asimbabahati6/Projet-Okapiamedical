import { useState } from 'react';
import {
  Pill, CheckCircle2, Clock, Package,
  Filter, X, ShieldOff, AlertCircle,
  TrendingUp, BarChart2, Truck,
} from 'lucide-react';
import { useWorkflow, type PrescriptionStatus } from '../../contexts/WorkflowContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const map: Record<PrescriptionStatus, { bg: string; text: string; label: string; dot: string }> = {
    a_delivrer: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'À délivrer', dot: 'bg-amber-400' },
    en_cours:   { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'En cours',   dot: 'bg-blue-500' },
    delivree:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Délivrée', dot: 'bg-emerald-500' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function formatRelativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

type FilterStatus = 'all' | PrescriptionStatus;

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
        Cette section est réservée aux <strong>pharmaciens</strong>.
        Veuillez changer de rôle pour accéder aux ordonnances.
      </p>
      <button
        onClick={() => setRole('pharmacien')}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
      >
        <Pill className="w-4 h-4" />
        Passer en mode Pharmacien
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function PharmacyDemoPage() {
  const { role, prescriptions, updatePrescriptionStatus } = useWorkflow();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('a_delivrer');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (role !== 'pharmacien') return <AccessDenied />;

  const filtered = prescriptions.filter(p => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || p.patient_name.toLowerCase().includes(q) || p.prescription_number.toLowerCase().includes(q) || p.doctor_name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: prescriptions.length,
    a_delivrer: prescriptions.filter(p => p.status === 'a_delivrer').length,
    en_cours: prescriptions.filter(p => p.status === 'en_cours').length,
    delivree: prescriptions.filter(p => p.status === 'delivree').length,
  };

  async function handleDeliver(id: string) {
    setActionLoading(id);
    await new Promise(r => setTimeout(r, 500));
    updatePrescriptionStatus(id, 'delivree');
    setActionLoading(null);
    if (expandedId === id) setExpandedId(null);
  }

  async function handleStartPrep(id: string) {
    setActionLoading(id);
    await new Promise(r => setTimeout(r, 300));
    updatePrescriptionStatus(id, 'en_cours');
    setActionLoading(null);
  }

  const tabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'a_delivrer', label: 'À délivrer', count: counts.a_delivrer },
    { key: 'en_cours', label: 'En préparation', count: counts.en_cours },
    { key: 'delivree', label: 'Délivrées', count: counts.delivree },
    { key: 'all', label: 'Toutes', count: counts.all },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordonnances</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion et délivrance des ordonnances médicales</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-center px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="text-xl font-bold text-amber-700">{counts.a_delivrer}</div>
            <div className="text-xs text-amber-600">À délivrer</div>
          </div>
          <div className="text-center px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="text-xl font-bold text-blue-700">{counts.en_cours}</div>
            <div className="text-xs text-blue-600">En préparation</div>
          </div>
          <div className="text-center px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="text-xl font-bold text-emerald-700">{counts.delivree}</div>
            <div className="text-xs text-emerald-600">Délivrées</div>
          </div>
        </div>
      </div>

      {/* Alert for pending */}
      {counts.a_delivrer > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {counts.a_delivrer} ordonnance{counts.a_delivrer > 1 ? 's' : ''} en attente de délivrance
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Cliquez sur "Préparer" puis "Délivrer" pour chaque ordonnance.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par patient, N° ordonnance, médecin…"
            className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

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
              <span className={`ml-1.5 ${filterStatus === tab.key ? 'text-orange-500' : 'text-gray-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucune ordonnance trouvée</p>
            <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          filtered.map(presc => {
            const isExpanded = expandedId === presc.id;
            return (
              <div key={presc.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                presc.status === 'a_delivrer' ? 'border-amber-200' :
                presc.status === 'en_cours' ? 'border-blue-200' : 'border-gray-100'
              }`}>
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Patient avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    presc.status === 'a_delivrer' ? 'bg-amber-100' :
                    presc.status === 'en_cours' ? 'bg-blue-100' : 'bg-emerald-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      presc.status === 'a_delivrer' ? 'text-amber-700' :
                      presc.status === 'en_cours' ? 'text-blue-700' : 'text-emerald-700'
                    }`}>{presc.patient_name.charAt(0)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{presc.patient_name}</span>
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{presc.prescription_number}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">{presc.doctor_name}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{presc.items.length} médicament{presc.items.length > 1 ? 's' : ''}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />{formatRelativeTime(presc.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <StatusBadge status={presc.status} />

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : presc.id)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? 'Réduire' : 'Détails'}
                    </button>

                    {presc.status === 'a_delivrer' && (
                      <button
                        onClick={() => handleStartPrep(presc.id)}
                        disabled={actionLoading === presc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        <Package className="w-3.5 h-3.5" />
                        {actionLoading === presc.id ? '…' : 'Préparer'}
                      </button>
                    )}

                    {presc.status === 'en_cours' && (
                      <button
                        onClick={() => handleDeliver(presc.id)}
                        disabled={actionLoading === presc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        {actionLoading === presc.id ? 'Confirmation…' : 'Délivrer'}
                      </button>
                    )}

                    {presc.status === 'delivree' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Délivrée
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded medications */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-orange-500" />
                      Médicaments prescrits
                    </h4>
                    <div className="space-y-2">
                      {presc.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-orange-600">{idx + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {item.dosage && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                  Dose: {item.dosage}
                                </span>
                              )}
                              {item.frequency && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                  Fréq: {item.frequency}
                                </span>
                              )}
                              {item.duration && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                  Durée: {item.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {presc.notes && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-xs font-semibold text-amber-700 mb-0.5">Note du médecin</p>
                        <p className="text-xs text-amber-800">{presc.notes}</p>
                      </div>
                    )}

                    {/* Quick deliver from details */}
                    {presc.status === 'en_cours' && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleDeliver(presc.id)}
                          disabled={actionLoading === presc.id}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmer la délivrance
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>{filtered.length} ordonnance(s) affichée(s)</span>
          <div className="flex items-center gap-1">
            <BarChart2 className="w-3 h-3" />
            <span>{Math.round((counts.delivree / Math.max(counts.all, 1)) * 100)}% délivrées</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pharmacist dashboard
// ---------------------------------------------------------------------------

export function PharmacistDashboard() {
  const { role, prescriptions } = useWorkflow();
  if (role !== 'pharmacien') return <AccessDenied />;

  const toDeliver = prescriptions.filter(p => p.status === 'a_delivrer').length;
  const inProg = prescriptions.filter(p => p.status === 'en_cours').length;
  const delivered = prescriptions.filter(p => p.status === 'delivree').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord — Pharmacie</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de l'activité pharmaceutique</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'À délivrer', value: toDeliver, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100' },
          { label: 'En préparation', value: inProg, icon: Package, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' },
          { label: 'Délivrées', value: delivered, icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' },
          { label: 'Total ordonnances', value: prescriptions.length, icon: Pill, bg: 'bg-orange-50', color: 'text-orange-500', border: 'border-orange-100' },
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Taux de délivrance</h3>
        </div>
        <div className="space-y-3">
          {(['a_delivrer', 'en_cours', 'delivree'] as PrescriptionStatus[]).map(status => {
            const count = prescriptions.filter(p => p.status === status).length;
            const pct = Math.round((count / Math.max(prescriptions.length, 1)) * 100);
            const colors: Record<PrescriptionStatus, string> = {
              a_delivrer: 'bg-amber-400',
              en_cours: 'bg-blue-500',
              delivree: 'bg-emerald-500',
            };
            const labels: Record<PrescriptionStatus, string> = {
              a_delivrer: 'À délivrer',
              en_cours: 'En préparation',
              delivree: 'Délivrée',
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
