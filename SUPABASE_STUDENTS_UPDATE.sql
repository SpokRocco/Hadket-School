-- ==============================================================================
-- SUPABASE_STUDENTS_UPDATE.sql
-- อัปเดตและปรับปรุงระบบจัดการข้อมูลนักเรียน โรงเรียนบ้านหาดเค็ด (Hadket School)
-- ระบบดึงข้อมูลจาก Supabase โดยตรง (Direct Database Query)
-- พร้อมลบข้อมูลม็อคเดิมในระบบ (1,250 คน, ม.4-ม.6) และเปิดใช้งาน Realtime Sync 100%
-- ==============================================================================

-- 1. ตารางสถิติภาพรวมนักเรียน (student_stats)
CREATE TABLE IF NOT EXISTS public.student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT DEFAULT 'Users',
    color TEXT DEFAULT 'text-primary',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางข้อมูลจำนวนนักเรียนแต่ละชั้น (grade_data)
CREATE TABLE IF NOT EXISTS public.grade_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    rooms INTEGER DEFAULT 1,
    students INTEGER DEFAULT 0,
    boys INTEGER DEFAULT 0,
    girls INTEGER DEFAULT 0,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางผลงานนักเรียนดีเด่น (student_achievements)
CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    year TEXT,
    category TEXT DEFAULT 'รางวัล',
    icon TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางชมรมและกิจกรรมนักเรียน (student_activities)
CREATE TABLE IF NOT EXISTS public.student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    members INTEGER DEFAULT 0,
    description TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางคณะกรรมการสภานักเรียน (student_council)
CREATE TABLE IF NOT EXISTS public.student_council (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    class TEXT,
    initial TEXT,
    image_url TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. เพิ่มคอลัมน์สำรองข้อมูลนักเรียนแบบ Dual-Cloud ใน school_settings
ALTER TABLE IF EXISTS public.school_settings
    ADD COLUMN IF NOT EXISTS grade_data_json TEXT,
    ADD COLUMN IF NOT EXISTS student_stats_json TEXT,
    ADD COLUMN IF NOT EXISTS student_achievements_json TEXT,
    ADD COLUMN IF NOT EXISTS student_activities_json TEXT,
    ADD COLUMN IF NOT EXISTS student_council_json TEXT;

-- 7. กำหนดสิทธิ์ความปลอดภัย (Row Level Security: RLS) แบบ Full Control
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['student_stats', 'grade_data', 'student_achievements', 'student_activities', 'student_council'])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Read for %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public Read for %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Full Access for %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public Full Access for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- 8. เปิดใช้งาน Supabase Realtime สำหรับตารางนักเรียนทุกตาราง
DO $$
DECLARE
    tbl TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOR tbl IN SELECT unnest(ARRAY['student_stats', 'grade_data', 'student_achievements', 'student_activities', 'student_council', 'school_settings'])
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

-- 9. ลบข้อมูลเก่าในระบบเดิมที่แอดลงไป (ลบข้อมูลม็อค 1,250 คน, ม.4-ม.6, สภานักเรียน ม.6)
DELETE FROM public.grade_data 
WHERE level LIKE '%มัธยมศึกษาปีที่ 4%' 
   OR level LIKE '%มัธยมศึกษาปีที่ 5%' 
   OR level LIKE '%มัธยมศึกษาปีที่ 6%'
   OR students >= 100;

DELETE FROM public.student_stats 
WHERE value = '1,250' OR value = '650' OR value = '600';

DELETE FROM public.student_council 
WHERE class LIKE '%ม.6%' OR class LIKE '%ม.5%';

DELETE FROM public.student_achievements 
WHERE title = 'เหรียญทองโอลิมปิกวิชาการ' OR title = 'ทุนการศึกษาต่อต่างประเทศ';

DELETE FROM public.student_activities 
WHERE name = 'ชมรมวิทยาศาสตร์' AND members = 85;

-- 10. ใส่ข้อมูลจริงของโรงเรียนบ้านหาดเค็ด (Hadket School: อ.2 - ม.3 รวม 74 คน) หากตารางว่าง
INSERT INTO public.student_stats (label, value, icon, color, order_position, is_active)
SELECT 'นักเรียนปัจจุบัน', '74 คน', 'Users', 'text-primary', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.student_stats);

INSERT INTO public.student_stats (label, value, icon, color, order_position, is_active)
SELECT 'ระดับปฐมวัย (อ.2 - อ.3)', '14 คน', 'GraduationCap', 'text-accent', 2, true
WHERE (SELECT count(*) FROM public.student_stats) <= 1;

INSERT INTO public.student_stats (label, value, icon, color, order_position, is_active)
SELECT 'ระดับประถมศึกษา (ป.1 - ป.6)', '38 คน', 'BookOpen', 'text-green-500', 3, true
WHERE (SELECT count(*) FROM public.student_stats) <= 2;

INSERT INTO public.student_stats (label, value, icon, color, order_position, is_active)
SELECT 'ระดับมัธยมศึกษาตอนต้น (ม.1 - ม.3)', '22 คน', 'Trophy', 'text-purple-500', 4, true
WHERE (SELECT count(*) FROM public.student_stats) <= 3;

