export type MedicationCategory =
  | 'Antibiotique'
  | 'Antalgique'
  | 'Anti-inflammatoire'
  | 'Cardiovasculaire'
  | 'Antidiabétique'
  | 'Antiparasitaire'
  | 'Gastro-intestinal'
  | 'Respiratoire'
  | 'Vitamine'
  | 'Dermatologie'
  | 'Neurologique'
  | 'Obstétrique'
  | 'Ophtalmologie'
  | 'Antihypertenseur'
  | 'Antipaludéen'
  | 'Antiviral'
  | 'Bronchodilatateur'
  | 'Corticoïde'
  | 'Autre';

export type DosageForm =
  | 'Comprimé'
  | 'Gélule'
  | 'Sirop'
  | 'Injectable'
  | 'Suppositoire'
  | 'Pommade'
  | 'Solution'
  | 'Spray'
  | 'Crème'
  | 'Collyre'
  | 'Inhalateur'
  | 'Poudre';

export type StockMovementType =
  | 'reception'
  | 'dispensation'
  | 'adjustment'
  | 'loss'
  | 'expiry'
  | 'return';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PharmacyMedication {
  id: string;
  code: string;
  name: string;
  generic_name: string | null;
  category: MedicationCategory;
  dosage: string;
  form: DosageForm;
  unit_price: number;
  currency: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  expiry_date: string | null;
  manufacturer: string | null;
  batch_number: string | null;
  storage_conditions: string | null;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  medication_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference_number: string | null;
  reason: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  medication?: PharmacyMedication;
}

export interface PrescriptionQueueItem {
  id: string;
  prescription_id: string | null;
  patient_id: string;
  prescribed_by: string | null;
  status: 'pending' | 'in_preparation' | 'ready' | 'dispensed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'emergency';
  medications: PrescriptionMedication[];
  total_amount: number | null;
  notes: string | null;
  prepared_by: string | null;
  dispensed_by: string | null;
  dispensed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionMedication {
  medication_id: string;
  name: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

export interface DispensationRecord {
  id: string;
  queue_id: string | null;
  patient_id: string;
  medications_dispensed: PrescriptionMedication[];
  total_amount: number;
  payment_method: string | null;
  receipt_number: string;
  dispensed_by: string;
  notes: string | null;
  created_at: string;
}

export interface PharmacyStats {
  total_medications: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expiring_soon_count: number;
  total_stock_value: number;
  dispensed_today: number;
  total_categories: number;
}

export interface MedicationFormData {
  code?: string;
  name: string;
  generic_name?: string | null;
  category: MedicationCategory;
  dosage: string;
  form: DosageForm;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  expiry_date?: string | null;
  manufacturer?: string | null;
  batch_number?: string | null;
  storage_conditions?: string | null;
  requires_prescription: boolean;
}

// Legacy types kept for backward compatibility with other modules
export type Medication = PharmacyMedication;
export type MedicationBatch = {
  id: string;
  medication_id: string;
  batch_number: string;
  quantity: number;
  unit_cost_cdf: number | null;
  unit_cost_usd: number | null;
  manufacture_date: string | null;
  expiry_date: string;
  supplier: string | null;
  received_date: string | null;
  notes: string | null;
  created_at: string;
};
export type MedicationStockAlert = {
  id: string;
  alert_type: string;
  medication_id: string | null;
  batch_id: string | null;
  alert_message: string;
  severity: AlertSeverity;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};
