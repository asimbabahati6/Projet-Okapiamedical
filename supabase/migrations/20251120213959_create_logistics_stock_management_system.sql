/*
  # Système de Gestion des Stocks Logistiques

  1. Tables: inventory_categories, suppliers, inventory_items, stock_movements, logistics_stock_alerts
  2. Fonctions: generate_sku
  3. Triggers: Auto-update quantities, alerts
  4. RLS: Logistician + Super Admin
*/

CREATE TABLE IF NOT EXISTS inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  parent_category_id uuid REFERENCES inventory_categories(id) ON DELETE SET NULL,
  icon text DEFAULT 'Package',
  color text DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'République Démocratique du Congo',
  website text,
  payment_terms text,
  rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE NOT NULL,
  category_id uuid REFERENCES inventory_categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  current_quantity decimal(10,2) DEFAULT 0 CHECK (current_quantity >= 0),
  min_quantity decimal(10,2) DEFAULT 10,
  max_quantity decimal(10,2) DEFAULT 1000,
  reorder_point decimal(10,2),
  unit text DEFAULT 'unité',
  unit_price decimal(10,2) DEFAULT 0,
  total_value decimal(12,2) GENERATED ALWAYS AS (current_quantity * unit_price) STORED,
  expiry_date date,
  batch_number text,
  location text,
  status text DEFAULT 'normal' CHECK (status IN ('normal', 'low', 'critical', 'out_of_stock', 'overstocked', 'expired')),
  photo_url text,
  notes text,
  last_restock_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_quantities CHECK (min_quantity < max_quantity)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment', 'transfer', 'return', 'loss', 'expiry')),
  quantity decimal(10,2) NOT NULL,
  previous_quantity decimal(10,2) NOT NULL,
  new_quantity decimal(10,2) NOT NULL,
  performed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  validated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  reference_number text,
  source_location text,
  destination_location text,
  notes text,
  document_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logistics_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'critical_stock', 'expiring_soon', 'expired', 'overstocked')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  threshold_value decimal(10,2),
  is_active boolean DEFAULT true,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_logistics_alerts_item ON logistics_stock_alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_logistics_alerts_active ON logistics_stock_alerts(is_active, severity);

CREATE OR REPLACE FUNCTION generate_sku()
RETURNS text AS $$
DECLARE
  new_sku text;
  sku_exists boolean;
BEGIN
  LOOP
    new_sku := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
    SELECT EXISTS(SELECT 1 FROM inventory_items WHERE sku = new_sku) INTO sku_exists;
    EXIT WHEN NOT sku_exists;
  END LOOP;
  RETURN new_sku;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER trigger_update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_inventory_quantity_after_movement()
RETURNS TRIGGER AS $$
DECLARE
  item_min decimal;
  item_max decimal;
BEGIN
  SELECT min_quantity, max_quantity INTO item_min, item_max
  FROM inventory_items WHERE id = NEW.item_id;
  
  UPDATE inventory_items
  SET
    current_quantity = NEW.new_quantity,
    last_restock_date = CASE WHEN NEW.movement_type = 'entry' THEN now() ELSE last_restock_date END,
    status = CASE
      WHEN NEW.new_quantity = 0 THEN 'out_of_stock'
      WHEN NEW.new_quantity < (item_min * 0.5) THEN 'critical'
      WHEN NEW.new_quantity < item_min THEN 'low'
      WHEN NEW.new_quantity > item_max THEN 'overstocked'
      ELSE 'normal'
    END
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_on_movement ON stock_movements;
CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_quantity_after_movement();

