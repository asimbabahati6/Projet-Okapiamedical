/*
  # Enhanced Posts System with Multilingual Support and Rich Media

  1. Schema Changes
    - Add multilingual fields to `post_categories` table
      - `name_en` (text) - English category name
      - `name_ar` (text) - Arabic category name
      - `description_en` (text) - English description
      - `description_ar` (text) - Arabic description
    
    - Add multilingual and media fields to `posts` table
      - `title_en` (text) - English title
      - `title_ar` (text) - Arabic title
      - `excerpt` (text) - Short excerpt for listings
      - `excerpt_en` (text) - English excerpt
      - `excerpt_ar` (text) - Arabic excerpt
      - `content_en` (text) - English content
      - `content_ar` (text) - Arabic content
      - `featured_image_url` (text) - Main featured image
      - `video_url` (text) - Embedded video URL
      - `slug` (text) - SEO-friendly URL slug
      - `view_count` (integer) - Number of views
      - `reading_time` (integer) - Estimated reading time in minutes
      - `is_featured` (boolean) - Mark as featured article
      - `meta_description` (text) - SEO meta description
      - `scheduled_publish_at` (timestamptz) - Scheduled publication date
    
    - Create new `post_media` table for multiple images/videos
      - `id` (uuid, primary key)
      - `post_id` (uuid) - Reference to posts
      - `media_type` (text) - Type: image, video, embed
      - `media_url` (text) - URL of the media
      - `caption` (text) - Media caption
      - `caption_en` (text) - English caption
      - `caption_ar` (text) - Arabic caption
      - `display_order` (integer) - Order in gallery
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on post_media table
    - Public read access to published post media
    - Admin write access to post media

  3. Updates to Existing Categories
    - Add English and Arabic translations for existing categories

  4. Important Notes
    - All changes use IF NOT EXISTS to prevent errors
    - Existing data is preserved
    - New fields have appropriate defaults
*/

-- Add multilingual fields to post_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_categories' AND column_name = 'name_en'
  ) THEN
    ALTER TABLE post_categories ADD COLUMN name_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_categories' AND column_name = 'name_ar'
  ) THEN
    ALTER TABLE post_categories ADD COLUMN name_ar text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_categories' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE post_categories ADD COLUMN description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_categories' AND column_name = 'description_ar'
  ) THEN
    ALTER TABLE post_categories ADD COLUMN description_ar text;
  END IF;
END $$;

-- Update existing categories with translations
UPDATE post_categories SET 
  name_en = 'Innovation',
  name_ar = 'الابتكار',
  description_en = 'Medical innovations and cutting-edge technologies',
  description_ar = 'الابتكارات الطبية والتقنيات المتطورة'
WHERE name = 'innovation';

UPDATE post_categories SET 
  name_en = 'Event',
  name_ar = 'حدث',
  description_en = 'Events, conferences and hospital news',
  description_ar = 'الأحداث والمؤتمرات وأخبار المستشفى'
WHERE name = 'événement';

UPDATE post_categories SET 
  name_en = 'Product',
  name_ar = 'منتج',
  description_en = 'New medical products and services',
  description_ar = 'المنتجات والخدمات الطبية الجديدة'
WHERE name = 'produit';

UPDATE post_categories SET 
  name_en = 'News',
  name_ar = 'أخبار',
  description_en = 'General news and important information',
  description_ar = 'الأخبار العامة والمعلومات المهمة'
WHERE name = 'actualité';

UPDATE post_categories SET 
  name_en = 'Health',
  name_ar = 'صحة',
  description_en = 'Health tips and prevention',
  description_ar = 'نصائح صحية والوقاية'
WHERE name = 'santé';

-- Add enhanced fields to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'title_en'
  ) THEN
    ALTER TABLE posts ADD COLUMN title_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'title_ar'
  ) THEN
    ALTER TABLE posts ADD COLUMN title_ar text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'excerpt'
  ) THEN
    ALTER TABLE posts ADD COLUMN excerpt text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'excerpt_en'
  ) THEN
    ALTER TABLE posts ADD COLUMN excerpt_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'excerpt_ar'
  ) THEN
    ALTER TABLE posts ADD COLUMN excerpt_ar text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'content_en'
  ) THEN
    ALTER TABLE posts ADD COLUMN content_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'content_ar'
  ) THEN
    ALTER TABLE posts ADD COLUMN content_ar text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'featured_image_url'
  ) THEN
    ALTER TABLE posts ADD COLUMN featured_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE posts ADD COLUMN video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'slug'
  ) THEN
    ALTER TABLE posts ADD COLUMN slug text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'reading_time'
  ) THEN
    ALTER TABLE posts ADD COLUMN reading_time integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE posts ADD COLUMN meta_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'scheduled_publish_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN scheduled_publish_at timestamptz;
  END IF;
END $$;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL;

-- Create index for featured posts
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured) WHERE is_featured = true;

-- Create index for view count
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC);

-- Create post_media table
CREATE TABLE IF NOT EXISTS post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'embed')),
  media_url text NOT NULL,
  caption text,
  caption_en text,
  caption_ar text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for post_media
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_display_order ON post_media(post_id, display_order);

-- Enable RLS on post_media
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_media
-- Users can view media for published posts
CREATE POLICY "Users can view published post media"
  ON post_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_media.post_id
      AND (
        posts.status = 'publié'
        OR is_admin_or_super_admin()
        OR posts.author_id = auth.uid()
      )
    )
  );

-- Admins can manage post media
CREATE POLICY "Admins can insert post media"
  ON post_media FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_super_admin());

CREATE POLICY "Admins can update post media"
  ON post_media FOR UPDATE
  TO authenticated
  USING (is_admin_or_super_admin())
  WITH CHECK (is_admin_or_super_admin());

CREATE POLICY "Admins can delete post media"
  ON post_media FOR DELETE
  TO authenticated
  USING (is_admin_or_super_admin());

-- Function to automatically generate slug from title
CREATE OR REPLACE FUNCTION generate_post_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL AND NEW.title IS NOT NULL THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.title, '[éèêë]', 'e', 'g'),
          '[àâä]', 'a', 'g'
        ),
        '[^a-z0-9]+', '-', 'g'
      )
    );
    -- Ensure uniqueness
    IF EXISTS (SELECT 1 FROM posts WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      NEW.slug := NEW.slug || '-' || substr(NEW.id::text, 1, 8);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to generate slug
DROP TRIGGER IF EXISTS generate_post_slug_trigger ON posts;
CREATE TRIGGER generate_post_slug_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION generate_post_slug();

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  word_count integer;
  words_per_minute integer := 200;
BEGIN
  IF NEW.content IS NOT NULL THEN
    word_count := array_length(regexp_split_to_array(NEW.content, '\s+'), 1);
    NEW.reading_time := GREATEST(1, CEIL(word_count::numeric / words_per_minute));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to calculate reading time
DROP TRIGGER IF EXISTS calculate_reading_time_trigger ON posts;
CREATE TRIGGER calculate_reading_time_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  WHEN (NEW.content IS NOT NULL)
  EXECUTE FUNCTION calculate_reading_time();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_post_views(post_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id_param;
END;
$$;
