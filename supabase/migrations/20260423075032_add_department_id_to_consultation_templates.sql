/*
  # Associer les templates de consultation aux services (départements)

  ## Objectif
  Permettre de filtrer les fiches/templates de consultation par service hospitalier.
  Actuellement les templates sont liés à une spécialité (texte libre) mais pas à un
  département structuré de la base de données.

  ## Modifications

  ### Table `consultation_templates`
  - Ajout de `department_id` (uuid, FK → departments) : lie le template à un service précis
  - Le champ est nullable pour rester compatible avec les templates système globaux

  ### Sécurité
  - La politique RLS existante est préservée (pas de modification)
  - Le FK utilise ON DELETE SET NULL pour ne pas perdre les templates si un département est supprimé

  ## Notes
  - Les templates existants conservent department_id = NULL (portée globale)
  - Les nouvelles fiches de consultation peuvent être associées au service du médecin connecté
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultation_templates' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE consultation_templates
      ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultation_templates_department_id
  ON consultation_templates(department_id);
