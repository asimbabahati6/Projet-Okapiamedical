import { EmployeeFormData, StepNumber } from '../../../types/employeeForm';
import { Edit2, CheckCircle } from 'lucide-react';

interface ReviewStepProps {
  data: EmployeeFormData;
  onEditStep: (step: StepNumber) => void;
}

export function ReviewStep({ data, onEditStep }: ReviewStepProps) {
  const personalInfo = data.personalInfo;
  const academicBackground = data.academicBackground;
  const contactDetails = data.contactDetails;
  const professionalInfo = data.professionalInfo;
  const bankingInfo = data.bankingInfo;
  const emergencyContact = data.emergencyContact;

  const Section = ({ title, step, children }: { title: string; step: StepNumber; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          {title}
        </h3>
        <button
          onClick={() => onEditStep(step)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Edit2 className="w-4 h-4" />
          Modifier
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600 font-medium">{label}:</span>
      <span className="text-sm text-gray-900">{value || 'Non renseigné'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Révision et Confirmation</h2>
        <p className="text-gray-600">Vérifiez toutes les informations avant de créer le profil employé</p>
      </div>

      <div className="space-y-4">
        <Section title="Informations Personnelles" step={1}>
          <Field label="Matricule" value={personalInfo.employeeNumber} />
          <Field label="Nom complet" value={`${personalInfo.firstName} ${personalInfo.lastName}`} />
          <Field label="Date de naissance" value={personalInfo.dateOfBirth} />
          <Field label="Genre" value={personalInfo.gender} />
          <Field label="Lieu de naissance" value={personalInfo.placeOfBirth} />
          <Field label="Nationalité" value={personalInfo.nationality} />
          <Field label="Sécurité sociale" value={personalInfo.socialSecurityNumber} />
        </Section>

        <Section title="Parcours Académique" step={2}>
          {academicBackground.educationEntries.length === 0 ? (
            <div className="text-sm text-gray-500 italic py-2">Aucune formation renseignée</div>
          ) : (
            <div className="space-y-4">
              {academicBackground.educationEntries.map((entry, index) => (
                <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                  <div className="font-medium text-gray-900 mb-1">{entry.degreeTitle}</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {entry.educationLevel}
                      </span>
                      <span>{entry.institution}</span>
                      <span className="text-gray-400">•</span>
                      <span>{entry.graduationYear}</span>
                    </div>
                    {entry.keySkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.keySkills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Coordonnées" step={3}>
          <Field label="Email professionnel" value={contactDetails.professionalEmail} />
          <Field label="Email personnel" value={contactDetails.personalEmail} />
          <Field label="Téléphone principal" value={contactDetails.primaryPhone} />
          <Field label="Téléphone secondaire" value={contactDetails.secondaryPhone} />
          <Field
            label="Adresse"
            value={`${contactDetails.streetAddress} ${contactDetails.addressNumber}, ${contactDetails.city}, ${contactDetails.country}`}
          />
          <Field label="Code postal" value={contactDetails.postalCode} />
        </Section>

        <Section title="Informations Professionnelles" step={4}>
          <Field label="Poste" value={professionalInfo.position} />
          <Field label="Type de contrat" value={professionalInfo.contractType} />
          <Field label="Statut" value={professionalInfo.employmentStatus} />
          <Field label="Date d'embauche" value={professionalInfo.hireDate} />
          <Field label="Personnel médical" value={professionalInfo.isMedicalStaff ? 'Oui' : 'Non'} />
          {professionalInfo.isMedicalStaff && (
            <>
              <Field label="Spécialisation" value={professionalInfo.specialization} />
              <Field label="Numéro RPPS" value={professionalInfo.rppsNumber} />
            </>
          )}
        </Section>

        <Section title="Informations Bancaires" step={5}>
          <Field label="Banque" value={bankingInfo.bankName} />
          <Field label="IBAN" value={bankingInfo.iban} />
          <Field label="BIC" value={bankingInfo.bic} />
          <Field label="Titulaire" value={bankingInfo.accountHolder} />
          <Field label="Devise" value={bankingInfo.currency} />
        </Section>

        <Section title="Contact d'Urgence" step={6}>
          <Field label="Nom complet" value={emergencyContact.fullName} />
          <Field label="Lien de parenté" value={emergencyContact.relationship} />
          <Field label="Téléphone" value={emergencyContact.phone} />
          <Field label="Email" value={emergencyContact.email} />
          <Field label="Adresse" value={emergencyContact.address} />
        </Section>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800 font-medium">
          Toutes les informations ont été vérifiées. Vous pouvez maintenant créer le profil employé.
        </p>
      </div>
    </div>
  );
}
