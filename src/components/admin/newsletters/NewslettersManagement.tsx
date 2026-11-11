import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  supabase,
  notifyLocalRealtimeListeners,
  subscribeToRealtimeTables,
} from '@/integrations/supabase/client';
import { deleteStorageImage } from '@/utils/storageUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
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
  FileText,
  Calendar,
  Eye,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  Paperclip,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import {
  formatThaiDate,
  NEWSLETTER_CATEGORIES,
  SchoolNewsletter,
} from '@/pages/Newsletters';

export const NewslettersManagement = () => {
  const [newsletters, setNewsletters] = useState<SchoolNewsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolNewsletter | null>(null);
  const [formData, setFormData] = useState({
    issue_no: '01',
    academic_year: '2569',
    issue_date: new Date().toISOString().split('T')[0],
    title: '',
    summary: '',
    content: '',
    category: 'กิจกรรมสถานศึกษา',
    image_url: '',
    file_url: '',
    is_published: true,
  });

  const { toast } = useToast();

  const fetchNewsletters = useCallback(async () => {
    try {
      let { data, error } = await (supabase as any)
        .from('newsletters')
        .select('*')
        .order('order_position', { ascending: true })
        .order('issue_date', { ascending: false });

      if (error) {
        const retry = await (supabase as any)
          .from('newsletters')
          .select('*')
          .order('issue_date', { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      setNewsletters(data || []);
    } catch (error: any) {
      console.error('Error fetching newsletters:', error);
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลไม่สำเร็จ หรือยังไม่ได้สร้างตาราง newsletters',
        description: 'กรุณารันคำสั่ง SQL สร้างตาราง newsletters ใน Supabase SQL Editor',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNewsletters();
    return subscribeToRealtimeTables(
      'realtime_admin_newsletters',
      ['newsletters'],
      fetchNewsletters
    );
  }, [fetchNewsletters]);

  const resetForm = () => {
    const nextIssueNum = String(newsletters.length + 1).padStart(2, '0');
    setFormData({
      issue_no: nextIssueNum,
      academic_year: '2569',
      issue_date: new Date().toISOString().split('T')[0],
      title: '',
      summary: '',
      content: '',
      category: 'กิจกรรมสถานศึกษา',
      image_url: '',
      file_url: '',
      is_published: true,
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: SchoolNewsletter) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        issue_no: item.issue_no,
        academic_year: item.academic_year || '2569',
        issue_date: item.issue_date,
        title: item.title,
        summary: item.summary || '',
        content: item.content || '',
        category: item.category || 'กิจกรรมสถานศึกษา',
        image_url: item.image_url || '',
        file_url: item.file_url || '',
        is_published: item.is_published,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        const { error } = await (supabase as any)
          .from('newsletters')
          .update({
            issue_no: formData.issue_no.trim(),
            academic_year: formData.academic_year.trim(),
            issue_date: formData.issue_date,
            title: formData.title.trim(),
            summary: formData.summary.trim() || null,
            content: formData.content.trim() || null,
            category: formData.category,
            image_url: formData.image_url || null,
            file_url: formData.file_url.trim() || null,
            is_published: formData.is_published,
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'บันทึกสำเร็จ',
          description: `แก้ไขจดหมายข่าว ฉบับที่ ${formData.issue_no}/${formData.academic_year} เรียบร้อยแล้ว`,
        });
      } else {
        const maxOrder =
          newsletters.length > 0
            ? Math.max(...newsletters.map((n) => n.order_position || 0))
            : 0;

        const { error } = await (supabase as any).from('newsletters').insert({
          issue_no: formData.issue_no.trim(),
          academic_year: formData.academic_year.trim(),
          issue_date: formData.issue_date,
          title: formData.title.trim(),
          summary: formData.summary.trim() || null,
          content: formData.content.trim() || null,
          category: formData.category,
          image_url: formData.image_url || null,
          file_url: formData.file_url.trim() || null,
          is_published: formData.is_published,
          order_position: maxOrder + 1,
        });

        if (error) throw error;

        toast({
          title: 'เพิ่มจดหมายข่าวสำเร็จ',
          description: `ออกจดหมายข่าว ฉบับที่ ${formData.issue_no}/${formData.academic_year} เรียบร้อยแล้ว`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      notifyLocalRealtimeListeners('newsletters');
      fetchNewsletters();
    } catch (error: any) {
      console.error('Error saving newsletter:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกจดหมายข่าวได้',
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ต้องการลบจดหมายข่าว "${title}" หรือไม่?`)) return;

    try {
      const itemToDelete = newsletters.find((n) => n.id === id);
      if (itemToDelete?.image_url) {
        await deleteStorageImage(itemToDelete.image_url);
      }

      const { error } = await (supabase as any)
        .from('newsletters')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      notifyLocalRealtimeListeners('newsletters');
      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบจดหมายข่าวเรียบร้อยแล้ว',
      });
      fetchNewsletters();
    } catch (error: any) {
      console.error('Error deleting newsletter:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถลบจดหมายข่าวได้',
      });
    }
  };

  const handleTogglePublished = async (item: SchoolNewsletter, checked: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('newsletters')
        .update({ is_published: checked })
        .eq('id', item.id);

      if (error) throw error;

      setNewsletters((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_published: checked } : n))
      );
      notifyLocalRealtimeListeners('newsletters');
      toast({
        title: checked ? 'เผยแพร่จดหมายข่าวแล้ว' : 'ซ่อนเป็นแบบร่างแล้ว',
        description: `ฉบับที่ ${item.issue_no}/${item.academic_year}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'อัปเดตสถานะไม่สำเร็จ',
        description: error?.message || 'ไม่สามารถเปลี่ยนสถานะการเผยแพร่ได้',
      });
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newsletters.length) return;

    const reordered = [...newsletters];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const normalized = reordered.map((item, idx) => ({
      ...item,
      order_position: idx + 1,
    }));

    setNewsletters(normalized);

    try {
      const results = await Promise.all(
        normalized.map((item) =>
          (supabase as any)
            .from('newsletters')
            .update({ order_position: item.order_position })
            .eq('id', item.id)
        )
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      notifyLocalRealtimeListeners('newsletters');
      toast({
        title: 'จัดลำดับสำเร็จ',
        description: 'บันทึกลำดับจดหมายข่าวลงฐานข้อมูล Supabase และซิงค์หน้าหลักแล้ว',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'บันทึกลำดับไม่สำเร็จ',
        description: error?.message || 'กรุณาตรวจสอบคอลัมน์ order_position ในตาราง newsletters',
      });
      fetchNewsletters();
    }
  };

  const categoryChoices = NEWSLETTER_CATEGORIES.filter((c) => c !== 'ทั้งหมด');

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            จัดการจดหมายข่าวประชาสัมพันธ์ (School Newsletter)
          </h1>
          <p className="text-muted-foreground mt-1">
            สร้าง อัปโหลด จัดลำดับ และเผยแพร่จดหมายข่าวไปยังหน้าแรกและหน้าหลักจากฐานข้อมูล Supabase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/dashboard?tab=homepage_layout">
            <Button type="button" variant="outline" className="gap-2">
              <LayoutTemplate className="w-4 h-4 text-primary" />
              ปรับแต่งการแสดงผลหน้าหลัก & เมนู
            </Button>
          </Link>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                ออกจดหมายข่าวฉบับใหม่
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem
                  ? `แก้ไขจดหมายข่าว ฉบับที่ ${editingItem.issue_no}/${editingItem.academic_year}`
                  : 'สร้างจดหมายข่าวประชาสัมพันธ์ฉบับใหม่'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_no">ฉบับที่ *</Label>
                  <Input
                    id="issue_no"
                    value={formData.issue_no}
                    onChange={(e) => setFormData({ ...formData, issue_no: e.target.value })}
                    placeholder="เช่น 01 หรือ 12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">ปีการศึกษา *</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="เช่น 2568"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue_date">ประจำวันที่ *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">หัวข้อจดหมายข่าวประชาสัมพันธ์ *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="เช่น กิจกรรมทำบุญตักบาตรและปฐมนิเทศนักเรียนใหม่"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>หมวดหมู่ *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryChoices.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="summary">สรุปเนื้อหา (แสดงในการ์ดหน้าแรก)</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="สรุปใจความสำคัญของกิจกรรม 2-3 บรรทัด..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="content">รายละเอียดเนื้อหาฉบับเต็ม (ถ้ามี)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="รายละเอียดของกิจกรรม..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label>รูปภาพโปสเตอร์จดหมายข่าว (A4) หรือภาพกิจกรรมหลัก</Label>
                  <ImageUpload
                    currentImage={formData.image_url}
                    onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                    folder="newsletters"
                    compressionPreset="gallery"
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="file_url">ลิงก์ไฟล์ PDF / Canva / Google Drive (ถ้ามี)</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                  />
                  <Label>เผยแพร่บนหน้าเว็บไซต์</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'บันทึกการแก้ไข' : 'เผยแพร่จดหมายข่าว'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดจดหมายข่าว...</div>
      ) : newsletters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มีจดหมายข่าวในระบบ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              เริ่มต้นสร้างจดหมายข่าวประชาสัมพันธ์ฉบับแรกของโรงเรียนได้เลย
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างจดหมายข่าวฉบับแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsletters.map((item, idx) => (
            <Card
              key={item.id}
              className={`overflow-hidden flex flex-col ${!item.is_published ? 'opacity-65' : ''}`}
            >
              <div className="bg-primary px-4 py-2.5 text-primary-foreground border-b-4 border-accent flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold truncate">
                    ฉบับที่ {item.issue_no} / ปีการศึกษา {item.academic_year}
                  </span>
                </div>
                <span className="text-[11px] flex items-center gap-1 text-primary-foreground/85 shrink-0">
                  <Calendar className="w-3 h-3" />
                  {formatThaiDate(item.issue_date)}
                </span>
              </div>

              {item.image_url && (
                <div className="h-44 bg-secondary overflow-hidden relative">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {item.file_url && (
                    <Badge className="absolute top-2.5 right-2.5 bg-slate-900/80 text-white text-[10px] gap-1">
                      <Paperclip className="w-3 h-3" />
                      มีไฟล์แนบ
                    </Badge>
                  )}
                </div>
              )}

              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">
                      {item.is_published ? 'เผยแพร่' : 'แบบร่าง'}
                    </span>
                    <Switch
                      checked={item.is_published}
                      onCheckedChange={(checked) => handleTogglePublished(item, checked)}
                      aria-label={`สลับสถานะเผยแพร่ ${item.title}`}
                    />
                  </div>
                </div>

                <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {item.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {item.views || 0}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, 'up')}
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={idx === newsletters.length - 1}
                        onClick={() => handleMoveOrder(idx, 'down')}
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

