-- Migration 014: Homepage Ordering, Arrival Popup & Realtime Sync for โรงเรียนบ้านหาดเค็ด
-- Preserves all existing records in Supabase project fhfckuypfstlokashcmu

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

INSERT INTO public.news_categories (name, description, color)
VALUES
  ('ข่าวประชาสัมพันธ์', 'ข่าวประชาสัมพันธ์และการดำเนินงานของโรงเรียนบ้านหาดเค็ด', 'blue'),
  ('กิจกรรม', 'กิจกรรมนักเรียนและโครงการพัฒนาศักยภาพผู้เรียน', 'green'),
  ('ผลงานนักเรียน', 'ทำเนียบผลงานและเกียรติบัตรของนักเรียน', 'purple'),
  ('ความภาคภูมิใจ', 'รางวัลเกียรติยศและความภาคภูมิใจของสถาบัน', 'amber'),
  ('ประกาศ', 'ประกาศสำคัญและการรับสมัครนักเรียนใหม่', 'red')
ON CONFLICT (name) DO NOTHING;
