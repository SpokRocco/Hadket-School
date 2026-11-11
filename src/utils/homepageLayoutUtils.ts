export type HomepageSectionId =
  | 'hero'
  | 'about'
  | 'news'
  | 'curriculum'
  | 'administrators'
  | 'media'
  | 'newsletter'
  | 'contact';

export interface HomepageSectionConfig {
  id: HomepageSectionId;
  label: string;
  subtitle: string;
  enabled: boolean;
  order: number;
}

export type NewsHubSubSectionId =
  | 'public_relations'
  | 'student_activities'
  | 'featured_highlight'
  | 'spotlight_columns'
  | 'quick_services';

export interface NewsHubSubSectionConfig {
  id: NewsHubSubSectionId;
  label: string;
  subtitle: string;
  enabled: boolean;
  order: number;
}

export interface WelcomePopupConfig {
  enabled: boolean;
  layout: 'image_and_text' | 'image_only' | 'text_only';
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  secondaryText: string;
  secondaryUrl: string;
  frequency: 'every_visit' | 'once_per_session' | 'once_per_day';
  startDate: string;
  endDate: string;
  themeAccent: 'sky' | 'rose' | 'amber' | 'navy';
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  {
    id: 'hero',
    label: '1. แบนเนอร์หลักและประกาศสำคัญ (Hero Showcase)',
    subtitle: 'ภาพบรรยากาศโรงเรียน ข้อความต้อนรับ และข้อมูลสถิติสำคัญ',
    enabled: true,
    order: 1,
  },
  {
    id: 'about',
    label: '2. ยินดีต้อนรับสู่โรงเรียนและแนวทางการพัฒนา (Welcome & Vision)',
    subtitle: 'วิสัยทัศน์ พันธกิจ ค่านิยมองค์กร และสถิติสำคัญของโรงเรียน',
    enabled: true,
    order: 2,
  },
  {
    id: 'news',
    label: '3. ศูนย์รวมข่าวประชาสัมพันธ์และกิจกรรม (News Hub)',
    subtitle: 'ข่าวประชาสัมพันธ์ กิจกรรมนักเรียน ผลงานนักเรียน และประกาศสำคัญ',
    enabled: true,
    order: 3,
  },
  {
    id: 'newsletter',
    label: '4. จดหมายข่าวประชาสัมพันธ์ (School Newsletters)',
    subtitle: 'จดหมายข่าวประชาสัมพันธ์และวารสารโรงเรียนจากฐานข้อมูล Supabase',
    enabled: true,
    order: 4,
  },
  {
    id: 'curriculum',
    label: '5. หลักสูตรที่เปิดสอนและกิจกรรมพัฒนาผู้เรียน (Curriculum)',
    subtitle: 'ระดับชั้นที่เปิดสอน หลักสูตร แผนการเรียน และกิจกรรมเสริมหลักสูตร',
    enabled: true,
    order: 5,
  },
  {
    id: 'administrators',
    label: '6. ทำเนียบผู้บริหารและสารจากผู้อำนวยการ (Executive Message)',
    subtitle: 'ข้อมูลผู้บริหารสถานศึกษา วิสัยทัศน์ และแนวทางการบริหารงาน',
    enabled: true,
    order: 6,
  },
  {
    id: 'media',
    label: '7. คลังสื่อการสอนออนไลน์ & Google Sites (E-Learning Portal)',
    subtitle: 'สื่อการสอนดิจิทัล วิดีโอ เอกสาร PDF และพอร์ทัล Google Sites ของครู',
    enabled: true,
    order: 7,
  },
  {
    id: 'contact',
    label: '8. ข้อมูลติดต่อและแผนที่ตั้งโรงเรียน (Contact & Location)',
    subtitle: 'แบบฟอร์มติดต่อสอบถาม เบอร์โทรศัพท์ และแผนที่การเดินทาง',
    enabled: true,
    order: 8,
  },
];

export interface NavbarMenuItemConfig {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
}

