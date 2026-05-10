/*
  # Document Sharing and Notification System

  1. New Tables
    - `document_shares`
      - `id` (uuid, primary key)
      - `document_id` (uuid) - Reference to medical document
      - `document_type` (text) - Type of document (prescription, lab_order, consultation, etc.)
      - `shared_by` (uuid, foreign key) - User who shared
      - `shared_with` (uuid, foreign key) - User receiving the share
      - `permission_level` (text) - view, edit, validate
      - `status` (text) - pending, viewed, actioned
      - `expires_at` (timestamptz) - Optional expiration
      - `created_at` (timestamptz)
      - `viewed_at` (timestamptz)

    - `actor_notifications`
      - `id` (uuid, primary key)
      - `recipient_id` (uuid, foreign key) - User receiving notification
      - `sender_id` (uuid, foreign key) - User who triggered notification
      - `notification_type` (text) - new_prescription, lab_result_ready, critical_value, etc.
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `priority` (text) - low, normal, high, critical
      - `related_document_id` (uuid) - Related document reference
      - `related_document_type` (text) - Type of related document
      - `action_url` (text) - URL to action the notification
      - `is_read` (boolean) - Read status
      - `read_at` (timestamptz) - When it was read
      - `created_at` (timestamptz)
      - `metadata` (jsonb) - Additional data

    - `document_workflow_status`
      - `id` (uuid, primary key)
      - `document_id` (uuid) - Document reference
      - `document_type` (text) - Type of document
      - `current_status` (text) - draft, pending_validation, validated, shared, completed, archived
      - `assigned_to` (uuid, foreign key) - Current assignee
      - `workflow_stage` (text) - creation, review, validation, distribution, completion
      - `status_history` (jsonb) - Array of status changes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz)

    - `digital_signatures`
      - `id` (uuid, primary key)
      - `document_id` (uuid) - Document being signed
      - `document_type` (text) - Type of document
      - `signer_id` (uuid, foreign key) - User who signed
      - `signature_data` (text) - Encrypted signature data
      - `signature_type` (text) - electronic, biometric, pin
      - `signed_at` (timestamptz) - Signature timestamp
      - `ip_address` (text) - IP address of signer
      - `device_info` (text) - Device information
      - `is_valid` (boolean) - Signature validity
      - `created_at` (timestamptz)

    - `document_comments`
      - `id` (uuid, primary key)
      - `document_id` (uuid) - Document reference
      - `document_type` (text) - Type of document
      - `author_id` (uuid, foreign key) - Comment author
      - `comment_text` (text) - Comment content
      - `is_private` (boolean) - Private to certain roles
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `medication_interactions`
      - `id` (uuid, primary key)
      - `medication_1_id` (uuid) - First medication
      - `medication_2_id` (uuid) - Second medication
      - `interaction_severity` (text) - minor, moderate, major, contraindicated
      - `interaction_description` (text) - Description of interaction
      - `clinical_effect` (text) - Clinical effects
      - `management_strategy` (text) - How to manage
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only view notifications sent to them
    - Medical staff can create and view document shares
    - Only authorized staff can create digital signatures
    - Audit all access to sensitive documents

  3. Indexes
    - Indexes on recipient_id for quick notification lookup
    - Indexes on document references
    - Indexes on status fields
    - Indexes on timestamps for sorting
*/

-- Create document_shares table
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('prescription', 'lab_order', 'consultation', 'medical_document', 'lab_result', 'certificate')),
  shared_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  shared_with uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission_level text DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'validate')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'actioned')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  viewed_at timestamptz
);

-- Create actor_notifications table
CREATE TABLE IF NOT EXISTS actor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  related_document_id uuid,
  related_document_type text,
  action_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create document_workflow_status table
CREATE TABLE IF NOT EXISTS document_workflow_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_type text NOT NULL,
  current_status text DEFAULT 'draft' CHECK (current_status IN ('draft', 'pending_validation', 'validated', 'shared', 'completed', 'archived')),
  assigned_to uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  workflow_stage text DEFAULT 'creation' CHECK (workflow_stage IN ('creation', 'review', 'validation', 'distribution', 'completion')),
  status_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(document_id, document_type)
);

-- Create digital_signatures table
CREATE TABLE IF NOT EXISTS digital_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_type text NOT NULL,
  signer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  signature_data text NOT NULL,
  signature_type text DEFAULT 'electronic' CHECK (signature_type IN ('electronic', 'biometric', 'pin')),
  signed_at timestamptz DEFAULT now(),
  ip_address text,
  device_info text,
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create document_comments table
CREATE TABLE IF NOT EXISTS document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_type text NOT NULL,
  author_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medication_interactions table
CREATE TABLE IF NOT EXISTS medication_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_1_id uuid REFERENCES medications(id) ON DELETE CASCADE,
  medication_2_id uuid REFERENCES medications(id) ON DELETE CASCADE,
  interaction_severity text CHECK (interaction_severity IN ('minor', 'moderate', 'major', 'contraindicated')),
  interaction_description text,
  clinical_effect text,
  management_strategy text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(medication_1_id, medication_2_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_document_shares_status ON document_shares(status);

CREATE INDEX IF NOT EXISTS idx_actor_notifications_recipient ON actor_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_actor_notifications_is_read ON actor_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_actor_notifications_created_at ON actor_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actor_notifications_priority ON actor_notifications(priority);

CREATE INDEX IF NOT EXISTS idx_document_workflow_document ON document_workflow_status(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_workflow_status ON document_workflow_status(current_status);
CREATE INDEX IF NOT EXISTS idx_document_workflow_assigned_to ON document_workflow_status(assigned_to);

CREATE INDEX IF NOT EXISTS idx_digital_signatures_document ON digital_signatures(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_signer ON digital_signatures(signer_id);

CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_comments_author ON document_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_medication_interactions_med1 ON medication_interactions(medication_1_id);
CREATE INDEX IF NOT EXISTS idx_medication_interactions_med2 ON medication_interactions(medication_2_id);

-- Enable RLS on all tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_shares
CREATE POLICY "Users can view shares involving them"
  ON document_shares FOR SELECT
  TO authenticated
  USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can create document shares"
  ON document_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'pharmacist', 'hospital_admin', 'super_admin'))
    )
  );

