/*
  # Fix post slug generation for French accented characters

  ## Problem
  The existing `generate_post_slug` trigger function only handles a subset of
  French accented characters (éèêë → e, àâä → a) and only in lowercase.
  Uppercase accented letters (É, È, Ê, Ô, Û, Ç, etc.) were not matched and
  were instead stripped by the `[^a-z0-9]+` fallback, producing broken slugs
  like "-kapia-edical-a-evolution-de-la-edecine-ans-icatrice-en-" for a title
  that starts with uppercase French words.

  ## Changes
  - Replace the trigger function with a comprehensive version that converts the
    title to lowercase first, then maps all common French accented characters
    to their ASCII equivalents before slugifying.
  - Re-generate the slug for any existing post that has a broken slug
    (i.e. starts or ends with a hyphen, or contains consecutive hyphens).
*/

CREATE OR REPLACE FUNCTION generate_post_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Lower-case first, then replace all French/accented characters
    base_slug := lower(NEW.title);

    -- Vowels with diacritics
    base_slug := regexp_replace(base_slug, '[éèêë]', 'e', 'g');
    base_slug := regexp_replace(base_slug, '[àâä]', 'a', 'g');
    base_slug := regexp_replace(base_slug, '[ôö]',  'o', 'g');
    base_slug := regexp_replace(base_slug, '[ùûü]', 'u', 'g');
    base_slug := regexp_replace(base_slug, '[îï]',  'i', 'g');
    -- Consonants
    base_slug := regexp_replace(base_slug, 'ç', 'c', 'g');
    base_slug := regexp_replace(base_slug, 'ñ', 'n', 'g');
    -- Replace any remaining non-alphanumeric characters with hyphens
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    -- Strip leading/trailing hyphens
    base_slug := trim(both '-' from base_slug);

    -- Ensure uniqueness
    IF EXISTS (
      SELECT 1 FROM posts
      WHERE slug = base_slug
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      base_slug := base_slug || '-' || substr(NEW.id::text, 1, 8);
    END IF;

    NEW.slug := base_slug;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-generate broken slugs for existing posts
-- A slug is considered broken when it starts/ends with a hyphen or has '--'
UPDATE posts
SET slug = NULL
WHERE
  slug IS NOT NULL
  AND (
    slug LIKE '-%'
    OR slug LIKE '%-'
    OR slug LIKE '%--%'
  );

-- The trigger will regenerate NULL slugs on the next UPDATE.
-- Force a no-op update to trigger slug regeneration on broken rows.
UPDATE posts
SET updated_at = now()
WHERE slug IS NULL;
