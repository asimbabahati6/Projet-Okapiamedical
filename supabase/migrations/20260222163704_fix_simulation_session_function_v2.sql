/*
  # Fix Simulation Session Function

  1. Changes
    - Drops the old function with incorrect parameter name
    - Creates new function with correct parameter name (p_user_id)
    - Function returns session details with calculated time information
*/

-- Drop the old function first
DROP FUNCTION IF EXISTS get_active_simulation_session(uuid);

-- Create function to get active simulation session for a user
CREATE OR REPLACE FUNCTION get_active_simulation_session(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  actual_role text,
  simulated_role text,
  started_at timestamptz,
  auto_end_minutes integer,
  minutes_elapsed numeric,
  minutes_remaining numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.actual_role,
    s.simulated_role,
    s.started_at,
    s.auto_end_minutes,
    EXTRACT(EPOCH FROM (now() - s.started_at)) / 60 AS minutes_elapsed,
    CASE 
      WHEN s.auto_end_minutes IS NOT NULL 
      THEN GREATEST(0, s.auto_end_minutes - (EXTRACT(EPOCH FROM (now() - s.started_at)) / 60))
      ELSE NULL
    END AS minutes_remaining
  FROM simulation_sessions s
  WHERE s.user_id = p_user_id
    AND s.ended_at IS NULL
  ORDER BY s.started_at DESC
  LIMIT 1;
END;
$$;