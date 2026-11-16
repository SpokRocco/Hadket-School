export type NewsletterTemplateType =
  | 'template_1'
  | 'template_2'
  | 'template_3'
  | 'template_4';

export type NewsletterStatus = 'draft' | 'pending' | 'revision' | 'approved';

const THAI_MONTH_NAMES = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const;

export const formatThaiDate = (dateStr: string): string => {
  try {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return `${parsed.getDate()} ${THAI_MONTH_NAMES[parsed.getMonth()]} ${parsed.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export interface SchoolNewsletter {
  id: string;
  issue_no: string;
  academic_year: string;
  issue_date: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string;
  image_url: string | null;
  image_urls?: string[];
  template_type?: NewsletterTemplateType;
  status?: NewsletterStatus;
  revision_note?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  file_url: string | null;
  views: number;
  is_published: boolean;
  order_position: number;
  created_at?: string;
  updated_at?: string;
}

export interface NewsletterTemplateMeta {
  id: NewsletterTemplateType;
  name: string;
  thaiName: string;
  description: string;
  idealImages: string;
  maxBodyChars: number;
}

export interface NewsletterOrgSettings {
  defaultTemplate: NewsletterTemplateType;
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  directorTitle: string;
}

export interface ImageAnalysisMetric {
  url: string;
  index: number;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
  resolutionScore: number;
}

export interface AiSmartLayoutResult {
  recommendedTemplate: NewsletterTemplateType;
  orderedUrls: string[];
  reason: string;
  source: 'gemini' | 'smart-heuristic';
}

export interface AiContentRefineResult {
  summary: string;
  content: string;
  note: string;
  source: 'gemini' | 'smart-heuristic';
}

export const NEWSLETTER_CATEGORIES = [
  'ทั้งหมด',
  'กิจกรรมสถานศึกษา',
  'งานวิชาการ',
  'กิจการนักเรียน',
  'ผลงานและความภูมิใจ',
  'บริหารทั่วไปและชุมชนสัมพันธ์',
];

export const NEWSLETTER_MIN_IMAGES = 4;
export const NEWSLETTER_MAX_IMAGES = 6;

export const NEWSLETTER_TEMPLATES: NewsletterTemplateMeta[] = [
  {
    id: 'template_1',
    name: 'Hero + Grid',
    thaiName: 'ภาพเด่น + กริดกิจกรรม',
    description: 'ภาพเด่นขนาดใหญ่ด้านบน 1 ภาพ คู่กับภาพย่อย 3–5 ภาพด้านล่าง',
    idealImages: '4–6 ภาพ (เน้นภาพแนวนอนหลัก)',
    maxBodyChars: 520,
  },
  {
    id: 'template_2',
    name: 'Magazine / Editorial',
    thaiName: 'นิตยสารสลับซ้าย-ขวา (Zig-zag)',
    description: 'จัดวางภาพสลับซ้าย-ขวาคู่เนื้อหาอย่างเป็นทางการ น่าอ่าน',
    idealImages: '4–6 ภาพ + เนื้อหาละเอียด',
    maxBodyChars: 620,
  },
  {
    id: 'template_3',
    name: 'Collage / Bento Grid',
    thaiName: 'เบนโตะกริดสมัยใหม่ (Bento)',
    description: 'จัดวางภาพแบบตารางสัดส่วนสมัยใหม่ เน้นความโดดเด่นของภาพกิจกรรม',
    idealImages: '4–6 ภาพหลากมุมมอง',
    maxBodyChars: 440,
  },
  {
    id: 'template_4',
    name: 'Classic Gallery',
    thaiName: 'คลาสสิกแกลเลอรี (2×2 / 3×2)',
    description: 'หัวข้อและเนื้อหา 2 คอลัมน์ด้านบน ตามด้วยแกลเลอรีเป็นระเบียบด้านล่าง',
    idealImages: '4 หรือ 6 ภาพ',
    maxBodyChars: 680,
  },
];

export const DEFAULT_NEWSLETTER_ORG_SETTINGS: NewsletterOrgSettings = {
  defaultTemplate: 'template_1',
  headerTitle: 'จดหมายข่าวประชาสัมพันธ์',
  headerSubtitle: 'SCHOOL NEWSLETTER • วารสารประชาสัมพันธ์สถานศึกษา',
  footerText: '',
  directorTitle: 'ผู้อำนวยการโรงเรียน',
};

export const NEWSLETTER_STATUS_META: Record<
  NewsletterStatus,
  { label: string; badgeClass: string; description: string }
> = {
  draft: {
    label: 'แบบร่าง',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    description: 'กำลังจัดทำ ยังไม่ได้ส่งขออนุมัติหรือเผยแพร่',
  },
  pending: {
    label: 'รออนุมัติ',
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-300 dark:text-amber-300',
    description: 'ส่งเรื่องถึงผู้บริหารแล้ว รอการตรวจสอบและอนุมัติ',
  },
  revision: {
    label: 'ส่งกลับแก้ไข',
    badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-300',
    description: 'ผู้บริหารส่งกลับพร้อมหมายเหตุให้ปรับปรุง',
  },
  approved: {
    label: 'อนุมัติเผยแพร่แล้ว',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300',
    description: 'ผ่านการอนุมัติและเผยแพร่บนเว็บไซต์แล้ว',
  },
};

export const NEWSLETTER_EXTENDED_META_SETTINGS_KEY = 'newsletter_extended_meta_json';
export const NEWSLETTER_ORG_SETTINGS_KEY = 'newsletter_org_settings_json';
export const LOCAL_NEWSLETTER_META_CACHE_KEY = 'kk_school_newsletter_meta_v1';
export const LOCAL_NEWSLETTER_ORG_CACHE_KEY = 'kk_school_newsletter_org_v1';

export const isValidTemplateType = (val: unknown): val is NewsletterTemplateType =>
  val === 'template_1' || val === 'template_2' || val === 'template_3' || val === 'template_4';

export const isValidNewsletterStatus = (val: unknown): val is NewsletterStatus =>
  val === 'draft' || val === 'pending' || val === 'revision' || val === 'approved';

/**
 * Safely parses image_urls from JSONB/array/string and preserves backward compatibility
 * with legacy records that only have a single `image_url`.
 */
export const parseImageUrlsList = (
  rawImageUrls: unknown,
  fallbackSingleUrl?: string | null
): string[] => {
  let list: string[] = [];

  if (Array.isArray(rawImageUrls)) {
    list = rawImageUrls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  } else if (typeof rawImageUrls === 'string' && rawImageUrls.trim()) {
    try {
      const parsed = JSON.parse(rawImageUrls);
      if (Array.isArray(parsed)) {
        list = parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
      }
    } catch {
      // Ignore malformed JSON string
    }
  }

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const item of list) {
    const clean = item.trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      deduped.push(clean);
    }
  }

  if (deduped.length === 0 && typeof fallbackSingleUrl === 'string' && fallbackSingleUrl.trim()) {
    deduped.push(fallbackSingleUrl.trim());
  }

  return deduped.slice(0, NEWSLETTER_MAX_IMAGES);
};

/**
 * Normalizes a newsletter DB row (legacy or upgraded schema) into a safe, consistent model.
 */
export const normalizeNewsletterRecord = (
  raw: any,
  metaOverlay?: Record<string, Partial<SchoolNewsletter>>
): SchoolNewsletter => {
  const id = String(raw?.id || '');
  const overlay = id && metaOverlay ? metaOverlay[id] : undefined;

  const nativeImageUrls = parseImageUrlsList(raw?.image_urls, null);
  const overlayImageUrls = overlay ? parseImageUrlsList(overlay.image_urls, null) : [];
  const legacySingleUrl =
    typeof raw?.image_url === 'string' && raw.image_url.trim() ? raw.image_url.trim() : null;

  const resolvedImageUrls =
    nativeImageUrls.length > 0
      ? nativeImageUrls
      : overlayImageUrls.length > 0
        ? overlayImageUrls
        : legacySingleUrl
          ? [legacySingleUrl]
          : [];

  const resolvedPrimaryImage = legacySingleUrl || resolvedImageUrls[0] || null;

  const rawTemplate = raw?.template_type;
  const resolvedTemplate: NewsletterTemplateType = isValidTemplateType(rawTemplate)
    ? rawTemplate
    : isValidTemplateType(overlay?.template_type)
      ? overlay!.template_type!
      : 'template_1';

  const isPublished = Boolean(raw?.is_published);
  const rawStatus = raw?.status;
  const resolvedStatus: NewsletterStatus = isValidNewsletterStatus(rawStatus)
    ? rawStatus
    : isValidNewsletterStatus(overlay?.status)
      ? overlay!.status!
      : isPublished
        ? 'approved'
        : 'draft';

  return {
    id,
    issue_no: String(raw?.issue_no || '01'),
    academic_year: String(raw?.academic_year || '2569'),
    issue_date: String(raw?.issue_date || new Date().toISOString().split('T')[0]),
    title: String(raw?.title || ''),
    summary: raw?.summary ?? null,
    content: raw?.content ?? null,
    category: String(raw?.category || 'กิจกรรมสถานศึกษา'),
    image_url: resolvedPrimaryImage,
    image_urls: resolvedImageUrls,
    template_type: resolvedTemplate,
    status: resolvedStatus,
    revision_note: raw?.revision_note ?? overlay?.revision_note ?? null,
    approved_by: raw?.approved_by ?? overlay?.approved_by ?? null,
    approved_at: raw?.approved_at ?? overlay?.approved_at ?? null,
    created_by: raw?.created_by ?? overlay?.created_by ?? null,
    created_by_name: raw?.created_by_name ?? overlay?.created_by_name ?? null,
    file_url: raw?.file_url ?? null,
    views: Number(raw?.views || 0),
    is_published: isPublished,
    order_position: Number(raw?.order_position || 0),
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
};

/**
 * Determines whether a newsletter should appear on the public website (/ and /newsletters).
 * Legacy rows with is_published=true default to status='approved', so they remain visible.
 */
export const isNewsletterPubliclyVisible = (item: SchoolNewsletter): boolean => {
  if (!item.is_published) return false;
  const status = item.status || 'approved';
  return status === 'approved';
};

/**
 * Parses organization-level newsletter template/header/footer settings safely.
 */
export const parseNewsletterOrgSettings = (raw?: string | null): NewsletterOrgSettings => {
  if (!raw || !raw.trim()) {
    return { ...DEFAULT_NEWSLETTER_ORG_SETTINGS };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      defaultTemplate: isValidTemplateType(parsed?.defaultTemplate)
        ? parsed.defaultTemplate
        : DEFAULT_NEWSLETTER_ORG_SETTINGS.defaultTemplate,
      headerTitle:
        typeof parsed?.headerTitle === 'string' && parsed.headerTitle.trim()
          ? parsed.headerTitle.trim()
          : DEFAULT_NEWSLETTER_ORG_SETTINGS.headerTitle,
      headerSubtitle:
        typeof parsed?.headerSubtitle === 'string' && parsed.headerSubtitle.trim()
          ? parsed.headerSubtitle.trim()
          : DEFAULT_NEWSLETTER_ORG_SETTINGS.headerSubtitle,
      footerText: typeof parsed?.footerText === 'string' ? parsed.footerText.trim() : '',
      directorTitle:
        typeof parsed?.directorTitle === 'string' && parsed.directorTitle.trim()
          ? parsed.directorTitle.trim()
          : DEFAULT_NEWSLETTER_ORG_SETTINGS.directorTitle,
    };
  } catch {
    return { ...DEFAULT_NEWSLETTER_ORG_SETTINGS };
  }
};

/**
 * Intelligent layout & image-sequence optimizer based on image count,
 * natural aspect ratios, orientation mix, and text density.
 */
export const computeAiSmartLayoutPlan = (input: {
  title: string;
  summary: string;
  content: string;
  category?: string;
  images: ImageAnalysisMetric[];
}): AiSmartLayoutResult => {
  const images = Array.isArray(input.images) ? input.images : [];
  const totalTextLen = (input.summary || '').trim().length + (input.content || '').trim().length;

  // Score candidate hero image: strongly prefer wide landscape overview photos with crisp resolution
  const rankedImages = [...images].sort((a, b) => {
    const score = (m: ImageAnalysisMetric) => {
      const orientationWeight =
        m.orientation === 'landscape' ? 30 : m.orientation === 'square' ? 15 : 0;
      const ratioBonus = m.aspectRatio >= 1.25 && m.aspectRatio <= 2.1 ? 15 : 0;
      return orientationWeight + ratioBonus + m.resolutionScore;
    };
    return score(b) - score(a);
  });

  const orderedUrls = rankedImages.map((m) => m.url);
  const heroMetric = rankedImages[0];
  const landscapeCount = images.filter((m) => m.orientation === 'landscape').length;
  const portraitCount = images.filter((m) => m.orientation === 'portrait').length;

  let recommendedTemplate: NewsletterTemplateType = 'template_1';
  let reason =
    'เลือกภาพแนวนอนที่มีมุมมองกว้างและคมชัดที่สุดเป็นภาพหลัก พร้อมจัดเรียงภาพกิจกรรมที่เหลืออย่างสมดุล';

  if (totalTextLen >= 460 || (images.length === 4 && totalTextLen >= 340)) {
    recommendedTemplate = 'template_4';
    reason =
      'เนื้อหามีรายละเอียดค่อนข้างมาก จึงจัดวางแบบ Classic Gallery (เนื้อหา 2 คอลัมน์ด้านบน + แกลเลอรีด้านล่าง) เพื่อให้อ่านง่ายและพอดี 1 หน้า A4';
  } else if (
    images.length >= 4 &&
    totalTextLen >= 240 &&
    (portraitCount >= 2 ||
      input.category === 'งานวิชาการ' ||
      input.category === 'บริหารทั่วไปและชุมชนสัมพันธ์')
  ) {
    recommendedTemplate = 'template_2';
    reason =
      'เหมาะกับรูปแบบ Magazine / Editorial (สลับซ้าย-ขวา) เพื่อจับคู่ภาพแนวตั้ง/ภาพบุคคลเข้ากับเนื้อหาอย่างเป็นทางการ';
  } else if (images.length >= 5 && portraitCount >= 1 && landscapeCount >= 1 && totalTextLen <= 400) {
    recommendedTemplate = 'template_3';
    reason =
      'มีภาพกิจกรรมหลากหลายมุมมอง (ทั้งแนวนอนและแนวตั้ง) จึงจัดวางแบบ Bento Collage Grid ให้ดูทันสมัยและโดดเด่นในหน้าเดียว';
  } else if (heroMetric && heroMetric.orientation === 'landscape') {
    recommendedTemplate = 'template_1';
    reason =
      'พบภาพแนวนอนที่เหมาะเป็นภาพเปิดเรื่องอย่างชัดเจน จึงจัดวางแบบ Hero + Grid เพื่อเน้นภาพหลักด้านบนและรวมภาพประกอบด้านล่าง';
  }

  return {
    recommendedTemplate,
    orderedUrls,
    reason,
    source: 'smart-heuristic',
  };
};

/**
 * Balances summary and content paragraph structure to fit cleanly inside 1 A4 sheet
 * for the target layout template without overflowing onto a second page.
 */
export const refineNewsletterContentForTemplate = (input: {
  title: string;
  summary: string;
  content: string;
  templateType: NewsletterTemplateType;
}): AiContentRefineResult => {
  const meta =
    NEWSLETTER_TEMPLATES.find((t) => t.id === input.templateType) || NEWSLETTER_TEMPLATES[0];

  const cleanText = (str: string) =>
    str
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  let summary = cleanText(input.summary || '');
  let content = cleanText(input.content || '');

  // Auto-generate a crisp 1-2 sentence summary lead from content/title if summary was blank
  if (!summary && content) {
    const firstSentence = content.split(/(?<=[.!?\n])\s+/)[0] || content;
    summary =
      firstSentence.length > 175
        ? `${firstSentence.slice(0, 172).trim()}...`
        : firstSentence;
  } else if (summary.length > 195) {
    summary = `${summary.slice(0, 192).trim()}...`;
  }

  // Structure long single-block content into balanced paragraphs for A4 readability
  if (content && !content.includes('\n\n') && content.length > 210) {
    const midpoint = Math.floor(content.length / 2);
    const spaceAfterMid = content.indexOf(' ', midpoint);
    if (spaceAfterMid > 80 && spaceAfterMid < content.length - 40) {
      content = `${content.slice(0, spaceAfterMid).trim()}\n\n${content
        .slice(spaceAfterMid + 1)
        .trim()}`;
    }
  }

  // Trim gracefully if content exceeds the 1-page A4 budget for the chosen template
  const budget = meta.maxBodyChars;
  let trimmed = false;
  if (content.length > budget) {
    const cutAt = content.lastIndexOf(' ', budget - 3);
    const endIdx = cutAt > budget * 0.6 ? cutAt : budget - 3;
    content = `${content.slice(0, endIdx).trim()}...`;
    trimmed = true;
  }

  const note = trimmed
    ? `ปรับย่อหน้าและกระชับเนื้อหาให้พอดีกับพื้นที่เทมเพลต ${meta.name} (1 หน้า A4) เรียบร้อยแล้ว`
    : `จัดระเบียบย่อหน้าและสรุปนำเรื่องให้สมดุลกับเทมเพลต ${meta.name} เรียบร้อยแล้ว`;

  return {
    summary,
    content,
    note,
    source: 'smart-heuristic',
  };
};

/**
 * Copy-ready idempotent SQL migration for Supabase SQL Editor.
 */
export const NEWSLETTER_SCHEMA_MIGRATION_SQL = `-- อัปเดตตาราง public.newsletters สำหรับระบบจดหมายข่าว 4-6 รูปภาพ เทมเพลต และระบบอนุมัติ
ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_type TEXT NOT NULL DEFAULT 'template_1',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS revision_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

DO $$
BEGIN
  ALTER TABLE public.newsletters DROP CONSTRAINT IF EXISTS newsletters_status_check;
  ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_status_check
    CHECK (status IN ('draft', 'pending', 'revision', 'approved'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.newsletters DROP CONSTRAINT IF EXISTS newsletters_template_type_check;
  ALTER TABLE public.newsletters
    ADD CONSTRAINT newsletters_template_type_check
    CHECK (template_type IN ('template_1', 'template_2', 'template_3', 'template_4'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

UPDATE public.newsletters
SET status = 'approved'
WHERE is_published = true AND status = 'draft';

UPDATE public.newsletters
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url <> ''
  AND (image_urls IS NULL OR jsonb_array_length(image_urls) = 0);

CREATE INDEX IF NOT EXISTS idx_newsletters_status ON public.newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_by ON public.newsletters(created_by);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'newsletters'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.newsletters;
    END IF;
  END IF;
END $$;`;
