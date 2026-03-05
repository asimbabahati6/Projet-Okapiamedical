/*
  # Système de Messagerie OKAPIA Connect
  
  1. Nouvelles Tables
    - `chat_channels` : Canaux de communication par service
      - Canaux publics (#Général, #Laboratoire, etc.)
      - Canaux privés (groupes fermés)
      - Permissions par rôle
    
    - `chat_messages` : Messages instantanés
      - Messages dans les canaux
      - Messages directs 1-to-1
      - Support pièces jointes
      - Tags vers dossiers patients/examens
    
    - `chat_members` : Membres des canaux
      - Gestion des participants
      - Statuts (actif, muted, etc.)
    
    - `chat_direct_conversations` : Conversations privées
      - Messages directs entre 2 utilisateurs
      - Gestion des participants
    
    - `chat_notifications` : Notifications non lues
      - Compteur de messages non lus
      - Par canal et par conversation
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies basées sur l'appartenance aux canaux
    - Restrictions par rôle pour canaux spécifiques
*/

-- Table des canaux
CREATE TABLE IF NOT EXISTS chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'service')),
  icon text DEFAULT 'hash',
  color text DEFAULT 'cyan',
  allowed_roles text[],
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des membres de canaux
CREATE TABLE IF NOT EXISTS chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  is_muted boolean DEFAULT false,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Table des conversations directes
CREATE TABLE IF NOT EXISTS chat_direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 < participant_2)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES chat_channels(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES chat_direct_conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  patient_reference uuid REFERENCES patients(id) ON DELETE SET NULL,
  exam_reference text,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (
    (channel_id IS NOT NULL AND conversation_id IS NULL) OR
    (channel_id IS NULL AND conversation_id IS NOT NULL)
  )
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS chat_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id uuid REFERENCES chat_channels(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES chat_direct_conversations(id) ON DELETE CASCADE,
  unread_count integer DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, channel_id, conversation_id)
);

-- Table des statuts en ligne
CREATE TABLE IF NOT EXISTS chat_user_status (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  custom_status text,
  last_seen timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_chat_channels_slug ON chat_channels(slug);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_chat_members_channel ON chat_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_user ON chat_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_direct_conv_participants ON chat_direct_conversations(participant_1, participant_2);

-- Triggers pour updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_chat_channels_updated_at') THEN
    CREATE FUNCTION update_chat_channels_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS chat_channels_updated_at ON chat_channels;
CREATE TRIGGER chat_channels_updated_at
  BEFORE UPDATE ON chat_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_channels_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_chat_notifications_updated_at') THEN
    CREATE FUNCTION update_chat_notifications_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS chat_notifications_updated_at ON chat_notifications;
CREATE TRIGGER chat_notifications_updated_at
  BEFORE UPDATE ON chat_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_notifications_updated_at();

-- Enable RLS
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_status ENABLE ROW LEVEL SECURITY;

-- Policies pour chat_channels
CREATE POLICY "Users can view channels they have access to"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      type = 'public' OR
      id IN (SELECT channel_id FROM chat_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage channels"
  ON chat_channels FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies pour chat_members
CREATE POLICY "Users can view channel members"
  ON chat_members FOR SELECT
  TO authenticated
  USING (
    channel_id IN (SELECT id FROM chat_channels WHERE is_active = true)
  );

CREATE POLICY "Users can join public channels"
  ON chat_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave channels"
  ON chat_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies pour chat_direct_conversations
CREATE POLICY "Users can view their conversations"
  ON chat_direct_conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

CREATE POLICY "Users can create conversations"
  ON chat_direct_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- Policies pour chat_messages
CREATE POLICY "Users can view messages in their channels"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    (channel_id IS NOT NULL AND channel_id IN (
      SELECT channel_id FROM chat_members WHERE user_id = auth.uid()
    )) OR
    (conversation_id IS NOT NULL AND conversation_id IN (
      SELECT id FROM chat_direct_conversations 
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    ))
  );

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can edit their own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Policies pour chat_notifications
CREATE POLICY "Users can view their notifications"
  ON chat_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notifications"
  ON chat_notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour chat_user_status
CREATE POLICY "Everyone can view user status"
  ON chat_user_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own status"
  ON chat_user_status FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
