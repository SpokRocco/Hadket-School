-- =================================================================================
-- SUPABASE DATABASE UPDATE: HOMEPAGE ORDERING, ARRIVAL POPUP & REAL-TIME SYNC
-- โรงเรียนบ้านหาดเค็ด (Project Reference: fhfckuypfstlokashcmu)
-- Description:
--   1. Preserves ALL existing tables and data in the Supabase database
--   2. Adds optional homepage_sections, site_popups, deployment_configs tables
--   3. Safely ensures news categories without overwriting existing records
--   4. Inserts popup/deployment keys into school_settings with ON CONFLICT (key) DO NOTHING
--      so NO existing school data (logo, name, address, phone, stats) is modified
--   5. Enables Supabase Realtime (postgres_changes) across core tables
-- =================================================================================

-- 1. HOMEPAGE SECTIONS ORDERING TABLE
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id VARCHAR(64) PRIMARY KEY,
  section_key VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  subtitle TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Homepage sections are publicly readable" ON public.homepage_sections;
CREATE POLICY "Homepage sections are publicly readable"
  ON public.homepage_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage homepage sections" ON public.homepage_sections;
CREATE POLICY "Admin can manage homepage sections"
  ON public.homepage_sections FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.homepage_sections (id, section_key, label, subtitle, enabled, sort_order)
VALUES
  ('hero', 'hero', '1. แบนเนอร์หลักและประกาศสำคัญ (Hero Showcase)', 'ภาพบรรยากาศโรงเรียน ข้อความต้อนรับ และข้อมูลสถิติสำคัญ', true, 1),
  ('about', 'about', '2. ยินดีต้อนรับสู่โรงเรียนและแนวทางการพัฒนา (Welcome & Vision)', 'วิสัยทัศน์ พันธกิจ ค่านิยมองค์กร และสถิติสำคัญของโรงเรียน', true, 2),
  ('news', 'news', '3. ศูนย์รวมข่าวประชาสัมพันธ์และกิจกรรม (News Hub)', 'ข่าวประชาสัมพันธ์ กิจกรรมนักเรียน ผลงานนักเรียน และประกาศสำคัญ', true, 3),
  ('curriculum', 'curriculum', '4. หลักสูตรที่เปิดสอนและกิจกรรมพัฒนาผู้เรียน (Curriculum)', 'ระดับชั้นที่เปิดสอน หลักสูตร แผนการเรียน และกิจกรรมเสริมหลักสูตร', true, 4),
  ('administrators', 'administrators', '5. ทำเนียบผู้บริหารและสารจากผู้อำนวยการ (Executive Message)', 'ข้อมูลผู้บริหารสถานศึกษา วิสัยทัศน์ และแนวทางการบริหารงาน', true, 5),
  ('media', 'media', '6. คลังสื่อการสอนออนไลน์ & Google Sites (E-Learning Portal)', 'สื่อการสอนดิจิทัล วิดีโอ เอกสาร PDF และพอร์ทัล Google Sites ของครู', true, 6),
  ('newsletter', 'newsletter', '7. วารสารและจดหมายข่าวโรงเรียน (School Newsletters)', 'แผ่นจดหมายข่าวประชาสัมพันธ์รายเดือนและเอกสารดาวน์โหลด', true, 7),
  ('contact', 'contact', '8. ข้อมูลติดต่อและแผนที่ตั้งโรงเรียน (Contact & Location)', 'แบบฟอร์มติดต่อสอบถาม เบอร์โทรศัพท์ และแผนที่การเดินทาง', true, 8)
ON CONFLICT (section_key) DO NOTHING;

-- 2. SITE ARRIVAL POPUPS TABLE
CREATE TABLE IF NOT EXISTS public.site_popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  layout VARCHAR(50) NOT NULL DEFAULT 'image_and_text',
  badge VARCHAR(255) DEFAULT 'ประกาศสำคัญ · SPECIAL ANNOUNCEMENT',
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  image_url TEXT,
  cta_text VARCHAR(150) DEFAULT 'สมัครเรียนออนไลน์',
  cta_url TEXT DEFAULT '/enrollment',
  secondary_text VARCHAR(150) DEFAULT 'อ่านข่าวประชาสัมพันธ์ทั้งหมด',
  secondary_url TEXT DEFAULT '/news',
  frequency VARCHAR(50) NOT NULL DEFAULT 'once_per_day',
  theme_accent VARCHAR(50) NOT NULL DEFAULT 'sky',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site popups are publicly readable" ON public.site_popups;
CREATE POLICY "Site popups are publicly readable"
  ON public.site_popups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage site popups" ON public.site_popups;
CREATE POLICY "Admin can manage site popups"
  ON public.site_popups FOR ALL USING (true) WITH CHECK (true);

