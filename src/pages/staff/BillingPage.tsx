import { useState, useEffect } from 'react';
import { Receipt, Search, Plus, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Invoice {
  id: string;
  invoice_number: string;
  patient_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setInvoices(data.map((inv: Record<string, unknown>) => ({
          id: inv.id as string,
          invoice_number: (inv.invoice_number as string) || `INV-${String(inv.id).slice(0, 6)}`,
          patient_name: (inv.patient_name as string) || 'Patient',
          amount: Number(inv.total_amount || inv.amount || 0),
          status: (inv.status as string) || 'pending',
          created_at: inv.created_at as string,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = invoices.filter(inv =>
    inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

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
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenus</p>
              <p className="text-xl font-bold text-gray-900">{totalRevenue} USD</p>
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
              <p className="text-xl font-bold text-gray-900">{totalPending} USD</p>
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
              <p className="text-sm text-gray-500">Payées</p>
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
            <p className="text-gray-500">Aucune facture trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Facture</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-900">{inv.patient_name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{inv.amount} USD</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status === 'paid' ? 'Payée' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {new Date(inv.created_at).toLocaleDateString('fr-FR')}
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
