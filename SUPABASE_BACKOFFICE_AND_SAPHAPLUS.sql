-- =====================================================================
-- 🏛️ ระบบจัดการหลังบ้านของสถานศึกษา (School Back-Office Management System)
-- รองรับ 5 บทบาท (RBAC): executive, admin, teacher, staff, sapha_plus
-- รวมถึงระบบสร้างลิงก์เข้าสู่ระบบ (Custom Login Portals), คลังสื่อรายบุคคลของครู,
-- และระบบสภานักเรียน "สภาพลัส (Sapha Plus)"
-- (เวอร์ชันแก้ไขสมบูรณ์: รองรับทั้งฐานข้อมูลเดิมจาก SUPABASE_SETUP.sql และฐานข้อมูลใหม่)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ฟังก์ชันอัปเดตเวลา updated_at อัตโนมัติ (เผื่อกรณียังไม่ได้รัน SUPABASE_SETUP.sql)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- 1. ตารางผู้ใช้งานหลังบ้านและระดับสิทธิ์ 5 บทบาท (public.admin_users)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions TEXT[] NOT NULL DEFAULT ARRAY['dashboard']::TEXT[],
  subject_department TEXT,
  custom_link_slug TEXT,
  google_site_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ปรับปรุงโครงสร้างตาราง admin_users เดิมให้ตรงกัน 100% โดยไม่ทำลายข้อมูลเดิม
DO $$
DECLARE
  r RECORD;
  has_password BOOLEAN;
  has_password_hash BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'password'
  ) INTO has_password;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'password_hash'
  ) INTO has_password_hash;

  -- กรณีเคยมีคอลัมน์ password_hash ให้เปลี่ยนเป็น password ให้ตรงกับระบบเดิม
  IF NOT has_password AND has_password_hash THEN
    ALTER TABLE public.admin_users RENAME COLUMN password_hash TO password;
  ELSIF NOT has_password THEN
    ALTER TABLE public.admin_users ADD COLUMN password TEXT NOT NULL DEFAULT '123456';
  ELSIF has_password AND has_password_hash THEN
    ALTER TABLE public.admin_users DROP COLUMN password_hash;
  END IF;

  -- ลบ CHECK constraint เดิมของตาราง admin_users (ที่จำกัดแค่ super_admin, admin, staff)
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'admin_users'
      AND c.contype = 'c'
  ) LOOP
    EXECUTE format('ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- เพิ่มคอลัมน์ที่จำเป็นสำหรับ 5 บทบาทหากยังไม่มี
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS subject_department TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS custom_link_slug TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS google_site_url TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT ARRAY['dashboard']::TEXT[];
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.admin_users ALTER COLUMN username TYPE TEXT;
ALTER TABLE public.admin_users ALTER COLUMN display_name TYPE TEXT;
ALTER TABLE public.admin_users ALTER COLUMN role TYPE TEXT;

-- ปรับค่า role ที่ไม่อยู่ในรายการให้ปลอดภัยก่อนสร้าง Constraint ใหม่
UPDATE public.admin_users
SET role = 'staff'
WHERE role IS NULL
   OR role NOT IN ('executive', 'admin', 'teacher', 'staff', 'sapha_plus', 'super_admin');

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('executive', 'admin', 'teacher', 'staff', 'sapha_plus', 'super_admin'));

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_unique_idx
  ON public.admin_users (username);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow public select on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow public insert on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow public update on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow public delete on admin_users" ON public.admin_users;

CREATE POLICY "Allow full access for admin_users"
  ON public.admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ข้อมูลบัญชีผู้ใช้งานเริ่มต้นครบทั้ง 5 บทบาท (Seed Data)
