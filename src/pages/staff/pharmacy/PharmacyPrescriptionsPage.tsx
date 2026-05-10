import { useState, useEffect } from 'react';
import { FileText, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface PharmacyPrescription {
  id: string;
  prescription_number: string;
  patient_name: string;
  doctor_name: string;
  status: string;
  created_at: string;
}

export default function PharmacyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PharmacyPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      const { data } = await supabase
        .from('prescriptions')
        .select(`
          id, prescription_number, status, created_at,
          patient:patients(first_name, last_name),
          doctor:user_profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setPrescriptions(data.map((p: any) => ({
          id: p.id,
          prescription_number: p.prescription_number || '-',
          patient_name: p.patient ? `${p.patient.last_name} ${p.patient.first_name}` : 'Inconnu',
          doctor_name: p.doctor?.full_name || 'Inconnu',
          status: p.status || 'pending',
          created_at: p.created_at,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = prescriptions.filter(p =>
    search === '' ||
    p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    p.prescription_number.toLowerCase().includes(search.toLowerCase())
  );

  function getStatusBadge(status: string) {
    switch (status) {
      case 'dispensed':
        return <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Dispense</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> En attente</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Annule</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <FileText className="w-6 h-6 text-blue-600" />
        Ordonnances
      </h2>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par patient ou numero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune ordonnance trouvee</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Numero</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Medecin</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((rx) => (
                  <tr key={rx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{rx.prescription_number}</td>
                    <td className="px-4 py-3 text-gray-700">{rx.patient_name}</td>
                    <td className="px-4 py-3 text-gray-600">{rx.doctor_name}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(rx.status)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(rx.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
