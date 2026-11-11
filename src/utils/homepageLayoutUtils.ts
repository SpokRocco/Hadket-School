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
    id: 'curriculum',
    label: '4. หลักสูตรที่เปิดสอนและกิจกรรมพัฒนาผู้เรียน (Curriculum)',
    subtitle: 'ระดับชั้นที่เปิดสอน หลักสูตร แผนการเรียน และกิจกรรมเสริมหลักสูตร',
    enabled: true,
    order: 4,
  },
  {
    id: 'administrators',
    label: '5. ทำเนียบผู้บริหารและสารจากผู้อำนวยการ (Executive Message)',
    subtitle: 'ข้อมูลผู้บริหารสถานศึกษา วิสัยทัศน์ และแนวทางการบริหารงาน',
    enabled: true,
    order: 5,
  },
  {
    id: 'media',
    label: '6. คลังสื่อการสอนออนไลน์ & Google Sites (E-Learning Portal)',
    subtitle: 'สื่อการสอนดิจิทัล วิดีโอ เอกสาร PDF และพอร์ทัล Google Sites ของครู',
    enabled: true,
    order: 6,
  },
  {
    id: 'newsletter',
    label: '7. วารสารและจดหมายข่าวโรงเรียน (School Newsletters)',
    subtitle: 'แผ่นจดหมายข่าวประชาสัมพันธ์รายเดือนและเอกสารดาวน์โหลด',
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

// Default disabled until Admin enables & saves Welcome Popup in Settings
export const DEFAULT_WELCOME_POPUP_CONFIG: WelcomePopupConfig = {
  enabled: false,
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
  frequency: 'once_per_day',
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
