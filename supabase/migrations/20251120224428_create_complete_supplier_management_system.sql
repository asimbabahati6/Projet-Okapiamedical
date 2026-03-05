/*
  # Système de Gestion Complète des Fournisseurs - Phase 5

  ## Vue d'ensemble
  Système complet de gestion des fournisseurs incluant:
  - Contacts multiples par fournisseur
  - Gestion des commandes (Purchase Orders)
  - Bons de livraison et réceptions
  - Évaluation de performance
  - Historique complet et statistiques

  ## 1. Tables Créées

  ### supplier_contacts
  - Gestion de contacts multiples par fournisseur
  - Permet plusieurs interlocuteurs (commercial, technique, financier)

  ### supplier_categories
  - Catégories de produits fournis par chaque fournisseur
  - Relation N-N entre fournisseurs et catégories d'inventaire

  ### purchase_orders (Bons de Commande)
  - Commandes passées aux fournisseurs
  - Workflow complet: brouillon → envoyé → confirmé → reçu → clôturé
  - Tracking des délais et conformité

  ### purchase_order_items (Lignes de Commande)
  - Détail des articles commandés
  - Quantités, prix, statuts individuels

  ### delivery_notes (Bons de Livraison)
  - Enregistrement des livraisons fournisseurs
  - Vérification conformité quantités et qualité
  - Écarts et non-conformités

  ### delivery_note_items (Lignes de Livraison)
  - Détail des articles livrés
  - Quantités commandées vs reçues
  - État qualité

  ### supplier_evaluations (Évaluations Fournisseurs)
  - KPIs: délai, qualité, prix, service
  - Scoring automatique
  - Commentaires et recommandations

  ### supplier_documents (Documents Fournisseurs)
  - Contrats, certifications, factures
  - Gestion documentaire complète

  ## 2. Vues Statistiques

  ### supplier_performance_stats
  - Vue agrégée des performances fournisseurs
  - Calcul automatique KPIs

  ## 3. Fonctions

  ### calculate_supplier_rating()
  - Calcul automatique du rating basé sur évaluations
  - Mise à jour automatique

  ### auto_close_purchase_order()
  - Clôture automatique commandes 100% reçues

  ### generate_po_number()
  - Génération automatique numéros de commande

  ### generate_delivery_number()
  - Génération automatique numéros BL

  ## 4. Triggers

  ### update_supplier_rating_trigger
  - Recalcul rating après évaluation

  ### auto_close_po_trigger
  - Clôture auto des commandes complètes

  ### update_updated_at triggers
  - Mise à jour automatique timestamps

  ## 5. Sécurité RLS

  - Logisticiens: Accès complet (CREATE, READ, UPDATE, DELETE)
  - Super Admin: Accès complet
  - Autres rôles: Lecture seule (SELECT)
*/

-- ============================================================================
-- 1. CONTACTS FOURNISSEURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text,
  department text,
  email text,
  phone text,
  mobile text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);

COMMENT ON TABLE supplier_contacts IS 'Contacts multiples par fournisseur (commercial, technique, financier)';

-- ============================================================================
-- 2. CATÉGORIES FOURNISSEURS (Produits fournis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES inventory_categories(id) ON DELETE CASCADE,
  is_preferred boolean DEFAULT false,
  lead_time_days integer DEFAULT 15,
  minimum_order_quantity decimal(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_categories_supplier ON supplier_categories(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_categories_category ON supplier_categories(category_id);

COMMENT ON TABLE supplier_categories IS 'Catégories de produits fournis par chaque fournisseur';

-- ============================================================================
-- 3. BONS DE COMMANDE (Purchase Orders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_date date DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  actual_delivery_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'closed', 'cancelled')),
  total_amount decimal(12,2) DEFAULT 0,
  currency text DEFAULT 'FC',
  payment_terms text,
  shipping_address text,
  delivery_instructions text,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date DESC);

COMMENT ON TABLE purchase_orders IS 'Bons de commande fournisseurs avec workflow complet';

-- ============================================================================
-- 4. LIGNES DE COMMANDE (Purchase Order Items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_ordered decimal(10,2) NOT NULL CHECK (quantity_ordered > 0),
  quantity_received decimal(10,2) DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(12,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'received', 'cancelled')),
  expected_delivery_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT quantity_received_not_greater CHECK (quantity_received <= quantity_ordered)
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_item ON purchase_order_items(item_id);

COMMENT ON TABLE purchase_order_items IS 'Lignes de commande détaillées';

-- ============================================================================
-- 5. BONS DE LIVRAISON (Delivery Notes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number text UNIQUE NOT NULL,
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  delivery_date date DEFAULT CURRENT_DATE,
  received_date timestamptz DEFAULT now(),
  received_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  validated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  validated_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'complete', 'rejected')),
  is_conforming boolean,
  non_conformity_details text,
  carrier_name text,
  tracking_number text,
  notes text,
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_notes_supplier ON delivery_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_po ON delivery_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON delivery_notes(delivery_date DESC);

