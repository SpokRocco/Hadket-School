import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  supabase,
  notifyLocalRealtimeListeners,
  subscribeToRealtimeTables,
} from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  RotateCcw,
  Save,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Play,
  Layers,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import heroImage from '@/assets/hero-school.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';
import {
  DEFAULT_HERO_SLIDES,
  parseHeroSlides,
  moveItemInOrder,
  reorderItemsById,
  type HeroSlideItem,
} from '@/utils/homepageLayoutUtils';

const PRESET_IMAGES = [
  { label: 'ภาพบรรยากาศโรงเรียนหลัก (Hero Campus)', url: heroImage },
  { label: 'ห้องปฏิบัติการวิทยาศาสตร์ / AI', url: studentScienceLab },
  { label: 'กิจกรรมพัฒนาผู้เรียนและบัณฑิตน้อย', url: studentGraduationActivity },
];

interface SortableHeroSlideRowProps {
  slide: HeroSlideItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableHeroSlideRow = ({
  slide,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggle,
  onEdit,
  onDelete,
}: SortableHeroSlideRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const previewImage =
    slide.image && slide.image.trim()
      ? slide.image.trim()
      : index === 1
      ? studentScienceLab
      : index === 2
      ? studentGraduationActivity
      : heroImage;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-2xl border transition-all ${
        slide.enabled
          ? 'bg-card border-border shadow-xs'
          : 'bg-muted/40 border-border/60 opacity-70'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Drag Handle, Number, Thumbnail & Details */}
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="ลากเพื่อจัดลำดับสไลด์"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-grab active:cursor-grabbing shrink-0 mt-1 sm:mt-0"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              title="เลื่อนขึ้น"
              className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onMoveDown}
              title="เลื่อนลง"
              className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
            #{index + 1}
          </span>

          {/* Slide Thumbnail */}
          <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 relative">
            <img
              src={previewImage}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Texts */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {slide.kicker && (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 truncate max-w-xs">
                  {slide.kicker}
                </span>
              )}
              {slide.primaryHref && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {slide.primaryHref}
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
              {slide.title || 'สไลด์ไม่มีหัวข้อ'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {slide.subtitle || slide.subline || 'ไม่มีคำอธิบายรอง'}
            </p>
          </div>
        </div>

        {/* Right Side: Toggle Switch and Action Buttons */}
        <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {slide.enabled ? 'เปิดแสดง' : 'ปิด'}
            </span>
            <Switch checked={slide.enabled} onCheckedChange={onToggle} />
          </div>

          <Button type="button" size="sm" variant="outline" onClick={onEdit} className="gap-1 text-xs">
            <Edit className="w-3.5 h-3.5" />
            แก้ไข
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            title="ลบสไลด์นี้"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const HeroSliderManagement = () => {
  const [slides, setSlides] = useState<HeroSlideItem[]>([]);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [autoplayInterval, setAutoplayInterval] = useState('6000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);

  const [formData, setFormData] = useState<HeroSlideItem>({
    id: '',
    image: '',
    kicker: '',
    subline: '',
    title: '',
    subtitle: '',
    primaryLabel: 'สมัครเรียนออนไลน์',
    primaryHref: '/enrollment',
    secondaryLabel: 'เกี่ยวกับโรงเรียน',
    secondaryHref: '/about',
    track1Name: 'นักเรียนปัจจุบัน',
    track1Range: '74 คน',
    track2Name: 'ระยะเวลาหลักสูตร',
    track2Range: '9 ปี',
    enabled: true,
    order: 1,
  });

  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('school_settings')
        .select('key, value')
        .in('key', ['hero_slides_json', 'hero_autoplay_enabled', 'hero_autoplay_interval']);

      if (error) throw error;

      const map: Record<string, string> = {};
      data?.forEach((row: any) => {
        map[row.key] = row.value || '';
      });

      setSlides(parseHeroSlides(map.hero_slides_json));
      setAutoplayEnabled(map.hero_autoplay_enabled !== 'false');
      setAutoplayInterval(map.hero_autoplay_interval || '6000');
    } catch (error: any) {
      console.error('Error loading hero slides:', error);
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลสไลด์ไม่สำเร็จ',
        description: error?.message || 'ไม่สามารถดึงข้อมูลจาก Supabase ได้',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    return subscribeToRealtimeTables('realtime_hero_slider_admin', ['school_settings'], loadData);
  }, [loadData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSlides(reorderItemsById(slides, String(active.id), String(over.id)));
    }
  };

  const handleOpenDialog = (slide?: HeroSlideItem) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({ ...slide });
    } else {
      setEditingSlide(null);
      setFormData({
        id: `slide-${Date.now()}`,
        image: '',
        kicker: 'เปิดรับสมัครนักเรียนใหม่ · ปีการศึกษา 2569',
        subline: 'ร่วมมือ วิชาการ งานอาชีพ · โรงเรียนบ้านหาดเค็ด',
        title: '',
        subtitle: '',
        primaryLabel: 'สมัครเรียนออนไลน์',
        primaryHref: '/enrollment',
        secondaryLabel: 'เกี่ยวกับโรงเรียน',
        secondaryHref: '/about',
        track1Name: 'นักเรียนปัจจุบัน',
        track1Range: '74 คน',
        track2Name: 'ระยะเวลาหลักสูตร',
        track2Range: '9 ปี',
        enabled: true,
        order: slides.length + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveSlideForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'กรุณากรอกหัวข้อสไลด์',
      });
      return;
    }

    if (editingSlide) {
      setSlides((prev) => prev.map((s) => (s.id === editingSlide.id ? { ...formData } : s)));
    } else {
      setSlides((prev) => [...prev, { ...formData, order: prev.length + 1 }]);
    }

    setIsDialogOpen(false);
    toast({
      title: editingSlide ? 'แก้ไขสไลด์เรียบร้อย' : 'เพิ่มสไลด์ใหม่เรียบร้อย',
      description: 'อย่าลืมกด "บันทึกภาพสไลด์" เพื่อยืนยันการเปลี่ยนแปลงบนหน้าเว็บไซต์',
    });
  };

