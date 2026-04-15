import { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Trash2, FileEdit, Clock, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TVA_RATE = 16;

interface AddInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceItem {
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const ITEM_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'medication', label: 'Médicament' },
  { value: 'lab_test', label: 'Analyse' },
  { value: 'procedure', label: 'Procédure' },
];

export function AddInvoiceModal({ onClose, onSuccess }: AddInvoiceModalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    notes: '',
    initialStatus: 'pending' as 'draft' | 'pending',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', item_type: 'consultation', quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, patient_number, first_name, last_name')
        .order('first_name', { ascending: true })
        .limit(100);
      if (data) setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  }

  function addItem() {
    setItems([...items, { description: '', item_type: 'consultation', quantity: 1, unit_price: 0, total: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    setItems(updated);
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tvaAmount = subtotal * (TVA_RATE / 100);
  const netToPay = subtotal + tvaAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isDraft = formData.initialStatus === 'draft';

      const invoicePayload: any = {
        patient_id: formData.patient_id,
        total_amount: subtotal,
        tva_rate: TVA_RATE,
        tva_amount: tvaAmount,
        net_to_pay: netToPay,
        paid_amount: 0,
        balance: netToPay,
        status: isDraft ? 'draft' : 'pending',
        notes: formData.notes || null,
      };

      if (!isDraft) {
        invoicePayload.invoice_number = null;
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoicePayload)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (invoiceData) {
        const invoiceItems = items.map(item => ({
          invoice_id: invoiceData.id,
          description: item.description,
          item_type: item.item_type || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (itemsError) throw itemsError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Nouvelle Facture</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.patient_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Statut initial
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  formData.initialStatus === 'draft'
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="initialStatus"
                    value="draft"
                    checked={formData.initialStatus === 'draft'}
                    onChange={() => setFormData({ ...formData, initialStatus: 'draft' })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileEdit className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Brouillon</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Pas de numéro OKA attribué. La facture ne peut pas être envoyée au patient tant qu'elle n'est pas validée.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  formData.initialStatus === 'pending'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="initialStatus"
                    value="pending"
                    checked={formData.initialStatus === 'pending'}
                    onChange={() => setFormData({ ...formData, initialStatus: 'pending' })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-gray-700">En attente</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Numéro OKA-AAAA-MM-XXXX généré immédiatement. La facture peut être envoyée au patient.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Actes Médicaux</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un acte
                </button>
              </div>

              <div className="hidden md:grid grid-cols-12 gap-3 mb-2 px-1">
                <div className="col-span-4 text-xs font-medium text-gray-500">Description</div>
                <div className="col-span-2 text-xs font-medium text-gray-500">Type</div>
                <div className="col-span-2 text-xs font-medium text-gray-500">Qté</div>
                <div className="col-span-2 text-xs font-medium text-gray-500">P.U. (USD)</div>
                <div className="col-span-1 text-xs font-medium text-gray-500">Total HT</div>
                <div className="col-span-1" />
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-4">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Description de l'acte"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.item_type}
                        onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        {ITEM_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="text"
                        disabled
                        value={item.total.toFixed(2)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-medium text-right"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-200">
                <div className="ml-auto w-64 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sous-total HT</span>
                    <span className="font-medium text-gray-900">{subtotal.toFixed(2)} USD</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      TVA {TVA_RATE}%
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                    </span>
                    <span className="font-medium text-gray-900">{tvaAmount.toFixed(2)} USD</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Net à Payer</span>
                    <span className="text-xl font-bold text-blue-700">{netToPay.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Informations supplémentaires..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Création en cours...' : formData.initialStatus === 'draft' ? 'Créer le Brouillon' : 'Créer la Facture'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
