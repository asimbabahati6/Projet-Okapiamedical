import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Employee, EmployeeContract, TaxBracket, ExchangeRate } from '../../types/drcClinic';
import { calculatePayroll, formatCDF } from '../../utils/payrollCalculations';

interface CreatePayrollModalProps {
  onClose: () => void;
  onSuccess: () => void;
  exchangeRate: ExchangeRate | null;
}

export function CreatePayrollModal({ onClose, onSuccess, exchangeRate }: CreatePayrollModalProps) {
  const [formData, setFormData] = useState({
    period_name: '',
    period_start: '',
    period_end: '',
    payment_date: ''
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load active employees
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active');

      setEmployees(empData || []);

      // Load tax brackets
      const { data: taxData } = await supabase
        .from('tax_brackets')
        .select('*')
        .eq('is_active', true)
        .order('min_amount_cdf', { ascending: true });

      setTaxBrackets(taxData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exchangeRate) {
      setError('Aucun taux de change actif trouvé');
      return;
    }

    setLoading(true);
    setCalculating(true);
    setError('');

    try {
      // Create payroll period
      const { data: periodData, error: periodError } = await supabase
        .from('payroll_periods')
        .insert([{
          ...formData,
          status: 'processing',
          exchange_rate_id: exchangeRate.id
        }])
        .select()
        .single();

      if (periodError) throw periodError;

      // Calculate payroll for each employee
      let totalGross = 0;
      let totalNet = 0;
      let totalCNSSEmployee = 0;
      let totalCNSSEmployer = 0;
      let totalIPR = 0;

      for (const employee of employees) {
        // Get active contract
        const { data: contractData } = await supabase
          .from('employee_contracts')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('contract_status', 'active')
          .maybeSingle();

        if (!contractData) continue;

        const contract = contractData as EmployeeContract;

        // Calculate payroll
        const calculation = calculatePayroll(
          contract.base_salary_cdf,
          contract.transport_allowance_cdf,
          contract.housing_allowance_cdf,
          contract.other_allowances_cdf,
          0,
          taxBrackets
        );

        // Generate payslip number
        const payslipNumber = `PAY-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${employee.employee_number}`;

        // Insert payroll item
        await supabase.from('payroll_items').insert([{
          payroll_period_id: periodData.id,
          employee_id: employee.id,
          payslip_number: payslipNumber,
          base_salary_cdf: calculation.baseSalary,
          transport_allowance_cdf: calculation.transportAllowance,
          housing_allowance_cdf: calculation.housingAllowance,
          other_allowances_cdf: calculation.otherAllowances,
          total_bonuses_cdf: calculation.totalBonuses,
          gross_salary_cdf: calculation.grossSalary,
          cnss_employee_cdf: calculation.cnssEmployee,
          cnss_employer_cdf: calculation.cnssEmployer,
          ipr_tax_cdf: calculation.iprTax,
          other_deductions_cdf: calculation.otherDeductions,
          total_deductions_cdf: calculation.totalDeductions,
          net_salary_cdf: calculation.netSalary,
          payment_status: 'pending'
        }]);

        totalGross += calculation.grossSalary;
        totalNet += calculation.netSalary;
        totalCNSSEmployee += calculation.cnssEmployee;
        totalCNSSEmployer += calculation.cnssEmployer;
        totalIPR += calculation.iprTax;
      }

      // Update payroll period with totals
      await supabase
        .from('payroll_periods')
        .update({
          total_gross_cdf: totalGross,
          total_net_cdf: totalNet,
          total_cnss_employee_cdf: totalCNSSEmployee,
          total_cnss_employer_cdf: totalCNSSEmployer,
          total_ipr_cdf: totalIPR,
          status: 'approved'
        })
        .eq('id', periodData.id);

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setCalculating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Créer une Période de Paie</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {exchangeRate && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                Taux de change: <span className="font-bold">1 USD = {exchangeRate.usd_to_cdf.toLocaleString()} CDF</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Date: {new Date(exchangeRate.rate_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la Période *
              </label>
              <input
                type="text"
                required
                value={formData.period_name}
                onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
                placeholder="Ex: Salaire Janvier 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Début *
              </label>
              <input
                type="date"
                required
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Fin *
              </label>
              <input
                type="date"
                required
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Paiement
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Employés Actifs</h3>
            <p className="text-sm text-gray-600">
              {employees.length} employé(s) actif(s) seront inclus dans cette période de paie
            </p>
          </div>

          {calculating && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-900">Calcul des salaires en cours...</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !exchangeRate}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer et Calculer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
