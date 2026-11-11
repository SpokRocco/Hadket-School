export type AdminRole = 'executive' | 'admin' | 'teacher' | 'staff' | 'sapha_plus' | 'super_admin';

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  display_name: string;
  email: string | null;
  role: AdminRole;
  permissions: string[];
  subject_department?: string | null;
  custom_link_slug?: string | null;
  google_site_url?: string | null;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
}

export interface LoginPortalLink {
  id: string;
  title: string;
  portal_key: string;
  token: string;
  target_role: AdminRole | 'all';
  description: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface AdminMenuDefinition {
  id: string;
  label: string;
  description: string;
  adminOnly?: boolean;
}

export const ALL_ADMIN_MENUS: AdminMenuDefinition[] = [
  { id: 'dashboard', label: 'แดชบอร์ดหลัก', description: 'หน้าภาพรวมตามบทบาทผู้ใช้งาน' },
  { id: 'executive_view', label: 'รายงานผู้บริหาร (Executive)', description: 'ดูสถิติและรายงานความเคลื่อนไหวทั้งระบบแบบอ่านอย่างเดียว' },
  { id: 'sapha_plus', label: 'ระบบสภาพลัส (Sapha Plus)', description: 'บริหารจัดการงานสภานักเรียน โครงการ และลิงก์ระบบย่อยสภาพลัส' },
  { id: 'teacher_workspace', label: 'พื้นที่จัดการสื่อของครู', description: 'จัดการสื่อการสอนและลิงก์ประจำตัวของครูแต่ละท่าน' },
  { id: 'media', label: 'คลังสื่อการสอนรวม (Google Site)', description: 'จัดการคลังสื่อ Google Site ของครูทุกกลุ่มสาระฯ' },
  { id: 'news', label: 'ข่าวประชาสัมพันธ์', description: 'เพิ่ม/แก้ไข/ลบ ข่าวประชาสัมพันธ์และประกาศ' },
  { id: 'newsletters', label: 'จดหมายข่าวประชาสัมพันธ์', description: 'สร้างและอัปโหลดแผ่นจดหมายข่าวของโรงเรียน' },
  { id: 'gallery', label: 'แกลเลอรี่กิจกรรม', description: 'จัดการอัลบั้มและรูปภาพกิจกรรม' },
  { id: 'events', label: 'ปฏิทินกิจกรรม', description: 'จัดการปฏิทินการศึกษาและกิจกรรม' },
  { id: 'students', label: 'ข้อมูลนักเรียน', description: 'จัดการสถิตินักเรียน สภานักเรียน และผลงาน' },
  { id: 'admissions', label: 'ใบสมัครเรียน', description: 'ตรวจสอบและอนุมัติใบสมัครเรียนออนไลน์' },
  { id: 'staff', label: 'ครู/บุคลากร', description: 'จัดการข้อมูลครูและบุคลากรสายสนับสนุน' },
  { id: 'administrators', label: 'ทำเนียบผู้บริหาร', description: 'จัดการข้อมูลผู้อำนวยการโรงเรียน' },
  { id: 'curriculum', label: 'หลักสูตรการศึกษา', description: 'จัดการแผนการเรียนและหลักสูตร' },
  { id: 'activities', label: 'กิจกรรมพัฒนาผู้เรียน', description: 'จัดการชมรมและกิจกรรมเสริมหลักสูตร' },
  { id: 'milestones', label: 'ประวัติโรงเรียน', description: 'จัดการไทม์ไลน์ประวัติโรงเรียน' },
  { id: 'facilities', label: 'อาคารสถานที่', description: 'จัดการข้อมูลสิ่งอำนวยความสะดวก' },
  { id: 'messages', label: 'กล่องข้อความติดต่อ', description: 'อ่านและจัดการข้อความติดต่อจากหน้าเว็บ' },
  { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', description: 'จัดการคำถาม-คำตอบสำหรับผู้ปกครอง' },
  { id: 'login_portals', label: 'จัดการลิงก์ทางเข้า (Portals)', description: 'สร้างและยกเลิกลิงก์เข้าสู่ระบบเฉพาะกลุ่ม', adminOnly: true },
  { id: 'users', label: 'จัดการผู้ใช้และสิทธิ์ (RBAC)', description: 'เพิ่ม/ลบ ผู้บริหาร แอดมิน ครู เจ้าหน้าที่ และสภา', adminOnly: true },
  { id: 'homepage_layout', label: 'จัดลำดับหน้าแรก & ป๊อปอัป', description: 'เรียงลำดับข้อมูลหน้าแรก ป๊อปอัปต้อนรับ และเชื่อมต่อ Realtime/Vercel/GitHub', adminOnly: true },
  { id: 'hero_slider', label: 'ภาพสไลด์หัวเว็บ (Hero Slider)', description: 'แก้ไขภาพและเนื้อหาสไลด์บนแบนเนอร์หน้าแรก', adminOnly: true },
  { id: 'settings', label: 'ตั้งค่าระบบโรงเรียน', description: 'แก้ไขชื่อโรงเรียน โลโก้ และข้อมูลติดต่อ', adminOnly: true },
];

export const normalizeRole = (role?: string): AdminRole => {
  if (!role) return 'staff';
  if (role === 'super_admin') return 'admin';
  if (['executive', 'admin', 'teacher', 'staff', 'sapha_plus'].includes(role)) {
    return role as AdminRole;
  }
  return 'staff';
};

export const ROLE_INFO: Record<
  AdminRole,
  {
    label: string;
    shortLabel: string;
    level: number;
    badgeClass: string;
    accentColor: string;
    defaultTab: string;
    description: string;
  }
> = {
  executive: {
    label: 'ผู้บริหารสถานศึกษา (Executive)',
    shortLabel: 'Executive',
    level: 5,
    badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-300',
    accentColor: 'from-amber-600 to-yellow-600',
    defaultTab: 'executive_view',
    description: 'ดูภาพรวมสถิติและรายงานความเคลื่อนไหวของครู เจ้าหน้าที่ และสภาพลัส (Read-Only)',
  },
  admin: {
    label: 'ผู้ดูแลระบบ (Admin)',
    shortLabel: 'Admin',
    level: 4,
    badgeClass: 'bg-red-500/15 text-red-700 border-red-300',
    accentColor: 'from-red-600 to-rose-600',
    defaultTab: 'users',
    description: 'จัดการผู้ใช้งาน กำหนดลำดับสิทธิ์ สร้าง/ลบลิงก์เข้าสู่ระบบ และดูแลระบบทั้งหมด',
  },
  super_admin: {
    label: 'ผู้ดูแลระบบสูงสุด (Admin)',
    shortLabel: 'Admin',
    level: 4,
    badgeClass: 'bg-red-500/15 text-red-700 border-red-300',
    accentColor: 'from-red-600 to-rose-600',
    defaultTab: 'users',
    description: 'จัดการผู้ใช้งาน กำหนดลำดับสิทธิ์ สร้าง/ลบลิงก์เข้าสู่ระบบ และดูแลระบบทั้งหมด',
  },
  teacher: {
    label: 'ครูผู้สอน (Teacher)',
    shortLabel: 'Teacher',
    level: 3,
    badgeClass: 'bg-blue-500/15 text-blue-700 border-blue-300',
    accentColor: 'from-blue-600 to-indigo-600',
    defaultTab: 'teacher_workspace',
    description: 'จัดการพื้นที่สื่อการสอนประจำตัว (วิดีโอ, PDF, Canva, Google Site) แยกตามรายบุคคล',
  },
  staff: {
    label: 'เจ้าหน้าที่ประชาสัมพันธ์ (Staff)',
    shortLabel: 'Staff',
    level: 2,
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
    accentColor: 'from-emerald-600 to-teal-600',
    defaultTab: 'dashboard',
    description: 'จัดการข่าวประชาสัมพันธ์ จดหมายข่าว กิจกรรม และจัดการลิงก์ทางเข้าข่าวสาร',
  },
  sapha_plus: {
    label: 'สภานักเรียน - สภาพลัส (Sapha Plus)',
    shortLabel: 'Sapha Plus',
    level: 3,
    badgeClass: 'bg-violet-500/15 text-violet-700 border-violet-300',
    accentColor: 'from-violet-600 via-purple-600 to-indigo-600',
    defaultTab: 'sapha_plus',
    description: 'เข้าสู่ระบบหลังบ้านสภาพลัส (Sapha Plus) บริหารโครงการ กิจกรรมสภา และลิงก์เชื่อมต่อระบบย่อย',
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  executive: ['dashboard', 'executive_view'],
  admin: ALL_ADMIN_MENUS.map((m) => m.id),
  super_admin: ALL_ADMIN_MENUS.map((m) => m.id),
  teacher: ['dashboard', 'teacher_workspace', 'media'],
  staff: ['dashboard', 'news', 'newsletters', 'gallery', 'events', 'login_portals'],
  sapha_plus: ['dashboard', 'sapha_plus', 'students'],
};

// Seed accounts in background state (NOT displayed on login page)
export const SEED_ADMIN_USERS: AdminUser[] = [
  {
    id: 'seed-executive-1',
    username: 'executive',
    password: 'exec@2026',
    display_name: 'ดร.สมศักดิ์ วิทยาการ (ผู้อำนวยการโรงเรียน)',
    email: 'director@school.ac.th',
    role: 'executive',
    permissions: DEFAULT_ROLE_PERMISSIONS.executive,
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'seed-admin-1',
    username: 'admin',
    password: 'admin123',
    display_name: 'ผู้ดูแลระบบหลัก (System Administrator)',
    email: 'admin@school.ac.th',
    role: 'admin',
    permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'seed-teacher-1',
    username: 'teacher',
    password: 'teacher123',
    display_name: 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)',
    email: 'somchai@school.ac.th',
    role: 'teacher',
    subject_department: 'ภาษาไทย',
    custom_link_slug: 'kru-somchai',
    google_site_url: 'https://sites.google.com/',
    permissions: DEFAULT_ROLE_PERMISSIONS.teacher,
    is_active: true,
    created_at: '2026-01-02T08:00:00Z',
  },
  {
    id: 'seed-teacher-2',
    username: 'teacher_math',
    password: 'teacher123',
    display_name: 'ครูสุภา รักเรียน (กลุ่มสาระฯ คณิตศาสตร์)',
    email: 'supa@school.ac.th',
    role: 'teacher',
    subject_department: 'คณิตศาสตร์',
    custom_link_slug: 'kru-supa',
    google_site_url: 'https://sites.google.com/',
    permissions: DEFAULT_ROLE_PERMISSIONS.teacher,
    is_active: true,
    created_at: '2026-01-02T08:30:00Z',
  },
  {
    id: 'seed-staff-1',
    username: 'staff',
    password: 'staff123',
    display_name: 'เจ้าหน้าที่งานประชาสัมพันธ์และสารสนเทศ',
    email: 'pr.staff@school.ac.th',
    role: 'staff',
    permissions: DEFAULT_ROLE_PERMISSIONS.staff,
    is_active: true,
    created_at: '2026-01-03T08:00:00Z',
  },
  {
    id: 'seed-sapha-1',
    username: 'saphaplus',
    password: 'sapha123',
    display_name: 'ประธานสภานักเรียน (ระบบสภาพลัส Sapha Plus)',
    email: 'saphaplus@school.ac.th',
    role: 'sapha_plus',
    permissions: DEFAULT_ROLE_PERMISSIONS.sapha_plus,
    is_active: true,
    created_at: '2026-01-04T08:00:00Z',
  },
];

export const DEFAULT_LOGIN_PORTALS: LoginPortalLink[] = [
  {
    id: 'portal-exec',
    title: 'ทางเข้าสำหรับผู้บริหาร (Executive Portal)',
    portal_key: 'exec',
    token: 'exec-access-2026',
    target_role: 'executive',
    description: 'ลิงก์เข้าสู่ระบบรายงานภาพรวมสำหรับผู้บริหารสถานศึกษา',
    is_active: true,
    created_by: 'admin',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'portal-teacher',
    title: 'ทางเข้าสำหรับคณะครูผู้สอน (Teacher Workspace)',
    portal_key: 'teacher',
    token: 'teacher-portal-2026',
    target_role: 'teacher',
    description: 'ลิงก์เข้าสู่ระบบจัดการคลังสื่อการสอนประจำตัวครู',
    is_active: true,
    created_by: 'admin',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'portal-staff',
    title: 'ทางเข้าสำหรับเจ้าหน้าที่ประชาสัมพันธ์ (Staff CMS)',
    portal_key: 'staff',
    token: 'staff-cms-2026',
    target_role: 'staff',
    description: 'ลิงก์เข้าสู่ระบบจัดการข่าวประชาสัมพันธ์และจดหมายข่าว',
    is_active: true,
    created_by: 'admin',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'portal-saphaplus',
    title: 'ทางเข้าสู่ระบบสภาพลัส (Sapha Plus Portal)',
    portal_key: 'saphaplus',
    token: 'saphaplus-official',
    target_role: 'sapha_plus',
    description: 'ลิงก์ตรงสำหรับคณะกรรมการสภานักเรียนและผู้ดูแลระบบสภาพลัส',
    is_active: true,
    created_by: 'admin',
    created_at: '2026-01-01T08:00:00Z',
  },
];

const SESSION_STORAGE_KEY = 'adminUserSession';
const LOCAL_USERS_KEY = 'school_backoffice_users_v1';
const LOCAL_PORTALS_KEY = 'school_backoffice_portals_v1';

export const getLocalUsers = (): AdminUser[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(SEED_ADMIN_USERS));
      return [...SEED_ADMIN_USERS];
    }
    const parsed = JSON.parse(raw) as AdminUser[];
    // Ensure all 5 seed roles exist if upgrading from older version
    let updated = false;
    for (const seed of SEED_ADMIN_USERS) {
      if (!parsed.some((u) => u.username.toLowerCase() === seed.username.toLowerCase())) {
        parsed.push(seed);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [...SEED_ADMIN_USERS];
  }
};

export const saveLocalUsers = (users: AdminUser[]) => {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to localStorage:', e);
  }
};

