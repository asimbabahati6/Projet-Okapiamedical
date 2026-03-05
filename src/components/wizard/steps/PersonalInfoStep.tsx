import { PersonalInfoData, Gender, ValidationError } from '../../../types/employeeForm';
import { FormField } from '../FormField';
import { SelectField } from '../SelectField';

interface PersonalInfoStepProps {
  data: PersonalInfoData;
  onChange: (data: Partial<PersonalInfoData>) => void;
  errors: ValidationError[];
}

const GENDER_OPTIONS = [
  { value: Gender.MALE, label: 'Masculin' },
  { value: Gender.FEMALE, label: 'Féminin' },
  { value: Gender.OTHER, label: 'Autre' },
];

export function PersonalInfoStep({ data, onChange, errors }: PersonalInfoStepProps) {
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handleChange = (field: keyof PersonalInfoData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations Personnelles</h2>
        <p className="text-gray-600">Veuillez fournir les informations d'identité de l'employé</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <span className="font-semibold">Matricule:</span>
          <span className="text-blue-600 font-mono">{data.employeeNumber || 'Sera généré automatiquement'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Prénom"
          name="firstName"
          value={data.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          error={getError('firstName')}
          required
          placeholder="Ex: Jean"
          autoComplete="given-name"
        />

        <FormField
          label="Nom"
          name="lastName"
          value={data.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          error={getError('lastName')}
          required
          placeholder="Ex: Dupont"
          autoComplete="family-name"
        />

        <FormField
          label="Date de Naissance"
          name="dateOfBirth"
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          error={getError('dateOfBirth')}
          required
          max={new Date().toISOString().split('T')[0]}
          autoComplete="bday"
        />

        <SelectField
          label="Genre"
          name="gender"
          value={data.gender}
          onChange={(e) => handleChange('gender', e.target.value)}
          options={GENDER_OPTIONS}
          error={getError('gender')}
          required
        />

        <FormField
          label="Lieu de Naissance"
          name="placeOfBirth"
          value={data.placeOfBirth}
          onChange={(e) => handleChange('placeOfBirth', e.target.value)}
          placeholder="Ex: Kinshasa"
        />

        <FormField
          label="Nationalité"
          name="nationality"
          value={data.nationality}
          onChange={(e) => handleChange('nationality', e.target.value)}
          placeholder="Ex: République Démocratique du Congo"
        />

        <FormField
          label="Numéro de Sécurité Sociale"
          name="socialSecurityNumber"
          value={data.socialSecurityNumber}
          onChange={(e) => handleChange('socialSecurityNumber', e.target.value)}
          placeholder="Ex: 1234567890123"
        />
      </div>
    </div>
  );
}
