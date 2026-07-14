/*
# Set default auth.uid() on expenses.created_by

1. Modified columns
   - `expenses.created_by`: add DEFAULT auth.uid() so the creator is automatically captured

2. Notes
   - Existing rows with NULL created_by are left unchanged
   - Idempotent: ALTER COLUMN SET DEFAULT is safe to re-run
*/

ALTER TABLE expenses ALTER COLUMN created_by SET DEFAULT auth.uid();
