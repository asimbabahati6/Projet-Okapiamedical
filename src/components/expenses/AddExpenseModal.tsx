import { useState } from 'react';
import { X, Plus, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  value: string;
  label: string;
  icon: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Especes' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'check', label: 'Cheque' },
];

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    category: categories[0]?.value || '',
    amount: '',
    devise: 'USD' as 'USD' | 'CDF',
    description: '',
    expense_date: new Date().toISOString().slice(0, 10),
    payment_method: 'cash',
    vendor: '',
    receipt_number: '',
    beneficiaire_type: 'externe' as 'interne' | 'externe',
    beneficiaire_nom: '',
    piece_justificative_ref: '',
    notes: '',
  });

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Le montant doit etre superieur a 0'); return; }
    if (!form.description.trim()) { setError('La description est obligatoire'); return; }
    if (!form.beneficiaire_nom.trim()) { setError('Le nom du beneficiaire est obligatoire'); return; }

    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from('expenses').insert({
        category: form.category,
        amount,
        description: form.description.trim(),
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        vendor: form.vendor.trim() || null,
        receipt_number: form.receipt_number.trim() || null,
        beneficiaire_type: form.beneficiaire_type,
        beneficiaire_nom: form.beneficiaire_nom.trim(),
        piece_justificative_ref: form.piece_justificative_ref.trim() || null,
        notes: form.notes.trim() || null,
        approval_status: 'pending',
        devise_depense: form.devise,
      });

      if (dbError) throw dbError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la creation');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            Nouvelle depense
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Amount + Currency + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={e => update('amount', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise *</label>
              <select
                value={form.devise}
                onChange={e => update('devise', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
              <select
                value={form.category}
                onChange={e => update('category', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Description de la depense..."
              required
            />
          </div>

          {/* Date + Payment method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={e => update('expense_date', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement *</label>
              <select
                value={form.payment_method}
                onChange={e => update('payment_method', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor + Receipt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <input
                type="text"
                value={form.vendor}
                onChange={e => update('vendor', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="Nom du fournisseur"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N de recu</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.receipt_number}
                  onChange={e => update('receipt_number', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Numero de recu"
                />
              </div>
            </div>
          </div>

          {/* Beneficiary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Beneficiaire</p>
            <div className="flex gap-4">
              {(['interne', 'externe'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="beneficiaire_type"
                    value={t}
                    checked={form.beneficiaire_type === t}
                    onChange={() => update('beneficiaire_type', t)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{t}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              value={form.beneficiaire_nom}
              onChange={e => update('beneficiaire_nom', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              placeholder="Nom du beneficiaire *"
              required
            />
          </div>

          {/* Piece justificative */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ref. piece justificative</label>
            <input
              type="text"
              value={form.piece_justificative_ref}
              onChange={e => update('piece_justificative_ref', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Reference du document justificatif"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              placeholder="Remarques supplementaires..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Enregistrer la depense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
