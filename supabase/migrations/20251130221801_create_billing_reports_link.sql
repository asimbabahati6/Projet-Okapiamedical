/*
  # Create Billing Financial Reports Link Table

  This migration creates a linking table between billing periods and financial reports.

  1. New Tables
    - `billing_financial_reports`
      - `id` (uuid, primary key)
      - `billing_period_start` (date)
      - `billing_period_end` (date)
      - `financial_report_id` (uuid, foreign key)
      - `inserted_at` (timestamp)
      - `inserted_by` (uuid, foreign key)
      - `display_options` (jsonb)
      - `auto_update` (boolean)

  2. Security
    - Enable RLS on `billing_financial_reports` table
    - Add policies for authenticated users

  3. Indexes
    - Index on billing period dates for fast queries
    - Unique constraint on period + report combination
*/

-- Create the billing_financial_reports table
CREATE TABLE IF NOT EXISTS billing_financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  financial_report_id UUID REFERENCES financial_reports(id) ON DELETE CASCADE,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inserted_by UUID REFERENCES user_profiles(id),
  display_options JSONB DEFAULT '{}'::jsonb,
  auto_update BOOLEAN DEFAULT false,
  UNIQUE(billing_period_start, billing_period_end, financial_report_id)
);

-- Create index for performance on period queries
CREATE INDEX IF NOT EXISTS idx_billing_reports_period 
ON billing_financial_reports(billing_period_start, billing_period_end);

-- Create index on financial_report_id for joins
CREATE INDEX IF NOT EXISTS idx_billing_reports_financial_id 
ON billing_financial_reports(financial_report_id);

-- Enable Row Level Security
ALTER TABLE billing_financial_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view billing report links"
  ON billing_financial_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert billing report links"
  ON billing_financial_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update billing report links"
  ON billing_financial_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete billing report links"
  ON billing_financial_reports
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comment to table
COMMENT ON TABLE billing_financial_reports IS 'Links financial reports to billing pages for automatic display';
COMMENT ON COLUMN billing_financial_reports.display_options IS 'JSON configuration for how the report should be displayed';
