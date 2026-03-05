import {
  isValidEmail,
  isValidIBAN,
  isValidFrenchPhone,
  isValidBIC,
  isAdult,
  isValidDate,
  isHireDateValid,
  isRequiredField,
  hasMinLength,
  isValidGraduationYear,
  isValidSkill,
} from './fieldValidators';
import {
  PersonalInfoData,
  ContactDetailsData,
  ProfessionalInfoData,
  BankingInfoData,
  EmergencyContactData,
  AcademicBackgroundData,
  EmployeeFormData,
  ValidationError,
  EducationLevel,
} from '../types/employeeForm';

export function validatePersonalInfo(data: PersonalInfoData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isRequiredField(data.firstName)) {
    errors.push({ field: 'firstName', message: 'Le prénom est obligatoire' });
  } else if (!hasMinLength(data.firstName, 2)) {
    errors.push({ field: 'firstName', message: 'Le prénom doit contenir au moins 2 caractères' });
  }

  if (!isRequiredField(data.lastName)) {
    errors.push({ field: 'lastName', message: 'Le nom est obligatoire' });
  } else if (!hasMinLength(data.lastName, 2)) {
    errors.push({ field: 'lastName', message: 'Le nom doit contenir au moins 2 caractères' });
  }

  if (!isRequiredField(data.dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'La date de naissance est obligatoire' });
  } else if (!isValidDate(data.dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'La date de naissance n\'est pas valide' });
  } else if (!isAdult(data.dateOfBirth, 18)) {
    errors.push({ field: 'dateOfBirth', message: 'L\'employé doit avoir au moins 18 ans' });
  }

  if (!isRequiredField(data.gender)) {
    errors.push({ field: 'gender', message: 'Le genre est obligatoire' });
  }

  return errors;
}

export function validateAcademicBackground(
  data: AcademicBackgroundData,
  hireDate: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.educationEntries.length === 0) {
    return errors;
  }

  data.educationEntries.forEach((entry, index) => {
    if (!entry.educationLevel) {
      errors.push({
        field: `educationEntries[${index}].educationLevel`,
        message: 'Le niveau d\'études est obligatoire',
      });
    } else {
      const validLevels = Object.values(EducationLevel);
      if (!validLevels.includes(entry.educationLevel as EducationLevel)) {
        errors.push({
          field: `educationEntries[${index}].educationLevel`,
          message: 'Le niveau d\'études n\'est pas valide',
        });
      }
    }

    if (!isRequiredField(entry.degreeTitle)) {
      errors.push({
        field: `educationEntries[${index}].degreeTitle`,
        message: 'Le titre du diplôme est obligatoire',
      });
    } else if (!hasMinLength(entry.degreeTitle, 2)) {
      errors.push({
        field: `educationEntries[${index}].degreeTitle`,
        message: 'Le titre du diplôme doit contenir au moins 2 caractères',
      });
    }

    if (!isRequiredField(entry.institution)) {
      errors.push({
        field: `educationEntries[${index}].institution`,
        message: 'L\'établissement est obligatoire',
      });
    } else if (!hasMinLength(entry.institution, 2)) {
      errors.push({
        field: `educationEntries[${index}].institution`,
        message: 'L\'établissement doit contenir au moins 2 caractères',
      });
    }

    if (!entry.graduationYear) {
      errors.push({
        field: `educationEntries[${index}].graduationYear`,
        message: 'L\'année d\'obtention est obligatoire',
      });
    } else if (!isValidGraduationYear(Number(entry.graduationYear), hireDate)) {
      const currentYear = new Date().getFullYear();
      errors.push({
        field: `educationEntries[${index}].graduationYear`,
        message: `L'année doit être entre 1950 et ${currentYear}, et antérieure à la date d'embauche`,
      });
    }

    if (entry.keySkills && entry.keySkills.length > 0) {
      entry.keySkills.forEach((skill) => {
        if (!isValidSkill(skill)) {
          errors.push({
            field: `educationEntries[${index}].keySkills`,
            message: 'Chaque compétence doit contenir entre 1 et 50 caractères',
          });
        }
      });
    }
  });

  return errors;
}

