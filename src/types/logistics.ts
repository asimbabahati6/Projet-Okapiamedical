// Types pour le système de gestion logistique

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent_category?: InventoryCategory;
  subcategories?: InventoryCategory[];
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  website: string | null;
  payment_terms: string | null;
  rating: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type InventoryStatus = 'normal' | 'low' | 'critical' | 'out_of_stock' | 'overstocked' | 'expired';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  category_id: string | null;
  supplier_id: string | null;
  current_quantity: number;
  min_quantity: number;
  max_quantity: number;
  reorder_point: number | null;
  unit: string;
  unit_price: number;
  total_value: number;
  expiry_date: string | null;
  batch_number: string | null;
  location: string | null;
  status: InventoryStatus;
  photo_url: string | null;
  notes: string | null;
  last_restock_date: string | null;
  created_at: string;
  updated_at: string;
  category?: InventoryCategory;
  supplier?: Supplier;
}

export type MovementType = 'entry' | 'exit' | 'adjustment' | 'transfer' | 'return' | 'loss' | 'expiry';

export interface StockMovement {
  id: string;
  item_id: string;
  movement_type: MovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  performed_by: string | null;
  validated_by: string | null;
  reason: string;
  reference_number: string | null;
  source_location: string | null;
  destination_location: string | null;
  notes: string | null;
  document_url: string | null;
  created_at: string;
  item?: InventoryItem;
  performer?: {
    id: string;
    full_name: string;
  };
  validator?: {
    id: string;
    full_name: string;
  };
}

export type AlertType = 'low_stock' | 'out_of_stock' | 'critical_stock' | 'expiring_soon' | 'expired' | 'overstocked';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface LogisticsStockAlert {
  id: string;
  item_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  threshold_value: number | null;
  is_active: boolean;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  expires_at: string | null;
  item?: InventoryItem;
  acknowledger?: {
    id: string;
    full_name: string;
  };
}

// Types pour les statistiques et filtres
export interface InventoryStats {
  total_items: number;
  total_value: number;
  critical_items: number;
  low_stock_items: number;
  expired_items: number;
  active_alerts: number;
  total_categories: number;
  total_suppliers: number;
}

export interface StockFilter {
  search?: string;
  category_id?: string;
  supplier_id?: string;
  status?: InventoryStatus | 'all';
  min_quantity?: number;
  max_quantity?: number;
  expiry_date_from?: string;
  expiry_date_to?: string;
}

export interface MovementFilter {
  item_id?: string;
  movement_type?: MovementType | 'all';
  date_from?: string;
  date_to?: string;
  performed_by?: string;
}

export interface AlertFilter {
  severity?: AlertSeverity | 'all';
  alert_type?: AlertType | 'all';
  is_active?: boolean;
  acknowledged?: boolean;
}

// Types pour les formulaires
export interface InventoryItemFormData {
  name: string;
  description?: string;
  sku?: string;
  category_id?: string;
  supplier_id?: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity: number;
  reorder_point?: number;
  unit: string;
  unit_price: number;
  expiry_date?: string;
  batch_number?: string;
  location?: string;
  notes?: string;
  photo_url?: string;
}

export interface StockMovementFormData {
  item_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  reference_number?: string;
  source_location?: string;
  destination_location?: string;
  notes?: string;
  document_url?: string;
}

export interface SupplierFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  payment_terms?: string;
  rating?: number;
  notes?: string;
}

// Types pour les rapports
export interface StockReport {
  generated_at: string;
  period_start: string;
  period_end: string;
  total_items: number;
  total_value: number;
  items_by_category: {
    category: string;
    count: number;
    value: number;
  }[];
  low_stock_items: InventoryItem[];
  expired_items: InventoryItem[];
  movements_summary: {
    entries: number;
    exits: number;
    adjustments: number;
  };
}

export interface StockRotation {
  item_id: string;
  item_name: string;
  total_exits: number;
  avg_stock: number;
  rotation_rate: number;
  period_days: number;
}
