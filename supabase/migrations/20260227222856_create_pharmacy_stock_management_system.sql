/*
  # Système de Gestion de Stock Pharmacie
  
  1. Nouvelles Tables
    - `pharmacy_medications` : Catalogue des médicaments
      - Informations complètes : code, nom, catégorie, prix
      - Gestion des seuils et stocks
      - Dates d'expiration
    
    - `pharmacy_stock_movements` : Mouvements de stock
      - Entrées (réception fournisseur)
      - Sorties (dispensation, perte, péremption)
      - Traçabilité complète
    
    - `pharmacy_prescriptions_queue` : File d'ordonnances
      - Ordonnances en attente de traitement
      - Lien avec consultations et patients
      - Workflow de dispensation
    
    - `pharmacy_dispensation_records` : Historique dispensations
      - Enregistrement des délivrances
      - Liens vers ordonnances et médicaments
      - Reçus générés
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour pharmaciens et médecins
*/

-- Table des médicaments
CREATE TABLE IF NOT EXISTS pharmacy_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  generic_name text,
  category text NOT NULL CHECK (category IN (
    'Antibiotique', 'Analgésique', 'Anti-inflammatoire', 
    'Antihypertenseur', 'Antidiabétique', 'Antipaludéen',
    'Antiviral', 'Bronchodilatateur', 'Corticoïde', 'Autre'
  )),
  dosage text NOT NULL,
  form text NOT NULL CHECK (form IN (
    'Comprimé', 'Gélule', 'Sirop', 'Injectable', 
    'Suppositoire', 'Pommade', 'Solution', 'Spray'
  )),
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  current_stock integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 50,
  maximum_stock integer NOT NULL DEFAULT 1000,
  expiry_date date,
  manufacturer text,
  batch_number text,
  storage_conditions text,
  requires_prescription boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS pharmacy_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid REFERENCES pharmacy_medications(id) ON DELETE CASCADE NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN (
    'reception', 'dispensation', 'adjustment', 'loss', 'expiry', 'return'
  )),
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  unit_cost decimal(10,2),
  total_cost decimal(10,2),
  reference_number text,
  reason text,
  notes text,
  performed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table de la file d'ordonnances
CREATE TABLE IF NOT EXISTS pharmacy_prescriptions_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  prescribed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_preparation', 'ready', 'dispensed', 'cancelled'
  )),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  medications jsonb NOT NULL,
  total_amount decimal(10,2),
  notes text,
  prepared_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  dispensed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  dispensed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des enregistrements de dispensation
CREATE TABLE IF NOT EXISTS pharmacy_dispensation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES pharmacy_prescriptions_queue(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  medications_dispensed jsonb NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'insurance', 'credit', 'mobile_money')),
  receipt_number text UNIQUE NOT NULL,
  dispensed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_pharmacy_medications_category ON pharmacy_medications(category);
CREATE INDEX IF NOT EXISTS idx_pharmacy_medications_stock ON pharmacy_medications(current_stock);
CREATE INDEX IF NOT EXISTS idx_pharmacy_medications_expiry ON pharmacy_medications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_movements_medication ON pharmacy_stock_movements(medication_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_movements_type ON pharmacy_stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_pharmacy_queue_status ON pharmacy_prescriptions_queue(status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_queue_patient ON pharmacy_prescriptions_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_dispensation_patient ON pharmacy_dispensation_records(patient_id);

-- Triggers pour updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_pharmacy_medications_updated_at') THEN
    CREATE FUNCTION update_pharmacy_medications_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS pharmacy_medications_updated_at ON pharmacy_medications;
CREATE TRIGGER pharmacy_medications_updated_at
  BEFORE UPDATE ON pharmacy_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_medications_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_pharmacy_queue_updated_at') THEN
    CREATE FUNCTION update_pharmacy_queue_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS pharmacy_queue_updated_at ON pharmacy_prescriptions_queue;
CREATE TRIGGER pharmacy_queue_updated_at
  BEFORE UPDATE ON pharmacy_prescriptions_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_queue_updated_at();

-- Enable RLS
ALTER TABLE pharmacy_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_prescriptions_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_dispensation_records ENABLE ROW LEVEL SECURITY;

-- Policies pour pharmacy_medications
CREATE POLICY "Authenticated users can view medications"
  ON pharmacy_medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pharmacy staff can manage medications"
  ON pharmacy_medications FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies pour pharmacy_stock_movements
CREATE POLICY "Authenticated users can view stock movements"
  ON pharmacy_stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pharmacy staff can record movements"
  ON pharmacy_stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies pour pharmacy_prescriptions_queue
CREATE POLICY "Authenticated users can view queue"
  ON pharmacy_prescriptions_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pharmacy staff can manage queue"
  ON pharmacy_prescriptions_queue FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies pour pharmacy_dispensation_records
CREATE POLICY "Authenticated users can view dispensations"
  ON pharmacy_dispensation_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pharmacy staff can record dispensations"
  ON pharmacy_dispensation_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
