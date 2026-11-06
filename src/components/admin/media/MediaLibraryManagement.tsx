import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
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
  ExternalLink,
  Globe,
  MonitorPlay,
  User,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import {
  CARD_THEMES,
  MediaResource,
  SUBJECT_DEPARTMENTS,
} from '@/pages/MediaLibrary';

const COLOR_OPTIONS = [
  { value: 'blue', label: 'น้ำเงิน-คราม (Blue)' },
  { value: 'emerald', label: 'เขียว-มิ้นต์ (Emerald)' },
  { value: 'purple', label: 'ม่วง-ไวโอเล็ต (Purple)' },
  { value: 'amber', label: 'ส้ม-ทอง (Amber)' },
  { value: 'rose', label: 'ชมพู-โรส (Rose)' },
  { value: 'cyan', label: 'ฟ้าสดใส (Cyan)' },
];

export const MediaLibraryManagement = () => {
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaResource | null>(null);
  const [formData, setFormData] = useState({
    teacher_name: '',
    teacher_photo_url: '',
    subject_department: 'ภาษาไทย',
    title: '',
    description: '',
    google_site_url: '',
    grade_level: 'ทุกระดับชั้น',
    badge_color: 'blue',
    is_active: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('media_resources')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      console.error('Error fetching media_resources:', error);
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลไม่สำเร็จ หรือยังไม่ได้สร้างตาราง media_resources',
        description: 'กรุณารันคำสั่ง SQL สร้างตาราง media_resources ใน Supabase SQL Editor',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      teacher_name: '',
      teacher_photo_url: '',
      subject_department: 'ภาษาไทย',
      title: '',
      description: '',
      google_site_url: '',
      grade_level: 'ทุกระดับชั้น',
      badge_color: 'blue',
      is_active: true,
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: MediaResource) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        teacher_name: item.teacher_name,
        teacher_photo_url: item.teacher_photo_url || '',
        subject_department: item.subject_department,
        title: item.title,
        description: item.description || '',
        google_site_url: item.google_site_url,
        grade_level: item.grade_level || 'ทุกระดับชั้น',
        badge_color: item.badge_color || 'blue',
        is_active: item.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalUrl = normalizeUrl(formData.google_site_url);

    try {
      if (editingItem) {
        const { error } = await (supabase as any)
          .from('media_resources')
          .update({
            teacher_name: formData.teacher_name.trim(),
            teacher_photo_url: formData.teacher_photo_url || null,
            subject_department: formData.subject_department,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            google_site_url: finalUrl,
            grade_level: formData.grade_level.trim() || null,
            badge_color: formData.badge_color,
            is_active: formData.is_active,
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'บันทึกสำเร็จ',
          description: 'อัปเดตข้อมูลคลังสื่อการสอนเรียบร้อยแล้ว',
        });
      } else {
        const maxOrder =
          resources.length > 0
            ? Math.max(...resources.map((r) => r.order_position || 0))
            : 0;

        const { error } = await (supabase as any).from('media_resources').insert({
          teacher_name: formData.teacher_name.trim(),
          teacher_photo_url: formData.teacher_photo_url || null,
          subject_department: formData.subject_department,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          google_site_url: finalUrl,
          grade_level: formData.grade_level.trim() || null,
          badge_color: formData.badge_color,
          is_active: formData.is_active,
          order_position: maxOrder + 1,
        });

        if (error) throw error;

        toast({
          title: 'เพิ่มคลังสื่อสำเร็จ',
          description: 'เพิ่มลิงก์ Google Site ลงในคลังสื่อโรงเรียนเรียบร้อยแล้ว',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error: any) {
      console.error('Error saving media_resource:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกคลังสื่อการสอนได้',
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ต้องการลบคลังสื่อ "${title}" หรือไม่?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('media_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบคลังสื่อการสอนเรียบร้อยแล้ว',
      });
      fetchResources();
    } catch (error: any) {
      console.error('Error deleting media_resource:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบข้อมูลได้',
      });
    }
  };

  const subjectChoices = SUBJECT_DEPARTMENTS.filter((s) => s !== 'ทั้งหมด');

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MonitorPlay className="w-8 h-8 text-primary" />
            จัดการคลังสื่อการสอนของครู (Google Sites Panel)
          </h1>
          <p className="text-muted-foreground mt-1">
            เพิ่มและแก้ไขลิงก์คลังสื่อการสอนออนไลน์ (Google Sites) ของครูแต่ละคนเพื่อแสดงผลบนหน้าเว็บไซต์
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มคลังสื่อ Google Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'แก้ไขคลังสื่อการสอน' : 'เพิ่มลิงก์คลังสื่อการสอน (Google Site)'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher_name">ชื่อ-นามสกุลครูผู้สอน *</Label>
                  <Input
                    id="teacher_name"
                    value={formData.teacher_name}
                    onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                    placeholder="เช่น คุณครูสมชาย ใจดี"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>กลุ่มสาระการเรียนรู้ / หมวดวิชา *</Label>
                  <Select
                    value={formData.subject_department}
                    onValueChange={(val) => setFormData({ ...formData, subject_department: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกกลุ่มสาระการเรียนรู้" />
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">ชื่อคลังสื่อการสอน / ชื่อห้องเรียนออนไลน์ *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="เช่น ห้องเรียนออนไลน์วิชาคณิตศาสตร์พื้นฐาน ม.1"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="google_site_url">ลิงก์ Google Site (URL) *</Label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="google_site_url"
                      value={formData.google_site_url}
                      onChange={(e) =>
                        setFormData({ ...formData, google_site_url: e.target.value })
                      }
                      placeholder="https://sites.google.com/view/your-classroom"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade_level">ระดับชั้นที่สอน</Label>
                  <Input
                    id="grade_level"
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    placeholder="เช่น ป.1 - ป.6, ม.1 - ม.3 หรือ ทุกระดับชั้น"
                  />
                </div>

                <div className="space-y-2">
                  <Label>โทนสีของการ์ดลิงก์ (Card Theme)</Label>
                  <Select
                    value={formData.badge_color}
                    onValueChange={(val) => setFormData({ ...formData, badge_color: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสีของการ์ด" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">คำอธิบายเนื้อหาในคลังสื่อ</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="เช่น รวมใบความรู้ คลิปวิดีโอการสอน และแบบฝึกหัดออนไลน์..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>รูปประจำตัวครูผู้สอน หรือรูปปกสื่อ (ไม่บังคับ)</Label>
                  <ImageUpload
                    currentImage={formData.teacher_photo_url}
                    onUploadComplete={(url) => setFormData({ ...formData, teacher_photo_url: url })}
                    folder="media-library"
                    compressionPreset="profile"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>แสดงบนหน้าเว็บไซต์</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มลงคลังสื่อ'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูลคลังสื่อ...</div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MonitorPlay className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มีรายการคลังสื่อในฐานข้อมูล</h3>
            <p className="text-sm text-muted-foreground mb-4">
              เริ่มต้นเพิ่มลิงก์ Google Site ของคุณครูคนแรกได้เลย
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มคลังสื่อแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((item) => {
            const theme = CARD_THEMES[item.badge_color] || CARD_THEMES.blue;
            return (
              <Card
                key={item.id}
                className={`overflow-hidden flex flex-col ${!item.is_active ? 'opacity-60' : ''}`}
              >
                <div className={`h-20 bg-gradient-to-r ${theme.gradient} p-4 flex items-start justify-between`}>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                    <BookOpen className="w-3 h-3" />
                    {item.subject_department}
                  </span>
                  {item.grade_level && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/25 text-white text-xs">
                      <GraduationCap className="w-3 h-3" />
                      {item.grade_level}
                    </span>
                  )}
                </div>

                <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                  <div className="flex items-end gap-3 -mt-8 mb-3">
                    {item.teacher_photo_url ? (
                      <img
                        src={item.teacher_photo_url}
                        alt={item.teacher_name}
                        className="w-16 h-16 rounded-xl object-cover border-4 border-card shadow-md bg-card"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary border-4 border-card shadow-md flex items-center justify-center text-accent font-bold text-xl">
                        {item.teacher_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 pb-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-primary" />
                        {item.teacher_name}
                      </p>
                      {!item.is_active && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">ซ่อนอยู่</span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground mb-1 line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                      {item.description}
                    </p>
                  )}

                  <a
                    href={item.google_site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-4 truncate"
                  >
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.google_site_url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t mt-auto">
                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(item)}>
                      <Edit className="w-4 h-4 mr-1" />
                      แก้ไข
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id, item.title)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      ลบ
                    </Button>
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