INSERT INTO public.admin_users (
  username,
  password,
  display_name,
  email,
  role,
  permissions,
  is_active,
  subject_department,
  custom_link_slug,
  google_site_url
)
VALUES
  (
    'executive',
    'exec@2026',
    'ดร.เกรียงไกร วิสัยทัศน์ไกล (ผู้อำนวยการโรงเรียน)',
    'director@school.ac.th',
    'executive',
    ARRAY['dashboard', 'executive_view'],
    true,
    'คณะผู้บริหารสถานศึกษา',
    NULL,
    NULL
  ),
  (
    'admin',
    'admin123',
    'ผู้ดูแลระบบหลัก (System Administrator)',
    'admin@school.ac.th',
    'admin',
    ARRAY['dashboard','executive_view','sapha_plus','teacher_workspace','media','news','newsletters','gallery','events','students','admissions','staff','administrators','curriculum','activities','milestones','facilities','messages','faq','login_portals','users','settings'],
    true,
    'ฝ่ายเทคโนโลยีสารสนเทศ',
    NULL,
    NULL
  ),
  (
    'teacher',
    'teacher123',
    'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)',
    'somchai.t@school.ac.th',
    'teacher',
    ARRAY['dashboard', 'teacher_workspace', 'media'],
    true,
    'ภาษาไทย',
    'kru-somchai-thai',
    'https://sites.google.com/'
  ),
  (
    'teacher_math',
    'teacher123',
    'ครูสุภา รักเรียน (กลุ่มสาระฯ คณิตศาสตร์)',
    'supha.m@school.ac.th',
    'teacher',
    ARRAY['dashboard', 'teacher_workspace', 'media'],
    true,
    'คณิตศาสตร์',
    'kru-supha-math',
    'https://sites.google.com/'
  ),
  (
    'staff',
    'staff123',
    'เจ้าหน้าที่ประชาสัมพันธ์ (PR & News Staff)',
    'pr.staff@school.ac.th',
    'staff',
    ARRAY['dashboard', 'news', 'newsletters', 'gallery', 'events', 'admissions', 'messages', 'login_portals'],
    true,
    'งานประชาสัมพันธ์และสารสนเทศ',
    NULL,
    NULL
  ),
  (
    'saphaplus',
    'sapha123',
    'คณะกรรมการสภานักเรียน (Sapha Plus Council)',
    'saphaplus@school.ac.th',
    'sapha_plus',
    ARRAY['dashboard', 'sapha_plus', 'students', 'events'],
    true,
    'สภานักเรียน (ระบบสภาพลัส)',
    NULL,
    NULL
  )
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  subject_department = EXCLUDED.subject_department,
  custom_link_slug = EXCLUDED.custom_link_slug,
  google_site_url = EXCLUDED.google_site_url;

