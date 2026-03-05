import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ContractType, ContractFormData } from '../../types/contracts';
import { createContract, generateContractNumber } from '../../services/contractService';

interface AddContractModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
}

export function AddContractModal({ onClose, onSuccess }: AddContractModalProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    employee_id: '',
    contract_type: 'CDI' as ContractType,
    contract_number: '',
    start_date: '',
    end_date: null,
    duration_months: null,
    position: '',
    department_id: null,
    base_salary_cdf: 0,
    base_salary_usd: 0,
    benefits: {},
    renewal_alert_days: 30,
    notes: ''
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    loadContractNumber();
  }, []);

  async function loadData() {
    try {
      const { data: empData } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email')
        .in('role', ['doctor', 'nurse', 'pharmacist', 'receptionist', 'laboratory_technician', 'hospital_admin'])
        .order('last_name');

      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      setEmployees(empData || []);
      setDepartments(deptData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  async function loadContractNumber() {
    try {
      const number = await generateContractNumber();
      setFormData(prev => ({ ...prev, contract_number: number }));
    } catch (err) {
      console.error('Error generating contract number:', err);
    }
  }

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      setFormData(prev => ({ ...prev, duration_months: months > 0 ? months : null }));
    }
  }, [formData.start_date, formData.end_date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.employee_id || !formData.start_date || !formData.position || formData.base_salary_cdf <= 0) {
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

      await createContract(formData, userData.user.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du contrat');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Nouveau Contrat</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employé <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un employé</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de Contrat
              </label>
              <input
                type="text"
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>

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
                Date de Début <span className="text-red-500">*</span>
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
                Date de Fin {formData.contract_type !== 'CDI' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required={formData.contract_type !== 'CDI'}
                disabled={formData.contract_type === 'CDI'}
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
                placeholder="Ex: Médecin Généraliste"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département
              </label>
              <select
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value || null })}
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
                Salaire de Base (CDF) <span className="text-red-500">*</span>
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
                Salaire de Base (USD)
              </label>
              <input
                type="number"
                value={formData.base_salary_usd || ''}
                onChange={(e) => setFormData({ ...formData, base_salary_usd: parseFloat(e.target.value) || null })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alerte Renouvellement (jours)
              </label>
              <input
                type="number"
                value={formData.renewal_alert_days}
                onChange={(e) => setFormData({ ...formData, renewal_alert_days: parseInt(e.target.value) || 30 })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formData.duration_months && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (mois)
                </label>
                <input
                  type="text"
                  value={`${formData.duration_months} mois`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Notes additionnelles..."
              />
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer le Contrat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
