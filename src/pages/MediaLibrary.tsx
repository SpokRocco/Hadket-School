import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Search,
  BookOpen,
  Globe,
  Sparkles,
  User,
  GraduationCap,
  Layers,
  PlusCircle,
  Eye,
  MonitorPlay,
  Video,
  FileText,
  Palette,
  X,
} from 'lucide-react';
import {
  getLocalTeacherMedia,
  TeacherMediaItem,
  TeacherMediaType,
} from '@/components/admin/portals/TeacherPortal';

export interface MediaResource {
  id: string;
  teacher_name: string;
  teacher_photo_url: string | null;
  subject_department: string;
  title: string;
  description: string | null;
  google_site_url: string;
  grade_level: string | null;
  badge_color: string;
  views: number;
  order_position: number;
  is_active: boolean;
}

export const SUBJECT_DEPARTMENTS = [
  'ทั้งหมด',
  'ภาษาไทย',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และเทคโนโลยี',
  'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'ภาษาต่างประเทศ',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะ ดนตรี และนาฏศิลป์',
  'การงานอาชีพ',
  'ปฐมวัย / ประถมศึกษา',
  'กิจกรรมพัฒนาผู้เรียน / แนะแนว',
];

export const CARD_THEMES: Record<
  string,
  { gradient: string; badge: string; border: string; button: string }
