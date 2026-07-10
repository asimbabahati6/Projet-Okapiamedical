import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Clock,
  User,
  DollarSign,
  Search,
  RefreshCw,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Lock,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types/database';
import { useFinancialPermissions } from '../../hooks/useFinancialPermissions';
import { usePendingInvoices } from '../../contexts/PendingInvoicesContext';
import { EncaisserModal } from '../../components/billing/EncaisserModal';

interface QueueInvoice extends Invoice {
  patient?: { first_name: string; last_name: string; phone?: string; patient_number?: string } | null;
  items_summary?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'a l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h${mins % 60 > 0 ? String(mins % 60).padStart(2, '0') : ''}`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

const SOUND_PREF_KEY = 'okapia_caisse_sound_enabled';

export default function FileEncaissementPage() {
  const { canViewEncaissementQueue, canEncaisser } = useFinancialPermissions();
  const { refresh: refreshCount } = usePendingInvoices();

  const [invoices, setInvoices] = useState<QueueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<QueueInvoice | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored !== 'false';
  });
  const [, setTick] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / ctx.sampleRate;
        d[i] = Math.sin(2 * Math.PI * 600 * t) * 0.3 * Math.max(0, 1 - t / 0.3);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g);
      g.connect(ctx.destination);
      audioRef.current = null;
      (audioRef as any)._ctx = ctx;
      (audioRef as any)._buf = buf;
    } catch (_) {}
  }, []);

  function playNotificationSound() {
    if (!soundEnabled) return;
    try {
      const ctx = (audioRef as any)._ctx as AudioContext;
      const buf = (audioRef as any)._buf as AudioBuffer;
      if (!ctx || !buf) return;
      if (ctx.state === 'suspended') ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = 0.4;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (_) {}
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_PREF_KEY, String(next));
  }

  const fetchInvoices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patient:patients(first_name, last_name, phone, patient_number)')
        .in('status', ['pending', 'partial'])
        .or('type_facture.eq.cash,type_facture.is.null')
        .gt('balance', 0)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rows = (data || []) as QueueInvoice[];

      if (rows.length > 0) {
        const invoiceIds = rows.map(r => r.id);
        const { data: itemsData } = await supabase
          .from('invoice_items')
          .select('invoice_id, description')
          .in('invoice_id', invoiceIds);

        if (itemsData) {
          const summaryMap: Record<string, string> = {};
          for (const it of itemsData) {
            const key = it.invoice_id as string;
            if (!summaryMap[key]) summaryMap[key] = it.description;
            else summaryMap[key] += ', ' + it.description;
          }
          for (const row of rows) {
            row.items_summary = summaryMap[row.id] || '';
          }
        }
      }

      const newIds = new Set(rows.map(r => r.id));
      for (const row of rows) {
        if (!prevIdsRef.current.has(row.id) && prevIdsRef.current.size > 0) {
          const patName = row.patient
            ? `${row.patient.first_name} ${row.patient.last_name}`
            : 'Patient';
          setToastMsg(`Nouvelle facture — ${patName}`);
          playNotificationSound();
          setTimeout(() => setToastMsg(null), 5000);
          break;
        }
      }
      prevIdsRef.current = newIds;

      setInvoices(rows);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchInvoices();

    const channel = supabase
      .channel('file-encaissement-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices();
      })
      .subscribe();

    const fallback = setInterval(fetchInvoices, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  }, [fetchInvoices]);

  useEffect(() => {
    const ticker = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(ticker);
  }, []);

  function handleEncaisserSuccess() {
    setSelectedInvoice(null);
    fetchInvoices();
    refreshCount();
  }

  const filtered = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const patName = inv.patient
      ? `${inv.patient.first_name} ${inv.patient.last_name}`.toLowerCase()
      : '';
    const num = (inv.invoice_number || '').toLowerCase();
    return patName.includes(term) || num.includes(term);
  });

  if (!canViewEncaissementQueue) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Acces restreint</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -30, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[100] bg-blue-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3"
          >
            <BellRing className="w-5 h-5 animate-bounce" />
            <span className="font-medium text-sm">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            File d'Encaissement
            {invoices.length > 0 && (
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                {invoices.length}
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Factures cash en attente de paiement — mise a jour en temps reel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            title={soundEnabled ? 'Son active' : 'Son desactive'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={fetchInvoices}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou n de facture..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
        />
      </div>

      {/* Queue */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Receipt className="w-14 h-14 mx-auto mb-4 opacity-40" />
            <p className="font-semibold text-lg text-gray-500">Aucune facture en attente</p>
            <p className="text-sm mt-1">Les nouvelles factures cash apparaitront ici automatiquement</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filtered.map(inv => {
                const patName = inv.patient
                  ? `${inv.patient.last_name} ${inv.patient.first_name}`
                  : 'Patient inconnu';
                const isPartial = inv.status === 'partial';
                const netToPay = (inv as any).net_to_pay ?? inv.total_amount;
                const displayNum = inv.invoice_number || (inv as any).draft_number || '-';

                return (
                  <motion.div
                    key={inv.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    onClick={() => canEncaisser ? setSelectedInvoice(inv) : null}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                      canEncaisser ? 'cursor-pointer hover:bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Time indicator */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                        isPartial ? 'bg-amber-100' : 'bg-blue-100'
                      }`}>
                        <Clock className={`w-5 h-5 ${isPartial ? 'text-amber-600' : 'text-blue-600'}`} />
                        <span className={`text-[10px] font-bold mt-0.5 ${isPartial ? 'text-amber-700' : 'text-blue-700'}`}>
                          {new Date(inv.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 truncate">{patName}</p>
                          {isPartial && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wide">
                              Partiel
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {displayNum}
                          </span>
                          {inv.patient?.patient_number && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {inv.patient.patient_number}
                            </span>
                          )}
                        </div>
                        {inv.items_summary && (
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">
                            {inv.items_summary}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amounts + elapsed time */}
                    <div className="flex items-center gap-4 sm:flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total</p>
                        <p className="font-bold text-gray-700">{netToPay.toLocaleString('fr-FR')} USD</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Reste</p>
                        <p className="font-bold text-blue-700 text-lg">{inv.balance.toLocaleString('fr-FR')} USD</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                          <Clock className="w-3 h-3" />
                          {timeAgo(inv.created_at)}
                        </span>
                      </div>
                      {canEncaisser && (
                        <div className="hidden sm:block">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                            <CreditCard className="w-4 h-4" />
                          </div>
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

      {/* Info footer */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {canEncaisser
            ? 'Cliquez sur une ligne pour ouvrir l\'encaissement. Les factures conventionnees ne sont pas affichees.'
            : 'Vue en lecture seule. Les factures conventionnees ne sont pas affichees.'}
        </div>
      )}

      {/* Encaisser Modal */}
      {selectedInvoice && canEncaisser && (
        <EncaisserModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={handleEncaisserSuccess}
        />
      )}
    </div>
  );
}
