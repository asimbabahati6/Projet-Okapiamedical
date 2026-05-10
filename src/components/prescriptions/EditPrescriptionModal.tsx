import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Patient, Medication, Pharmacy, PharmacyStock } from '../../types/database';
import { X, Plus, Trash2, AlertCircle, Lock, AlertTriangle } from 'lucide-react';

interface PrescriptionItem {
  id?: string;
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

interface EditPrescriptionModalProps {
  prescription: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPrescriptionModal({ prescription, onClose, onSuccess }: EditPrescriptionModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [originalData, setOriginalData] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    diagnosis: prescription.diagnosis || '',
    notes: prescription.notes || '',
    expiration_date: prescription.expiration_date || ''
  });

  const [items, setItems] = useState<PrescriptionItem[]>([]);

  useEffect(() => {
    fetchData();
    loadPrescriptionItems();
  }, []);

  async function fetchData() {
    try {
      const medicationsRes = await supabase
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .order('generic_name');

      if (medicationsRes.data) setMedications(medicationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    }
  }

  async function loadPrescriptionItems() {
    try {
      const { data, error } = await supabase
        .from('prescription_items')
        .select(`
          *,
          medication:medications(*)
        `)
        .eq('prescription_id', prescription.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedItems = data.map(item => ({
          id: item.id,
          medication_id: item.medication_id,
          dosage: item.dosage,
          quantity: item.quantity,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions || '',
          substitution_allowed: item.substitution_allowed || false,
          stock_available: item.stock_available || true,
          alternative_medication_id: item.alternative_medication_id
        }));
        setItems(formattedItems);
        setOriginalData({
          diagnosis: prescription.diagnosis,
          notes: prescription.notes,
          expiration_date: prescription.expiration_date,
          items: formattedItems
        });
      }
    } catch (error) {
      console.error('Error loading prescription items:', error);
      showToast('Erreur lors du chargement des médicaments', 'error');
    }
  }

  function canEdit(): boolean {
    return prescription.status === 'pending';
  }

  function getStatusMessage(): string {
    if (prescription.status === 'dispensed') {
      return 'Cette prescription a déjà été dispensée et ne peut plus être modifiée';
    }
    if (prescription.status === 'expired') {
      return 'Cette prescription est expirée et ne peut plus être modifiée';
    }
    if (prescription.status === 'cancelled') {
      return 'Cette prescription a été annulée et ne peut plus être modifiée';
    }
    return '';
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

    if (medicationId && prescription.pharmacy_id) {
      const stock = await checkStock(medicationId, prescription.pharmacy_id);
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

  function confirmRemoveItem(index: number) {
    setShowDeleteConfirm(index);
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setShowDeleteConfirm(null);
    }
  }

  function prepareAuditData() {
    const changes: any = {
      fields_modified: [],
      items_added: 0,
      items_removed: 0,
      items_modified: 0
    };

    const old_values: any = {};
    const new_values: any = {};

    if (formData.diagnosis !== originalData.diagnosis) {
      changes.fields_modified.push('diagnosis');
      old_values.diagnosis = originalData.diagnosis;
      new_values.diagnosis = formData.diagnosis;
    }

    if (formData.notes !== originalData.notes) {
      changes.fields_modified.push('notes');
      old_values.notes = originalData.notes;
      new_values.notes = formData.notes;
    }

    if (formData.expiration_date !== originalData.expiration_date) {
      changes.fields_modified.push('expiration_date');
      old_values.expiration_date = originalData.expiration_date;
      new_values.expiration_date = formData.expiration_date;
    }

    const originalItemIds = new Set(originalData.items.map((item: any) => item.id).filter(Boolean));
    const currentItemIds = new Set(items.map(item => item.id).filter(Boolean));

    changes.items_added = items.filter(item => !item.id).length;
    changes.items_removed = originalData.items.filter((item: any) =>
      item.id && !currentItemIds.has(item.id)
    ).length;

    items.forEach(item => {
      if (item.id) {
        const original = originalData.items.find((i: any) => i.id === item.id);
        if (original && JSON.stringify(original) !== JSON.stringify(item)) {
          changes.items_modified++;
        }
      }
    });

    return { changes, old_values, new_values };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canEdit()) {
      showToast(getStatusMessage(), 'error');
      return;
    }

    setLoading(true);

    try {
      if (items.some(item => !item.medication_id || !item.dosage || !item.frequency || !item.duration)) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        setLoading(false);
        return;
      }

      if (items.length === 0) {
        showToast('Au moins un médicament doit être prescrit', 'error');
        setLoading(false);
        return;
      }

      const { changes, old_values, new_values } = prepareAuditData();

      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .update({
          diagnosis: formData.diagnosis,
          notes: formData.notes,
          expiration_date: formData.expiration_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', prescription.id)
        .eq('status', 'pending');

      if (prescriptionError) throw prescriptionError;

      const originalItemIds = originalData.items.map((item: any) => item.id).filter(Boolean);
      const currentItemIds = items.map(item => item.id).filter(Boolean);
      const itemsToDelete = originalItemIds.filter((id: string) => !currentItemIds.includes(id));

      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('prescription_items')
          .delete()
          .in('id', itemsToDelete);

        if (deleteError) throw deleteError;
      }

      for (const item of items) {
        if (item.id) {
          const { error: updateError } = await supabase
            .from('prescription_items')
            .update({
              medication_id: item.medication_id,
              dosage: item.dosage,
              quantity: item.quantity,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
              substitution_allowed: item.substitution_allowed,
              stock_available: item.stock_available,
              alternative_medication_id: item.alternative_medication_id || null
            })
            .eq('id', item.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('prescription_items')
            .insert({
              prescription_id: prescription.id,
              medication_id: item.medication_id,
              dosage: item.dosage,
              quantity: item.quantity,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
              substitution_allowed: item.substitution_allowed,
              stock_available: item.stock_available,
              alternative_medication_id: item.alternative_medication_id || null
            });

          if (insertError) throw insertError;
        }
      }

      await supabase
        .from('prescription_audit_log')
        .insert({
          prescription_id: prescription.id,
          action: 'edited',
          performed_by: user!.id,
          details: changes,
          old_values,
          new_values
        });

      showToast('Prescription modifiée avec succès', 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating prescription:', error);
      showToast(error.message || 'Erreur lors de la modification', 'error');
    } finally {
      setLoading(false);
    }
  }

  const statusMessage = getStatusMessage();
  const isEditable = canEdit();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Modifier l'ordonnance n°{prescription.prescription_number}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                prescription.status === 'expired' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {prescription.status === 'pending' ? 'En attente' :
                 prescription.status === 'dispensed' ? 'Dispensé' :
                 prescription.status === 'expired' ? 'Expiré' :
                 'Annulé'}
              </span>
              {!isEditable && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  Lecture seule
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditable && statusMessage && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{statusMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Informations verrouillées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    N° Prescription
                  </label>
                  <input
                    type="text"
                    value={prescription.prescription_number}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Patient
                  </label>
                  <input
                    type="text"
                    value={`${prescription.patient?.first_name} ${prescription.patient?.last_name} (${prescription.patient?.patient_number})`}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Date de création
                  </label>
                  <input
                    type="text"
                    value={new Date(prescription.created_at).toLocaleDateString('fr-FR')}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Médecin prescripteur
                  </label>
                  <input
                    type="text"
                    value={prescription.doctor?.full_name || 'N/A'}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                </div>
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
                disabled={!isEditable}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Entrez le diagnostic..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'expiration
              </label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                disabled={!isEditable}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Médicaments</h3>
                {isEditable && (
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un médicament
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
                    {items.length > 1 && isEditable && (
                      <button
                        type="button"
                        onClick={() => confirmRemoveItem(index)}
                        className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {showDeleteConfirm === index && (
                      <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10 p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-900 mb-3">
                            Confirmer la suppression de ce médicament?
                          </p>
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
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
                          disabled={!isEditable}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">Sélectionner</option>
                          {medications.map(med => (
                            <option key={med.id} value={med.id}>
                              {med.brand_name || med.generic_name} - {med.strength}
                            </option>
                          ))}
                        </select>
                        {item.medication_id && prescription.pharmacy_id && !item.stock_available && (
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
                          disabled={!isEditable}
                          placeholder="Ex: 500mg"
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
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
                          disabled={!isEditable}
                          placeholder="Ex: 3 fois par jour"
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
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
                          disabled={!isEditable}
                          placeholder="Ex: 7 jours"
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
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
                          disabled={!isEditable}
                          min="1"
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
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
                        disabled={!isEditable}
                        placeholder="Instructions spéciales..."
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`substitution-${index}`}
                        checked={item.substitution_allowed}
                        onChange={(e) => handleItemChange(index, 'substitution_allowed', e.target.checked)}
                        disabled={!isEditable}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
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
                disabled={!isEditable}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
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
              {isEditable ? 'Annuler' : 'Fermer'}
            </button>
            {isEditable && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les Modifications'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
