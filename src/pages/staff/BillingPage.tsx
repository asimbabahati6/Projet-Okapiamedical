import { useState, useEffect } from 'react';
import { Receipt, Search, Plus, DollarSign, TrendingUp, FileText, Eye, Printer, CheckCircle, X as XIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CreateInvoiceModal } from '../../components/billing/CreateInvoiceModal';
import { PrintableInvoiceView } from '../../components/billing/PrintableInvoiceView';
import { Invoice } from '../../types/database';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  amount: number;
  net_to_pay: number;
  paid_amount: number;
  balance: number;
  status: string;
  payment_method: string;
  created_at: string;
  tva_rate: number;
  tva_amount: number;
}

export function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*, patients(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setInvoices(data.map((inv: Record<string, unknown>) => {
          const patient = inv.patients as { first_name: string; last_name: string } | null;
          return {
            id: inv.id as string,
            invoice_number: (inv.invoice_number as string) || `INV-${String(inv.id).slice(0, 6)}`,
            patient_id: (inv.patient_id as string) || '',
            patient_name: patient ? `${patient.last_name} ${patient.first_name}` : 'Patient',
            amount: Number(inv.total_amount || 0),
            net_to_pay: Number(inv.net_to_pay || inv.total_amount || 0),
            paid_amount: Number(inv.paid_amount || 0),
            balance: Number(inv.balance || 0),
            status: (inv.status as string) || 'pending',
            payment_method: (inv.payment_method as string) || '',
            created_at: inv.created_at as string,
            tva_rate: Number(inv.tva_rate || 0),
            tva_amount: Number(inv.tva_amount || 0),
          };
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleViewInvoice(row: InvoiceRow) {
    const inv: Invoice = {
      id: row.id,
      invoice_number: row.invoice_number,
      patient_id: row.patient_id,
      total_amount: row.amount,
      paid_amount: row.paid_amount,
      balance: row.balance,
      status: row.status as Invoice['status'],
      payment_method: row.payment_method || null,
      payment_date: null,
      net_to_pay: row.net_to_pay,
      created_at: row.created_at,
    };
    setViewingInvoice(inv);
  }

  const filtered = invoices.filter(inv =>
    inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.paid_amount, 0);
  const totalPending = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Receipt className="w-7 h-7 text-blue-600" />
            Facturation
          </h1>
          <p className="text-gray-500 mt-1">Gestion des factures et paiements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-600 hover:text-green-800">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenus</p>
              <p className="text-xl font-bold text-gray-900">{totalRevenue.toLocaleString('fr-FR')} USD</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-xl font-bold text-gray-900">{totalPending.toLocaleString('fr-FR')} USD</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Factures</p>
              <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Payees</p>
              <p className="text-xl font-bold text-gray-900">{invoices.filter(i => i.status === 'paid').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune facture trouvee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N Facture</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paiement</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reste a payer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.patient_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{(inv.net_to_pay || inv.amount).toLocaleString('fr-FR')} USD</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{inv.payment_method?.replace('_', ' ') || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold text-sm ${
                        inv.balance <= 0 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {inv.balance > 0 ? `${inv.balance.toLocaleString('fr-FR')} USD` : '0 USD'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'paid' || inv.balance <= 0 && inv.paid_amount > 0 ? 'bg-green-100 text-green-800' :
                        inv.status === 'partial' || (inv.paid_amount > 0 && inv.balance > 0) ? 'bg-blue-100 text-blue-800' :
                        inv.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status === 'paid' || (inv.balance <= 0 && inv.paid_amount > 0) ? 'Payee' :
                         inv.status === 'partial' || (inv.paid_amount > 0 && inv.balance > 0) ? 'Partiellement payee' :
                         inv.status === 'cancelled' ? 'Annulee' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewInvoice(inv)}
                          title="Voir / Imprimer"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchInvoices();
            setSuccessMsg('Facture creee avec succes');
            setTimeout(() => setSuccessMsg(''), 5000);
          }}
        />
      )}

      {viewingInvoice && (
        <PrintableInvoiceView
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}
