import { useState, useEffect } from 'react';
import { Pill, Search, Plus, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Prescription {
  id: string;
  patient_name: string;
  doctor_name: string;
  status: string;
  created_at: string;
}

export function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      const { data } = await supabase
        .from('prescriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setPrescriptions(data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          patient_name: (p.patient_name as string) || 'Patient',
          doctor_name: (p.doctor_name as string) || 'Médecin',
          status: (p.status as string) || 'active',
          created_at: p.created_at as string,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = prescriptions.filter(p =>
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Pill className="w-7 h-7 text-green-600" />
            Prescriptions
          </h1>
          <p className="text-gray-500 mt-1">Gestion des ordonnances médicales</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium">
          <Plus className="w-4 h-4" />
          Nouvelle prescription
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une prescription..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune prescription trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((rx) => (
              <div key={rx.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                {rx.status === 'dispensed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{rx.patient_name}</p>
                  <p className="text-sm text-gray-500">Prescrit par {rx.doctor_name}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  rx.status === 'dispensed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {rx.status === 'dispensed' ? 'Dispensée' : 'Active'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(rx.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