export const DEFAULT_NAVBAR_MENU_ITEMS: NavbarMenuItemConfig[] = [
  { id: 'home', label: 'หน้าหลัก', href: '/', enabled: true, order: 1 },
  { id: 'about', label: 'เกี่ยวกับเรา', href: '/about', enabled: true, order: 2 },
  { id: 'curriculum', label: 'หลักสูตร', href: '/curriculum', enabled: true, order: 3 },
  { id: 'news', label: 'ข่าวสาร', href: '/news', enabled: true, order: 4 },
  { id: 'newsletters', label: 'จดหมายข่าวประชาสัมพันธ์', href: '/newsletters', enabled: true, order: 5 },
  { id: 'media', label: 'คลังสื่อ', href: '/media-library', enabled: true, order: 6 },
  { id: 'contact', label: 'ติดต่อเรา', href: '/contact', enabled: true, order: 7 },
];

export interface NewsletterDisplayConfig {
  title: string;
  subtitle: string;
  limit: number;
  category: string;
  sortMode: 'latest' | 'custom_order';
}

export const DEFAULT_NEWSLETTER_DISPLAY_CONFIG: NewsletterDisplayConfig = {
  title: 'จดหมายข่าวประชาสัมพันธ์',
  subtitle: 'วารสารและจดหมายข่าวสรุปกิจกรรมสำคัญของโรงเรียน (ดึงข้อมูลจริงจากฐานข้อมูล)',
  limit: 3,
  category: 'ทั้งหมด',
  sortMode: 'latest',
};

export const DEFAULT_NEWS_HUB_SUBSECTIONS: NewsHubSubSectionConfig[] = [
  {
    id: 'public_relations',
    label: 'หมวดข่าวประชาสัมพันธ์ (Public Relations)',
    subtitle: 'แถวการ์ดข่าวประชาสัมพันธ์และประกาศสำคัญ 3 คอลัมน์',
    enabled: true,
    order: 1,
  },
  {
    id: 'student_activities',
    label: 'หมวดกิจกรรมล่าสุด (Latest Student Activities)',
    subtitle: 'แถวการ์ดกิจกรรมนักเรียนและโครงการพัฒนาผู้เรียน',
    enabled: true,
    order: 2,
  },
  {
    id: 'featured_highlight',
    label: 'แบนเนอร์กิจกรรมเด่น (Featured Activity Showcase)',
    subtitle: 'ไฮไลต์ภาพบรรยากาศและลิงก์ประมวลภาพกิจกรรมของโรงเรียน',
    enabled: true,
    order: 3,
  },
  {
    id: 'spotlight_columns',
    label: 'โซน 3 คอลัมน์ (ผลงานนักเรียน · ความภาคภูมิใจ · ติดต่อเรา)',
    subtitle: 'สรุปผลงานนักเรียน รางวัลความภาคภูมิใจ และข้อมูลติดต่อด่วน',
    enabled: true,
    order: 4,
  },
  {
    id: 'quick_services',
    label: 'แถบทางลัดบริการด่วน 4 รายการ (Quick Access Strip)',
    subtitle: 'ปฏิทินกิจกรรม, จดหมายข่าวโรงเรียน, การสมัครเรียน, ช่องทางการติดต่อ',
    enabled: true,
    order: 5,
  },
];

// Default enabled for instant website announcement display
export const DEFAULT_WELCOME_POPUP_CONFIG: WelcomePopupConfig = {
  enabled: true,
  layout: 'image_and_text',
  badge: 'ประกาศสำคัญ · SPECIAL ANNOUNCEMENT',
  title: 'ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด',
  subtitle: 'ร่วมมือ วิชาการ งานอาชีพ · ก้าวทันเทคโนโลยี',
  description:
    'ติดตามข่าวสารประชาสัมพันธ์ ปฏิทินกิจกรรม ผลงานนักเรียน และสมัครเรียนออนไลน์ประจำปีการศึกษาได้ที่นี่',
  imageUrl: '',
  ctaText: 'สมัครเรียนออนไลน์',
  ctaUrl: '/enrollment',
  secondaryText: 'อ่านข่าวประชาสัมพันธ์ทั้งหมด',
  secondaryUrl: '/news',
  frequency: 'every_visit',
  startDate: '',
  endDate: '',
  themeAccent: 'sky',
};

