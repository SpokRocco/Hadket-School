import type { CSSProperties } from 'react';

export interface GradeDataRow {
  id: string;
  level: string;
  rooms: number;
  students: number;
  boys?: number;
  girls?: number;
  order_position?: number;
  is_active?: boolean;
}

export type LevelPattern = 'kindergarten' | 'primary' | 'lower-sec' | 'upper-sec' | 'custom';

export interface CurriculumLevelItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  level_pattern: LevelPattern;
  subjects: string[];
  highlights: string[];
  image_url: string;
  image_position: string;
  image_scale: number;
  href: string;
  icon: string;
  color: string;
  sync_grade_stats: boolean;
  order_position: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumProgramItem {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  subjects: string[];
  careers: string[];
  target_level: string;
  image_url: string | null;
  image_position: string;
  image_scale: number;
  order_position: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumActivityItem {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  image_position: string;
  image_scale: number;
  order_position: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MatchedGradeStats {
  grades: GradeDataRow[];
  levelCount: number;
  totalRooms: number;
  totalStudents: number;
  totalBoys: number;
  totalGirls: number;
  summaryText: string;
}

export const CURRICULUM_LEVELS_CACHE_KEY = 'kk_school_curriculum_levels_live';
export const CURRICULUM_PROGRAMS_CACHE_KEY = 'kk_school_curriculum_programs_live';
export const CURRICULUM_ACTIVITIES_CACHE_KEY = 'kk_school_curriculum_activities_live';

/**
 * Default Hadket School educational levels matching Homepage Section 5 and Supabase `grade_data`.
 * Intentionally leaves `image_url` blank (`''`) so no hardcoded sample graphics are forced;
 * admins upload real school photos with Full Control (no file size limit).
 */
export const DEFAULT_CURRICULUM_LEVELS: CurriculumLevelItem[] = [
  {
    id: 'kindergarten',
    title: 'ระดับปฐมวัย (อนุบาล)',
    subtitle: 'เตรียมความพร้อมด้านพัฒนาการและทักษะพื้นฐาน',
    description:
      'จัดการเรียนการสอนมุ่งเน้นพัฒนาการทั้ง 4 ด้าน (ร่างกาย อารมณ์ จิตใจ สังคม และสติปัญญา) ผ่านกิจกรรมสร้างสรรค์และการเรียนรู้เชิงประสบการณ์อย่างมีความสุข เพื่อเตรียมความพร้อมสู่ระดับประถมศึกษา',
    level_pattern: 'kindergarten',
    subjects: [
      'กิจกรรมเคลื่อนไหวและจังหวะ',
      'ประสบการณ์สำคัญปฐมวัย (EF)',
      'ศิลปะสร้างสรรค์และงานประดิษฐ์',
      'คณิตศาสตร์และเกมการศึกษาปฐมวัย',
      'ทักษะภาษาไทยและการสื่อสารเบื้องต้น',
      'ปลูกฝังคุณธรรม วินัย และสุขนิสัย',
    ],
    highlights: [
      'เน้นพัฒนาการ 4 ด้านอย่างสมดุลตามช่วงวัย',
      'เรียนรู้ผ่านการเล่น (Play-Based Learning)',
      'ดูแลเอาใจใส่รายบุคคลอย่างใกล้ชิดและอบอุ่น',
    ],
    image_url: '',
    image_position: 'center center',
    image_scale: 1,
    href: '/curriculum#kindergarten',
    icon: 'Palette',
    color: 'bg-amber-500',
    sync_grade_stats: true,
    order_position: 1,
    is_active: true,
  },
  {
    id: 'primary',
    title: 'ระดับประถมศึกษา (ป.1 – ป.6)',
    subtitle: 'ปูพื้นฐานวิชาการ คุณธรรม และทักษะการเรียนรู้ตลอดชีวิต',
    description:
      'จัดการเรียนรู้ครบทั้ง 8 กลุ่มสาระการเรียนรู้ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พัฒนาสมรรถนะการอ่านออก เขียนได้ คิดคำนวณเป็น ภาษาอังกฤษเพื่อการสื่อสาร และทักษะเทคโนโลยีดิจิทัลอย่างมั่นคง',
    level_pattern: 'primary',
    subjects: [
      'ภาษาไทย',
      'คณิตศาสตร์',
      'วิทยาศาสตร์และเทคโนโลยี',
      'สังคมศึกษา ศาสนา และวัฒนธรรม',
      'สุขศึกษาและพลศึกษา',
      'ศิลปะและดนตรี',
      'การงานอาชีพ',
      'ภาษาต่างประเทศ (ภาษาอังกฤษ)',
    ],
    highlights: [
      'พัฒนาทักษะอ่านออก เขียนได้ และคิดวิเคราะห์เป็นระบบ',
      'ฝึกปฏิบัติการวิทยาศาสตร์ คอมพิวเตอร์ และเกษตรพอเพียง',
      'ปลูกฝังคุณธรรม จริยธรรม และค่านิยมอันดีงาม',
    ],
    image_url: '',
    image_position: 'center center',
    image_scale: 1,
    href: '/curriculum#primary',
    icon: 'BookOpen',
    color: 'bg-sky-600',
    sync_grade_stats: true,
    order_position: 2,
    is_active: true,
  },
  {
    id: 'lower-sec',
    title: 'ระดับมัธยมศึกษาตอนต้น (ม.1 – ม.3)',
    subtitle: 'ค้นพบศักยภาพ วิทยาศาสตร์ คอมพิวเตอร์ และงานอาชีพ',
    description:
      'มุ่งต่อยอดองค์ความรู้เชิงลึกทั้ง 8 กลุ่มสาระการเรียนรู้ เสริมสมรรถนะด้านเทคโนโลยี วิทยาการคำนวณ โครงงานวิทยาศาสตร์ และทักษะงานอาชีพ เพื่อค้นพบความถนัดและเตรียมความพร้อมสู่การศึกษาต่อ 100%',
    level_pattern: 'lower-sec',
    subjects: [
      'วิทยาศาสตร์และโครงงานนวัตกรรม',
      'คณิตศาสตร์ประยุกต์',
      'เทคโนโลยี วิทยาการคำนวณ และ AI',
      'ภาษาไทยและหลักการใช้ภาษา',
      'ภาษาอังกฤษเพื่อการสื่อสาร',
      'สังคมศึกษา หน้าที่พลเมือง และประวัติศาสตร์',
      'การงานอาชีพและทักษะวิชาชีพพื้นฐาน',
      'ศิลปะ ดนตรี และสุขศึกษา-พลศึกษา',
    ],
    highlights: [
      'เน้นโครงงานวิทยาศาสตร์ เทคโนโลยีดิจิทัล และ AI',
      'บูรณาการงานอาชีพและเศรษฐกิจพอเพียงในชีวิตจริง',
      'แนะแนวศึกษาต่อ ม.ปลาย และสายอาชีพ (อัตราศึกษาต่อ 100%)',
    ],
    image_url: '',
    image_position: 'center center',
    image_scale: 1,
    href: '/curriculum#lower-sec',
    icon: 'FlaskConical',
    color: 'bg-indigo-600',
    sync_grade_stats: true,
    order_position: 3,
    is_active: true,
  },
];

export const HADKET_DEFAULT_GRADE_OPTIONS = [
  'อนุบาล 2',
  'อนุบาล 3',
  'ประถมศึกษาปีที่ 1',
  'ประถมศึกษาปีที่ 2',
  'ประถมศึกษาปีที่ 3',
  'ประถมศึกษาปีที่ 4',
  'ประถมศึกษาปีที่ 5',
  'ประถมศึกษาปีที่ 6',
  'มัธยมศึกษาปีที่ 1',
  'มัธยมศึกษาปีที่ 2',
  'มัธยมศึกษาปีที่ 3',
];

/**
 * Normalizes direct image URLs including Google Drive shared links into directly renderable image URLs.
 * Passes through Supabase Storage URLs, data: URLs, and standard HTTPS URLs untouched.
 */
export const normalizeDirectImageUrl = (rawUrl?: string | null): string => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.includes('lh3.googleusercontent.com')
  ) {
    return trimmed;
  }

  // Convert Google Drive file sharing links:
  // - https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing
  // - https://drive.google.com/open?id=<FILE_ID>
  // - https://drive.google.com/uc?id=<FILE_ID>&export=download
  if (trimmed.includes('drive.google.com')) {
    const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = filePathMatch?.[1] || idParamMatch?.[1];
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
};

/**
 * Builds consistent framing CSS properties for focal point & zoom scale.
 */
export const getCurriculumImageStyle = (position?: string | null, scale?: number | null): CSSProperties => {
  const pos = position && position.trim() ? position : 'center center';
  const validScale = typeof scale === 'number' && !Number.isNaN(scale) ? scale : 1;
  return {
    objectPosition: pos,
    transform: validScale !== 1 ? `scale(${validScale})` : undefined,
    transformOrigin: pos,
  };
};

/**
 * Filters out legacy oversized high school mock grade rows (>100 students in ม.4-ม.6).
 */
export const filterValidSchoolGrades = (grades: GradeDataRow[]): GradeDataRow[] => {
  if (!Array.isArray(grades)) return [];
  return grades.filter((g) => {
    if (!g || !g.level) return false;
    const isLegacyHighSchool =
      /มัธยมศึกษาปีที่\s*[4-6]|ม\.\s*[4-6]/.test(g.level) && Number(g.students) > 100;
    return !isLegacyHighSchool;
  });
};

/**
 * Matches Supabase `grade_data` rows to a curriculum level and computes live totals.
 */
export const matchGradesToLevel = (
  grades: GradeDataRow[],
  levelPatternOrId: LevelPattern | string
): MatchedGradeStats => {
  const validGrades = filterValidSchoolGrades(grades).filter((g) => g.is_active !== false);

  let matched: GradeDataRow[] = [];
  if (levelPatternOrId === 'kindergarten') {
    matched = validGrades.filter((g) => g.level.includes('อนุบาล') || g.level.includes('ปฐมวัย'));
  } else if (levelPatternOrId === 'primary') {
    matched = validGrades.filter(
      (g) => g.level.includes('ประถม') || /^ป\.\s*\d/.test(g.level.trim())
    );
  } else if (levelPatternOrId === 'lower-sec') {
    matched = validGrades.filter((g) =>
      /มัธยมศึกษาปีที่\s*[1-3]|ม\.\s*[1-3]/.test(g.level)
    );
  } else if (levelPatternOrId === 'upper-sec') {
    matched = validGrades.filter((g) =>
      /มัธยมศึกษาปีที่\s*[4-6]|ม\.\s*[4-6]/.test(g.level)
    );
  } else {
    matched = [];
  }

  const totalRooms = matched.reduce((sum, r) => sum + (Number(r.rooms) || 0), 0);
  const totalStudents = matched.reduce((sum, r) => sum + (Number(r.students) || 0), 0);
  const totalBoys = matched.reduce((sum, r) => sum + (Number(r.boys) || 0), 0);
  const totalGirls = matched.reduce((sum, r) => sum + (Number(r.girls) || 0), 0);

  let summaryText = '';
  if (matched.length > 0) {
    if (levelPatternOrId === 'kindergarten') {
      summaryText = `${matched.map((r) => r.level).join(', ')} · ${totalRooms} ห้องเรียน · ${totalStudents} คน`;
    } else {
      summaryText = `${matched.length} ระดับชั้น · ${totalRooms} ห้องเรียน · ${totalStudents} คน`;
    }
  }

  return {
    grades: matched,
    levelCount: matched.length,
    totalRooms,
    totalStudents,
    totalBoys,
    totalGirls,
    summaryText,
  };
};

/**
 * Resolves the canonical link from Homepage/Cards into the exact section inside `/curriculum`.
 */
export const resolveLevelHref = (level: Pick<CurriculumLevelItem, 'id' | 'href'>): string => {
  const raw = (level.href || '').trim();
  if (!raw || raw === '/students' || raw === '/curriculum') {
    return `/curriculum#${level.id}`;
  }
  return raw;
};

/**
 * Normalizes a raw curriculum level record from Supabase or JSON backup.
 */
export const normalizeCurriculumLevel = (raw: any, index = 0): CurriculumLevelItem => {
  const rawId = typeof raw?.id === 'string' && raw.id.trim() ? raw.id.trim() : `level-${index + 1}`;
  const defaultTemplate = DEFAULT_CURRICULUM_LEVELS.find((d) => d.id === rawId);

  const rawPattern = raw?.level_pattern || raw?.levelPattern || defaultTemplate?.level_pattern || 'custom';
  const levelPattern: LevelPattern = ['kindergarten', 'primary', 'lower-sec', 'upper-sec', 'custom'].includes(
    rawPattern
  )
    ? rawPattern
    : 'custom';

  return {
    id: rawId,
    title:
      typeof raw?.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : defaultTemplate?.title || 'ระดับการศึกษา',
    subtitle:
      typeof raw?.subtitle === 'string'
        ? raw.subtitle
        : defaultTemplate?.subtitle || '',
    description:
      typeof raw?.description === 'string'
        ? raw.description
        : defaultTemplate?.description || '',
    level_pattern: levelPattern,
    subjects: Array.isArray(raw?.subjects)
      ? raw.subjects.map((s: any) => String(s).trim()).filter(Boolean)
      : defaultTemplate?.subjects || [],
    highlights: Array.isArray(raw?.highlights)
      ? raw.highlights.map((h: any) => String(h).trim()).filter(Boolean)
      : defaultTemplate?.highlights || [],
    image_url: normalizeDirectImageUrl(raw?.image_url ?? raw?.imageUrl ?? ''),
    image_position:
      typeof raw?.image_position === 'string' && raw.image_position.trim()
        ? raw.image_position
        : 'center center',
    image_scale:
      typeof raw?.image_scale === 'number' && !Number.isNaN(raw.image_scale)
        ? raw.image_scale
        : Number(raw?.image_scale) || 1,
    href: resolveLevelHref({ id: rawId, href: raw?.href }),
    icon: typeof raw?.icon === 'string' && raw.icon.trim() ? raw.icon : defaultTemplate?.icon || 'GraduationCap',
    color:
      typeof raw?.color === 'string' && raw.color.trim() ? raw.color : defaultTemplate?.color || 'bg-sky-600',
    sync_grade_stats:
      raw?.sync_grade_stats !== undefined ? Boolean(raw.sync_grade_stats) : true,
    order_position:
      typeof raw?.order_position === 'number' && !Number.isNaN(raw.order_position)
        ? raw.order_position
        : index + 1,
    is_active: raw?.is_active !== undefined ? Boolean(raw.is_active) : true,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
};

export const normalizeCurriculumProgram = (raw: any, index = 0): CurriculumProgramItem => {
  return {
    id: String(raw?.id || `program-${index + 1}`),
    title: String(raw?.title || ''),
    description: raw?.description ?? '',
    icon: typeof raw?.icon === 'string' && raw.icon.trim() ? raw.icon : 'BookOpen',
    color: typeof raw?.color === 'string' && raw.color.trim() ? raw.color : 'bg-blue-500',
    subjects: Array.isArray(raw?.subjects)
      ? raw.subjects.map((s: any) => String(s).trim()).filter(Boolean)
      : [],
    careers: Array.isArray(raw?.careers)
      ? raw.careers.map((c: any) => String(c).trim()).filter(Boolean)
      : [],
    target_level:
      typeof raw?.target_level === 'string' && raw.target_level.trim()
        ? raw.target_level.trim()
        : 'all',
    image_url: normalizeDirectImageUrl(raw?.image_url) || null,
    image_position:
      typeof raw?.image_position === 'string' && raw.image_position.trim()
        ? raw.image_position
        : 'center center',
    image_scale:
      typeof raw?.image_scale === 'number' && !Number.isNaN(raw.image_scale)
        ? raw.image_scale
        : Number(raw?.image_scale) || 1,
    order_position:
      typeof raw?.order_position === 'number' && !Number.isNaN(raw.order_position)
        ? raw.order_position
        : index + 1,
    is_active: raw?.is_active !== undefined ? Boolean(raw.is_active) : true,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
};

export const normalizeCurriculumActivity = (raw: any, index = 0): CurriculumActivityItem => {
  return {
    id: String(raw?.id || `activity-${index + 1}`),
    name: String(raw?.name || ''),
    description: raw?.description ?? '',
    icon: typeof raw?.icon === 'string' && raw.icon.trim() ? raw.icon : 'Palette',
    image_url: normalizeDirectImageUrl(raw?.image_url) || null,
    image_position:
      typeof raw?.image_position === 'string' && raw.image_position.trim()
        ? raw.image_position
        : 'center center',
    image_scale:
      typeof raw?.image_scale === 'number' && !Number.isNaN(raw.image_scale)
        ? raw.image_scale
        : Number(raw?.image_scale) || 1,
    order_position:
      typeof raw?.order_position === 'number' && !Number.isNaN(raw.order_position)
        ? raw.order_position
        : index + 1,
    is_active: raw?.is_active !== undefined ? Boolean(raw.is_active) : true,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
};

export const parseCurriculumJsonSetting = <T>(raw: unknown): T[] => {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const isLegacyHighSchoolTemplateProgram = (program: Partial<CurriculumProgramItem>): boolean => {
  const title = (program.title || '').trim();
  const desc = (program.description || '').trim();
  if (!['วิทย์-คณิต', 'ศิลป์-ภาษา', 'ศิลป์-คำนวณ', 'คอมพิวเตอร์'].includes(title)) {
    return false;
  }
  return (
    desc.includes('เตรียมความพร้อมสู่คณะแพทย์') ||
    desc.includes('ฝรั่งเศส') ||
    desc.includes('คณะบริหาร') ||
    desc.includes('AI เตรียมความพร้อมสู่โลกดิจิทัล')
  );
};
