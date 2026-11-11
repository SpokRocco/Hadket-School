import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    LayoutTemplate,
    Newspaper,
    Calendar,
    Image,
    FileText,
    Settings,
    LogOut,
    Home,
    UserCheck,
    GraduationCap,
    Briefcase,
    UserCog,
    Mail,
    BookOpen,
    Palette,
    HelpCircle,
    History,
    Building2,
    Shield,
    MonitorPlay,
    BarChart3,
    Sparkles,
    Link2,
    FolderKanban,
    Sliders,
} from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
    clearCurrentAdminUser,
    getCurrentAdminUser,
    hasMenuPermission,
    normalizeRole,
    ROLE_INFO,
} from '@/utils/authUtils';

interface AdminLayoutProps {
    children: ReactNode;
}

const menuItems = [
    { id: 'dashboard', label: 'แดชบอร์ดหลัก', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'executive_view', label: 'รายงานผู้บริหาร (Executive)', icon: BarChart3, path: '/admin/dashboard?tab=executive_view' },
    { id: 'sapha_plus', label: 'ระบบสภาพลัส (Sapha Plus)', icon: Sparkles, path: '/admin/dashboard?tab=sapha_plus' },
    { id: 'teacher_workspace', label: 'พื้นที่จัดการสื่อของครู', icon: FolderKanban, path: '/admin/dashboard?tab=teacher_workspace' },
    { id: 'media', label: 'คลังสื่อรวม (Google Site)', icon: MonitorPlay, path: '/admin/dashboard?tab=media' },
    { id: 'news', label: 'ข่าวประชาสัมพันธ์', icon: Newspaper, path: '/admin/dashboard?tab=news' },
    { id: 'newsletters', label: 'จดหมายข่าว', icon: FileText, path: '/admin/dashboard?tab=newsletters' },
    { id: 'gallery', label: 'แกลเลอรี่', icon: Image, path: '/admin/dashboard?tab=gallery' },
    { id: 'events', label: 'ปฏิทินกิจกรรม', icon: Calendar, path: '/admin/dashboard?tab=events' },
    { id: 'students', label: 'ข้อมูลนักเรียน', icon: GraduationCap, path: '/admin/dashboard?tab=students' },
    { id: 'admissions', label: 'ใบสมัครเรียน', icon: FileText, path: '/admin/dashboard?tab=admissions' },
    { id: 'staff', label: 'ครู/บุคลากร', icon: Briefcase, path: '/admin/dashboard?tab=staff' },
    { id: 'administrators', label: 'ผู้บริหาร', icon: UserCog, path: '/admin/dashboard?tab=administrators' },
    { id: 'curriculum', label: 'หลักสูตร', icon: BookOpen, path: '/admin/dashboard?tab=curriculum' },
    { id: 'activities', label: 'กิจกรรมเสริม', icon: Palette, path: '/admin/dashboard?tab=activities' },
    { id: 'milestones', label: 'ประวัติโรงเรียน', icon: History, path: '/admin/dashboard?tab=milestones' },
    { id: 'facilities', label: 'อาคารสถานที่', icon: Building2, path: '/admin/dashboard?tab=facilities' },
    { id: 'messages', label: 'กล่องข้อความ', icon: Mail, path: '/admin/dashboard?tab=messages' },
    { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', icon: HelpCircle, path: '/admin/dashboard?tab=faq' },
    { id: 'login_portals', label: 'จัดการลิงก์ทางเข้า', icon: Link2, path: '/admin/dashboard?tab=login_portals' },
    { id: 'users', label: 'จัดการผู้ใช้/สิทธิ์ (RBAC)', icon: Shield, path: '/admin/dashboard?tab=users' },
    { id: 'homepage_layout', label: 'จัดลำดับหน้าแรก & ป๊อปอัป', icon: LayoutTemplate, path: '/admin/dashboard?tab=homepage_layout' },
    { id: 'hero_slider', label: 'ภาพสไลด์หัวเว็บ', icon: Sliders, path: '/admin/dashboard?tab=hero_slider' },
    { id: 'settings', label: 'ตั้งค่าโรงเรียน', icon: Settings, path: '/admin/dashboard?tab=settings' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const navigate = useNavigate();
    const { settings } = useSchoolSettings();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'dashboard';
    const currentUser = getCurrentAdminUser();

    const visibleMenuItems = menuItems.filter((item) =>
        currentUser ? hasMenuPermission(currentUser, item.id) : true
    );

    const normalizedRole = currentUser ? normalizeRole(currentUser.role) : 'admin';
    const roleInfo = ROLE_INFO[normalizedRole] || ROLE_INFO.staff;

    const handleLogout = () => {
        clearCurrentAdminUser();
        navigate('/admin');
    };

    return (
        <div className="min-h-screen bg-secondary">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg z-40">
                <div className={`p-4 border-b border-border bg-gradient-to-r ${roleInfo.accentColor} text-white`}>
                    <Link to="/" className="flex items-center gap-3">
                        {settings.school_logo_url ? (
                            <img
                                src={settings.school_logo_url}
                                alt={settings.school_name}
                                className="w-10 h-10 rounded-xl object-contain bg-white/95 p-0.5 border border-white/30 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 flex-shrink-0">
                                <span className="text-white font-bold text-sm">{settings.school_short_name || 'บหค'}</span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="font-bold text-white text-sm truncate">{settings.school_name}</h1>
                            <p className="text-[11px] text-white/85 truncate">{roleInfo.shortLabel} Back-Office</p>
                        </div>
                    </Link>
                </div>

                <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-225px)]">
                    {visibleMenuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs text-foreground truncate">
                                {currentUser?.display_name || 'ผู้ดูแลระบบ'}
                            </p>
                            <span
                                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${roleInfo.badgeClass}`}
                            >
                                {roleInfo.shortLabel}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate('/')}>
                            <Home className="w-3.5 h-3.5 mr-1" />
                            หน้าเว็บไซต์
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleLogout} title="ออกจากระบบ">
                            <LogOut className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
};
