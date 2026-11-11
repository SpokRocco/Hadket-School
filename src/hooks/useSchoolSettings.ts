import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-school.jpg';
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_NEWS_HUB_SUBSECTIONS,
  DEFAULT_WELCOME_POPUP_CONFIG,
  parseHomepageSections,
  parseNewsHubSubSections,
  parseWelcomePopupConfig,
  type HomepageSectionConfig,
  type NewsHubSubSectionConfig,
  type WelcomePopupConfig,
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

  // Homepage Ordering & Welcome Popup
  homepage_sections_order: string;
  news_hub_order: string;
  homepageSections: HomepageSectionConfig[];
  newsHubSubSections: NewsHubSubSectionConfig[];
  welcomePopup: WelcomePopupConfig;

  // Cloud & Realtime Sync
  supabase_project_ref: string;
  vercel_site_url: string;
  vercel_deploy_hook_url: string;
  github_repo_url: string;
  github_branch: string;
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
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
  newsHubSubSections: DEFAULT_NEWS_HUB_SUBSECTIONS,
  welcomePopup: {
    ...DEFAULT_WELCOME_POPUP_CONFIG,
    imageUrl: heroImage,
  },
  supabase_project_ref: 'fhfckuypfstlokashcmu',
  vercel_site_url: '',
  vercel_deploy_hook_url: '',
  github_repo_url: 'https://github.com/SpokRocco/Hadket-School',
  github_branch: 'main',
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
        welcomePopup: parsed.welcomePopup || defaultSettings.welcomePopup,
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

        const homepageSections = parseHomepageSections(settingsMap.homepage_sections_order);
        const newsHubSubSections = parseNewsHubSubSections(settingsMap.news_hub_order);
        const welcomePopup = parseWelcomePopupConfig(settingsMap, heroImage);

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
          homepageSections,
          newsHubSubSections,
          welcomePopup,
          supabase_project_ref:
            settingsMap.supabase_project_ref || defaultSettings.supabase_project_ref,
          vercel_site_url: settingsMap.vercel_site_url || defaultSettings.vercel_site_url,
          vercel_deploy_hook_url: settingsMap.vercel_deploy_hook_url || '',
          github_repo_url: settingsMap.github_repo_url || defaultSettings.github_repo_url,
          github_branch: settingsMap.github_branch || defaultSettings.github_branch,
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

    // Subscribe to Supabase Realtime postgres_changes on school_settings
    const channel = (supabase as any)
      .channel('realtime_school_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'school_settings' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    // Listen to local/cross-tab realtime broadcasts
    const handleCustomRealtime = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.table === 'school_settings' || detail.table === '*') {
        fetchSettings();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('school_settings')) {
        fetchSettings();
      }
    };

    window.addEventListener('kk-supabase-realtime', handleCustomRealtime);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('kk-supabase-realtime', handleCustomRealtime);
      window.removeEventListener('storage', handleStorage);
      if (channel && typeof (supabase as any).removeChannel === 'function') {
        (supabase as any).removeChannel(channel);
      }
    };
  }, [fetchSettings]);

  return { settings, loading, refetch: fetchSettings };
};
