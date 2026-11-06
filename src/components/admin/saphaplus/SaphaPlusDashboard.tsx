import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  Rocket,
  CheckCircle2,
  Clock,
  Users,
  Link2,
  FolderKanban,
  Vote,
  MessageSquareHeart,
  FileSpreadsheet,
  QrCode,
  Award,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentCouncilManagement } from '@/components/admin/students/StudentCouncilManagement';

export interface SaphaProject {
  id: string;
  title: string;
  description: string;
  division: string;
  status: 'planning' | 'in_progress' | 'completed';
  progress: number;
  target_date: string;
  external_url?: string;
  created_at: string;
}

export interface SaphaSystemLink {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  icon_name: string;
  color_theme: string;
  badge_text: string;
  is_active: boolean;
  order_position: number;
}

const LOCAL_SAPHA_PROJECTS_KEY = 'school_sapha_plus_projects_v1';
const LOCAL_SAPHA_LINKS_KEY = 'school_sapha_plus_links_v1';

export const SEED_SAPHA_PROJECTS: SaphaProject[] = [
  {
    id: 'sp-1',
    title: 'โครงการ Sapha Voice รับฟังความคิดเห็นและข้อเสนอแนะนักเรียน',
    description: 'เปิดช่องทางออนไลน์ให้นักเรียนทุกระดับชั้นร่วมเสนอแนะแนวทางพัฒนาโรงเรียนและสวัสดิการนักเรียน',
    division: 'ฝ่ายประชาสัมพันธ์และสารสนเทศ',
    status: 'in_progress',
    progress: 80,
    target_date: '2026-12-15',
    external_url: 'https://forms.google.com/',
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'sp-2',
    title: 'โครงการโรงเรียนสีเขียว Zero Waste & ธนาคารขยะรีไซเคิล',
    description: 'รณรงค์คัดแยกขยะในโรงเรียนและเปลี่ยนขยะรีไซเคิลเป็นแต้มสะสมแลกอุปกรณ์การเรียน',
    division: 'ฝ่ายอนุรักษ์สิ่งแวดล้อม',
    status: 'in_progress',
    progress: 65,
    target_date: '2026-11-30',
    external_url: 'https://sites.google.com/',
    created_at: '2026-01-02T08:00:00Z',
  },
  {
    id: 'sp-3',
    title: 'โครงการพี่สอนน้อง (Peer Tutoring) เตรียมความพร้อมก่อนสอบ',
    description: 'จัดกลุ่มติววิชาหลักโดยรุ่นพี่สภานักเรียนและชมรมวิชาการให้กับน้องๆ ม.ต้น',
    division: 'ฝ่ายวิชาการสภานักเรียน',
    status: 'completed',
    progress: 100,
    target_date: '2026-10-20',
    external_url: 'https://sites.google.com/',
    created_at: '2026-01-03T08:00:00Z',
  },
];

