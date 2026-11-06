import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Users,
  ExternalLink,
  CheckCircle2,
  Clock,
  Rocket,
  ShieldCheck,
  FolderKanban,
  Link2,
} from 'lucide-react';
import {
  getLocalSaphaLinks,
  getLocalSaphaProjects,
  SAPHA_ICON_MAP,
  SAPHA_THEME_MAP,
  SaphaProject,
  SaphaSystemLink,
} from '@/components/admin/saphaplus/SaphaPlusDashboard';

interface CouncilMember {
  id: string;
  name: string;
  position: string;
  class: string | null;
  initial: string | null;
  image_url: string | null;
  order_position: number;
}

const DEFAULT_COUNCIL_MEMBERS: CouncilMember[] = [
  {
    id: 'sc-1',
    name: 'นายประสิทธิ์ เก่งมาก',
    position: 'ประธานสภานักเรียน',
    class: 'ม.6/1',
    initial: 'ป',
    image_url: null,
    order_position: 1,
  },
  {
    id: 'sc-2',
    name: 'นางสาวสุดา รักเรียน',
    position: 'รองประธานสภานักเรียนฝ่ายบริหาร',
    class: 'ม.6/2',
    initial: 'ส',
    image_url: null,
    order_position: 2,
  },
  {
    id: 'sc-3',
    name: 'นายวิชัย ใจดี',
    position: 'เลขานุการสภานักเรียน',
    class: 'ม.5/1',
    initial: 'ว',
    image_url: null,
    order_position: 3,
  },
  {
    id: 'sc-4',
    name: 'นางสาวกานดา พัฒนา',
    position: 'หัวหน้าฝ่ายประชาสัมพันธ์ (Sapha Plus)',
    class: 'ม.5/2',
    initial: 'ก',
    image_url: null,
    order_position: 4,
  },
];