-- ข้อมูลจำนวนนักเรียนแยกแต่ละชั้นปีของโรงเรียนบ้านหาดเค็ด (รวม 74 คน)
INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'อนุบาล 2', 1, 7, 4, 3, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.grade_data);

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'อนุบาล 3', 1, 7, 3, 4, 2, true
WHERE (SELECT count(*) FROM public.grade_data) <= 1;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'ประถมศึกษาปีที่ 1', 1, 6, 3, 3, 3, true
WHERE (SELECT count(*) FROM public.grade_data) <= 2;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'ประถมศึกษาปีที่ 2', 1, 7, 4, 3, 4, true
WHERE (SELECT count(*) FROM public.grade_data) <= 3;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'ประถมศึกษาปีที่ 3', 1, 6, 2, 4, 5, true
WHERE (SELECT count(*) FROM public.grade_data) <= 4;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'ประถมศึกษาปีที่ 4', 1, 6, 3, 3, 6, true
WHERE (SELECT count(*) FROM public.grade_data) <= 5;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'ประถมศึกษาปีที่ 5', 1, 6, 4, 2, 7, true
WHERE (SELECT count(*) FROM public.grade_data) <= 6;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'ประถมศึกษาปีที่ 6', 1, 7, 3, 4, 8, true
WHERE (SELECT count(*) FROM public.grade_data) <= 7;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'มัธยมศึกษาปีที่ 1', 1, 8, 4, 4, 9, true
WHERE (SELECT count(*) FROM public.grade_data) <= 8;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'มัธยมศึกษาปีที่ 2', 1, 7, 3, 4, 10, true
WHERE (SELECT count(*) FROM public.grade_data) <= 9;

INSERT INTO public.grade_data (level, rooms, students, boys, girls, order_position, is_active)
SELECT 'มัธยมศึกษาปีที่ 3', 1, 7, 4, 3, 11, true
WHERE (SELECT count(*) FROM public.grade_data) <= 10;

-- ข้อมูลผลงานนักเรียนจริง
INSERT INTO public.student_achievements (title, description, year, category, order_position)
SELECT 'รางวัลชนะเลิศโครงงานวิทยาศาสตร์และสิ่งแวดล้อม', 'ตัวแทนนักเรียนได้รับรางวัลชนะเลิศการประกวดโครงงานระดับเขตพื้นที่การศึกษา', '2568', 'วิทยาศาสตร์', 1
WHERE NOT EXISTS (SELECT 1 FROM public.student_achievements);

INSERT INTO public.student_achievements (title, description, year, category, order_position)
SELECT 'รางวัลเหรียญทองการแข่งขันหุ่นยนต์และนวัตกรรม AI', 'ตัวแทนนักเรียนคว้ารางวัลเหรียญทองการแข่งขันเทคโนโลยีและนวัตกรรม', '2568', 'เทคโนโลยี', 2
WHERE (SELECT count(*) FROM public.student_achievements) <= 1;

INSERT INTO public.student_achievements (title, description, year, category, order_position)
SELECT 'รางวัลชนะเลิศการประกวดดนตรีพื้นบ้านและศิลปวัฒนธรรมน่าน', 'ร่วมสืบสานและอนุรักษ์ดนตรีพื้นบ้านและศิลปวัฒนธรรมท้องถิ่น', '2567', 'ศิลปวัฒนธรรม', 3
WHERE (SELECT count(*) FROM public.student_achievements) <= 2;

-- ข้อมูลชมรมและกิจกรรมพัฒนาผู้เรียน
INSERT INTO public.student_activities (name, members, description, order_position)
SELECT 'ชมรมคอมพิวเตอร์และนวัตกรรมดิจิทัล', 24, 'ฝึกทักษะโค้ดดิ้ง AI และการสร้างสรรค์สื่อดิจิทัลเพื่อการศึกษา', 1
WHERE NOT EXISTS (SELECT 1 FROM public.student_activities);

INSERT INTO public.student_activities (name, members, description, order_position)
SELECT 'ชมรมวิทยาศาสตร์และเกษตรพอเพียง', 20, 'เรียนรู้วิทยาศาสตร์เชิงปฏิบัติการและการทำเกษตรอินทรีย์ตามหลักปรัชญาเศรษฐกิจพอเพียง', 2
WHERE (SELECT count(*) FROM public.student_activities) <= 1;

INSERT INTO public.student_activities (name, members, description, order_position)
SELECT 'ชมรมดนตรีและศิลปวัฒนธรรมพื้นบ้าน', 18, 'สืบสานดนตรีพื้นเมืองและศิลปะการแสดงท้องถิ่นน่าน', 3
WHERE (SELECT count(*) FROM public.student_activities) <= 2;

INSERT INTO public.student_activities (name, members, description, order_position)
SELECT 'ชมรมกีฬาและส่งเสริมสุขภาพ', 25, 'ฝึกซ้อมฟุตซอล วอลเลย์บอล เปตอง และกรีฑา', 4
WHERE (SELECT count(*) FROM public.student_activities) <= 3;

-- ข้อมูลสภานักเรียนโรงเรียนบ้านหาดเค็ด
INSERT INTO public.student_council (name, position, class, initial, order_position, is_active)
SELECT 'เด็กชายกิตติภพ สุขใจ', 'ประธานสภานักเรียน', 'ม.3/1', 'ก', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.student_council);

INSERT INTO public.student_council (name, position, class, initial, order_position, is_active)
SELECT 'เด็กหญิงพิชญา รักเรียน', 'รองประธานสภานักเรียน', 'ม.3/1', 'พ', 2, true
WHERE (SELECT count(*) FROM public.student_council) <= 1;

INSERT INTO public.student_council (name, position, class, initial, order_position, is_active)
SELECT 'เด็กชายธนดล วงศ์วิทย์', 'เลขานุการสภานักเรียน', 'ม.2/1', 'ธ', 3, true
WHERE (SELECT count(*) FROM public.student_council) <= 2;

INSERT INTO public.student_council (name, position, class, initial, order_position, is_active)
SELECT 'เด็กหญิงกัญญารัตน์ สดใส', 'หัวหน้าฝ่ายกิจกรรมและประชาสัมพันธ์ (Sapha Plus)', 'ม.2/1', 'ก', 4, true
WHERE (SELECT count(*) FROM public.student_council) <= 3;