COMMENT ON TABLE delivery_notes IS 'Bons de livraison fournisseurs avec validation qualité';

-- ============================================================================
-- 6. LIGNES DE LIVRAISON (Delivery Note Items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_id uuid NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  po_item_id uuid REFERENCES purchase_order_items(id) ON DELETE SET NULL,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_ordered decimal(10,2),
  quantity_received decimal(10,2) NOT NULL CHECK (quantity_received >= 0),
  quantity_accepted decimal(10,2) DEFAULT 0 CHECK (quantity_accepted >= 0),
  quantity_rejected decimal(10,2) DEFAULT 0 CHECK (quantity_rejected >= 0),
  quality_status text DEFAULT 'ok' CHECK (quality_status IN ('ok', 'damaged', 'expired', 'wrong_item', 'missing')),
  batch_number text,
  expiry_date date,
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_quantities CHECK (quantity_accepted + quantity_rejected = quantity_received)
);

CREATE INDEX IF NOT EXISTS idx_delivery_items_note ON delivery_note_items(delivery_note_id);
CREATE INDEX IF NOT EXISTS idx_delivery_items_item ON delivery_note_items(item_id);

COMMENT ON TABLE delivery_note_items IS 'Lignes de livraison avec contrôle qualité';

-- ============================================================================
-- 7. ÉVALUATIONS FOURNISSEURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  evaluation_date date DEFAULT CURRENT_DATE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- KPIs (sur 5)
  delivery_time_score integer CHECK (delivery_time_score >= 1 AND delivery_time_score <= 5),
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  price_competitiveness_score integer CHECK (price_competitiveness_score >= 1 AND price_competitiveness_score <= 5),
  service_score integer CHECK (service_score >= 1 AND service_score <= 5),
  communication_score integer CHECK (communication_score >= 1 AND communication_score <= 5),
  
  -- Score global automatique
  overall_score decimal(3,2) GENERATED ALWAYS AS (
    (delivery_time_score + quality_score + price_competitiveness_score + service_score + communication_score)::decimal / 5
  ) STORED,
  
  -- Statistiques
  total_orders integer DEFAULT 0,
  on_time_deliveries integer DEFAULT 0,
  conforming_deliveries integer DEFAULT 0,
  total_amount_spent decimal(12,2) DEFAULT 0,
  
  -- Taux calculés
  on_time_rate decimal(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_orders > 0 THEN (on_time_deliveries::decimal / total_orders * 100) ELSE 0 END
  ) STORED,
  conformity_rate decimal(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_orders > 0 THEN (conforming_deliveries::decimal / total_orders * 100) ELSE 0 END
  ) STORED,
  
  comments text,
  recommendations text,
  evaluated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_supplier ON supplier_evaluations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_date ON supplier_evaluations(evaluation_date DESC);

COMMENT ON TABLE supplier_evaluations IS 'Évaluations périodiques des fournisseurs avec KPIs';

-- ============================================================================
-- 8. DOCUMENTS FOURNISSEURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('contract', 'certificate', 'license', 'insurance', 'invoice', 'quote', 'other')),
  document_name text NOT NULL,
  document_url text NOT NULL,
  file_size integer,
  mime_type text,
  issue_date date,
  expiry_date date,
  is_active boolean DEFAULT true,
  notes text,
  uploaded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier ON supplier_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_type ON supplier_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_expiry ON supplier_documents(expiry_date) WHERE expiry_date IS NOT NULL;

COMMENT ON TABLE supplier_documents IS 'Documents administratifs et contractuels des fournisseurs';

-- ============================================================================
-- 9. VUE STATISTIQUES FOURNISSEURS
-- ============================================================================

