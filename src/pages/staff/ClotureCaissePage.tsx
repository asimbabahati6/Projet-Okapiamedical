import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Calculator,
  AlertTriangle,
  CheckCircle,
  ArrowRightLeft,
  RefreshCw,
  DollarSign,
  Banknote,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  getSoldeJourAuxiliaire,
  effectuerTransfertVersPermanente,
  enregistrerEcart,
} from '../../services/caisseService';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';

interface MouvementSummary {
  entreesUSD: number;
  entreesCDF: number;
  sortiesUSD: number;
  sortiesCDF: number;
}

export default function ClotureCaissePage() {
  const { canAccessCashRegister, isCaissiere, isDirecteurGeneral } = useFinancialPermissions();

  const [loading, setLoading] = useState(true);
  const [soldeLogiciel, setSoldeLogiciel] = useState({ usd: 0, cdf: 0 });
  const [mouvements, setMouvements] = useState<MouvementSummary>({ entreesUSD: 0, entreesCDF: 0, sortiesUSD: 0, sortiesCDF: 0 });
  const [soldePhysiqueUSD, setSoldePhysiqueUSD] = useState('');
  const [soldePhysiqueCDF, setSoldePhysiqueCDF] = useState('');
  const [motifEcart, setMotifEcart] = useState('');
  const [processing, setProcessing] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ecartDeclared, setEcartDeclared] = useState(false);
  const [transferred, setTransferred] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const solde = await getSoldeJourAuxiliaire(today);
      setSoldeLogiciel(solde);

      const { data: caisse } = await supabase
        .from('caisses')
        .select('id')
        .eq('type', 'auxiliaire')
        .maybeSingle();

      if (caisse) {
        const { data: mvts } = await supabase
          .from('mouvements_caisse')
          .select('type, montant, devise')
          .eq('caisse_id', caisse.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        const summary: MouvementSummary = { entreesUSD: 0, entreesCDF: 0, sortiesUSD: 0, sortiesCDF: 0 };
        for (const m of mvts || []) {
          const amt = Number(m.montant);
          const isEntree = m.type === 'entree' || m.type === 'transfert_entrant';
          const isSortie = m.type === 'sortie' || m.type === 'transfert_sortant';
          if (m.devise === 'CDF') {
            if (isEntree) summary.entreesCDF += amt;
            if (isSortie) summary.sortiesCDF += amt;
          } else {
            if (isEntree) summary.entreesUSD += amt;
            if (isSortie) summary.sortiesUSD += amt;
          }
        }
        setMouvements(summary);
      }

      const { data: existingTransfer } = await supabase
        .from('mouvements_caisse')
        .select('id')
        .eq('type', 'transfert_sortant')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .limit(1);

      if (existingTransfer && existingTransfer.length > 0) setTransferred(true);

      const { data: existingEcart } = await supabase
        .from('ecarts_caisse')
        .select('id')
        .eq('date_cloture', today)
        .limit(1);

      if (existingEcart && existingEcart.length > 0) setEcartDeclared(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const physUSD = parseFloat(soldePhysiqueUSD) || 0;
  const physCDF = parseFloat(soldePhysiqueCDF) || 0;
  const ecartUSD = physUSD - soldeLogiciel.usd;
  const ecartCDF = physCDF - soldeLogiciel.cdf;
  const hasEcart = Math.abs(ecartUSD) > 0.01 || Math.abs(ecartCDF) > 0.01;
  const physiqueSaisi = soldePhysiqueUSD !== '' || soldePhysiqueCDF !== '';

  async function handleDeclareEcart() {
    if (hasEcart && !motifEcart.trim()) {
      setError('Justification obligatoire en cas d\'ecart.');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      await enregistrerEcart({
        montantTheorique: soldeLogiciel.usd + soldeLogiciel.cdf,
        montantPhysique: physUSD + physCDF,
        motif: motifEcart || 'Aucun ecart - cloture conforme',
      });

      if (hasEcart) {
        try {
          const { data: adminUsers } = await supabase
            .from('user_profiles')
            .select('id')
            .in('role', ['super_admin', 'hospital_admin', 'directeur_general', 'accountant']);

          if (adminUsers && adminUsers.length > 0) {
            const notifications = adminUsers.map(u => ({
              user_id: u.id,
              title: 'Ecart de caisse declare',
              message: `Ecart USD: ${ecartUSD.toFixed(2)} | CDF: ${ecartCDF.toFixed(2)} — Motif: ${motifEcart}`,
              type: 'warning',
              priority: 'high',
            }));
            await supabase.from('notifications').insert(notifications);
          }
        } catch (_) { /* notification non bloquante */ }
      }

      setEcartDeclared(true);
      setSuccess('Cloture enregistree avec succes.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la cloture');
    } finally {
      setProcessing(false);
    }
  }

  async function handleTransfert() {
    setTransferring(true);
    setError('');
    try {
      await effectuerTransfertVersPermanente({
        montantUSD: soldeLogiciel.usd > 0 ? soldeLogiciel.usd : 0,
        montantCDF: soldeLogiciel.cdf > 0 ? soldeLogiciel.cdf : 0,
      });
      setTransferred(true);
      setSuccess('Virement vers la caisse permanente effectue. La caisse auxiliaire est remise a zero.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du virement');
    } finally {
      setTransferring(false);
    }
  }

  if (!canAccessCashRegister) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
          <p className="text-sm text-gray-400">Cette page est reservee a la caissiere et la direction.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            Cloture de Caisse
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Journee du {new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Solde logiciel du jour */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            Solde logiciel du jour (Caisse auxiliaire)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* USD */}
          <div className="px-6 py-5 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              Dollar (USD)
            </h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <ArrowDownCircle className="w-4 h-4" /> Entrees
              </span>
              <span className="font-bold text-green-700">{mouvements.entreesUSD.toLocaleString('fr-FR')} USD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-red-600">
                <ArrowUpCircle className="w-4 h-4" /> Sorties
              </span>
              <span className="font-bold text-red-600">-{mouvements.sortiesUSD.toLocaleString('fr-FR')} USD</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-900">Solde logiciel</span>
              <span className={`text-xl font-bold ${soldeLogiciel.usd >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {soldeLogiciel.usd.toLocaleString('fr-FR')} USD
              </span>
            </div>
          </div>
          {/* CDF */}
          <div className="px-6 py-5 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5" />
              Franc Congolais (CDF)
            </h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <ArrowDownCircle className="w-4 h-4" /> Entrees
              </span>
              <span className="font-bold text-green-700">{mouvements.entreesCDF.toLocaleString('fr-FR')} CDF</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-red-600">
                <ArrowUpCircle className="w-4 h-4" /> Sorties
              </span>
              <span className="font-bold text-red-600">-{mouvements.sortiesCDF.toLocaleString('fr-FR')} CDF</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-900">Solde logiciel</span>
              <span className={`text-xl font-bold ${soldeLogiciel.cdf >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {soldeLogiciel.cdf.toLocaleString('fr-FR')} CDF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comptage physique */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          Comptage physique
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Solde physique USD</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={soldePhysiqueUSD}
                onChange={e => setSoldePhysiqueUSD(e.target.value)}
                disabled={ecartDeclared}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
            {physiqueSaisi && (
              <div className={`mt-2 text-sm font-semibold ${Math.abs(ecartUSD) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                Ecart USD : {ecartUSD >= 0 ? '+' : ''}{ecartUSD.toFixed(2)}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Solde physique CDF</label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="1"
                min="0"
                value={soldePhysiqueCDF}
                onChange={e => setSoldePhysiqueCDF(e.target.value)}
                disabled={ecartDeclared}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
            {physiqueSaisi && (
              <div className={`mt-2 text-sm font-semibold ${Math.abs(ecartCDF) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                Ecart CDF : {ecartCDF >= 0 ? '+' : ''}{ecartCDF.toFixed(0)}
              </div>
            )}
          </div>
        </div>

        {/* Motif ecart */}
        {physiqueSaisi && hasEcart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5"
          >
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                Ecart detecte - Justification obligatoire
              </div>
              <p className="text-xs text-amber-700">
                Un ecart a ete detecte entre le solde logiciel et le solde physique. Veuillez fournir une justification avant de valider la cloture.
              </p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif de l'ecart *</label>
            <textarea
              value={motifEcart}
              onChange={e => setMotifEcart(e.target.value)}
              disabled={ecartDeclared}
              placeholder="Expliquez la raison de l'ecart constate..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 resize-none"
            />
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {!ecartDeclared ? (
            <button
              onClick={handleDeclareEcart}
              disabled={processing || !physiqueSaisi || (hasEcart && !motifEcart.trim())}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Valider la cloture
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-xl font-semibold">
              <CheckCircle className="w-5 h-5" />
              Cloture validee
            </div>
          )}
        </div>
      </div>

      {/* Virement vers caisse permanente */}
      {ecartDeclared && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            Virement vers la Caisse Permanente
          </h2>

          {transferred ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Virement effectue</p>
                <p className="text-sm text-green-700">
                  Le solde a ete transfere vers la caisse permanente. La caisse auxiliaire demarre a zero demain.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Ce virement transferera le solde total de la caisse auxiliaire vers la caisse permanente :
                </p>
                <div className="flex gap-6 mt-2">
                  {soldeLogiciel.usd > 0 && (
                    <span className="font-bold text-blue-700">{soldeLogiciel.usd.toLocaleString('fr-FR')} USD</span>
                  )}
                  {soldeLogiciel.cdf > 0 && (
                    <span className="font-bold text-blue-700">{soldeLogiciel.cdf.toLocaleString('fr-FR')} CDF</span>
                  )}
                  {soldeLogiciel.usd <= 0 && soldeLogiciel.cdf <= 0 && (
                    <span className="text-gray-500 italic">Aucun solde a transferer</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleTransfert}
                disabled={transferring || (soldeLogiciel.usd <= 0 && soldeLogiciel.cdf <= 0)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {transferring ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRightLeft className="w-5 h-5" />
                )}
                Virer vers la caisse permanente
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
