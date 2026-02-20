-- S3 Image Upload Migration
-- Adds image_alt columns to all tables that store image URLs
-- Run this against your PostgreSQL database

-- 1. Attractions: image_alt, desktop_image_alt, desktop_image_url (if not exists)
ALTER TABLE public.attractions
  ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS desktop_image_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS desktop_image_alt VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT;

-- 2. Addons: image_alt
ALTER TABLE public.addons
  ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';

-- 3. Banners: web_image_alt, mobile_image_alt
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS web_image_alt VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS mobile_image_alt VARCHAR(255) DEFAULT '';

-- 4. Blogs: image_alt
ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';

-- 5. Combos: image_alt, desktop_image_alt, desktop_image_url, slug, short_description, meta_title
ALTER TABLE public.combos
  ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS desktop_image_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS desktop_image_alt VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug CITEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT;

-- 6. Offers: image_alt
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';

-- 7. Gallery Items: image_alt
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';

-- 8. Media Files: image_alt (for upload records)
ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT '';

-- Update the combo_details view to include new columns
DROP VIEW IF EXISTS public.combo_details;
CREATE VIEW public.combo_details AS
 SELECT c.combo_id,
    c.name,
    c.slug,
    c.short_description,
    c.meta_title,
    c.attraction_ids,
    c.attraction_prices,
    c.total_price,
    c.image_url,
    c.image_alt,
    c.desktop_image_url,
    c.desktop_image_alt,
    c.discount_percent,
    c.active,
    c.create_slots,
    c.created_at,
    c.updated_at,
    c.attraction_1_id,
    c.attraction_2_id,
    c.combo_price,
    COALESCE(json_agg(json_build_object(
      'attraction_id', ca.attraction_id,
      'title', a.title,
      'price', ca.attraction_price,
      'image_url', a.image_url,
      'image_alt', a.image_alt,
      'slug', a.slug,
      'position_in_combo', ca.position_in_combo
    )) FILTER (WHERE (ca.attraction_id IS NOT NULL)), '[]'::json) AS attractions
   FROM ((public.combos c
     LEFT JOIN public.combo_attractions ca ON ((c.combo_id = ca.combo_id)))
     LEFT JOIN public.attractions a ON ((ca.attraction_id = a.attraction_id)))
  GROUP BY c.combo_id, c.name, c.slug, c.short_description, c.meta_title,
    c.attraction_ids, c.attraction_prices, c.total_price, c.image_url, c.image_alt,
    c.desktop_image_url, c.desktop_image_alt, c.discount_percent, c.active,
    c.create_slots, c.created_at, c.updated_at, c.attraction_1_id, c.attraction_2_id, c.combo_price;
