/*
  # Création de la table system_settings pour verrouiller la langue française

  1. Nouvelle table
    - `system_settings`
      - `id` (uuid, clé primaire)
      - `setting_key` (text, unique, non-null) - Clé du paramètre système
      - `setting_value` (text, non-null) - Valeur du paramètre
      - `setting_type` (text, non-null) - Type de paramètre (language, theme, etc.)
      - `is_locked` (boolean, défaut: true) - Indique si le paramètre est verrouillable
      - `description` (text) - Description du paramètre
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de dernière mise à jour

  2. Sécurité
    - Activer RLS sur `system_settings`
    - Politique SELECT pour tous les utilisateurs authentifiés et publics
    - AUCUNE politique INSERT/UPDATE/DELETE pour verrouiller complètement la table
    - Seuls les superadmins PostgreSQL peuvent modifier ces données

  3. Données initiales
    - Insertion du paramètre `application_language` avec la valeur `fr`
    - Marqué comme verrouillé (is_locked = true)

  4. Index
    - Index unique sur setting_key pour optimiser les recherches
    - Index sur setting_type pour les futures requêtes groupées

  Notes importantes:
    - Cette table est en LECTURE SEULE pour tous les utilisateurs de l'application
    - La langue est définitivement verrouillée en français
    - Seule une intervention manuelle au niveau base de données peut modifier ces valeurs
*/

-- Créer la table system_settings si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  setting_type text NOT NULL,
  is_locked boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);

-- Insérer le paramètre de verrouillage de la langue française
INSERT INTO system_settings (setting_key, setting_value, setting_type, is_locked, description)
VALUES (
  'application_language',
  'fr',
  'language',
  true,
  'Langue de l''application verrouillée en français. Ce paramètre ne peut pas être modifié via l''interface.'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = 'fr',
  is_locked = true,
  updated_at = now();

-- Activer Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique (tout le monde peut lire)
CREATE POLICY "Lecture publique des paramètres système"
  ON system_settings
  FOR SELECT
  USING (true);

-- IMPORTANT: Aucune politique INSERT, UPDATE ou DELETE n'est créée
-- Cela verrouille complètement la table en lecture seule pour les utilisateurs de l'application
-- Seuls les superadmins PostgreSQL peuvent modifier ces données directement

-- Ajouter un commentaire sur la table pour documenter son usage
COMMENT ON TABLE system_settings IS 'Paramètres système de l''application. Table en LECTURE SEULE. La langue est verrouillée en français de manière permanente.';
COMMENT ON COLUMN system_settings.setting_key IS 'Clé unique identifiant le paramètre système';
COMMENT ON COLUMN system_settings.setting_value IS 'Valeur actuelle du paramètre';
COMMENT ON COLUMN system_settings.is_locked IS 'Indique si le paramètre est verrouillé et ne peut être modifié';
