/*
  # Ajout des Colonnes de Routage aux Rendez-vous

  ## Description
  Cette migration ajoute des colonnes à la table appointments pour tracer
  le routage automatique des patients (nouveaux vs existants) et permettre
  l'audit des changements manuels de médecin assigné.

  ## Modifications

  1. **Nouvelles Colonnes dans appointments**
     - routing_type (text) - Type de routage appliqué
       * 'new_patient_to_reception' - Nouveau patient routé vers réception
       * 'existing_patient_to_pcp' - Patient existant vers médecin traitant
       * 'manual_override' - Changement manuel par l'utilisateur
     - routing_notes (text) - Justification en cas de changement manuel
     - is_new_patient_appointment (boolean) - Flag indiquant un nouveau patient

  ## Indexes
  - Index sur routing_type pour analyses et rapports

  ## Notes Importantes
  - Les colonnes sont nullables pour compatibilité avec les rendez-vous existants
  - Les nouveaux rendez-vous doivent systématiquement renseigner routing_type
*/

-- Ajouter la colonne routing_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'routing_type'
  ) THEN
    ALTER TABLE appointments ADD COLUMN routing_type text;
  END IF;
END $$;

-- Ajouter la colonne routing_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'routing_notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN routing_notes text;
  END IF;
END $$;

-- Ajouter la colonne is_new_patient_appointment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'is_new_patient_appointment'
  ) THEN
    ALTER TABLE appointments ADD COLUMN is_new_patient_appointment boolean DEFAULT false;
  END IF;
END $$;

-- Créer un index sur routing_type pour faciliter les analyses
CREATE INDEX IF NOT EXISTS idx_appointments_routing_type
ON appointments(routing_type)
WHERE routing_type IS NOT NULL;

-- Ajouter une contrainte CHECK pour valider les valeurs de routing_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_appointments_routing_type'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT check_appointments_routing_type
    CHECK (
      routing_type IS NULL OR
      routing_type IN (
        'new_patient_to_reception',
        'existing_patient_to_pcp',
        'manual_override'
      )
    );
  END IF;
END $$;

-- Commentaires sur les colonnes
COMMENT ON COLUMN appointments.routing_type IS 'Type de routage appliqué: new_patient_to_reception, existing_patient_to_pcp, ou manual_override';
COMMENT ON COLUMN appointments.routing_notes IS 'Notes de justification en cas de changement manuel du médecin assigné';
COMMENT ON COLUMN appointments.is_new_patient_appointment IS 'Indique si ce rendez-vous concerne un nouveau patient (premier rendez-vous)';