export const parseHomepageSections = (rawJson?: string | null): HomepageSectionConfig[] => {
  if (!rawJson || !rawJson.trim()) {
    return DEFAULT_HOMEPAGE_SECTIONS.map((s) => ({ ...s }));
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      return DEFAULT_HOMEPAGE_SECTIONS.map((s) => ({ ...s }));
    }

    const byId = new Map<HomepageSectionId, Partial<HomepageSectionConfig>>();
    for (const item of parsed) {
      if (item && typeof item.id === 'string') {
        byId.set(item.id as HomepageSectionId, item);
      }
    }

    const merged = DEFAULT_HOMEPAGE_SECTIONS.map((def, idx) => {
      const saved = byId.get(def.id);
      return {
        ...def,
        label: typeof saved?.label === 'string' && saved.label.trim() ? saved.label : def.label,
        subtitle:
          typeof saved?.subtitle === 'string' && saved.subtitle.trim()
            ? saved.subtitle
            : def.subtitle,
        enabled: typeof saved?.enabled === 'boolean' ? saved.enabled : def.enabled,
        order: typeof saved?.order === 'number' ? saved.order : idx + 1,
      };
    });

    return merged
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
  } catch {
    return DEFAULT_HOMEPAGE_SECTIONS.map((s) => ({ ...s }));
  }
};

export const parseNewsHubSubSections = (rawJson?: string | null): NewsHubSubSectionConfig[] => {
  if (!rawJson || !rawJson.trim()) {
    return DEFAULT_NEWS_HUB_SUBSECTIONS.map((s) => ({ ...s }));
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      return DEFAULT_NEWS_HUB_SUBSECTIONS.map((s) => ({ ...s }));
    }

    const byId = new Map<NewsHubSubSectionId, Partial<NewsHubSubSectionConfig>>();
    for (const item of parsed) {
      if (item && typeof item.id === 'string') {
        byId.set(item.id as NewsHubSubSectionId, item);
      }
    }

    const merged = DEFAULT_NEWS_HUB_SUBSECTIONS.map((def, idx) => {
      const saved = byId.get(def.id);
      return {
        ...def,
        enabled: typeof saved?.enabled === 'boolean' ? saved.enabled : def.enabled,
        order: typeof saved?.order === 'number' ? saved.order : idx + 1,
      };
    });

    return merged
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
  } catch {
    return DEFAULT_NEWS_HUB_SUBSECTIONS.map((s) => ({ ...s }));
  }
};

export const moveItemInOrder = <T extends { id: string; order: number }>(
  items: T[],
  index: number,
  direction: 'up' | 'down'
): T[] => {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }
  const clone = [...items];
  const [moved] = clone.splice(index, 1);
  clone.splice(targetIndex, 0, moved);
  return clone.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
};

export const reorderItemsById = <T extends { id: string; order: number }>(
  items: T[],
  activeId: string,
  overId: string
): T[] => {
  const oldIndex = items.findIndex((i) => i.id === activeId);
  const newIndex = items.findIndex((i) => i.id === overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return items;
  }
  const clone = [...items];
  const [moved] = clone.splice(oldIndex, 1);
  clone.splice(newIndex, 0, moved);
  return clone.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
};

export const mergeFilteredReorder = <T extends { id: string }>(
  allItems: T[],
  reorderedFiltered: T[]
): T[] => {
  const subsetIds = new Set(reorderedFiltered.map((item) => item.id));
  if (subsetIds.size === 0) return allItems;

  const byId = new Map(reorderedFiltered.map((item) => [item.id, item]));
  let cursor = 0;

  return allItems.map((item) => {
    if (!subsetIds.has(item.id)) return item;
    const replacement = reorderedFiltered[cursor++];
    return replacement ? byId.get(replacement.id) ?? replacement : item;
  });
};

