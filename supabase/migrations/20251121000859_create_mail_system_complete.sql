-- Module de Gestion du Courrier
-- Enums
DO $$ BEGIN CREATE TYPE mail_type_enum AS ENUM ('entrant', 'sortant'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE mail_priority_enum AS ENUM ('normale', 'elevee', 'urgente', 'critique'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE mail_status_enum AS ENUM ('recu', 'en_attente', 'en_cours', 'traite', 'archive', 'annule'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE mail_format_enum AS ENUM ('papier', 'email', 'fax', 'courrier_electronique', 'recommande', 'chronopost'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE assignment_status_enum AS ENUM ('attribue', 'accepte', 'en_cours', 'termine', 'refuse'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE approval_decision_enum AS ENUM ('en_attente', 'approuve', 'rejete', 'delegue'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tracking_event_type_enum AS ENUM ('creation', 'attribution', 'lecture', 'reponse', 'validation', 'archivage', 'modification', 'commentaire'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tables
CREATE TABLE mail_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, parent_category_id uuid REFERENCES mail_categories(id) ON DELETE SET NULL, color_code text DEFAULT '#3B82F6', icon text, default_priority mail_priority_enum DEFAULT 'normale', requires_approval boolean DEFAULT false, retention_years integer DEFAULT 5, is_active boolean DEFAULT true, display_order integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_categories_parent ON mail_categories(parent_category_id);
CREATE INDEX idx_mail_categories_active ON mail_categories(is_active);

CREATE TABLE mail_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text UNIQUE NOT NULL, mail_type mail_type_enum NOT NULL, category_id uuid REFERENCES mail_categories(id) ON DELETE SET NULL, subject text NOT NULL, description text, sender_name text, sender_organization text, sender_address text, sender_email text, sender_phone text, recipient_name text, recipient_organization text, recipient_address text, recipient_email text, recipient_phone text, mail_date date NOT NULL, received_date timestamptz, sent_date timestamptz, deadline_date date, priority mail_priority_enum DEFAULT 'normale', status mail_status_enum DEFAULT 'recu', format mail_format_enum NOT NULL, external_reference text, reply_to_mail_id uuid REFERENCES mail_items(id) ON DELETE SET NULL, tracking_number text, page_count integer, has_attachments boolean DEFAULT false, is_confidential boolean DEFAULT false, requires_response boolean DEFAULT false, response_deadline date, is_archived boolean DEFAULT false, archived_at timestamptz, archived_by uuid, archive_location text, keywords text[], tags text[], notes text, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), CONSTRAINT valid_dates CHECK ((mail_type = 'entrant' AND received_date IS NOT NULL) OR (mail_type = 'sortant' AND sent_date IS NULL OR sent_date >= created_at)));
CREATE INDEX idx_mail_items_reference ON mail_items(reference);
CREATE INDEX idx_mail_items_type ON mail_items(mail_type);
CREATE INDEX idx_mail_items_category ON mail_items(category_id);
CREATE INDEX idx_mail_items_status ON mail_items(status);
CREATE INDEX idx_mail_items_priority ON mail_items(priority);
CREATE INDEX idx_mail_items_dates ON mail_items(mail_date DESC, received_date DESC);
CREATE INDEX idx_mail_items_archived ON mail_items(is_archived);
CREATE INDEX idx_mail_items_deadline ON mail_items(deadline_date) WHERE deadline_date IS NOT NULL;

CREATE TABLE mail_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mail_id uuid NOT NULL REFERENCES mail_items(id) ON DELETE CASCADE, file_name text NOT NULL, file_path text NOT NULL, file_size bigint NOT NULL, file_type text NOT NULL, mime_type text, checksum text, description text, is_original boolean DEFAULT false, page_count integer, uploaded_by uuid, uploaded_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_attachments_mail ON mail_attachments(mail_id);
CREATE INDEX idx_mail_attachments_uploaded ON mail_attachments(uploaded_at DESC);

CREATE TABLE mail_assignments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mail_id uuid NOT NULL REFERENCES mail_items(id) ON DELETE CASCADE, assigned_to uuid NOT NULL, assigned_by uuid, assignment_status assignment_status_enum DEFAULT 'attribue', role text, is_primary_responsible boolean DEFAULT false, instructions text, assigned_at timestamptz DEFAULT now(), accepted_at timestamptz, started_at timestamptz, completed_at timestamptz, notes text, created_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_assignments_mail ON mail_assignments(mail_id);
CREATE INDEX idx_mail_assignments_user ON mail_assignments(assigned_to);
CREATE INDEX idx_mail_assignments_status ON mail_assignments(assignment_status);
CREATE INDEX idx_mail_assignments_primary ON mail_assignments(is_primary_responsible) WHERE is_primary_responsible = true;

CREATE TABLE mail_responses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mail_id uuid NOT NULL REFERENCES mail_items(id) ON DELETE CASCADE, parent_response_id uuid REFERENCES mail_responses(id) ON DELETE CASCADE, response_type text DEFAULT 'comment', content text NOT NULL, is_internal boolean DEFAULT true, is_draft boolean DEFAULT false, attachments jsonb DEFAULT '[]'::jsonb, mentions uuid[], author_id uuid NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_responses_mail ON mail_responses(mail_id);
CREATE INDEX idx_mail_responses_author ON mail_responses(author_id);
CREATE INDEX idx_mail_responses_parent ON mail_responses(parent_response_id);
CREATE INDEX idx_mail_responses_created ON mail_responses(created_at DESC);

CREATE TABLE mail_tracking (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mail_id uuid NOT NULL REFERENCES mail_items(id) ON DELETE CASCADE, event_type tracking_event_type_enum NOT NULL, event_description text, old_status mail_status_enum, new_status mail_status_enum, location text, ip_address inet, user_agent text, metadata jsonb DEFAULT '{}'::jsonb, performed_by uuid, performed_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_tracking_mail ON mail_tracking(mail_id);
CREATE INDEX idx_mail_tracking_event ON mail_tracking(event_type);
CREATE INDEX idx_mail_tracking_performed ON mail_tracking(performed_at DESC);
CREATE INDEX idx_mail_tracking_user ON mail_tracking(performed_by);

CREATE TABLE mail_approval_workflows (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mail_id uuid NOT NULL REFERENCES mail_items(id) ON DELETE CASCADE, workflow_name text NOT NULL, description text, is_sequential boolean DEFAULT true, current_step integer DEFAULT 1, total_steps integer NOT NULL, status approval_decision_enum DEFAULT 'en_attente', started_at timestamptz DEFAULT now(), completed_at timestamptz, created_by uuid, created_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_approval_workflows_mail ON mail_approval_workflows(mail_id);
CREATE INDEX idx_mail_approval_workflows_status ON mail_approval_workflows(status);

CREATE TABLE mail_approval_steps (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workflow_id uuid NOT NULL REFERENCES mail_approval_workflows(id) ON DELETE CASCADE, step_number integer NOT NULL, approver_id uuid NOT NULL, delegate_id uuid, decision approval_decision_enum DEFAULT 'en_attente', comments text, decided_at timestamptz, sla_hours integer, created_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_approval_steps_workflow ON mail_approval_steps(workflow_id);
CREATE INDEX idx_mail_approval_steps_approver ON mail_approval_steps(approver_id);
CREATE INDEX idx_mail_approval_steps_decision ON mail_approval_steps(decision);

CREATE TABLE mail_archive (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mail_id uuid NOT NULL REFERENCES mail_items(id) ON DELETE CASCADE, archive_reference text UNIQUE NOT NULL, archive_date date NOT NULL DEFAULT CURRENT_DATE, archive_location text NOT NULL, box_number text, shelf_reference text, destruction_date date, retention_period_years integer NOT NULL, legal_hold boolean DEFAULT false, notes text, archived_by uuid, created_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_archive_reference ON mail_archive(archive_reference);
CREATE INDEX idx_mail_archive_location ON mail_archive(archive_location);
CREATE INDEX idx_mail_archive_destruction ON mail_archive(destruction_date) WHERE destruction_date IS NOT NULL;

CREATE TABLE mail_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, category_id uuid REFERENCES mail_categories(id) ON DELETE SET NULL, subject_template text NOT NULL, body_template text NOT NULL, variables jsonb DEFAULT '[]'::jsonb, format mail_format_enum DEFAULT 'email', is_active boolean DEFAULT true, usage_count integer DEFAULT 0, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX idx_mail_templates_category ON mail_templates(category_id);
CREATE INDEX idx_mail_templates_active ON mail_templates(is_active);

-- Triggers
CREATE OR REPLACE FUNCTION update_mail_updated_at() RETURNS trigger AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_mail_items_updated_at BEFORE UPDATE ON mail_items FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();
CREATE TRIGGER trg_mail_categories_updated_at BEFORE UPDATE ON mail_categories FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();
CREATE TRIGGER trg_mail_templates_updated_at BEFORE UPDATE ON mail_templates FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();

CREATE OR REPLACE FUNCTION create_mail_tracking_on_create() RETURNS trigger AS $$ BEGIN INSERT INTO mail_tracking (mail_id, event_type, event_description, new_status, performed_by) VALUES (NEW.id, 'creation', 'Courrier créé: ' || NEW.subject, NEW.status, NEW.created_by); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_mail_tracking_on_create AFTER INSERT ON mail_items FOR EACH ROW EXECUTE FUNCTION create_mail_tracking_on_create();

CREATE OR REPLACE FUNCTION create_mail_tracking_on_status_change() RETURNS trigger AS $$ BEGIN IF OLD.status IS DISTINCT FROM NEW.status THEN INSERT INTO mail_tracking (mail_id, event_type, event_description, old_status, new_status, performed_by) VALUES (NEW.id, 'modification', 'Changement de statut: ' || OLD.status || ' → ' || NEW.status, OLD.status, NEW.status, NEW.created_by); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_mail_tracking_on_status_change AFTER UPDATE OF status ON mail_items FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION create_mail_tracking_on_status_change();

-- Functions
CREATE OR REPLACE FUNCTION calculate_mail_sla(p_mail_id uuid, p_sla_hours integer DEFAULT 48) RETURNS jsonb AS $$ DECLARE mail_data record; hours_elapsed numeric; is_overdue boolean; result jsonb; BEGIN SELECT received_date, status, updated_at INTO mail_data FROM mail_items WHERE id = p_mail_id; IF mail_data.received_date IS NULL THEN RETURN jsonb_build_object('sla_met', true, 'hours_elapsed', 0, 'hours_remaining', p_sla_hours, 'is_overdue', false); END IF; hours_elapsed := EXTRACT(EPOCH FROM (COALESCE(CASE WHEN mail_data.status IN ('traite', 'archive') THEN mail_data.updated_at ELSE now() END, now()) - mail_data.received_date)) / 3600; is_overdue := hours_elapsed > p_sla_hours AND mail_data.status NOT IN ('traite', 'archive'); result := jsonb_build_object('sla_met', hours_elapsed <= p_sla_hours OR mail_data.status IN ('traite', 'archive'), 'hours_elapsed', ROUND(hours_elapsed, 2), 'hours_remaining', GREATEST(0, p_sla_hours - hours_elapsed), 'is_overdue', is_overdue, 'percentage_used', ROUND((hours_elapsed / p_sla_hours * 100)::numeric, 1)); RETURN result; END; $$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION archive_old_mail() RETURNS integer AS $$ DECLARE archived_count integer := 0; BEGIN WITH mails_to_archive AS (SELECT id FROM mail_items WHERE status = 'traite' AND is_archived = false AND updated_at < now() - interval '90 days' AND NOT EXISTS (SELECT 1 FROM mail_assignments WHERE mail_id = mail_items.id AND assignment_status IN ('attribue', 'en_cours'))) UPDATE mail_items SET is_archived = true, archived_at = now(), status = 'archive' WHERE id IN (SELECT id FROM mails_to_archive); GET DIAGNOSTICS archived_count = ROW_COUNT; RETURN archived_count; END; $$ LANGUAGE plpgsql VOLATILE;

-- Views
CREATE OR REPLACE VIEW mail_statistics AS SELECT mail_type, status, priority, COUNT(*) as total_count, COUNT(*) FILTER (WHERE deadline_date < CURRENT_DATE AND status NOT IN ('traite', 'archive')) as overdue_count, COUNT(*) FILTER (WHERE is_archived = true) as archived_count, ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 2) as avg_processing_hours FROM mail_items WHERE created_at >= CURRENT_DATE - interval '30 days' GROUP BY mail_type, status, priority;

CREATE OR REPLACE VIEW mail_pending_action AS SELECT m.id, m.reference, m.mail_type, m.subject, m.priority, m.status, m.deadline_date, m.received_date, mc.name as category_name, ma.assigned_to, ma.assignment_status, CASE WHEN m.deadline_date < CURRENT_DATE THEN 'overdue' WHEN m.deadline_date <= CURRENT_DATE + interval '3 days' THEN 'urgent' ELSE 'normal' END as urgency_level FROM mail_items m LEFT JOIN mail_categories mc ON m.category_id = mc.id LEFT JOIN mail_assignments ma ON m.id = ma.mail_id AND ma.is_primary_responsible = true WHERE m.status IN ('recu', 'en_attente', 'en_cours') AND m.is_archived = false ORDER BY m.priority DESC, m.deadline_date ASC NULLS LAST;

-- RLS
ALTER TABLE mail_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active categories" ON mail_categories FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON mail_categories FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role_id IN (SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin'))));

CREATE POLICY "Users can view their assigned mail" ON mail_items FOR SELECT TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_assignments WHERE mail_assignments.mail_id = mail_items.id AND mail_assignments.assigned_to = auth.uid()) OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role_id IN (SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'administrative_staff'))));

CREATE POLICY "Authorized users can create mail" ON mail_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role_id IN (SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'administrative_staff', 'receptionist'))));

CREATE POLICY "Assigned users can update their mail" ON mail_items FOR UPDATE TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_assignments WHERE mail_assignments.mail_id = mail_items.id AND mail_assignments.assigned_to = auth.uid()));

