/*
  # Smart Punch - Système de Pointage Géosécurisé

  ## Résumé
  Création du système complet de pointage intelligent avec géofencing, capture selfie,
  consentement RGPD, et journal de notifications email.

  ## Nouvelles Tables

  ### 1. `smart_punch_records`
  - Enregistrement principal de chaque pointage (arrivée, départ, début/fin pause)
  - Données GPS: coordonnées, distance au bureau, précision
  - Lien vers selfie (URL sécurisée Supabase Storage)
  - Flag d'exception de rôle (pointage distant autorisé)
  - Flag de fermeture automatique à 20h
  - Durée de pause calculée automatiquement
  - Statut de retard et minutes de retard

  ### 2. `smart_punch_selfies`
  - Métadonnées des selfies de pointage
  - Chemin de stockage, taille, hash de vérification
  - Association au punch record

  ### 3. `gdpr_consents`
  - Traçabilité des consentements RGPD par employé
  - Version de la charte acceptée
  - Consentements séparés: GPS, photo, traitement données
  - Mécanisme de retrait du consentement

  ### 4. `smart_punch_notifications`
  - Journal de toutes les notifications email envoyées
  - Statut d'envoi, tentatives, message d'erreur
  - Lié au punch record déclencheur

  ## Sécurité
  - RLS activé sur toutes les tables
  - Employés: accès uniquement à leurs propres données
  - RH/Admin/SuperAdmin: accès complet
  - Médecin chef: accès lecture globale
*/

-- ============================================================
-- TABLE: smart_punch_records
-- ============================================================
CREATE TABLE IF NOT EXISTS smart_punch_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  punch_date date NOT NULL DEFAULT CURRENT_DATE,
  punch_type text NOT NULL CHECK (punch_type IN ('check_in', 'check_out', 'break_start', 'break_end')),
  punched_at timestamptz NOT NULL DEFAULT now(),
  
  -- Géolocalisation
  gps_lat double precision,
  gps_lng double precision,
  gps_accuracy_meters double precision,
  distance_from_office_meters double precision,
  is_within_zone boolean DEFAULT false,
  is_remote_exception boolean DEFAULT false,
  remote_exception_role text,
  
  -- Selfie
  selfie_url text,
  selfie_storage_path text,
  
  -- Méta-données
  device_info jsonb DEFAULT '{}',
  ip_address text,
  
  -- Calculs pause (rempli à break_end)
  break_duration_minutes integer,
  break_exceeded boolean DEFAULT false,
  break_exceeded_by_minutes integer DEFAULT 0,
  
  -- Retard (rempli au check_in)
  is_late boolean DEFAULT false,
  late_by_minutes integer DEFAULT 0,
  
  -- Fermeture automatique
  auto_closed boolean DEFAULT false,
  auto_closed_at timestamptz,
  forgot_to_checkout_note text,
  
  -- Notes
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_punch_records ENABLE ROW LEVEL SECURITY;

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_smart_punch_records_staff_id ON smart_punch_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_smart_punch_records_punch_date ON smart_punch_records(punch_date);
CREATE INDEX IF NOT EXISTS idx_smart_punch_records_punch_type ON smart_punch_records(punch_type);
CREATE INDEX IF NOT EXISTS idx_smart_punch_records_punched_at ON smart_punch_records(punched_at);

-- RLS Policies
CREATE POLICY "Employees can view own punch records"
  ON smart_punch_records FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Employees can insert own punch records"
  ON smart_punch_records FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Employees can update own punch records"
  ON smart_punch_records FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "HR and Admins can view all punch records"
  ON smart_punch_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general', 'medecin_chef_staff')
    )
  );

CREATE POLICY "HR and Admins can update all punch records"
  ON smart_punch_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_smart_punch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_smart_punch_updated_at
  BEFORE UPDATE ON smart_punch_records
  FOR EACH ROW EXECUTE FUNCTION update_smart_punch_updated_at();