export const SEED_SAPHA_LINKS: SaphaSystemLink[] = [
  {
    id: 'sl-1',
    title: 'Sapha Voice (ระบบแจ้งเรื่องและรับฟังเสียงนักเรียน)',
    subtitle: 'Student Feedback & Suggestion System',
    description: 'ส่งข้อเสนอแนะ แจ้งปัญหาภายในโรงเรียน หรือเสนอโครงการใหม่ถึงคณะกรรมการสภานักเรียนโดยตรง',
    url: 'https://docs.google.com/forms/',
    icon_name: 'MessageSquareHeart',
    color_theme: 'violet',
    badge_text: 'เปิดรับความคิดเห็น 24 ชม.',
    is_active: true,
    order_position: 1,
  },
  {
    id: 'sl-2',
    title: 'Sapha Vote (ระบบโหวตและสำรวจประชามตินักเรียน)',
    subtitle: 'E-Voting & Student Poll Platform',
    description: 'ร่วมลงคะแนนโหวตกิจกรรมโรงเรียน เลือกตั้งสภานักเรียน และทำแบบสำรวจออนไลน์แบบโปร่งใส',
    url: 'https://docs.google.com/forms/',
    icon_name: 'Vote',
    color_theme: 'indigo',
    badge_text: 'E-Voting System',
    is_active: true,
    order_position: 2,
  },
  {
    id: 'sl-3',
    title: 'Sapha Check-In (ระบบลงทะเบียนและเช็คชื่อกิจกรรม)',
    subtitle: 'Smart Activity Check-In & QR Pass',
    description: 'ระบบลงทะเบียนเข้าร่วมกิจกรรมสภานักเรียน ตรวจสอบชั่วโมงจิตอาสา และดาวน์โหลดเกียรติบัตรออนไลน์',
    url: 'https://sites.google.com/',
    icon_name: 'QrCode',
    color_theme: 'emerald',
    badge_text: 'เช็คชื่อ & เกียรติบัตร',
    is_active: true,
    order_position: 3,
  },
  {
    id: 'sl-4',
    title: 'Sapha Docs & Budget (คลังเอกสารและรายงานงบประมาณสภา)',
    subtitle: 'Open Council Documents & Transparency',
    description: 'ศูนย์รวมเอกสารโครงการ สรุปรายงานการประชุมสภานักเรียน และรายงานการใช้จ่ายงบประมาณอย่างโปร่งใส',
    url: 'https://drive.google.com/',
    icon_name: 'FileSpreadsheet',
    color_theme: 'amber',
    badge_text: 'โปร่งใส ตรวจสอบได้',
    is_active: true,
    order_position: 4,
  },
];

export const getLocalSaphaProjects = (): SaphaProject[] => {
  try {
    const raw = localStorage.getItem(LOCAL_SAPHA_PROJECTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_SAPHA_PROJECTS_KEY, JSON.stringify(SEED_SAPHA_PROJECTS));
      return [...SEED_SAPHA_PROJECTS];
    }
    return JSON.parse(raw) as SaphaProject[];
  } catch {
    return [...SEED_SAPHA_PROJECTS];
  }
};

export const saveLocalSaphaProjects = (items: SaphaProject[]) => {
  try {
    localStorage.setItem(LOCAL_SAPHA_PROJECTS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving sapha projects:', e);
  }
};

export const getLocalSaphaLinks = (): SaphaSystemLink[] => {
  try {
    const raw = localStorage.getItem(LOCAL_SAPHA_LINKS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_SAPHA_LINKS_KEY, JSON.stringify(SEED_SAPHA_LINKS));
      return [...SEED_SAPHA_LINKS];
    }
    return JSON.parse(raw) as SaphaSystemLink[];
  } catch {
    return [...SEED_SAPHA_LINKS];
  }
};

