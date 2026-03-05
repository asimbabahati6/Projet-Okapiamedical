import { StaffType, StaffCategory } from '../types/database';
import {
  Stethoscope,
  Heart,
  Activity,
  TestTube,
  Users,
  Briefcase,
  Pill,
  UserCheck,
  Microscope,
  Radio,
  Syringe,
  Wind,
  HandHeart,
  MessageCircle,
  Brain,
  Apple,
  ClipboardList,
  FileText,
  HeartPulse,
  Ambulance,
  MoreHorizontal,
  Smile
} from 'lucide-react';

export interface StaffTypeConfig {
  type: StaffType;
  category: StaffCategory;
  displayName: string;
  displayNamePlural: string;
  icon: any;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
}

export const STAFF_TYPE_CONFIGS: Record<StaffType, StaffTypeConfig> = {
  medecin: {
    type: 'medecin',
    category: 'medical',
    displayName: 'Médecin',
    displayNamePlural: 'Médecins',
    icon: Stethoscope,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Médecins et spécialistes médicaux',
    requiredFields: ['license_number', 'specialization', 'rpps_number'],
    optionalFields: ['consultation_fee', 'bio', 'telemedicine_enabled']
  },
  dentiste: {
    type: 'dentiste',
    category: 'medical',
    displayName: 'Dentiste',
    displayNamePlural: 'Dentistes',
    icon: Smile,
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    description: 'Chirurgiens-dentistes et stomatologues',
    requiredFields: ['license_number', 'specialization'],
    optionalFields: ['consultation_fee', 'bio', 'medical_order_number']
  },
  infirmier: {
    type: 'infirmier',
    category: 'nursing',
    displayName: 'Infirmier',
    displayNamePlural: 'Infirmiers',
    icon: Heart,
    color: 'rose',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    description: 'Infirmiers diplômés d\'État',
    requiredFields: ['license_number', 'adeli_number'],
    optionalFields: ['specialization', 'ward_assignments']
  },
  infirmier_specialise: {
    type: 'infirmier_specialise',
    category: 'nursing',
    displayName: 'Infirmier Spécialisé',
    displayNamePlural: 'Infirmiers Spécialisés',
    icon: HeartPulse,
    color: 'pink',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-800',
    description: 'Infirmiers spécialisés (anesthésie, bloc, DE, etc.)',
    requiredFields: ['license_number', 'adeli_number', 'specialization'],
    optionalFields: ['certifications_list']
  },
  aide_soignant: {
    type: 'aide_soignant',
    category: 'nursing',
    displayName: 'Aide-Soignant',
    displayNamePlural: 'Aides-Soignants',
    icon: UserCheck,
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    description: 'Aides-soignants',
    requiredFields: ['license_number'],
    optionalFields: ['ward_assignments']
  },
  technicien_laboratoire: {
    type: 'technicien_laboratoire',
    category: 'technical',
    displayName: 'Technicien de Laboratoire',
    displayNamePlural: 'Techniciens de Laboratoire',
    icon: Microscope,
    color: 'cyan',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    description: 'Techniciens de laboratoire médical',
    requiredFields: ['license_number'],
    optionalFields: ['laboratory_sections', 'equipment_certifications']
  },
  technicien_radiologie: {
    type: 'technicien_radiologie',
    category: 'technical',
    displayName: 'Technicien de Radiologie',
    displayNamePlural: 'Techniciens de Radiologie',
    icon: Radio,
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    description: 'Manipulateurs en électroradiologie médicale',
    requiredFields: ['license_number'],
    optionalFields: ['imaging_modalities', 'radiation_safety_certified']
  },
  technicien_anesthesie: {
    type: 'technicien_anesthesie',
    category: 'technical',
    displayName: 'Technicien d\'Anesthésie',
    displayNamePlural: 'Techniciens d\'Anesthésie',
    icon: Wind,
    color: 'slate',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-800',
    description: 'Infirmiers anesthésistes',
    requiredFields: ['license_number', 'specialization'],
    optionalFields: ['equipment_certifications']
  },
  kinesitherapeute: {
    type: 'kinesitherapeute',
    category: 'therapy',
    displayName: 'Kinésithérapeute',
    displayNamePlural: 'Kinésithérapeutes',
    icon: Activity,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    description: 'Masseurs-kinésithérapeutes',
    requiredFields: ['license_number', 'adeli_number'],
    optionalFields: ['therapy_specializations', 'home_visit_enabled', 'consultation_fee']
  },
  ergotherapeute: {
    type: 'ergotherapeute',
    category: 'therapy',
    displayName: 'Ergothérapeute',
    displayNamePlural: 'Ergothérapeutes',
    icon: HandHeart,
    color: 'lime',
    bgColor: 'bg-lime-100',
    textColor: 'text-lime-800',
    description: 'Ergothérapeutes',
    requiredFields: ['license_number', 'adeli_number'],
    optionalFields: ['therapy_specializations', 'home_visit_enabled']
  },
  orthophoniste: {
    type: 'orthophoniste',
    category: 'therapy',
    displayName: 'Orthophoniste',
    displayNamePlural: 'Orthophonistes',
    icon: MessageCircle,
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    description: 'Orthophonistes',
    requiredFields: ['license_number', 'adeli_number'],
    optionalFields: ['therapy_specializations', 'consultation_fee']
  },
  psychologue: {
    type: 'psychologue',
    category: 'therapy',
    displayName: 'Psychologue',
    displayNamePlural: 'Psychologues',
    icon: Brain,
    color: 'violet',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-800',
    description: 'Psychologues cliniciens',
    requiredFields: ['license_number'],
    optionalFields: ['specialization', 'consultation_fee', 'telemedicine_enabled']
  },
  dieteticien: {
    type: 'dieteticien',
    category: 'therapy',
    displayName: 'Diététicien',
    displayNamePlural: 'Diététiciens',
    icon: Apple,
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    description: 'Diététiciens nutritionnistes',
    requiredFields: ['license_number'],
    optionalFields: ['specialization', 'consultation_fee']
  },
  assistant_medical: {
    type: 'assistant_medical',
    category: 'administrative',
    displayName: 'Assistant Médical',
    displayNamePlural: 'Assistants Médicaux',
    icon: ClipboardList,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    description: 'Assistants médicaux',
    requiredFields: [],
    optionalFields: ['departments_assigned', 'scheduling_permissions', 'billing_access']
  },
  secretaire_medical: {
    type: 'secretaire_medical',
    category: 'administrative',
    displayName: 'Secrétaire Médical',
    displayNamePlural: 'Secrétaires Médicaux',
    icon: FileText,
    color: 'stone',
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-800',
    description: 'Secrétaires médicaux',
    requiredFields: [],
    optionalFields: ['departments_assigned', 'can_manage_appointments']
  },
  pharmacien: {
    type: 'pharmacien',
    category: 'pharmacy',
    displayName: 'Pharmacien',
    displayNamePlural: 'Pharmaciens',
    icon: Pill,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    description: 'Pharmaciens',
    requiredFields: ['license_number'],
    optionalFields: ['specialization', 'can_prescribe_controlled_substances']
  },
  preparateur_pharmacie: {
    type: 'preparateur_pharmacie',
    category: 'pharmacy',
    displayName: 'Préparateur en Pharmacie',
    displayNamePlural: 'Préparateurs en Pharmacie',
    icon: TestTube,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    description: 'Préparateurs en pharmacie',
    requiredFields: ['license_number'],
    optionalFields: ['pharmacy_certifications']
  },
  travailleur_social: {
    type: 'travailleur_social',
    category: 'support',
    displayName: 'Travailleur Social',
    displayNamePlural: 'Travailleurs Sociaux',
    icon: Users,
    color: 'sky',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-800',
    description: 'Assistants sociaux',
    requiredFields: ['license_number'],
    optionalFields: ['specialization']
  },
  ambulancier: {
    type: 'ambulancier',
    category: 'support',
    displayName: 'Ambulancier',
    displayNamePlural: 'Ambulanciers',
    icon: Ambulance,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    description: 'Ambulanciers',
    requiredFields: ['license_number'],
    optionalFields: []
  },
  autre: {
    type: 'autre',
    category: 'other',
    displayName: 'Autre',
    displayNamePlural: 'Autres',
    icon: MoreHorizontal,
    color: 'neutral',
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-800',
    description: 'Autre personnel médical',
    requiredFields: [],
    optionalFields: []
  }
};

