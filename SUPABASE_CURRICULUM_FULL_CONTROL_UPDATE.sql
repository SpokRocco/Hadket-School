-- ==============================================================================
-- SUPABASE_CURRICULUM_FULL_CONTROL_UPDATE.sql
-- อัปเดตและซิงค์ระบบหลักสูตรเต็มรูปแบบ (Full Control + Unlimited Image Upload)
-- โรงเรียนบ้านหาดเค็ด (Project Reference: fhfckuypfstlokashcmu)
--
-- สิ่งที่ไฟล์นี้ดำเนินการอย่างปลอดภัย (Idempotent):
-- 1. สร้างตาราง public.curriculum_levels (ปฐมวัย / ประถมศึกษา / มัธยมศึกษาตอนต้น)
--    เพื่อให้หน้าหลักและหน้า /curriculum ซิงค์ข้อมูล รูปภาพ ลิงก์ และรายวิชาตรงกัน 100%
-- 2. อัปเกรดคอลัมน์รูปภาพและการจัดเฟรม (image_url, image_position, image_scale, target_level)
--    ในตาราง curriculum_programs และ curriculum_activities
-- 3. ตั้งค่า Storage Bucket 'images' ให้รองรับการอัปโหลดรูปภาพขนาดใหญ่ไม่จำกัด (Sony A7 / Lightroom / HEIC)
-- 4. ล้างเฉพาะข้อมูลม็อค ม.ปลาย เดิมจากเทมเพลตตั้งต้น (ถ้ามี) โดยไม่แตะต้องข้อมูลที่แอดมินเพิ่มเอง
-- 5. เปิดใช้งาน RLS Full Control และ Supabase Realtime ทุกตารางที่เกี่ยวข้อง
-- ==============================================================================

-- 1. สร้างตาราง public.curriculum_levels (หลักสูตรตามระดับชั้น ซิงค์กับ grade_data)
CREATE TABLE IF NOT EXISTS public.curriculum_levels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  level_pattern TEXT NOT NULL DEFAULT 'custom',
  subjects TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  image_url TEXT DEFAULT '',
  image_position TEXT DEFAULT 'center center',
  image_scale NUMERIC DEFAULT 1,
  href TEXT DEFAULT '/curriculum',
  icon VARCHAR(50) DEFAULT 'GraduationCap',
  color VARCHAR(50) DEFAULT 'bg-sky-600',
  sync_grade_stats BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- อัปเกรดคอลัมน์กรณีตาราง curriculum_levels มีอยู่แล้ว
ALTER TABLE IF EXISTS public.curriculum_levels
  ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS level_pattern TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center center',
  ADD COLUMN IF NOT EXISTS image_scale NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS href TEXT DEFAULT '/curriculum',
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'GraduationCap',
  ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT 'bg-sky-600',
  ADD COLUMN IF NOT EXISTS sync_grade_stats BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS order_position INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_curriculum_levels_order
  ON public.curriculum_levels (order_position ASC);

-- 2. อัปเกรดตาราง public.curriculum_programs
ALTER TABLE IF EXISTS public.curriculum_programs
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center center',
  ADD COLUMN IF NOT EXISTS image_scale NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS target_level TEXT DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. อัปเกรดตาราง public.curriculum_activities
ALTER TABLE IF EXISTS public.curriculum_activities
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center center',
  ADD COLUMN IF NOT EXISTS image_scale NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. กำหนดสิทธิ์ Row Level Security (RLS) แบบ Full Control
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['curriculum_levels', 'curriculum_programs', 'curriculum_activities'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public Read for %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public Read for %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access for %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public Full Access for %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public Full Access for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- 5. เตรียม Storage Bucket 'images' สำหรับอัปโหลดรูปภาพจริงคุณภาพสูง (รองรับไฟล์ขนาดใหญ่ไม่จำกัด)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 104857600, NULL)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 104857600,
    allowed_mime_types = NULL;

DROP POLICY IF EXISTS "Public Image Read Access" ON storage.objects;
CREATE POLICY "Public Image Read Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Image Upload Access" ON storage.objects;
CREATE POLICY "Public Image Upload Access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Image Update Access" ON storage.objects;
CREATE POLICY "Public Image Update Access"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Public Image Delete Access" ON storage.objects;
CREATE POLICY "Public Image Delete Access"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');