export const parseWelcomePopupConfig = (
  settingsMap: Record<string, string | undefined>,
  fallbackImageUrl = ''
): WelcomePopupConfig => {
  if (settingsMap.popup_config_json) {
    try {
      const parsed = JSON.parse(settingsMap.popup_config_json);
      return {
        ...DEFAULT_WELCOME_POPUP_CONFIG,
        ...parsed,
        imageUrl: parsed.imageUrl || settingsMap.popup_image_url || fallbackImageUrl,
      };
    } catch {
      // fall through to individual keys
    }
  }

  const enabledStr = settingsMap.popup_enabled;
  const enabled =
    enabledStr === undefined || enabledStr === ''
      ? DEFAULT_WELCOME_POPUP_CONFIG.enabled
      : enabledStr === 'true' || enabledStr === '1';

  const layout =
    settingsMap.popup_layout === 'image_only' ||
    settingsMap.popup_layout === 'text_only' ||
    settingsMap.popup_layout === 'image_and_text'
      ? settingsMap.popup_layout
      : DEFAULT_WELCOME_POPUP_CONFIG.layout;

  const frequency =
    settingsMap.popup_frequency === 'once_per_session' ||
    settingsMap.popup_frequency === 'once_per_day' ||
    settingsMap.popup_frequency === 'every_visit'
      ? settingsMap.popup_frequency
      : DEFAULT_WELCOME_POPUP_CONFIG.frequency;

  const themeAccent =
    settingsMap.popup_theme_accent === 'rose' ||
    settingsMap.popup_theme_accent === 'amber' ||
    settingsMap.popup_theme_accent === 'navy' ||
    settingsMap.popup_theme_accent === 'sky'
      ? settingsMap.popup_theme_accent
      : DEFAULT_WELCOME_POPUP_CONFIG.themeAccent;

  return {
    enabled,
    layout,
    badge: settingsMap.popup_badge || DEFAULT_WELCOME_POPUP_CONFIG.badge,
    title: settingsMap.popup_title || DEFAULT_WELCOME_POPUP_CONFIG.title,
    subtitle: settingsMap.popup_subtitle || DEFAULT_WELCOME_POPUP_CONFIG.subtitle,
    description: settingsMap.popup_description || DEFAULT_WELCOME_POPUP_CONFIG.description,
    imageUrl: settingsMap.popup_image_url || fallbackImageUrl,
    ctaText: settingsMap.popup_cta_text || DEFAULT_WELCOME_POPUP_CONFIG.ctaText,
    ctaUrl: settingsMap.popup_cta_url || DEFAULT_WELCOME_POPUP_CONFIG.ctaUrl,
    secondaryText: settingsMap.popup_secondary_text || DEFAULT_WELCOME_POPUP_CONFIG.secondaryText,
    secondaryUrl: settingsMap.popup_secondary_url || DEFAULT_WELCOME_POPUP_CONFIG.secondaryUrl,
    frequency,
    startDate: settingsMap.popup_start_date || '',
    endDate: settingsMap.popup_end_date || '',
    themeAccent,
  };
};

export const isPopupActiveNow = (config: WelcomePopupConfig, nowDate = new Date()): boolean => {
  if (!config.enabled) return false;

  const nowMs = nowDate.getTime();

  if (config.startDate && config.startDate.trim()) {
    const startMs = new Date(`${config.startDate.trim()}T00:00:00`).getTime();
    if (!Number.isNaN(startMs) && nowMs < startMs) {
      return false;
    }
  }

  if (config.endDate && config.endDate.trim()) {
    const endMs = new Date(`${config.endDate.trim()}T23:59:59`).getTime();
    if (!Number.isNaN(endMs) && nowMs > endMs) {
      return false;
    }
  }

  return true;
};

export const WELCOME_POPUP_SESSION_KEY = 'kk_welcome_popup_dismissed_session';
export const WELCOME_POPUP_DAY_KEY = 'kk_welcome_popup_dismissed_day';

