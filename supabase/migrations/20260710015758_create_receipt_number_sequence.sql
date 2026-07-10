/*
# Create Receipt Number Sequence (REC-YYYY-XXXX)

1. New Sequence
   - `receipt_number_seq` — global sequence for receipt numbering

2. New Function
   - `generate_rec_receipt_number()` — generates receipt numbers in format REC-YYYY-XXXX
     using the current year and a zero-padded sequential counter.
     Modeled after the existing `generate_oka_invoice_number()`.

3. Important Notes
   - The sequence is shared across all years; the year prefix changes automatically.
   - The function is called from the frontend at payment time, NOT via trigger,
     because receipts are generated on encaissement (not on invoice creation).
   - No existing tables or columns are modified.
*/

-- Create sequence if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'receipt_number_seq') THEN
    CREATE SEQUENCE public.receipt_number_seq START WITH 1 INCREMENT BY 1 NO MAXVALUE NO CYCLE;
  END IF;
END $$;

-- Create or replace the receipt number generator
CREATE OR REPLACE FUNCTION public.generate_rec_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year text;
  v_seq  bigint;
BEGIN
  v_year := to_char(now(), 'YYYY');
  v_seq  := nextval('public.receipt_number_seq');
  RETURN 'REC-' || v_year || '-' || lpad(v_seq::text, 4, '0');
END;
$$;

-- Grant execute to authenticated users (caissière role)
GRANT EXECUTE ON FUNCTION public.generate_rec_receipt_number() TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.receipt_number_seq TO authenticated;