-- 6. ใส่ข้อมูล 3 ระดับชั้นหลักของโรงเรียนบ้านหาดเค็ด (ต้นแบบเดียวกับหน้าแรก · รูปภาพว่างเพื่อให้แอดมินอัปโหลดรูปจริง)
INSERT INTO public.curriculum_levels (
  id, title, subtitle, description, level_pattern, subjects, highlights,
  image_url, image_position, image_scale, href, icon, color, sync_grade_stats, order_position, is_active
)
VALUES
  (
    'kindergarten',
    'ระดับปฐมวัย (อนุบาล)',
    'เตรียมความพร้อมด้านพัฒนาการและทักษะพื้นฐาน',
    'จัดการเรียนการสอนมุ่งเน้นพัฒนาการทั้ง 4 ด้าน (ร่างกาย อารมณ์ จิตใจ สังคม และสติปัญญา) ผ่านกิจกรรมสร้างสรรค์และการเรียนรู้เชิงประสบการณ์อย่างมีความสุข เพื่อเตรียมความพร้อมสู่ระดับประถมศึกษา',
    'kindergarten',
    ARRAY['กิจกรรมเคลื่อนไหวและจังหวะ', 'ประสบการณ์สำคัญปฐมวัย (EF)', 'ศิลปะสร้างสรรค์และงานประดิษฐ์', 'คณิตศาสตร์และเกมการศึกษาปฐมวัย', 'ทักษะภาษาและการสื่อสารเบื้องต้น', 'ปลูกฝังคุณธรรม วินัย และสุขนิสัย'],
    ARRAY['เน้นพัฒนาการ 4 ด้านอย่างสมดุลตามช่วงวัย', 'เรียนรู้ผ่านการเล่น (Play-Based Learning)', 'ดูแลเอาใจใส่รายบุคคลอย่างใกล้ชิดและอบอุ่น'],
    '',
    'center center',
    1,
    '/curriculum#kindergarten',
    'Palette',
    'bg-amber-500',
    true,
    1,
    true
  ),
  (
    'primary',
    'ระดับประถมศึกษา (ป.1 – ป.6)',
    'ปูพื้นฐานวิชาการ คุณธรรม และทักษะการเรียนรู้ตลอดชีวิต',
    'จัดการเรียนรู้ครบทั้ง 8 กลุ่มสาระการเรียนรู้ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พัฒนาสมรรถนะการอ่านออก เขียนได้ คิดคำนวณเป็น ภาษาอังกฤษเพื่อการสื่อสาร และทักษะเทคโนโลยีดิจิทัลอย่างมั่นคง',
    'primary',
    ARRAY['ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์และเทคโนโลยี', 'สังคมศึกษา ศาสนา และวัฒนธรรม', 'สุขศึกษาและพลศึกษา', 'ศิลปะและดนตรี', 'การงานอาชีพ', 'ภาษาต่างประเทศ (ภาษาอังกฤษ)'],
    ARRAY['พัฒนาทักษะอ่านออก เขียนได้ และคิดวิเคราะห์เป็นระบบ', 'ฝึกปฏิบัติการวิทยาศาสตร์ คอมพิวเตอร์ และเกษตรพอเพียง', 'ปลูกฝังคุณธรรม จริยธรรม และค่านิยมอันดีงาม'],
    '',
    'center center',
    1,
    '/curriculum#primary',
    'BookOpen',
    'bg-sky-600',
    true,
    2,
    true
  ),
  (
    'lower-sec',
    'ระดับมัธยมศึกษาตอนต้น (ม.1 – ม.3)',
    'ค้นพบศักยภาพ วิทยาศาสตร์ คอมพิวเตอร์ และงานอาชีพ',
    'มุ่งต่อยอดองค์ความรู้เชิงลึกทั้ง 8 กลุ่มสาระการเรียนรู้ เสริมสมรรถนะด้านเทคโนโลยี วิทยาการคำนวณ โครงงานวิทยาศาสตร์ และทักษะงานอาชีพ เพื่อค้นพบความถนัดและเตรียมความพร้อมสู่การศึกษาต่อ 100%',
    'lower-sec',
    ARRAY['วิทยาศาสตร์และโครงงานนวัตกรรม', 'คณิตศาสตร์ประยุกต์', 'เทคโนโลยี วิทยาการคำนวณ และ AI', 'ภาษาไทยและหลักการใช้ภาษา', 'ภาษาอังกฤษเพื่อการสื่อสาร', 'สังคมศึกษา หน้าที่พลเมือง และประวัติศาสตร์', 'การงานอาชีพและทักษะวิชาชีพพื้นฐาน', 'ศิลปะ ดนตรี และสุขศึกษา-พลศึกษา'],
    ARRAY['เน้นโครงงานวิทยาศาสตร์ เทคโนโลยีดิจิทัล และ AI', 'บูรณาการงานอาชีพและเศรษฐกิจพอเพียงในชีวิตจริง', 'แนะแนวศึกษาต่อ ม.ปลาย และสายอาชีพ (อัตราศึกษาต่อ 100%)'],
    '',
    'center center',
    1,
    '/curriculum#lower-sec',
    'FlaskConical',
    'bg-indigo-600',
    true,
    3,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 7. ลบเฉพาะข้อมูลตัวอย่าง ม.ปลาย เดิมจากเทมเพลตตั้งต้น (ถ้ายังค้างอยู่ โดยไม่กระทบข้อมูลที่ผู้ใช้เพิ่มเอง)
DELETE FROM public.curriculum_programs
WHERE title IN ('วิทย์-คณิต', 'ศิลป์-ภาษา', 'ศิลป์-คำนวณ', 'คอมพิวเตอร์')
  AND (
    description LIKE '%เตรียมความพร้อมสู่คณะแพทย์%'
    OR description LIKE '%ฝรั่งเศส%'
    OR description LIKE '%คณะบริหาร%'
    OR description LIKE '%AI เตรียมความพร้อมสู่โลกดิจิทัล%'
  );

-- 8. ใส่รายวิชาเพิ่มเติมที่สอดคล้องกับโรงเรียนบ้านหาดเค็ด (เฉพาะเมื่อตาราง curriculum_programs ว่างเปล่า)
INSERT INTO public.curriculum_programs (
  title, description, icon, color, subjects, careers, target_level, order_position, is_active
)
SELECT
  'วิทยาศาสตร์ โครงงาน และเกษตรพอเพียง',
  'ส่งเสริมการทดลองทางวิทยาศาสตร์ กระบวนการคิดเชิงเหตุผล และการเรียนรู้เกษตรอินทรีย์ตามหลักปรัชญาของเศรษฐกิจพอเพียง',
  'FlaskConical',
  'bg-green-500',
  ARRAY['วิทยาศาสตร์ปฏิบัติการ', 'โครงงานวิทยาศาสตร์และสิ่งแวดล้อม', 'เกษตรอินทรีย์และเศรษฐกิจพอเพียง'],
  ARRAY['ทักษะการคิดวิเคราะห์และการทดลอง', 'พื้นฐานวิทยาศาสตร์ระดับมัธยมศึกษาตอนปลาย', 'การประยุกต์ใช้องค์ความรู้ในชุมชน'],
  'primary',
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.curriculum_programs);

