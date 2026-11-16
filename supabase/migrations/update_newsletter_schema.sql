-- =============================================================================
-- Newsletter System Upgrade Migration (Multi-Image, Templates, AI & Workflow)
-- ตารางเป้าหมาย: public.newsletters
-- ปลอดภัย 100%: ใช้ ADD COLUMN IF NOT EXISTS และไม่ลบหรือแก้ไขข้อมูลเดิม
-- =============================================================================

-- 1. เพิ่มคอลัมน์ใหม่แบบปลอดภัยในตาราง public.newsletters
ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_type TEXT NOT NULL DEFAULT 'template_1',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS revision_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 2. กำหนดค่า CHECK constraint ของ status ให้รองรับ draft, pending, revision, approved
DO $$
BEGIN
  ALTER TABLE public.newsletters DROP CONSTRAINT IF EXISTS newsletters_status_check;
  ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_status_check
    CHECK (status IN ('draft', 'pending', 'revision', 'approved'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. กำหนดค่า CHECK constraint ของ template_type ให้รองรับ template_1..template_4
DO $$
BEGIN
  ALTER TABLE public.newsletters DROP CONSTRAINT IF EXISTS newsletters_template_type_check;
  ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_template_type_check
    CHECK (template_type IN ('template_1', 'template_2', 'template_3', 'template_4'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Backward Compatibility: ซิงค์ข้อมูลเก่าที่มีอยู่โดยไม่ทำให้ข้อมูลเดิมสูญหาย
UPDATE public.newsletters
SET status = 'approved'
WHERE is_published = true
  AND status = 'draft';

UPDATE public.newsletters
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (image_urls IS NULL OR jsonb_array_length(image_urls) = 0);

-- 5. คำอธิบายคอลัมน์เพิ่มเติม
COMMENT ON COLUMN public.newsletters.image_urls IS 'รายการ URL รูปภาพประกอบจดหมายข่าว 4-6 รูป (JSON Array)';
COMMENT ON COLUMN public.newsletters.template_type IS 'รูปแบบเทมเพลตการจัดวาง: template_1..template_4';
COMMENT ON COLUMN public.newsletters.status IS 'สถานะการทำงาน: draft, pending, revision, approved';
COMMENT ON COLUMN public.newsletters.revision_note IS 'หมายเหตุข้อเสนอแนะจากผู้บริหารกรณีส่งกลับแก้ไข';
COMMENT ON COLUMN public.newsletters.approved_by IS 'ชื่อผู้บริหารผู้อนุมัติเผยแพร่';
COMMENT ON COLUMN public.newsletters.approved_at IS 'วันเวลาที่ผู้บริหารอนุมัติเผยแพร่';
COMMENT ON COLUMN public.newsletters.created_by IS 'ชื่อผู้ใช้ (username) ผู้สร้างจดหมายข่าว';
COMMENT ON COLUMN public.newsletters.created_by_name IS 'ชื่อ-นามสกุลผู้จัดทำจดหมายข่าว';

-- 6. ดัชนีสำหรับการกรองตามสถานะและผู้จัดทำ
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON public.newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_by ON public.newsletters(created_by);

-- 7. เปิดใช้งาน Supabase Realtime สำหรับตาราง newsletters (แบบปลอดภัย)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'newsletters'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.newsletters;
    END IF;
  END IF;
END $$;
