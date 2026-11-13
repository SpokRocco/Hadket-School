import { useState, useEffect, useCallback } from 'react';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-school.jpg';
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_NAVBAR_MENU_ITEMS,
  DEFAULT_NEWSLETTER_DISPLAY_CONFIG,
  DEFAULT_NEWS_HUB_SUBSECTIONS,
  DEFAULT_WELCOME_POPUP_CONFIG,
  DEFAULT_HERO_SLIDES,
  DEFAULT_FEATURED_HIGHLIGHT,
  mergeHomepageSectionsFromTable,
  parseHomepageSections,
  parseNavbarMenuItems,
  parseNewsletterDisplayConfig,
  parseNewsHubSubSections,
  parseWelcomePopupConfig,
  parseHeroSlides,
  parseFeaturedHighlights,
  type HomepageSectionConfig,
  type NavbarMenuItemConfig,
  type NewsletterDisplayConfig,
  type NewsHubSubSectionConfig,
  type WelcomePopupConfig,
  type HeroSlideItem,
  type FeaturedHighlightItem,
} from '@/utils/homepageLayoutUtils';

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SchoolSettings {
  // ข้อมูลทั่วไป
  school_name: string;
  school_short_name: string;
  school_logo_url: string;
  school_tagline: string;
  school_description: string;
  school_vision: string;
  school_mission: string;
  school_values: string;
  school_history: string;

  // Hero Section
  hero_badge: string;
  hero_title_1: string;
  hero_title_2: string;

  // สถิติ (Hero)
  stat_students: string;
  stat_students_label: string;
  stat_university: string;
  stat_university_label: string;
  stat_years: string;
  stat_years_label: string;

  // Section Headers
  about_title_1: string;
  about_title_2: string;
  curriculum_title_1: string;
  curriculum_title_2: string;
  curriculum_description: string;
  curriculum_study_time: string;
  curriculum_class_size: string;
  curriculum_duration: string;
  curriculum_duration_label: string;

  // About Stats
  about_stat_1: string;
  about_stat_1_label: string;
  about_stat_2: string;
  about_stat_2_label: string;
  about_stat_3: string;
  about_stat_3_label: string;
  about_stat_4: string;
  about_stat_4_label: string;

  // ข้อมูลติดต่อ
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  contact_fax: string;
  contact_hours: string;
  contact_map_url: string;
  google_maps_embed: string;

  // Social Media
  social_facebook: string;
  social_youtube: string;
  social_instagram: string;
  social_line: string;
  social_links: SocialLink[];

  // Footer Services
  footer_service_1_name: string;
  footer_service_1_url: string;
  footer_service_2_name: string;
  footer_service_2_url: string;
  footer_service_3_name: string;
  footer_service_3_url: string;
  footer_service_4_name: string;
  footer_service_4_url: string;
  academic_calendar_url: string;
  academic_year: string;

  // Homepage Ordering, Main Menu & Welcome Popup
  homepage_sections_order: string;
  news_hub_order: string;
  navbar_menu_items: string;
  newsletter_section_title: string;
  newsletter_section_subtitle: string;
  newsletter_home_limit: string;
  newsletter_home_category: string;
  newsletter_home_sort: string;
  hero_slides_json: string;
  hero_autoplay_enabled: string;
  hero_autoplay_interval: string;
  featured_highlights_json: string;
  homepageSections: HomepageSectionConfig[];
  newsHubSubSections: NewsHubSubSectionConfig[];
  navbarMenuItems: NavbarMenuItemConfig[];
  newsletterDisplay: NewsletterDisplayConfig;
  welcomePopup: WelcomePopupConfig;
  heroSlides: HeroSlideItem[];
  featuredHighlights: FeaturedHighlightItem[];

  // Quick Chat Widget (Floating LINE & Direct Inquiry)
  quick_chat_enabled: string;
  quick_chat_title: string;
  quick_chat_greeting: string;
  quick_chat_school_line: string;
  quick_chat_director_line: string;
  quick_chat_phone: string;
  quick_chat_auto_open_home: string;

  // 2 Highlight Images below Hero Slider (AboutSection Showcase)
  about_left_image_url: string;
  about_left_image_caption: string;
  about_right_image_url: string;
  about_right_image_caption: string;

  // Website Creator / Developer (Footer Credits)
  creator_name: string;
  creator_email: string;
  creator_url: string;

  // Cloud & Realtime Sync
  supabase_project_ref: string;
  vercel_site_url: string;
  vercel_deploy_hook_url: string;
  github_repo_url: string;
  github_branch: string;
  extended_tables_ready: boolean;
}

