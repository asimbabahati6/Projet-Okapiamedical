/*
  # Add must_change_password to user_profiles

  Adds a flag that forces newly created admin accounts to change their
  temporary password on first login.

  ## Changes
  - New column `must_change_password` (boolean, default false) on user_profiles
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
  END IF;
END $$;
