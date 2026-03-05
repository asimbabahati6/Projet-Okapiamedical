/*
  # Système de Rapports et Exports - Phase 6

  ## Vue d'ensemble
  Système complet de génération de rapports et d'exports multi-formats pour tous les modules du système hospitalier.

  ## 1. Tables Créées

  ### report_templates
  - Templates de rapports prédéfinis et personnalisables
  - Configuration JSON pour filtres, colonnes, formatage
  - Catégories: logistique, fournisseurs, médical, financier, RH

  ### generated_reports
  - Historique de tous les rapports générés
  - Statuts: pending, processing, completed, failed
  - Fichiers générés stockés avec URL
  - Traçabilité complète (qui, quand, paramètres)

  ### scheduled_reports
  - Planification automatique de rapports
  - Fréquences: daily, weekly, monthly, quarterly, yearly
  - Destinataires emails
  - Dernière exécution et prochaine

  ### report_subscriptions
  - Abonnements utilisateurs aux rapports
  - Notifications automatiques
  - Préférences format (PDF, Excel, CSV)

  ## 2. Enums

  ### report_category
  - logistics, suppliers, medical, financial, hr, admin

  ### report_format
  - pdf, excel, csv, json

  ### report_frequency
  - daily, weekly, monthly, quarterly, yearly, custom

  ## 3. Fonctions

  ### generate_report()
  - Génération de rapport à la demande
  - Exécution requête SQL
  - Export au format demandé

  ### schedule_report()
  - Planification automatique
  - Calcul prochaine exécution

  ## 4. Vues

  ### report_statistics
  - Statistiques d'utilisation des rapports
  - Rapports les plus générés
  - Temps de génération moyens

  ## 5. Sécurité RLS
  - Tous les rôles peuvent générer rapports
  - Seuls logisticiens et admins peuvent créer templates
  - Chaque utilisateur voit uniquement ses rapports
*/

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE report_category AS ENUM (
    'logistics',
    'suppliers', 
    'medical',
    'financial',
    'hr',
    'admin',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_format AS ENUM (
    'pdf',
    'excel',
    'csv',
    'json'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_frequency AS ENUM (
    'once',
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TEMPLATES DE RAPPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  category report_category NOT NULL,
  
  -- Configuration SQL
  sql_query text NOT NULL,
  parameters jsonb DEFAULT '[]'::jsonb,
  
  -- Configuration affichage
  columns jsonb NOT NULL,
  default_format report_format DEFAULT 'pdf',
  supports_formats report_format[] DEFAULT ARRAY['pdf', 'excel', 'csv']::report_format[],
  
  -- Options
  allow_date_range boolean DEFAULT true,
  allow_filters boolean DEFAULT true,
  filters_config jsonb,
  
  -- Styling PDF
  page_orientation text DEFAULT 'portrait' CHECK (page_orientation IN ('portrait', 'landscape')),
  include_header boolean DEFAULT true,
  include_footer boolean DEFAULT true,
  include_page_numbers boolean DEFAULT true,
  watermark text,
  
  -- Métadonnées
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE report_templates IS 'Templates de rapports prédéfinis et personnalisables';

-- ============================================================================
-- 3. RAPPORTS GÉNÉRÉS
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES report_templates(id) ON DELETE SET NULL,
  
  -- Informations génération
  report_name text NOT NULL,
  format report_format NOT NULL,
  status report_status DEFAULT 'pending',
  
  -- Paramètres utilisés
  parameters jsonb DEFAULT '{}'::jsonb,
  date_range_start date,
  date_range_end date,
  filters jsonb,
  
  -- Résultats
  file_url text,
  file_size integer,
  mime_type text,
  rows_count integer,
  
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  generation_duration_ms integer,
  
  -- Erreurs
  error_message text,
  error_details jsonb,
  
  -- Métadonnées
  generated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_scheduled boolean DEFAULT false,
  scheduled_report_id uuid,
  expires_at timestamptz,
  downloaded_count integer DEFAULT 0,
  last_downloaded_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_template ON generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_user ON generated_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_date ON generated_reports(created_at DESC);

COMMENT ON TABLE generated_reports IS 'Historique de tous les rapports générés avec traçabilité complète';

-- ============================================================================
-- 4. RAPPORTS PLANIFIÉS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  
  -- Configuration planification
  name text NOT NULL,
  description text,
  frequency report_frequency NOT NULL,
  is_active boolean DEFAULT true,
  
  -- Paramètres rapport
  format report_format NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  filters jsonb,
  
  -- Destinataires
  email_recipients text[] DEFAULT ARRAY[]::text[],
  include_link boolean DEFAULT true,
  attach_file boolean DEFAULT false,
  
  -- Planning
  schedule_time time,
  schedule_day_of_week integer CHECK (schedule_day_of_week BETWEEN 0 AND 6),
  schedule_day_of_month integer CHECK (schedule_day_of_month BETWEEN 1 AND 31),
  custom_cron text,
  
  -- Exécution
  last_run_at timestamptz,
  last_run_status report_status,
  last_run_error text,
  next_run_at timestamptz,
  run_count integer DEFAULT 0,
  
  -- Métadonnées
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_template ON scheduled_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;

COMMENT ON TABLE scheduled_reports IS 'Planification automatique de rapports avec envoi email';

-- ============================================================================
-- 5. ABONNEMENTS RAPPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  
  -- Préférences
  preferred_format report_format DEFAULT 'pdf',
  frequency report_frequency DEFAULT 'monthly',
  email_notifications boolean DEFAULT true,
  
  -- Filtres par défaut
  default_parameters jsonb,
  default_filters jsonb,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_report_subscriptions_user ON report_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_template ON report_subscriptions(template_id);

COMMENT ON TABLE report_subscriptions IS 'Abonnements utilisateurs aux rapports avec notifications';

-- ============================================================================
-- 6. VUE STATISTIQUES RAPPORTS
-- ============================================================================

CREATE OR REPLACE VIEW report_statistics AS
SELECT
  rt.id as template_id,
  rt.name as template_name,
  rt.category,
  
  -- Compteurs
  COUNT(DISTINCT gr.id) as total_generated,
  COUNT(DISTINCT CASE WHEN gr.status = 'completed' THEN gr.id END) as completed_count,
  COUNT(DISTINCT CASE WHEN gr.status = 'failed' THEN gr.id END) as failed_count,
  COUNT(DISTINCT gr.generated_by) as unique_users,
  
  -- Timing
  AVG(gr.generation_duration_ms) as avg_duration_ms,
  MIN(gr.generation_duration_ms) as min_duration_ms,
  MAX(gr.generation_duration_ms) as max_duration_ms,
  
  -- Volume
  SUM(COALESCE(gr.file_size, 0)) as total_file_size_bytes,
  SUM(COALESCE(gr.rows_count, 0)) as total_rows_exported,
  SUM(COALESCE(gr.downloaded_count, 0)) as total_downloads,
  
  -- Formats
  COUNT(CASE WHEN gr.format = 'pdf' THEN 1 END) as pdf_count,
  COUNT(CASE WHEN gr.format = 'excel' THEN 1 END) as excel_count,
  COUNT(CASE WHEN gr.format = 'csv' THEN 1 END) as csv_count,
  
  -- Dates
  MAX(gr.created_at) as last_generated_at,
  MIN(gr.created_at) as first_generated_at
  
FROM report_templates rt
LEFT JOIN generated_reports gr ON rt.id = gr.template_id
GROUP BY rt.id, rt.name, rt.category;

COMMENT ON VIEW report_statistics IS 'Statistiques d''utilisation et performance des rapports';

-- ============================================================================
-- 7. FONCTION: CALCULER PROCHAINE EXÉCUTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency report_frequency,
  p_schedule_time time DEFAULT '08:00:00',
  p_day_of_week integer DEFAULT NULL,
  p_day_of_month integer DEFAULT NULL,
  p_from_date timestamptz DEFAULT now()
)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_run timestamptz;
  v_base_date date;
BEGIN
  v_base_date := p_from_date::date;
  
  CASE p_frequency
    WHEN 'daily' THEN
      v_next_run := (v_base_date + 1) + p_schedule_time;
      
    WHEN 'weekly' THEN
      -- Prochain jour de la semaine spécifié
      v_next_run := (v_base_date + ((7 + COALESCE(p_day_of_week, 1) - EXTRACT(DOW FROM v_base_date)::integer) % 7 + 1)) + p_schedule_time;
      
    WHEN 'monthly' THEN
      -- Prochain jour du mois spécifié
      IF EXTRACT(DAY FROM v_base_date) >= COALESCE(p_day_of_month, 1) THEN
        v_next_run := (DATE_TRUNC('month', v_base_date) + INTERVAL '1 month' + (COALESCE(p_day_of_month, 1) - 1 || ' days')::interval)::date + p_schedule_time;
      ELSE
        v_next_run := (DATE_TRUNC('month', v_base_date) + (COALESCE(p_day_of_month, 1) - 1 || ' days')::interval)::date + p_schedule_time;
      END IF;
      
    WHEN 'quarterly' THEN
      -- Prochain trimestre, jour du mois spécifié
      v_next_run := (DATE_TRUNC('quarter', v_base_date) + INTERVAL '3 months' + (COALESCE(p_day_of_month, 1) - 1 || ' days')::interval)::date + p_schedule_time;
      
    WHEN 'yearly' THEN
      -- Prochain 1er janvier
      v_next_run := (DATE_TRUNC('year', v_base_date) + INTERVAL '1 year')::date + p_schedule_time;
      
    ELSE
      -- once ou custom
      v_next_run := NULL;
  END CASE;
  
  RETURN v_next_run;
END;
$$;

COMMENT ON FUNCTION calculate_next_run IS 'Calcule la prochaine date d''exécution d''un rapport planifié';

-- ============================================================================
-- 8. FONCTION: CRÉER RAPPORT PLANIFIÉ
-- ============================================================================

CREATE OR REPLACE FUNCTION create_scheduled_report(
  p_template_id uuid,
  p_name text,
  p_frequency report_frequency,
  p_format report_format DEFAULT 'pdf',
  p_email_recipients text[] DEFAULT ARRAY[]::text[],
  p_schedule_time time DEFAULT '08:00:00',
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_scheduled_report_id uuid;
  v_next_run timestamptz;
BEGIN
  -- Calculer première exécution
  v_next_run := calculate_next_run(p_frequency, p_schedule_time);
  
  -- Créer planification
  INSERT INTO scheduled_reports (
    template_id,
    name,
    frequency,
    format,
    email_recipients,
    schedule_time,
    next_run_at,
    created_by
  ) VALUES (
    p_template_id,
    p_name,
    p_frequency,
    p_format,
    p_email_recipients,
    p_schedule_time,
    v_next_run,
    p_created_by
  ) RETURNING id INTO v_scheduled_report_id;
  
  RETURN v_scheduled_report_id;
END;
$$;

COMMENT ON FUNCTION create_scheduled_report IS 'Crée un rapport planifié avec calcul automatique prochaine exécution';

-- ============================================================================
-- 9. FONCTION: NETTOYER ANCIENS RAPPORTS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_reports(p_days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Supprimer rapports expirés ou vieux de plus de X jours
  DELETE FROM generated_reports
  WHERE (expires_at IS NOT NULL AND expires_at < now())
     OR (expires_at IS NULL AND created_at < now() - (p_days_to_keep || ' days')::interval);
     
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_reports IS 'Nettoie les rapports expirés ou anciens (par défaut > 90 jours)';

-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- Trigger: Mise à jour timestamps
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON report_templates;
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON scheduled_reports;
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_subscriptions_updated_at ON report_subscriptions;
CREATE TRIGGER update_report_subscriptions_updated_at
  BEFORE UPDATE ON report_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Calcul durée génération
CREATE OR REPLACE FUNCTION calculate_generation_duration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.generation_duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_duration_trigger ON generated_reports;
CREATE TRIGGER calculate_duration_trigger
  BEFORE UPDATE OF status ON generated_reports
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION calculate_generation_duration();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: Templates - Lecture pour tous, écriture pour logisticiens/admins
CREATE POLICY "All can read active templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Logisticians can manage templates"
  ON report_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician', 'administrative_staff')
    )
  );

-- Policies: Rapports générés - Chaque utilisateur voit ses rapports
CREATE POLICY "Users see own reports"
  ON generated_reports FOR SELECT
  TO authenticated
  USING (generated_by = auth.uid());

CREATE POLICY "Users create own reports"
  ON generated_reports FOR INSERT
  TO authenticated
  WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Users update own reports"
  ON generated_reports FOR UPDATE
  TO authenticated
  USING (generated_by = auth.uid());

-- Admins voient tous les rapports
CREATE POLICY "Admins see all reports"
  ON generated_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin')
    )
  );

-- Policies: Rapports planifiés - Créateur + admins
CREATE POLICY "Users manage own scheduled reports"
  ON scheduled_reports FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins manage all scheduled reports"
  ON scheduled_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
        AND r.name IN ('super_admin', 'logistician')
    )
  );

-- Policies: Abonnements - Propre utilisateur uniquement
CREATE POLICY "Users manage own subscriptions"
  ON report_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