export const resetWelcomePopupDismissal = (): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(WELCOME_POPUP_DAY_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(WELCOME_POPUP_SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export interface HomepageSectionTableRow {
  section_key: string;
  label?: string | null;
  subtitle?: string | null;
  enabled?: boolean | null;
  sort_order?: number | null;
}

export const mergeHomepageSectionsFromTable = (
  base: HomepageSectionConfig[],
  tableRows: HomepageSectionTableRow[]
): HomepageSectionConfig[] => {
  if (!Array.isArray(tableRows) || tableRows.length === 0) {
    return base;
  }

  const byKey = new Map<string, HomepageSectionTableRow>();
  for (const row of tableRows) {
    if (row && typeof row.section_key === 'string') {
      byKey.set(row.section_key, row);
    }
  }

  return base
    .map((item, idx) => {
      const row = byKey.get(item.id);
      if (!row) return item;
      return {
        ...item,
        label: typeof row.label === 'string' && row.label.trim() ? row.label : item.label,
        subtitle:
          typeof row.subtitle === 'string' && row.subtitle.trim() ? row.subtitle : item.subtitle,
        enabled: typeof row.enabled === 'boolean' ? row.enabled : item.enabled,
        order: typeof row.sort_order === 'number' ? row.sort_order : idx + 1,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((item, idx) => ({ ...item, order: idx + 1 }));
};

export const extractGoogleMapsEmbedSrc = (raw?: string | null): string => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (trimmed.toLowerCase().includes('<iframe')) {
    const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    const extracted = srcMatch?.[1]?.trim() || '';
    if (extracted.startsWith('https://') || extracted.startsWith('http://')) {
      return extracted;
    }
    return '';
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  return '';
};

export const parseNavbarMenuItems = (rawJson?: string | null): NavbarMenuItemConfig[] => {
  if (!rawJson || !rawJson.trim()) {
    return DEFAULT_NAVBAR_MENU_ITEMS.map((item) => ({ ...item }));
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) {
      return DEFAULT_NAVBAR_MENU_ITEMS.map((item) => ({ ...item }));
    }

    const byId = new Map<string, Partial<NavbarMenuItemConfig>>();
    for (const item of parsed) {
      if (item && typeof item.id === 'string') {
        byId.set(item.id, item);
      }
    }

    const merged = DEFAULT_NAVBAR_MENU_ITEMS.map((def, idx) => {
      const saved = byId.get(def.id);
      return {
        ...def,
        label: typeof saved?.label === 'string' && saved.label.trim() ? saved.label : def.label,
        href: typeof saved?.href === 'string' && saved.href.trim() ? saved.href : def.href,
        enabled: typeof saved?.enabled === 'boolean' ? saved.enabled : def.enabled,
        order: typeof saved?.order === 'number' ? saved.order : idx + 1,
      };
    });

    return merged
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
  } catch {
    return DEFAULT_NAVBAR_MENU_ITEMS.map((item) => ({ ...item }));
  }
};

export const parseNewsletterDisplayConfig = (
  settingsMap: Record<string, string | undefined>
): NewsletterDisplayConfig => {
  const parsedLimit = Number.parseInt(settingsMap.newsletter_home_limit || '', 10);
  const validLimits = [3, 4, 6, 9, 12];
  const limit = validLimits.includes(parsedLimit)
    ? parsedLimit
    : DEFAULT_NEWSLETTER_DISPLAY_CONFIG.limit;

  const sortMode =
    settingsMap.newsletter_home_sort === 'custom_order' ? 'custom_order' : 'latest';

  return {
    title:
      settingsMap.newsletter_section_title?.trim() ||
      DEFAULT_NEWSLETTER_DISPLAY_CONFIG.title,
    subtitle:
      settingsMap.newsletter_section_subtitle?.trim() ||
      DEFAULT_NEWSLETTER_DISPLAY_CONFIG.subtitle,
    limit,
    category:
      settingsMap.newsletter_home_category?.trim() ||
      DEFAULT_NEWSLETTER_DISPLAY_CONFIG.category,
    sortMode,
  };
};

export interface HeroSlideItem {
  id: string;
  image: string;
  kicker: string;
  subline: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  track1Name?: string;
  track1Range?: string;
  track2Name?: string;
  track2Range?: string;
  enabled: boolean;
  order: number;
}

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-admissions',
    image: '',
    kicker: 'เปิดรับสมัครนักเรียนใหม่ · ปีการศึกษา 2569',
    subline: 'ร่วมมือ วิชาการ งานอาชีพ · โรงเรียนบ้านหาดเค็ด',
    title: 'ร่วมมือ วิชาการ งานอาชีพ ด้วยปัญญา',
    subtitle:
      'มุ่งพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษา ส่งเสริมคุณธรรม น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง พร้อมก้าวทันเทคโนโลยี',
    primaryLabel: 'สมัครเรียนออนไลน์',
    primaryHref: '/enrollment',
    secondaryLabel: 'เกี่ยวกับโรงเรียน',
    secondaryHref: '/about',
    track1Name: 'นักเรียนปัจจุบัน',
    track1Range: '74 คน · 16 บุคลากรคุณภาพ',
    track2Name: 'ระยะเวลาหลักสูตร',
    track2Range: '9 ปี · เวลาเรียน 08.30-16.30 น.',
    enabled: true,
    order: 1,
  },
  {
    id: 'slide-academic',
    image: '',
    kicker: 'VISION & ACADEMIC EXCELLENCE · โรงเรียนบ้านหาดเค็ด',
    subline: 'วิสัยทัศน์และเป้าหมายการศึกษา · ปีการศึกษา 2569',
    title: 'มุ่งพัฒนาผู้เรียนสู่มาตรฐาน พร้อมทักษะเทคโนโลยีและงานอาชีพ',
    subtitle:
      'พัฒนาผู้เรียนให้มีความรู้และคุณภาพตามเกณฑ์มาตรฐานการศึกษาขั้นพื้นฐาน ส่งเสริมทักษะดิจิทัลและกระบวนการคิดวิเคราะห์',
    primaryLabel: 'ดูหลักสูตรที่เปิดสอน',
    primaryHref: '/curriculum',
    secondaryLabel: 'เข้าสู่คลังสื่อการสอนออนไลน์',
    secondaryHref: '/media-library',
    track1Name: 'ปีแห่งความเป็นเลิศ',
    track1Range: 'ก่อตั้งและพัฒนาการศึกษาต่อเนื่อง 116 ปี',
    track2Name: 'อัตราการศึกษาต่อ',
    track2Range: '90 % ศึกษาต่อและพัฒนาศักยภาพตามเกณฑ์',
    enabled: true,
    order: 2,
  },
  {
    id: 'slide-activities',
    image: '',
    kicker: 'STUDENT LIFE & ACTIVITIES · โรงเรียนบ้านหาดเค็ด',
    subline: 'วิชาการดี มีวินัย ใฝ่คุณธรรม นำประชาธิปไตย',
    title: 'น้อมนำหลักเศรษฐกิจพอเพียง สร้างเยาวชนคุณภาพคู่ชุมชน',
    subtitle:
      'ส่งเสริมคุณธรรม จริยธรรม สภาพลัส กิจกรรมพัฒนาผู้เรียน ดนตรี กีฬา และศิลปวัฒนธรรมอย่างรอบด้าน',
    primaryLabel: 'ข่าวสารและกิจกรรมล่าสุด',
    primaryHref: '/news',
    secondaryLabel: 'ข้อมูลนักเรียนและสภานักเรียน',
    secondaryHref: '/students',
    track1Name: 'ศิษย์เก่าโรงเรียน',
    track1Range: '1000+ เครือข่ายศิษย์เก่าและชุมชนเข้มแข็ง',
    track2Name: 'การมีส่วนร่วมของผู้เรียน',
    track2Range: 'กิจกรรมสภานักเรียน ชมรม และพัฒนาผู้เรียนรอบด้าน',
    enabled: true,
    order: 3,
  },
];

export const parseHeroSlides = (rawJson?: string | null): HeroSlideItem[] => {
  if (!rawJson || !rawJson.trim()) {
    return DEFAULT_HERO_SLIDES.map((s) => ({ ...s }));
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_HERO_SLIDES.map((s) => ({ ...s }));
    }

    return parsed
      .map((item, idx) => ({
        id: typeof item?.id === 'string' && item.id.trim() ? item.id : `slide-${idx + 1}`,
        image: typeof item?.image === 'string' ? item.image : '',
        kicker: typeof item?.kicker === 'string' ? item.kicker : '',
        subline: typeof item?.subline === 'string' ? item.subline : '',
        title: typeof item?.title === 'string' ? item.title : '',
        subtitle: typeof item?.subtitle === 'string' ? item.subtitle : '',
        primaryLabel: typeof item?.primaryLabel === 'string' ? item.primaryLabel : '',
        primaryHref: typeof item?.primaryHref === 'string' ? item.primaryHref : '',
        secondaryLabel: typeof item?.secondaryLabel === 'string' ? item.secondaryLabel : '',
        secondaryHref: typeof item?.secondaryHref === 'string' ? item.secondaryHref : '',
        track1Name: typeof item?.track1Name === 'string' ? item.track1Name : '',
        track1Range: typeof item?.track1Range === 'string' ? item.track1Range : '',
        track2Name: typeof item?.track2Name === 'string' ? item.track2Name : '',
        track2Range: typeof item?.track2Range === 'string' ? item.track2Range : '',
        enabled: typeof item?.enabled === 'boolean' ? item.enabled : true,
        order: typeof item?.order === 'number' ? item.order : idx + 1,
      }))
      .sort((a, b) => a.order - b.order)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
  } catch {
    return DEFAULT_HERO_SLIDES.map((s) => ({ ...s }));
  }
};