INSERT INTO public.curriculum_programs (
  title, description, icon, color, subjects, careers, target_level, order_position, is_active
)
SELECT
  'เทคโนโลยี วิทยาการคำนวณ และนวัตกรรมดิจิทัล',
  'พัฒนาทักษะการใช้เทคโนโลยีสารสนเทศ โค้ดดิ้งเบื้องต้น สื่อดิจิทัล และปัญญาประดิษฐ์ (AI) อย่างสร้างสรรค์และปลอดภัย',
  'Monitor',
  'bg-blue-500',
  ARRAY['วิทยาการคำนวณ (Coding)', 'การใช้งาน AI เพื่อการเรียนรู้', 'การสร้างสื่อดิจิทัลและนำเสนอ'],
  ARRAY['ทักษะดิจิทัลในศตวรรษที่ 21', 'การต่อยอดสายเทคโนโลยีและคอมพิวเตอร์', 'นักสร้างสรรค์สื่อดิจิทัล'],
  'lower-sec',
  2,
  true
WHERE (SELECT count(*) FROM public.curriculum_programs) <= 1;

INSERT INTO public.curriculum_programs (
  title, description, icon, color, subjects, careers, target_level, order_position, is_active
)
SELECT
  'การงานอาชีพและภาษาเพื่อการสื่อสาร',
  'บูรณาการทักษะอาชีพท้องถิ่น งานช่างพื้นฐาน คหกรรม ร่วมกับภาษาไทยและภาษาอังกฤษเพื่อเตรียมความพร้อมศึกษาต่อและประกอบอาชีพ',
  'Languages',
  'bg-purple-500',
  ARRAY['ภาษาอังกฤษเพื่อการสื่อสาร', 'ทักษะอาชีพและผู้ประกอบการน้อย', 'โครงงานพัฒนาทักษะชีวิต'],
  ARRAY['ศึกษาต่อระดับ ม.ปลาย และ ปวช.', 'ทักษะสื่อสารและงานอาชีพ', 'การทำงานร่วมกับผู้อื่น'],
  'lower-sec',
  3,
  true
WHERE (SELECT count(*) FROM public.curriculum_programs) <= 2;

-- 9. เตรียมคีย์สำรอง Dual-Cloud ใน public.school_settings (ไม่เขียนทับข้อมูลที่มีอยู่)
INSERT INTO public.school_settings (key, value, category, description)
VALUES
  ('curriculum_levels_json', '[]', 'curriculum', 'ข้อมูลสำรอง Dual-Cloud สำหรับหลักสูตรตามระดับชั้น (Full Control)'),
  ('curriculum_programs_json', '[]', 'curriculum', 'ข้อมูลสำรอง Dual-Cloud สำหรับรายวิชาเพิ่มเติมและแผนการเรียน'),
  ('curriculum_activities_json', '[]', 'curriculum', 'ข้อมูลสำรอง Dual-Cloud สำหรับกิจกรรมเสริมหลักสูตร')
ON CONFLICT (key) DO NOTHING;

-- 10. เปิดใช้งาน Supabase Realtime สำหรับทุกตารางหลักสูตรและข้อมูลชั้นเรียน
DO $$
DECLARE
  tbl TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOR tbl IN SELECT unnest(ARRAY[
      'curriculum_levels',
      'curriculum_programs',
      'curriculum_activities',
      'grade_data',
      'school_settings'
    ])
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
      ) THEN
        BEGIN
          EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END IF;
    END LOOP;
  END IF;
END $$;

SELECT 'Curriculum Full Control & Sync setup completed!' AS status;