CREATE OR REPLACE VIEW supplier_performance_stats AS
SELECT 
  s.id AS supplier_id,
  s.name AS supplier_name,
  s.rating AS current_rating,
  
  -- Commandes
  COUNT(DISTINCT po.id) AS total_orders,
  COUNT(DISTINCT CASE WHEN po.status = 'closed' THEN po.id END) AS completed_orders,
  COUNT(DISTINCT CASE WHEN po.status = 'cancelled' THEN po.id END) AS cancelled_orders,
  
  -- Montants
  COALESCE(SUM(po.total_amount), 0) AS total_amount_spent,
  COALESCE(AVG(po.total_amount), 0) AS average_order_value,
  
  -- Délais
  AVG(
    CASE 
      WHEN po.actual_delivery_date IS NOT NULL AND po.expected_delivery_date IS NOT NULL 
      THEN po.actual_delivery_date - po.expected_delivery_date 
    END
  ) AS average_delay_days,
  
  COUNT(
    CASE 
      WHEN po.actual_delivery_date IS NOT NULL 
        AND po.expected_delivery_date IS NOT NULL 
        AND po.actual_delivery_date <= po.expected_delivery_date 
      THEN 1 
    END
  ) AS on_time_deliveries,
  
  -- Taux de ponctualité
  CASE 
    WHEN COUNT(CASE WHEN po.actual_delivery_date IS NOT NULL THEN 1 END) > 0 
    THEN (COUNT(
      CASE 
        WHEN po.actual_delivery_date <= po.expected_delivery_date 
        THEN 1 
      END
    )::decimal / COUNT(CASE WHEN po.actual_delivery_date IS NOT NULL THEN 1 END) * 100)
    ELSE 0 
  END AS on_time_delivery_rate,
  
  -- Livraisons
  COUNT(DISTINCT dn.id) AS total_deliveries,
  COUNT(DISTINCT CASE WHEN dn.is_conforming = true THEN dn.id END) AS conforming_deliveries,
  
  -- Taux de conformité
  CASE 
    WHEN COUNT(DISTINCT dn.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN dn.is_conforming = true THEN dn.id END)::decimal / COUNT(DISTINCT dn.id) * 100)
    ELSE 0 
  END AS conformity_rate,
  
  -- Dernière évaluation
  (SELECT overall_score FROM supplier_evaluations 
   WHERE supplier_id = s.id 
   ORDER BY evaluation_date DESC LIMIT 1) AS latest_evaluation_score,
  
  (SELECT evaluation_date FROM supplier_evaluations 
   WHERE supplier_id = s.id 
   ORDER BY evaluation_date DESC LIMIT 1) AS latest_evaluation_date,
  
  -- Dates
  MAX(po.order_date) AS last_order_date,
  MAX(dn.delivery_date) AS last_delivery_date

FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
LEFT JOIN delivery_notes dn ON s.id = dn.supplier_id
GROUP BY s.id, s.name, s.rating;

COMMENT ON VIEW supplier_performance_stats IS 'Vue agrégée des performances et statistiques fournisseurs';

