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

export function CaissePaymentView() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();

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
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('booking_queue')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
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

    try {
      // Create invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .insert({
          invoice_number: `INV-${entry.ticket_number}-${Date.now()}`,
          total_amount: entry.consultation_fee,
          paid_amount: entry.consultation_fee,
          balance: 0,
          status: 'paid',
          payment_method: 'Especes',
          payment_date: new Date().toISOString(),
          notes: `Paiement consultation - ${entry.ticket_number}`,
        })
        .select('id')
        .single();

      // Update booking queue
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

      // Update appointment status
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
    const matchFilter =
      filter === 'all' || e.payment_status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = entries.filter((e) => e.payment_status === 'pending').length;
  const paidCount = entries.filter((e) => e.payment_status === 'paid').length;
  const totalRevenue = entries
    .filter((e) => e.payment_status === 'paid')
    .reduce((sum, e) => sum + Number(e.consultation_fee), 0);

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
          onClick={fetchEntries}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recettes du jour</p>
              <p className="text-3xl font-bold text-navy-800 mt-1">{totalRevenue} <span className="text-base font-medium text-gray-500">USD</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
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
                {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : 'Payes'}
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
            <p className="text-sm">Les patients enregistres apparaitront ici</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filtered.map((entry) => {
                const isPending = entry.payment_status === 'pending';
                const isProcessing = processingId === entry.id;
                const isSuccess = successId === entry.id;

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

                    {/* Amount & Action */}
                    <div className="flex items-center gap-4 sm:flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-navy-800 text-lg">
                          {entry.consultation_fee} <span className="text-xs text-gray-400">USD</span>
                        </p>
                      </div>

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
                          Paye
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
