/*
  # Fix Employee Schema - Add Missing Columns

  ## Summary
  This migration adds missing columns to user_profiles and hr_employees tables
  that are required by the employee management system but were not present in
  the database schema, causing crashes when editing employee records.

  ## Changes

  ### 1. user_profiles Table - New Columns
  - `date_of_birth` (date) - Employee's date of birth
  - `place_of_birth` (text) - Place where employee was born
  - `nationality` (text) - Employee's nationality (defaults to DRC)
  - `gender` (text) - Employee's gender
  - `personal_email` (text) - Personal email address (separate from work email)
  - `secondary_phone` (text) - Secondary phone number
  - `address` (text) - Street address
  - `address_number` (text) - Building/house number
  - `postal_code` (text) - Postal/ZIP code
  - `city` (text) - City of residence
  - `country` (text) - Country of residence (defaults to DRC)
  - `position` (text) - Job position/title

  ### 2. hr_employees Table - New Columns
  - `swift_code` (text) - Bank SWIFT/BIC code
  - `emergency_contact_email` (text) - Emergency contact's email
  - `emergency_contact_address` (text) - Emergency contact's address

  ### 3. Performance Indexes
  - Index on date_of_birth for age-based queries
  - Index on nationality for filtering
  - Index on city for location-based queries

  ## Impact
  - Fixes employee edit modal crash/hang issue
  - Allows all employee data fields to be properly stored and retrieved
  - Backward compatible (all new columns are nullable)
  - No data loss for existing records

  ## Security
  - No RLS policy changes needed (inherits from existing table policies)
  - All personal data columns follow existing security model
*/

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'République Démocratique du Congo',
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS address_number TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'République Démocratique du Congo',
  ADD COLUMN IF NOT EXISTS position TEXT;

-- Add missing columns to hr_employees table
ALTER TABLE hr_employees 
  ADD COLUMN IF NOT EXISTS swift_code TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_date_of_birth ON user_profiles(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_user_profiles_nationality ON user_profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.date_of_birth IS 'Employee date of birth for age verification and HR records';
COMMENT ON COLUMN user_profiles.nationality IS 'Employee nationality for legal and compliance purposes';
COMMENT ON COLUMN user_profiles.position IS 'Employee job position or title';
COMMENT ON COLUMN hr_employees.swift_code IS 'Bank SWIFT/BIC code for international transfers';
COMMENT ON COLUMN hr_employees.emergency_contact_email IS 'Emergency contact email address';
COMMENT ON COLUMN hr_employees.emergency_contact_address IS 'Emergency contact physical address';