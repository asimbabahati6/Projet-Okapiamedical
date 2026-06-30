ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

NOTIFY pgrst, 'reload schema';