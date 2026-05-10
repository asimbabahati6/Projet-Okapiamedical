import { useEffect, useState } from 'react';
import {
  FileText, User, CheckCircle, XCircle, Clock, AlertTriangle,
  Package, ChevronDown, ChevronUp, Search, Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  quantity: number;
  duration_days: number | null;
  instructions: string | null;
}

interface Prescription {
  id: string;
  prescription_number: string;
  status: string;
  created_at: string;
  notes: string | null;
  patient: { first_name: string; last_name: string; patient_number: string } | null;
  doctor: { first_name: string; last_name: string } | null;
  items: PrescriptionItem[];
}

interface StockCheck {
  medication_name: string;
  requested: number;
  available: number;
  isAvailable: boolean;
  medication_id: string | null;
}

export default function PharmacyPrescriptionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [stockChecks, setStockChecks] = useState<StockCheck[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  async function fetchPrescriptions() {
    setLoading(true);
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          id,
          prescription_number,
          status,
          created_at,
          notes,
          patient:patients(first_name, last_name, patient_number),
          doctor:user_profiles(first_name, last_name),
          items:prescription_items(id, medication_name, dosage, quantity, duration_days, instructions)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        prescription_number: p.prescription_number,
        status: p.status,
        created_at: p.created_at,
        notes: p.notes,
        patient: Array.isArray(p.patient) ? p.patient[0] : p.patient,
        doctor: Array.isArray(p.doctor) ? p.doctor[0] : p.doctor,
        items: p.items || []
      }));

      setPrescriptions(formatted);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      showToast('Erreur lors du chargement des ordonnances', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStock(prescription: Prescription) {
    setSelectedPrescription(prescription);
    setCheckingStock(true);
    setStockChecks([]);

    try {
      const checks: StockCheck[] = await Promise.all(
        prescription.items.map(async (item) => {
          const { data } = await supabase
            .from('medications')
            .select('id, quantity_in_stock')
            .ilike('generic_name', `%${item.medication_name.split(' ')[0]}%`)
            .maybeSingle();

          const available = data?.quantity_in_stock ?? 0;
          return {
            medication_name: item.medication_name,
            requested: item.quantity,
            available,
            isAvailable: available >= item.quantity,
            medication_id: data?.id ?? null
          };
        })
      );
      setStockChecks(checks);
    } catch (error) {
      console.error('Error checking stock:', error);
      showToast('Erreur lors de la vérification du stock', 'error');
    } finally {
      setCheckingStock(false);
    }
  }

  async function handleDispense() {
    if (!selectedPrescription || !user) return;

    const allAvailable = stockChecks.every(c => c.isAvailable);
    if (!allAvailable) {
      showToast('Stock insuffisant pour certains médicaments', 'error');
      return;
    }

    setDispensing(true);
    try {
      for (const check of stockChecks) {
        if (!check.medication_id) continue;

        const newQty = check.available - check.requested;

        await supabase
          .from('medications')
          .update({ quantity_in_stock: newQty, updated_at: new Date().toISOString() })
          .eq('id', check.medication_id);
      }

      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'dispensed', updated_at: new Date().toISOString() })
        .eq('id', selectedPrescription.id);

      if (error) throw error;

      showToast(
        `Ordonnance ${selectedPrescription.prescription_number} dispensée avec succès`,
        'success'
      );

      setSelectedPrescription(null);
      setStockChecks([]);
      fetchPrescriptions();
    } catch (error) {
      console.error('Error dispensing:', error);
      showToast('Erreur lors de la dispensation', 'error');
    } finally {
      setDispensing(false);
    }
  }

  const filtered = prescriptions.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const patientName = p.patient
      ? `${p.patient.first_name} ${p.patient.last_name}`.toLowerCase()
      : '';
    return (
      p.prescription_number.toLowerCase().includes(term) ||
      patientName.includes(term)
    );
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    dispensed: { label: 'Dispensée', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    partial: { label: 'Partielle', color: 'bg-blue-100 text-blue-800' }
  };

  const counts = {
    pending: prescriptions.filter(p => p.status === 'pending').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
    all: prescriptions.length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Traitement des Ordonnances</h1>
        <p className="text-gray-600 mt-1">Validation et dispensation pharmaceutique</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Dispensées aujourd'hui</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {prescriptions.filter(p => {
              if (p.status !== 'dispensed') return false;
              const today = new Date().toISOString().split('T')[0];
              return p.created_at.startsWith(today);
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total chargé</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{counts.all}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher patient, numéro..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {(['all', 'pending', 'dispensed', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Toutes' : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Aucune ordonnance trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const isExpanded = expandedId === p.id;
            const cfg = statusConfig[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-800' };

            return (
              <div key={p.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 font-mono">{p.prescription_number}</p>
                      <p className="text-sm text-gray-600">
                        {p.patient
                          ? `${p.patient.first_name} ${p.patient.last_name}`
                          : 'Patient inconnu'}
                        {p.doctor && (
                          <span className="ml-2 text-gray-400">
                            • Dr. {p.doctor.first_name} {p.doctor.last_name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">{p.items.length} article(s)</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    {p.items.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Aucun article dans cette ordonnance</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Médicaments prescrits</h4>
                        {p.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between bg-white rounded-lg p-3 border border-gray-200"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{item.medication_name}</p>
                              <p className="text-sm text-gray-500">
                                {item.dosage}
                                {item.duration_days ? ` · ${item.duration_days} jours` : ''}
                                {item.instructions ? ` · ${item.instructions}` : ''}
                              </p>
                            </div>
                            <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                              Qté: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {p.notes && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
                        <strong>Notes: </strong>{p.notes}
                      </div>
                    )}

                    {p.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCheckStock(p)}
                          disabled={checkingStock && selectedPrescription?.id === p.id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Package className="w-4 h-4" />
                          {checkingStock && selectedPrescription?.id === p.id
                            ? 'Vérification...'
                            : 'Vérifier disponibilité'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedPrescription && (stockChecks.length > 0 || checkingStock) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Vérification du Stock</h2>
              <p className="text-sm text-gray-500 mt-1">
                Patient:{' '}
                {selectedPrescription.patient
                  ? `${selectedPrescription.patient.first_name} ${selectedPrescription.patient.last_name}`
                  : 'N/A'}
              </p>
            </div>

            <div className="p-6 space-y-3">
              {checkingStock ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                stockChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      check.isAvailable
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{check.medication_name}</p>
                        <div className="flex gap-6 mt-1 text-sm">
                          <span className="text-gray-600">
                            Demandé: <strong>{check.requested}</strong>
                          </span>
                          <span className={check.isAvailable ? 'text-green-700' : 'text-red-700'}>
                            Disponible: <strong>{check.available}</strong>
                          </span>
                        </div>
                      </div>
                      {check.isAvailable ? (
                        <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-7 h-7 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}

              {!checkingStock && !stockChecks.every(c => c.isAvailable) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="font-medium">Stock insuffisant — dispensation impossible</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => { setSelectedPrescription(null); setStockChecks([]); }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
              {!checkingStock && stockChecks.every(c => c.isAvailable) && (
                <button
                  onClick={handleDispense}
                  disabled={dispensing}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {dispensing ? 'Dispensation...' : 'Valider la dispensation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