-- =====================================================================
-- 2. ตารางจัดการลิงก์ทางเข้าสู่ระบบเฉพาะกิจ (public.login_portals)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.login_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  portal_key TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  target_role TEXT NOT NULL DEFAULT 'all',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DO $$
DECLARE
  r RECORD;
  has_portal_key BOOLEAN;
  has_slug BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'login_portals' AND column_name = 'portal_key'
  ) INTO has_portal_key;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'login_portals' AND column_name = 'slug'
  ) INTO has_slug;

  IF NOT has_portal_key AND has_slug THEN
    ALTER TABLE public.login_portals RENAME COLUMN slug TO portal_key;
  ELSIF NOT has_portal_key THEN
    ALTER TABLE public.login_portals ADD COLUMN portal_key TEXT NOT NULL DEFAULT 'custom';
  END IF;

  -- ลบ CHECK constraint เดิมของ login_portals เพื่อสร้างใหม่ให้รองรับ 'all'
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'login_portals'
      AND c.contype = 'c'
  ) LOOP
    EXECUTE format('ALTER TABLE public.login_portals DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.login_portals DROP CONSTRAINT IF EXISTS login_portals_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS login_portals_token_unique_idx ON public.login_portals (token);

UPDATE public.login_portals
SET target_role = 'all'
WHERE target_role IS NULL
   OR target_role NOT IN ('all', 'any', 'executive', 'admin', 'teacher', 'staff', 'sapha_plus', 'super_admin');

ALTER TABLE public.login_portals
  ADD CONSTRAINT login_portals_target_role_check
  CHECK (target_role IN ('all', 'any', 'executive', 'admin', 'teacher', 'staff', 'sapha_plus', 'super_admin'));

ALTER TABLE public.login_portals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for login_portals" ON public.login_portals;
DROP POLICY IF EXISTS "Allow public select on login_portals" ON public.login_portals;
DROP POLICY IF EXISTS "Allow public insert on login_portals" ON public.login_portals;
DROP POLICY IF EXISTS "Allow public update on login_portals" ON public.login_portals;
DROP POLICY IF EXISTS "Allow public delete on login_portals" ON public.login_portals;

CREATE POLICY "Allow full access for login_portals"
  ON public.login_portals
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.login_portals (title, portal_key, token, target_role, description, is_active, created_by)
VALUES
  ('ทางเข้าสำหรับผู้บริหาร (Executive Portal)', 'exec', 'EXEC-2026', 'executive', 'ลิงก์เข้าสู่ระบบรายงานสถิติและภาพรวมสำหรับผู้บริหารสถานศึกษา', true, 'admin'),
  ('ทางเข้าสำหรับครูผู้สอน (Teacher Portal)', 'teacher', 'TCH-2026', 'teacher', 'ลิงก์เข้าสู่ระบบจัดการพื้นที่สื่อการสอนประจำตัวครูแต่ละท่าน', true, 'admin'),
  ('ทางเข้าสำหรับเจ้าหน้าที่ (Staff CMS Portal)', 'staff', 'PR-2026', 'staff', 'ลิงก์เข้าสู่ระบบจัดการข่าวประชาสัมพันธ์ จดหมายข่าว และกิจกรรม', true, 'admin'),
  ('ทางเข้าสู่ระบบสภาพลัส (Sapha Plus Portal)', 'saphaplus', 'SAPHA-2026', 'sapha_plus', 'ลิงก์ตรงสำหรับคณะกรรมการสภานักเรียนและครูที่ปรึกษาสภาฯ', true, 'admin')
ON CONFLICT (token) DO UPDATE SET
  title = EXCLUDED.title,
  portal_key = EXCLUDED.portal_key,
  target_role = EXCLUDED.target_role,
  description = EXCLUDED.description;

-- =====================================================================
-- 3. ตารางสื่อการสอนประจำตัวของครูแต่ละท่าน (public.teacher_media_items)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.teacher_media_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_username TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  subject_department TEXT NOT NULL,
  grade_level TEXT NOT NULL DEFAULT 'ทุกระดับชั้น',
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL DEFAULT 'video' CHECK (media_type IN ('video', 'pdf', 'canva', 'google_site', 'interactive')),
  media_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_media_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for teacher_media_items" ON public.teacher_media_items;
DROP POLICY IF EXISTS "Allow public select on teacher_media_items" ON public.teacher_media_items;
DROP POLICY IF EXISTS "Allow public insert on teacher_media_items" ON public.teacher_media_items;
DROP POLICY IF EXISTS "Allow public update on teacher_media_items" ON public.teacher_media_items;
DROP POLICY IF EXISTS "Allow public delete on teacher_media_items" ON public.teacher_media_items;

CREATE POLICY "Allow full access for teacher_media_items"
  ON public.teacher_media_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.teacher_media_items (teacher_username, teacher_name, subject_department, grade_level, title, description, media_type, media_url)
SELECT * FROM (VALUES
  ('teacher', 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)', 'ภาษาไทย', 'ม.1 - ม.3', 'วิดีโอสรุปหลักภาษาไทย: คำเป็น-คำตาย และไตรยางศ์', 'คลิปวิดีโอประกอบการสอนและตัวอย่างการจำแนกคำ พร้อมแบบฝึกหัดท้ายบท', 'video', 'https://www.youtube.com/'),
  ('teacher', 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)', 'ภาษาไทย', 'ม.4 - ม.6', 'สไลด์ Canva: วรรณคดีวิจักษ์และศิลปะการประพันธ์', 'สื่อนำเสนออินโฟกราฟิกจาก Canva สำหรับทบทวนก่อนสอบกลางภาค', 'canva', 'https://www.canva.com/'),
  ('teacher_math', 'ครูสุภา รักเรียน (กลุ่มสาระฯ คณิตศาสตร์)', 'คณิตศาสตร์', 'ม.1 - ม.6', 'เอกสาร PDF สรุปสูตรคณิตศาสตร์และตะลุยโจทย์ A-Level', 'รวมสูตรสำคัญและแนวข้อสอบพร้อมเฉลยละเอียด ดาวน์โหลดไปอ่านทบทวนได้ฟรี', 'pdf', 'https://drive.google.com/')
) AS seed(teacher_username, teacher_name, subject_department, grade_level, title, description, media_type, media_url)
WHERE NOT EXISTS (SELECT 1 FROM public.teacher_media_items LIMIT 1);

-- =====================================================================
-- 4. ตารางโครงการและกิจกรรมระบบสภาพลัส (public.sapha_projects)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.sapha_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  division TEXT NOT NULL DEFAULT 'ฝ่ายกิจกรรมสภานักเรียน',
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress INTEGER NOT NULL DEFAULT 50,
  target_date TEXT,
  external_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'sapha_projects'
      AND c.contype = 'c'
  ) LOOP
    EXECUTE format('ALTER TABLE public.sapha_projects DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.sapha_projects ADD COLUMN IF NOT EXISTS division TEXT NOT NULL DEFAULT 'ฝ่ายกิจกรรมสภานักเรียน';
ALTER TABLE public.sapha_projects ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE public.sapha_projects ADD COLUMN IF NOT EXISTS target_date TEXT;

UPDATE public.sapha_projects
SET status = 'planning'
WHERE status = 'planned';

ALTER TABLE public.sapha_projects
  ADD CONSTRAINT sapha_projects_status_check
  CHECK (status IN ('planning', 'planned', 'in_progress', 'completed'));

ALTER TABLE public.sapha_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for sapha_projects" ON public.sapha_projects;
DROP POLICY IF EXISTS "Allow public select on sapha_projects" ON public.sapha_projects;
DROP POLICY IF EXISTS "Allow public insert on sapha_projects" ON public.sapha_projects;
DROP POLICY IF EXISTS "Allow public update on sapha_projects" ON public.sapha_projects;
DROP POLICY IF EXISTS "Allow public delete on sapha_projects" ON public.sapha_projects;

CREATE POLICY "Allow full access for sapha_projects"
  ON public.sapha_projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.sapha_projects (title, description, division, status, progress, target_date, external_url)
SELECT * FROM (VALUES
  ('โครงการ Sapha Voice รับฟังความคิดเห็นและข้อเสนอแนะนักเรียน', 'เปิดช่องทางออนไลน์ให้นักเรียนทุกระดับชั้นร่วมเสนอแนะแนวทางพัฒนาโรงเรียนและสวัสดิการนักเรียน', 'ฝ่ายประชาสัมพันธ์และสารสนเทศ', 'in_progress', 80, '2026-12-15', 'https://forms.google.com/'),
  ('โครงการโรงเรียนสีเขียว Zero Waste & ธนาคารขยะรีไซเคิล', 'รณรงค์คัดแยกขยะในโรงเรียนและเปลี่ยนขยะรีไซเคิลเป็นแต้มสะสมแลกอุปกรณ์การเรียน', 'ฝ่ายอนุรักษ์สิ่งแวดล้อม', 'in_progress', 65, '2026-11-30', 'https://sites.google.com/'),
  ('โครงการพี่สอนน้อง (Peer Tutoring) เตรียมความพร้อมก่อนสอบ', 'จัดกลุ่มติววิชาหลักโดยรุ่นพี่สภานักเรียนและชมรมวิชาการให้กับน้องๆ ม.ต้น', 'ฝ่ายวิชาการสภานักเรียน', 'completed', 100, '2026-10-20', 'https://sites.google.com/')
) AS seed(title, description, division, status, progress, target_date, external_url)
WHERE NOT EXISTS (SELECT 1 FROM public.sapha_projects LIMIT 1);

-- =====================================================================
-- 5. ตารางลิงก์เชื่อมต่อโมดูลย่อยของระบบสภาพลัส (public.sapha_links)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.sapha_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  url TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Rocket',
  color_theme TEXT NOT NULL DEFAULT 'violet',
  badge_text TEXT DEFAULT 'ระบบออนไลน์',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sapha_links ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.sapha_links ADD COLUMN IF NOT EXISTS icon_name TEXT NOT NULL DEFAULT 'Rocket';
ALTER TABLE public.sapha_links ADD COLUMN IF NOT EXISTS color_theme TEXT NOT NULL DEFAULT 'violet';
ALTER TABLE public.sapha_links ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'ระบบออนไลน์';
ALTER TABLE public.sapha_links ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.sapha_links ADD COLUMN IF NOT EXISTS order_position INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.sapha_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for sapha_links" ON public.sapha_links;
DROP POLICY IF EXISTS "Allow public select on sapha_links" ON public.sapha_links;
DROP POLICY IF EXISTS "Allow public insert on sapha_links" ON public.sapha_links;
DROP POLICY IF EXISTS "Allow public update on sapha_links" ON public.sapha_links;
DROP POLICY IF EXISTS "Allow public delete on sapha_links" ON public.sapha_links;

CREATE POLICY "Allow full access for sapha_links"
  ON public.sapha_links
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.sapha_links (title, subtitle, description, url, icon_name, color_theme, badge_text, is_active, order_position)
SELECT * FROM (VALUES
  ('Sapha Voice (ระบบแจ้งเรื่องและรับฟังเสียงนักเรียน)', 'Student Feedback & Suggestion System', 'ส่งข้อเสนอแนะ แจ้งปัญหาภายในโรงเรียน หรือเสนอโครงการใหม่ถึงคณะกรรมการสภานักเรียนโดยตรง', 'https://docs.google.com/forms/', 'MessageSquareHeart', 'violet', 'เปิดรับความคิดเห็น 24 ชม.', true, 1),
  ('Sapha Vote (ระบบโหวตและสำรวจประชามตินักเรียน)', 'E-Voting & Student Poll Platform', 'ร่วมลงคะแนนโหวตกิจกรรมโรงเรียน เลือกตั้งสภานักเรียน และทำแบบสำรวจออนไลน์แบบโปร่งใส', 'https://docs.google.com/forms/', 'Vote', 'indigo', 'E-Voting System', true, 2),
  ('Sapha Check-In (ระบบลงทะเบียนและเช็คชื่อกิจกรรม)', 'Smart Activity Check-In & QR Pass', 'ระบบลงทะเบียนเข้าร่วมกิจกรรมสภานักเรียน ตรวจสอบชั่วโมงจิตอาสา และดาวน์โหลดเกียรติบัตรออนไลน์', 'https://sites.google.com/', 'QrCode', 'emerald', 'เช็คชื่อ & เกียรติบัตร', true, 3),
  ('Sapha Docs & Budget (คลังเอกสารและรายงานงบประมาณสภา)', 'Open Council Documents & Transparency', 'ศูนย์รวมเอกสารโครงการ สรุปรายงานการประชุมสภานักเรียน และรายงานการใช้จ่ายงบประมาณอย่างโปร่งใส', 'https://drive.google.com/', 'FileSpreadsheet', 'amber', 'โปร่งใส ตรวจสอบได้', true, 4)
) AS seed(title, subtitle, description, url, icon_name, color_theme, badge_text, is_active, order_position)
WHERE NOT EXISTS (SELECT 1 FROM public.sapha_links LIMIT 1);

-- =====================================================================
-- 6. ตารางทำเนียบคณะกรรมการสภานักเรียน (public.student_council - เผื่อกรณียังไม่มี)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_council (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  class TEXT,
  initial TEXT,
  image_url TEXT,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.student_council ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access for student_council" ON public.student_council;
CREATE POLICY "Allow public full access for student_council"
  ON public.student_council
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.student_council (name, position, class, initial, order_position)
SELECT * FROM (VALUES
  ('นายประสิทธิ์ เก่งมาก', 'ประธานสภานักเรียน', 'ม.6/1', 'ป', 1),
  ('นางสาวสุดา รักเรียน', 'รองประธานสภานักเรียน', 'ม.6/2', 'ส', 2),
  ('นายวิชัย ใจดี', 'เลขานุการสภานักเรียน', 'ม.5/1', 'ว', 3)
) AS seed(name, position, class, initial, order_position)
WHERE NOT EXISTS (SELECT 1 FROM public.student_council LIMIT 1);

-- =====================================================================
-- 7. ตารางผู้บริหารและบุคลากร (public.administrators & public.staff)
-- รองรับการแสดงผล 3 แถว: ผู้อำนวยการ, ครูและบุคลากรทางการศึกษา, บุคลากรสายสนับสนุน
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.administrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  education TEXT,
  quote TEXT,
  photo_url TEXT,
  order_position INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  subject TEXT,
  education TEXT,
  experience TEXT,
  photo_url TEXT,
  staff_type TEXT NOT NULL DEFAULT 'teaching',
  order_position INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
DECLARE
  r RECORD;
BEGIN
  -- อัปเดต CHECK constraint ของตาราง staff ให้รองรับทั้ง director, teaching, support
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'staff'
      AND c.contype = 'c'
  ) LOOP
    EXECUTE format('ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.staff
  ADD CONSTRAINT staff_staff_type_check
  CHECK (staff_type IN ('director', 'teaching', 'support'));

ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access for administrators" ON public.administrators;
CREATE POLICY "Allow public full access for administrators"
  ON public.administrators
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access for staff" ON public.staff;
CREATE POLICY "Allow public full access for staff"
  ON public.staff
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ให้สิทธิ์การเข้าถึง API ของ Supabase ครบทุกตาราง
GRANT ALL ON TABLE public.admin_users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.login_portals TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.teacher_media_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sapha_projects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sapha_links TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.student_council TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.administrators TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.staff TO anon, authenticated, service_role;
