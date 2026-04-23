import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, X, FileText, Activity } from 'lucide-react';
import { useWorkflow } from '../../contexts/WorkflowContext';

const DEMO_PATIENTS = [
  { id: 'p1', number: 'PAT-001', name: 'Jean-Paul Mbala', dob: '12/04/1985', gender: 'M', phone: '+243 81 234 5678', blood_group: 'B+' },
  { id: 'p2', number: 'PAT-002', name: 'Marie-Claire Tshisekedi', dob: '28/09/1992', gender: 'F', phone: '+243 99 876 5432', blood_group: 'O+' },
  { id: 'p3', number: 'PAT-003', name: 'Alain Ilunga', dob: '03/07/1968', gender: 'M', phone: '+243 82 345 6789', blood_group: 'A+' },
  { id: 'p4', number: 'PAT-004', name: 'Sophie Kabila', dob: '15/01/2001', gender: 'F', phone: '+243 97 654 3210', blood_group: 'AB-' },
  { id: 'p5', number: 'PAT-005', name: 'Michel Lumumba', dob: '22/11/1978', gender: 'M', phone: '+243 84 567 8901', blood_group: 'O-' },
];

export function PatientsPage() {
  const navigate = useNavigate();
  const { consultations } = useWorkflow();
  const [search, setSearch] = useState('');

  const filtered = DEMO_PATIENTS.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.number.toLowerCase().includes(q) || p.phone.includes(q);
  });

  function getPatientConsultationCount(patientId: string) {
    return consultations.filter(c => c.patient_id === patientId).length;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{DEMO_PATIENTS.length} patients enregistrés</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed"
          title="Fonctionnalité de démonstration"
        >
          <Plus className="w-4 h-4" />
          Nouveau patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, N° patient, téléphone…"
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const nbConsult = getPatientConsultationCount(p.id);
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">{p.number}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${p.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                  {p.gender === 'F' ? 'F' : 'H'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                <div className="flex justify-between">
                  <span>Né(e) le</span>
                  <span className="font-medium text-gray-700">{p.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span>Téléphone</span>
                  <span className="font-medium text-gray-700">{p.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Groupe sanguin</span>
                  <span className="font-semibold text-red-600">{p.blood_group}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Activity className="w-3.5 h-3.5" />
                  {nbConsult} consultation(s)
                </div>
                <button
                  onClick={() => navigate('/demo/nouvelle-consultation')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Consulter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
