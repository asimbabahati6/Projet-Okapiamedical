import { useState } from 'react';
import { X, CreditCard, DollarSign, Banknote, Check, AlertCircle, ArrowRightLeft, Info, ShieldAlert } from 'lucide-react';
import { Invoice } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { enregistrerMouvementEntree } from '../../services/caisseService';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { useRBAC } from '../../contexts/RBACContext';

const PAYMENT_METHODS = [
  { value: 'Espèces', label: 'Especes' },
  { value: 'Carte bancaire', label: 'Carte bancaire' },
  { value: 'Virement bancaire', label: 'Virement bancaire' },
  { value: 'Mobile Money', label: 'Mobile Money' },
  { value: 'Chèque', label: 'Cheque' },
];

interface EncaisserModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

export function EncaisserModal({ invoice, onClose, onSuccess }: EncaisserModalProps) {
  const netToPay = invoice.net_to_pay ?? invoice.total_amount;
  const remaining = netToPay - invoice.paid_amount;
  const { rate, usdToCdf } = useExchangeRate();
  const { isSimulationMode } = useRBAC();

  const [devise, setDevise] = useState<'USD' | 'CDF'>('USD');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Espèces');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const patientName = invoice.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
    : 'Patient inconnu';
  const displayNumber = invoice.invoice_number ?? invoice.draft_number ?? '—';
  const parsedAmount = parseFloat(amount);

  const amountInUSD = devise === 'USD'
    ? parsedAmount
    : (usdToCdf > 0 ? Math.round((parsedAmount / usdToCdf) * 100) / 100 : 0);

  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0
    && amountInUSD > 0 && amountInUSD <= remaining + 0.01;

  const remainingCDF = usdToCdf > 0 ? Math.round(remaining * usdToCdf) : 0;

  function fillFull() {
    if (devise === 'USD') {
      setAmount(remaining.toFixed(2));
    } else if (usdToCdf > 0) {
      setAmount(Math.round(remaining * usdToCdf).toString());
    }
  }

  async function handleSubmit() {
    if (!isValidAmount) return;
    setLoading(true);
    setError('');

    if (isSimulationMode) {
      setError('Mode simulation — aucune donnee enregistree. Desactivez la simulation pour effectuer un vrai encaissement.');
      setLoading(false);
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;
      const tauxApplique = usdToCdf || null;

      const { error: insertErr } = await supabase.from('payment_history').insert({
        invoice_id: invoice.id,
        payment_amount: parsedAmount,
        payment_method: method,
        devise_paiement: devise,
        taux_applique: tauxApplique,
        transaction_reference: reference || null,
        notes: notes || null,
        recorded_by: userId,
      });
      if (insertErr) {
        if (insertErr.code === '42501' || insertErr.message?.includes('row-level security')) {
          throw new Error('Acces refuse : votre role n\'a pas la permission d\'enregistrer des paiements. Contactez un administrateur.');
        }
        throw new Error(insertErr.message || 'Erreur lors de l\'insertion du paiement');
      }

      const newPaidUSD = invoice.paid_amount + amountInUSD;
      const newBalance = Math.max(netToPay - newPaidUSD, 0);
      const newStatus = newBalance <= 0.01 ? 'paid' : 'partial';

      const { error: updateErr, count } = await supabase
        .from('invoices')
        .update({
          paid_amount: Math.round(newPaidUSD * 100) / 100,
          balance: Math.round(newBalance * 100) / 100,
          status: newStatus,
          payment_method: method,
          payment_date: new Date().toISOString(),
          devise_paiement: devise,
          taux_change_applique: tauxApplique,
        })
        .eq('id', invoice.id)
        .select();

      if (updateErr) {
        if (updateErr.code === '42501' || updateErr.message?.includes('row-level security')) {
          throw new Error('Paiement enregistre mais la mise a jour de la facture est bloquee par les permissions. Contactez un administrateur.');
        }
        throw new Error(updateErr.message || 'Erreur lors de la mise a jour de la facture');
      }

      if (count === 0) {
        throw new Error('Paiement enregistre mais la facture n\'a pas ete mise a jour (aucune ligne modifiee). Verifiez les permissions RLS.');
      }

      try {
        await enregistrerMouvementEntree({
          montant: parsedAmount,
          devise,
          reference: `PAY-${displayNumber}`,
          motif: `Paiement facture ${displayNumber} — ${patientName}`,
        });
      } catch (caisseErr: any) {
        console.warn('Mouvement caisse non enregistre:', caisseErr.message);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'encaissement');
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Invoice summary with dual currency */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Patient</p>
                <p className="font-medium text-gray-800">{patientName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Montant total</p>
                <p className="font-bold text-gray-800">{netToPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</p>
                {usdToCdf > 0 && <p className="text-xs text-gray-400">{Math.round(netToPay * usdToCdf).toLocaleString('fr-FR')} CDF</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Deja paye</p>
                <p className="font-medium text-blue-600">{invoice.paid_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Solde restant</p>
                <p className="font-bold text-red-600">{remaining.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</p>
                {usdToCdf > 0 && <p className="text-xs text-red-400">{remainingCDF.toLocaleString('fr-FR')} CDF</p>}
              </div>
            </div>
          </div>

          {/* Exchange rate info */}
          {rate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Taux du jour : <strong>1 USD = {usdToCdf.toLocaleString('fr-FR')} CDF</strong> ({rate.rate_date})</span>
            </div>
          )}

          {!rate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-700">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Aucun taux de change configure. Definissez-en un dans la page Taux de change.</span>
            </div>
          )}

          {/* Currency selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise du paiement</label>
            <div className="grid grid-cols-2 gap-2">
              {(['USD', 'CDF'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setDevise(d); setAmount(''); }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    devise === d
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  {d === 'USD' ? 'Dollar americain (USD)' : 'Franc congolais (CDF)'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Montant a encaisser ({devise})
              </label>
              <button type="button" onClick={fillFull} className="text-xs text-green-600 hover:text-green-700 font-medium">
                Payer tout
              </button>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step={devise === 'CDF' ? '1' : '0.01'}
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-9 pr-16 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm"
                placeholder={devise === 'CDF' ? '0' : '0.00'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">{devise}</span>
            </div>

            {/* Conversion display */}
            {parsedAmount > 0 && usdToCdf > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                <ArrowRightLeft className="w-3 h-3" />
                {devise === 'USD'
                  ? <span>Equivalent: <strong>{Math.round(parsedAmount * usdToCdf).toLocaleString('fr-FR')} CDF</strong></span>
                  : <span>Equivalent: <strong>{amountInUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</strong></span>
                }
              </div>
            )}

            {amount && !isValidAmount && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {devise === 'USD'
                  ? `Le montant ne peut pas depasser ${remaining.toFixed(2)} USD`
                  : `L'equivalent USD (${amountInUSD.toFixed(2)}) depasse le solde de ${remaining.toFixed(2)} USD`
                }
              </p>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Methode de paiement</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm bg-white appearance-none"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reference transaction <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
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
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-sm resize-none"
              placeholder="Remarques sur ce paiement..."
            />
          </div>

          {/* Summary before confirm */}
          {parsedAmount > 0 && isValidAmount && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-800">
                <Info className="w-3.5 h-3.5" />
                Resume du paiement
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Montant</span>
                <span className="font-bold text-green-800">
                  {devise === 'CDF'
                    ? `${Math.round(parsedAmount).toLocaleString('fr-FR')} CDF`
                    : `${parsedAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`
                  }
                </span>
              </div>
              {devise !== 'USD' && usdToCdf > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Equivalent USD</span>
                  <span>{amountInUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</span>
                </div>
              )}
              {devise !== 'CDF' && usdToCdf > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Equivalent CDF</span>
                  <span>{Math.round(parsedAmount * usdToCdf).toLocaleString('fr-FR')} CDF</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-green-600">
                <span>Taux applique</span>
                <span>1 USD = {usdToCdf.toLocaleString('fr-FR')} CDF</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-green-200">
                <span className="text-green-700">Nouveau solde</span>
                <span className="font-bold text-green-800">
                  {Math.max(remaining - amountInUSD, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className={`flex items-start gap-2 p-3 border rounded-xl text-sm ${
              error.includes('simulation') ? 'bg-amber-50 border-amber-200 text-amber-800' :
              error.includes('permission') || error.includes('Acces refuse') ? 'bg-orange-50 border-orange-200 text-orange-800' :
              'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error.includes('simulation') ? <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
               <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
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
