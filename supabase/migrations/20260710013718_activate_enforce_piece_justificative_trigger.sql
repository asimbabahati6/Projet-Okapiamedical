-- Create trigger for fn_enforce_piece_justificative on NEW inserts only
-- Historical rows without piece_justificative_ref are not affected
CREATE TRIGGER trg_enforce_piece_justificative
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION fn_enforce_piece_justificative();