CREATE POLICY "Users can view attachments of accessible mail" ON mail_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM mail_items WHERE mail_items.id = mail_attachments.mail_id AND (mail_items.created_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_assignments WHERE mail_assignments.mail_id = mail_items.id AND mail_assignments.assigned_to = auth.uid()))));

CREATE POLICY "Users can upload attachments" ON mail_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM mail_items WHERE mail_items.id = mail_attachments.mail_id AND (mail_items.created_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_assignments WHERE mail_assignments.mail_id = mail_items.id AND mail_assignments.assigned_to = auth.uid()))));

CREATE POLICY "Users can view their assignments" ON mail_assignments FOR SELECT TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid() OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role_id IN (SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'administrative_staff'))));

CREATE POLICY "Authorized users can create assignments" ON mail_assignments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role_id IN (SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'administrative_staff'))));

CREATE POLICY "Assigned users can update their assignments" ON mail_assignments FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users can view responses of accessible mail" ON mail_responses FOR SELECT TO authenticated USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM mail_items WHERE mail_items.id = mail_responses.mail_id AND (mail_items.created_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_assignments WHERE mail_assignments.mail_id = mail_items.id AND mail_assignments.assigned_to = auth.uid()))));

CREATE POLICY "Users can create responses" ON mail_responses FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM mail_items WHERE mail_items.id = mail_responses.mail_id AND (mail_items.created_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_assignments WHERE mail_assignments.mail_id = mail_items.id AND mail_assignments.assigned_to = auth.uid()))));

