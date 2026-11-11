-- =================================================================================
-- SUPABASE DATABASE UPDATE: HOMEPAGE ORDERING, ARRIVAL POPUP & REAL-TIME SYNC
-- โรงเรียนบ้านหาดเค็ด (Project Reference: fhfckuypfstlokashcmu)
-- Description:
--   1. Preserves ALL existing tables and data in the Supabase database
--   2. Adds dedicated homepage_sections, site_popups, deployment_configs tables
--   3. Safely ensures news ordering columns and news categories without overwriting
--   4. Inserts homepage ordering/popup/deployment keys into school_settings with
--      ON CONFLICT (key) DO NOTHING so NO existing school data is overwritten
--   5. Enables Supabase Realtime (postgres_changes) across core + new tables
-- =================================================================================

-- 0. ENSURE NEWS & NEWSLETTERS ORDERING COLUMNS / TABLES EXIST SAFELY
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_no VARCHAR(50) NOT NULL DEFAULT '01',
  academic_year VARCHAR(20) NOT NULL DEFAULT '2568',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'กิจกรรมสถานศึกษา',
  image_url TEXT,
  file_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS order_position INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for newsletters" ON public.newsletters;
CREATE POLICY "Allow full access for newsletters"
  ON public.newsletters FOR ALL USING (true) WITH CHECK (true);

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
  ('newsletter', 'newsletter', '4. จดหมายข่าวประชาสัมพันธ์ (School Newsletters)', 'จดหมายข่าวประชาสัมพันธ์และวารสารโรงเรียนจากฐานข้อมูล Supabase', true, 4),
  ('curriculum', 'curriculum', '5. หลักสูตรที่เปิดสอนและกิจกรรมพัฒนาผู้เรียน (Curriculum)', 'ระดับชั้นที่เปิดสอน หลักสูตร แผนการเรียน และกิจกรรมเสริมหลักสูตร', true, 5),
  ('administrators', 'administrators', '6. ทำเนียบผู้บริหารและสารจากผู้อำนวยการ (Executive Message)', 'ข้อมูลผู้บริหารสถานศึกษา วิสัยทัศน์ และแนวทางการบริหารงาน', true, 6),
  ('media', 'media', '7. คลังสื่อการสอนออนไลน์ & Google Sites (E-Learning Portal)', 'สื่อการสอนดิจิทัล วิดีโอ เอกสาร PDF และพอร์ทัล Google Sites ของครู', true, 7),
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
  ('homepage_sections_order', '[{"id":"hero","label":"1. แบนเนอร์หลักและประกาศสำคัญ (Hero Showcase)","subtitle":"ภาพบรรยากาศโรงเรียน ข้อความต้อนรับ และข้อมูลสถิติสำคัญ","enabled":true,"order":1},{"id":"about","label":"2. ยินดีต้อนรับสู่โรงเรียนและแนวทางการพัฒนา (Welcome & Vision)","subtitle":"วิสัยทัศน์ พันธกิจ ค่านิยมองค์กร และสถิติสำคัญของโรงเรียน","enabled":true,"order":2},{"id":"news","label":"3. ศูนย์รวมข่าวประชาสัมพันธ์และกิจกรรม (News Hub)","subtitle":"ข่าวประชาสัมพันธ์ กิจกรรมนักเรียน ผลงานนักเรียน และประกาศสำคัญ","enabled":true,"order":3},{"id":"newsletter","label":"4. จดหมายข่าวประชาสัมพันธ์ (School Newsletters)","subtitle":"จดหมายข่าวประชาสัมพันธ์และวารสารโรงเรียนจากฐานข้อมูล Supabase","enabled":true,"order":4},{"id":"curriculum","label":"5. หลักสูตรที่เปิดสอนและกิจกรรมพัฒนาผู้เรียน (Curriculum)","subtitle":"ระดับชั้นที่เปิดสอน หลักสูตร แผนการเรียน และกิจกรรมเสริมหลักสูตร","enabled":true,"order":5},{"id":"administrators","label":"6. ทำเนียบผู้บริหารและสารจากผู้อำนวยการ (Executive Message)","subtitle":"ข้อมูลผู้บริหารสถานศึกษา วิสัยทัศน์ และแนวทางการบริหารงาน","enabled":true,"order":6},{"id":"media","label":"7. คลังสื่อการสอนออนไลน์ & Google Sites (E-Learning Portal)","subtitle":"สื่อการสอนดิจิทัล วิดีโอ เอกสาร PDF และพอร์ทัล Google Sites ของครู","enabled":true,"order":7},{"id":"contact","label":"8. ข้อมูลติดต่อและแผนที่ตั้งโรงเรียน (Contact & Location)","subtitle":"แบบฟอร์มติดต่อสอบถาม เบอร์โทรศัพท์ และแผนที่การเดินทาง","enabled":true,"order":8}]', 'homepage', 'ลำดับและสถานะการแสดงผลส่วนประกอบหน้าแรก'),
  ('news_hub_order', '[{"id":"public_relations","label":"หมวดข่าวประชาสัมพันธ์ (Public Relations)","subtitle":"แถวการ์ดข่าวประชาสัมพันธ์และประกาศสำคัญ 3 คอลัมน์","enabled":true,"order":1},{"id":"student_activities","label":"หมวดกิจกรรมล่าสุด (Latest Student Activities)","subtitle":"แถวการ์ดกิจกรรมนักเรียนและโครงการพัฒนาผู้เรียน","enabled":true,"order":2},{"id":"featured_highlight","label":"แบนเนอร์กิจกรรมเด่น (Featured Activity Showcase)","subtitle":"ไฮไลต์ภาพบรรยากาศและลิงก์ประมวลภาพกิจกรรมของโรงเรียน","enabled":true,"order":3},{"id":"spotlight_columns","label":"โซน 3 คอลัมน์ (ผลงานนักเรียน · ความภาคภูมิใจ · ติดต่อเรา)","subtitle":"สรุปผลงานนักเรียน รางวัลความภาคภูมิใจ และข้อมูลติดต่อด่วน","enabled":true,"order":4},{"id":"quick_services","label":"แถบทางลัดบริการด่วน 4 รายการ (Quick Access Strip)","subtitle":"ปฏิทินกิจกรรม, จดหมายข่าวโรงเรียน, การสมัครเรียน, ช่องทางการติดต่อ","enabled":true,"order":5}]', 'homepage', 'ลำดับบล็อกย่อยในศูนย์ข่าวประชาสัมพันธ์หน้าแรก'),
  ('navbar_menu_items', '[{"id":"home","label":"หน้าหลัก","href":"/","enabled":true,"order":1},{"id":"about","label":"เกี่ยวกับเรา","href":"/about","enabled":true,"order":2},{"id":"curriculum","label":"หลักสูตร","href":"/curriculum","enabled":true,"order":3},{"id":"news","label":"ข่าวสาร","href":"/news","enabled":true,"order":4},{"id":"newsletters","label":"จดหมายข่าวประชาสัมพันธ์","href":"/newsletters","enabled":true,"order":5},{"id":"media","label":"คลังสื่อ","href":"/media-library","enabled":true,"order":6},{"id":"contact","label":"ติดต่อเรา","href":"/contact","enabled":true,"order":7}]', 'homepage', 'รายการเมนูแถบนำทางด้านบนของหน้าหลัก'),
  ('newsletter_section_title', 'จดหมายข่าวประชาสัมพันธ์', 'homepage', 'หัวข้อส่วนจดหมายข่าวบนหน้าหลัก'),
  ('newsletter_section_subtitle', 'วารสารและจดหมายข่าวสรุปกิจกรรมสำคัญของโรงเรียน (ดึงข้อมูลจริงจากฐานข้อมูล)', 'homepage', 'คำอธิบายรองส่วนจดหมายข่าวบนหน้าหลัก'),
  ('newsletter_home_limit', '3', 'homepage', 'จำนวนจดหมายข่าวที่แสดงบนหน้าหลัก'),
  ('newsletter_home_category', 'ทั้งหมด', 'homepage', 'หมวดหมู่จดหมายข่าวที่กรองแสดงบนหน้าหลัก'),
  ('newsletter_home_sort', 'latest', 'homepage', 'วิธีเรียงลำดับจดหมายข่าวหน้าหลัก (latest, custom_order)'),
  ('popup_enabled', 'false', 'popup', 'เปิด/ปิด การแสดงผลหน้าต่างป๊อปอัปหน้าแรก'),
  ('popup_layout', 'image_and_text', 'popup', 'รูปแบบป๊อปอัป (image_and_text, image_only, text_only)'),
  ('popup_badge', 'ประกาศสำคัญ · SPECIAL ANNOUNCEMENT', 'popup', 'ป้ายกำกับด้านบนป๊อปอัป'),
  ('popup_title', 'ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด', 'popup', 'หัวข้อหลักของป๊อปอัป'),
  ('popup_subtitle', 'ร่วมมือ วิชาการ งานอาชีพ · ก้าวทันเทคโนโลยี', 'popup', 'หัวข้อรองของป๊อปอัป'),
  ('popup_description', 'ติดตามข่าวสารประชาสัมพันธ์ ปฏิทินกิจกรรม ผลงานนักเรียน และสมัครเรียนออนไลน์ประจำปีการศึกษาได้ที่นี่', 'popup', 'รายละเอียดข้อความในป๊อปอัป'),
  ('popup_image_url', '', 'popup', 'URL รูปภาพแบนเนอร์/โปสเตอร์ป๊อปอัป'),
  ('popup_cta_text', 'สมัครเรียนออนไลน์', 'popup', 'ข้อความปุ่มหลักในป๊อปอัป'),
  ('popup_cta_url', '/enrollment', 'popup', 'ลิงก์ปลายทางปุ่มหลักในป๊อปอัป'),
  ('popup_secondary_text', 'อ่านข่าวประชาสัมพันธ์ทั้งหมด', 'popup', 'ข้อความปุ่มรองในป๊อปอัป'),
  ('popup_secondary_url', '/news', 'popup', 'ลิงก์ปลายทางปุ่มรองในป๊อปอัป'),
  ('popup_frequency', 'once_per_day', 'popup', 'ความถี่ในการแสดงผล (every_visit, once_per_session, once_per_day)'),
  ('popup_theme_accent', 'sky', 'popup', 'โทนสีเน้นของป๊อปอัป (sky, rose, amber, navy)'),
  ('popup_start_date', '', 'popup', 'วันเริ่มต้นแสดงป๊อปอัป (YYYY-MM-DD)'),
  ('popup_end_date', '', 'popup', 'วันสิ้นสุดการแสดงป๊อปอัป (YYYY-MM-DD)'),
  ('supabase_project_ref', 'fhfckuypfstlokashcmu', 'deployment', 'รหัสโปรเจกต์ฐานข้อมูล Supabase'),
  ('vercel_site_url', '', 'deployment', 'ลิงก์เว็บไซต์ออนไลน์บน Vercel'),
  ('vercel_deploy_hook_url', '', 'deployment', 'Vercel Deploy Hook URL สำหรับสั่ง Rebuild ออนไลน์'),
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
    'milestones',
    'facilities',
    'faq',
    'media_resources',
    'teacher_media_items',
    'newsletters',
    'homepage_sections',
    'site_popups',
    'deployment_configs',
    'sapha_projects',
    'sapha_links'
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
