import { useEffect, useState } from 'react';
import { Plus, DollarSign, FileText, CheckCircle, Clock, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PayrollPeriod, Employee, TaxBracket, ExchangeRate } from '../../types/drcClinic';
import { formatCDF } from '../../utils/payrollCalculations';
import { CreatePayrollModal } from '../../components/payroll/CreatePayrollModal';

export function PayrollPage() {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  useEffect(() => {
    loadPayrollData();
  }, []);

  async function loadPayrollData() {
    try {
      // Get exchange rate
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('is_active', true)
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rateData) {
        setExchangeRate(rateData);
      }

      // Get payroll periods
      const { data: periodsData, error } = await supabase
        .from('payroll_periods')
        .select('*, exchange_rate:exchange_rates(*)')
        .order('period_start', { ascending: false });

      if (error) throw error;
      setPayrollPeriods(periodsData || []);
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      draft: 'Brouillon',
      processing: 'En Traitement',
      approved: 'Approuvé',
      paid: 'Payé',
      cancelled: 'Annulé'
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de la Paie</h1>
          <p className="text-gray-600 mt-1">Système de calcul conforme aux normes RDC (CNSS & IPR)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Période de Paie
        </button>
      </div>

      {/* Exchange Rate Info */}
      {exchangeRate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Taux de Change Actuel</p>
                <p className="text-lg font-bold text-blue-900">
                  1 USD = {exchangeRate.usd_to_cdf.toLocaleString()} CDF
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-600">
              {new Date(exchangeRate.rate_date).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Périodes</p>
              <p className="text-2xl font-bold text-gray-900">{payrollPeriods.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Payées</p>
              <p className="text-2xl font-bold text-green-600">
                {payrollPeriods.filter(p => p.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En Cours</p>
              <p className="text-2xl font-bold text-yellow-600">
                {payrollPeriods.filter(p => p.status === 'processing' || p.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payé (mois)</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCDF(payrollPeriods
                  .filter(p => p.status === 'paid' && new Date(p.period_start).getMonth() === new Date().getMonth())
                  .reduce((sum, p) => sum + p.total_net_cdf, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CNSS & IPR Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Cotisations CNSS</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Part Employé</span>
              <span className="font-semibold text-blue-600">5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Part Employeur</span>
              <span className="font-semibold text-green-600">13%</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Cotisation</span>
                <span className="font-bold text-gray-900">18%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Impôt Professionnel (IPR)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tranche 1 (0 - 524K)</span>
              <span className="font-semibold text-gray-900">3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tranche 2 (524K - 1.4M)</span>
              <span className="font-semibold text-gray-900">10%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tranche 3 (1.4M - 2.9M)</span>
              <span className="font-semibold text-gray-900">20%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tranche 4 (2.9M - 5.7M)</span>
              <span className="font-semibold text-gray-900">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tranche 5 (5.7M+)</span>
              <span className="font-semibold text-gray-900">40%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Periods Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Périodes de Paie</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Période</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dates</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Salaire Brut</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">CNSS Employé</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">IPR</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net à Payer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollPeriods.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Aucune période de paie trouvée
                  </td>
                </tr>
              ) : (
                payrollPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {period.period_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(period.period_start).toLocaleDateString('fr-FR')} - {new Date(period.period_end).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                      {formatCDF(period.total_gross_cdf)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {formatCDF(period.total_cnss_employee_cdf)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {formatCDF(period.total_ipr_cdf)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-bold text-green-600">
                      {formatCDF(period.total_net_cdf)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(period.status)}</td>
                    <td className="py-3 px-4">
                      <button
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                        title="Télécharger les bulletins"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payroll Modal */}
      {showCreateModal && (
        <CreatePayrollModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPayrollData();
          }}
          exchangeRate={exchangeRate}
        />
      )}
    </div>
  );
}
