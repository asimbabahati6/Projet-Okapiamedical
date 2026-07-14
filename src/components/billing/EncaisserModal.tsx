import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  ArrowRightLeft,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Receipt,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { enregistrerMouvementEntree } from '../../services/caisseService';

/* ─── Types ──────────────────────────────────────────────────────── */

interface PaymentLine {
  id: string;
  amount: string;
  currency: 'USD' | 'CDF';
  method: string;
  notes: string;
}

interface EncaisserModalProps {
  invoice: any;
  onClose: () => void;
  onSuccess: () => void;
}

/* ─── Constants ──────────────────────────────────────────────────── */

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'check', label: 'Chèque' },
];

/* ─── Helpers ────────────────────────────────────────────────────── */

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

function fmtUSD(n: number): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtCDF(n: number): string {
  return Math.round(n).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function emptyLine(): PaymentLine {
  return { id: uid(), amount: '', currency: 'USD', method: 'cash', notes: '' };
}

/* ─── Component ──────────────────────────────────────────────────── */

export function EncaisserModal({ invoice, onClose, onSuccess }: EncaisserModalProps) {
  const [lines, setLines] = useState<PaymentLine[]>([emptyLine()]);
  const [rate, setRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [receiptNumbers, setReceiptNumbers] = useState<string[]>([]);

  /* ── Fetch active exchange rate ──────────────────────────────── */

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('exchange_rates')
          .select('usd_to_cdf')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (err) throw err;
        if (!data) throw new Error('Aucun taux de change actif trouvé.');
        setRate(Number(data.usd_to_cdf));
      } catch (e: any) {
        setError(e.message || 'Impossible de charger le taux de change.');
      } finally {
        setLoadingRate(false);
      }
    })();
  }, []);

  /* ── Derived values ─────────────────────────────────────────── */

  const balance = Number(invoice.balance ?? 0);
  const totalAmount = Number(invoice.total_amount ?? 0);
  const paidAmount = Number(invoice.paid_amount ?? 0);
  const patientName = invoice.patient
    ? `${invoice.patient.first_name ?? ''} ${invoice.patient.last_name ?? ''}`.trim()
    : 'Patient inconnu';

  const toUSD = useCallback(
    (amount: number, currency: 'USD' | 'CDF') => {
      if (currency === 'USD') return amount;
      if (!rate || rate === 0) return 0;
      return amount / rate;
    },
    [rate],
  );

  const toCDF = useCallback(
    (amount: number, currency: 'USD' | 'CDF') => {
      if (currency === 'CDF') return amount;
      if (!rate) return 0;
      return amount * rate;
    },
    [rate],
  );

  const totalPaymentUSD = lines.reduce((sum, line) => {
    const amt = parseFloat(line.amount) || 0;
    return sum + toUSD(amt, line.currency);
  }, 0);

  const isOverpaying = totalPaymentUSD > balance + 0.005;
  const hasValidLines = lines.some((l) => (parseFloat(l.amount) || 0) > 0);

  /* ── Line management ────────────────────────────────────────── */

  function updateLine(id: string, patch: Partial<PaymentLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  /* ── Submit ─────────────────────────────────────────────────── */

  async function handleSubmit() {
    if (!rate) {
      setError('Taux de change non disponible.');
      return;
    }

    const validLines = lines.filter((l) => (parseFloat(l.amount) || 0) > 0);
    if (validLines.length === 0) {
      setError('Veuillez saisir au moins un montant.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      /* current user */
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      const receipts: string[] = [];

      for (const line of validLines) {
        const amount = parseFloat(line.amount);

        /* receipt number from sequence */
        const { data: seqData, error: seqErr } = await supabase.rpc('nextval_receipt', {});
        let receiptNum: string;

        if (seqErr || !seqData) {
          /* Fallback: use raw SQL if the RPC doesn't exist */
          const { data: rawSeq, error: rawErr } = await supabase
            .from('payment_history')
            .select('numero_recu')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (rawErr) {
            /* Last resort: generate from timestamp */
            receiptNum = `RC-${Date.now()}`;
          } else {
            const { data: nextSeq } = await (supabase as any).rpc('exec_sql', {
              sql: "SELECT nextval('receipt_number_seq')",
            }).catch(() => ({ data: null }));

            if (nextSeq && Array.isArray(nextSeq) && nextSeq[0]?.nextval) {
              receiptNum = `RC-${String(nextSeq[0].nextval).padStart(6, '0')}`;
            } else {
              receiptNum = `RC-${Date.now()}-${uid()}`;
            }
          }
        } else {
          const seqVal = typeof seqData === 'object' && seqData !== null
            ? (seqData as any).nextval ?? seqData
            : seqData;
          receiptNum = `RC-${String(seqVal).padStart(6, '0')}`;
        }

        receipts.push(receiptNum);

        /* payment_amount stored in the line's own currency */
        const { error: insertErr } = await supabase.from('payment_history').insert({
          invoice_id: invoice.id,
          payment_amount: amount,
          payment_method: line.method,
          payment_date: new Date().toISOString(),
          devise_paiement: line.currency,
          taux_applique: rate,
          numero_recu: receiptNum,
          recorded_by: userId,
          notes: line.notes || null,
          transaction_reference: `PAY-${invoice.invoice_number ?? invoice.id}-${receiptNum}`,
        });

        if (insertErr) throw insertErr;

        /* Mouvement de caisse */
        const amountForCaisse = line.currency === 'CDF' ? Math.round(amount) : amount;
        await enregistrerMouvementEntree({
          montant: amountForCaisse,
          devise: line.currency,
          reference: receiptNum,
          motif: `Paiement facture ${invoice.invoice_number ?? invoice.id} – ${patientName}`,
        });
      }

      /* Compute new paid total (always in USD) */
      const newPaidAmount = paidAmount + totalPaymentUSD;
      const newBalance = Math.max(0, totalAmount - newPaidAmount);
      const newStatus = newBalance <= 0.005 ? 'paid' : 'partial';
      const lastCurrency = validLines[validLines.length - 1].currency;

      const { error: updErr } = await supabase
        .from('invoices')
        .update({
          paid_amount: Math.round(newPaidAmount * 100) / 100,
          balance: Math.round(newBalance * 100) / 100,
          status: newStatus,
          payment_date: new Date().toISOString(),
          devise_paiement: lastCurrency,
        })
        .eq('id', invoice.id);

      if (updErr) throw updErr;

      setReceiptNumbers(receipts);
      setSuccess(true);
    } catch (e: any) {
      console.error('Encaisser error:', e);
      setError(e.message || 'Une erreur est survenue lors de l\'encaissement.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success view ───────────────────────────────────────────── */

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in">
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Paiement enregistré</h3>
            <p className="text-gray-600 mb-4">
              {receiptNumbers.length === 1
                ? `Reçu n° ${receiptNumbers[0]}`
                : `Reçus : ${receiptNumbers.join(', ')}`}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Montant total encaissé :{' '}
              <span className="font-semibold text-gray-900">{fmtUSD(totalPaymentUSD)} USD</span>
            </p>
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────── */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Encaisser un paiement</h2>
              <p className="text-sm text-gray-500">
                Facture {invoice.invoice_number ?? 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invoice summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Résumé de la facture
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Patient</span>
                <p className="font-medium text-gray-900">{patientName}</p>
              </div>
              <div>
                <span className="text-gray-500">N° facture</span>
                <p className="font-medium text-gray-900">
                  {invoice.invoice_number ?? 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Montant total</span>
                <p className="font-medium text-gray-900">{fmtUSD(totalAmount)} USD</p>
              </div>
              <div>
                <span className="text-gray-500">Déjà payé</span>
                <p className="font-medium text-gray-900">{fmtUSD(paidAmount)} USD</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Solde restant</span>
              <span className="text-lg font-bold text-emerald-700">{fmtUSD(balance)} USD</span>
            </div>
            {rate && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <ArrowRightLeft className="w-3 h-3" />
                <span>
                  Taux actif : 1 USD = {fmtCDF(rate)} CDF
                </span>
              </div>
            )}
          </div>

          {/* Loading rate */}
          {loadingRate && (
            <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Chargement du taux de change…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment lines */}
          {!loadingRate && rate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Lignes de paiement
                </h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une ligne
                </button>
              </div>

              {lines.map((line, idx) => {
                const amt = parseFloat(line.amount) || 0;
                const equivalentUSD =
                  line.currency === 'CDF' ? toUSD(amt, 'CDF') : amt;
                const equivalentCDF =
                  line.currency === 'USD' ? toCDF(amt, 'USD') : amt;

                return (
                  <div
                    key={line.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        Paiement {idx + 1}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      {/* Amount */}
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Montant
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            step={line.currency === 'CDF' ? '1' : '0.01'}
                            value={line.amount}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (line.currency === 'CDF' && val.includes('.')) {
                                val = String(Math.round(parseFloat(val) || 0));
                              }
                              updateLine(line.id, { amount: val });
                            }}
                            placeholder="0"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Currency */}
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Devise
                        </label>
                        <select
                          value={line.currency}
                          onChange={(e) => {
                            const newCurrency = e.target.value as 'USD' | 'CDF';
                            const currentAmt = parseFloat(line.amount) || 0;
                            let newAmount = line.amount;
                            if (newCurrency === 'CDF' && currentAmt > 0 && line.currency === 'USD') {
                              newAmount = String(Math.round(currentAmt * rate));
                            } else if (newCurrency === 'USD' && currentAmt > 0 && line.currency === 'CDF') {
                              newAmount = (currentAmt / rate).toFixed(2);
                            }
                            updateLine(line.id, { currency: newCurrency, amount: newAmount });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                          <option value="USD">USD</option>
                          <option value="CDF">CDF</option>
                        </select>
                      </div>

                      {/* Method */}
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Mode de paiement
                        </label>
                        <select
                          value={line.method}
                          onChange={(e) => updateLine(line.id, { method: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Conversion info */}
                    {amt > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <ArrowRightLeft className="w-3 h-3" />
                        {line.currency === 'USD' ? (
                          <span>≈ {fmtCDF(equivalentCDF)} CDF</span>
                        ) : (
                          <span>≈ {fmtUSD(equivalentUSD)} USD</span>
                        )}
                      </div>
                    )}

                    {/* Notes (optional) */}
                    <div>
                      <input
                        type="text"
                        value={line.notes}
                        onChange={(e) => updateLine(line.id, { notes: e.target.value })}
                        placeholder="Notes (facultatif)"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Payment total & warnings ──────────────────────── */}
          {!loadingRate && rate && hasValidLines && (
            <div className="space-y-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-emerald-800">
                    Total à encaisser
                  </span>
                  <span className="text-lg font-bold text-emerald-700">
                    {fmtUSD(totalPaymentUSD)} USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-600">
                  <span>Solde restant après paiement</span>
                  <span className="font-medium">
                    {fmtUSD(Math.max(0, balance - totalPaymentUSD))} USD
                  </span>
                </div>
              </div>

              {isOverpaying && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Le montant total ({fmtUSD(totalPaymentUSD)} USD) dépasse le solde restant (
                    {fmtUSD(balance)} USD). Un trop-perçu de{' '}
                    <strong>{fmtUSD(totalPaymentUSD - balance)} USD</strong> sera enregistré.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !hasValidLines || loadingRate || !rate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Confirmer le paiement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
