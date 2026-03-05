import { BankingInfoData, ValidationError } from '../../../types/employeeForm';
import { FormField } from '../FormField';
import { formatIBAN } from '../../../validation/fieldValidators';

interface BankingInfoStepProps {
  data: BankingInfoData;
  onChange: (data: Partial<BankingInfoData>) => void;
  errors: ValidationError[];
}

export function BankingInfoStep({ data, onChange, errors }: BankingInfoStepProps) {
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handleChange = (field: keyof BankingInfoData, value: string) => {
    onChange({ [field]: value });
  };

  const handleIBANChange = (value: string) => {
    const formatted = formatIBAN(value);
    onChange({ iban: formatted });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations Bancaires</h2>
        <p className="text-gray-600">
          Ces informations sont optionnelles mais recommandées pour les virements de salaire
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Nom de la Banque"
          name="bankName"
          value={data.bankName}
          onChange={(e) => handleChange('bankName', e.target.value)}
          placeholder="Ex: Equity Bank Congo"
          className="md:col-span-2"
        />

        <FormField
          label="IBAN"
          name="iban"
          value={data.iban}
          onChange={(e) => handleIBANChange(e.target.value)}
          error={getError('iban')}
          placeholder="Ex: CD00 0000 0000 0000 0000 0000"
          className="md:col-span-2"
        />

        <FormField
          label="Code BIC/SWIFT"
          name="bic"
          value={data.bic}
          onChange={(e) => handleChange('bic', e.target.value.toUpperCase())}
          error={getError('bic')}
          placeholder="Ex: EQBLCDKI"
        />

        <FormField
          label="Titulaire du Compte"
          name="accountHolder"
          value={data.accountHolder}
          onChange={(e) => handleChange('accountHolder', e.target.value)}
          error={getError('accountHolder')}
          placeholder="Nom complet du titulaire"
        />

        <FormField
          label="Devise"
          name="currency"
          value={data.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          placeholder="USD"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Les informations bancaires sont stockées de manière sécurisée et utilisées uniquement pour le traitement des salaires.
        </p>
      </div>
    </div>
  );
}
