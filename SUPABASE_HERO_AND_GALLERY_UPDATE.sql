-- ==============================================================================
-- SUPABASE MIGRATION: DEDICATED HERO_SLIDES TABLE, GALLERY & CURRICULUM FULL CONTROL
-- โรงเรียนบ้านหาดเค็ด (SpokRocco/Hadket-School)
-- ==============================================================================

-- 1. Create Dedicated hero_slides table for Full Control Hero Slider
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  kicker TEXT DEFAULT '',
  subline TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  primary_label TEXT DEFAULT 'สมัครเรียนออนไลน์',
  primary_href TEXT DEFAULT '/enrollment',
  secondary_label TEXT DEFAULT 'เกี่ยวกับโรงเรียน',
  secondary_href TEXT DEFAULT '/about',
  track1_name TEXT DEFAULT 'นักเรียนปัจจุบัน',
  track1_range TEXT DEFAULT '74 คน',
  track2_name TEXT DEFAULT 'ระยะเวลาหลักสูตร',
  track2_range TEXT DEFAULT '9 ปี',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON public.hero_slides (order_position ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hero_slides (Allow public read & authenticated/anon manage for dashboard)
DO $$
BEGIN
  CREATE POLICY "Public Read for hero_slides"
    ON public.hero_slides FOR SELECT
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Public Insert for hero_slides"
    ON public.hero_slides FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Public Update for hero_slides"
    ON public.hero_slides FOR UPDATE
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Public Delete for hero_slides"
    ON public.hero_slides FOR DELETE
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Seed default 3 slides if hero_slides table is empty
INSERT INTO public.hero_slides (
  id, title, subtitle, kicker, subline, image_url, 
  primary_label, primary_href, secondary_label, secondary_href, 
  track1_name, track1_range, track2_name, track2_range, 
  is_active, order_position
)
VALUES
  (
    'slide-admissions',
    'ร่วมมือ วิชาการ งานอาชีพ ด้วยปัญญา',
    'มุ่งพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษา ส่งเสริมคุณธรรม น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง พร้อมก้าวทันเทคโนโลยี',
    'เปิดรับสมัครนักเรียนใหม่ · ปีการศึกษา 2569',
    'ร่วมมือ วิชาการ งานอาชีพ · โรงเรียนบ้านหาดเค็ด',
    '',
    'สมัครเรียนออนไลน์',
    '/enrollment',
    'เกี่ยวกับโรงเรียน',
    '/about',
    'นักเรียนปัจจุบัน',
    '74 คน',
    'ระยะเวลาหลักสูตร',
    '9 ปี',
    true,
    1
  ),
  (
    'slide-academic',
    'มุ่งเน้นความเป็นเลิศทางวิชาการและเทคโนโลยี',
    'ส่งเสริมการเรียนรู้วิทยาศาสตร์ คณิตศาสตร์ ภาษาต่างประเทศ และนวัตกรรมดิจิทัลเพื่ออนาคต',
    'พัฒนาศักยภาพผู้เรียนรอบด้าน',
    'ห้องปฏิบัติการวิทยาศาสตร์ และคอมพิวเตอร์ทันสมัย',
    '',
    'ดูหลักสูตรการศึกษา',
    '/curriculum',
    'ผลงานนักเรียน',
    '/news',
    'ปีแห่งความเป็นเลิศ',
    'พัฒนาต่อเนื่อง',
    'อัตราศึกษาต่อ',
    '100 %',
    true,
    2
  ),
  (
    'slide-activities',
    'กิจกรรมส่งเสริมทักษะชีวิตและคุณธรรม',
    'ปลูกฝังวินัย คุณธรรม จริยธรรม และการทำงานร่วมกันผ่านกิจกรรมลูกเสือ กีฬา และศิลปวัฒนธรรม',
    'กิจกรรมพัฒนาผู้เรียนรอบด้าน',
    'ดนตรี กีฬา ศิลปะ จิตอาสา',
    '',
    'คลังภาพกิจกรรม',
    '/gallery',
    'ติดต่อโรงเรียน',
    '/contact',
    'ศิษย์เก่าโรงเรียน',
    'เครือข่ายเข้มแข็ง',
    'กิจกรรมสภานักเรียน',
    'พัฒนาผู้เรียนรอบด้าน',
    true,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure columns exist on gallery_albums for Google Photos Album sync
ALTER TABLE IF EXISTS public.gallery_albums 
  ADD COLUMN IF NOT EXISTS google_photos_url TEXT;

-- 4. Ensure image_url exists on curriculum_programs and curriculum_activities
ALTER TABLE IF EXISTS public.curriculum_programs 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE IF EXISTS public.curriculum_activities 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 5. Ensure school_settings keys for Hero Slider are initialized
INSERT INTO public.school_settings (key, value, category, description)
VALUES 
  ('hero_slides_json', '[]', 'homepage', 'ข้อมูลภาพสไลด์และเนื้อหาบนแบนเนอร์หลักหัวเว็บ JSON'),
  ('hero_autoplay_enabled', 'true', 'homepage', 'เปิดใช้งานการสลับภาพสไลด์หัวเว็บอัตโนมัติ'),
  ('hero_autoplay_interval', '6000', 'homepage', 'ระยะเวลาหน่วงในการสลับภาพสไลด์หัวเว็บ (มิลลิวินาที)')
ON CONFLICT (key) DO NOTHING;

-- 6. Enable Supabase Realtime Replication for instant live sync
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_slides';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_albums';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_photos';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.school_settings';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.curriculum_programs';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.curriculum_activities';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Notice: %', SQLERRM;
END $$;

-- 7. Ensure Storage Bucket for images allows public reads and uploads without size restrictions
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