export function validateContactDetails(data: ContactDetailsData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isRequiredField(data.professionalEmail)) {
    errors.push({ field: 'professionalEmail', message: 'L\'email professionnel est obligatoire' });
  } else if (!isValidEmail(data.professionalEmail)) {
    errors.push({ field: 'professionalEmail', message: 'L\'email professionnel n\'est pas valide' });
  }

  if (data.personalEmail && !isValidEmail(data.personalEmail)) {
    errors.push({ field: 'personalEmail', message: 'L\'email personnel n\'est pas valide' });
  }

  if (!isRequiredField(data.primaryPhone)) {
    errors.push({ field: 'primaryPhone', message: 'Le numéro de téléphone principal est obligatoire' });
  } else if (!isValidFrenchPhone(data.primaryPhone)) {
    errors.push({ field: 'primaryPhone', message: 'Le numéro de téléphone n\'est pas valide' });
  }

  if (data.secondaryPhone && !isValidFrenchPhone(data.secondaryPhone)) {
    errors.push({ field: 'secondaryPhone', message: 'Le numéro de téléphone secondaire n\'est pas valide' });
  }

  if (!isRequiredField(data.streetAddress)) {
    errors.push({ field: 'streetAddress', message: 'L\'adresse est obligatoire' });
  }

  if (!isRequiredField(data.city)) {
    errors.push({ field: 'city', message: 'La ville est obligatoire' });
  }

  if (!isRequiredField(data.country)) {
    errors.push({ field: 'country', message: 'Le pays est obligatoire' });
  }

  return errors;
}

export function validateProfessionalInfo(
  data: ProfessionalInfoData,
  dateOfBirth: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isRequiredField(data.departmentId)) {
    errors.push({ field: 'departmentId', message: 'Le département est obligatoire' });
  }

  if (!isRequiredField(data.position)) {
    errors.push({ field: 'position', message: 'Le poste est obligatoire' });
  } else if (!hasMinLength(data.position, 2)) {
    errors.push({ field: 'position', message: 'Le poste doit contenir au moins 2 caractères' });
  }

  if (!isRequiredField(data.contractType)) {
    errors.push({ field: 'contractType', message: 'Le type de contrat est obligatoire' });
  }

  if (!isRequiredField(data.employmentStatus)) {
    errors.push({ field: 'employmentStatus', message: 'Le statut est obligatoire' });
  }

  if (!isRequiredField(data.hireDate)) {
    errors.push({ field: 'hireDate', message: 'La date d\'embauche est obligatoire' });
  } else if (!isValidDate(data.hireDate)) {
    errors.push({ field: 'hireDate', message: 'La date d\'embauche n\'est pas valide' });
  } else if (dateOfBirth && !isHireDateValid(data.hireDate, dateOfBirth)) {
    errors.push({ field: 'hireDate', message: 'L\'âge à l\'embauche doit être d\'au moins 16 ans' });
  }

  if (data.isMedicalStaff) {
    if (!isRequiredField(data.specialization)) {
      errors.push({ field: 'specialization', message: 'La spécialisation est obligatoire pour le personnel médical' });
    }
  }

  return errors;
}

export function validateBankingInfo(data: BankingInfoData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.iban && !isValidIBAN(data.iban)) {
    errors.push({ field: 'iban', message: 'L\'IBAN n\'est pas valide' });
  }

  if (data.bic && !isValidBIC(data.bic)) {
    errors.push({ field: 'bic', message: 'Le code BIC n\'est pas valide' });
  }

  if (data.iban && !data.accountHolder) {
    errors.push({ field: 'accountHolder', message: 'Le titulaire du compte est requis si un IBAN est fourni' });
  }

  return errors;
}

export function validateEmergencyContact(data: EmergencyContactData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isRequiredField(data.fullName)) {
    errors.push({ field: 'fullName', message: 'Le nom complet du contact d\'urgence est obligatoire' });
  } else if (!hasMinLength(data.fullName, 2)) {
    errors.push({ field: 'fullName', message: 'Le nom complet doit contenir au moins 2 caractères' });
  }

  if (!isRequiredField(data.relationship)) {
    errors.push({ field: 'relationship', message: 'Le lien de parenté est obligatoire' });
  }

  if (!isRequiredField(data.phone)) {
    errors.push({ field: 'phone', message: 'Le numéro de téléphone est obligatoire' });
  } else if (!isValidFrenchPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Le numéro de téléphone n\'est pas valide' });
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'L\'email n\'est pas valide' });
  }

  return errors;
}

