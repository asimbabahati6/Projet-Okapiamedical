import { useEffect, useState } from 'react';
import { ProfessionalInfoData, ContractType, EmploymentStatus, ValidationError } from '../../../types/employeeForm';
import { FormField } from '../FormField';
import { SelectField } from '../SelectField';
import { getDepartments, Department } from '../../../services/employeeService';

interface ProfessionalInfoStepProps {
  data: ProfessionalInfoData;
  onChange: (data: Partial<ProfessionalInfoData>) => void;
  errors: ValidationError[];
}

const CONTRACT_TYPE_OPTIONS = [
  { value: ContractType.CDI, label: 'CDI - Contrat à Durée Indéterminée' },
  { value: ContractType.CDD, label: 'CDD - Contrat à Durée Déterminée' },
  { value: ContractType.STAGE, label: 'Stage' },
  { value: ContractType.FREELANCE, label: 'Freelance' },
  { value: ContractType.INTERIM, label: 'Intérim' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: EmploymentStatus.CADRE, label: 'Cadre' },
  { value: EmploymentStatus.NON_CADRE, label: 'Non-Cadre' },
];

export function ProfessionalInfoStep({ data, onChange, errors }: ProfessionalInfoStepProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handleChange = (field: keyof ProfessionalInfoData, value: string | boolean) => {
    onChange({ [field]: value });
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  }

  const departmentOptions = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations Professionnelles</h2>
        <p className="text-gray-600">Définissez le poste et les conditions d'emploi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Département"
          name="departmentId"
          value={data.departmentId}
          onChange={(e) => handleChange('departmentId', e.target.value)}
          options={departmentOptions}
          error={getError('departmentId')}
          required
          disabled={loading}
          placeholder={loading ? 'Chargement...' : 'Sélectionnez un département'}
        />

        <FormField
          label="Poste/Titre"
          name="position"
          value={data.position}
          onChange={(e) => handleChange('position', e.target.value)}
          error={getError('position')}
          required
          placeholder="Ex: Infirmier, Administrateur"
        />

        <SelectField
          label="Type de Contrat"
          name="contractType"
          value={data.contractType}
          onChange={(e) => handleChange('contractType', e.target.value)}
          options={CONTRACT_TYPE_OPTIONS}
          error={getError('contractType')}
          required
        />

        <SelectField
          label="Statut"
          name="employmentStatus"
          value={data.employmentStatus}
          onChange={(e) => handleChange('employmentStatus', e.target.value)}
          options={EMPLOYMENT_STATUS_OPTIONS}
          error={getError('employmentStatus')}
          required
        />

        <FormField
          label="Date d'Embauche"
          name="hireDate"
          type="date"
          value={data.hireDate}
          onChange={(e) => handleChange('hireDate', e.target.value)}
          error={getError('hireDate')}
          required
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="isMedicalStaff"
            checked={data.isMedicalStaff}
            onChange={(e) => handleChange('isMedicalStaff', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isMedicalStaff" className="text-sm font-medium text-gray-700">
            Cet employé fait partie du personnel médical
          </label>
        </div>

        {data.isMedicalStaff && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 bg-blue-50 p-4 rounded-lg">
            <FormField
              label="Numéro RPPS"
              name="rppsNumber"
              value={data.rppsNumber}
              onChange={(e) => handleChange('rppsNumber', e.target.value)}
              placeholder="Ex: 12345678901"
            />

            <FormField
              label="Spécialisation"
              name="specialization"
              value={data.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              error={getError('specialization')}
              required={data.isMedicalStaff}
              placeholder="Ex: Cardiologie, Pédiatrie"
            />
          </div>
        )}
      </div>
    </div>
  );
}
