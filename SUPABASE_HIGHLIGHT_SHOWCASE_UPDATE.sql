-- ==============================================================================
-- SUPABASE MIGRATION: HOMEPAGE HIGHLIGHT ACTIVITIES & CURRICULUM REALTIME SYNC
-- โรงเรียนบ้านหาดเค็ด (SpokRocco/Hadket-School)
-- สร้างตาราง homepage_highlights สำหรับจัดการส่วนแบนเนอร์กิจกรรมเด่น & หลักสูตรหน้าแรก (Full Control)
-- พร้อมซิงค์กับ curriculum_programs, curriculum_activities และ grade_data แบบเรียลไทม์
-- ปลอดภัย 100%: ใช้ IF NOT EXISTS และ ON CONFLICT DO NOTHING ไม่ลบข้อมูลเดิม
-- ==============================================================================

-- 1. สร้างตาราง homepage_highlights (Full Control)
CREATE TABLE IF NOT EXISTS public.homepage_highlights (
  id TEXT PRIMARY KEY,
  badge TEXT DEFAULT 'CURRICULUM & HIGHLIGHT ACTIVITIES',
  title_highlight TEXT DEFAULT 'หลักสูตรและกิจกรรมเด่น',
  title TEXT NOT NULL DEFAULT 'โรงเรียนบ้านหาดเค็ด',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  image_caption TEXT DEFAULT '',
  image_position TEXT DEFAULT 'center center',
  image_scale NUMERIC DEFAULT 1,
  show_overlay BOOLEAN NOT NULL DEFAULT true,
  show_caption BOOLEAN NOT NULL DEFAULT true,
  show_badge BOOLEAN NOT NULL DEFAULT true,
  show_play_button BOOLEAN NOT NULL DEFAULT false,
  play_action_type TEXT DEFAULT 'link',
  media_link_url TEXT DEFAULT '/curriculum',
  sync_curriculum BOOLEAN NOT NULL DEFAULT true,
  sync_activities BOOLEAN NOT NULL DEFAULT true,
  sync_grades BOOLEAN NOT NULL DEFAULT true,
  auto_caption_from_db BOOLEAN NOT NULL DEFAULT true,
  auto_description_from_db BOOLEAN NOT NULL DEFAULT true,
  custom_tags TEXT[] DEFAULT '{}',
  primary_label TEXT DEFAULT 'ดูหลักสูตรที่เปิดสอน',
  primary_href TEXT DEFAULT '/curriculum',
  show_primary_btn BOOLEAN NOT NULL DEFAULT true,
  secondary_label TEXT DEFAULT 'ประมวลภาพกิจกรรม',
  secondary_href TEXT DEFAULT '/gallery',
  show_secondary_btn BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- อัปเกรดคอลัมน์กรณีตารางมีอยู่แล้ว
ALTER TABLE IF EXISTS public.homepage_highlights
  ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'CURRICULUM & HIGHLIGHT ACTIVITIES',
  ADD COLUMN IF NOT EXISTS title_highlight TEXT DEFAULT 'หลักสูตรและกิจกรรมเด่น',
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center center',
  ADD COLUMN IF NOT EXISTS image_scale NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS show_overlay BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_caption BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_badge BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_play_button BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS play_action_type TEXT DEFAULT 'link',
  ADD COLUMN IF NOT EXISTS media_link_url TEXT DEFAULT '/curriculum',
  ADD COLUMN IF NOT EXISTS sync_curriculum BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_activities BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_grades BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_caption_from_db BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_description_from_db BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_label TEXT DEFAULT 'ดูหลักสูตรที่เปิดสอน',
  ADD COLUMN IF NOT EXISTS primary_href TEXT DEFAULT '/curriculum',
  ADD COLUMN IF NOT EXISTS show_primary_btn BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS secondary_label TEXT DEFAULT 'ประมวลภาพกิจกรรม',
  ADD COLUMN IF NOT EXISTS secondary_href TEXT DEFAULT '/gallery',
  ADD COLUMN IF NOT EXISTS show_secondary_btn BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS order_position INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_homepage_highlights_order
  ON public.homepage_highlights (order_position ASC);

-- 2. กำหนดสิทธิ์ Row Level Security (RLS) แบบ Full Control
ALTER TABLE public.homepage_highlights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read for homepage_highlights" ON public.homepage_highlights;
CREATE POLICY "Public Read for homepage_highlights"
  ON public.homepage_highlights FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Full Access for homepage_highlights" ON public.homepage_highlights;
CREATE POLICY "Public Full Access for homepage_highlights"
  ON public.homepage_highlights FOR ALL USING (true) WITH CHECK (true);

-- 3. ใส่ข้อมูลเริ่มต้นที่ซิงค์กับหลักสูตรและกิจกรรมจริงใน Supabase (เฉพาะเมื่อตารางว่าง)
INSERT INTO public.homepage_highlights (
  id,
  badge,
  title_highlight,
  title,
  description,
  image_url,
  image_caption,
  show_play_button,
  play_action_type,
  media_link_url,
  sync_curriculum,
  sync_activities,
  sync_grades,
  auto_caption_from_db,
  auto_description_from_db,
  primary_label,
  primary_href,
  show_primary_btn,
  secondary_label,
  secondary_href,
  show_secondary_btn,
  is_active,
  order_position
)
SELECT
  'highlight-curriculum-main',
  'CURRICULUM & HIGHLIGHT ACTIVITIES',
  'หลักสูตรและกิจกรรมเด่น',
  'โรงเรียนบ้านหาดเค็ด',
  '',
  '',
  '',
  false,
  'link',
  '/curriculum',
  true,
  true,
  true,
  true,
  true,
  'ดูหลักสูตรที่เปิดสอน',
  '/curriculum',
  true,
  'ประมวลภาพกิจกรรม',
  '/gallery',
  true,
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_highlights);

-- 4. ตรวจสอบคอลัมน์ image_url ของตารางหลักสูตรและกิจกรรม
ALTER TABLE IF EXISTS public.curriculum_programs
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE IF EXISTS public.curriculum_activities
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 5. เตรียม key สำรองใน school_settings (Dual-Cloud) โดยไม่ทับข้อมูลเดิม
INSERT INTO public.school_settings (key, value, category, description)
VALUES (
  'featured_highlights_json',
  '[]',
  'homepage',
  'ข้อมูลสำรอง Dual-Cloud สำหรับแบนเนอร์กิจกรรมเด่นและหลักสูตรหน้าแรก Full Control'
)
ON CONFLICT (key) DO NOTHING;

-- 6. เปิดใช้งาน Supabase Realtime บนตารางที่เกี่ยวข้องทั้งหมด
DO $$
DECLARE
  tbl TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOR tbl IN SELECT unnest(ARRAY[
      'homepage_highlights',
      'curriculum_programs',
      'curriculum_activities',
      'grade_data',
      'gallery_albums',
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

SELECT 'Homepage Highlight & Curriculum Sync setup completed!' AS status;
