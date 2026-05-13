import { useState, useEffect } from 'react';
import { Pill, Search, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddPrescriptionModal from '../../components/prescriptions/AddPrescriptionModal';

interface Prescription {
  id: string;
  prescription_number: string;
  patient_name: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  diagnosis: string;
  status: string;
  created_at: string;
}

export function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      const { data } = await supabase
        .from('prescriptions')
        .select('*, patients(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setPrescriptions(data.map((p: Record<string, unknown>) => {
          const patient = p.patients as { first_name: string; last_name: string } | null;
          return {
            id: p.id as string,
            prescription_number: (p.prescription_number as string) || '',
            patient_name: patient ? `${patient.last_name} ${patient.first_name}` : 'Patient',
            medication_name: (p.medication_name as string) || '',
            dosage: (p.dosage as string) || '',
            frequency: (p.frequency as string) || '',
            duration: (p.duration as string) || '',
            diagnosis: (p.diagnosis as string) || '',
            status: (p.status as string) || 'active',
            created_at: p.created_at as string,
          };
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = prescriptions.filter(p =>
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig: Record<string, { icon: typeof Clock; label: string; bgClass: string; textClass: string }> = {
    active: { icon: Clock, label: 'Active', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
    pending: { icon: Clock, label: 'En attente', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
    dispensed: { icon: CheckCircle, label: 'Dispensee', bgClass: 'bg-green-100', textClass: 'text-green-800' },
    expired: { icon: AlertTriangle, label: 'Expiree', bgClass: 'bg-orange-100', textClass: 'text-orange-800' },
    cancelled: { icon: XCircle, label: 'Annulee', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Pill className="w-7 h-7 text-green-600" />
            Prescriptions
          </h1>
          <p className="text-gray-500 mt-1">Gestion des ordonnances medicales</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
        >
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
              placeholder="Rechercher par patient, medicament, diagnostic..."
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
            <p className="text-gray-500">Aucune prescription trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N Prescription</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Medicament</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Posologie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((rx) => {
                  const config = statusConfig[rx.status] || statusConfig.active;
                  return (
                    <tr key={rx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-gray-600">{rx.prescription_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{rx.patient_name}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{rx.medication_name || '-'}</p>
                          {rx.diagnosis && <p className="text-xs text-gray-400 mt-0.5">{rx.diagnosis}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {rx.dosage && <span>{rx.dosage}</span>}
                          {rx.frequency && <span className="text-gray-400"> - {rx.frequency}</span>}
                          {rx.duration && <span className="text-gray-400"> ({rx.duration})</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(rx.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPrescriptionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPrescriptions();
          }}
        />
      )}
    </div>
  );
}
