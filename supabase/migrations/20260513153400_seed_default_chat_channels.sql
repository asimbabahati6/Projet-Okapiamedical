/*
  # Seed Default Chat Channels

  1. New Data
    - Creates 3 default public chat channels for OKAPIA Connect:
      - "General" - Main channel for all staff
      - "Urgences" - Emergency communications
      - "Annonces" - Official announcements
  
  2. Notes
    - Uses an existing user_profile as channel creator
    - Channels are public and active by default
    - Safe to re-run (uses ON CONFLICT DO NOTHING)
*/

DO $$
DECLARE
  creator_id uuid;
BEGIN
  -- Get a valid user from user_profiles
  SELECT id INTO creator_id
  FROM user_profiles
  LIMIT 1;

  IF creator_id IS NULL THEN
    RAISE NOTICE 'No user profiles found, skipping channel seeding';
    RETURN;
  END IF;

  -- Insert default channels
  INSERT INTO chat_channels (name, slug, type, description, icon, color, is_active, created_by)
  VALUES
    ('General', 'general', 'public', 'Canal principal pour toute l''equipe', 'hash', 'cyan', true, creator_id),
    ('Urgences', 'urgences', 'public', 'Communications urgentes et alertes', 'hash', 'red', true, creator_id),
    ('Annonces', 'annonces', 'public', 'Annonces officielles de la direction', 'hash', 'blue', true, creator_id)
  ON CONFLICT (slug) DO NOTHING;
END $$;