  const handleDeleteSlide = (slideId: string, slideTitle: string) => {
    if (slides.length <= 1) {
      toast({
        variant: 'destructive',
        title: 'ไม่สามารถลบสไลด์ทั้งหมดได้',
        description: 'ต้องมีสไลด์อย่างน้อย 1 รายการบนหัวเว็บ',
      });
      return;
    }

    if (!confirm(`ต้องการลบสไลด์ "${slideTitle || 'นี้'}" หรือไม่?`)) return;

    const remaining = slides
      .filter((s) => s.id !== slideId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    setSlides(remaining);
    toast({
      title: 'ลบสไลด์แล้ว',
      description: 'กด "บันทึกภาพสไลด์" เพื่อยืนยันบนฐานข้อมูล',
    });
  };

  const handleResetDefaults = () => {
    if (!confirm('ต้องการรีเซ็ตภาพสไลด์กลับเป็นค่ามาตรฐาน 3 สไลด์ของโรงเรียนหรือไม่?')) return;
    setSlides(DEFAULT_HERO_SLIDES.map((s) => ({ ...s })));
    setAutoplayEnabled(true);
    setAutoplayInterval('6000');
    toast({
      title: 'รีเซ็ตภาพสไลด์เป็นค่ามาตรฐานแล้ว',
      description: 'กด "บันทึกภาพสไลด์" เพื่อยืนยันบนหน้าเว็บ',
    });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      const entries = [
        {
          key: 'hero_slides_json',
          value: JSON.stringify(slides),
          category: 'homepage',
        },
        {
          key: 'hero_autoplay_enabled',
          value: autoplayEnabled ? 'true' : 'false',
          category: 'homepage',
        },
        {
          key: 'hero_autoplay_interval',
          value: autoplayInterval,
          category: 'homepage',
        },
      ];

      for (const entry of entries) {
        const { error } = await supabase.from('school_settings').upsert(
          {
            key: entry.key,
            value: entry.value,
            category: entry.category,
          } as any,
          { onConflict: 'key' }
        );
        if (error) throw error;
      }

      // Clear cached settings and notify realtime subscribers
      localStorage.removeItem('school_settings_cache');
      localStorage.removeItem('school_settings_cache_v3');
      notifyLocalRealtimeListeners('school_settings');

      toast({
        title: 'บันทึกภาพสไลด์สำเร็จ (Realtime Sync)',
        description: 'ภาพสไลด์บนหัวเว็บหน้าแรกอัปเดตเรียบร้อยแล้วทันที',
      });
    } catch (error: any) {
      console.error('Error saving hero slides:', error);
      toast({
        variant: 'destructive',
        title: 'บันทึกไม่สำเร็จ',
        description: error?.message || 'เกิดข้อผิดพลาดในการบันทึกลง Supabase',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        กำลังโหลดข้อมูลภาพสไลด์บนหัวเว็บจาก Supabase...
      </div>
    );
  }

  const enabledCount = slides.filter((s) => s.enabled).length;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2.5">
            <Sparkles className="w-8 h-8 text-primary" />
            จัดการภาพสไลด์บนหัวเว็บ (Hero Slider Showcase)
          </h1>
          <p className="text-muted-foreground mt-1">
            อัปโหลดรูปภาพ ปรับเปลี่ยนข้อความ และจัดลำดับแบนเนอร์สไลด์ขนาดใหญ่บนหน้าแรกของโรงเรียน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open('/', '_blank')}
            className="gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            ดูหน้าเว็บจริง
          </Button>

          <Button type="button" onClick={handleSaveAll} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกภาพสไลด์'}
          </Button>
        </div>
      </div>

      {/* Auto-Play and Transition Settings Bar */}
      <Card>
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                การเลื่อนภาพสไลด์อัตโนมัติ (Auto-play Carousel)
              </p>
              <p className="text-xs text-muted-foreground">
                สไลด์จะเลื่อนเปลี่ยนภาพอัตโนมัติ และหยุดชั่วคราวเมื่อผู้ใช้นำเมาส์ไปชี้
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">สลับอัตโนมัติ:</span>
              <Switch checked={autoplayEnabled} onCheckedChange={setAutoplayEnabled} />
            </div>

            {autoplayEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">ความเร็ว:</span>
                <Select value={autoplayInterval} onValueChange={setAutoplayInterval}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3000">3 วินาที (เร็ว)</SelectItem>
                    <SelectItem value="5000">5 วินาที</SelectItem>
                    <SelectItem value="6000">6 วินาที (แนะนำ)</SelectItem>
                    <SelectItem value="8000">8 วินาที</SelectItem>
                    <SelectItem value="10000">10 วินาที</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slide Management Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                รายการภาพสไลด์บนหัวเว็บ ({enabledCount}/{slides.length} สไลด์ที่เปิดอยู่)
              </CardTitle>
              <CardDescription>
                ลากวางหรือกดลูกศรเพื่อเรียงลำดับการนำเสนอ และเปิด/ปิดสไลด์แต่ละภาพได้อิสระ
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ตเป็นค่าเริ่มต้น
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenDialog()}
                className="gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มภาพสไลด์ใหม่
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {slides.map((slide, idx) => (
                  <SortableHeroSlideRow
                    key={slide.id}
                    slide={slide}
                    index={idx}
                    total={slides.length}
                    onMoveUp={() => setSlides(moveItemInOrder(slides, idx, 'up'))}
                    onMoveDown={() => setSlides(moveItemInOrder(slides, idx, 'down'))}
                    onToggle={(checked) =>
                      setSlides(
                        slides.map((s) => (s.id === slide.id ? { ...s, enabled: checked } : s))
                      )
                    }
                    onEdit={() => handleOpenDialog(slide)}
                    onDelete={() => handleDeleteSlide(slide.id, slide.title)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Edit / Add Slide Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              {editingSlide ? 'แก้ไขภาพสไลด์หัวเว็บ' : 'เพิ่มภาพสไลด์หัวเว็บใหม่'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSlideForm} className="space-y-5 pt-2">
            {/* Image Selection & Upload */}
            <div className="space-y-3 p-4 rounded-xl bg-secondary/40 border border-border">
              <Label className="font-semibold text-sm">รูปภาพพื้นหลังสไลด์ *</Label>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs text-muted-foreground self-center">เลือกภาพตัวอย่าง:</span>
                {PRESET_IMAGES.map((preset, pIdx) => (
                  <Button
                    key={pIdx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setFormData({ ...formData, image: preset.url })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <ImageUpload
                currentImage={formData.image}
                onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                folder="hero_slider"
                compressionPreset="cover"
              />

              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="หรือวางลิงก์รูปภาพโดยตรง (https://... หรือ /assets/...)"
              />
            </div>

            {/* Slide Texts */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slide_kicker">ข้อความป้ายกำกับบนสุด (Kicker Badge)</Label>
                <Input
                  id="slide_kicker"
                  value={formData.kicker}
                  onChange={(e) => setFormData({ ...formData, kicker: e.target.value })}
                  placeholder="เช่น เปิดรับสมัครนักเรียนใหม่ · ปีการศึกษา 2569"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slide_subline">คำขวัญ / สโลแกนย่อย</Label>
                <Input
                  id="slide_subline"
                  value={formData.subline}
                  onChange={(e) => setFormData({ ...formData, subline: e.target.value })}
                  placeholder="เช่น ร่วมมือ วิชาการ งานอาชีพ · โรงเรียนบ้านหาดเค็ด"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slide_title">หัวข้อหลักบนสไลด์ *</Label>
              <Input
                id="slide_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น ร่วมมือ วิชาการ งานอาชีพ ด้วยปัญญา"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slide_subtitle">คำอธิบายรายละเอียด</Label>
              <Textarea
                id="slide_subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="มุ่งพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษา..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="space-y-2">
                <Label htmlFor="slide_p_label">ข้อความปุ่มหลัก</Label>
                <Input
                  id="slide_p_label"
                  value={formData.primaryLabel}
                  onChange={(e) => setFormData({ ...formData, primaryLabel: e.target.value })}
                  placeholder="เช่น สมัครเรียนออนไลน์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slide_p_href">ลิงก์ปุ่มหลัก</Label>
                <Input
                  id="slide_p_href"
                  value={formData.primaryHref}
                  onChange={(e) => setFormData({ ...formData, primaryHref: e.target.value })}
                  placeholder="เช่น /enrollment"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slide_s_label">ข้อความปุ่มรอง</Label>
                <Input
                  id="slide_s_label"
                  value={formData.secondaryLabel}
                  onChange={(e) => setFormData({ ...formData, secondaryLabel: e.target.value })}
                  placeholder="เช่น เกี่ยวกับโรงเรียน"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slide_s_href">ลิงก์ปุ่มรอง</Label>
                <Input
                  id="slide_s_href"
                  value={formData.secondaryHref}
                  onChange={(e) => setFormData({ ...formData, secondaryHref: e.target.value })}
                  placeholder="เช่น /about"
                />
              </div>
            </div>

            {/* Live Data Highlight Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>กล่องไฮไลต์ที่ 1 (หัวข้อ / ค่าสถิติ)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={formData.track1Name || ''}
                    onChange={(e) => setFormData({ ...formData, track1Name: e.target.value })}
                    placeholder="นักเรียนปัจจุบัน"
                  />
                  <Input
                    value={formData.track1Range || ''}
                    onChange={(e) => setFormData({ ...formData, track1Range: e.target.value })}
                    placeholder="74 คน"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>กล่องไฮไลต์ที่ 2 (หัวข้อ / ค่าสถิติ)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={formData.track2Name || ''}
                    onChange={(e) => setFormData({ ...formData, track2Name: e.target.value })}
                    placeholder="ระยะเวลาหลักสูตร"
                  />
                  <Input
                    value={formData.track2Range || ''}
                    onChange={(e) => setFormData({ ...formData, track2Range: e.target.value })}
                    placeholder="9 ปี"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label>เปิดใช้งานสไลด์นี้</Label>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">
                  {editingSlide ? 'ยืนยันการแก้ไข' : 'เพิ่มสไลด์'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom Sticky Save */}
      <div className="flex justify-end pt-2">
        <Button type="button" onClick={handleSaveAll} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'กำลังบันทึก...' : 'บันทึกภาพสไลด์'}
        </Button>
      </div>
    </div>
  );
};

