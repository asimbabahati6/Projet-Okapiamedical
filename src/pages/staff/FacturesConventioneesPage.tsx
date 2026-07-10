import { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Calendar,
  Building2,
  Eye,
  Printer,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRBAC } from '../../contexts/RBACContext';
import { PrintableInvoiceView } from '../../components/billing/PrintableInvoiceView';
import { Invoice } from '../../types/database';

interface Convention {
  id: string;
  nom: string;
  code: string;
  taux_prise_en_charge: number;
}

interface ConventionInvoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  convention_id: string | null;
  convention_name: string;
  total_amount: number;
  net_to_pay: number;
  paid_amount: number;
  balance: number;
  status: string;
  payment_method: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
}

const PAYMENT_ADMIN_ROLES = ['admin', 'directeur_general', 'accountant'];

export default function FacturesConventioneesPage() {
  const { userRole } = useRBAC();
  const canMarkPaid = PAYMENT_ADMIN_ROLES.includes(userRole as string);

  const [invoices, setInvoices] = useState<ConventionInvoice[]>([]);
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConvention, setFilterConvention] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [markingId, setMarkingId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [showRefInput, setShowRefInput] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const fetchConventions = useCallback(async () => {
    const { data } = await supabase
      .from('conventions')
      .select('id, nom, code, taux_prise_en_charge')
      .eq('actif', true)
      .order('nom');
    if (data) setConventions(data);
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('invoices')
        .select('*, patients(first_name, last_name), conventions(nom)')
        .eq('type_facture', 'conventionne')
        .order('created_at', { ascending: false });

      if (filterDate) {
        query = query
          .gte('created_at', `${filterDate}T00:00:00`)
          .lte('created_at', `${filterDate}T23:59:59`);
      }

      if (filterConvention !== 'all') {
        query = query.eq('convention_id', filterConvention);
      }

      const { data, error } = await query;
      if (error) throw error;

      setInvoices(
        (data || []).map((inv: Record<string, unknown>) => {
          const patient = inv.patients as { first_name: string; last_name: string } | null;
          const convention = inv.conventions as { nom: string } | null;
          return {
            id: inv.id as string,
            invoice_number: (inv.invoice_number as string) || `INV-${String(inv.id).slice(0, 6)}`,
            patient_id: (inv.patient_id as string) || '',
            patient_name: patient ? `${patient.last_name} ${patient.first_name}` : 'Patient',
            convention_id: inv.convention_id as string | null,
            convention_name: convention?.nom || 'Convention inconnue',
            total_amount: Number(inv.total_amount || 0),
            net_to_pay: Number(inv.net_to_pay || inv.total_amount || 0),
            paid_amount: Number(inv.paid_amount || 0),
            balance: Number(inv.balance || 0),
            status: (inv.status as string) || 'pending',
            payment_method: inv.payment_method as string | null,
            payment_date: inv.payment_date as string | null,
            notes: inv.notes as string | null,
            created_at: inv.created_at as string,
          };
        })
      );
    } catch (err) {
      console.error('Error fetching convention invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterConvention]);

  useEffect(() => {
    fetchConventions();
  }, [fetchConventions]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  async function handleMarkPaid(invoiceId: string) {
    if (!paymentRef.trim()) return;
    setMarkingId(invoiceId);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_amount: invoices.find((i) => i.id === invoiceId)?.net_to_pay || 0,
          balance: 0,
          payment_method: 'Virement conventionné',
          payment_date: new Date().toISOString(),
          notes: `Réf. paiement organisme: ${paymentRef.trim()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;
      setShowRefInput(null);
      setPaymentRef('');
      fetchInvoices();
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
    } finally {
      setMarkingId(null);
    }
  }

  function handleViewInvoice(row: ConventionInvoice) {
    const inv: Invoice = {
      id: row.id,
      invoice_number: row.invoice_number,
      patient_id: row.patient_id,
      total_amount: row.total_amount,
      paid_amount: row.paid_amount,
      balance: row.balance,
      status: row.status as Invoice['status'],
      payment_method: row.payment_method,
      payment_date: row.payment_date,
      net_to_pay: row.net_to_pay,
      created_at: row.created_at,
    };
    setViewingInvoice(inv);
  }

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.convention_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' && inv.status === 'paid') ||
      (filterStatus === 'pending' && inv.status !== 'paid' && inv.status !== 'cancelled');
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((s, i) => s + i.net_to_pay, 0);
  const paidAmount = filtered.filter((i) => i.status === 'paid').reduce((s, i) => s + i.paid_amount, 0);
  const pendingAmount = filtered.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + i.balance, 0);
  const todayCount = invoices.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            Factures Conventionnees
          </h1>
          <p className="text-gray-500 mt-1">
            Suivi des factures prises en charge par les organismes conventionnes
          </p>
        </div>
        <button
          onClick={fetchInvoices}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Factures du jour
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{todayCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Montant total
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {totalAmount.toLocaleString('fr-FR')}{' '}
                <span className="text-base font-medium text-gray-500">USD</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Regle par organisme
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {paidAmount.toLocaleString('fr-FR')}{' '}
                <span className="text-base font-medium text-gray-500">USD</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                En attente organisme
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {pendingAmount.toLocaleString('fr-FR')}{' '}
                <span className="text-base font-medium text-gray-500">USD</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par patient, facture ou convention..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <select
                value={filterConvention}
                onChange={(e) => setFilterConvention(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none bg-white"
              >
                <option value="all">Toutes les conventions</option>
                {conventions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-1.5">
              {(['all', 'pending', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    filterStatus === s
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    {s === 'all' ? 'Tous' : s === 'pending' ? 'En attente' : 'Payes'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucune facture conventionnee</p>
            <p className="text-sm mt-1">
              Les factures conventionnees apparaitront ici
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    N. Facture
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Convention
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isShowingRef = showRefInput === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {inv.patient_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium">
                          <Building2 className="w-3 h-3" />
                          {inv.convention_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {inv.net_to_pay.toLocaleString('fr-FR')} USD
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Paye par organisme
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            En attente organisme
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewInvoice(inv)}
                            title="Voir"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewInvoice(inv)}
                            title="Imprimer"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {!isPaid && canMarkPaid && (
                            <>
                              {isShowingRef ? (
                                <div className="flex items-center gap-1.5 ml-2">
                                  <input
                                    type="text"
                                    placeholder="Ref. paiement"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleMarkPaid(inv.id);
                                      if (e.key === 'Escape') {
                                        setShowRefInput(null);
                                        setPaymentRef('');
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleMarkPaid(inv.id)}
                                    disabled={!paymentRef.trim() || markingId === inv.id}
                                    className="px-2 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                  >
                                    {markingId === inv.id ? '...' : 'OK'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowRefInput(null);
                                      setPaymentRef('');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-300 transition-colors"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setShowRefInput(inv.id);
                                    setPaymentRef('');
                                  }}
                                  className="ml-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Marquer payee
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingInvoice && (
        <PrintableInvoiceView
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}