-- 3. DEPLOYMENT & REALTIME CONNECTION CONFIGS TABLE
CREATE TABLE IF NOT EXISTS public.deployment_configs (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
  supabase_project_ref VARCHAR(100) DEFAULT 'fhfckuypfstlokashcmu',
  vercel_site_url TEXT DEFAULT '',
  vercel_deploy_hook_url TEXT,
  github_repo_url TEXT DEFAULT 'https://github.com/SpokRocco/Hadket-School',
  github_branch VARCHAR(100) DEFAULT 'main',
  realtime_enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deployment_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deployment configs are publicly readable" ON public.deployment_configs;
CREATE POLICY "Deployment configs are publicly readable"
  ON public.deployment_configs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage deployment configs" ON public.deployment_configs;
CREATE POLICY "Admin can manage deployment configs"
  ON public.deployment_configs FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.deployment_configs (id, supabase_project_ref, vercel_site_url, github_repo_url, github_branch, realtime_enabled)
VALUES ('default', 'fhfckuypfstlokashcmu', '', 'https://github.com/SpokRocco/Hadket-School', 'main', true)
ON CONFLICT (id) DO NOTHING;

-- 4. ENSURE SCHOOL NEWS CATEGORIES WITHOUT OVERWRITING EXISTING
INSERT INTO public.news_categories (name, description, color)
VALUES
  ('ข่าวประชาสัมพันธ์', 'ข่าวประชาสัมพันธ์และการดำเนินงานของโรงเรียนบ้านหาดเค็ด', 'blue'),
  ('กิจกรรม', 'กิจกรรมนักเรียนและโครงการพัฒนาศักยภาพผู้เรียน', 'green'),
  ('ผลงานนักเรียน', 'ทำเนียบผลงานและเกียรติบัตรของนักเรียน', 'purple'),
  ('ความภาคภูมิใจ', 'รางวัลเกียรติยศและความภาคภูมิใจของสถาบัน', 'amber'),
  ('ประกาศ', 'ประกาศสำคัญและการรับสมัครนักเรียนใหม่', 'red')
ON CONFLICT (name) DO NOTHING;

-- 5. UPSERT NEW SCHOOL_SETTINGS KEYS (DO NOT OVERWRITE EXISTING DATA)
INSERT INTO public.school_settings (key, value, category, description)
VALUES
  ('popup_enabled', 'false', 'popup', 'เปิด/ปิด การแสดงผลหน้าต่างป๊อปอัปหน้าแรก'),
  ('popup_layout', 'image_and_text', 'popup', 'รูปแบบป๊อปอัป (image_and_text, image_only, text_only)'),
  ('popup_badge', 'ประกาศสำคัญ · SPECIAL ANNOUNCEMENT', 'popup', 'ป้ายกำกับด้านบนป๊อปอัป'),
  ('popup_title', 'ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด', 'popup', 'หัวข้อหลักของป๊อปอัป'),
  ('popup_subtitle', 'ร่วมมือ วิชาการ งานอาชีพ · ก้าวทันเทคโนโลยี', 'popup', 'หัวข้อรองของป๊อปอัป'),
  ('popup_description', 'ติดตามข่าวสารประชาสัมพันธ์ ปฏิทินกิจกรรม ผลงานนักเรียน และสมัครเรียนออนไลน์ประจำปีการศึกษาได้ที่นี่', 'popup', 'รายละเอียดข้อความในป๊อปอัป'),
  ('popup_cta_text', 'สมัครเรียนออนไลน์', 'popup', 'ข้อความปุ่มหลักในป๊อปอัป'),
  ('popup_cta_url', '/enrollment', 'popup', 'ลิงก์ปลายทางปุ่มหลักในป๊อปอัป'),
  ('popup_secondary_text', 'อ่านข่าวประชาสัมพันธ์ทั้งหมด', 'popup', 'ข้อความปุ่มรองในป๊อปอัป'),
  ('popup_secondary_url', '/news', 'popup', 'ลิงก์ปลายทางปุ่มรองในป๊อปอัป'),
  ('popup_frequency', 'once_per_day', 'popup', 'ความถี่ในการแสดงผล (every_visit, once_per_session, once_per_day)'),
  ('popup_theme_accent', 'sky', 'popup', 'โทนสีเน้นของป๊อปอัป (sky, rose, amber, navy)'),
  ('popup_start_date', '', 'popup', 'วันเริ่มต้นแสดงป๊อปอัป (YYYY-MM-DD)'),
  ('popup_end_date', '', 'popup', 'วันสิ้นสุดการแสดงป๊อปอัป (YYYY-MM-DD)'),
  ('supabase_project_ref', 'fhfckuypfstlokashcmu', 'deployment', 'รหัสโปรเจกต์ฐานข้อมูล Supabase'),
  ('github_repo_url', 'https://github.com/SpokRocco/Hadket-School', 'deployment', 'ลิงก์ GitHub Repository ของเว็บไซต์'),
  ('github_branch', 'main', 'deployment', 'Branch หลักที่เชื่อมต่อกับ Vercel และ GitHub')
ON CONFLICT (key) DO NOTHING;

-- 6. ENABLE SUPABASE REALTIME PUBLICATION FOR LIVE UPDATES
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'school_settings',
    'news',
    'news_categories',
    'events',
    'gallery_albums',
    'gallery_photos',
    'administrators',
    'staff',
    'student_stats',
    'grade_data',
    'student_council',
    'student_achievements',
    'student_activities',
    'admissions',
    'curriculum_programs',
    'curriculum_activities',
    'media_resources',
    'newsletters',
    'homepage_sections',
    'site_popups',
    'deployment_configs'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;
