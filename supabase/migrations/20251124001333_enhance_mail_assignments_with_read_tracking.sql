/*
  # Enhance Mail Assignments with Read Tracking

  1. Changes
    - Add `read_at` timestamp field to track when employee first reads assigned mail
    - Add `notification_sent_at` timestamp to track email notification delivery
    - Add `notification_status` enum to track notification delivery status
    - Add index for read tracking queries

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Create notification status enum
DO $$ BEGIN
  CREATE TYPE notification_status_enum AS ENUM ('pending', 'sent', 'failed', 'bounced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to mail_assignments table
DO $$
BEGIN
  -- Add read_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_assignments' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE mail_assignments ADD COLUMN read_at timestamptz;
  END IF;

  -- Add notification_sent_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_assignments' AND column_name = 'notification_sent_at'
  ) THEN
    ALTER TABLE mail_assignments ADD COLUMN notification_sent_at timestamptz;
  END IF;

  -- Add notification_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_assignments' AND column_name = 'notification_status'
  ) THEN
    ALTER TABLE mail_assignments ADD COLUMN notification_status notification_status_enum DEFAULT 'pending';
  END IF;

  -- Add email_address column to store employee email at time of assignment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_assignments' AND column_name = 'email_address'
  ) THEN
    ALTER TABLE mail_assignments ADD COLUMN email_address text;
  END IF;
END $$;

-- Create index for read tracking queries
CREATE INDEX IF NOT EXISTS idx_mail_assignments_read_at ON mail_assignments(read_at);
CREATE INDEX IF NOT EXISTS idx_mail_assignments_notification ON mail_assignments(notification_status, notification_sent_at);

-- Create function to mark mail as read
CREATE OR REPLACE FUNCTION mark_mail_assignment_as_read(p_assignment_id uuid)
RETURNS jsonb
AS $$
DECLARE
  v_result jsonb;
  v_already_read boolean;
BEGIN
  -- Check if already read
  SELECT (read_at IS NOT NULL) INTO v_already_read
  FROM mail_assignments
  WHERE id = p_assignment_id;

  -- Update read_at if not already read
  IF NOT v_already_read THEN
    UPDATE mail_assignments
    SET read_at = now(),
        assignment_status = CASE
          WHEN assignment_status = 'attribue' THEN 'accepte'::assignment_status_enum
          ELSE assignment_status
        END
    WHERE id = p_assignment_id
    RETURNING jsonb_build_object(
      'success', true,
      'read_at', read_at,
      'first_read', true
    ) INTO v_result;
  ELSE
    SELECT jsonb_build_object(
      'success', true,
      'read_at', read_at,
      'first_read', false
    ) INTO v_result
    FROM mail_assignments
    WHERE id = p_assignment_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create function to get mail assignment statistics
CREATE OR REPLACE FUNCTION get_mail_assignment_stats(p_mail_id uuid)
RETURNS jsonb
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_assigned', COUNT(*),
    'total_read', COUNT(*) FILTER (WHERE read_at IS NOT NULL),
    'total_unread', COUNT(*) FILTER (WHERE read_at IS NULL),
    'read_percentage', ROUND(
      (COUNT(*) FILTER (WHERE read_at IS NOT NULL)::numeric /
       NULLIF(COUNT(*), 0) * 100), 2
    ),
    'notification_sent', COUNT(*) FILTER (WHERE notification_status = 'sent'),
    'notification_pending', COUNT(*) FILTER (WHERE notification_status = 'pending'),
    'notification_failed', COUNT(*) FILTER (WHERE notification_status = 'failed')
  ) INTO v_stats
  FROM mail_assignments
  WHERE mail_id = p_mail_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create view for unread mail assignments
CREATE OR REPLACE VIEW mail_assignments_unread AS
SELECT
  ma.id,
  ma.mail_id,
  ma.assigned_to,
  ma.assigned_at,
  ma.assignment_status,
  ma.notification_status,
  ma.email_address,
  m.reference,
  m.subject,
  m.priority,
  m.deadline_date,
  m.mail_type,
  m.is_confidential,
  CASE
    WHEN m.deadline_date IS NOT NULL AND m.deadline_date < CURRENT_DATE THEN 'overdue'
    WHEN m.deadline_date IS NOT NULL AND m.deadline_date <= CURRENT_DATE + interval '3 days' THEN 'urgent'
    ELSE 'normal'
  END as urgency_level
FROM mail_assignments ma
JOIN mail_items m ON ma.mail_id = m.id
WHERE ma.read_at IS NULL
  AND m.is_archived = false
  AND m.status NOT IN ('traite', 'archive')
ORDER BY m.priority DESC, m.deadline_date ASC NULLS LAST;