import { supabase } from '../lib/supabase';
import { MedicalCodeSearchResult } from '../types/database';

export async function searchMedicalCodes(
  searchTerm: string,
  codeSystem: 'icd10' | 'ccam' | 'loinc' | 'snomed' = 'icd10',
  limitResults: number = 20
): Promise<MedicalCodeSearchResult[]> {
  try {
    const { data, error } = await supabase.rpc('search_medical_codes', {
      search_term: searchTerm,
      code_system: codeSystem,
      limit_results: limitResults,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching medical codes:', error);
    return [];
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'légère':
    case 'léger':
    case 'faible':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'modérée':
    case 'modéré':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'sévère':
    case 'élevé':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'critique':
    case 'anaphylaxie':
    case 'très_élevé':
    case 'fatal':
      return 'text-red-900 bg-red-100 border-red-300';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'actif':
    case 'confirmé':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'résolu':
    case 'contrôlé':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'chronique':
    case 'récurrent':
      return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'suspecté':
    case 'en_attente':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'révoqué':
    case 'expiré':
    case 'suspendu':
      return 'text-gray-700 bg-gray-50 border-gray-200';
    case 'rémission':
      return 'text-teal-700 bg-teal-50 border-teal-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export function getAllergyTypeIcon(type: string): string {
  switch (type) {
    case 'médicament':
      return '💊';
    case 'aliment':
      return '🍽️';
    case 'environnement':
      return '🌿';
    case 'insecte':
      return '🐝';
    case 'latex':
      return '🧤';
    default:
      return '⚠️';
  }
}

export function getRiskCategoryIcon(category: string): string {
  switch (category) {
    case 'cardiovasculaire':
      return '❤️';
    case 'métabolique':
      return '🩺';
    case 'comportemental':
      return '🚬';
    case 'environnemental':
      return '🌍';
    case 'génétique':
      return '🧬';
    case 'infectieux':
      return '🦠';
    default:
      return '⚠️';
  }
}

export function formatINSQualificationStatus(status: string): string {
  switch (status) {
    case 'qualifié':
      return 'Qualifié';
    case 'provisoire':
      return 'Provisoire';
    case 'non_qualifié':
      return 'Non qualifié';
    case 'en_cours_validation':
      return 'En cours de validation';
    default:
      return status;
  }
}

export function getINSQualificationColor(status: string): string {
  switch (status) {
    case 'qualifié':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'provisoire':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'non_qualifié':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'en_cours_validation':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export function formatRelationship(relationship: string): string {
  const relationshipMap: Record<string, string> = {
    'père': 'Père',
    'mère': 'Mère',
    'frère': 'Frère',
    'soeur': 'Sœur',
    'fils': 'Fils',
    'fille': 'Fille',
    'grand-père_paternel': 'Grand-père paternel',
    'grand-mère_paternelle': 'Grand-mère paternelle',
    'grand-père_maternel': 'Grand-père maternel',
    'grand-mère_maternelle': 'Grand-mère maternelle',
    'oncle': 'Oncle',
    'tante': 'Tante',
    'cousin': 'Cousin',
    'cousine': 'Cousine',
    'autre': 'Autre',
  };
  return relationshipMap[relationship] || relationship;
}

export function formatConsentType(type: string): string {
  const consentTypeMap: Record<string, string> = {
    'soins_généraux': 'Soins généraux',
    'soins_spécifiques': 'Soins spécifiques',
    'recherche_clinique': 'Recherche clinique',
    'partage_données': 'Partage de données',
    'télémédecine': 'Télémédecine',
    'photographie_médicale': 'Photographie médicale',
    'enseignement': 'Enseignement',
    'don_organes': 'Don d\'organes',
    'transfusion': 'Transfusion',
    'anesthésie': 'Anesthésie',
    'autre': 'Autre',
  };
  return consentTypeMap[type] || type;
}

export function formatDirectiveType(type: string): string {
  const directiveTypeMap: Record<string, string> = {
    'limitation_soins': 'Limitation de soins',
    'refus_traitement': 'Refus de traitement',
    'personne_confiance': 'Personne de confiance',
    'don_organes': 'Don d\'organes',
    'soins_palliatifs': 'Soins palliatifs',
    'réanimation': 'Réanimation',
    'autre': 'Autre',
  };
  return directiveTypeMap[type] || type;
}
