-- ==============================================================================
-- SUPABASE MIGRATION: GALLERY MULTI-UPLOAD, HERO SLIDER & CURRICULUM ENHANCEMENTS
-- โรงเรียนบ้านหาดเค็ด (SpokRocco/Hadket-School)
-- ==============================================================================

-- 1. Ensure columns exist on gallery_albums for Google Photos Album sync
ALTER TABLE IF EXISTS public.gallery_albums 
  ADD COLUMN IF NOT EXISTS google_photos_url TEXT;

-- 2. Ensure image_url exists on curriculum_programs and curriculum_activities
ALTER TABLE IF EXISTS public.curriculum_programs 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE IF EXISTS public.curriculum_activities 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Ensure school_settings keys for Hero Slider are initialized
INSERT INTO public.school_settings (key, value, category, description)
VALUES 
  ('hero_slides_json', '[]', 'homepage', 'ข้อมูลภาพสไลด์และเนื้อหาบนแบนเนอร์หลักหัวเว็บ JSON'),
  ('hero_autoplay_enabled', 'true', 'homepage', 'เปิดใช้งานการสลับภาพสไลด์หัวเว็บอัตโนมัติ'),
  ('hero_autoplay_interval', '6000', 'homepage', 'ระยะเวลาหน่วงในการสลับภาพสไลด์หัวเว็บ (มิลลิวินาที)')
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Supabase Realtime Replication for instant live sync
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_albums';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_photos';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.school_settings';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.curriculum_programs';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.curriculum_activities';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table already in publication or permission notice
  RAISE NOTICE 'Notice: %', SQLERRM;
END $$;

-- 5. Ensure Storage Bucket for images allows public reads and uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure public access policies on storage.objects for 'images'
DO $$
BEGIN
  CREATE POLICY "Public Access for Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Public Upload for Images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Public Update for Images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Public Delete for Images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
