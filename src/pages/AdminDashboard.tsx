import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/shared/AdminLayout';
import { NewsManagement } from '@/components/admin/news/NewsManagement';
import { GalleryManagement } from '@/components/admin/gallery/GalleryManagement';
import { EventsManagement } from '@/components/admin/events/EventsManagement';
import { SettingsManagement } from '@/components/admin/settings/SettingsManagement';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  getCurrentAdminUser,
  hasMenuPermission,
  ROLE_INFO,
} from '@/utils/authUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const currentUser = getCurrentAdminUser();

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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
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
  };

  const renderTabContent = () => {
    // ตรวจสอบสิทธิ์การเข้าถึงเมนู
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
                ระดับผู้ใช้งานของคุณ ({ROLE_INFO[currentUser.role]?.label || currentUser.role}) ไม่ได้รับอนุญาตให้เข้าถึงเมนูนี้
              </p>
              <Button onClick={() => navigate('/admin/dashboard')}>กลับสู่หน้าแดชบอร์ด</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
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

      case 'users':
        return <UsersManagement />;

      case 'media':
        return <MediaLibraryManagement />;

      case 'newsletters':
        return <NewslettersManagement />;

      case 'dashboard': {
        const allStats = [
          { label: 'ข่าวประชาสัมพันธ์', value: stats.news, icon: Newspaper, color: 'bg-orange-500', tab: 'news' },
          { label: 'แกลเลอรี่', value: stats.gallery, icon: Image, color: 'bg-green-500', tab: 'gallery' },
          { label: 'กิจกรรม', value: stats.events, icon: Calendar, color: 'bg-purple-500', tab: 'events' },
          { label: 'ผู้บริหาร', value: stats.administrators, icon: UserCog, color: 'bg-blue-500', tab: 'administrators' },
          { label: 'บุคลากร', value: stats.staff, icon: Briefcase, color: 'bg-teal-500', tab: 'staff' },
          { label: 'ใบสมัคร', value: stats.admissions, icon: FileText, color: 'bg-pink-500', tab: 'admissions' },
        ];

        const quickActions = [
          { label: 'คลังสื่อการสอน', tab: 'media', icon: MonitorPlay, desc: 'เพิ่มลิงก์ Google Site' },
          { label: 'ข่าวประชาสัมพันธ์', tab: 'news', icon: Newspaper, desc: 'เพิ่ม/แก้ไขข่าว' },
          { label: 'จดหมายข่าว', tab: 'newsletters', icon: FileText, desc: 'ออกจดหมายข่าวโรงเรียน' },
          { label: 'จัดการแกลเลอรี่', tab: 'gallery', icon: Image, desc: 'อัปโหลดรูปภาพ' },
          { label: 'จัดการกิจกรรม', tab: 'events', icon: Calendar, desc: 'เพิ่มกิจกรรมปฏิทิน' },
          { label: 'ข้อมูลนักเรียน', tab: 'students', icon: GraduationCap, desc: 'สถิติและสภานักเรียน' },
          { label: 'ใบสมัครเรียน', tab: 'admissions', icon: FileText, desc: 'ตรวจสอบผู้สมัคร' },
          { label: 'ตั้งค่าโรงเรียน', tab: 'settings', icon: Settings, desc: 'แก้ไขข้อมูลทั่วไป' },
          { label: 'จัดการผู้ใช้/สิทธิ์', tab: 'users', icon: Shield, desc: 'กำหนดสิทธิ์ Admin & Staff' },
        ].filter((item) => !currentUser || hasMenuPermission(currentUser, item.tab));

        const roleInfo = currentUser ? ROLE_INFO[currentUser.role] : ROLE_INFO.super_admin;

        return (
          <div className="p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  ยินดีต้อนรับ, {currentUser?.display_name || 'ผู้ดูแลระบบ'}
                </h1>
                <p className="text-muted-foreground">ภาพรวมข้อมูลและการจัดการในส่วนที่คุณรับผิดชอบ</p>
              </div>
              {roleInfo && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${roleInfo.badgeClass}`}
                  >
                    ระดับสิทธิ์: {roleInfo.label}
                  </span>
                </div>
              )}
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
                <h3 className="text-lg font-semibold mb-4">เมนูลัดที่คุณเข้าถึงได้</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((item) => (
                    <button
                      key={item.tab}
                      onClick={() => navigate(`/admin/dashboard?tab=${item.tab}`)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{item.label}</span>
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
