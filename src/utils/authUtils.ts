export type AdminRole = 'super_admin' | 'admin' | 'staff';

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  role: AdminRole;
  permissions: string[];
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
}

export interface AdminMenuDefinition {
  id: string;
  label: string;
  description: string;
  adminOnly?: boolean;
}

export const ALL_ADMIN_MENUS: AdminMenuDefinition[] = [
  { id: 'dashboard', label: 'แดชบอร์ด', description: 'หน้าภาพรวมสถิติของระบบ' },
  { id: 'media', label: 'คลังสื่อการสอน (Google Site)', description: 'เพิ่ม/แก้ไขลิงก์คลังสื่อ Google Site ของครูแต่ละคน' },
  { id: 'news', label: 'ข่าวประชาสัมพันธ์', description: 'เพิ่ม/แก้ไข/ลบ ข่าวประชาสัมพันธ์' },
  { id: 'newsletters', label: 'จดหมายข่าวประชาสัมพันธ์', description: 'สร้างและอัปโหลดแผ่นจดหมายข่าวของโรงเรียน' },
  { id: 'gallery', label: 'แกลเลอรี่', description: 'จัดการอัลบั้มและรูปภาพกิจกรรม' },
  { id: 'events', label: 'ปฏิทินกิจกรรม', description: 'จัดการปฏิทินการศึกษาและกิจกรรม' },
  { id: 'students', label: 'นักเรียน', description: 'จัดการสถิตินักเรียน สภานักเรียน และผลงาน' },
  { id: 'admissions', label: 'ใบสมัครเรียน', description: 'ตรวจสอบและอนุมัติใบสมัครเรียนออนไลน์' },
  { id: 'staff', label: 'ครู/บุคลากร', description: 'จัดการข้อมูลครูและบุคลากรสายสนับสนุน' },
  { id: 'administrators', label: 'ผู้บริหาร', description: 'จัดการทำเนียบผู้บริหารโรงเรียน' },
  { id: 'curriculum', label: 'หลักสูตร', description: 'จัดการแผนการเรียนและหลักสูตร' },
  { id: 'activities', label: 'กิจกรรมเสริม', description: 'จัดการชมรมและกิจกรรมพัฒนาผู้เรียน' },
  { id: 'milestones', label: 'ประวัติโรงเรียน', description: 'จัดการไทม์ไลน์ประวัติโรงเรียน' },
  { id: 'facilities', label: 'สิ่งอำนวยความสะดวก', description: 'จัดการข้อมูลอาคารสถานที่' },
  { id: 'messages', label: 'กล่องข้อความ', description: 'อ่านและจัดการข้อความติดต่อจากหน้าเว็บ' },
  { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', description: 'จัดการคำถาม-คำตอบสำหรับผู้ปกครอง' },
  { id: 'settings', label: 'ตั้งค่าโรงเรียน', description: 'แก้ไขชื่อโรงเรียน โลโก้ และข้อมูลติดต่อ', adminOnly: true },
  { id: 'users', label: 'จัดการผู้ใช้และสิทธิ์', description: 'เพิ่ม/ลบ Admin & Staff และกำหนดสิทธิ์เข้าถึงเมนู', adminOnly: true },
];

export const ROLE_INFO: Record<AdminRole, { label: string; level: number; badgeClass: string; description: string }> = {
  super_admin: {
    label: 'Super Admin (Level 3)',
    level: 3,
    badgeClass: 'bg-red-500/15 text-red-600 border-red-200',
    description: 'เข้าถึงและจัดการได้ทุกเมนู รวมถึงการจัดการผู้ใช้และตั้งค่าระบบ',
  },
  admin: {
    label: 'Admin (Level 2)',
    level: 2,
    badgeClass: 'bg-blue-500/15 text-blue-600 border-blue-200',
    description: 'ผู้ดูแลระบบระดับจัดการข้อมูลทั้งหมดของโรงเรียน',
  },
  staff: {
    label: 'Staff (Level 1)',
    level: 1,
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-200',
    description: 'เจ้าหน้าที่/ครู จัดการเฉพาะเมนูที่ได้รับมอบหมาย',
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ALL_ADMIN_MENUS.map((m) => m.id),
  admin: ALL_ADMIN_MENUS.filter((m) => m.id !== 'users').map((m) => m.id),
  staff: ['dashboard', 'media', 'news', 'newsletters', 'gallery', 'events', 'students', 'admissions'],
};

const STORAGE_KEY = 'adminUserSession';

export const getCurrentAdminUser = (): AdminUser | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
};

export const setCurrentAdminUser = (user: AdminUser) => {
  sessionStorage.setItem('adminLoggedIn', 'true');
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearCurrentAdminUser = () => {
  sessionStorage.removeItem('adminLoggedIn');
  sessionStorage.removeItem(STORAGE_KEY);
};

export const hasMenuPermission = (user: AdminUser | null, menuId: string): boolean => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (menuId === 'dashboard') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(menuId);
};

