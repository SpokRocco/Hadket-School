import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  Video,
  FileText,
  Palette,
  Globe,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentAdminUser } from '@/utils/authUtils';
import { SUBJECT_DEPARTMENTS } from '@/pages/MediaLibrary';

export type TeacherMediaType = 'video' | 'pdf' | 'canva' | 'google_site' | 'interactive';

export interface TeacherMediaItem {
  id: string;
  teacher_username: string;
  teacher_name: string;
  subject_department: string;
  grade_level: string;
  title: string;
  description: string;
  media_type: TeacherMediaType;
  media_url: string;
  created_at: string;
}

const LOCAL_TEACHER_MEDIA_KEY = 'school_teacher_media_v1';

export const SEED_TEACHER_MEDIA: TeacherMediaItem[] = [
  {
    id: 'tm-1',
    teacher_username: 'teacher',
    teacher_name: 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)',
    subject_department: 'ภาษาไทย',
    grade_level: 'ม.1 - ม.3',
    title: 'วิดีโอสรุปหลักภาษาไทย: คำเป็น-คำตาย และไตรยางศ์',
    description: 'คลิปวิดีโอประกอบการสอนและตัวอย่างการจำแนกคำ พร้อมแบบฝึกหัดท้ายบท',
    media_type: 'video',
    media_url: 'https://www.youtube.com/',
    created_at: '2026-01-05T09:00:00Z',
  },
  {
    id: 'tm-2',
    teacher_username: 'teacher',
    teacher_name: 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)',
    subject_department: 'ภาษาไทย',
    grade_level: 'ม.1 - ม.3',
    title: 'สไลด์ Canva: วรรณคดีวิจักษ์และศิลปะการประพันธ์',
    description: 'สื่อนำเสนออินโฟกราฟิกจาก Canva สำหรับทบทวนก่อนสอบกลางภาค',
    media_type: 'canva',
    media_url: 'https://www.canva.com/',
    created_at: '2026-01-06T10:30:00Z',
  },
  {
    id: 'tm-3',
    teacher_username: 'teacher',
    teacher_name: 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)',
    subject_department: 'ภาษาไทย',
    grade_level: 'ป.1 - ม.3',
    title: 'เอกสารใบงาน PDF: การอ่านคิดวิเคราะห์และเขียนสื่อสาร',
    description: 'เอกสาร PDF สำหรับดาวน์โหลดไปฝึกทำพร้อมเฉลยแนวทางการตอบ',
    media_type: 'pdf',
    media_url: 'https://drive.google.com/',
    created_at: '2026-01-07T14:00:00Z',
  },
  {
    id: 'tm-4',
    teacher_username: 'teacher_math',
    teacher_name: 'ครูสุภา รักเรียน (กลุ่มสาระฯ คณิตศาสตร์)',
    subject_department: 'คณิตศาสตร์',
    grade_level: 'ม.1 - ม.3',
    title: 'สื่อ Interactive GeoGebra: สมการเชิงเส้นตัวแปรเดียว',
    description: 'สื่ออินเทอร์แอคทีฟให้นักเรียนทดลองปรับค่าตัวแปรและดูกราฟแบบเรียลไทม์',
    media_type: 'interactive',
    media_url: 'https://www.geogebra.org/',
    created_at: '2026-01-08T09:00:00Z',
  },
];

export const getLocalTeacherMedia = (): TeacherMediaItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_TEACHER_MEDIA_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_TEACHER_MEDIA_KEY, JSON.stringify(SEED_TEACHER_MEDIA));
      return [...SEED_TEACHER_MEDIA];
    }
    return JSON.parse(raw) as TeacherMediaItem[];
  } catch {
    return [...SEED_TEACHER_MEDIA];
  }
};

