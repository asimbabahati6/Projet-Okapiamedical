-- Migration: Add discount/remise fields to invoices table

-- 1. Add discount value and type
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_value numeric(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage'));

-- 2. Add discount reason (motif de reduction)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_reason text CHECK (discount_reason IN ('personnel', 'partenaire', 'indigence', 'autre') OR discount_reason IS NULL);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_reason_detail text;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
