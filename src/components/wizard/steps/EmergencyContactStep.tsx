import { EmergencyContactData, RelationshipType, ValidationError } from '../../../types/employeeForm';
import { FormField } from '../FormField';
import { SelectField } from '../SelectField';

interface EmergencyContactStepProps {
  data: EmergencyContactData;
  onChange: (data: Partial<EmergencyContactData>) => void;
  errors: ValidationError[];
}

const RELATIONSHIP_OPTIONS = [
  { value: RelationshipType.SPOUSE, label: 'Conjoint(e)' },
  { value: RelationshipType.PARENT, label: 'Parent' },
  { value: RelationshipType.CHILD, label: 'Enfant' },
  { value: RelationshipType.SIBLING, label: 'Frère/Soeur' },
  { value: RelationshipType.FRIEND, label: 'Ami(e)' },
  { value: RelationshipType.OTHER, label: 'Autre' },
];

export function EmergencyContactStep({ data, onChange, errors }: EmergencyContactStepProps) {
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handleChange = (field: keyof EmergencyContactData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact d'Urgence</h2>
        <p className="text-gray-600">
          Personne à contacter en cas d'urgence ou de situation critique
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Nom Complet"
          name="fullName"
          value={data.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={getError('fullName')}
          required
          placeholder="Ex: Marie Dupont"
          className="md:col-span-2"
        />

        <SelectField
          label="Lien de Parenté"
          name="relationship"
          value={data.relationship}
          onChange={(e) => handleChange('relationship', e.target.value)}
          options={RELATIONSHIP_OPTIONS}
          error={getError('relationship')}
          required
        />

        <FormField
          label="Numéro de Téléphone"
          name="phone"
          type="tel"
          value={data.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={getError('phone')}
          required
          placeholder="+243 XXX XXX XXX"
          autoComplete="tel"
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={data.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={getError('email')}
          placeholder="contact.urgence@exemple.com"
          autoComplete="email"
        />

        <FormField
          label="Adresse"
          name="address"
          value={data.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Adresse complète"
          className="md:col-span-2"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Assurez-vous que les coordonnées de la personne à contacter sont à jour et correctes.
        </p>
      </div>
    </div>
  );
}
