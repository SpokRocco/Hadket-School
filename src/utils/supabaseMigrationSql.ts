export const SUPABASE_EXTENDED_MIGRATION_SQL = `-- SUPABASE DATABASE UPDATE: HOMEPAGE ORDERING, ARRIVAL POPUP & REAL-TIME SYNC
-- โรงเรียนบ้านหาดเค็ด (Project Reference: fhfckuypfstlokashcmu)
-- Safe to run: preserves ALL existing data with IF NOT EXISTS / ON CONFLICT DO NOTHING

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

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
    'sapha_projects', 'sapha_links'
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
