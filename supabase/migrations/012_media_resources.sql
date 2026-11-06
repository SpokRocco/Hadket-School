-- =============================================
-- 012_media_resources.sql
-- Teacher Media Repository (Google Sites Link Panel)
-- =============================================

DROP TABLE IF EXISTS public.media_resources CASCADE;

CREATE TABLE public.media_resources (
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

COMMENT ON TABLE public.media_resources IS 'ตารางเก็บลิงก์คลังสื่อการสอน (Google Sites) ของครูแต่ละคน';

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

INSERT INTO public.media_resources (teacher_name, subject_department, title, description, google_site_url, grade_level, badge_color, views, order_position) VALUES
  (
    'นายสมชาย ใจดี',
    'ภาษาไทย',
    'คลังสื่อการสอนภาษาไทยและวรรณคดีไทย',
    'รวมบทเรียนออนไลน์ ใบงาน วิดีโอสอนหลักภาษาไทย และการอ่านคิดวิเคราะห์',
    'https://sites.google.com/',
    'ม.1 - ม.6',
    'blue',
    128,
    1
  ),
  (
    'นางสาวสุภา รักเรียน',
    'คณิตศาสตร์',
    'ห้องเรียนคณิตศาสตร์ออนไลน์ (Math Google Site)',
    'สรุปสูตรคณิตศาสตร์ แบบฝึกหัดพร้อมเฉลยละเอียด และข้อสอบติว O-NET / A-Level',
    'https://sites.google.com/',
    'ม.1 - ม.6',
    'emerald',
    245,
    2
  ),
  (
    'นายวิทยา ฉลาดคิด',
    'วิทยาศาสตร์และเทคโนโลยี',
    'คลังสื่อวิทยาศาสตร์และเทคโนโลยีดิจิทัล (Sci-Tech Portal)',
    'สื่อการทดลองเสมือนจริง โครงงานวิทยาศาสตร์ และการเขียนโปรแกรมเบื้องต้น',
    'https://sites.google.com/',
    'ทุกระดับชั้น',
    'purple',
    310,
    3
  ),
  (
    'นางภาวินี สุขสม',
    'ภาษาต่างประเทศ',
    'English & Foreign Languages Learning Center',
    'คลังคำศัพท์ บทสนทนาภาษาอังกฤษ สื่อฝึกฟัง-พูด และแบบทดสอบออนไลน์',
    'https://sites.google.com/',
    'ม.1 - ม.6',
    'rose',
    189,
    4
  );

