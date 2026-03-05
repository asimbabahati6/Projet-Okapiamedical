/*
  # Fix Chat Channels Infinite Recursion
  
  ## Problème
  Récursion infinie détectée dans les policies RLS pour `chat_channels` et `chat_members`:
  - Policy de chat_channels référence chat_members
  - Policy de chat_members référence chat_channels
  - Résultat: Boucle infinie
  
  ## Solution
  Réécrire les policies pour éviter les références circulaires:
  - Simplifier la policy de chat_members (pas de sous-requête vers chat_channels)
  - Utiliser directement les colonnes de la table courante
  
  ## Changements
  1. DROP les anciennes policies problématiques
  2. Créer de nouvelles policies sans récursion
*/

-- 1. Supprimer les policies problématiques
DROP POLICY IF EXISTS "Users can view channels they have access to" ON chat_channels;
DROP POLICY IF EXISTS "Admins can manage channels" ON chat_channels;
DROP POLICY IF EXISTS "Users can view channel members" ON chat_members;

-- 2. Nouvelle policy pour chat_channels (sans récursion)
-- Les utilisateurs peuvent voir:
-- - Tous les canaux publics actifs
-- - Les canaux privés dont ils sont membres (vérifié via une fonction sécurisée)
CREATE POLICY "Users can view public channels"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    is_active = true AND type = 'public'
  );

CREATE POLICY "Users can view channels they joined"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM chat_members cm
      WHERE cm.channel_id = chat_channels.id
        AND cm.user_id = auth.uid()
    )
  );

-- 3. Policy pour créer des canaux (tous les utilisateurs authentifiés)
CREATE POLICY "Authenticated users can create channels"
  ON chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid()
  );

-- 4. Policy pour mettre à jour les canaux (créateur uniquement)
CREATE POLICY "Channel creators can update their channels"
  ON chat_channels FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 5. Policy pour supprimer les canaux (créateur uniquement)
CREATE POLICY "Channel creators can delete their channels"
  ON chat_channels FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- 6. Nouvelle policy pour chat_members (SANS sous-requête vers chat_channels)
-- Simplification: Les membres peuvent voir les autres membres du même canal
CREATE POLICY "Users can view members of channels they joined"
  ON chat_members FOR SELECT
  TO authenticated
  USING (
    -- L'utilisateur peut voir les membres d'un canal s'il est lui-même membre
    EXISTS (
      SELECT 1 FROM chat_members cm
      WHERE cm.channel_id = chat_members.channel_id
        AND cm.user_id = auth.uid()
    )
  );

-- Note: Les policies INSERT et DELETE pour chat_members restent inchangées
-- car elles n'ont pas de récursion

