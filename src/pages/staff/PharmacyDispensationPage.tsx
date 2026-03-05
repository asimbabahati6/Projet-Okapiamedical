import { useEffect, useState } from 'react';
import { FileText, User, CheckCircle, XCircle, Clock, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePharmacyPermissions } from '../../hooks/usePharmacyPermissions';
import { useAuth } from '../../contexts/AuthContext';

interface PrescriptionQueue {
  id: string;
  patient_id: string;
  prescribed_by: string;
  status: string;
  priority: string;
  medications: any[];
  total_amount: number;
  notes: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  prescriber: {
    full_name: string;
  };
}

interface AvailabilityCheck {
  code: string;
  name: string;
  requested: number;
  available: number;
  isAvailable: boolean;
}

export default function PharmacyDispensationPage() {
  const permissions = usePharmacyPermissions();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionQueue | null>(null);
  const [availability, setAvailability] = useState<AvailabilityCheck[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_prescriptions_queue')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number),
          prescriber:user_profiles!pharmacy_prescriptions_queue_prescribed_by_fkey(full_name)
        `)
        .in('status', ['pending', 'in_preparation'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (prescription: PrescriptionQueue) => {
    setChecking(true);
    setSelectedPrescription(prescription);

    try {
      const medicationCodes = prescription.medications.map((m: any) => m.code);

      const { data: stockData, error } = await supabase
        .from('pharmacy_medications')
        .select('code, name, current_stock')
        .in('code', medicationCodes);

      if (error) throw error;

      const availabilityChecks: AvailabilityCheck[] = prescription.medications.map((med: any) => {
        const stock = stockData?.find(s => s.code === med.code);
        return {
          code: med.code,
          name: med.name,
          requested: med.quantity,
          available: stock?.current_stock || 0,
          isAvailable: (stock?.current_stock || 0) >= med.quantity
        };
      });

      setAvailability(availabilityChecks);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setChecking(false);
    }
  };

  const dispensePrescription = async () => {
    if (!selectedPrescription || !permissions.canManageInventory) return;

    const allAvailable = availability.every(a => a.isAvailable);
    if (!allAvailable) {
      alert('Impossible de délivrer: stock insuffisant pour certains médicaments');
      return;
    }

    try {
      for (const check of availability) {
        const { data: med } = await supabase
          .from('pharmacy_medications')
          .select('id, current_stock, unit_price')
          .eq('code', check.code)
          .single();

        if (!med) continue;

        const newStock = med.current_stock - check.requested;

        await supabase
          .from('pharmacy_stock_movements')
          .insert({
            medication_id: med.id,
            movement_type: 'dispensation',
            quantity: -check.requested,
            previous_stock: med.current_stock,
            new_stock: newStock,
            unit_cost: med.unit_price,
            total_cost: check.requested * med.unit_price,
            reference_number: `DISP-${Date.now()}`,
            reason: `Ordonnance patient ${selectedPrescription.patient.patient_number}`,
            performed_by: user?.id
          });

        await supabase
          .from('pharmacy_medications')
          .update({ current_stock: newStock })
          .eq('id', med.id);
      }

      const receiptNumber = `REC-${Date.now()}-${selectedPrescription.patient.patient_number}`;

      await supabase
        .from('pharmacy_dispensation_records')
        .insert({
          queue_id: selectedPrescription.id,
          patient_id: selectedPrescription.patient_id,
          medications_dispensed: selectedPrescription.medications,
          total_amount: selectedPrescription.total_amount,
          payment_method: 'cash',
          receipt_number: receiptNumber,
          dispensed_by: user?.id
        });

      await supabase
        .from('pharmacy_prescriptions_queue')
        .update({
          status: 'dispensed',
          dispensed_by: user?.id,
          dispensed_at: new Date().toISOString()
        })
        .eq('id', selectedPrescription.id);

      alert(`Ordonnance délivrée avec succès!\nReçu N°: ${receiptNumber}`);
      setSelectedPrescription(null);
      setAvailability([]);
      fetchPrescriptions();
    } catch (error) {
      console.error('Error dispensing:', error);
      alert('Erreur lors de la dispensation');
    }
  };

  const priorityConfig = {
    low: { label: 'Basse', color: 'bg-gray-100 text-gray-800' },
    normal: { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
    high: { label: 'Haute', color: 'bg-yellow-100 text-yellow-800' },
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Traiter les Ordonnances</h1>
        <p className="text-gray-600 mt-1">Workflow de dispensation pharmaceutique</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {prescriptions.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Préparation</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {prescriptions.filter(p => p.status === 'in_preparation').length}
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgentes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {prescriptions.filter(p => p.priority === 'urgent' || p.priority === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {prescriptions.map((prescription) => {
          const priorityStyle = priorityConfig[prescription.priority as keyof typeof priorityConfig];
          const isSelected = selectedPrescription?.id === prescription.id;

          return (
            <div
              key={prescription.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden ${isSelected ? 'ring-2 ring-cyan-500' : ''}`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-50 rounded-lg">
                      <FileText className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {prescription.patient.first_name} {prescription.patient.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{prescription.patient.patient_number}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityStyle.color}`}>
                    {priorityStyle.label}
                  </span>
                </div>

                {/* Prescriber Info */}
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Prescrit par: <span className="font-medium">{prescription.prescriber.full_name}</span></span>
                </div>

                {/* Medications */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Médicaments prescrits:</h4>
                  <div className="space-y-2">
                    {prescription.medications.map((med: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{med.name}</p>
                            <p className="text-sm text-gray-600">{med.dosage} - Quantité: {med.quantity}</p>
                            <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {prescription.notes && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Notes: </span>
                      {prescription.notes}
                    </p>
                  </div>
                )}

                {/* Amount */}
                <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Montant Total:</span>
                  <span className="text-xl font-bold text-green-600">${prescription.total_amount.toFixed(2)}</span>
                </div>

                {/* Actions */}
                {permissions.canManageInventory && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => checkAvailability(prescription)}
                      disabled={checking && isSelected}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {checking && isSelected ? 'Vérification...' : 'Vérifier Disponibilité'}
                    </button>
                  </div>
                )}

                {/* Time */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Reçu il y a {Math.round((Date.now() - new Date(prescription.created_at).getTime()) / 60000)} min
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {prescriptions.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Aucune ordonnance en attente</h3>
          <p className="mt-2 text-gray-600">Les nouvelles ordonnances apparaîtront ici</p>
        </div>
      )}

      {/* Availability Modal */}
      {selectedPrescription && availability.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vérification de Disponibilité</h2>

              <div className="mb-6">
                <p className="text-gray-700">
                  <span className="font-semibold">Patient:</span> {selectedPrescription.patient.first_name} {selectedPrescription.patient.last_name}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {availability.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${item.isAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.code}</p>
                      </div>
                      {item.isAvailable ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Demandé: <span className="font-semibold">{item.requested}</span></span>
                      <span className={item.isAvailable ? 'text-green-600' : 'text-red-600'}>
                        Disponible: <span className="font-bold">{item.available}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedPrescription(null);
                    setAvailability([]);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
                {availability.every(a => a.isAvailable) && permissions.canManageInventory && (
                  <button
                    onClick={dispensePrescription}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Délivrer
                  </button>
                )}
              </div>

              {!availability.every(a => a.isAvailable) && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    Impossible de délivrer cette ordonnance: stock insuffisant
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