export const saveLocalSaphaLinks = (items: SaphaSystemLink[]) => {
  try {
    localStorage.setItem(LOCAL_SAPHA_LINKS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving sapha links:', e);
  }
};

export const SAPHA_ICON_MAP: Record<string, any> = {
  MessageSquareHeart,
  Vote,
  QrCode,
  FileSpreadsheet,
  Rocket,
  Award,
  Link2,
};

export const SAPHA_THEME_MAP: Record<
  string,
  { gradient: string; badge: string; button: string }
> = {
  violet: {
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    badge: 'bg-violet-500/15 text-violet-700 border-violet-300',
    button: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
  indigo: {
    gradient: 'from-indigo-600 via-blue-600 to-cyan-700',
    badge: 'bg-indigo-500/15 text-indigo-700 border-indigo-300',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  emerald: {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    badge: 'bg-amber-500/15 text-amber-800 border-amber-300',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
};

export const SaphaPlusDashboard = () => {
  const [projects, setProjects] = useState<SaphaProject[]>([]);
  const [links, setLinks] = useState<SaphaSystemLink[]>([]);

  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SaphaProject | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    division: 'ฝ่ายกิจกรรมสภานักเรียน',
    status: 'in_progress' as SaphaProject['status'],
    progress: 50,
    target_date: new Date().toISOString().split('T')[0],
    external_url: '',
  });

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SaphaSystemLink | null>(null);
  const [linkForm, setLinkForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    url: '',
    icon_name: 'Rocket',
    color_theme: 'violet',
    badge_text: 'ระบบออนไลน์',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSaphaData();
  }, []);

  const loadSaphaData = async () => {
    setProjects(getLocalSaphaProjects());
    setLinks(getLocalSaphaLinks());

    try {
      const [projRes, linkRes] = await Promise.all([
        (supabase as any).from('sapha_projects').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('sapha_links').select('*').order('order_position', { ascending: true }),
      ]);

      if (!projRes.error && Array.isArray(projRes.data) && projRes.data.length > 0) {
        setProjects(projRes.data);
        saveLocalSaphaProjects(projRes.data);
      }
      if (!linkRes.error && Array.isArray(linkRes.data) && linkRes.data.length > 0) {
        setLinks(linkRes.data);
        saveLocalSaphaLinks(linkRes.data);
      }
    } catch {
      // Uses localStorage seed fallback
    }
  };

  // Project handlers
  const handleOpenProjectDialog = (proj?: SaphaProject) => {
    if (proj) {
      setEditingProject(proj);
      setProjectForm({
        title: proj.title,
        description: proj.description,
        division: proj.division,
        status: proj.status,
        progress: proj.progress,
        target_date: proj.target_date,
        external_url: proj.external_url || '',
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        title: '',
        description: '',
        division: 'ฝ่ายกิจกรรมสภานักเรียน',
        status: 'in_progress',
        progress: 50,
        target_date: new Date().toISOString().split('T')[0],
        external_url: '',
      });
    }
    setIsProjectDialogOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      const updated: SaphaProject = {
        ...editingProject,
        ...projectForm,
        progress: Number(projectForm.progress),
      };
      const next = projects.map((p) => (p.id === editingProject.id ? updated : p));
      setProjects(next);
      saveLocalSaphaProjects(next);

      try {
        await (supabase as any)
          .from('sapha_projects')
          .update({
            title: updated.title,
            description: updated.description,
            division: updated.division,
            status: updated.status,
            progress: updated.progress,
            target_date: updated.target_date,
            external_url: updated.external_url || null,
          })
          .eq('id', editingProject.id);
      } catch {}

      toast({ title: 'อัปเดตโครงการสภาสำเร็จ' });
    } else {
      const newProj: SaphaProject = {
        id: `sp-${Date.now()}`,
        ...projectForm,
        progress: Number(projectForm.progress),
        created_at: new Date().toISOString(),
      };
      const next = [newProj, ...projects];
      setProjects(next);
      saveLocalSaphaProjects(next);

      try {
        await (supabase as any).from('sapha_projects').insert({
          title: newProj.title,
          description: newProj.description,
          division: newProj.division,
          status: newProj.status,
          progress: newProj.progress,
          target_date: newProj.target_date,
          external_url: newProj.external_url || null,
        });
      } catch {}

      toast({ title: 'เพิ่มโครงการสภาใหม่สำเร็จ' });
    }
    setIsProjectDialogOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('ต้องการลบโครงการนี้หรือไม่?')) return;
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    saveLocalSaphaProjects(next);
    try {
      await (supabase as any).from('sapha_projects').delete().eq('id', id);
    } catch {}
    toast({ title: 'ลบโครงการเรียบร้อยแล้ว' });
  };

  // System Link handlers
  const handleOpenLinkDialog = (link?: SaphaSystemLink) => {
    if (link) {
      setEditingLink(link);
      setLinkForm({
        title: link.title,
        subtitle: link.subtitle,
        description: link.description,
        url: link.url,
        icon_name: link.icon_name || 'Rocket',
        color_theme: link.color_theme || 'violet',
        badge_text: link.badge_text || 'ระบบออนไลน์',
      });
    } else {
      setEditingLink(null);
      setLinkForm({
        title: '',
        subtitle: '',
        description: '',
        url: '',
        icon_name: 'Rocket',
        color_theme: 'violet',
        badge_text: 'ระบบออนไลน์',
      });
    }
    setIsLinkDialogOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl =
      linkForm.url.trim().startsWith('http://') || linkForm.url.trim().startsWith('https://')
        ? linkForm.url.trim()
        : `https://${linkForm.url.trim()}`;

    if (editingLink) {
      const updated: SaphaSystemLink = {
        ...editingLink,
        ...linkForm,
        url: cleanUrl,
      };
      const next = links.map((l) => (l.id === editingLink.id ? updated : l));
      setLinks(next);
      saveLocalSaphaLinks(next);

      try {
        await (supabase as any)
          .from('sapha_links')
          .update({
            title: updated.title,
            subtitle: updated.subtitle,
            description: updated.description,
            url: updated.url,
            icon_name: updated.icon_name,
            color_theme: updated.color_theme,
            badge_text: updated.badge_text,
            is_active: updated.is_active,
            order_position: updated.order_position,
          })
          .eq('id', editingLink.id);
      } catch {}

      toast({ title: 'อัปเดตลิงก์ระบบสภาพลัสสำเร็จ' });
    } else {
      const newLink: SaphaSystemLink = {
        id: `sl-${Date.now()}`,
        ...linkForm,
        url: cleanUrl,
        is_active: true,
        order_position: links.length + 1,
      };
      const next = [...links, newLink];
      setLinks(next);
      saveLocalSaphaLinks(next);

      try {
        await (supabase as any).from('sapha_links').insert({
          title: newLink.title,
          subtitle: newLink.subtitle,
          description: newLink.description,
          url: newLink.url,
          icon_name: newLink.icon_name,
          color_theme: newLink.color_theme,
          badge_text: newLink.badge_text,
          is_active: true,
          order_position: newLink.order_position,
        });
      } catch {}

      toast({ title: 'สร้างลิงก์ระบบย่อยสภาพลัสสำเร็จ' });
    }
    setIsLinkDialogOpen(false);
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('ต้องการลบลิงก์ระบบนี้หรือไม่?')) return;
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    saveLocalSaphaLinks(next);
    try {
      await (supabase as any).from('sapha_links').delete().eq('id', id);
    } catch {}
    toast({ title: 'ลบลิงก์ระบบเรียบร้อยแล้ว' });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Distinctive Sapha Plus Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold tracking-wide shadow">
              <Sparkles className="w-3.5 h-3.5" />
              SAPHA PLUS PORTAL • ระบบสภาพลัส
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              ระบบบริหารจัดการงานสภานักเรียน (Sapha Plus)
            </h1>
            <p className="text-white/85 text-sm sm:text-base max-w-2xl">
              ศูนย์กลางบริหารโครงการ กิจกรรมสภานักเรียน ทำเนียบคณะกรรมการสภา และพอร์ทัลสร้างลิงก์เชื่อมต่อระบบย่อยของสภาพลัสแบบครบวงจร
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/student-council">
              <Button className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold gap-2 rounded-xl shadow-lg">
                <ExternalLink className="w-4 h-4" />
                เปิดหน้าเว็บสภานักเรียน & Sapha Plus
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-xs text-white/75">โครงการสภาทั้งหมด</p>
            <p className="text-3xl font-bold mt-1">{projects.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-xs text-white/75">กำลังดำเนินการ</p>
            <p className="text-3xl font-bold text-amber-300 mt-1">
              {projects.filter((p) => p.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-xs text-white/75">ดำเนินการเสร็จสิ้น</p>
            <p className="text-3xl font-bold text-emerald-300 mt-1">
              {projects.filter((p) => p.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-xs text-white/75">ลิงก์ระบบย่อย Sapha Plus</p>
            <p className="text-3xl font-bold text-cyan-300 mt-1">{links.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs for Sapha Plus Modules */}
      <Tabs defaultValue="links" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto p-1.5 bg-card border rounded-2xl">
          <TabsTrigger value="links" className="py-3 rounded-xl gap-2 font-semibold">
            <Link2 className="w-4 h-4" />
            1. ลิงก์เชื่อมต่อระบบย่อย (Sapha Plus Links)
          </TabsTrigger>
          <TabsTrigger value="projects" className="py-3 rounded-xl gap-2 font-semibold">
            <FolderKanban className="w-4 h-4" />
            2. โครงการและผลการดำเนินงานสภา
          </TabsTrigger>
          <TabsTrigger value="members" className="py-3 rounded-xl gap-2 font-semibold">
            <Users className="w-4 h-4" />
            3. ทำเนียบคณะกรรมการสภานักเรียน
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Sapha Plus External System Links */}
        <TabsContent value="links" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                พอร์ทัลเชื่อมต่อระบบอื่นๆ ของสภาพลัส (Sapha Plus Smart Links)
              </h2>
              <p className="text-xs text-muted-foreground">
                สร้างและจัดการการ์ดลิงก์สำหรับเชื่อมต่อไปยังระบบโหวต, ระบบรับเรื่องร้องเรียน, ระบบเช็คชื่อกิจกรรม หรือ Google Forms/Sheets ของสภา
              </p>
            </div>

            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenLinkDialog()} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="w-4 h-4" />
                  เพิ่มลิงก์ระบบย่อยสภาพลัส
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingLink ? 'แก้ไขลิงก์ระบบย่อยสภาพลัส' : 'สร้างลิงก์เชื่อมต่อไปยังระบบอื่น (Sapha Plus Link)'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSaveLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sl_title">ชื่อระบบ / โมดูลย่อย *</Label>
                    <Input
                      id="sl_title"
                      value={linkForm.title}
                      onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                      placeholder="เช่น Sapha Voice ระบบรับฟังความคิดเห็นนักเรียน"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sl_sub">ชื่อรองภาษาอังกฤษ / หมวดหมู่ย่อย</Label>
                    <Input
                      id="sl_sub"
                      value={linkForm.subtitle}
                      onChange={(e) => setLinkForm({ ...linkForm, subtitle: e.target.value })}
                      placeholder="เช่น Student Feedback Portal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>ไอคอนระบบ</Label>
                      <Select
                        value={linkForm.icon_name}
                        onValueChange={(val) => setLinkForm({ ...linkForm, icon_name: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MessageSquareHeart">กล่องรับความคิดเห็น (Voice)</SelectItem>
                          <SelectItem value="Vote">ระบบโหวต (Vote)</SelectItem>
                          <SelectItem value="QrCode">เช็คชื่อกิจกรรม (QR Check-In)</SelectItem>
                          <SelectItem value="FileSpreadsheet">เอกสาร/งบประมาณ (Docs)</SelectItem>
                          <SelectItem value="Rocket">ระบบงานโครงการ (Rocket)</SelectItem>
                          <SelectItem value="Award">เกียรติบัตร/รางวัล (Award)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>โทนสีของการ์ด</Label>
                      <Select
                        value={linkForm.color_theme}
                        onValueChange={(val) => setLinkForm({ ...linkForm, color_theme: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="violet">ม่วงไวโอเล็ต (Sapha Violet)</SelectItem>
                          <SelectItem value="indigo">น้ำเงินคราม (Indigo Cyber)</SelectItem>
                          <SelectItem value="emerald">เขียวมรกต (Emerald Fresh)</SelectItem>
                          <SelectItem value="amber">ส้มทอง (Amber Gold)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="sl_badge">ป้ายกำกับสถานะ (Badge)</Label>
                      <Input
                        id="sl_badge"
                        value={linkForm.badge_text}
                        onChange={(e) => setLinkForm({ ...linkForm, badge_text: e.target.value })}
                        placeholder="เช่น เปิดใช้งาน 24 ชม."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sl_url">ลิงก์ระบบปลายทาง (URL) *</Label>
                      <Input
                        id="sl_url"
                        value={linkForm.url}
                        onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                        placeholder="https://..."
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sl_desc">คำอธิบายการใช้งาน</Label>
                    <Textarea
                      id="sl_desc"
                      value={linkForm.description}
                      onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                      rows={3}
                      placeholder="อธิบายการใช้งานระบบย่อยนี้..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                      บันทึกลิงก์ระบบ
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {links.map((item) => {
              const IconComp = SAPHA_ICON_MAP[item.icon_name] || Rocket;
              const theme = SAPHA_THEME_MAP[item.color_theme] || SAPHA_THEME_MAP.violet;

              return (
                <div
                  key={item.id}
                  className="bg-card rounded-3xl overflow-hidden border border-border shadow-md hover:shadow-xl transition-all flex flex-col"
                >
                  <div className={`bg-gradient-to-r ${theme.gradient} p-6 text-white flex items-start justify-between gap-4`}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                        <IconComp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/25 mb-1">
                          {item.badge_text}
                        </span>
                        <h3 className="text-lg font-bold leading-snug">{item.title}</h3>
                        {item.subtitle && (
                          <p className="text-xs text-white/80">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-5 flex-1">
                      {item.description}
                    </p>

                    <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className={`gap-1.5 rounded-xl ${theme.button}`}>
                          เข้าสู่ระบบนี้ <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>

                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => handleOpenLinkDialog(item)}>
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          แก้ไข
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteLink(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Sapha Projects */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                บริหารโครงการและกิจกรรมสภานักเรียน
              </h2>
              <p className="text-xs text-muted-foreground">
                ติดตามความคืบหน้าโครงการของสภานักเรียนที่แสดงผลทั้งบนหน้าเว็บและรายงานผู้บริหาร
              </p>
            </div>

            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenProjectDialog()} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="w-4 h-4" />
                  เพิ่มโครงการสภาใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingProject ? 'แก้ไขโครงการสภานักเรียน' : 'เพิ่มโครงการสภานักเรียนใหม่'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proj_title">ชื่อโครงการ / กิจกรรม *</Label>
                    <Input
                      id="proj_title"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      placeholder="เช่น โครงการพี่สอนน้อง"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="proj_div">ฝ่ายที่รับผิดชอบ *</Label>
                      <Input
                        id="proj_div"
                        value={projectForm.division}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, division: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>สถานะโครงการ</Label>
                      <Select
                        value={projectForm.status}
                        onValueChange={(val) =>
                          setProjectForm({
                            ...projectForm,
                            status: val as SaphaProject['status'],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">กำลังวางแผน (Planning)</SelectItem>
                          <SelectItem value="in_progress">กำลังดำเนินการ (In Progress)</SelectItem>
                          <SelectItem value="completed">ดำเนินการเสร็จสิ้น (Completed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="proj_progress">ความคืบหน้า ({projectForm.progress}%)</Label>
                      <Input
                        id="proj_progress"
                        type="number"
                        min={0}
                        max={100}
                        value={projectForm.progress}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, progress: Number(e.target.value) })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proj_date">วันที่เป้าหมาย / วันที่จัดกิจกรรม</Label>
                      <Input
                        id="proj_date"
                        type="date"
                        value={projectForm.target_date}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, target_date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proj_url">ลิงก์เอกสารโครงการ / ลิงก์ระบบที่เกี่ยวข้อง</Label>
                    <Input
                      id="proj_url"
                      value={projectForm.external_url}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, external_url: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proj_desc">รายละเอียดโครงการ</Label>
                    <Textarea
                      id="proj_desc"
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                      บันทึกโครงการ
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {projects.map((proj) => (
              <Card key={proj.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {proj.status === 'completed' ? (
                          <Badge className="bg-emerald-600 text-white gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> เสร็จสิ้นแล้ว
                          </Badge>
                        ) : proj.status === 'in_progress' ? (
                          <Badge className="bg-violet-600 text-white gap-1">
                            <Clock className="w-3.5 h-3.5" /> กำลังดำเนินการ
                          </Badge>
                        ) : (
                          <Badge variant="secondary">กำลังวางแผน</Badge>
                        )}
                        <Badge variant="outline">{proj.division}</Badge>
                        <span className="text-xs text-muted-foreground">
                          กำหนดการ: {proj.target_date}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-foreground">{proj.title}</h3>
                      <p className="text-sm text-muted-foreground">{proj.description}</p>

                      {/* Progress Bar */}
                      <div className="pt-2 max-w-md">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>ความคืบหน้าการดำเนินงาน</span>
                          <span className="text-violet-600">{proj.progress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center">
                      {proj.external_url && (
                        <a
                          href={proj.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="secondary" className="gap-1">
                            เปิดลิงก์ <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleOpenProjectDialog(proj)}>
                        <Edit className="w-4 h-4 mr-1" />
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProject(proj.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Student Council Members */}
        <TabsContent value="members">
          <Card>
            <CardContent className="p-6">
              <StudentCouncilManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

