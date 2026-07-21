/*
  # Portail de résultats d'analyses — OKAPIA Medical

  1. Nouvelles tables
    - `lab_result_access_codes` : codes d'accès personnels (hashés) liés à une demande d'analyse
    - `lab_result_access_logs` : journalisation de toutes les tentatives d'accès (réussies ou non)

  2. Fonctions
    - `generate_lab_result_access_code(lab_order_id, validity_days)` : réservée au personnel,
      génère un code à remettre au patient (affiché une seule fois, seul le hash est stocké)
    - `lookup_lab_results(patient_number, access_code)` : accès public (portail),
      vérifie le code, journalise, limite les tentatives (anti force brute), ne renvoie
      que les résultats VALIDÉS
    - `get_my_lab_results()` : pour l'espace patient authentifié (correspondance par email)

  3. Sécurité
    - Codes stockés hashés (bcrypt via pgcrypto), jamais en clair
    - Expiration des codes (30 jours par défaut)
    - Verrouillage temporaire après 5 échecs en 15 minutes par numéro de dossier
    - RLS activée : les tables ne sont lisibles que par le personnel
    - Toutes les tentatives sont journalisées (conformité / audit)
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Codes d'accès
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_result_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_access_codes_order ON lab_result_access_codes(lab_order_id);

-- ============================================================
-- 2. Journal des accès
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_result_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_number_entered text,
  lab_order_id uuid,
  success boolean NOT NULL,
  failure_reason text,
  accessed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_access_logs_patient_number
  ON lab_result_access_logs(patient_number_entered, created_at);

-- ============================================================
-- 3. RLS : lecture réservée au personnel, écriture via fonctions
-- ============================================================
ALTER TABLE lab_result_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_result_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view access codes"
  ON lab_result_access_codes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND up.is_active = true
      AND (r.level <= 3 OR r.name IN ('laboratory','lab_manager','lab_technician','laborantin'))
  ));

CREATE POLICY "Staff can view access logs"
  ON lab_result_access_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND up.is_active = true
      AND (r.level <= 3 OR r.name IN ('laboratory','lab_manager','lab_technician','laborantin'))
  ));

-- ============================================================
-- 4. Génération d'un code (personnel uniquement)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_lab_result_access_code(
  p_lab_order_id uuid,
  p_validity_days integer DEFAULT 30
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff boolean;
  v_code text := '';
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  i integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_profiles up JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND up.is_active = true
      AND (r.level <= 3 OR r.name IN ('laboratory','lab_manager','lab_technician','laborantin'))
  ) INTO v_is_staff;

  IF NOT v_is_staff THEN
    RAISE EXCEPTION 'Accès refusé : réservé au personnel autorisé';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM lab_orders WHERE id = p_lab_order_id) THEN
    RAISE EXCEPTION 'Demande d''analyse introuvable';
  END IF;

  -- Code lisible de 8 caractères (sans lettres/chiffres ambigus)
  FOR i IN 1..8 LOOP
    v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  END LOOP;

  -- Un seul code actif par demande : on désactive les précédents
  UPDATE lab_result_access_codes
  SET is_active = false
  WHERE lab_order_id = p_lab_order_id AND is_active = true;

  INSERT INTO lab_result_access_codes (lab_order_id, code_hash, expires_at, created_by)
  VALUES (
    p_lab_order_id,
    crypt(v_code, gen_salt('bf')),
    now() + make_interval(days => GREATEST(p_validity_days, 1)),
    auth.uid()
  );

  RETURN v_code;
END;
$$;

-- ============================================================
-- 5. Consultation publique (portail) : dossier + code
-- ============================================================
CREATE OR REPLACE FUNCTION lookup_lab_results(
  p_patient_number text,
  p_access_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient patients%ROWTYPE;
  v_access record;
  v_failed_count integer;
  v_results jsonb;
BEGIN
  p_patient_number := upper(trim(p_patient_number));
  p_access_code := upper(trim(p_access_code));

  IF p_patient_number = '' OR p_access_code = '' THEN
    RETURN jsonb_build_object('status','error','code','missing_fields');
  END IF;

  -- Anti force brute : 5 échecs max / 15 min pour un même numéro de dossier
  SELECT count(*) INTO v_failed_count
  FROM lab_result_access_logs
  WHERE patient_number_entered = p_patient_number
    AND success = false
    AND created_at > now() - interval '15 minutes';

  IF v_failed_count >= 5 THEN
    INSERT INTO lab_result_access_logs (patient_number_entered, success, failure_reason)
    VALUES (p_patient_number, false, 'throttled');
    RETURN jsonb_build_object('status','error','code','too_many_attempts');
  END IF;

  SELECT * INTO v_patient FROM patients WHERE upper(patient_number) = p_patient_number;

  IF v_patient.id IS NULL THEN
    INSERT INTO lab_result_access_logs (patient_number_entered, success, failure_reason)
    VALUES (p_patient_number, false, 'unknown_patient');
    RETURN jsonb_build_object('status','error','code','invalid_credentials');
  END IF;

  -- Recherche d'un code actif, non expiré, correspondant
  SELECT ac.id, ac.lab_order_id INTO v_access
  FROM lab_result_access_codes ac
  JOIN lab_orders lo ON lo.id = ac.lab_order_id
  WHERE lo.patient_id = v_patient.id
    AND ac.is_active = true
    AND ac.expires_at > now()
    AND ac.code_hash = crypt(p_access_code, ac.code_hash)
  ORDER BY ac.created_at DESC
  LIMIT 1;

  IF v_access.id IS NULL THEN
    INSERT INTO lab_result_access_logs (patient_number_entered, success, failure_reason)
    VALUES (p_patient_number, false, 'invalid_code');
    RETURN jsonb_build_object('status','error','code','invalid_credentials');
  END IF;

  -- Journalisation de l'accès réussi
  INSERT INTO lab_result_access_logs (patient_number_entered, lab_order_id, success)
  VALUES (p_patient_number, v_access.lab_order_id, true);

  -- Résultats VALIDÉS uniquement (multi-tests, avec repli sur l'ancien format)
  SELECT COALESCE(jsonb_agg(r ORDER BY r->>'test_name'), '[]'::jsonb) INTO v_results
  FROM (
    SELECT jsonb_build_object(
      'test_name', lt.test_name,
      'category', lt.category,
      'result_value', lot.result_value,
      'result_unit', COALESCE(lot.result_unit, lt.unit),
      'normal_range', lt.normal_range,
      'is_abnormal', lot.is_abnormal,
      'approved_at', lot.approved_at
    ) AS r
    FROM lab_order_tests lot
    JOIN lab_tests lt ON lt.id = lot.test_id
    WHERE lot.lab_order_id = v_access.lab_order_id
      AND lot.approved_at IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object(
      'test_name', lt.test_name,
      'category', lt.category,
      'result_value', lo.result_value,
      'result_unit', COALESCE(lo.result_unit, lt.unit),
      'normal_range', lt.normal_range,
      'is_abnormal', lo.is_abnormal,
      'approved_at', lo.approved_at
    ) AS r
    FROM lab_orders lo
    JOIN lab_tests lt ON lt.id = lo.test_id
    WHERE lo.id = v_access.lab_order_id
      AND lo.approved_at IS NOT NULL
      AND lo.result_value IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM lab_order_tests WHERE lab_order_id = lo.id)
  ) sub;

  RETURN jsonb_build_object(
    'status', 'success',
    'patient', jsonb_build_object(
      'first_name', v_patient.first_name,
      'last_name', v_patient.last_name,
      'patient_number', v_patient.patient_number,
      'date_of_birth', v_patient.date_of_birth
    ),
    'order', (
      SELECT jsonb_build_object(
        'order_number', lo.order_number,
        'created_at', lo.created_at,
        'status', lo.status
      )
      FROM lab_orders lo WHERE lo.id = v_access.lab_order_id
    ),
    'results', v_results
  );
END;
$$;

-- ============================================================
-- 6. Espace patient authentifié (correspondance par email)
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_lab_results()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_patient_id uuid;
  v_orders jsonb;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('status','error','code','not_authenticated');
  END IF;

  SELECT id INTO v_patient_id FROM patients WHERE lower(email) = lower(v_email) LIMIT 1;
  IF v_patient_id IS NULL THEN
    RETURN jsonb_build_object('status','error','code','no_patient_record');
  END IF;

  SELECT COALESCE(jsonb_agg(o ORDER BY o->>'created_at' DESC), '[]'::jsonb) INTO v_orders
  FROM (
    SELECT jsonb_build_object(
      'order_number', lo.order_number,
      'created_at', lo.created_at,
      'status', lo.status,
      'results', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'test_name', lt.test_name,
          'category', lt.category,
          'result_value', lot.result_value,
          'result_unit', COALESCE(lot.result_unit, lt.unit),
          'normal_range', lt.normal_range,
          'is_abnormal', lot.is_abnormal,
          'approved_at', lot.approved_at
        )), '[]'::jsonb)
        FROM lab_order_tests lot
        JOIN lab_tests lt ON lt.id = lot.test_id
        WHERE lot.lab_order_id = lo.id AND lot.approved_at IS NOT NULL
      )
    ) AS o
    FROM lab_orders lo
    WHERE lo.patient_id = v_patient_id
  ) sub;

  RETURN jsonb_build_object('status','success','orders', v_orders);
END;
$$;

-- ============================================================
-- 7. Droits d'exécution
-- ============================================================
GRANT EXECUTE ON FUNCTION lookup_lab_results(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_lab_result_access_code(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_lab_results() TO authenticated;
