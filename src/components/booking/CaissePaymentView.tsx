import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  User,
  DollarSign,
  MapPin,
  Video,
  RefreshCw,
  Banknote,
  Smartphone,
  Filter,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QueueEntry {
  id: string;
  ticket_number: string;
  patient_name: string;
  patient_phone: string;
  consultation_type: string;
  specialty: string;
  doctor_name: string;
  consultation_fee: number;
  payment_status: string;
  patient_status: string;
  queue_position: number;
  created_at: string;
}

interface CaisseStats {
  entreesUSD: number;
  entreesCDF: number;
  sortiesUSD: number;
  sortiesCDF: number;
}

export function CaissePaymentView() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [conventionneTotal, setConventionneTotal] = useState(0);
  const [caisseStats, setCaisseStats] = useState<CaisseStats>({ entreesUSD: 0, entreesCDF: 0, sortiesUSD: 0, sortiesCDF: 0 });
  const [selectedDevise, setSelectedDevise] = useState<Record<string, 'USD' | 'CDF'>>({});

  function getTodayLocal() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
  }

  async function fetchConventionneTotal() {
    try {
      const todayLocal = getTodayLocal();
      const { data } = await supabase
        .from('invoices')
        .select('net_to_pay, total_amount')
        .eq('type_facture', 'conventionne')
        .gte('created_at', `${todayLocal}T00:00:00`)
        .lte('created_at', `${todayLocal}T23:59:59`);

      const total = (data || []).reduce(
        (sum: number, inv: { net_to_pay?: number; total_amount?: number }) =>
          sum + Number(inv.net_to_pay || inv.total_amount || 0),
        0
      );
      setConventionneTotal(total);
    } catch (err) {
      console.error('Error fetching conventionne total:', err);
    }
  }

  async function fetchCaisseStats() {
    try {
      const todayLocal = getTodayLocal();

      const { data: paymentsData } = await supabase
        .from('payment_history')
        .select('payment_amount, devise_paiement, invoice_id')
        .gte('payment_date', `${todayLocal}T00:00:00`)
        .lte('payment_date', `${todayLocal}T23:59:59`);

      let entreesUSD = 0;
      let entreesCDF = 0;

      if (paymentsData && paymentsData.length > 0) {
        const invoiceIds = [...new Set(paymentsData.map(p => p.invoice_id).filter(Boolean))];

        let cashInvoiceIds = new Set<string>();
        if (invoiceIds.length > 0) {
          const { data: invoicesData } = await supabase
            .from('invoices')
            .select('id, type_facture')
            .in('id', invoiceIds);

          cashInvoiceIds = new Set(
            (invoicesData || [])
              .filter((inv: any) => inv.type_facture !== 'conventionne')
              .map((inv: any) => inv.id)
          );
        }

        for (const p of paymentsData) {
          if (!p.invoice_id || cashInvoiceIds.has(p.invoice_id)) {
            const amt = Number(p.payment_amount || 0);
            if (p.devise_paiement === 'CDF') {
              entreesCDF += amt;
            } else {
              entreesUSD += amt;
            }
          }
        }
      }

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', todayLocal)
        .eq('approval_status', 'approved')
        .not('numero_bon_sortie', 'is', null);

      const sortiesUSD = (expensesData || []).reduce(
        (sum: number, e: { amount: number }) => sum + Number(e.amount || 0),
        0
      );

      setCaisseStats({ entreesUSD, entreesCDF, sortiesUSD, sortiesCDF: 0 });
    } catch (err) {
      console.error('Error fetching caisse stats:', err);
    }
  }

  useEffect(() => {
    fetchEntries();
    fetchConventionneTotal();
    fetchCaisseStats();

    const channel = supabase
      .channel('caisse-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booking_queue' },
        () => fetchEntries()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchEntries() {
    try {
      const todayLocal = getTodayLocal();
      const { data, error } = await supabase
        .from('booking_queue')
        .select('*')
        .gte('created_at', `${todayLocal}T00:00:00`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidatePayment(entry: QueueEntry) {
    setProcessingId(entry.id);
    const devise = selectedDevise[entry.id] || 'USD';

    try {
      const { data: recData, error: recError } = await supabase.rpc('generate_rec_receipt_number');
      if (recError) throw recError;
      const receiptNumber: string = recData;

      const { data: invoice } = await supabase
        .from('invoices')
        .insert({
          invoice_number: `INV-${entry.ticket_number}-${Date.now()}`,
          total_amount: entry.consultation_fee,
          paid_amount: entry.consultation_fee,
          balance: 0,
          status: 'paid',
          payment_method: 'Espèces',
          payment_date: new Date().toISOString(),
          notes: `Paiement consultation - ${entry.ticket_number}`,
          numero_recu: receiptNumber,
          devise_paiement: devise,
        })
        .select('id')
        .single();

      if (invoice?.id) {
        await supabase.from('payment_history').insert({
          invoice_id: invoice.id,
          payment_amount: entry.consultation_fee,
          payment_method: 'Espèces',
          payment_date: new Date().toISOString(),
          notes: `Paiement consultation - ${entry.ticket_number}`,
          numero_recu: receiptNumber,
          devise_paiement: devise,
        });
      }

      await supabase
        .from('booking_queue')
        .update({
          payment_status: 'paid',
          patient_status: 'paid',
          invoice_id: invoice?.id || null,
          sms_payment_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id);

      const entryFull = entries.find((e) => e.id === entry.id);
      if (entryFull) {
        await supabase
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('id', (entryFull as unknown as { appointment_id?: string }).appointment_id || '');
      }

      setSuccessId(entry.id);
      setTimeout(() => setSuccessId(null), 2000);

      fetchEntries();
      fetchCaisseStats();
    } catch (err) {
      console.error('Payment validation error:', err);
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = entries.filter((e) => {
    const matchSearch =
      e.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || e.payment_status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = entries.filter((e) => e.payment_status === 'pending').length;
  const paidCount = entries.filter((e) => e.payment_status === 'paid').length;

  const soldeUSD = caisseStats.entreesUSD - caisseStats.sortiesUSD;
  const soldeCDF = caisseStats.entreesCDF - caisseStats.sortiesCDF;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-700 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            Caisse - Validation des Paiements
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Validez les paiements des patients en attente
          </p>
        </div>
        <button
          onClick={() => { fetchEntries(); fetchCaisseStats(); fetchConventionneTotal(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats Cards - Row 1: Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">En attente</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valides</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{paidCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conventionné (non encaissé)</p>
              <p className="text-3xl font-bold text-teal-700 mt-1">{conventionneTotal.toLocaleString('fr-FR')} <span className="text-base font-medium text-gray-500">USD</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reçus émis</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{paidCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Situation Caisse du Jour */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            Situation Caisse du Jour (Cash uniquement)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-gray-100">
          {/* USD Column */}
          <div className="px-6 py-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dollar (USD)</h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <ArrowDownCircle className="w-4 h-4" />
                Entrées du jour
              </span>
              <span className="font-bold text-green-700">{caisseStats.entreesUSD.toLocaleString('fr-FR')} USD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-red-600">
                <ArrowUpCircle className="w-4 h-4" />
                Sorties du jour
              </span>
              <span className="font-bold text-red-600">-{caisseStats.sortiesUSD.toLocaleString('fr-FR')} USD</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-900">Solde du jour</span>
              <span className={`text-lg font-bold ${soldeUSD >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {soldeUSD.toLocaleString('fr-FR')} USD
              </span>
            </div>
          </div>

          {/* CDF Column */}
          <div className="px-6 py-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Franc Congolais (CDF)</h3>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <ArrowDownCircle className="w-4 h-4" />
                Entrées du jour
              </span>
              <span className="font-bold text-green-700">{caisseStats.entreesCDF.toLocaleString('fr-FR')} CDF</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-red-600">
                <ArrowUpCircle className="w-4 h-4" />
                Sorties du jour
              </span>
              <span className="font-bold text-red-600">-{caisseStats.sortiesCDF.toLocaleString('fr-FR')} CDF</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-900">Solde du jour</span>
              <span className={`text-lg font-bold ${soldeCDF >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {soldeCDF.toLocaleString('fr-FR')} CDF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ticket ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-navy-800 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : 'Payés'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-medical-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucun enregistrement</p>
            <p className="text-sm">Les patients enregistrés apparaîtront ici</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filtered.map((entry) => {
                const isPending = entry.payment_status === 'pending';
                const isProcessing = processingId === entry.id;
                const isSuccess = successId === entry.id;
                const devise = selectedDevise[entry.id] || 'USD';

                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${
                      isSuccess ? 'bg-green-50' : ''
                    }`}
                  >
                    {/* Ticket */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isPending
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {entry.ticket_number}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{entry.patient_name}</p>
                          {entry.consultation_type === 'presentiel' ? (
                            <MapPin className="w-3.5 h-3.5 text-medical-500 flex-shrink-0" />
                          ) : (
                            <Video className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          Dr. {entry.doctor_name} - {entry.specialty}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            {entry.patient_phone}
                          </span>
                          <span>
                            {new Date(entry.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount, Currency & Action */}
                    <div className="flex items-center gap-3 sm:flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-navy-800 text-lg">
                          {entry.consultation_fee} <span className="text-xs text-gray-400">USD</span>
                        </p>
                      </div>

                      {isPending && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDevise(prev => ({ ...prev, [entry.id]: 'USD' }))}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              devise === 'USD'
                                ? 'border-green-500 bg-green-50 text-green-800'
                                : 'border-gray-200 text-gray-400 hover:border-gray-300'
                            }`}
                          >
                            USD
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDevise(prev => ({ ...prev, [entry.id]: 'CDF' }))}
                            className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              devise === 'CDF'
                                ? 'border-blue-500 bg-blue-50 text-blue-800'
                                : 'border-gray-200 text-gray-400 hover:border-gray-300'
                            }`}
                          >
                            CDF
                          </button>
                        </div>
                      )}

                      {isPending ? (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleValidatePayment(entry)}
                          disabled={isProcessing}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm hover:shadow-lg transition-shadow disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
                        >
                          {isProcessing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Valider
                        </motion.button>
                      ) : (
                        <div className="px-4 py-2.5 rounded-xl bg-green-100 text-green-700 font-semibold text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Payé
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
