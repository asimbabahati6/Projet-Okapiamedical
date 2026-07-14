import { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  ArrowRightLeft,
  Calculator,
  DollarSign,
  Banknote,
  Check,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Clock,
  Hash,
} from 'lucide-react';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import {
  getCaisseByType,
  getSoldeJourAuxiliaire,
  effectuerTransfertVersPermanente,
  enregistrerEcart,
  type CaisseInfo,
} from '../../services/caisseService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface ClosureHistoryItem {
  id: string;
  montant: number;
  devise: string;
  reference: string;
  motif: string;
  created_at: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

function fmtCurrency(val: number, devise: string): string {
  return `${val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${devise}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ClotureCaissePage() {
  const { canCloseCashRegister } = useFinancialPermissions();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  // Data
  const [_caisse, setCaisse] = useState<CaisseInfo | null>(null);
  const [soldeUSD, setSoldeUSD] = useState(0);
  const [soldeCDF, setSoldeCDF] = useState(0);
  const [mouvementsCount, setMouvementsCount] = useState(0);
  const [history, setHistory] = useState<ClosureHistoryItem[]>([]);

  // Form
  const [physiqueUSD, setPhysiqueUSD] = useState('');
  const [physiqueCDF, setPhysiqueCDF] = useState('');
  const [justification, setJustification] = useState('');

  const ecartUSD = parseFloat(physiqueUSD || '0') - soldeUSD;
  const ecartCDF = parseFloat(physiqueCDF || '0') - soldeCDF;
  const hasEcart = Math.abs(ecartUSD) > 0.001 || Math.abs(ecartCDF) > 0.001;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getCaisseByType('auxiliaire');
      setCaisse(c);
      if (!c) return;

      const solde = await getSoldeJourAuxiliaire(TODAY);
      setSoldeUSD(solde.usd);
      setSoldeCDF(solde.cdf);

      // Count today's movements
      const { data: mvts } = await supabase
        .from('mouvements_caisse')
        .select('id', { count: 'exact' })
        .eq('caisse_id', c.id)
        .gte('created_at', `${TODAY}T00:00:00`)
        .lte('created_at', `${TODAY}T23:59:59`);
      setMouvementsCount(mvts?.length ?? 0);

      // Recent closure history (last 10 transfert_sortant)
      const { data: hist } = await supabase
        .from('mouvements_caisse')
        .select('id, montant, devise, reference, motif, created_at')
        .eq('caisse_id', c.id)
        .eq('type', 'transfert_sortant')
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory(hist || []);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du chargement des donnees', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (canCloseCashRegister) loadData();
  }, [canCloseCashRegister, loadData]);

  async function handleSubmit() {
    if (hasEcart && !justification.trim()) {
      showToast('Veuillez justifier les ecarts constates', 'error');
      return;
    }
    setSubmitting(true);
    try {
      // Step 1: Record any discrepancy
      if (hasEcart) {
        if (Math.abs(ecartUSD) > 0.001) {
          await enregistrerEcart({
            montantTheorique: soldeUSD,
            montantPhysique: parseFloat(physiqueUSD || '0'),
            motif: `[USD] ${justification}`,
          });
        }
        if (Math.abs(ecartCDF) > 0.001) {
          await enregistrerEcart({
            montantTheorique: soldeCDF,
            montantPhysique: parseFloat(physiqueCDF || '0'),
            motif: `[CDF] ${justification}`,
          });
        }
      }

      // Step 2: Transfer to permanent cash register
      await effectuerTransfertVersPermanente({
        montantUSD: soldeUSD > 0 ? soldeUSD : 0,
        montantCDF: soldeCDF > 0 ? soldeCDF : 0,
      });

      setDone(true);
      showToast('Cloture de caisse effectuee avec succes', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la cloture', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep(1);
    setDone(false);
    setPhysiqueUSD('');
    setPhysiqueCDF('');
    setJustification('');
    loadData();
  }

  function ecartColor(val: number): string {
    if (Math.abs(val) < 0.001) return 'text-green-600';
    return val < 0 ? 'text-red-600' : 'text-orange-600';
  }

  function ecartBg(val: number): string {
    if (Math.abs(val) < 0.001) return 'bg-green-50 border-green-200';
    return val < 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200';
  }

  // ── Access denied ───────────────────────────────────────────────
  if (!canCloseCashRegister) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
          <p className="text-sm text-gray-400 mt-1">
            Vous n'avez pas les permissions pour effectuer la cloture de caisse.
          </p>
        </div>
      </div>
    );
  }

  // ── Success screen ──────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cloture effectuee</h2>
          <p className="text-gray-500 text-sm mb-6">
            Les fonds ont ete transferes vers la caisse permanente.
            {hasEcart && ' Les ecarts ont ete enregistres.'}
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Transfert USD</span>
              <span className="font-semibold text-gray-900">{fmtCurrency(soldeUSD > 0 ? soldeUSD : 0, 'USD')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transfert CDF</span>
              <span className="font-semibold text-gray-900">{fmtCurrency(soldeCDF > 0 ? soldeCDF : 0, 'CDF')}</span>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            Cloture de Caisse
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Fermeture journaliere de la caisse auxiliaire &mdash; {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solde theorique USD</p>
              <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate">
                {loading ? '...' : soldeUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                <span className="text-sm font-semibold text-gray-500 ml-1">USD</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solde theorique CDF</p>
              <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate">
                {loading ? '...' : soldeCDF.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                <span className="text-sm font-semibold text-gray-500 ml-1">CDF</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
              <Banknote className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mouvements du jour</p>
              <p className="text-2xl font-bold text-gray-900 mt-1.5">
                {loading ? '...' : mouvementsCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { n: 1, label: 'Comptage physique' },
            { n: 2, label: 'Verification des ecarts' },
            { n: 3, label: 'Confirmation du transfert' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                step === s.n
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  : step > s.n
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-50 text-gray-400'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.n
                    ? 'bg-red-600 text-white'
                    : step > s.n
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.n ? <Check className="w-3 h-3" /> : s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ── Step 1: Physical count ── */}
            {step === 1 && (
              <div className="max-w-lg mx-auto space-y-5">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Comptage physique</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Saisissez le montant physique present dans la caisse
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Montant physique USD
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={physiqueUSD}
                      onChange={e => setPhysiqueUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-16 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">USD</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Montant physique CDF
                  </label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={physiqueCDF}
                      onChange={e => setPhysiqueCDF(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-16 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">CDF</span>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      if (!physiqueUSD && !physiqueCDF) {
                        showToast('Veuillez saisir au moins un montant', 'error');
                        return;
                      }
                      setStep(2);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Review ecarts ── */}
            {step === 2 && (
              <div className="max-w-lg mx-auto space-y-5">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Verification des ecarts</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Comparaison entre le solde theorique et le comptage physique
                  </p>
                </div>

                {/* Ecart USD */}
                <div className={`rounded-xl border p-4 ${ecartBg(ecartUSD)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Ecart USD</span>
                    <span className={`text-lg font-bold tabular-nums ${ecartColor(ecartUSD)}`}>
                      {ecartUSD > 0 ? '+' : ''}{fmtCurrency(ecartUSD, 'USD')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>
                      <span className="block text-gray-400">Theorique</span>
                      <span className="font-semibold text-gray-700">{fmtCurrency(soldeUSD, 'USD')}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-gray-400">Physique</span>
                      <span className="font-semibold text-gray-700">{fmtCurrency(parseFloat(physiqueUSD || '0'), 'USD')}</span>
                    </div>
                  </div>
                </div>

                {/* Ecart CDF */}
                <div className={`rounded-xl border p-4 ${ecartBg(ecartCDF)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Ecart CDF</span>
                    <span className={`text-lg font-bold tabular-nums ${ecartColor(ecartCDF)}`}>
                      {ecartCDF > 0 ? '+' : ''}{fmtCurrency(ecartCDF, 'CDF')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>
                      <span className="block text-gray-400">Theorique</span>
                      <span className="font-semibold text-gray-700">{fmtCurrency(soldeCDF, 'CDF')}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-gray-400">Physique</span>
                      <span className="font-semibold text-gray-700">{fmtCurrency(parseFloat(physiqueCDF || '0'), 'CDF')}</span>
                    </div>
                  </div>
                </div>

                {/* Justification (required when ecart) */}
                {hasEcart && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Justification de l'ecart <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={justification}
                      onChange={e => setJustification(e.target.value)}
                      placeholder="Expliquez la raison de l'ecart constate..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none transition-all"
                    />
                  </div>
                )}

                {!hasEcart && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    Aucun ecart constate. Vous pouvez proceder au transfert.
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      if (hasEcart && !justification.trim()) {
                        showToast('La justification est obligatoire en cas d\'ecart', 'error');
                        return;
                      }
                      setStep(3);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm transfer ── */}
            {step === 3 && (
              <div className="max-w-lg mx-auto space-y-5">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
                    <ArrowRightLeft className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Confirmer le transfert</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Les fonds seront transferes vers la caisse permanente
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Montant a transferer (USD)</span>
                    <span className="font-bold text-gray-900">{fmtCurrency(soldeUSD > 0 ? soldeUSD : 0, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Montant a transferer (CDF)</span>
                    <span className="font-bold text-gray-900">{fmtCurrency(soldeCDF > 0 ? soldeCDF : 0, 'CDF')}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm">
                    <span className="text-gray-500">Ecart USD</span>
                    <span className={`font-semibold ${ecartColor(ecartUSD)}`}>
                      {ecartUSD > 0 ? '+' : ''}{fmtCurrency(ecartUSD, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Ecart CDF</span>
                    <span className={`font-semibold ${ecartColor(ecartCDF)}`}>
                      {ecartCDF > 0 ? '+' : ''}{fmtCurrency(ecartCDF, 'CDF')}
                    </span>
                  </div>
                  {hasEcart && (
                    <div className="border-t border-gray-200 pt-3">
                      <span className="text-xs text-gray-400 block mb-1">Justification</span>
                      <p className="text-sm text-gray-700">{justification}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Cette action est irreversible. Verifiez les montants avant de confirmer.</span>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Confirmer la cloture
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Closure History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Historique des clotures recentes
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Aucune cloture enregistree</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-left">Devise</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-gray-700">{fmtDate(h.created_at)}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{fmtTime(h.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                      {Number(h.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        h.devise === 'USD' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {h.devise}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{h.reference || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[240px] truncate" title={h.motif || '-'}>
                      {h.motif || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
