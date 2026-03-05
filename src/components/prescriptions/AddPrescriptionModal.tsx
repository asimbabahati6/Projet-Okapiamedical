import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Patient, Medication, Pharmacy, PharmacyStock } from '../../types/database';
import { X, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { generateQRCodeData } from '../../utils/prescriptionExport';

interface PrescriptionItem {
  medication_id: string;
  dosage: string;
  quantity: number;
  frequency: string;
  duration: string;
  instructions: string;
  substitution_allowed: boolean;
  stock_available: boolean;
  alternative_medication_id?: string;
}

interface AddPrescriptionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPrescriptionModal({ onClose, onSuccess }: AddPrescriptionModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [stockData, setStockData] = useState<Map<string, PharmacyStock[]>>(new Map());

  const [formData, setFormData] = useState({
    patient_id: '',
    pharmacy_id: '',
    diagnosis: '',
    notes: '',
    expiration_days: 30
  });

  const [items, setItems] = useState<PrescriptionItem[]>([{
    medication_id: '',
    dosage: '',
    quantity: 1,
    frequency: '',
    duration: '',
    instructions: '',
    substitution_allowed: false,
    stock_available: true
  }]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [patientsRes, medicationsRes, pharmaciesRes] = await Promise.all([
        supabase.from('patients').select('*').order('patient_number', { ascending: false }),
        supabase.from('medications').select('*').eq('is_active', true).order('generic_name'),
        supabase.from('pharmacies').select('*').eq('active', true).order('name')
      ]);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (medicationsRes.data) setMedications(medicationsRes.data);
      if (pharmaciesRes.data) setPharmacies(pharmaciesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    }
  }

  async function checkStock(medicationId: string, pharmacyId: string) {
    if (!medicationId || !pharmacyId) return null;

    try {
      const { data, error } = await supabase
        .from('pharmacy_stock')
        .select('*')
        .eq('medication_id', medicationId)
        .eq('pharmacy_id', pharmacyId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  async function handleMedicationChange(index: number, medicationId: string) {
    const newItems = [...items];
    newItems[index].medication_id = medicationId;

    if (medicationId && formData.pharmacy_id) {
      const stock = await checkStock(medicationId, formData.pharmacy_id);
      newItems[index].stock_available = stock ? stock.quantity >= newItems[index].quantity : false;
    }

    setItems(newItems);
  }

  function handleItemChange(index: number, field: keyof PrescriptionItem, value: any) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, {
      medication_id: '',
      dosage: '',
      quantity: 1,
      frequency: '',
      duration: '',
      instructions: '',
      substitution_allowed: false,
      stock_available: true
    }]);
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (items.some(item => !item.medication_id || !item.dosage || !item.frequency || !item.duration)) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        setLoading(false);
        return;
      }

      const prescriptionNumber = `RX-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + formData.expiration_days);

      const qrCodeData = generateQRCodeData({
        prescription_number: prescriptionNumber,
        patient_id: formData.patient_id,
        doctor_id: user!.id,
        prescription_date: new Date().toISOString(),
        expiration_date: expirationDate.toISOString()
      } as any);

      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          prescription_number: prescriptionNumber,
          patient_id: formData.patient_id,
          doctor_id: user!.id,
          pharmacy_id: formData.pharmacy_id || null,
          prescription_date: new Date().toISOString(),
          expiration_date: expirationDate.toISOString().split('T')[0],
          status: 'pending',
          diagnosis: formData.diagnosis,
          notes: formData.notes,
          qr_code: qrCodeData
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      const prescriptionItems = items.map(item => ({
        prescription_id: prescription.id,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(prescriptionItems);

      if (itemsError) throw itemsError;

      await supabase
        .from('prescription_audit_log')
        .insert({
          prescription_id: prescription.id,
          action: 'created',
          performed_by: user!.id,
          details: {
            items_count: items.length,
            pharmacy: formData.pharmacy_id
          }
        });

      showToast('Prescription créée avec succès', 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      showToast(error.message || 'Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Nouvelle Prescription</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_number} - {patient.first_name} {patient.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pharmacie
                </label>
                <select
                  value={formData.pharmacy_id}
                  onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une pharmacie</option>
                  {pharmacies.map(pharmacy => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnostic
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez le diagnostic..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validité (jours)
              </label>
              <input
                type="number"
                value={formData.expiration_days}
                onChange={(e) => setFormData({ ...formData, expiration_days: parseInt(e.target.value) })}
                min="1"
                max="365"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Médicaments</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un médicament
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Médicament <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.medication_id}
                          onChange={(e) => handleMedicationChange(index, e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner</option>
                          {medications.map(med => (
                            <option key={med.id} value={med.id}>
                              {med.brand_name || med.generic_name} - {med.strength}
                            </option>
                          ))}
                        </select>
                        {item.medication_id && formData.pharmacy_id && !item.stock_available && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            Stock faible ou indisponible
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dosage <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                          required
                          placeholder="Ex: 500mg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fréquence <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                          required
                          placeholder="Ex: 3 fois par jour"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Durée <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                          required
                          placeholder="Ex: 7 jours"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantité <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          required
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <textarea
                        value={item.instructions}
                        onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                        rows={2}
                        placeholder="Instructions spéciales..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`substitution-${index}`}
                        checked={item.substitution_allowed}
                        onChange={(e) => handleItemChange(index, 'substitution_allowed', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`substitution-${index}`} className="text-sm text-gray-700">
                        Substitution générique autorisée
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes additionnelles
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notes pour le pharmacien..."
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
