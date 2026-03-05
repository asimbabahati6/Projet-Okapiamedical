import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ContractType, ContractWithEmployee } from '../../types/contracts';
import { renewContract } from '../../services/contractService';

interface RenewContractModalProps {
  contract: ContractWithEmployee;
  onClose: () => void;
  onSuccess: () => void;
}

interface Department {
  id: string;
  name: string;
}

export function RenewContractModal({ contract, onClose, onSuccess }: RenewContractModalProps) {
  const defaultStartDate = contract.end_date
    ? new Date(new Date(contract.end_date).getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    contract_type: contract.contract_type,
    start_date: defaultStartDate,
    end_date: '',
    duration_months: contract.duration_months || 12,
    position: contract.position,
    department_id: contract.department_id || '',
    base_salary_cdf: contract.base_salary_cdf,
    base_salary_usd: contract.base_salary_usd || 0,
    renewal_alert_days: contract.renewal_alert_days,
    notes: ''
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (formData.start_date && formData.duration_months) {
      const start = new Date(formData.start_date);
      const end = new Date(start);
      end.setMonth(end.getMonth() + formData.duration_months);
      setFormData(prev => ({ ...prev, end_date: end.toISOString().split('T')[0] }));
    }
  }, [formData.start_date, formData.duration_months]);

  async function loadDepartments() {
    try {
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      setDepartments(data || []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.start_date || !formData.position || formData.base_salary_cdf <= 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      await renewContract(
        contract.id,
        {
          ...formData,
          end_date: formData.end_date || null,
          department_id: formData.department_id || null,
          base_salary_usd: formData.base_salary_usd || null
        },
        userData.user.id
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du renouvellement du contrat');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Renouveler le Contrat</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Contrat Actuel</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Employé:</span>
                <p className="font-medium">{contract.employee_name}</p>
              </div>
              <div>
                <span className="text-blue-600">Numéro:</span>
                <p className="font-medium">{contract.contract_number}</p>
              </div>
              <div>
                <span className="text-blue-600">Date de fin:</span>
                <p className="font-medium">
                  {contract.end_date ? new Date(contract.end_date).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-blue-600">Renouvellement #:</span>
                <p className="font-medium">{contract.renewal_count + 1}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de Contrat <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as ContractType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
                <option value="CDD">CDD - Contrat à Durée Déterminée</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
                <option value="Interim">Intérim</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (mois) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.duration_months || ''}
                onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || null })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required={formData.contract_type !== 'CDI'}
                disabled={formData.contract_type === 'CDI'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvelle Date de Début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvelle Date de Fin
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poste <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un département</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau Salaire (CDF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.base_salary_cdf}
                onChange={(e) => setFormData({ ...formData, base_salary_cdf: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau Salaire (USD)
              </label>
              <input
                type="number"
                value={formData.base_salary_usd}
                onChange={(e) => setFormData({ ...formData, base_salary_usd: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes pour le nouveau contrat
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Notes additionnelles pour ce renouvellement..."
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Un nouveau contrat sera créé avec le numéro de renouvellement #{contract.renewal_count + 1}.
              Le contrat actuel sera marqué comme expiré.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? 'Renouvellement...' : 'Renouveler le Contrat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
