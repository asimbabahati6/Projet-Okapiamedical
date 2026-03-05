/*
  # Système de gestion des publications

  1. Nouvelles Tables
    - `post_categories`
      - `id` (uuid, clé primaire)
      - `name` (text, unique) - Nom de la catégorie (innovation, événement, produit, actualité, santé)
      - `description` (text) - Description de la catégorie
      - `created_at` (timestamptz)
    
    - `posts`
      - `id` (uuid, clé primaire)
      - `title` (text) - Titre de la publication (requis, max 200 caractères)
      - `content` (text) - Contenu principal de la publication (requis)
      - `image_url` (text) - URL de l'image associée (optionnel)
      - `category_id` (uuid) - Référence à post_categories
      - `tags` (text[]) - Tableau de mots-clés pour la recherche
      - `author_id` (uuid) - Référence à user_profiles (qui a créé)
      - `status` (text) - Statut: brouillon, publié, archivé
      - `published_at` (timestamptz) - Date de publication
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `post_audit_logs`
      - `id` (uuid, clé primaire)
      - `post_id` (uuid) - Référence à posts
      - `user_id` (uuid) - Référence à user_profiles (qui a effectué l'action)
      - `action` (text) - Type d'action: created, updated, deleted, published, archived
      - `changes` (jsonb) - Détails des modifications
      - `created_at` (timestamptz)

  2. Sécurité
    - Activer RLS sur toutes les tables
    - Politiques SELECT: tous les utilisateurs authentifiés peuvent lire les publications publiées
    - Politiques INSERT/UPDATE/DELETE: seuls admin et super_admin peuvent gérer les publications
    - Les brouillons sont visibles uniquement par l'auteur et les admins

  3. Index
    - Index sur posts.category_id pour les recherches par catégorie
    - Index sur posts.status pour les filtres par statut
    - Index sur posts.published_at pour le tri chronologique
    - Index GIN sur posts.tags pour la recherche par mots-clés

  4. Fonctions
    - Fonction helper pour vérifier si l'utilisateur est admin ou super_admin
    - Trigger pour mettre à jour automatiquement updated_at
    - Trigger pour créer des logs d'audit automatiques
*/

-- Création de la table des catégories de publications
CREATE TABLE IF NOT EXISTS post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insertion des catégories prédéfinies
INSERT INTO post_categories (name, description) VALUES
  ('innovation', 'Innovations médicales et technologies de pointe'),
  ('événement', 'Événements, conférences et actualités de l''hôpital'),
  ('produit', 'Nouveaux produits et services médicaux'),
  ('actualité', 'Actualités générales et informations importantes'),
  ('santé', 'Conseils de santé et prévention')
ON CONFLICT (name) DO NOTHING;

-- Création de la table des publications
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  content text NOT NULL,
  image_url text,
  category_id uuid REFERENCES post_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  author_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publié', 'archivé')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création de la table des logs d'audit
CREATE TABLE IF NOT EXISTS post_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'published', 'archived')),
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

-- Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_post_audit_logs_post_id ON post_audit_logs(post_id);

-- Fonction helper pour vérifier si l'utilisateur est admin ou super_admin
CREATE OR REPLACE FUNCTION is_admin_or_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('hospital_admin', 'super_admin')
  );
END;
$$;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger pour mettre à jour updated_at sur la table posts
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un log d'audit
CREATE OR REPLACE FUNCTION create_post_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_type text;
  change_data jsonb;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    action_type := 'created';
    change_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.status != NEW.status AND NEW.status = 'publié' THEN
      action_type := 'published';
    ELSIF OLD.status != NEW.status AND NEW.status = 'archivé' THEN
      action_type := 'archived';
    ELSE
      action_type := 'updated';
    END IF;
    change_data := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF (TG_OP = 'DELETE') THEN
    action_type := 'deleted';
    change_data := to_jsonb(OLD);
  END IF;

  INSERT INTO post_audit_logs (post_id, user_id, action, changes)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    action_type,
    change_data
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers pour créer des logs d'audit automatiques
DROP TRIGGER IF EXISTS post_audit_insert ON posts;
CREATE TRIGGER post_audit_insert
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION create_post_audit_log();

DROP TRIGGER IF EXISTS post_audit_update ON posts;
CREATE TRIGGER post_audit_update
  AFTER UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION create_post_audit_log();

DROP TRIGGER IF EXISTS post_audit_delete ON posts;
CREATE TRIGGER post_audit_delete
  AFTER DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION create_post_audit_log();

-- Activation de RLS sur toutes les tables
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_audit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour post_categories
-- Tout le monde peut lire les catégories
CREATE POLICY "Anyone can view categories"
  ON post_categories FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins peuvent gérer les catégories
CREATE POLICY "Admins can insert categories"
  ON post_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_super_admin());

CREATE POLICY "Admins can update categories"
  ON post_categories FOR UPDATE
  TO authenticated
  USING (is_admin_or_super_admin())
  WITH CHECK (is_admin_or_super_admin());

CREATE POLICY "Admins can delete categories"
  ON post_categories FOR DELETE
  TO authenticated
  USING (is_admin_or_super_admin());

-- Politiques RLS pour posts
-- Les utilisateurs authentifiés peuvent voir les publications publiées
-- Les admins et les auteurs peuvent voir leurs propres brouillons
CREATE POLICY "Users can view published posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    status = 'publié'
    OR is_admin_or_super_admin()
    OR author_id = auth.uid()
  );

-- Seuls les admins peuvent créer des publications
CREATE POLICY "Admins can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_super_admin());

-- Les admins peuvent modifier toutes les publications
-- Les auteurs peuvent modifier leurs propres brouillons
CREATE POLICY "Admins can update all posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_super_admin()
    OR (author_id = auth.uid() AND status = 'brouillon')
  )
  WITH CHECK (
    is_admin_or_super_admin()
    OR (author_id = auth.uid() AND status = 'brouillon')
  );

-- Seuls les admins peuvent supprimer des publications
CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (is_admin_or_super_admin());

-- Politiques RLS pour post_audit_logs
-- Les admins peuvent voir tous les logs
CREATE POLICY "Admins can view audit logs"
  ON post_audit_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_super_admin());

-- Les logs sont créés automatiquement par les triggers (pas besoin de politique INSERT)
CREATE POLICY "System can insert audit logs"
  ON post_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