export const getLocalLoginPortals = (): LoginPortalLink[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PORTALS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PORTALS_KEY, JSON.stringify(DEFAULT_LOGIN_PORTALS));
      return [...DEFAULT_LOGIN_PORTALS];
    }
    return JSON.parse(raw) as LoginPortalLink[];
  } catch {
    return [...DEFAULT_LOGIN_PORTALS];
  }
};

export const saveLocalLoginPortals = (portals: LoginPortalLink[]) => {
  try {
    localStorage.setItem(LOCAL_PORTALS_KEY, JSON.stringify(portals));
  } catch (e) {
    console.error('Error saving portals to localStorage:', e);
  }
};

export const getCurrentAdminUser = (): AdminUser | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AdminUser;
    user.role = normalizeRole(user.role);
    return user;
  } catch {
    return null;
  }
};

export const setCurrentAdminUser = (user: AdminUser) => {
  const normalized: AdminUser = {
    ...user,
    role: normalizeRole(user.role),
  };
  sessionStorage.setItem('adminLoggedIn', 'true');
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
};

export const clearCurrentAdminUser = () => {
  sessionStorage.removeItem('adminLoggedIn');
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

export const hasMenuPermission = (user: AdminUser | null, menuId: string): boolean => {
  if (!user) return false;
  const role = normalizeRole(user.role);
  if (role === 'admin') return true;
  if (menuId === 'dashboard') return true;

  // Role-specific core tabs are always accessible for that role
  if (role === 'executive' && menuId === 'executive_view') return true;
  if (role === 'teacher' && (menuId === 'teacher_workspace' || menuId === 'media')) return true;
  if (role === 'sapha_plus' && (menuId === 'sapha_plus' || menuId === 'students')) return true;
  if (role === 'staff' && ['news', 'newsletters', 'gallery', 'events', 'login_portals'].includes(menuId)) {
    return true;
  }

  return Array.isArray(user.permissions) && user.permissions.includes(menuId);
};
