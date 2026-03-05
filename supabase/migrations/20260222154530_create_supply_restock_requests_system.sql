/*
  # Supply Restock Requests System for Hygiene Role

  1. Tables
    - supply_restock_requests - Requests from hygiene staff
    - supply_categories - Categories of supplies

  2. Permissions
    - Hygiene: Submit requests, view own requests
    - Gestionnaire: Approve/reject requests, view all
    - Directeur Général: Full access

  3. Features
    - Request workflow (pending -> approved/rejected)
    - Approval tracking
    - Request history
*/

CREATE TABLE IF NOT EXISTS supply_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO supply_categories (name, description) VALUES
  ('Produits de nettoyage', 'Détergents, désinfectants, savons'),
  ('Équipement de protection', 'Gants, masques, tabliers'),
  ('Matériel de nettoyage', 'Balais, serpillières, seaux'),
  ('Consommables', 'Sacs poubelle, essuie-tout, papier'),
  ('Équipement spécialisé', 'Autoclaves, stérilisateurs, etc.')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS supply_restock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES auth.users(id) NOT NULL,
  category_id uuid REFERENCES supply_categories(id),
  item_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  urgency text DEFAULT 'normal' CHECK (urgency IN ('urgent', 'normal', 'low')),
  justification text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'received')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_comments text,
  estimated_cost numeric(10, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_supply_requests_status ON supply_restock_requests(status);
CREATE INDEX idx_supply_requests_requested_by ON supply_restock_requests(requested_by);
CREATE INDEX idx_supply_requests_category ON supply_restock_requests(category_id);

ALTER TABLE supply_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_restock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supply categories" ON supply_categories FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can view their own requests" ON supply_restock_requests FOR SELECT TO authenticated
USING (requested_by = auth.uid());

CREATE POLICY "Managers can view all requests" ON supply_restock_requests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('directeur_general', 'gestionnaire', 'logistician')
  )
);

CREATE POLICY "Hygiene staff can create requests" ON supply_restock_requests FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('hygiene', 'directeur_general', 'gestionnaire', 'logistician')
  )
  AND requested_by = auth.uid()
);

CREATE POLICY "Managers can update requests" ON supply_restock_requests FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('directeur_general', 'gestionnaire', 'logistician')
  )
);

CREATE OR REPLACE FUNCTION approve_supply_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_action text,
  p_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE supply_restock_requests
  SET 
    status = p_action,
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_comments = p_comments,
    updated_at = now()
  WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_supply_request_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_supply_request_timestamp
  BEFORE UPDATE ON supply_restock_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_supply_request_timestamp();

CREATE OR REPLACE VIEW pending_supply_requests AS
SELECT 
  sr.id,
  sr.item_name,
  sr.quantity,
  sr.unit,
  sr.urgency,
  sr.justification,
  sr.estimated_cost,
  sr.created_at,
  sc.name as category_name,
  up.full_name as requested_by_name,
  EXTRACT(EPOCH FROM (now() - sr.created_at))/86400 as days_pending
FROM supply_restock_requests sr
JOIN supply_categories sc ON sr.category_id = sc.id
JOIN user_profiles up ON sr.requested_by = up.id
WHERE sr.status = 'pending'
ORDER BY 
  CASE sr.urgency 
    WHEN 'urgent' THEN 1
    WHEN 'normal' THEN 2
    WHEN 'low' THEN 3
  END,
  sr.created_at ASC;

GRANT SELECT ON pending_supply_requests TO authenticated;

COMMENT ON TABLE supply_restock_requests IS 'Supply restock requests from hygiene staff with approval workflow';
COMMENT ON FUNCTION approve_supply_request IS 'Approve or reject supply requests - reserved for gestionnaire and above';