export const STAFF_CATEGORIES: Record<StaffCategory, { label: string; types: StaffType[] }> = {
  medical: {
    label: 'Personnel Médical',
    types: ['medecin', 'dentiste']
  },
  nursing: {
    label: 'Personnel Soignant',
    types: ['infirmier', 'infirmier_specialise', 'aide_soignant']
  },
  technical: {
    label: 'Personnel Technique',
    types: ['technicien_laboratoire', 'technicien_radiologie', 'technicien_anesthesie']
  },
  therapy: {
    label: 'Thérapeutes',
    types: ['kinesitherapeute', 'ergotherapeute', 'orthophoniste', 'psychologue', 'dieteticien']
  },
  administrative: {
    label: 'Personnel Administratif',
    types: ['assistant_medical', 'secretaire_medical']
  },
  pharmacy: {
    label: 'Personnel Pharmaceutique',
    types: ['pharmacien', 'preparateur_pharmacie']
  },
  support: {
    label: 'Personnel de Support',
    types: ['travailleur_social', 'ambulancier']
  },
  other: {
    label: 'Autres',
    types: ['autre']
  }
};

export function getStaffTypeConfig(type: StaffType): StaffTypeConfig {
  return STAFF_TYPE_CONFIGS[type];
}

export function getStaffTypesByCategory(category: StaffCategory): StaffType[] {
  return STAFF_CATEGORIES[category].types;
}

export function getAllStaffTypes(): StaffType[] {
  return Object.keys(STAFF_TYPE_CONFIGS) as StaffType[];
}

export function getCategoryForStaffType(type: StaffType): StaffCategory {
  return STAFF_TYPE_CONFIGS[type].category;
}

export function getStaffTypeIcon(type: StaffType) {
  return STAFF_TYPE_CONFIGS[type].icon;
}

export function getStaffTypeDisplayName(type: StaffType): string {
  return STAFF_TYPE_CONFIGS[type].displayName;
}

export function getStaffTypeColor(type: StaffType): { bg: string; text: string } {
  const config = STAFF_TYPE_CONFIGS[type];
  return {
    bg: config.bgColor,
    text: config.textColor
  };
}
