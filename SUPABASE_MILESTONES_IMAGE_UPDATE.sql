-- ==============================================================================
-- SUPABASE MIGRATION: MILESTONES IMAGE & EXPANDED TEXT UPDATE
-- ==============================================================================
-- เพิ่มคอลัมน์ image_url สำหรับรองรับการแนบรูปภาพในแต่ละเหตุการณ์ Timeline ประวัติโรงเรียน
-- (คอลัมน์ event เป็นประเภท TEXT อยู่แล้ว รองรับข้อความยาวได้เต็มที่)
-- ==============================================================================

-- 1. เพิ่มคอลัมน์ image_url ในตาราง milestones หากยังไม่มี
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. ยืนยันการตั้งค่า RLS ให้สามารถเข้าถึงและอัปเดตได้
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'milestones' AND policyname = 'Allow full access for milestones'
    ) THEN
        CREATE POLICY "Allow full access for milestones"
            ON public.milestones
            FOR ALL 
            USING (true) 
            WITH CHECK (true);
    END IF;
END $$;

-- 3. ตรวจสอบ Bucket 'images' สำหรับจัดเก็บรูปภาพประวัติความเป็นมา
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 104857600, null)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600, allowed_mime_types = null;

-- แจ้งสถานะความสำเร็จ
SELECT 'Milestones image_url update completed successfully!' as status;
