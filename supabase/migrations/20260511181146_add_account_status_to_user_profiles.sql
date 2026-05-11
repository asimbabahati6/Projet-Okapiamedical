/*
  # Add account_status to user_profiles

  1. Changes
    - Add `account_status` column to `user_profiles` table
    - Values: 'pending', 'active', 'disabled'
    - Default: 'pending' for new registrations
    - Migrate existing active accounts to 'active' status
    - Add index on account_status for efficient filtering

  2. Security
    - Update RLS policies to allow admins to update account_status
    - Users cannot modify their own account_status

  3. Notes
    - Existing accounts with is_active=true are migrated to 'active'
    - Existing accounts with is_active=false are migrated to 'disabled'
    - New registrations will default to 'pending'
*/

-- Add account_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN account_status text DEFAULT 'pending'
      CONSTRAINT account_status_check CHECK (account_status IN ('pending', 'active', 'disabled'));
  END IF;
END $$;

-- Migrate existing accounts based on is_active flag
UPDATE user_profiles SET account_status = 'active' WHERE is_active = true AND account_status = 'pending';
UPDATE user_profiles SET account_status = 'disabled' WHERE is_active = false AND account_status = 'pending';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON user_profiles (account_status);

-- Policy: Allow admins to update account_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'Admins can update account_status'
  ) THEN
    CREATE POLICY "Admins can update account_status"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
        )
      );
  END IF;
END $$;
