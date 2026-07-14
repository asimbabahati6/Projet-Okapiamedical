import { useState } from 'react';
import { X, CreditCard, DollarSign, Banknote, Check, AlertCircle } from 'lucide-react';
import { Invoice } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { enregistrerMouvementEntree } from '../../services/caisseService';

const PAYMENT_METHODS = [
  { value: 'Espèces', label: 'Espèces' },
  { value: 'Carte bancaire', label: 'Carte bancaire' },
  { value: 'Virement bancaire', label: 'Virement bancaire' },
  { value: 'Mobile Money', label: 'Mobile Money' },
  { value: 'Chèque', label: 'Chèque' },
];

interface EncaisserModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

export function EncaisserModal({ invoice, onClose, onSuccess }: EncaisserModalProps) {
  const remaining = (invoice.net_to_pay ?? invoice.total_amount) - invoice.paid_amount;

  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [devise, setDevise] = useState<'USD' | 'CDF'>(invoice.devise_paiement ?? 'USD');
  const [method, setMethod] = useState('Espèces');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!invoice) return null;

  const patientName = invoice.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
    : 'Patient inconnu';

  const displayNumber = invoice.invoice_number ?? invoice.draft_number ?? '—';
  const netToPay = invoice.net_to_pay ?? invoice.total_amount;
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= remaining;

  async function handleSubmit() {
    if (!isValidAmount) return;
    setLoading(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      // 1. Insert payment record
      const { error: insertErr } = await supabase.from('payment_history').insert({
        invoice_id: invoice.id,
        payment_amount: parsedAmount,
        payment_method: method,
        devise_paiement: devise,
        transaction_reference: reference || null,
        notes: notes || null,
        recorded_by: userId,
      });
      if (insertErr) throw insertErr;

      // 2. Update invoice totals & status
      const newPaid = invoice.paid_amount + parsedAmount;
      const newBalance = netToPay - newPaid;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      const { error: updateErr } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaid,
          balance: Math.max(newBalance, 0),
          status: newStatus,
          payment_method: method,
          payment_date: new Date().toISOString(),
          devise_paiement: devise,
        })
        .eq('id', invoice.id);
      if (updateErr) throw updateErr;

      // 3. Record cash inflow
      await enregistrerMouvementEntree({
        montant: parsedAmount,
        devise,
        reference: `PAY-${displayNumber}`,
        motif: `Paiement facture ${displayNumber} — ${patientName}`,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'encaissement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2.5 rounded-xl">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Encaisser un paiement</h2>
              <p className="text-xs text-gray-500">{displayNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Invoice summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Patient</p>
                <p className="font-medium text-gray-800">{patientName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Montant total</p>
                <p className="font-bold text-gray-800">{netToPay.toFixed(2)} USD</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Déjà payé</p>
                <p className="font-medium text-blue-600">{invoice.paid_amount.toFixed(2)} USD</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Solde restant</p>
                <p className="font-bold text-red-600">{remaining.toFixed(2)} USD</p>
              </div>
            </div>
          </div>

          {/* Amount field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Montant à encaisser
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm"
                placeholder="0.00"
              />
            </div>
            {amount && !isValidAmount && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Le montant doit être entre 0.01 et {remaining.toFixed(2)}
              </p>
            )}
          </div>

          {/* Currency & Payment method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise</label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value as 'USD' | 'CDF')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm bg-white"
              >
                <option value="USD">USD — Dollar américain</option>
                <option value="CDF">CDF — Franc congolais</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Méthode de paiement
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm bg-white appearance-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transaction reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Référence transaction <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm"
              placeholder="Ex: TXN-20240115-001"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm resize-none"
              placeholder="Remarques sur ce paiement..."
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={loading || !isValidAmount}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {loading ? 'Traitement...' : 'Confirmer l\'encaissement'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