const defaultSettings: SchoolSettings = {
  school_name: 'โรงเรียนบ้านหาดเค็ด',
  school_short_name: 'บหค',
  school_logo_url: '',
  school_tagline: 'ร่วมมือ วิชาการ งานอาชีพ',
  school_description: 'มุ่งพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษา ส่งเสริมคุณธรรม น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง พร้อมก้าวทันเทคโนโลยี',
  school_vision: 'พัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐาน ส่งเสริมคุณธรรม น้อมนำหลักของเศรษฐกิจพอเพียง เคียงคู่สิ่งแวดล้อม พร้อมก้าวทันเทคโนโลยี',
  school_mission: 'พัฒนาผู้เรียนให้มีความรู้และคุณภาพตามเกณฑ์มาตรฐานการศึกษาขั้นพื้นฐาน',
  school_values: 'วิชาการดี มีวินัย ใฝ่คุณธรรม นำประชาธิปไตย',
  school_history: 'โรงเรียนบ้านหาดเค็ด ตำบลเมืองจัง อำเภอภูเพียง จังหวัดน่าน',
  hero_badge: 'เปิดรับสมัครนักเรียนใหม่ 2570',
  hero_title_1: 'ร่วมมือ วิชาการ งานอาชีพ',
  hero_title_2: 'ด้วยปัญญา',
  stat_students: '74',
  stat_students_label: 'นักเรียน',
  stat_university: '90 %',
  stat_university_label: 'อัตราการศึกษาต่อ',
  stat_years: '116',
  stat_years_label: 'ปีแห่งความเป็นเลิศ',
  about_title_1: 'สถาบันการศึกษาที่',
  about_title_2: 'ไว้วางใจ',
  curriculum_title_1: 'หลักสูตรที่',
  curriculum_title_2: 'หลากหลาย',
  curriculum_description:
    'เราออกแบบหลักสูตรและกิจกรรมพัฒนาผู้เรียนที่ตอบโจทย์ความสนใจและศักยภาพของนักเรียนทุกคน พร้อมคณะครูผู้เชี่ยวชาญ',
  curriculum_study_time: '08.30-16.30',
  curriculum_class_size: '10',
  curriculum_duration: '9 ปี',
  curriculum_duration_label: 'ระยะเวลาหลักสูตร',
  about_stat_1: '116',
  about_stat_1_label: 'ปีแห่งประสบการณ์',
  about_stat_2: '78',
  about_stat_2_label: 'นักเรียนปัจจุบัน',
  about_stat_3: '16',
  about_stat_3_label: 'บุคลากรคุณภาพ',
  about_stat_4: '1000+',
  about_stat_4_label: 'ศิษย์เก่าโรงเรียนบ้านหาดเค็ด',
  contact_address: '207 ม.1 ต.เมืองจัง อ.ภูเพียง จ.น่าน 55000',
  contact_phone: '084-949-3448',
  contact_email: 'hadketschool.official@gmail.com',
  contact_fax: '',
  contact_hours: 'จันทร์ - ศุกร์ 07:30 - 16:30 น.',
  contact_map_url: '',
  google_maps_embed: '',
  social_facebook: '',
  social_youtube: '',
  social_instagram: '',
  social_line: '',
  footer_service_1_name: 'ระบบรับสมัคร',
  footer_service_1_url: '/enrollment',
  footer_service_2_name: 'ข้อมูลนักเรียน',
  footer_service_2_url: '/students',
  footer_service_3_name: 'ปฏิทินการศึกษา',
  footer_service_3_url: '/calendar',
  footer_service_4_name: 'จดหมายข่าว',
  footer_service_4_url: '/newsletters',
  academic_calendar_url: '',
  academic_year: '2569',
  social_links: [],
  homepage_sections_order: JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS),
  news_hub_order: JSON.stringify(DEFAULT_NEWS_HUB_SUBSECTIONS),
  navbar_menu_items: JSON.stringify(DEFAULT_NAVBAR_MENU_ITEMS),
  newsletter_section_title: DEFAULT_NEWSLETTER_DISPLAY_CONFIG.title,
  newsletter_section_subtitle: DEFAULT_NEWSLETTER_DISPLAY_CONFIG.subtitle,
  newsletter_home_limit: String(DEFAULT_NEWSLETTER_DISPLAY_CONFIG.limit),
  newsletter_home_category: DEFAULT_NEWSLETTER_DISPLAY_CONFIG.category,
  newsletter_home_sort: DEFAULT_NEWSLETTER_DISPLAY_CONFIG.sortMode,
  hero_slides_json: JSON.stringify(DEFAULT_HERO_SLIDES),
  hero_autoplay_enabled: 'true',
  hero_autoplay_interval: '6000',
  featured_highlights_json: JSON.stringify([DEFAULT_FEATURED_HIGHLIGHT]),
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
  newsHubSubSections: DEFAULT_NEWS_HUB_SUBSECTIONS,
  navbarMenuItems: DEFAULT_NAVBAR_MENU_ITEMS,
  newsletterDisplay: DEFAULT_NEWSLETTER_DISPLAY_CONFIG,
  welcomePopup: {
    ...DEFAULT_WELCOME_POPUP_CONFIG,
    imageUrl: heroImage,
  },
  heroSlides: DEFAULT_HERO_SLIDES,
  featuredHighlights: [DEFAULT_FEATURED_HIGHLIGHT],
  quick_chat_enabled: 'true',
  quick_chat_title: 'แชทด่วนสอบถามข้อมูล',
  quick_chat_greeting: 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด มีข้อสงสัยหรือต้องการสอบถามข้อมูล สามารถแชทคุยกับเราได้เลยครับ',
  quick_chat_school_line: 'https://line.me/ti/p/~hadkedschool',
  quick_chat_director_line: 'https://line.me/ti/p/~director.hadked',
  quick_chat_phone: '054-710-123',
  quick_chat_auto_open_home: 'true',
  about_left_image_url: '',
  about_left_image_caption: 'บรรยากาศโรงเรียนบ้านหาดเค็ด',
  about_right_image_url: '',
  about_right_image_caption: 'กิจกรรมนักเรียนโรงเรียนบ้านหาดเค็ด',
  creator_name: '',
  creator_email: '',
  creator_url: '',
  supabase_project_ref: 'fhfckuypfstlokashcmu',
  vercel_site_url: '',
  vercel_deploy_hook_url: '',
  github_repo_url: 'https://github.com/SpokRocco/Hadket-School',
  github_branch: 'main',
  extended_tables_ready: false,
};