-- ============================================================
-- TABLE: smart_punch_selfies
-- ============================================================
CREATE TABLE IF NOT EXISTS smart_punch_selfies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punch_record_id uuid NOT NULL REFERENCES smart_punch_records(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  file_size_bytes integer,
  mime_type text DEFAULT 'image/jpeg',
  width integer,
  height integer,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE smart_punch_selfies ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_smart_punch_selfies_punch_record ON smart_punch_selfies(punch_record_id);
CREATE INDEX IF NOT EXISTS idx_smart_punch_selfies_staff_id ON smart_punch_selfies(staff_id);

CREATE POLICY "Employees can view own selfies"
  ON smart_punch_selfies FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Employees can insert own selfies"
  ON smart_punch_selfies FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "HR and Admins can view all selfies"
  ON smart_punch_selfies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  );

-- ============================================================
-- TABLE: gdpr_consents
-- ============================================================
CREATE TABLE IF NOT EXISTS gdpr_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  charter_version text NOT NULL DEFAULT '1.0',
  
  -- Consentements individuels
  consent_gps boolean NOT NULL DEFAULT false,
  consent_photo boolean NOT NULL DEFAULT false,
  consent_data_processing boolean NOT NULL DEFAULT false,
  
  -- Métadonnées
  consented_at timestamptz,
  ip_address text,
  user_agent text,
  
  -- Retrait du consentement
  withdrawn boolean DEFAULT false,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  
  -- Demandes d'exercice de droits
  data_access_requested_at timestamptz,
  data_deletion_requested_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(staff_id, charter_version)
);

ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_gdpr_consents_staff_id ON gdpr_consents(staff_id);

CREATE POLICY "Employees can view own GDPR consent"
  ON gdpr_consents FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Employees can insert own GDPR consent"
  ON gdpr_consents FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Employees can update own GDPR consent"
  ON gdpr_consents FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "HR and Admins can view all GDPR consents"
  ON gdpr_consents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  );

CREATE TRIGGER trigger_gdpr_consents_updated_at
  BEFORE UPDATE ON gdpr_consents
  FOR EACH ROW EXECUTE FUNCTION update_smart_punch_updated_at();

-- ============================================================
-- TABLE: smart_punch_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS smart_punch_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  punch_record_id uuid REFERENCES smart_punch_records(id) ON DELETE SET NULL,
  staff_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  notification_type text NOT NULL CHECK (notification_type IN ('late_arrival', 'break_exceeded', 'auto_closed', 'absence')),
  
  -- Email
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body text NOT NULL,
  
  -- Statut d'envoi
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error_message text,
  
  -- Données contextuelles
  context_data jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_punch_notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_smart_punch_notif_staff_id ON smart_punch_notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_smart_punch_notif_status ON smart_punch_notifications(status);
CREATE INDEX IF NOT EXISTS idx_smart_punch_notif_type ON smart_punch_notifications(notification_type);

CREATE POLICY "Employees can view own notifications"
  ON smart_punch_notifications FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "HR and Admins can view all notifications"
  ON smart_punch_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  );

CREATE POLICY "HR and Admins can insert notifications"
  ON smart_punch_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  );

CREATE POLICY "System can insert notifications"
  ON smart_punch_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "HR and Admins can update notifications"
  ON smart_punch_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'directeur_general')
    )
  );

CREATE TRIGGER trigger_smart_punch_notif_updated_at
  BEFORE UPDATE ON smart_punch_notifications
  FOR EACH ROW EXECUTE FUNCTION update_smart_punch_updated_at();

-- ============================================================
-- TABLE: smart_punch_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS smart_punch_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_latitude double precision NOT NULL DEFAULT -4.3716655824942405,
  clinic_longitude double precision NOT NULL DEFAULT 15.253661517603327,
  geofence_radius_meters integer NOT NULL DEFAULT 20,
  min_gps_accuracy_meters double precision NOT NULL DEFAULT 50.0,
  break_duration_minutes integer NOT NULL DEFAULT 60,
  break_warning_minutes integer NOT NULL DEFAULT 55,
  auto_close_hour integer NOT NULL DEFAULT 20,
  work_start_time time NOT NULL DEFAULT '08:00',
  late_grace_period_minutes integer NOT NULL DEFAULT 15,
  gdpr_charter_version text NOT NULL DEFAULT '1.0',
  exempt_roles text[] DEFAULT ARRAY['super_admin', 'hospital_admin', 'directeur_general'],
  notification_email_hr text,
  geolocation_enabled boolean DEFAULT true,
  selfie_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_punch_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read settings"
  ON smart_punch_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update settings"
  ON smart_punch_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
    )
  );

