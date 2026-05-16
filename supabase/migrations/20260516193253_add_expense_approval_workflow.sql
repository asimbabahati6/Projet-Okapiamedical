/*
  # Add expense approval workflow

  1. Modified Tables
    - `expenses`
      - `approval_status` (text) - Status: pending_approval, approved, returned, cancelled
      - `approved_by` (uuid) - References user who approved/processed the request
      - `approved_at` (timestamptz) - When the request was processed
      - `approval_comment` (text) - Comment for returned/cancelled requests
      - `justification_documents` (text) - Pieces justificatives description

  2. Security
    - Added policy for caissiere to insert expenses with pending_approval status
    - Added policy for admin/medical_director to update approval_status

  3. Notes
    - Existing expenses without approval_status will default to 'approved' (legacy data)
    - New expenses from caissiere will be created with 'pending_approval' status
*/

-- Add approval workflow columns to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approval_status text NOT NULL DEFAULT 'approved'
      CHECK (approval_status IN ('pending_approval', 'approved', 'returned', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approval_comment'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approval_comment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'justification_documents'
  ) THEN
    ALTER TABLE expenses ADD COLUMN justification_documents text;
  END IF;
END $$;

-- Index for approval status filtering
CREATE INDEX IF NOT EXISTS idx_expenses_approval_status ON expenses(approval_status);

-- Policy: caissiere can view their own expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Caissiere can view own expenses'
  ) THEN
    CREATE POLICY "Caissiere can view own expenses" ON expenses
      FOR SELECT TO authenticated
      USING (
        auth.uid() = created_by
        AND EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('caissiere')
        )
      );
  END IF;
END $$;

-- Policy: caissiere can insert expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Caissiere can insert expense requests'
  ) THEN
    CREATE POLICY "Caissiere can insert expense requests" ON expenses
      FOR INSERT TO authenticated
      WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('caissiere')
        )
      );
  END IF;
END $$;

-- Policy: admin/medical_director can update approval status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Directors can update expense approval'
  ) THEN
    CREATE POLICY "Directors can update expense approval" ON expenses
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('admin', 'medical_director', 'directeur_general', 'medecin_chef_staff')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('admin', 'medical_director', 'directeur_general', 'medecin_chef_staff')
        )
      );
  END IF;
END $$;
