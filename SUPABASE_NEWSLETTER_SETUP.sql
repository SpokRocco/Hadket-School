-- =============================================================================
-- ไฟล์ฐานข้อมูลสำหรับระบบ "จดหมายข่าวประชาสัมพันธ์ของโรงเรียน" (School Newsletter)
-- และตารางที่เพิ่มเติมใหม่ (คลังสื่อการสอนของครู & ระบบสิทธิ์ Admin/Staff)
-- =============================================================================
-- วิธีใช้งาน: คัดลอกโค้ดทั้งหมดในไฟล์นี้ ไปวางใน SQL Editor ของ Supabase แล้วกด Run
-- =============================================================================

-- 0. ตรวจสอบว่ามีฟังก์ชันอัปเดตเวลาอัตโนมัติหรือยัง (ถ้ายังไม่มีให้สร้าง)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. ตาราง NEWSLETTERS - เก็บข้อมูลจดหมายข่าวประชาสัมพันธ์ของโรงเรียน
-- =============================================================================
DROP TABLE IF EXISTS public.newsletters CASCADE;

CREATE TABLE public.newsletters (
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

-- คำอธิบายคอลัมน์
COMMENT ON TABLE public.newsletters IS 'ตารางเก็บข้อมูลจดหมายข่าวประชาสัมพันธ์ของโรงเรียน (School Newsletter)';
COMMENT ON COLUMN public.newsletters.issue_no IS 'เลขที่ฉบับ เช่น 01, 02';
COMMENT ON COLUMN public.newsletters.academic_year IS 'ปีการศึกษา พ.ศ. เช่น 2568';
COMMENT ON COLUMN public.newsletters.issue_date IS 'วันที่ออกจดหมายข่าว';
COMMENT ON COLUMN public.newsletters.title IS 'หัวข้อจดหมายข่าวประชาสัมพันธ์';
COMMENT ON COLUMN public.newsletters.summary IS 'เนื้อหาสรุปย่อสำหรับแสดงในการ์ด';
COMMENT ON COLUMN public.newsletters.content IS 'เนื้อหารายละเอียดฉบับเต็ม';
COMMENT ON COLUMN public.newsletters.category IS 'หมวดหมู่ เช่น กิจกรรมสถานศึกษา, งานวิชาการ, ผลงานและความภูมิใจ';
COMMENT ON COLUMN public.newsletters.image_url IS 'ลิงก์รูปภาพแผ่นจดหมายข่าว (A4) หรือภาพกิจกรรม';
COMMENT ON COLUMN public.newsletters.file_url IS 'ลิงก์ไฟล์เอกสารแนบ PDF / Canva / Google Drive';
COMMENT ON COLUMN public.newsletters.views IS 'จำนวนครั้งที่เปิดอ่าน';
COMMENT ON COLUMN public.newsletters.is_published IS 'สถานะการเผยแพร่บนหน้าเว็บไซต์';

-- เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for newsletters" ON public.newsletters;
CREATE POLICY "Allow full access for newsletters"
  ON public.newsletters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- สร้าง Trigger อัปเดตเวลาแก้ไขล่าสุดอัตโนมัติ
DROP TRIGGER IF EXISTS update_newsletters_updated_at ON public.newsletters;
CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- สร้าง Indexes เพื่อความรวดเร็วในการค้นหาและเรียงลำดับ
CREATE INDEX IF NOT EXISTS idx_newsletters_published ON public.newsletters(is_published);
CREATE INDEX IF NOT EXISTS idx_newsletters_issue_date ON public.newsletters(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_category ON public.newsletters(category);

-- ข้อมูลตัวอย่างเริ่มต้นของจดหมายข่าวโรงเรียน
INSERT INTO public.newsletters (issue_no, academic_year, issue_date, title, summary, content, category, views, order_position) VALUES
  (
    '01',
    '2568',
    CURRENT_DATE,
    'กิจกรรมปฐมนิเทศนักเรียนใหม่ และประชุมผู้ปกครองประจำภาคเรียนที่ 1',
    'ผู้อำนวยการโรงเรียนเป็นประธานในพิธีปฐมนิเทศนักเรียนใหม่ พร้อมชี้แจงนโยบายการจัดการศึกษาและแนวทางการพัฒนาผู้เรียนร่วมกับผู้ปกครอง',
    'ทางโรงเรียนได้จัดกิจกรรมปฐมนิเทศนักเรียนใหม่และประชุมผู้ปกครองประจำภาคเรียนที่ 1 เพื่อสร้างความเข้าใจอันดีระหว่างบ้านและโรงเรียน พร้อมแนะนำคณะครูประจำชั้นและแนวทางการส่งเสริมการเรียนรู้ในยุคดิจิทัล',
    'กิจกรรมสถานศึกษา',
    156,
    1
  ),
  (
    '02',
    '2568',
    CURRENT_DATE,
    'การอบรมเชิงปฏิบัติการพัฒนาสื่อการสอนออนไลน์ด้วยเทคโนโลยีดิจิทัลและ AI',
    'คณะครูเข้าร่วมการอบรมพัฒนาคลังสื่อการสอนออนไลน์ (Google Sites) เพื่อยกระดับการจัดการเรียนรู้ในศตวรรษที่ 21',
    'คณะครูทุกกลุ่มสาระการเรียนรู้เข้าร่วมกิจกรรมพัฒนาวิชาชีพ (PLC) ในการสร้างและพัฒนาคลังสื่อการสอนออนไลน์ เพื่อให้นักเรียนสามารถทบทวนบทเรียนได้ทุกที่ทุกเวลา',
    'งานวิชาการ',
    142,
    2
  ),
  (
    '03',
    '2568',
    CURRENT_DATE,
    'ขอแสดงความยินดีกับนักเรียนที่ได้รับรางวัลชนะเลิศการแข่งขันทักษะวิชาการ',
    'ตัวแทนนักเรียนคว้ารางวัลเหรียญทองจากการแข่งขันทักษะวิชาการระดับเขตพื้นที่การศึกษา สร้างชื่อเสียงและความภาคภูมิใจให้แก่โรงเรียน',
    'โรงเรียนขอแสดงความยินดีกับนักเรียนและครูผู้ฝึกซ้อมที่ได้รับรางวัลเหรียญทองชนะเลิศจากการแข่งขันทักษะวิชาการ เป็นแบบอย่างที่ดีด้านความมุ่งมั่นตั้งใจศึกษาเล่าเรียน',
    'ผลงานและความภูมิใจ',
    218,
    3
  );

-- =============================================================================
-- 2. ตาราง MEDIA_RESOURCES - เก็บลิงก์คลังสื่อการสอนของครู (Google Sites)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.media_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_name VARCHAR(200) NOT NULL,
  teacher_photo_url TEXT,
  subject_department VARCHAR(150) NOT NULL DEFAULT 'ภาษาไทย',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  google_site_url TEXT NOT NULL,
  grade_level VARCHAR(100) DEFAULT 'ทุกระดับชั้น',
  badge_color VARCHAR(50) DEFAULT 'blue',
  views INTEGER NOT NULL DEFAULT 0,
  order_position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for media_resources" ON public.media_resources;
CREATE POLICY "Allow full access for media_resources"
  ON public.media_resources
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_media_resources_updated_at ON public.media_resources;
CREATE TRIGGER update_media_resources_updated_at
  BEFORE UPDATE ON public.media_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 3. ตาราง ADMIN_USERS - เก็บบัญชีผู้ใช้และระดับสิทธิ์ Admin & Staff
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  role VARCHAR(30) NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff')),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['dashboard', 'media', 'news', 'newsletters', 'gallery', 'events', 'students', 'admissions'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for admin_users" ON public.admin_users;
CREATE POLICY "Allow full access for admin_users"
  ON public.admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.admin_users (username, password, display_name, email, role, permissions, is_active) VALUES
  (
    'admin',
    'admin123',
    'ผู้ดูแลระบบสูงสุด (Super Admin)',
    'admin@school.ac.th',
    'super_admin',
    ARRAY['dashboard', 'media', 'news', 'newsletters', 'gallery', 'events', 'students', 'admissions', 'staff', 'administrators', 'curriculum', 'activities', 'milestones', 'facilities', 'messages', 'faq', 'settings', 'users'],
    true
  ),
  (
    'staff',
    'staff123',
    'เจ้าหน้าที่และคณะครู (Staff)',
    'staff@school.ac.th',
    'staff',
    ARRAY['dashboard', 'media', 'news', 'newsletters', 'gallery', 'events', 'students', 'admissions'],
    true
  )
ON CONFLICT (username) DO UPDATE SET
  permissions = EXCLUDED.permissions;

-- =============================================================================
-- 4. ตั้งค่า Storage Bucket 'images' สำหรับอัปโหลดรูปภาพจดหมายข่าวและรูปครู
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access to images bucket" ON storage.objects;
CREATE POLICY "Public Access to images bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