CREATE TRIGGER trigger_smart_punch_settings_updated_at
  BEFORE UPDATE ON smart_punch_settings
  FOR EACH ROW EXECUTE FUNCTION update_smart_punch_updated_at();

-- Insérer les paramètres par défaut
INSERT INTO smart_punch_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================================
-- FUNCTION: Haversine distance calculation
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_punch_distance(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
) RETURNS double precision AS $$
DECLARE
  R constant double precision := 6371000;
  phi1 double precision;
  phi2 double precision;
  dphi double precision;
  dlambda double precision;
  a double precision;
  c double precision;
BEGIN
  phi1 := radians(lat1);
  phi2 := radians(lat2);
  dphi := radians(lat2 - lat1);
  dlambda := radians(lng2 - lng1);
  
  a := sin(dphi/2)^2 + cos(phi1) * cos(phi2) * sin(dlambda/2)^2;
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- VIEW: smart_punch_daily_summary
-- ============================================================
CREATE OR REPLACE VIEW smart_punch_daily_summary AS
SELECT
  up.id as staff_id,
  up.full_name,
  r.name as role_name,
  spr_in.punch_date,
  
  -- Check-in
  spr_in.punched_at as check_in_time,
  spr_in.is_late,
  spr_in.late_by_minutes,
  spr_in.is_remote_exception as check_in_remote,
  spr_in.distance_from_office_meters as check_in_distance,
  spr_in.selfie_url as check_in_selfie,
  
  -- Check-out
  spr_out.punched_at as check_out_time,
  spr_out.auto_closed as auto_closed_checkout,
  spr_out.selfie_url as check_out_selfie,
  
  -- Pause
  spr_bs.punched_at as break_start_time,
  spr_be.punched_at as break_end_time,
  spr_be.break_duration_minutes,
  spr_be.break_exceeded,
  spr_be.break_exceeded_by_minutes,
  
  -- Durée totale de travail (minutes)
  CASE
    WHEN spr_out.punched_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (spr_out.punched_at - spr_in.punched_at)) / 60
    ELSE
      EXTRACT(EPOCH FROM (now() - spr_in.punched_at)) / 60
  END as total_minutes_worked,
  
  -- Statut global
  CASE
    WHEN spr_in.punched_at IS NULL THEN 'absent'
    WHEN spr_out.punched_at IS NOT NULL THEN 'departed'
    WHEN spr_bs.punched_at IS NOT NULL AND spr_be.punched_at IS NULL THEN 'on_break'
    ELSE 'present'
  END as current_status

FROM user_profiles up
JOIN roles r ON r.id = up.role_id
LEFT JOIN smart_punch_records spr_in ON spr_in.staff_id = up.id
  AND spr_in.punch_date = CURRENT_DATE
  AND spr_in.punch_type = 'check_in'
LEFT JOIN smart_punch_records spr_out ON spr_out.staff_id = up.id
  AND spr_out.punch_date = CURRENT_DATE
  AND spr_out.punch_type = 'check_out'
LEFT JOIN smart_punch_records spr_bs ON spr_bs.staff_id = up.id
  AND spr_bs.punch_date = CURRENT_DATE
  AND spr_bs.punch_type = 'break_start'
LEFT JOIN smart_punch_records spr_be ON spr_be.staff_id = up.id
  AND spr_be.punch_date = CURRENT_DATE
  AND spr_be.punch_type = 'break_end'
WHERE up.is_active = true
  AND r.name NOT IN ('patient')
ORDER BY up.full_name;
