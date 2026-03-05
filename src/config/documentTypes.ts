import { LucideIcon, FileText, TestTube, Award, Pill, LogOut, Heart, FileEdit } from 'lucide-react';

export interface DocumentTypeConfig {
  type: string;
  name: string;
  nameEn: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  defaultSections: Array<{
    title: string;
    type: 'text' | 'table' | 'list';
    placeholder?: string;
  }>;
}

export const DOCUMENT_TYPES: Record<string, DocumentTypeConfig> = {
  consultation_report: {
    type: 'consultation_report',
    name: 'Rapports de Consultation',
    nameEn: 'Consultation Reports',
    description: 'Rapports détaillés des consultations médicales avec diagnostic et plan de traitement',
    icon: FileText,
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    defaultSections: [
      { title: 'Motif de Consultation', type: 'text', placeholder: 'Raison de la visite...' },
      { title: 'Anamnèse', type: 'text', placeholder: 'Historique médical pertinent...' },
      { title: 'Examen Clinique', type: 'text', placeholder: 'Observations cliniques...' },
      { title: 'Diagnostic', type: 'text', placeholder: 'Diagnostic médical...' },
      { title: 'Plan de Traitement', type: 'text', placeholder: 'Recommandations et traitement...' },
    ],
  },
  laboratory_results: {
    type: 'laboratory_results',
    name: 'Résultats de Laboratoire',
    nameEn: 'Laboratory Results',
    description: 'Résultats des examens et analyses de laboratoire',
    icon: TestTube,
    color: '#10B981',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100',
    defaultSections: [
      { title: 'Tests Effectués', type: 'table' },
      { title: 'Résultats', type: 'table' },
      { title: 'Interprétation', type: 'text', placeholder: 'Interprétation des résultats...' },
      { title: 'Recommandations', type: 'list' },
    ],
  },
  medical_certificate: {
    type: 'medical_certificate',
    name: 'Certificats Médicaux',
    nameEn: 'Medical Certificates',
    description: 'Certificats médicaux pour arrêt de travail, aptitude, etc.',
    icon: Award,
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:bg-purple-100',
    defaultSections: [
      { title: 'Type de Certificat', type: 'text', placeholder: 'Type de certificat médical...' },
      { title: 'Observations Médicales', type: 'text', placeholder: 'Constatations médicales...' },
      { title: 'Durée', type: 'text', placeholder: 'Durée de validité...' },
      { title: 'Restrictions', type: 'list' },
    ],
  },
  prescription_summary: {
    type: 'prescription_summary',
    name: 'Résumés de Prescription',
    nameEn: 'Prescription Summaries',
    description: 'Résumés détaillés des prescriptions médicamenteuses',
    icon: Pill,
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverColor: 'hover:bg-amber-100',
    defaultSections: [
      { title: 'Médicaments Prescrits', type: 'table' },
      { title: 'Posologie', type: 'table' },
      { title: 'Instructions Spéciales', type: 'list' },
      { title: 'Précautions', type: 'text', placeholder: 'Précautions et avertissements...' },
    ],
  },
  discharge_report: {
    type: 'discharge_report',
    name: 'Rapports de Sortie',
    nameEn: 'Discharge Reports',
    description: 'Rapports de sortie hospitalière avec résumé du séjour',
    icon: LogOut,
    color: '#EF4444',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverColor: 'hover:bg-red-100',
    defaultSections: [
      { title: "Motif d'Hospitalisation", type: 'text', placeholder: "Raison de l'admission..." },
      { title: 'Résumé du Séjour', type: 'text', placeholder: 'Résumé du séjour hospitalier...' },
      { title: 'Traitements Effectués', type: 'list' },
      { title: 'Instructions de Sortie', type: 'text', placeholder: 'Instructions pour le patient...' },
      { title: 'Suivi Recommandé', type: 'text', placeholder: 'Suivi médical nécessaire...' },
    ],
  },
  nursing_notes: {
    type: 'nursing_notes',
    name: "Notes d'Infirmière",
    nameEn: 'Nursing Notes',
    description: 'Notes de suivi infirmier et observations',
    icon: Heart,
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverColor: 'hover:bg-pink-100',
    defaultSections: [
      { title: 'Observations', type: 'text', placeholder: 'Observations du patient...' },
      { title: 'Signes Vitaux', type: 'table' },
      { title: 'Soins Prodigués', type: 'list' },
      { title: 'Réactions du Patient', type: 'text', placeholder: 'Réponse aux soins...' },
    ],
  },
  prescription: {
    type: 'prescription',
    name: 'Ordonnances',
    nameEn: 'Prescriptions',
    description: 'Ordonnances médicales complètes',
    icon: FileText,
    color: '#06B6D4',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverColor: 'hover:bg-cyan-100',
    defaultSections: [
      { title: 'Diagnostic', type: 'text', placeholder: 'Diagnostic principal...' },
      { title: 'Prescriptions', type: 'table' },
      { title: 'Durée du Traitement', type: 'text', placeholder: 'Durée totale...' },
      { title: 'Conseils', type: 'list' },
    ],
  },
  custom_document: {
    type: 'custom_document',
    name: 'Documents Personnalisés',
    nameEn: 'Custom Documents',
    description: 'Documents médicaux personnalisés selon les besoins',
    icon: FileEdit,
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:bg-gray-100',
    defaultSections: [],
  },
};

export const DOCUMENT_TYPE_LIST = Object.values(DOCUMENT_TYPES);

export function getDocumentTypeConfig(type: string): DocumentTypeConfig | undefined {
  return DOCUMENT_TYPES[type];
}

export function getDocumentTypeIcon(type: string): LucideIcon {
  return DOCUMENT_TYPES[type]?.icon || FileText;
}

export function getDocumentTypeColor(type: string): string {
  return DOCUMENT_TYPES[type]?.color || '#6B7280';
}
