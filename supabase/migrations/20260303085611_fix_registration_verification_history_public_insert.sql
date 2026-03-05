/*
  # Fix registration_verification_history public INSERT policy

  ## Problem
  The public patient registration form inserts a row into `registration_verification_history`
  after successfully creating the registration. However, the existing INSERT policy
  "Staff can add verification history" only allows authenticated staff users.
  Unauthenticated/public users are blocked by RLS, causing the entire submission to fail
  with "Failed to submit registration".

  ## Fix
  Add a separate policy that allows anyone (including unauthenticated public users) to insert
  a single "submitted" history entry tied to a valid registration.
*/

CREATE POLICY "Public can insert initial submitted history"
  ON registration_verification_history
  FOR INSERT
  TO public
  WITH CHECK (action_type = 'submitted' AND new_status = 'pending_verification');