const CACHE_KEY = 'school_settings_cache_v3';

const getCachedSettings = (): SchoolSettings | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...defaultSettings,
        ...parsed,
        homepageSections: parseHomepageSections(parsed.homepage_sections_order),
        newsHubSubSections: parseNewsHubSubSections(parsed.news_hub_order),
        navbarMenuItems: parseNavbarMenuItems(parsed.navbar_menu_items),
        newsletterDisplay: parseNewsletterDisplayConfig(parsed),
        welcomePopup: parseWelcomePopupConfig(parsed, heroImage),
        heroSlides: parseHeroSlides(parsed.hero_slides_json),
        featuredHighlights: parseFeaturedHighlights(parsed.featured_highlights_json),
      };
    }
  } catch (error) {
    console.error('Error reading cached settings:', error);
  }
  return null;
};

const saveCacheSettings = (settings: SchoolSettings) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error caching settings:', error);
  }
};

export const useSchoolSettings = () => {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const cached = getCachedSettings();
    return cached || defaultSettings;
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('school_settings').select('key, value');

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value || '';
        });

        let parsedSocialLinks: SocialLink[] = defaultSettings.social_links;
        if (settingsMap.social_links) {
          try {
            parsedSocialLinks = JSON.parse(settingsMap.social_links);
          } catch {
            parsedSocialLinks = [];
          }
        }

        let homepageSections = parseHomepageSections(settingsMap.homepage_sections_order);
        const newsHubSubSections = parseNewsHubSubSections(settingsMap.news_hub_order);
        const navbarMenuItems = parseNavbarMenuItems(settingsMap.navbar_menu_items);
        const newsletterDisplay = parseNewsletterDisplayConfig(settingsMap);
        let welcomePopup = parseWelcomePopupConfig(settingsMap, heroImage);
        let heroSlides = parseHeroSlides(settingsMap.hero_slides_json);

        // Directly query hero_slides table for realtime full control
        try {
          const { data: slidesData, error: slidesErr } = await (supabase as any)
            .from('hero_slides')
            .select('*')
            .order('order_position', { ascending: true });

          if (!slidesErr && Array.isArray(slidesData) && slidesData.length > 0) {
            const tableSlides = slidesData.map((row: any, idx: number) => ({
              id: String(row.id || `slide-${idx + 1}`),
              title: row.title || '',
              subtitle: row.subtitle || '',
              kicker: row.kicker || '',
              subline: row.subline || '',
              image: row.image_url || row.image || '',
              primaryLabel: row.primary_label || '',
              primaryHref: row.primary_href || '',
              secondaryLabel: row.secondary_label || '',
              secondaryHref: row.secondary_href || '',
              track1Name: row.track1_name || '',
              track1Range: row.track1_range || '',
              track2Name: row.track2_name || '',
              track2Range: row.track2_range || '',
              enabled: row.is_active !== undefined ? Boolean(row.is_active) : true,
              order: row.order_position || idx + 1,
            }));

            if (tableSlides.length >= heroSlides.length) {
              heroSlides = tableSlides;
            }
          }
        } catch (sErr) {
          console.warn('Falling back to hero_slides_json:', sErr);
        }

        let featuredHighlights = parseFeaturedHighlights(settingsMap.featured_highlights_json);

        // Directly query homepage_highlights table for realtime full control
        try {
          const { data: highlightsData, error: highlightsErr } = await (supabase as any)
            .from('homepage_highlights')
            .select('*')
            .order('order_position', { ascending: true });

          if (!highlightsErr && Array.isArray(highlightsData) && highlightsData.length > 0) {
            featuredHighlights = highlightsData.map((row: any, idx: number) => ({
              id: String(row.id || `highlight-${idx + 1}`),
              badge: row.badge || DEFAULT_FEATURED_HIGHLIGHT.badge,
              titleHighlight: row.title_highlight || DEFAULT_FEATURED_HIGHLIGHT.titleHighlight,
              title: row.title || DEFAULT_FEATURED_HIGHLIGHT.title,
              description: row.description || '',
              image: row.image_url || '',
              imageCaption: row.image_caption || '',
              imagePosition: row.image_position || 'center center',
              imageScale: typeof row.image_scale === 'number' && !isNaN(row.image_scale) ? row.image_scale : 1,
              showOverlay: row.show_overlay !== undefined ? Boolean(row.show_overlay) : true,
              showCaption: row.show_caption !== undefined ? Boolean(row.show_caption) : true,
              showBadge: row.show_badge !== undefined ? Boolean(row.show_badge) : true,
              showPlayButton: row.show_play_button !== undefined ? Boolean(row.show_play_button) : false,
              playActionType: row.play_action_type || 'link',
              mediaLinkUrl: row.media_link_url || '/curriculum',
              syncCurriculum: row.sync_curriculum !== undefined ? Boolean(row.sync_curriculum) : true,
              syncActivities: row.sync_activities !== undefined ? Boolean(row.sync_activities) : true,
              syncGrades: row.sync_grades !== undefined ? Boolean(row.sync_grades) : true,
              autoCaptionFromDb: row.auto_caption_from_db !== undefined ? Boolean(row.auto_caption_from_db) : true,
              autoDescriptionFromDb: row.auto_description_from_db !== undefined ? Boolean(row.auto_description_from_db) : true,
              customTags: Array.isArray(row.custom_tags) ? row.custom_tags : DEFAULT_FEATURED_HIGHLIGHT.customTags,
              primaryLabel: row.primary_label || DEFAULT_FEATURED_HIGHLIGHT.primaryLabel,
              primaryHref: row.primary_href || DEFAULT_FEATURED_HIGHLIGHT.primaryHref,
              showPrimaryBtn: row.show_primary_btn !== undefined ? Boolean(row.show_primary_btn) : true,
              secondaryLabel: row.secondary_label || DEFAULT_FEATURED_HIGHLIGHT.secondaryLabel,
              secondaryHref: row.secondary_href || DEFAULT_FEATURED_HIGHLIGHT.secondaryHref,
              showSecondaryBtn: row.show_secondary_btn !== undefined ? Boolean(row.show_secondary_btn) : true,
              enabled: row.is_active !== undefined ? Boolean(row.is_active) : true,
              order: row.order_position || idx + 1,
            }));
          }
        } catch (hErr) {
          console.warn('Falling back to featured_highlights_json:', hErr);
        }

        // Harmonize with local storage live cache if present
        try {
          const liveRaw = localStorage.getItem('kk_school_hero_slides_live');
          if (liveRaw) {
            const liveParsed = parseHeroSlides(liveRaw);
            if (liveParsed.length >= heroSlides.length && liveParsed.length > 0) {
              heroSlides = liveParsed;
            }
          }
          const liveHighlightRaw = localStorage.getItem('kk_school_featured_highlights_live');
          if (liveHighlightRaw) {
            const liveHighlightParsed = parseFeaturedHighlights(liveHighlightRaw);
            if (liveHighlightParsed.length > 0) {
              featuredHighlights = liveHighlightParsed;
            }
          }
        } catch {
          // ignore
        }

        const extendedTablesReady = settingsMap.extended_tables_ready === 'true';

        let resolvedVercelUrl = settingsMap.vercel_site_url || defaultSettings.vercel_site_url;
        let resolvedDeployHook = settingsMap.vercel_deploy_hook_url || '';
        let resolvedGithubRepo = settingsMap.github_repo_url || defaultSettings.github_repo_url;
        let resolvedGithubBranch = settingsMap.github_branch || defaultSettings.github_branch;
        let resolvedProjectRef =
          settingsMap.supabase_project_ref || defaultSettings.supabase_project_ref;

        // Read dedicated tables as well once enabled via migration/verification
        if (extendedTablesReady) {
          try {
            const [secRes, popupRes, deployRes] = await Promise.all([
              (supabase as any)
                .from('homepage_sections')
                .select('*')
                .order('sort_order', { ascending: true }),
              (supabase as any)
                .from('site_popups')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1),
              (supabase as any)
                .from('deployment_configs')
                .select('*')
                .eq('id', 'default')
                .maybeSingle(),
            ]);

            if (!secRes.error && Array.isArray(secRes.data) && secRes.data.length > 0) {
              homepageSections = mergeHomepageSectionsFromTable(homepageSections, secRes.data);
            }

            if (!popupRes.error && Array.isArray(popupRes.data) && popupRes.data[0]) {
              const row = popupRes.data[0];
              welcomePopup = {
                ...welcomePopup,
                enabled: typeof row.enabled === 'boolean' ? row.enabled : welcomePopup.enabled,
                layout: row.layout || welcomePopup.layout,
                badge: row.badge || welcomePopup.badge,
                title: row.title || welcomePopup.title,
                subtitle: row.subtitle ?? welcomePopup.subtitle,
                description: row.description ?? welcomePopup.description,
                imageUrl: row.image_url || welcomePopup.imageUrl,
                ctaText: row.cta_text ?? welcomePopup.ctaText,
                ctaUrl: row.cta_url ?? welcomePopup.ctaUrl,
                secondaryText: row.secondary_text ?? welcomePopup.secondaryText,
                secondaryUrl: row.secondary_url ?? welcomePopup.secondaryUrl,
                frequency: row.frequency || welcomePopup.frequency,
                themeAccent: row.theme_accent || welcomePopup.themeAccent,
                startDate: row.start_date || welcomePopup.startDate,
                endDate: row.end_date || welcomePopup.endDate,
              };
            }

            if (!deployRes.error && deployRes.data) {
              resolvedProjectRef = deployRes.data.supabase_project_ref || resolvedProjectRef;
              resolvedVercelUrl = deployRes.data.vercel_site_url ?? resolvedVercelUrl;
              resolvedDeployHook = deployRes.data.vercel_deploy_hook_url ?? resolvedDeployHook;
              resolvedGithubRepo = deployRes.data.github_repo_url || resolvedGithubRepo;
              resolvedGithubBranch = deployRes.data.github_branch || resolvedGithubBranch;
            }
          } catch {
            // Silently ignore if optional tables aren't present
          }
        }

        const newSettings: SchoolSettings = {
          school_name: settingsMap.school_name || defaultSettings.school_name,
          school_short_name: settingsMap.school_short_name || defaultSettings.school_short_name,
          school_logo_url: settingsMap.school_logo_url || defaultSettings.school_logo_url,
          school_tagline: settingsMap.school_tagline || defaultSettings.school_tagline,
          school_description: settingsMap.school_description || defaultSettings.school_description,
          school_vision: settingsMap.school_vision || defaultSettings.school_vision,
          school_mission: settingsMap.school_mission || defaultSettings.school_mission,
          school_values: settingsMap.school_values || defaultSettings.school_values,
          school_history: settingsMap.school_history || defaultSettings.school_history,
          hero_badge: settingsMap.hero_badge || defaultSettings.hero_badge,
          hero_title_1: settingsMap.hero_title_1 || defaultSettings.hero_title_1,
          hero_title_2: settingsMap.hero_title_2 || defaultSettings.hero_title_2,
          stat_students: settingsMap.stat_students || defaultSettings.stat_students,
          stat_students_label: settingsMap.stat_students_label || defaultSettings.stat_students_label,
          stat_university: settingsMap.stat_university || defaultSettings.stat_university,
          stat_university_label:
            settingsMap.stat_university_label || defaultSettings.stat_university_label,
          stat_years: settingsMap.stat_years || defaultSettings.stat_years,
          stat_years_label: settingsMap.stat_years_label || defaultSettings.stat_years_label,
          about_title_1: settingsMap.about_title_1 || defaultSettings.about_title_1,
          about_title_2: settingsMap.about_title_2 || defaultSettings.about_title_2,
          curriculum_title_1: settingsMap.curriculum_title_1 || defaultSettings.curriculum_title_1,
          curriculum_title_2: settingsMap.curriculum_title_2 || defaultSettings.curriculum_title_2,
          curriculum_description:
            settingsMap.curriculum_description || defaultSettings.curriculum_description,
          curriculum_study_time:
            settingsMap.curriculum_study_time || defaultSettings.curriculum_study_time,
          curriculum_class_size:
            settingsMap.curriculum_class_size || defaultSettings.curriculum_class_size,
          curriculum_duration: settingsMap.curriculum_duration || defaultSettings.curriculum_duration,
          curriculum_duration_label:
            settingsMap.curriculum_duration_label || defaultSettings.curriculum_duration_label,
          about_stat_1: settingsMap.about_stat_1 || defaultSettings.about_stat_1,
          about_stat_1_label: settingsMap.about_stat_1_label || defaultSettings.about_stat_1_label,
          about_stat_2: settingsMap.about_stat_2 || defaultSettings.about_stat_2,
          about_stat_2_label: settingsMap.about_stat_2_label || defaultSettings.about_stat_2_label,
          about_stat_3: settingsMap.about_stat_3 || defaultSettings.about_stat_3,
          about_stat_3_label: settingsMap.about_stat_3_label || defaultSettings.about_stat_3_label,
          about_stat_4: settingsMap.about_stat_4 || defaultSettings.about_stat_4,
          about_stat_4_label: settingsMap.about_stat_4_label || defaultSettings.about_stat_4_label,
          contact_address: settingsMap.contact_address || defaultSettings.contact_address,
          contact_phone: settingsMap.contact_phone || defaultSettings.contact_phone,
          contact_email: settingsMap.contact_email || defaultSettings.contact_email,
          contact_fax: settingsMap.contact_fax || '',
          contact_hours: settingsMap.contact_hours || defaultSettings.contact_hours,
          contact_map_url: settingsMap.contact_map_url || '',
          google_maps_embed: settingsMap.google_maps_embed || '',
          social_facebook: settingsMap.social_facebook || '',
          social_youtube: settingsMap.social_youtube || '',
          social_instagram: settingsMap.social_instagram || '',
          social_line: settingsMap.social_line || '',
          footer_service_1_name:
            settingsMap.footer_service_1_name || defaultSettings.footer_service_1_name,
          footer_service_1_url:
            settingsMap.footer_service_1_url || defaultSettings.footer_service_1_url,
          footer_service_2_name:
            settingsMap.footer_service_2_name || defaultSettings.footer_service_2_name,
          footer_service_2_url:
            settingsMap.footer_service_2_url || defaultSettings.footer_service_2_url,
          footer_service_3_name:
            settingsMap.footer_service_3_name || defaultSettings.footer_service_3_name,
          footer_service_3_url:
            settingsMap.footer_service_3_url || defaultSettings.footer_service_3_url,
          footer_service_4_name:
            settingsMap.footer_service_4_name || defaultSettings.footer_service_4_name,
          footer_service_4_url:
            settingsMap.footer_service_4_url || defaultSettings.footer_service_4_url,
          academic_calendar_url:
            settingsMap.academic_calendar_url || defaultSettings.academic_calendar_url,
          academic_year: settingsMap.academic_year || defaultSettings.academic_year,
          social_links: parsedSocialLinks,
          homepage_sections_order:
            settingsMap.homepage_sections_order || defaultSettings.homepage_sections_order,
          news_hub_order: settingsMap.news_hub_order || defaultSettings.news_hub_order,
          navbar_menu_items: settingsMap.navbar_menu_items || defaultSettings.navbar_menu_items,
          newsletter_section_title: newsletterDisplay.title,
          newsletter_section_subtitle: newsletterDisplay.subtitle,
          newsletter_home_limit: String(newsletterDisplay.limit),
          newsletter_home_category: newsletterDisplay.category,
          newsletter_home_sort: newsletterDisplay.sortMode,
          hero_slides_json: settingsMap.hero_slides_json || defaultSettings.hero_slides_json,
          hero_autoplay_enabled:
            settingsMap.hero_autoplay_enabled || defaultSettings.hero_autoplay_enabled,
          hero_autoplay_interval:
            settingsMap.hero_autoplay_interval || defaultSettings.hero_autoplay_interval,
          featured_highlights_json: settingsMap.featured_highlights_json || defaultSettings.featured_highlights_json,
          quick_chat_enabled:
            settingsMap.quick_chat_enabled ?? defaultSettings.quick_chat_enabled,
          quick_chat_title:
            settingsMap.quick_chat_title || defaultSettings.quick_chat_title,
          quick_chat_greeting:
            settingsMap.quick_chat_greeting || defaultSettings.quick_chat_greeting,
          quick_chat_school_line:
            settingsMap.quick_chat_school_line || defaultSettings.quick_chat_school_line,
          quick_chat_director_line:
            settingsMap.quick_chat_director_line || defaultSettings.quick_chat_director_line,
          quick_chat_phone:
            settingsMap.quick_chat_phone || defaultSettings.quick_chat_phone,
          quick_chat_auto_open_home:
            settingsMap.quick_chat_auto_open_home || defaultSettings.quick_chat_auto_open_home,
          about_left_image_url:
            settingsMap.about_left_image_url || '',
          about_left_image_caption:
            settingsMap.about_left_image_caption || defaultSettings.about_left_image_caption,
          about_right_image_url:
            settingsMap.about_right_image_url || '',
          about_right_image_caption:
            settingsMap.about_right_image_caption || defaultSettings.about_right_image_caption,
          creator_name: settingsMap.creator_name || '',
          creator_email: settingsMap.creator_email || '',
          creator_url: settingsMap.creator_url || '',
          homepageSections,
          newsHubSubSections,
          navbarMenuItems,
          newsletterDisplay,
          welcomePopup,
          heroSlides,
          featuredHighlights,
          supabase_project_ref: resolvedProjectRef,
          vercel_site_url: resolvedVercelUrl,
          vercel_deploy_hook_url: resolvedDeployHook,
          github_repo_url: resolvedGithubRepo,
          github_branch: resolvedGithubBranch,
          extended_tables_ready: extendedTablesReady,
        };

        setSettings(newSettings);
        saveCacheSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const unsubscribeRealtime = subscribeToRealtimeTables(
      'realtime_school_settings',
      ['school_settings', 'hero_slides', 'homepage_highlights', 'homepage_sections', 'site_popups', 'deployment_configs', 'curriculum_levels', 'curriculum_programs', 'curriculum_activities', 'grade_data'],
      () => {
        fetchSettings();
      }
    );

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('school_settings') || e.key.includes('hero_slides') || e.key.includes('highlights')) {
        fetchSettings();
      }
    };

    const handleHeroSlidesUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (Array.isArray(customEvt.detail) && customEvt.detail.length > 0) {
        setSettings((prev) => ({
          ...prev,
          heroSlides: customEvt.detail,
          hero_slides_json: JSON.stringify(customEvt.detail),
        }));
      } else {
        fetchSettings();
      }
    };

    const handleHighlightsUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (Array.isArray(customEvt.detail) && customEvt.detail.length > 0) {
        setSettings((prev) => ({
          ...prev,
          featuredHighlights: customEvt.detail,
          featured_highlights_json: JSON.stringify(customEvt.detail),
        }));
      } else {
        fetchSettings();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('hero-slides-updated', handleHeroSlidesUpdated);
    window.addEventListener('homepage-highlights-updated', handleHighlightsUpdated);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hero-slides-updated', handleHeroSlidesUpdated);
      window.removeEventListener('homepage-highlights-updated', handleHighlightsUpdated);
    };
  }, [fetchSettings]);

  return { settings, loading, refetch: fetchSettings };
};
