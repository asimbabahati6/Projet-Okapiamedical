import { Patient } from './database';

export interface MedicalDocumentTemplate {
  id: string;
  document_type: string;
  template_name: string;
  template_name_en: string;
  description: string | null;
  default_sections: DocumentSection[];
  is_active: boolean;
  display_order: number;
  icon: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalDocument {
  id: string;
  document_number: string;
  document_type: string;
  template_id: string | null;
  patient_id: string;
  created_by: string;
  title: string;
  content_sections: DocumentSection[];
  status: 'draft' | 'finalized' | 'archived' | 'deleted';
  version: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  template?: MedicalDocumentTemplate;
}

export interface DocumentSection {
  title: string;
  content?: string | string[];
  type?: 'text' | 'table' | 'list';
  placeholder?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export interface PatientDocumentAssignment {
  id: string;
  patient_id: string;
  template_id: string;
  assigned_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
  template?: MedicalDocumentTemplate;
}

export interface PatientWithDocuments extends Patient {
  medical_history?: string[] | null;
  document_count?: number;
  document_types?: string[];
  assigned_documents?: PatientDocumentAssignment[];
}

export interface DocumentFilter {
  documentType?: string;
  status?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentExportOptions {
  format: 'pdf' | 'docx';
  includeHeader: boolean;
  includeFooter: boolean;
  watermark?: string;
}