CREATE POLICY "Users can view tracking of accessible mail" ON mail_tracking FOR SELECT TO authenticated USING (performed_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_items WHERE mail_items.id = mail_tracking.mail_id AND (mail_items.created_by = auth.uid() OR EXISTS (SELECT 1 FROM mail_assignments WHERE mail_assignments.mail_id = mail_items.id AND mail_assignments.assigned_to = auth.uid()))));

CREATE POLICY "Everyone can view active templates" ON mail_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON mail_templates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role_id IN (SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'administrative_staff'))));

-- Demo data
INSERT INTO mail_categories (name, description, color_code, icon, default_priority, requires_approval) VALUES ('Administratif', 'Courrier administratif général', '#3B82F6', 'FileText', 'normale', false), ('Médical', 'Courrier médical et ordonnances', '#10B981', 'Heart', 'elevee', true), ('Ressources Humaines', 'RH, contrats, congés', '#F59E0B', 'Users', 'normale', false), ('Juridique', 'Documents juridiques et contentieux', '#EF4444', 'Scale', 'elevee', true), ('Finances', 'Factures, paiements, comptabilité', '#8B5CF6', 'DollarSign', 'normale', false), ('Achats', 'Commandes et fournisseurs', '#EC4899', 'ShoppingCart', 'normale', false), ('Direction', 'Courrier direction générale', '#6366F1', 'Briefcase', 'critique', true) ON CONFLICT DO NOTHING;
