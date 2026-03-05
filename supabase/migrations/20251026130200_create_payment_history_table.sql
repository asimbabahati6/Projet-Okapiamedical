/*
  # Création de la Table d'Historique des Paiements

  ## Description
  Cette migration crée une table pour enregistrer l'historique complet des paiements
  effectués sur les factures. Chaque paiement est tracé avec son montant, sa méthode,
  et l'utilisateur qui l'a enregistré.

  ## Tables Créées

  1. **payment_history** - Historique des paiements de factures
     - id (uuid, clé primaire)
     - invoice_id (uuid, référence vers invoices)
     - payment_amount (numeric) - Montant payé
     - payment_method (text) - Méthode de paiement
     - payment_date (timestamptz) - Date et heure du paiement
     - transaction_reference (text) - Référence de transaction
     - notes (text) - Notes sur le paiement
     - recorded_by (uuid, référence vers user_profiles) - Qui a enregistré le paiement
     - created_at (timestamptz)

  ## Indexes
  - Index sur invoice_id pour retrouver l'historique d'une facture
  - Index sur payment_date pour les rapports temporels
  - Index sur recorded_by pour l'audit

  ## Sécurité
  - Politiques RLS pour contrôler l'accès
  - SELECT accessible selon les rôles
  - INSERT réservé aux rôles autorisés à gérer la facturation
*/

-- Créer la table payment_history
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_amount numeric NOT NULL CHECK (payment_amount > 0),
  payment_method text NOT NULL,
  payment_date timestamptz DEFAULT now(),
  transaction_reference text,
  notes text,
  recorded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice_id
ON payment_history(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_payment_date
ON payment_history(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payment_history_recorded_by
ON payment_history(recorded_by);

-- Activer RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: accessible aux utilisateurs authentifiés ayant accès à la facturation
CREATE POLICY "Users can view payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor')
    )
  );

-- Politique INSERT: réservé au personnel de facturation et administrateurs
CREATE POLICY "Billing staff can create payment records"
  ON payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist')
    )
  );

-- Politique UPDATE: aucune mise à jour autorisée (historique immuable)
CREATE POLICY "Payment history is immutable"
  ON payment_history
  FOR UPDATE
  TO authenticated
  USING (false);

-- Politique DELETE: réservé aux super administrateurs uniquement
CREATE POLICY "Only super admins can delete payment records"
  ON payment_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Commentaires
COMMENT ON TABLE payment_history IS 'Historique complet de tous les paiements effectués sur les factures';
COMMENT ON COLUMN payment_history.invoice_id IS 'Référence vers la facture payée';
COMMENT ON COLUMN payment_history.payment_amount IS 'Montant du paiement effectué';
COMMENT ON COLUMN payment_history.payment_method IS 'Méthode de paiement utilisée (espèces, carte, mobile money, assurance, etc.)';
COMMENT ON COLUMN payment_history.payment_date IS 'Date et heure du paiement';
COMMENT ON COLUMN payment_history.transaction_reference IS 'Référence ou numéro de transaction pour traçabilité';
COMMENT ON COLUMN payment_history.recorded_by IS 'Utilisateur ayant enregistré ce paiement dans le système';