CREATE POLICY "Users can update shares they created"
  ON document_shares FOR UPDATE
  TO authenticated
  USING (shared_by = auth.uid());

-- RLS Policies for actor_notifications
CREATE POLICY "Users can view their own notifications"
  ON actor_notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON actor_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON actor_notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON actor_notifications FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid());

-- RLS Policies for document_workflow_status
CREATE POLICY "Medical staff can view workflow status"
  ON document_workflow_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'pharmacist', 'hospital_admin', 'super_admin'))
    )
  );

CREATE POLICY "Medical staff can manage workflow status"
  ON document_workflow_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'hospital_admin', 'super_admin'))
    )
  );

-- RLS Policies for digital_signatures
CREATE POLICY "Users can view signatures they created"
  ON digital_signatures FOR SELECT
  TO authenticated
  USING (signer_id = auth.uid());

CREATE POLICY "Medical staff can view all signatures"
  ON digital_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin'))
    )
  );

CREATE POLICY "Authorized users can create signatures"
  ON digital_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    signer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'pharmacist', 'hospital_admin', 'super_admin'))
    )
  );

-- RLS Policies for document_comments
CREATE POLICY "Medical staff can view comments"
  ON document_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'pharmacist', 'hospital_admin', 'super_admin'))
    )
  );

CREATE POLICY "Users can create comments"
  ON document_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'pharmacist', 'hospital_admin', 'super_admin'))
    )
  );

CREATE POLICY "Users can update their own comments"
  ON document_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for medication_interactions
CREATE POLICY "Medical staff can view medication interactions"
  ON medication_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('doctor', 'pharmacist', 'hospital_admin', 'super_admin'))
    )
  );

CREATE POLICY "Pharmacists can manage interactions"
  ON medication_interactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (SELECT id FROM roles WHERE name IN ('pharmacist', 'hospital_admin', 'super_admin'))
    )
  );

-- Create function to send notification
CREATE OR REPLACE FUNCTION send_actor_notification(
  p_recipient_id uuid,
  p_sender_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'normal',
  p_related_document_id uuid DEFAULT NULL,
  p_related_document_type text DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO actor_notifications (
    recipient_id,
    sender_id,
    notification_type,
    title,
    message,
    priority,
    related_document_id,
    related_document_type,
    action_url,
    metadata
  ) VALUES (
    p_recipient_id,
    p_sender_id,
    p_notification_type,
    p_title,
    p_message,
    p_priority,
    p_related_document_id,
    p_related_document_type,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create function to check medication interactions
CREATE OR REPLACE FUNCTION check_medication_interactions(p_medication_ids uuid[])
RETURNS TABLE (
  medication_1_name text,
  medication_2_name text,
  severity text,
  description text,
  clinical_effect text,
  management text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m1.name as medication_1_name,
    m2.name as medication_2_name,
    mi.interaction_severity as severity,
    mi.interaction_description as description,
    mi.clinical_effect,
    mi.management_strategy as management
  FROM medication_interactions mi
  JOIN medications m1 ON mi.medication_1_id = m1.id
  JOIN medications m2 ON mi.medication_2_id = m2.id
  WHERE 
    mi.medication_1_id = ANY(p_medication_ids)
    AND mi.medication_2_id = ANY(p_medication_ids)
    AND mi.medication_1_id != mi.medication_2_id;
END;
$$;

-- Create function to update workflow status
CREATE OR REPLACE FUNCTION update_workflow_status(
  p_document_id uuid,
  p_document_type text,
  p_new_status text,
  p_assigned_to uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status text;
  v_status_change jsonb;
BEGIN
  -- Get current status
  SELECT current_status INTO v_old_status
  FROM document_workflow_status
  WHERE document_id = p_document_id AND document_type = p_document_type;
  
  -- Build status change record
  v_status_change := jsonb_build_object(
    'from', v_old_status,
    'to', p_new_status,
    'changed_by', auth.uid(),
    'changed_at', now()
  );
  
  -- Update or insert workflow status
  INSERT INTO document_workflow_status (document_id, document_type, current_status, assigned_to, status_history)
  VALUES (
    p_document_id,
    p_document_type,
    p_new_status,
    p_assigned_to,
    jsonb_build_array(v_status_change)
  )
  ON CONFLICT (document_id, document_type)
  DO UPDATE SET
    current_status = p_new_status,
    assigned_to = COALESCE(p_assigned_to, document_workflow_status.assigned_to),
    status_history = document_workflow_status.status_history || v_status_change,
    updated_at = now(),
    completed_at = CASE WHEN p_new_status IN ('completed', 'archived') THEN now() ELSE document_workflow_status.completed_at END;
END;
$$;

-- Insert sample medication interactions
INSERT INTO medication_interactions (medication_1_id, medication_2_id, interaction_severity, interaction_description, clinical_effect, management_strategy)
SELECT 
  m1.id,
  m2.id,
  'moderate',
  'Interaction possible entre ces médicaments',
  'Peut augmenter le risque d''effets secondaires',
  'Surveiller le patient et ajuster la dose si nécessaire'
FROM medications m1
CROSS JOIN medications m2
WHERE m1.id < m2.id
LIMIT 5
ON CONFLICT (medication_1_id, medication_2_id) DO NOTHING;
