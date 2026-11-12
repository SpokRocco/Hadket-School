export const SUPABASE_EXTENDED_MIGRATION_SQL = `-- SUPABASE DATABASE UPDATE: HOMEPAGE ORDERING, ARRIVAL POPUP & REAL-TIME SYNC
-- โรงเรียนบ้านหาดเค็ด (Project Reference: fhfckuypfstlokashcmu)
-- Safe to run: preserves ALL existing data with IF NOT EXISTS / ON CONFLICT DO NOTHING

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
CREATE POLICY "Allow full access for newsletters" ON public.newsletters FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "Homepage sections are publicly readable" ON public.homepage_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage homepage sections" ON public.homepage_sections;
CREATE POLICY "Admin can manage homepage sections" ON public.homepage_sections FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "Site popups are publicly readable" ON public.site_popups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage site popups" ON public.site_popups;
CREATE POLICY "Admin can manage site popups" ON public.site_popups FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "Deployment configs are publicly readable" ON public.deployment_configs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage deployment configs" ON public.deployment_configs;
CREATE POLICY "Admin can manage deployment configs" ON public.deployment_configs FOR ALL USING (true) WITH CHECK (true);

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

INSERT INTO public.school_settings (key, value, category, description)
VALUES
  ('navbar_menu_items', '[{"id":"home","label":"หน้าหลัก","href":"/","enabled":true,"order":1},{"id":"about","label":"เกี่ยวกับเรา","href":"/about","enabled":true,"order":2},{"id":"curriculum","label":"หลักสูตร","href":"/curriculum","enabled":true,"order":3},{"id":"news","label":"ข่าวสาร","href":"/news","enabled":true,"order":4},{"id":"newsletters","label":"จดหมายข่าวประชาสัมพันธ์","href":"/newsletters","enabled":true,"order":5},{"id":"media","label":"คลังสื่อ","href":"/media-library","enabled":true,"order":6},{"id":"contact","label":"ติดต่อเรา","href":"/contact","enabled":true,"order":7}]', 'homepage', 'รายการเมนูแถบนำทางด้านบนของหน้าหลัก'),
  ('newsletter_section_title', 'จดหมายข่าวประชาสัมพันธ์', 'homepage', 'หัวข้อส่วนจดหมายข่าวบนหน้าหลัก'),
  ('newsletter_section_subtitle', 'วารสารและจดหมายข่าวสรุปกิจกรรมสำคัญของโรงเรียน (ดึงข้อมูลจริงจากฐานข้อมูล)', 'homepage', 'คำอธิบายรองส่วนจดหมายข่าวบนหน้าหลัก'),
  ('newsletter_home_limit', '3', 'homepage', 'จำนวนจดหมายข่าวที่แสดงบนหน้าหลัก'),
  ('newsletter_home_category', 'ทั้งหมด', 'homepage', 'หมวดหมู่จดหมายข่าวที่กรองแสดงบนหน้าหลัก'),
  ('newsletter_home_sort', 'latest', 'homepage', 'วิธีเรียงลำดับจดหมายข่าวหน้าหลัก (latest, custom_order)'),
  ('hero_slides_json', '[]', 'hero', 'ข้อมูลภาพสไลด์และเนื้อหาบนแบนเนอร์หลักหัวเว็บ JSON'),
  ('hero_autoplay_enabled', 'true', 'hero', 'เปิด/ปิดการเลื่อนภาพสไลด์หัวเว็บอัตโนมัติ'),
  ('hero_autoplay_interval', '6000', 'hero', 'ระยะเวลาหน่วงในการเปลี่ยนภาพสไลด์หัวเว็บ (มิลลิวินาที)'),
  ('popup_enabled', 'true', 'popup', 'เปิด/ปิด การแสดงผลหน้าต่างป๊อปอัปหน้าแรก'),
  ('quick_chat_enabled', 'true', 'chat', 'เปิด/ปิดการแสดงผลแชทด่วนมุมขวาล่าง'),
  ('quick_chat_title', 'แชทด่วนสอบถามข้อมูล', 'chat', 'หัวข้อแชทด่วนมุมขวาล่าง'),
  ('quick_chat_greeting', 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด มีข้อสงสัยหรือต้องการสอบถามข้อมูล สามารถแชทคุยกับเราได้เลยครับ', 'chat', 'ข้อความทักทายอัตโนมัติในแชทด่วน'),
  ('quick_chat_school_line', 'https://line.me/ti/p/~hadkedschool', 'chat', 'ลิงก์กลุ่ม LINE โรงเรียน หรือ LINE Official'),
  ('quick_chat_director_line', 'https://line.me/ti/p/~director.hadked', 'chat', 'ลิงก์ LINE ผู้อำนวยการ หรือ ผู้บริหารสถานศึกษา'),
  ('quick_chat_phone', '054-710-123', 'chat', 'เบอร์โทรศัพท์ติดต่อด่วน')
ON CONFLICT (key) DO NOTHING;

-- Create Dedicated hero_slides table for Full Control Hero Slider
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

CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON public.hero_slides (order_position ASC);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read for hero_slides" ON public.hero_slides;
CREATE POLICY "Public Read for hero_slides" ON public.hero_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Full Access for hero_slides" ON public.hero_slides;
CREATE POLICY "Public Full Access for hero_slides" ON public.hero_slides FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.hero_slides (
  id, title, subtitle, kicker, subline, image_url, 
  primary_label, primary_href, secondary_label, secondary_href, 
  track1_name, track1_range, track2_name, track2_range, 
  is_active, order_position
)
VALUES
  ('slide-admissions', 'ร่วมมือ วิชาการ งานอาชีพ ด้วยปัญญา', 'มุ่งพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษา ส่งเสริมคุณธรรม น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง พร้อมก้าวทันเทคโนโลยี', 'เปิดรับสมัครนักเรียนใหม่ · ปีการศึกษา 2569', 'ร่วมมือ วิชาการ งานอาชีพ · โรงเรียนบ้านหาดเค็ด', '', 'สมัครเรียนออนไลน์', '/enrollment', 'เกี่ยวกับโรงเรียน', '/about', 'นักเรียนปัจจุบัน', '74 คน', 'ระยะเวลาหลักสูตร', '9 ปี', true, 1),
  ('slide-academic', 'มุ่งเน้นความเป็นเลิศทางวิชาการและเทคโนโลยี', 'ส่งเสริมการเรียนรู้วิทยาศาสตร์ คณิตศาสตร์ ภาษาต่างประเทศ และนวัตกรรมดิจิทัลเพื่ออนาคต', 'พัฒนาศักยภาพผู้เรียนรอบด้าน', 'ห้องปฏิบัติการวิทยาศาสตร์ และคอมพิวเตอร์ทันสมัย', '', 'ดูหลักสูตรการศึกษา', '/curriculum', 'ผลงานนักเรียน', '/news', 'ปีแห่งความเป็นเลิศ', 'พัฒนาต่อเนื่อง', 'อัตราศึกษาต่อ', '100 %', true, 2),
  ('slide-activities', 'กิจกรรมส่งเสริมทักษะชีวิตและคุณธรรม', 'ปลูกฝังวินัย คุณธรรม จริยธรรม และการทำงานร่วมกันผ่านกิจกรรมลูกเสือ กีฬา และศิลปวัฒนธรรม', 'กิจกรรมพัฒนาผู้เรียนรอบด้าน', 'ดนตรี กีฬา ศิลปะ จิตอาสา', '', 'คลังภาพกิจกรรม', '/gallery', 'ติดต่อโรงเรียน', '/contact', 'ศิษย์เก่าโรงเรียน', 'เครือข่ายเข้มแข็ง', 'กิจกรรมสภานักเรียน', 'พัฒนาผู้เรียนรอบด้าน', true, 3)
ON CONFLICT (id) DO NOTHING;

-- Gallery Google Drive and Photos columns
ALTER TABLE IF EXISTS public.gallery_albums 
  ADD COLUMN IF NOT EXISTS google_drive_url TEXT,
  ADD COLUMN IF NOT EXISTS google_photos_url TEXT;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'school_settings', 'news', 'news_categories', 'events',
    'gallery_albums', 'gallery_photos', 'administrators', 'staff',
    'student_stats', 'grade_data', 'student_council',
    'student_achievements', 'student_activities', 'admissions',
    'curriculum_programs', 'curriculum_activities', 'milestones',
    'facilities', 'faq', 'media_resources', 'teacher_media_items',
    'newsletters', 'homepage_sections', 'site_popups', 'deployment_configs',
    'sapha_projects', 'sapha_links', 'hero_slides', 'contact_messages'
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
`;