export const saveLocalTeacherMedia = (items: TeacherMediaItem[]) => {
  try {
    localStorage.setItem(LOCAL_TEACHER_MEDIA_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving teacher media:', e);
  }
};

export const MEDIA_TYPE_META: Record<
  TeacherMediaType,
  { label: string; badge: string; icon: any }
> = {
  video: {
    label: 'วิดีโอการสอน (Video)',
    badge: 'bg-red-500/15 text-red-700 border-red-200',
    icon: Video,
  },
  pdf: {
    label: 'เอกสารใบงาน (PDF)',
    badge: 'bg-amber-500/15 text-amber-800 border-amber-200',
    icon: FileText,
  },
  canva: {
    label: 'สไลด์นำเสนอ (Canva)',
    badge: 'bg-purple-500/15 text-purple-700 border-purple-200',
    icon: Palette,
  },
  google_site: {
    label: 'เว็บไซต์ห้องเรียน (Google Site)',
    badge: 'bg-blue-500/15 text-blue-700 border-blue-200',
    icon: Globe,
  },
  interactive: {
    label: 'สื่ออินเทอร์แอคทีฟ / แบบทดสอบ',
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
    icon: Sparkles,
  },
};

export const TeacherPortal = () => {
  const currentUser = getCurrentAdminUser();
  const teacherUsername = currentUser?.username || 'teacher';
  const teacherDisplayName = currentUser?.display_name || 'ครูผู้สอน';
  const defaultSubject = currentUser?.subject_department || 'ภาษาไทย';

  const [allMedia, setAllMedia] = useState<TeacherMediaItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeacherMediaItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_department: defaultSubject,
    grade_level: 'ป.1 - ม.3',
    media_type: 'video' as TeacherMediaType,
    media_url: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('teacher_media_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setAllMedia(data);
        saveLocalTeacherMedia(data);
      } else {
        setAllMedia(getLocalTeacherMedia());
      }
    } catch {
      setAllMedia(getLocalTeacherMedia());
    }
  };

  // Filter strictly to the logged-in teacher (or show all if Admin is inspecting)
  const myMediaItems = allMedia.filter((item) =>
    currentUser?.role === 'admin'
      ? true
      : item.teacher_username.toLowerCase() === teacherUsername.toLowerCase()
  );

  const personalShareUrl = `${window.location.origin}/media-library?teacher=${encodeURIComponent(
    teacherUsername
  )}`;

  const handleCopyPersonalLink = () => {
    navigator.clipboard.writeText(personalShareUrl);
    setCopiedLink(true);
    toast({
      title: 'คัดลอกลิงก์คลังสื่อประจำตัวครูสำเร็จ',
      description: personalShareUrl,
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject_department: defaultSubject,
      grade_level: 'ป.1 - ม.3',
      media_type: 'video',
      media_url: '',
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: TeacherMediaItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description,
        subject_department: item.subject_department,
        grade_level: item.grade_level,
        media_type: item.media_type,
        media_url: item.media_url,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const normalizeUrl = (url: string) => {
    const t = url.trim();
    if (!t) return '';
    return t.startsWith('http://') || t.startsWith('https://') ? t : `https://${t}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeUrl(formData.media_url);

    if (editingItem) {
      const updatedItem: TeacherMediaItem = {
        ...editingItem,
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject_department: formData.subject_department,
        grade_level: formData.grade_level.trim(),
        media_type: formData.media_type,
        media_url: cleanUrl,
      };

      const nextList = allMedia.map((m) => (m.id === editingItem.id ? updatedItem : m));
      setAllMedia(nextList);
      saveLocalTeacherMedia(nextList);

      try {
        await (supabase as any)
          .from('teacher_media_items')
          .update({
            title: updatedItem.title,
            description: updatedItem.description,
            subject_department: updatedItem.subject_department,
            grade_level: updatedItem.grade_level,
            media_type: updatedItem.media_type,
            media_url: updatedItem.media_url,
          })
          .eq('id', editingItem.id);
      } catch {
        // Saved in localStorage
      }

      notifyLocalRealtimeListeners('teacher_media_items');

      toast({
        title: 'แก้ไขสื่อการสอนสำเร็จ',
        description: `อัปเดต "${updatedItem.title}" เรียบร้อยแล้ว`,
      });
      setIsDialogOpen(false);
      resetForm();
      return;
    }

    const newItem: TeacherMediaItem = {
      id: `tm-${Date.now()}`,
      teacher_username: teacherUsername,
      teacher_name: teacherDisplayName,
      subject_department: formData.subject_department,
      grade_level: formData.grade_level.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      media_type: formData.media_type,
      media_url: cleanUrl,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await (supabase as any)
        .from('teacher_media_items')
        .insert({
          teacher_username: newItem.teacher_username,
          teacher_name: newItem.teacher_name,
          subject_department: newItem.subject_department,
          grade_level: newItem.grade_level,
          title: newItem.title,
          description: newItem.description,
          media_type: newItem.media_type,
          media_url: newItem.media_url,
        })
        .select()
        .single();

      const finalItem = !error && data ? data : newItem;
      const nextList = [finalItem, ...allMedia];
      setAllMedia(nextList);
      saveLocalTeacherMedia(nextList);
    } catch {
      const nextList = [newItem, ...allMedia];
      setAllMedia(nextList);
      saveLocalTeacherMedia(nextList);
    }

    notifyLocalRealtimeListeners('teacher_media_items');

    toast({
      title: 'เพิ่มสื่อการสอนสำเร็จ',
      description: `เพิ่ม "${newItem.title}" เข้าสู่คลังสื่อประจำตัวของคุณแล้ว`,
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (item: TeacherMediaItem) => {
    if (!confirm(`ต้องการลบสื่อการสอน "${item.title}" หรือไม่?`)) return;

    const nextList = allMedia.filter((m) => m.id !== item.id);
    setAllMedia(nextList);
    saveLocalTeacherMedia(nextList);

    try {
      await (supabase as any).from('teacher_media_items').delete().eq('id', item.id);
    } catch {
      // Saved in localStorage
    }

    notifyLocalRealtimeListeners('teacher_media_items');

    toast({
      title: 'ลบสื่อการสอนเรียบร้อยแล้ว',
      description: `ลบ "${item.title}" ออกจากคลังสื่อของคุณแล้ว`,
    });
  };

  const subjectChoices = SUBJECT_DEPARTMENTS.filter((s) => s !== 'ทั้งหมด');

  return (
    <div className="p-8 space-y-8">
      {/* Teacher Personal Workspace Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-primary p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
              <UserCheck className="w-4 h-4 text-accent" />
              พื้นที่จัดการสื่อการสอนเฉพาะบุคคล (Teacher Personal Workspace)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{teacherDisplayName}</h1>
            <p className="text-white/80 text-sm max-w-2xl">
              สื่อการสอนทั้งหมดที่คุณเพิ่มในหน้านี้จะแสดงผลอยู่ในช่องทางและหมวดหมู่ของคุณโดยเฉพาะ ไม่ปะปนกับครูท่านอื่น
            </p>
          </div>

          {/* Personal Shareable Link Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[300px]">
            <p className="text-xs font-semibold text-accent mb-1.5">
              ลิงก์คลังสื่อประจำตัวของคุณ (สำหรับส่งให้นักเรียน)
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={personalShareUrl}
                readOnly
                className="h-9 text-xs font-mono bg-white/95 text-foreground border-0"
              />
              <Button
                size="sm"
                onClick={handleCopyPersonalLink}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 flex-shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar & Media Type Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            รายการสื่อการสอนของคุณ ({myMediaItems.length} รายการ)
          </h2>
          <p className="text-xs text-muted-foreground">
            รองรับลิงก์วิดีโอ YouTube, เอกสาร PDF, สไลด์ Canva, Google Sites และสื่อ Interactive
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มสื่อการสอนใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'แก้ไขสื่อการสอน' : 'เพิ่มสื่อการสอนในคลังประจำตัวครู'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ประเภทสื่อการสอน (Media Type) *</Label>
                <Select
                  value={formData.media_type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, media_type: val as TeacherMediaType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทสื่อ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">วิดีโอการสอน (YouTube / Drive Video)</SelectItem>
                    <SelectItem value="pdf">เอกสารประกอบการเรียน / ใบงาน (PDF)</SelectItem>
                    <SelectItem value="canva">สไลด์นำเสนอ / อินโฟกราฟิก (Canva)</SelectItem>
                    <SelectItem value="google_site">ห้องเรียนออนไลน์ (Google Sites)</SelectItem>
                    <SelectItem value="interactive">สื่ออินเทอร์แอคทีฟ / แบบทดสอบออนไลน์</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>กลุ่มสาระการเรียนรู้ *</Label>
                  <Select
                    value={formData.subject_department}
                    onValueChange={(val) => setFormData({ ...formData, subject_department: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกกลุ่มสาระฯ" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectChoices.map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade_level">ระดับชั้น</Label>
                  <Input
                    id="grade_level"
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    placeholder="เช่น ม.1 - ม.3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="media_title">ชื่อเรื่อง / ชื่อสื่อการสอน *</Label>
                <Input
                  id="media_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น บทเรียนออนไลน์ เรื่อง ระบบนิเวศ"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media_url">ลิงก์สื่อการสอน (URL) *</Label>
                <Input
                  id="media_url"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media_desc">คำอธิบายประกอบสื่อ</Label>
                <Textarea
                  id="media_desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเนื้อหาหรือคำชี้แจงสำหรับนักเรียน..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">{editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มสื่อการสอน'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Media Cards Grid */}
      {myMediaItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มีสื่อการสอนในคลังประจำตัวของคุณ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              คลิกปุ่ม "เพิ่มสื่อการสอนใหม่" เพื่ออัปโหลดลิงก์วิดีโอ, PDF, Canva หรือ Google Site ของคุณ
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มสื่อชิ้นแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myMediaItems.map((item) => {
            const typeMeta = MEDIA_TYPE_META[item.media_type] || MEDIA_TYPE_META.video;
            const IconComp = typeMeta.icon;

            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${typeMeta.badge}`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      {typeMeta.label}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.grade_level}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {item.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                  </p>

                  <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                    <span>กลุ่มสาระฯ: {item.subject_department}</span>
                    <span className="font-mono">@{item.teacher_username}</span>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-auto">
                    <a
                      href={item.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      เปิดลิงก์สื่อ <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => handleOpenDialog(item)}>
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