const StudentCouncil = () => {
  const { settings } = useSchoolSettings();
  const [members, setMembers] = useState<CouncilMember[]>(DEFAULT_COUNCIL_MEMBERS);
  const [projects, setProjects] = useState<SaphaProject[]>([]);
  const [links, setLinks] = useState<SaphaSystemLink[]>([]);

  useEffect(() => {
    loadCouncilData();
  }, []);

  const loadCouncilData = async () => {
    setProjects(getLocalSaphaProjects());
    setLinks(getLocalSaphaLinks().filter((l) => l.is_active));

    try {
      const [membersRes, projRes, linkRes] = await Promise.all([
        supabase
          .from('student_council')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
        (supabase as any)
          .from('sapha_projects')
          .select('*')
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('sapha_links')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
      ]);

      if (membersRes.data && membersRes.data.length > 0) {
        setMembers(membersRes.data);
      }
      if (!projRes.error && Array.isArray(projRes.data) && projRes.data.length > 0) {
        setProjects(projRes.data);
      }
      if (!linkRes.error && Array.isArray(linkRes.data) && linkRes.data.length > 0) {
        setLinks(linkRes.data);
      }
    } catch {
      // Uses localStorage & default data fallback
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Futuristic Sapha Plus & Student Council Hero */}
        <section className="relative bg-gradient-to-br from-violet-900 via-indigo-900 to-primary py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-sm mb-6 shadow-lg">
              <Sparkles className="w-4 h-4" />
              STUDENT COUNCIL & SAPHA PLUS PORTAL
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
              สภานักเรียน & ระบบ<span className="text-amber-400">สภาพลัส</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/85 max-w-3xl mx-auto mb-10 leading-relaxed">
              ศูนย์กลางข้อมูลคณะกรรมการสภานักเรียน โครงการพัฒนาผู้เรียน และพอร์ทัลเชื่อมโยงระบบดิจิทัล
              "สภาพลัส (Sapha Plus)" ของ{settings.school_name}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a href="#sapha-plus-links">
                <Button
                  size="lg"
                  className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold rounded-xl gap-2 h-13 px-7 shadow-xl"
                >
                  <Link2 className="w-5 h-5" />
                  เข้าใช้งานระบบย่อย Sapha Plus
                </Button>
              </a>
              <Link to="/admin?portal=saphaplus">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold rounded-xl gap-2 h-13 px-7 backdrop-blur-sm"
                >
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  สำหรับกรรมการสภา: เข้าหลังบ้านสภาพลัส
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 1: Sapha Plus Smart Link Hub (พอร์ทัลรวมลิงก์ไปยังระบบอื่นๆ ที่ทันสมัย) */}
        <section id="sapha-plus-links" className="section-padding bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/15 text-violet-700 font-bold text-xs mb-3">
                <Rocket className="w-4 h-4" />
                SAPHA PLUS DIGITAL ECOSYSTEM
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                พอร์ทัลระบบบริการออนไลน์ <span className="text-violet-600">Sapha Plus</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                คลิกเลือกเข้าใช้งานระบบย่อยของสภานักเรียน เพื่อร่วมแสดงความคิดเห็น ลงคะแนนโหวต เช็คชื่อกิจกรรม และตรวจสอบข้อมูลสภา
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7 max-w-5xl mx-auto">
              {links.map((item) => {
                const IconComp = SAPHA_ICON_MAP[item.icon_name] || Rocket;
                const theme = SAPHA_THEME_MAP[item.color_theme] || SAPHA_THEME_MAP.violet;

                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card rounded-3xl overflow-hidden border border-border/80 hover:border-violet-400 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                  >
                    <div
                      className={`bg-gradient-to-r ${theme.gradient} p-6 text-white relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <IconComp className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/25 mb-1.5">
                              {item.badge_text}
                            </span>
                            <h3 className="text-xl font-bold leading-snug">{item.title}</h3>
                            {item.subtitle && (
                              <p className="text-xs text-white/80 mt-0.5">{item.subtitle}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        {item.description}
                      </p>

                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Sapha Plus Connected Module
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${theme.button}`}
                        >
                          เข้าสู่ระบบนี้
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 2: Student Council Committee Members */}
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-3">
                <Users className="w-4 h-4" />
                STUDENT COUNCIL COMMITTEE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
                คณะกรรมการ<span className="text-primary">สภานักเรียน</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                ตัวแทนนักเรียนผู้มุ่งมั่นทำงานเพื่อส่วนรวม ประสานงานระหว่างนักเรียน ครู และผู้บริหาร
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {members.map((member) => (
                <Card
                  key={member.id}
                  className="overflow-hidden border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
                >
                  <div className="h-24 bg-gradient-to-r from-primary via-indigo-800 to-violet-800 relative" />
                  <CardContent className="p-6 pt-0">
                    <div className="-mt-12 mb-4 flex justify-center relative z-10">
                      {member.image_url ? (
                        <img
                          src={member.image_url}
                          alt={member.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-card shadow-lg bg-card"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border-4 border-card shadow-lg flex items-center justify-center text-slate-950 font-extrabold text-3xl">
                          {member.initial || member.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1">{member.name}</h3>
                    <p className="text-sm font-semibold text-violet-600 mb-2">{member.position}</p>
                    {member.class && (
                      <Badge variant="secondary" className="text-xs">
                        ชั้น {member.class}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Sapha Plus Projects & Progress */}
        <section className="section-padding bg-secondary/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 font-bold text-xs mb-3">
                <FolderKanban className="w-4 h-4" />
                SAPHA PLUS PROJECTS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
                โครงการและผลการดำเนินงานของสภานักเรียน
              </h2>
              <p className="text-muted-foreground">
                ติดตามความคืบหน้าโครงการสำคัญที่ขับเคลื่อนโดยคณะกรรมการสภานักเรียน
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <Card key={proj.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {proj.status === 'completed' ? (
                        <Badge className="bg-emerald-600 text-white gap-1">
                          <CheckCircle2 className="w-3 h-3" /> เสร็จสิ้นแล้ว
                        </Badge>
                      ) : (
                        <Badge className="bg-violet-600 text-white gap-1">
                          <Clock className="w-3 h-3" /> กำลังดำเนินการ
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{proj.target_date}</span>
                    </div>

                    <h3 className="font-bold text-lg text-foreground mb-2">{proj.title}</h3>
                    <p className="text-sm text-muted-foreground mb-5 flex-1">{proj.description}</p>

                    <div className="space-y-2 pt-3 border-t border-border mt-auto">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{proj.division}</span>
                        <span className="text-violet-600">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StudentCouncil;