-- ============================================================================
-- 10. FONCTION: CALCUL RATING FOURNISSEUR
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_supplier_rating(p_supplier_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_score decimal;
  v_rating integer;
BEGIN
  -- Calculer moyenne des scores des 12 derniers mois
  SELECT AVG(overall_score)
  INTO v_avg_score
  FROM supplier_evaluations
  WHERE supplier_id = p_supplier_id
    AND evaluation_date >= CURRENT_DATE - INTERVAL '12 months';
  
  -- Si aucune évaluation, garder rating actuel ou défaut
  IF v_avg_score IS NULL THEN
    SELECT rating INTO v_rating FROM suppliers WHERE id = p_supplier_id;
    RETURN COALESCE(v_rating, 3);
  END IF;
  
  -- Convertir score (1-5 décimal) en rating (1-5 entier)
  v_rating := ROUND(v_avg_score)::integer;
  
  -- Mise à jour du rating
  UPDATE suppliers
  SET rating = v_rating,
      updated_at = now()
  WHERE id = p_supplier_id;
  
  RETURN v_rating;
END;
$$;

COMMENT ON FUNCTION calculate_supplier_rating IS 'Calcule et met à jour le rating fournisseur basé sur les évaluations';

-- ============================================================================
-- 11. FONCTION: CLÔTURE AUTO COMMANDE
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_close_purchase_order(p_po_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_all_received boolean;
BEGIN
  -- Vérifier si tous les items sont reçus
  SELECT bool_and(quantity_received >= quantity_ordered)
  INTO v_all_received
  FROM purchase_order_items
  WHERE purchase_order_id = p_po_id;
  
  -- Si tout est reçu, clôturer la commande
  IF v_all_received = true THEN
    UPDATE purchase_orders
    SET status = 'closed',
        actual_delivery_date = CURRENT_DATE,
        updated_at = now()
    WHERE id = p_po_id
      AND status != 'closed';
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

COMMENT ON FUNCTION auto_close_purchase_order IS 'Clôture automatiquement une commande si tous les items sont reçus';

-- ============================================================================
-- 12. FONCTION: GÉNÉRER NUMÉRO COMMANDE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text;
  v_month text;
  v_sequence integer;
  v_po_number text;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Compter commandes du mois
  SELECT COUNT(*) + 1
  INTO v_sequence
  FROM purchase_orders
  WHERE TO_CHAR(order_date, 'YYYY-MM') = v_year || '-' || v_month;
  
  -- Format: PO-YYYY-MM-0001
  v_po_number := 'PO-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_po_number;
END;
$$;

-- ============================================================================
-- 13. FONCTION: GÉNÉRER NUMÉRO BON DE LIVRAISON
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text;
  v_month text;
  v_sequence integer;
  v_dn_number text;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Compter livraisons du mois
  SELECT COUNT(*) + 1
  INTO v_sequence
  FROM delivery_notes
  WHERE TO_CHAR(delivery_date, 'YYYY-MM') = v_year || '-' || v_month;
  
  -- Format: BL-YYYY-MM-0001
  v_dn_number := 'BL-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_dn_number;
END;
$$;

-- ============================================================================
-- 14. TRIGGERS
-- ============================================================================

-- Trigger: Mise à jour rating après évaluation
CREATE OR REPLACE FUNCTION trigger_update_supplier_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM calculate_supplier_rating(NEW.supplier_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_supplier_rating_trigger ON supplier_evaluations;
CREATE TRIGGER update_supplier_rating_trigger
  AFTER INSERT OR UPDATE ON supplier_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_supplier_rating();

-- Trigger: Clôture auto commande après réception items
CREATE OR REPLACE FUNCTION trigger_auto_close_po()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quantity_received >= NEW.quantity_ordered THEN
    PERFORM auto_close_purchase_order(NEW.purchase_order_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_close_po_trigger ON purchase_order_items;
CREATE TRIGGER auto_close_po_trigger
  AFTER UPDATE OF quantity_received ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_close_po();

-- Trigger: Mise à jour timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_supplier_contacts_updated_at ON supplier_contacts;
CREATE TRIGGER update_supplier_contacts_updated_at
  BEFORE UPDATE ON supplier_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_po_items_updated_at ON purchase_order_items;
CREATE TRIGGER update_po_items_updated_at
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_notes_updated_at ON delivery_notes;
CREATE TRIGGER update_delivery_notes_updated_at
  BEFORE UPDATE ON delivery_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_documents_updated_at ON supplier_documents;
CREATE TRIGGER update_supplier_documents_updated_at
  BEFORE UPDATE ON supplier_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_documents ENABLE ROW LEVEL SECURITY;

-- Policies: Logisticiens et Super Admin - Accès complet
CREATE POLICY "Logisticians full access to supplier_contacts"
  ON supplier_contacts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Logisticians full access to supplier_categories"
  ON supplier_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Logisticians full access to purchase_orders"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Logisticians full access to po_items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Logisticians full access to delivery_notes"
  ON delivery_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Logisticians full access to delivery_items"
  ON delivery_note_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Logisticians full access to evaluations"
  ON supplier_evaluations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

CREATE POLICY "Logisticians full access to supplier_documents"
  ON supplier_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

-- Policies: Autres rôles - Lecture seule
CREATE POLICY "Others read access to supplier_contacts"
  ON supplier_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Others read access to supplier_categories"
  ON supplier_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Others read access to purchase_orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Others read access to po_items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Others read access to delivery_notes"
  ON delivery_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Others read access to delivery_items"
  ON delivery_note_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Others read access to evaluations"
  ON supplier_evaluations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Others read access to supplier_documents"
  ON supplier_documents FOR SELECT
  TO authenticated
  USING (true);
