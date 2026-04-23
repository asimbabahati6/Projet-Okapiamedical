import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, FlaskConical, Pill, Clock, Filter, X } from 'lucide-react';
import { useWorkflow } from '../../contexts/WorkflowContext';

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

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    brouillon: 'bg-gray-400',
    en_cours: 'bg-blue-500',
    terminee: 'bg-emerald-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] ?? 'bg-gray-300'}`} />;
}

export function ConsultationsListPage() {
  const navigate = useNavigate();
  const { consultations } = useWorkflow();
  const [search, setSearch] = useState('');

  const filtered = consultations.filter(c => {
    const q = search.toLowerCase();
    return !q || c.patient_name.toLowerCase().includes(q) || c.consultation_number.toLowerCase().includes(q) || c.chief_complaint.toLowerCase().includes(q) || c.diagnosis.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{consultations.length} consultation(s) enregistrée(s)</p>
        </div>
        <button
          onClick={() => navigate('/demo/nouvelle-consultation')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par patient, N° consultation, diagnostic…"
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">Aucune consultation</p>
            <button
              onClick={() => navigate('/demo/nouvelle-consultation')}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Créer la première consultation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">N° Consultation</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Motif</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Diagnostic</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Statut</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Liaisons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        {c.consultation_number}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-600">{c.patient_name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{c.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <div className="text-sm text-gray-800 truncate">{c.chief_complaint}</div>
                      <TypeLabel type={c.consultation_type} />
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <span className="text-sm text-gray-600 line-clamp-2">{c.diagnosis || <span className="text-gray-300 italic">—</span>}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={c.consultation_status} />
                        <span className="text-xs text-gray-500 capitalize">{c.consultation_status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
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
                        {c.lab_requests.length === 0 && c.prescriptions.length === 0 && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        {filtered.length} résultat(s) · Les icônes <FlaskConical className="inline w-3 h-3 text-emerald-500" /> et <Pill className="inline w-3 h-3 text-orange-500" /> indiquent les liaisons vers le laboratoire et la pharmacie.
      </p>
    </div>
  );
}