> = {
  blue: {
    gradient: 'from-blue-600 via-indigo-600 to-blue-700',
    badge: 'bg-blue-500/15 text-blue-700 border-blue-200',
    border: 'hover:border-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  emerald: {
    gradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
    border: 'hover:border-emerald-400',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  purple: {
    gradient: 'from-purple-600 via-violet-600 to-indigo-700',
    badge: 'bg-purple-500/15 text-purple-700 border-purple-200',
    border: 'hover:border-purple-400',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    badge: 'bg-amber-500/15 text-amber-800 border-amber-200',
    border: 'hover:border-amber-400',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  rose: {
    gradient: 'from-rose-500 via-pink-600 to-purple-700',
    badge: 'bg-rose-500/15 text-rose-700 border-rose-200',
    border: 'hover:border-rose-400',
    button: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  cyan: {
    gradient: 'from-cyan-600 via-sky-600 to-blue-700',
    badge: 'bg-cyan-500/15 text-cyan-700 border-cyan-200',
    border: 'hover:border-cyan-400',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  },
};

export const DEFAULT_MEDIA_RESOURCES: MediaResource[] = [
  {
    id: 'sample-1',
    teacher_name: 'นายสมชาย ใจดี',
    teacher_photo_url: null,
    subject_department: 'ภาษาไทย',
    title: 'คลังสื่อการสอนภาษาไทยและวรรณคดีไทย',
    description: 'รวมบทเรียนออนไลน์ ใบงาน วิดีโอสอนหลักภาษาไทย และการอ่านคิดวิเคราะห์',
    google_site_url: 'https://sites.google.com/',
    grade_level: 'ม.1 - ม.6',
    badge_color: 'blue',
    views: 128,
    order_position: 1,
    is_active: true,
  },
  {
    id: 'sample-2',
    teacher_name: 'นางสาวสุภา รักเรียน',
    teacher_photo_url: null,
    subject_department: 'คณิตศาสตร์',
    title: 'ห้องเรียนคณิตศาสตร์ออนไลน์ (Math Google Site)',
    description: 'สรุปสูตรคณิตศาสตร์ แบบฝึกหัดพร้อมเฉลยละเอียด และข้อสอบติว O-NET / A-Level',
    google_site_url: 'https://sites.google.com/',
    grade_level: 'ม.1 - ม.6',
    badge_color: 'emerald',
    views: 245,
    order_position: 2,
    is_active: true,
  },
  {
    id: 'sample-3',
    teacher_name: 'นายวิทยา ฉลาดคิด',
    teacher_photo_url: null,
    subject_department: 'วิทยาศาสตร์และเทคโนโลยี',
    title: 'คลังสื่อวิทยาศาสตร์และเทคโนโลยีดิจิทัล (Sci-Tech Portal)',
    description: 'สื่อการทดลองเสมือนจริง โครงงานวิทยาศาสตร์ และการเขียนโปรแกรมเบื้องต้น',
    google_site_url: 'https://sites.google.com/',
    grade_level: 'ทุกระดับชั้น',
    badge_color: 'purple',
    views: 310,
    order_position: 3,
    is_active: true,
  },
  {
    id: 'sample-4',
    teacher_name: 'นางภาวินี สุขสม',
    teacher_photo_url: null,
    subject_department: 'ภาษาต่างประเทศ',
    title: 'English & Foreign Languages Learning Center',
    description: 'คลังคำศัพท์ บทสนทนาภาษาอังกฤษ สื่อฝึกฟัง-พูด และแบบทดสอบออนไลน์',
    google_site_url: 'https://sites.google.com/',
    grade_level: 'ม.1 - ม.6',
    badge_color: 'rose',
    views: 189,
    order_position: 4,
    is_active: true,
  },
];

const MEDIA_TYPE_BADGES: Record<
  TeacherMediaType,
  { label: string; color: string; icon: any }
> = {
  video: { label: 'วิดีโอการสอน', color: 'bg-rose-500/10 text-rose-700 border-rose-200', icon: Video },
  pdf: { label: 'เอกสาร PDF / ใบงาน', color: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: FileText },
  canva: { label: 'สไลด์ Canva', color: 'bg-purple-500/10 text-purple-700 border-purple-200', icon: Palette },
  google_site: { label: 'Google Site', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', icon: Globe },
  interactive: { label: 'สื่ออินเทอร์แอคทีฟ', color: 'bg-amber-500/10 text-amber-800 border-amber-200', icon: Sparkles },
};

const MediaLibrary = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const teacherFilter = searchParams.get('teacher');

  const [resources, setResources] = useState<MediaResource[]>([]);
  const [teacherMedia, setTeacherMedia] = useState<TeacherMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ทั้งหมด');

  useEffect(() => {
    fetchMediaResources();
  }, []);

  const fetchMediaResources = async () => {
    try {
      setLoading(true);
      const localItems = getLocalTeacherMedia();

      try {
        const { data: tmData, error: tmErr } = await (supabase as any)
          .from('teacher_media_items')
          .select('*')
          .order('created_at', { ascending: false });
        if (!tmErr && tmData && tmData.length > 0) {
          setTeacherMedia(tmData);
        } else {
          setTeacherMedia(localItems);
        }
      } catch {
        setTeacherMedia(localItems);
      }

      const { data, error } = await (supabase as any)
        .from('media_resources')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setResources(data);
      } else {
        setResources(DEFAULT_MEDIA_RESOURCES);
      }
    } catch (error) {
      console.error('Error fetching media_resources:', error);
      setResources(DEFAULT_MEDIA_RESOURCES);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogleSite = async (item: MediaResource) => {
    // Open Google Site in new tab
    window.open(item.google_site_url, '_blank', 'noopener,noreferrer');

    // Optimistically update views count
    setResources((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, views: (r.views || 0) + 1 } : r))
    );

    if (!item.id.startsWith('sample-')) {
      try {
        await (supabase as any)
          .from('media_resources')
          .update({ views: (item.views || 0) + 1 })
          .eq('id', item.id);
      } catch {
        // Ignore view increment error
      }
    }
  };

  const filteredTeacherMedia = teacherMedia.filter((item) => {
    if (teacherFilter && item.teacher_username !== teacherFilter) return false;
    const matchesSubject =
      selectedSubject === 'ทั้งหมด' || item.subject_department === selectedSubject;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.teacher_name.toLowerCase().includes(q) ||
      item.subject_department.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));
    return matchesSubject && matchesSearch;
  });

  const filteredResources = resources.filter((item) => {
    const matchesSubject =
      selectedSubject === 'ทั้งหมด' || item.subject_department === selectedSubject;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.teacher_name.toLowerCase().includes(q) ||
      item.subject_department.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-navy-light py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm mb-5 shadow-lg">
              <MonitorPlay className="w-4 h-4" />
              E-Learning & Google Sites Portal
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              คลังสื่อการสอนออนไลน์
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/85 max-w-3xl mx-auto mb-8 leading-relaxed">
              ศูนย์รวมลิงก์ห้องเรียนออนไลน์และคลังสื่อการเรียนรู้ (Google Sites) ของคณะครูทุกกลุ่มสาระฯ
              เพื่อให้นักเรียนสามารถศึกษาค้นคว้าด้วยตนเองได้ทุกที่ทุกเวลา
            </p>

            {/* Search Box & Teacher Action Button */}
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อครูผู้สอน, ชื่อวิชา, หรือชื่อสื่อการสอน..."
                  className="pl-12 h-13 text-base rounded-xl bg-card border-0 shadow-xl"
                />
              </div>
              <Link to="/admin/dashboard?tab=media">
                <Button className="h-full min-h-[48px] px-6 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2 shadow-xl w-full sm:w-auto">
                  <PlusCircle className="w-5 h-5" />
                  สำหรับครู: เพิ่มคลังสื่อ
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Subject Filter Bar & Link Panel Grid */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            {/* Subject Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mr-2 flex-shrink-0">
                <Layers className="w-4 h-4 text-primary" />
                <span>กลุ่มสาระฯ:</span>
              </div>
              {SUBJECT_DEPARTMENTS.map((subject) => {
                const isSelected = selectedSubject === subject;
                return (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>

            {/* Active Teacher Workspace Filter Banner */}
            {teacherFilter && (
              <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">
                      กำลังแสดงพื้นที่คลังสื่อการสอนประจำตัวครู (Personal Teacher Workspace)
                    </p>
                    <h3 className="font-bold text-foreground">
                      รหัสผู้สอน: @{teacherFilter} ({filteredTeacherMedia.length} รายการสื่อ)
                    </h3>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({})}
                  className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-500/10"
                >
                  <X className="w-4 h-4" />
                  ดูคลังสื่อของครูทุกคน
                </Button>
              </div>
            )}

            {/* Personal Teacher Media Items Section */}
            {filteredTeacherMedia.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-emerald-600" />
                      สื่อการสอนและใบงานออนไลน์รายวิชา
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      รวมวิดีโอการสอน เอกสาร PDF สไลด์ Canva และสื่ออินเทอร์แอคทีฟที่ครูผู้สอนอัปโหลดในพื้นที่ประจำตัว
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTeacherMedia.map((tm) => {
                    const typeInfo = MEDIA_TYPE_BADGES[tm.media_type] || MEDIA_TYPE_BADGES.video;
                    const IconComp = typeInfo.icon;
                    return (
                      <div
                        key={tm.id}
                        className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <Badge variant="outline" className={`gap-1.5 ${typeInfo.color}`}>
                              <IconComp className="w-3.5 h-3.5" />
                              {typeInfo.label}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              {tm.grade_level}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-foreground mb-1.5 line-clamp-2">
                            {tm.title}
                          </h3>
                          {tm.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {tm.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-2">
                          <div className="text-xs text-muted-foreground truncate">
                            <span className="font-semibold text-foreground">{tm.teacher_name}</span>
                          </div>
                          <a
                            href={tm.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex-shrink-0"
                          >
                            เปิดสื่อการสอน
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading / Empty / Cards Grid */}
            {loading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">กำลังโหลดคลังสื่อการสอน...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="bg-card rounded-3xl p-12 text-center border border-border max-w-xl mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  ไม่พบคลังสื่อการสอนที่ค้นหา
                </h3>
                <p className="text-muted-foreground mb-6">
                  ลองเปลี่ยนคำค้นหาหรือเลือกดูจากหมวดหมู่กลุ่มสาระการเรียนรู้อื่นๆ
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('ทั้งหมด');
                  }}
                >
                  แสดงคลังสื่อทั้งหมด
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredResources.map((item) => {
                  const theme = CARD_THEMES[item.badge_color] || CARD_THEMES.blue;
                  return (
                    <div
                      key={item.id}
                      className={`group bg-card rounded-3xl overflow-hidden border border-border/80 ${theme.border} shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col`}
                    >
                      {/* Top Gradient Panel Banner */}
                      <div
                        className={`h-28 bg-gradient-to-r ${theme.gradient} p-5 relative flex items-start justify-between`}
                      >
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
                        <span className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                          <BookOpen className="w-3.5 h-3.5" />
                          {item.subject_department}
                        </span>
                        {item.grade_level && (
                          <span className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md text-white text-xs font-medium">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {item.grade_level}
                          </span>
                        )}
                      </div>

                      {/* Teacher Avatar & Card Body */}
                      <div className="p-6 pt-0 flex-1 flex flex-col">
                        <div className="flex items-end gap-3.5 -mt-10 mb-4 relative z-10">
                          {item.teacher_photo_url ? (
                            <img
                              src={item.teacher_photo_url}
                              alt={item.teacher_name}
                              className="w-20 h-20 rounded-2xl object-cover border-4 border-card shadow-lg bg-card"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-navy-light border-4 border-card shadow-lg flex items-center justify-center text-accent font-bold text-2xl">
                              {item.teacher_name.charAt(0)}
                            </div>
                          )}
                          <div className="pb-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span>ครูผู้สอน</span>
                            </div>
                            <h4 className="font-bold text-foreground text-base truncate">
                              {item.teacher_name}
                            </h4>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3 flex-1">
                            {item.description}
                          </p>
                        )}

                        {/* Footer Link Panel Button */}
                        <div className="pt-4 border-t border-border mt-auto flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Eye className="w-4 h-4 text-primary/70" />
                            <span>เข้าเรียน {item.views || 0} ครั้ง</span>
                          </div>

                          <Button
                            onClick={() => handleOpenGoogleSite(item)}
                            className={`rounded-xl gap-2 font-semibold shadow-md ${theme.button}`}
                          >
                            <Globe className="w-4 h-4" />
                            เข้าสู่ Google Site
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Teacher Call-to-Action Banner */}
            <div className="mt-16 bg-gradient-to-r from-secondary via-secondary/80 to-secondary rounded-3xl p-8 md:p-10 border border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    คุณครูต้องการเพิ่มลิงก์คลังสื่อการสอน (Google Sites) ใช่ไหม?
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    ครูทุกคนสามารถเข้าสู่ระบบจัดการด้วยบัญชี Staff เพื่อเพิ่ม แก้ไข หรืออัปเดตลิงก์ Google Sites ของตนเองได้ทันที
                  </p>
                </div>
              </div>
              <Link to="/admin/dashboard?tab=media" className="flex-shrink-0">
                <Button size="lg" className="rounded-xl gap-2 font-semibold">
                  <PlusCircle className="w-5 h-5" />
                  จัดการคลังสื่อของครู
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MediaLibrary;