CREATE OR REPLACE FUNCTION check_stock_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE logistics_stock_alerts SET is_active = false
  WHERE item_id = NEW.id
    AND alert_type IN ('low_stock', 'critical_stock', 'out_of_stock', 'overstocked')
    AND is_active = true;

  IF NEW.current_quantity = 0 THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, threshold_value, is_active)
    VALUES (NEW.id, 'out_of_stock', 'critical', 'Stock épuisé: ' || NEW.name, 0, true);
  ELSIF NEW.current_quantity < (NEW.min_quantity * 0.5) THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, threshold_value, is_active)
    VALUES (NEW.id, 'critical_stock', 'critical', 'Stock critique: ' || NEW.name, NEW.min_quantity * 0.5, true);
  ELSIF NEW.current_quantity < NEW.min_quantity THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, threshold_value, is_active)
    VALUES (NEW.id, 'low_stock', 'high', 'Stock faible: ' || NEW.name, NEW.min_quantity, true);
  ELSIF NEW.current_quantity > NEW.max_quantity THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, threshold_value, is_active)
    VALUES (NEW.id, 'overstocked', 'low', 'Surstock: ' || NEW.name, NEW.max_quantity, true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_stock_thresholds ON inventory_items;
CREATE TRIGGER trigger_check_stock_thresholds
  AFTER INSERT OR UPDATE OF current_quantity ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_thresholds();

CREATE OR REPLACE FUNCTION check_expiry_dates()
RETURNS TRIGGER AS $$
DECLARE
  days_until_expiry integer;
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    days_until_expiry := NEW.expiry_date - CURRENT_DATE;
    
    UPDATE logistics_stock_alerts SET is_active = false
    WHERE item_id = NEW.id AND alert_type IN ('expired', 'expiring_soon') AND is_active = true;

    IF days_until_expiry < 0 THEN
      UPDATE inventory_items SET status = 'expired' WHERE id = NEW.id;
      INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active, expires_at)
      VALUES (NEW.id, 'expired', 'critical', 'Article expiré: ' || NEW.name, true, now() + interval '90 days');
    ELSIF days_until_expiry <= 7 THEN
      INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active, expires_at)
      VALUES (NEW.id, 'expiring_soon', 'critical', 'Expiration imminente: ' || NEW.name || ' (' || days_until_expiry || ' jours)', true, NEW.expiry_date);
    ELSIF days_until_expiry <= 30 THEN
      INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active, expires_at)
      VALUES (NEW.id, 'expiring_soon', 'medium', 'Expiration prochaine: ' || NEW.name || ' (' || days_until_expiry || ' jours)', true, NEW.expiry_date);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_expiry_dates ON inventory_items;
CREATE TRIGGER trigger_check_expiry_dates
  AFTER INSERT OR UPDATE OF expiry_date ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION check_expiry_dates();

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Logisticien admins categories" ON inventory_categories;
CREATE POLICY "Logisticien admins categories"
  ON inventory_categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id WHERE up.id = auth.uid() AND r.name IN ('logistician', 'super_admin', 'hospital_admin')));

DROP POLICY IF EXISTS "All view categories" ON inventory_categories;
CREATE POLICY "All view categories"
  ON inventory_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Logisticien admins suppliers" ON suppliers;
CREATE POLICY "Logisticien admins suppliers"
  ON suppliers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id WHERE up.id = auth.uid() AND r.name IN ('logistician', 'super_admin', 'hospital_admin')));

DROP POLICY IF EXISTS "All view suppliers" ON suppliers;
CREATE POLICY "All view suppliers"
  ON suppliers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Logisticien admins inventory" ON inventory_items;
CREATE POLICY "Logisticien admins inventory"
  ON inventory_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id WHERE up.id = auth.uid() AND r.name IN ('logistician', 'super_admin', 'hospital_admin')));

DROP POLICY IF EXISTS "All view inventory" ON inventory_items;
CREATE POLICY "All view inventory"
  ON inventory_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Logisticien admins movements" ON stock_movements;
CREATE POLICY "Logisticien admins movements"
  ON stock_movements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id WHERE up.id = auth.uid() AND r.name IN ('logistician', 'super_admin', 'hospital_admin')));

DROP POLICY IF EXISTS "All view movements" ON stock_movements;
CREATE POLICY "All view movements"
  ON stock_movements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Logisticien admins logistics alerts" ON logistics_stock_alerts;
CREATE POLICY "Logisticien admins logistics alerts"
  ON logistics_stock_alerts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id WHERE up.id = auth.uid() AND r.name IN ('logistician', 'super_admin', 'hospital_admin')));

DROP POLICY IF EXISTS "All view logistics alerts" ON logistics_stock_alerts;
CREATE POLICY "All view logistics alerts"
  ON logistics_stock_alerts FOR SELECT TO authenticated USING (true);

INSERT INTO inventory_categories (name, description, icon, color, sort_order) VALUES
('Médicaments', 'Médicaments et produits pharmaceutiques', 'Pill', '#EF4444', 1),
('Matériel Médical', 'Équipements et instruments médicaux', 'Stethoscope', '#3B82F6', 2),
('Consommables', 'Fournitures médicales consommables', 'Package', '#10B981', 3),
('Équipement de Protection', 'EPI et équipements de sécurité', 'Shield', '#F59E0B', 4),
('Matériel de Laboratoire', 'Fournitures et réactifs de laboratoire', 'TestTube', '#8B5CF6', 5),
('Matériel Administratif', 'Fournitures de bureau', 'FileText', '#6B7280', 6),
('Hygiène et Entretien', 'Produits d''hygiène', 'Sparkles', '#14B8A6', 7)
ON CONFLICT (name) DO NOTHING;