import { ContactDetailsData, ValidationError } from '../../../types/employeeForm';
import { FormField } from '../FormField';

interface ContactDetailsStepProps {
  data: ContactDetailsData;
  onChange: (data: Partial<ContactDetailsData>) => void;
  errors: ValidationError[];
}

export function ContactDetailsStep({ data, onChange, errors }: ContactDetailsStepProps) {
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handleChange = (field: keyof ContactDetailsData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coordonnées</h2>
        <p className="text-gray-600">Renseignez les informations de contact de l'employé</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Email Professionnel"
              name="professionalEmail"
              type="email"
              value={data.professionalEmail}
              onChange={(e) => handleChange('professionalEmail', e.target.value)}
              error={getError('professionalEmail')}
              required
              placeholder="prenom.nom@hopital.cd"
              autoComplete="email"
            />

            <FormField
              label="Email Personnel"
              name="personalEmail"
              type="email"
              value={data.personalEmail}
              onChange={(e) => handleChange('personalEmail', e.target.value)}
              error={getError('personalEmail')}
              placeholder="email.personnel@exemple.com"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Téléphones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Téléphone Principal"
              name="primaryPhone"
              type="tel"
              value={data.primaryPhone}
              onChange={(e) => handleChange('primaryPhone', e.target.value)}
              error={getError('primaryPhone')}
              required
              placeholder="+243 XXX XXX XXX"
              autoComplete="tel"
            />

            <FormField
              label="Téléphone Secondaire"
              name="secondaryPhone"
              type="tel"
              value={data.secondaryPhone}
              onChange={(e) => handleChange('secondaryPhone', e.target.value)}
              error={getError('secondaryPhone')}
              placeholder="+243 XXX XXX XXX"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Rue"
              name="streetAddress"
              value={data.streetAddress}
              onChange={(e) => handleChange('streetAddress', e.target.value)}
              error={getError('streetAddress')}
              required
              placeholder="Ex: Avenue de la Paix"
              autoComplete="street-address"
              className="md:col-span-2"
            />

            <FormField
              label="Numéro"
              name="addressNumber"
              value={data.addressNumber}
              onChange={(e) => handleChange('addressNumber', e.target.value)}
              placeholder="Ex: 123"
            />

            <FormField
              label="Code Postal"
              name="postalCode"
              value={data.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="Ex: BP 1234"
              autoComplete="postal-code"
            />

            <FormField
              label="Ville"
              name="city"
              value={data.city}
              onChange={(e) => handleChange('city', e.target.value)}
              error={getError('city')}
              required
              placeholder="Ex: Kinshasa"
              autoComplete="address-level2"
            />

            <FormField
              label="Pays"
              name="country"
              value={data.country}
              onChange={(e) => handleChange('country', e.target.value)}
              error={getError('country')}
              required
              placeholder="Ex: République Démocratique du Congo"
              autoComplete="country-name"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
