import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/shared/AdminLayout';
import { NewsManagement } from '@/components/admin/news/NewsManagement';
import { GalleryManagement } from '@/components/admin/gallery/GalleryManagement';
import { EventsManagement } from '@/components/admin/events/EventsManagement';
import { SettingsManagement } from '@/components/admin/settings/SettingsManagement';
import { HomepageLayoutAndPopupManagement } from '@/components/admin/settings/HomepageLayoutAndPopupManagement';
import { AdministratorsManagement } from '@/components/admin/administrators/AdministratorsManagement';
import { StaffManagement } from '@/components/admin/staff/StaffManagement';
import { StudentsManagement } from '@/components/admin/students/StudentsManagement';
import { AdmissionsManagement } from '@/components/admin/admissions/AdmissionsManagement';
import { CurriculumManagement } from '@/components/admin/curriculum/CurriculumManagement';
import { ActivitiesManagement } from '@/components/admin/curriculum/ActivitiesManagement';
import { FaqManagement } from '@/components/admin/faq/FaqManagement';
import { MilestonesManagement } from '@/components/admin/about/MilestonesManagement';
import { FacilitiesManagement } from '@/components/admin/about/FacilitiesManagement';
import { MessagesManagement } from '@/components/admin/messages/MessagesManagement';
import { UsersManagement } from '@/components/admin/users/UsersManagement';
import { MediaLibraryManagement } from '@/components/admin/media/MediaLibraryManagement';
import { NewslettersManagement } from '@/components/admin/newsletters/NewslettersManagement';
import { LoginPortalsManagement } from '@/components/admin/portals/LoginPortalsManagement';
import { ExecutivePortal } from '@/components/admin/portals/ExecutivePortal';
import { TeacherPortal } from '@/components/admin/portals/TeacherPortal';
import { SaphaPlusDashboard } from '@/components/admin/saphaplus/SaphaPlusDashboard';
import { HeroSliderManagement } from '@/components/admin/hero/HeroSliderManagement';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  LayoutTemplate,
  Newspaper,
  Image,
  Calendar,
  UserCog,
  Briefcase,
  FileText,
  GraduationCap,
  Shield,
  ShieldAlert,
  MonitorPlay,
  Sparkles,
  Link2,
  BarChart3,
  FolderKanban,
  Sliders,
} from 'lucide-react';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import {
  getCurrentAdminUser,
  hasMenuPermission,
  normalizeRole,
  ROLE_INFO,
} from '@/utils/authUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const currentUser = getCurrentAdminUser();
  const normalizedRole = currentUser ? normalizeRole(currentUser.role) : 'admin';

  const [stats, setStats] = useState({
    news: 0,
    gallery: 0,
    events: 0,
    administrators: 0,
    staff: 0,
    admissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      navigate('/admin');
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const [newsRes, galleryRes, eventsRes, adminsRes, staffRes, admissionsRes] = await Promise.all([
        supabase.from('news').select('id', { count: 'exact', head: true }),
        supabase.from('gallery_albums' as any).select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('administrators').select('id', { count: 'exact', head: true }),
        supabase.from('staff').select('id', { count: 'exact', head: true }),
        supabase.from('admissions').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        news: newsRes.count || 0,
        gallery: galleryRes.count || 0,
        events: eventsRes.count || 0,
        administrators: adminsRes.count || 0,
        staff: staffRes.count || 0,
        admissions: admissionsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    return subscribeToRealtimeTables(
      'realtime_admin_dashboard',
      ['news', 'gallery_albums', 'events', 'administrators', 'staff', 'admissions'],
      fetchStats
    );
  }, [fetchStats]);

  const renderTabContent = () => {
    if (currentUser && !hasMenuPermission(currentUser, activeTab)) {
      return (
        <div className="p-8">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึงส่วนนี้ (Access Denied)</h3>
              <p className="text-muted-foreground mb-6">
                บทบาทผู้ใช้งานของคุณ ({ROLE_INFO[normalizedRole]?.label}) ไม่ได้รับอนุญาตให้เข้าถึงเมนูนี้
              </p>
              <Button onClick={() => navigate(`/admin/dashboard?tab=${ROLE_INFO[normalizedRole].defaultTab}`)}>
                กลับสู่หน้าหลักของคุณ
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
      case 'executive_view':
        return <ExecutivePortal />;

      case 'sapha_plus':
        return <SaphaPlusDashboard />;

      case 'teacher_workspace':
        return <TeacherPortal />;

      case 'login_portals':
        return <LoginPortalsManagement />;

      case 'news':
        return <NewsManagement />;

      case 'gallery':
        return <GalleryManagement />;

      case 'events':
        return <EventsManagement />;

      case 'administrators':
        return <AdministratorsManagement />;

      case 'staff':
        return <StaffManagement />;

      case 'students':
        return <StudentsManagement />;

      case 'admissions':
        return <AdmissionsManagement />;

      case 'curriculum':
        return <CurriculumManagement />;

      case 'activities':
        return <ActivitiesManagement />;

      case 'faq':
        return <FaqManagement />;

      case 'milestones':
        return <MilestonesManagement />;

      case 'facilities':
        return <FacilitiesManagement />;

      case 'messages':
        return <MessagesManagement />;

      case 'settings':
        return <SettingsManagement />;

      case 'homepage_layout':
        return <HomepageLayoutAndPopupManagement />;

      case 'hero_slider':
        return <HeroSliderManagement />;

      case 'users':
        return <UsersManagement />;

      case 'media':
        return <MediaLibraryManagement />;

      case 'newsletters':
        return <NewslettersManagement />;

      case 'dashboard': {
        // หากเป็น Executive, Teacher หรือ Sapha Plus เมื่อกดหน้าแดชบอร์ดหลัก ให้แสดงพอร์ทัลเฉพาะของบทบาทนั้นทันที
        if (normalizedRole === 'executive') return <ExecutivePortal />;
        if (normalizedRole === 'sapha_plus') return <SaphaPlusDashboard />;
        if (normalizedRole === 'teacher') return <TeacherPortal />;

        const allStats = [
          { label: 'ข่าวประชาสัมพันธ์', value: stats.news, icon: Newspaper, color: 'bg-orange-500', tab: 'news' },
          { label: 'แกลเลอรี่', value: stats.gallery, icon: Image, color: 'bg-green-500', tab: 'gallery' },
          { label: 'กิจกรรม', value: stats.events, icon: Calendar, color: 'bg-purple-500', tab: 'events' },
          { label: 'ผู้บริหาร', value: stats.administrators, icon: UserCog, color: 'bg-blue-500', tab: 'administrators' },
          { label: 'บุคลากร', value: stats.staff, icon: Briefcase, color: 'bg-teal-500', tab: 'staff' },
          { label: 'ใบสมัคร', value: stats.admissions, icon: FileText, color: 'bg-pink-500', tab: 'admissions' },
        ];

        const quickActions = [
          { label: 'จัดการผู้ใช้ & สิทธิ์ (5 Roles)', tab: 'users', icon: Shield, desc: 'เพิ่มครู เจ้าหน้าที่ และสภา' },
          { label: 'จัดการลิงก์ทางเข้า (Portals)', tab: 'login_portals', icon: Link2, desc: 'สร้าง/ยกเลิกลิงก์ล็อกอิน' },
          { label: 'ระบบสภาพลัส (Sapha Plus)', tab: 'sapha_plus', icon: Sparkles, desc: 'โครงการและลิงก์สภานักเรียน' },
          { label: 'รายงานผู้บริหาร (Executive)', tab: 'executive_view', icon: BarChart3, desc: 'ดูรายงานภาพรวมทั้งระบบ' },
          { label: 'พื้นที่สื่อการสอนครู', tab: 'teacher_workspace', icon: FolderKanban, desc: 'คลังสื่อรายบุคคลของครู' },
          { label: 'คลังสื่อรวม (Google Site)', tab: 'media', icon: MonitorPlay, desc: 'พอร์ทัล Google Site' },
          { label: 'ข่าวประชาสัมพันธ์', tab: 'news', icon: Newspaper, desc: 'เพิ่ม/แก้ไขข่าวและประกาศ' },
          { label: 'จดหมายข่าวโรงเรียน', tab: 'newsletters', icon: FileText, desc: 'ออกจดหมายข่าว A4' },
          { label: 'จัดการแกลเลอรี่', tab: 'gallery', icon: Image, desc: 'อัปโหลดรูปภาพกิจกรรม' },
          { label: 'ปฏิทินกิจกรรม', tab: 'events', icon: Calendar, desc: 'เพิ่มกิจกรรมโรงเรียน' },
          { label: 'ข้อมูลนักเรียน', tab: 'students', icon: GraduationCap, desc: 'สถิติและสภานักเรียน' },
          { label: 'จัดลำดับหน้าแรก · ป๊อปอัป', tab: 'homepage_layout', icon: LayoutTemplate, desc: 'เรียงส่วนหน้าเว็บ ป๊อปอัป & Realtime' },
          { label: 'ภาพสไลด์หัวเว็บ (Hero)', tab: 'hero_slider', icon: Sliders, desc: 'แก้ไขรูปภาพและข้อความสไลด์บนหัวเว็บ' },
          { label: 'ตั้งค่าระบบโรงเรียน', tab: 'settings', icon: Settings, desc: 'แก้ไขข้อมูลทั่วไป' },
        ].filter((item) => !currentUser || hasMenuPermission(currentUser, item.tab));

        const roleInfo = ROLE_INFO[normalizedRole] || ROLE_INFO.admin;

        return (
          <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  ยินดีต้อนรับ, {currentUser?.display_name || 'ผู้ดูแลระบบ'}
                </h1>
                <p className="text-muted-foreground">{roleInfo.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border ${roleInfo.badgeClass}`}
                >
                  บทบาท: {roleInfo.label}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {allStats.map((stat) => {
                const permitted = !currentUser || hasMenuPermission(currentUser, stat.tab);
                return (
                  <Card
                    key={stat.tab}
                    className={`transition-shadow ${
                      permitted ? 'cursor-pointer hover:shadow-lg' : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (permitted) navigate(`/admin/dashboard?tab=${stat.tab}`);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0`}
                        >
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">
                            {loading ? '-' : stat.value}
                          </p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-4">โมดูลบริหารจัดการที่คุณมีสิทธิ์เข้าถึง</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((item) => (
                    <button
                      key={item.tab}
                      onClick={() => navigate(`/admin/dashboard?tab=${item.tab}`)}
                      className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border/60 transition-all hover:-translate-y-0.5 text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-bold text-sm text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      default:
        return (
          <div className="p-8">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Settings className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">ไม่พบหน้าที่ต้องการ</h3>
                <p className="text-muted-foreground">กรุณาเลือกเมนูด้านซ้าย</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      {renderTabContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