export function validateCompleteForm(formData: EmployeeFormData): ValidationError[] {
  const allErrors: ValidationError[] = [];

  const personalErrors = validatePersonalInfo(formData.personalInfo);
  const academicErrors = validateAcademicBackground(
    formData.academicBackground,
    formData.professionalInfo.hireDate
  );
  const contactErrors = validateContactDetails(formData.contactDetails);
  const professionalErrors = validateProfessionalInfo(
    formData.professionalInfo,
    formData.personalInfo.dateOfBirth
  );
  const bankingErrors = validateBankingInfo(formData.bankingInfo);
  const emergencyErrors = validateEmergencyContact(formData.emergencyContact);

  allErrors.push(...personalErrors);
  allErrors.push(...academicErrors);
  allErrors.push(...contactErrors);
  allErrors.push(...professionalErrors);
  allErrors.push(...bankingErrors);
  allErrors.push(...emergencyErrors);

  return allErrors;
}

export function calculateStepCompletionPercentage(
  formData: EmployeeFormData,
  stepNumber: number
): number {
  let filledFields = 0;
  let totalFields = 0;

  switch (stepNumber) {
    case 1: {
      const data = formData.personalInfo;
      totalFields = 7;
      if (data.firstName) filledFields++;
      if (data.lastName) filledFields++;
      if (data.dateOfBirth) filledFields++;
      if (data.placeOfBirth) filledFields++;
      if (data.nationality) filledFields++;
      if (data.socialSecurityNumber) filledFields++;
      if (data.gender) filledFields++;
      break;
    }
    case 2: {
      const data = formData.academicBackground;
      if (data.educationEntries.length === 0) {
        return 100;
      }

      data.educationEntries.forEach((entry) => {
        totalFields += 5;
        if (entry.educationLevel) filledFields++;
        if (entry.degreeTitle) filledFields++;
        if (entry.institution) filledFields++;
        if (entry.graduationYear) filledFields++;
        if (entry.keySkills.length > 0) filledFields++;
      });
      break;
    }
    case 3: {
      const data = formData.contactDetails;
      totalFields = 9;
      if (data.professionalEmail) filledFields++;
      if (data.personalEmail) filledFields++;
      if (data.primaryPhone) filledFields++;
      if (data.secondaryPhone) filledFields++;
      if (data.streetAddress) filledFields++;
      if (data.addressNumber) filledFields++;
      if (data.postalCode) filledFields++;
      if (data.city) filledFields++;
      if (data.country) filledFields++;
      break;
    }
    case 4: {
      const data = formData.professionalInfo;
      totalFields = 5;
      if (data.departmentId) filledFields++;
      if (data.position) filledFields++;
      if (data.contractType) filledFields++;
      if (data.employmentStatus) filledFields++;
      if (data.hireDate) filledFields++;
      break;
    }
    case 5: {
      const data = formData.bankingInfo;
      totalFields = 5;
      if (data.bankName) filledFields++;
      if (data.iban) filledFields++;
      if (data.bic) filledFields++;
      if (data.accountHolder) filledFields++;
      if (data.currency) filledFields++;
      break;
    }
    case 6: {
      const data = formData.emergencyContact;
      totalFields = 5;
      if (data.fullName) filledFields++;
      if (data.relationship) filledFields++;
      if (data.phone) filledFields++;
      if (data.email) filledFields++;
      if (data.address) filledFields++;
      break;
    }
    default:
      return 0;
  }

  return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
}

export function calculateOverallCompletionPercentage(formData: EmployeeFormData): number {
  let totalPercentage = 0;
  for (let step = 1; step <= 6; step++) {
    totalPercentage += calculateStepCompletionPercentage(formData, step);
  }
  return Math.round(totalPercentage / 6);
}
