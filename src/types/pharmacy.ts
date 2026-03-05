export type MedicationCategory =
  | 'Antibiotique'
  | 'Antalgique'
  | 'Anti-inflammatoire'
  | 'Antipyrétique'
  | 'Antihypertenseur'
  | 'Antidiabétique'
  | 'Antipaludéen'
  | 'Vitamines'
  | 'Supplément'
  | 'Autre';

export type DosageForm =
  | 'Comprimé'
  | 'Gélule'
  | 'Sirop'
  | 'Suspension'
  | 'Solution injectable'
  | 'Pommade'
  | 'Crème'
  | 'Gouttes'
  | 'Inhalateur'
  | 'Suppositoire'
  | 'Autre';

export type StockMovementType =
  | 'in'
  | 'out'
  | 'adjustment'
  | 'expired'
  | 'damaged'
  | 'return';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Medication {
  id: string;
  medication_code: string;
  generic_name: string;
  brand_name: string | null;
  category: MedicationCategory | null;
  dosage_form: DosageForm | null;
  strength: string | null;
  unit_price: number | null;
  quantity_in_stock: number | null;
  reorder_level: number | null;
  expiry_date: string | null;
  supplier: string | null;
  is_controlled_substance: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationBatch {
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
}

export interface MedicationStockAlert {
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
}

export interface MedicationFormData {
  medication_code?: string;
  generic_name: string;
  brand_name?: string | null;
  category?: MedicationCategory | null;
  dosage_form?: DosageForm | null;
  strength?: string | null;
  unit_price?: number;
  quantity_in_stock?: number;
  reorder_level?: number;
  supplier?: string | null;
  is_controlled_substance?: boolean;
  is_active?: boolean;
  batch_number?: string;
  manufacture_date?: string;
  expiry_date?: string;
}

export interface PharmacyStats {
  total_medications: number;
  low_stock_count: number;
  expiring_soon_count: number;
  total_stock_value: number;
  out_of_stock_count: number;
}

export interface StockMovement {
  id: string;
  medication_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  performed_by: string;
  created_at: string;
  medication?: {
    generic_name: string;
    brand_name: string | null;
  };
}

export interface MedicationWithBatches extends Medication {
  batches: MedicationBatch[];
  alerts: MedicationStockAlert[];
}
