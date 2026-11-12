-- ==============================================================================
-- SUPABASE MIGRATION: DEDICATED HERO_SLIDES TABLE, GALLERY WITH GOOGLE DRIVE & QUICK CHAT
-- โรงเรียนบ้านหาดเค็ด (SpokRocco/Hadket-School)
-- ปลอดภัย 100%: สามารถรันซ้ำได้โดยไม่เกิด Error และไม่ลบข้อมูลเดิมของโรงเรียน
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
  image_position TEXT DEFAULT 'center center',
  image_scale NUMERIC DEFAULT 1,
  show_kicker BOOLEAN NOT NULL DEFAULT true,
  show_subline BOOLEAN NOT NULL DEFAULT true,
  show_subtitle BOOLEAN NOT NULL DEFAULT true,
  show_primary_btn BOOLEAN NOT NULL DEFAULT true,
  show_secondary_btn BOOLEAN NOT NULL DEFAULT true,
  show_stats BOOLEAN NOT NULL DEFAULT true,
  show_overlay BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade existing hero_slides table if columns don't exist yet
ALTER TABLE IF EXISTS public.hero_slides
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center center',
  ADD COLUMN IF NOT EXISTS image_scale NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS show_kicker BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_subline BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_subtitle BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_primary_btn BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_secondary_btn BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_stats BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_overlay BOOLEAN DEFAULT true;

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON public.hero_slides (order_position ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hero_slides (Allow public read & full access)
DROP POLICY IF EXISTS "Public Read for hero_slides" ON public.hero_slides;
CREATE POLICY "Public Read for hero_slides" ON public.hero_slides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Full Access for hero_slides" ON public.hero_slides;
CREATE POLICY "Public Full Access for hero_slides" ON public.hero_slides FOR ALL USING (true) WITH CHECK (true);

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

-- 3. Comprehensive Schema Compatibility for gallery_albums & gallery_photos
-- ปลอดภัย 100%: ป้องกัน Error เรื่องชื่อคอลัมน์ไม่ตรงกันระหว่างโค้ดกับฐานข้อมูล
ALTER TABLE IF EXISTS public.gallery_albums 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'ทั่วไป',
  ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS google_drive_url TEXT,
  ADD COLUMN IF NOT EXISTS google_photos_url TEXT;

-- Drop NOT NULL on name so inserting with title succeeds smoothly
DO $$
BEGIN
  ALTER TABLE public.gallery_albums ALTER COLUMN name DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Synchronize name <-> title and cover_image_url <-> cover_photo_url
UPDATE public.gallery_albums SET title = name WHERE (title IS NULL OR title = '') AND name IS NOT NULL;
UPDATE public.gallery_albums SET name = title WHERE (name IS NULL OR name = '') AND title IS NOT NULL;
UPDATE public.gallery_albums SET cover_photo_url = cover_image_url WHERE (cover_photo_url IS NULL OR cover_photo_url = '') AND cover_image_url IS NOT NULL;
UPDATE public.gallery_albums SET cover_image_url = cover_photo_url WHERE (cover_image_url IS NULL OR cover_image_url = '') AND cover_photo_url IS NOT NULL;

-- Ensure columns exist on gallery_photos
ALTER TABLE IF EXISTS public.gallery_photos 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Drop NOT NULL on image_url so inserting with photo_url succeeds smoothly
DO $$
BEGIN
  ALTER TABLE public.gallery_photos ALTER COLUMN image_url DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

UPDATE public.gallery_photos SET photo_url = image_url WHERE (photo_url IS NULL OR photo_url = '') AND image_url IS NOT NULL;
UPDATE public.gallery_photos SET image_url = photo_url WHERE (image_url IS NULL OR image_url = '') AND photo_url IS NOT NULL;
UPDATE public.gallery_photos SET order_position = sort_order WHERE order_position = 0 AND sort_order != 0;
UPDATE public.gallery_photos SET sort_order = order_position WHERE sort_order = 0 AND order_position != 0;

-- 4. Ensure image_url exists on curriculum_programs and curriculum_activities
ALTER TABLE IF EXISTS public.curriculum_programs 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE IF EXISTS public.curriculum_activities 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 5. Ensure contact_messages table exists for Quick LINE Chat and Contact inquiries
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert for contact_messages" ON public.contact_messages;
CREATE POLICY "Public insert for contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public select for contact_messages" ON public.contact_messages;
CREATE POLICY "Public select for contact_messages" ON public.contact_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public update for contact_messages" ON public.contact_messages;
CREATE POLICY "Public update for contact_messages" ON public.contact_messages FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete for contact_messages" ON public.contact_messages;
CREATE POLICY "Public delete for contact_messages" ON public.contact_messages FOR DELETE USING (true);

-- 6. Ensure school_settings keys for Hero Slider, Sub-Hero Images, and Quick LINE Chat are initialized
INSERT INTO public.school_settings (key, value, category, description)
VALUES 
  ('hero_slides_json', '[]', 'homepage', 'ข้อมูลภาพสไลด์และเนื้อหาบนแบนเนอร์หลักหัวเว็บ JSON'),
  ('hero_autoplay_enabled', 'true', 'homepage', 'เปิดใช้งานการสลับภาพสไลด์หัวเว็บอัตโนมัติ'),
  ('hero_autoplay_interval', '6000', 'homepage', 'ระยะเวลาหน่วงในการสลับภาพสไลด์หัวเว็บ (มิลลิวินาที)'),
  ('about_left_image_url', '', 'homepage', 'รูปภาพไฮไลท์ซ้ายใต้ภาพสไลด์ (บรรยากาศโรงเรียน)'),
  ('about_left_image_caption', 'บรรยากาศโรงเรียนบ้านหาดเค็ด', 'homepage', 'คำบรรยายภาพซ้ายใต้ภาพสไลด์'),
  ('about_right_image_url', '', 'homepage', 'รูปภาพไฮไลท์ขวาใต้ภาพสไลด์ (กิจกรรมนักเรียน)'),
  ('about_right_image_caption', 'กิจกรรมนักเรียน โรงเรียนบ้านหาดเค็ด', 'homepage', 'คำบรรยายภาพขวาใต้ภาพสไลด์'),
  ('quick_chat_enabled', 'true', 'chat', 'เปิด/ปิดการแสดงผลแชทด่วนมุมขวาล่าง'),
  ('quick_chat_title', 'แชทด่วนสอบถามข้อมูล', 'chat', 'หัวข้อแชทด่วนมุมขวาล่าง'),
  ('quick_chat_greeting', 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด มีข้อสงสัยหรือต้องการสอบถามข้อมูล สามารถแชทคุยกับเราได้เลยครับ', 'chat', 'ข้อความทักทายอัตโนมัติในแชทด่วน'),
  ('quick_chat_school_line', 'https://line.me/ti/p/~hadkedschool', 'chat', 'ลิงก์กลุ่ม LINE โรงเรียน หรือ LINE Official'),
  ('quick_chat_director_line', 'https://line.me/ti/p/~director.hadked', 'chat', 'ลิงก์ LINE ผู้อำนวยการ หรือ ผู้บริหารสถานศึกษา'),
  ('quick_chat_phone', '054-710-123', 'chat', 'เบอร์โทรศัพท์ติดต่อด่วน'),
  ('quick_chat_auto_open_home', 'true', 'chat', 'เปิดป๊อปอัพแชท LINE อัตโนมัติทุกครั้งเมื่อรีเฟรชหน้าจอหรือกลับหน้าหลัก')
ON CONFLICT (key) DO NOTHING;

-- 7. Enable Supabase Realtime Replication for instant live sync without errors
DO $$
DECLARE
  tbl TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY ARRAY[
      'hero_slides', 'gallery_albums', 'gallery_photos',
      'school_settings', 'curriculum_programs', 'curriculum_activities',
      'contact_messages'
    ]
    LOOP
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
        ) THEN
          EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        END IF;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN undefined_table THEN NULL;
        WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
END $$;

-- 8. Ensure Storage Bucket for images allows public reads and uploads without size restrictions (100MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 104857600, null)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600, allowed_mime_types = null;

-- Ensure public access policies on storage.objects for 'images'
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access for Images" ON storage.objects;
  CREATE POLICY "Public Access for Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Upload for Images" ON storage.objects;
  CREATE POLICY "Public Upload for Images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Update for Images" ON storage.objects;
  CREATE POLICY "Public Update for Images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Delete for Images" ON storage.objects;
  CREATE POLICY "Public Delete for Images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'images');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 9. Comprehensive Upgrade for admin_users (RBAC Permissions & 5 Roles Support)
-- ปลดล็อก Check constraint เดิมที่จำกัดเฉพาะบาง Role เพื่อให้รองรับ executive, admin, teacher, staff, sapha_plus
-- ==============================================================================
ALTER TABLE IF EXISTS public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE IF EXISTS public.admin_users
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS subject_department TEXT,
  ADD COLUMN IF NOT EXISTS custom_link_slug TEXT,
  ADD COLUMN IF NOT EXISTS google_site_url TEXT,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Synchronize password <-> password_hash
UPDATE public.admin_users SET password = password_hash WHERE (password IS NULL OR password = '') AND password_hash IS NOT NULL;
UPDATE public.admin_users SET password_hash = password WHERE (password_hash IS NULL OR password_hash = '') AND password IS NOT NULL;

-- Ensure RLS on admin_users allows full access for app admin operations
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read admin_users" ON public.admin_users;
CREATE POLICY "Public Read admin_users" ON public.admin_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Full Access admin_users" ON public.admin_users;
CREATE POLICY "Public Full Access admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);

-- Ensure admin_users is in realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_users'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;
    END IF;
  END IF;
END $$;

