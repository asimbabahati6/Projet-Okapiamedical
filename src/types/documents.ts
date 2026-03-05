export enum DocumentType {
  CONTRACT = 'Contrat',
  BANK_DETAILS = 'Coordonnées Bancaires',
  DIPLOMA = 'Diplôme',
  ID_CARD = 'Carte d\'Identité',
  CV = 'CV',
  MEDICAL_CERTIFICATE = 'Certificat Médical',
  OTHER = 'Autre',
}

export const DOCUMENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Contrat': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Coordonnées Bancaires': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Diplôme': { bg: 'bg-green-100', text: 'text-green-700' },
  'Carte d\'Identité': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'CV': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Certificat Médical': { bg: 'bg-red-100', text: 'text-red-700' },
  'Autre': { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export interface DocumentUploadRequest {
  file: File;
  documentType: string;
  notes?: string;
}

export interface DocumentPreview {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  createdAt: string;
  canPreview: boolean;
}
