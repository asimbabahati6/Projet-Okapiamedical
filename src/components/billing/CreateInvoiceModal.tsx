import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Receipt, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
  phone: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
}

const ITEM_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'laboratory', label: 'Analyse de laboratoire' },
  { value: 'radiology', label: 'Radiologie' },
  { value: 'pharmacy', label: 'Pharmacie' },
  { value: 'hospitalization', label: 'Hospitalisation' },
  { value: 'surgery', label: 'Chirurgie' },
  { value: 'other', label: 'Autre' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Especes' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'insurance', label: 'Assurance' },
];

const TVA_RATE = 16;

export function CreateInvoiceModal({ onClose, onSuccess }: CreateInvoiceModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', item_type: 'consultation', quantity: 1, unit_price: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [applyTva, setApplyTva] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const { data } = await supabase
      .from('patients')
      .select('id, first_name, last_name, patient_number, phone')
      .order('last_name')
      .limit(300);
    if (data) setPatients(data);
  }

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const term = patientSearch.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      p.patient_number?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

  function addItem() {
    setItems([...items, { id: crypto.randomUUID(), description: '', item_type: 'other', quantity: 1, unit_price: 0 }]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const tvaAmount = applyTva ? Math.round(subtotal * TVA_RATE) / 100 : 0;
  const netToPay = subtotal + tvaAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError('Veuillez selectionner un patient.');
      return;
    }

    const validItems = items.filter((i) => i.description.trim() && i.unit_price > 0);
    if (validItems.length === 0) {
      setError('Ajoutez au moins un article avec une description et un prix.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      const invoiceNumber = `FAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          patient_id: selectedPatient.id,
          total_amount: subtotal,
          paid_amount: 0,
          balance: netToPay,
          status: 'pending',
          payment_method: paymentMethod,
          notes: notes || null,
          tva_rate: applyTva ? TVA_RATE : 0,
          tva_amount: tvaAmount,
          net_to_pay: netToPay,
        })
        .select('id')
        .single();

      if (invoiceError) throw invoiceError;

      const itemRows = validItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description.trim(),
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase.from('invoice_items').insert(itemRows);
      if (itemsError) throw itemsError;

      onSuccess();
    } catch (err: unknown) {
      console.error('Error creating invoice:', err);
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Erreur inconnue';
      setError(`Echec de la creation: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Nouvelle Facture</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Patient *</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedPatient.last_name} {selectedPatient.first_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedPatient.patient_number} {selectedPatient.phone ? `- ${selectedPatient.phone}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un patient par nom, numero ou telephone..."
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {showPatientDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <div className="p-3 text-sm text-gray-400 text-center">Aucun patient trouve</div>
                      ) : (
                        filteredPatients.slice(0, 20).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedPatient(p); setShowPatientDropdown(false); setPatientSearch(''); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <span className="font-medium text-gray-900">{p.last_name} {p.first_name}</span>
                            <span className="text-xs text-gray-400 ml-2">{p.patient_number}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Articles *</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un article
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Article {idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="Description de l'article..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Type</label>
                        <select
                          value={item.item_type}
                          onChange={(e) => updateItem(item.id, 'item_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          {ITEM_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Quantite</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Prix unitaire (USD)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price || ''}
                            onChange={(e) => updateItem(item.id, 'unit_price', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    {item.quantity > 0 && item.unit_price > 0 && (
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-700">
                          Sous-total: {(item.quantity * item.unit_price).toFixed(2)} USD
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method & Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mode de paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTva}
                    onChange={(e) => setApplyTva(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Appliquer la TVA ({TVA_RATE}%)</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observations ou details supplementaires..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Totals Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Resume de la facture</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total ({items.filter(i => i.description && i.unit_price > 0).length} article(s))</span>
                  <span className="font-medium text-gray-900">{subtotal.toFixed(2)} USD</span>
                </div>
                {applyTva && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA ({TVA_RATE}%)</span>
                    <span className="font-medium text-gray-900">{tvaAmount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Net a payer</span>
                    <span className="text-xl font-bold text-blue-600">{netToPay.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedPatient || items.every(i => !i.description || i.unit_price <= 0)}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Enregistrement...' : 'Creer la facture'}
          </button>
        </div>
      </div>
    </div>
  );
}
