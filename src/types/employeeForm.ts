export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export enum EducationLevel {
  BAC = 'Bac',
  BAC_PLUS_2 = 'Bac+2',
  LICENCE = 'Licence',
  MASTER = 'Master',
  DOCTORAT = 'Doctorat',
}

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'Stage',
  FREELANCE = 'Freelance',
  INTERIM = 'Intérim',
}

export enum EmploymentStatus {
  CADRE = 'Cadre',
  NON_CADRE = 'Non-Cadre',
}

export enum RelationshipType {
  SPOUSE = 'Conjoint(e)',
  CHILD = 'Enfant',
  PARENT = 'Parent',
  SIBLING = 'Frère/Soeur',
  FRIEND = 'Ami(e)',
  OTHER = 'Autre',
}

export enum Gender {
  MALE = 'Masculin',
  FEMALE = 'Féminin',
  OTHER = 'Autre',
}

export interface PersonalInfoData {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  socialSecurityNumber: string;
  gender: Gender | '';
}

export interface ContactDetailsData {
  professionalEmail: string;
  personalEmail: string;
  primaryPhone: string;
  secondaryPhone: string;
  streetAddress: string;
  addressNumber: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface ProfessionalInfoData {
  departmentId: string;
  position: string;
  contractType: ContractType | '';
  employmentStatus: EmploymentStatus | '';
  hireDate: string;
  isMedicalStaff: boolean;
  rppsNumber: string;
  specialization: string;
}

export interface BankingInfoData {
  bankName: string;
  iban: string;
  bic: string;
  accountHolder: string;
  currency: string;
}

export interface EmergencyContactData {
  fullName: string;
  relationship: RelationshipType | '';
  phone: string;
  email: string;
  address: string;
}

export interface AcademicBackgroundEntry {
  id: string;
  educationLevel: EducationLevel | '';
  degreeTitle: string;
  institution: string;
  graduationYear: number | '';
  keySkills: string[];
}

export interface AcademicBackgroundData {
  educationEntries: AcademicBackgroundEntry[];
}

export interface EmployeeFormData {
  personalInfo: PersonalInfoData;
  academicBackground: AcademicBackgroundData;
  contactDetails: ContactDetailsData;
  professionalInfo: ProfessionalInfoData;
  bankingInfo: BankingInfoData;
  emergencyContact: EmergencyContactData;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface StepValidationErrors {
  [stepNumber: number]: ValidationError[];
}

export interface DraftMetadata {
  id: string;
  name: string;
  currentStep: StepNumber;
  completedSteps: StepNumber[];
  lastUpdated: string;
  completionPercentage: number;
}

export interface EmployeeDraft {
  id: string;
  created_by: string;
  draft_name: string | null;
  draft_data: EmployeeFormData;
  current_step: number;
  completed_steps: number[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const INITIAL_FORM_DATA: EmployeeFormData = {
  personalInfo: {
    employeeNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: 'République Démocratique du Congo',
    socialSecurityNumber: '',
    gender: '',
  },
  academicBackground: {
    educationEntries: [],
  },
  contactDetails: {
    professionalEmail: '',
    personalEmail: '',
    primaryPhone: '',
    secondaryPhone: '',
    streetAddress: '',
    addressNumber: '',
    postalCode: '',
    city: '',
    country: 'République Démocratique du Congo',
  },
  professionalInfo: {
    departmentId: '',
    position: '',
    contractType: '',
    employmentStatus: '',
    hireDate: '',
    isMedicalStaff: false,
    rppsNumber: '',
    specialization: '',
  },
  bankingInfo: {
    bankName: '',
    iban: '',
    bic: '',
    accountHolder: '',
    currency: 'USD',
  },
  emergencyContact: {
    fullName: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
  },
};

export const STEP_NAMES: Record<StepNumber, string> = {
  1: 'Informations Personnelles',
  2: 'Parcours Académique',
  3: 'Coordonnées',
  4: 'Informations Professionnelles',
  5: 'Informations Bancaires',
  6: 'Contact d\'Urgence',
  7: 'Révision et Confirmation',
};

export const STEP_DESCRIPTIONS: Record<StepNumber, string> = {
  1: 'Identité et informations civiles',
  2: 'Formation et compétences académiques',
  3: 'Adresse et contacts',
  4: 'Poste et département',
  5: 'Coordonnées bancaires',
  6: 'Personne à contacter',
  7: 'Vérification finale',
};
