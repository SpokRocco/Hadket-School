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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ArrowRight,
  GripVertical,
  RotateCcw,
  Save,
  ExternalLink,
  Image as ImageIcon,
  Play,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Database,
  Copy,
  Check,
  Crop,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import heroImage from '@/assets/hero-school.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';
import { cropImageToDataUrl } from '@/utils/imageUtils';
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

export interface HeroSlideRecord {
  id: string;
  title: string;
  subtitle: string;
  kicker: string;
  subline: string;
  image_url: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  track1_name: string;
  track1_range: string;
  track2_name: string;
  track2_range: string;
  image_position?: string;
  image_scale?: number;
  show_kicker?: boolean;
  show_subline?: boolean;
  show_subtitle?: boolean;
  show_primary_btn?: boolean;
  show_secondary_btn?: boolean;
  show_stats?: boolean;
  show_overlay?: boolean;
  is_active: boolean;
  order_position: number;
  created_at?: string;
  updated_at?: string;
}

function recordToItem(rec: any, index: number): HeroSlideItem {
  return {
    id: String(rec.id || `slide-${index + 1}`),
    title: rec.title || '',
    subtitle: rec.subtitle || '',
    kicker: rec.kicker || '',
    subline: rec.subline || '',
    image: rec.image_url || rec.image || '',
    primaryLabel: rec.primary_label || rec.primaryLabel || '',
    primaryHref: rec.primary_href || rec.primaryHref || '',
    secondaryLabel: rec.secondary_label || rec.secondaryLabel || '',
    secondaryHref: rec.secondary_href || rec.secondaryHref || '',
    track1Name: rec.track1_name || rec.track1Name || '',
    track1Range: rec.track1_range || rec.track1Range || '',
    track2Name: rec.track2_name || rec.track2Name || '',
    track2Range: rec.track2_range || rec.track2Range || '',
    imagePosition: rec.image_position || rec.imagePosition || 'center center',
    imageScale:
      typeof rec.image_scale === 'number' && !isNaN(rec.image_scale)
        ? rec.image_scale
        : typeof rec.imageScale === 'number' && !isNaN(rec.imageScale)
        ? rec.imageScale
        : 1,
    showKicker:
      rec.show_kicker !== undefined
        ? Boolean(rec.show_kicker)
        : rec.showKicker !== false,
    showSubline:
      rec.show_subline !== undefined
        ? Boolean(rec.show_subline)
        : rec.showSubline !== false,
    showSubtitle:
      rec.show_subtitle !== undefined
        ? Boolean(rec.show_subtitle)
        : rec.showSubtitle !== false,
    showPrimaryBtn:
      rec.show_primary_btn !== undefined
        ? Boolean(rec.show_primary_btn)
        : rec.showPrimaryBtn !== false,
    showSecondaryBtn:
      rec.show_secondary_btn !== undefined
        ? Boolean(rec.show_secondary_btn)
        : rec.showSecondaryBtn !== false,
    showStats:
      rec.show_stats !== undefined
        ? Boolean(rec.show_stats)
        : rec.showStats !== false,
    showOverlay:
      rec.show_overlay !== undefined
        ? Boolean(rec.show_overlay)
        : rec.showOverlay !== false,
    enabled: rec.is_active !== undefined ? Boolean(rec.is_active) : (rec.enabled !== false),
    order: rec.order_position || rec.order || index + 1,
  };
}

function itemToRecord(item: HeroSlideItem, index: number): HeroSlideRecord {
  return {
    id: item.id || `slide-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    title: item.title || '',
    subtitle: item.subtitle || '',
    kicker: item.kicker || '',
    subline: item.subline || '',
    image_url: item.image || '',
    primary_label: item.primaryLabel || '',
    primary_href: item.primaryHref || '',
    secondary_label: item.secondaryLabel || '',
    secondary_href: item.secondaryHref || '',
    track1_name: item.track1Name || '',
    track1_range: item.track1Range || '',
    track2_name: item.track2Name || '',
    track2_range: item.track2Range || '',
    image_position: item.imagePosition || 'center center',
    image_scale: item.imageScale || 1,
    show_kicker: item.showKicker !== false,
    show_subline: item.showSubline !== false,
    show_subtitle: item.showSubtitle !== false,
    show_primary_btn: item.showPrimaryBtn !== false,
    show_secondary_btn: item.showSecondaryBtn !== false,
    show_stats: item.showStats !== false,
    show_overlay: item.showOverlay !== false,
    is_active: item.enabled !== false,
    order_position: index + 1,
    updated_at: new Date().toISOString(),
  };
}

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
  const [slideToDelete, setSlideToDelete] = useState<HeroSlideItem | null>(null);
  const [isTableConnected, setIsTableConnected] = useState(false);
  const [showSqlDialog, setShowSqlDialog] = useState(false);

  // Image Cropping & Framing Modal states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropAspectRatio, setCropAspectRatio] = useState<number>(16 / 9);
  const [cropFocalX, setCropFocalX] = useState<number>(50);
  const [cropFocalY, setCropFocalY] = useState<number>(50);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [isCropping, setIsCropping] = useState(false);

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
    imagePosition: 'center center',
    imageScale: 1,
    showKicker: true,
    showSubline: true,
    showSubtitle: true,
    showPrimaryBtn: true,
    showSecondaryBtn: true,
    showStats: true,
    showOverlay: true,
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

      // 1. Try to load from dedicated hero_slides table first
      let loadedSlides: HeroSlideItem[] = [];
      let tableLoaded = false;

      try {
        const { data: tableData, error: tableErr } = await (supabase as any)
          .from('hero_slides')
          .select('*')
          .order('order_position', { ascending: true });

        if (!tableErr && Array.isArray(tableData) && tableData.length > 0) {
          loadedSlides = tableData.map((row: any, idx: number) => recordToItem(row, idx));
          tableLoaded = true;
        }
      } catch (tErr) {
        console.warn('hero_slides table not ready yet, falling back to school_settings:', tErr);
      }

      // 2. Load settings for autoplay and fallback slides
      const { data: settingsData } = await supabase
        .from('school_settings')
        .select('key, value')
        .in('key', ['hero_slides_json', 'hero_autoplay_enabled', 'hero_autoplay_interval']);

      const map: Record<string, string> = {};
      settingsData?.forEach((row: any) => {
        map[row.key] = row.value || '';
      });

      setAutoplayEnabled(map.hero_autoplay_enabled !== 'false');
      setAutoplayInterval(map.hero_autoplay_interval || '6000');

      if (!tableLoaded) {
        // Fallback from school_settings.hero_slides_json or defaults
        const parsed = parseHeroSlides(map.hero_slides_json);
        loadedSlides = parsed.length > 0 ? parsed : DEFAULT_HERO_SLIDES;
      } else {
        // If school_settings has more slides than table, harmonize
        const parsed = parseHeroSlides(map.hero_slides_json);
        if (parsed.length > loadedSlides.length) {
          loadedSlides = parsed;
        }
      }

      // 3. Harmonize with live cache in localStorage to ensure user never loses uncommitted slides
      try {
        const liveRaw = localStorage.getItem('kk_school_hero_slides_live');
        if (liveRaw) {
          const liveParsed = parseHeroSlides(liveRaw);
          if (liveParsed.length >= loadedSlides.length && liveParsed.length > 0) {
            loadedSlides = liveParsed;
          }
        }
      } catch {
        // ignore
      }

      setIsTableConnected(tableLoaded);
      setSlides(loadedSlides);
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
    return subscribeToRealtimeTables(
      'realtime_hero_slider_admin',
      ['hero_slides', 'school_settings'],
      loadData
    );
  }, [loadData]);

  // Sync to both hero_slides table and school_settings
  const persistSlides = async (
    newSlides: HeroSlideItem[],
    newAutoplay = autoplayEnabled,
    newInterval = autoplayInterval,
    showToast = true,
    toastMsg = 'บันทึกภาพสไลด์เรียบร้อยแล้ว'
  ) => {
    setSlides(newSlides);
    try {
      setSaving(true);

      // 1. Instantly write to localStorage live cache so it never disappears on refresh
      try {
        localStorage.setItem('kk_school_hero_slides_live', JSON.stringify(newSlides));
        const cached = localStorage.getItem('school_settings_cache_v3');
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.hero_slides_json = JSON.stringify(newSlides);
          parsed.heroSlides = newSlides;
          parsed.hero_autoplay_enabled = newAutoplay ? 'true' : 'false';
          parsed.hero_autoplay_interval = newInterval;
          localStorage.setItem('school_settings_cache_v3', JSON.stringify(parsed));
        }
      } catch (cErr) {
        console.warn('Local storage cache update note:', cErr);
      }

      // 2. Persist to hero_slides table
      try {
        const records = newSlides.map((s, idx) => itemToRecord(s, idx));
        if (records.length > 0) {
          const { error: upsertErr } = await (supabase as any)
            .from('hero_slides')
            .upsert(records, { onConflict: 'id' });
          if (!upsertErr) {
            setIsTableConnected(true);
          } else {
            console.warn('hero_slides table direct upsert note:', upsertErr);
          }
        }
      } catch (tableErr) {
        console.warn('hero_slides table direct upsert skipped:', tableErr);
      }

      // 3. Persist to school_settings for backward compatibility & fallback
      const entries = [
        {
          key: 'hero_slides_json',
          value: JSON.stringify(newSlides),
          category: 'homepage',
        },
        {
          key: 'hero_autoplay_enabled',
          value: newAutoplay ? 'true' : 'false',
          category: 'homepage',
        },
        {
          key: 'hero_autoplay_interval',
          value: newInterval,
          category: 'homepage',
        },
      ];

      for (const entry of entries) {
        const { error: setErr } = await supabase.from('school_settings').upsert(
          {
            key: entry.key,
            value: entry.value,
            category: entry.category,
          } as any,
          { onConflict: 'key' }
        );
        if (setErr) {
          await supabase
            .from('school_settings')
            .update({ value: entry.value, category: entry.category } as any)
            .eq('key', entry.key);
        }
      }

      // 4. Trigger Realtime Sync listeners & DOM broadcast
      notifyLocalRealtimeListeners('hero_slides');
      notifyLocalRealtimeListeners('school_settings');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hero-slides-updated', { detail: newSlides }));
        window.dispatchEvent(
          new CustomEvent('kk-school-local-db-change', { detail: { table: 'hero_slides' } })
        );
      }

      if (showToast) {
        toast({
          title: 'สำเร็จ (Realtime Sync)',
          description: toastMsg,
        });
      }
    } catch (error: any) {
      console.error('Error saving hero slides:', error);
      toast({
        variant: 'destructive',
        title: 'บันทึกลงฐานข้อมูลไม่สำเร็จ',
        description: error?.message || 'เกิดข้อผิดพลาดในการบันทึก',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const reordered = reorderItemsById(slides, String(active.id), String(over.id));
      await persistSlides(reordered, autoplayEnabled, autoplayInterval, false);
      toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับสไลด์ใหม่แล้ว' });
    }
  };

  const handleMoveSlide = async (idx: number, direction: 'up' | 'down') => {
    const moved = moveItemInOrder(slides, idx, direction);
    await persistSlides(moved, autoplayEnabled, autoplayInterval, false);
    toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับสไลด์ใหม่แล้ว' });
  };

  const handleToggleSlide = async (slideId: string, checked: boolean) => {
    const updated = slides.map((s) => (s.id === slideId ? { ...s, enabled: checked } : s));
    
    // Also update hero_slides table directly
    try {
      await (supabase as any)
        .from('hero_slides')
        .update({ is_active: checked })
        .eq('id', slideId);
    } catch (e) {
      console.warn('Error updating hero_slides is_active:', e);
    }

    await persistSlides(
      updated,
      autoplayEnabled,
      autoplayInterval,
      true,
      checked ? 'เปิดแสดงผลสไลด์แล้ว' : 'ปิดซ่อนสไลด์แล้ว'
    );
  };

  const handleOpenDialog = (slide?: HeroSlideItem, index?: number) => {
    if (slide) {
      setEditingSlide(slide);
      const fallbackImg =
        slide.image ||
        (index === 0 ? heroImage : index === 1 ? studentScienceLab : studentGraduationActivity);
      setFormData({
        ...slide,
        image: slide.image || fallbackImg,
        imagePosition: slide.imagePosition || 'center center',
        imageScale:
          typeof slide.imageScale === 'number' && !isNaN(slide.imageScale) ? slide.imageScale : 1,
        showKicker: slide.showKicker !== false,
        showSubline: slide.showSubline !== false,
        showSubtitle: slide.showSubtitle !== false,
        showPrimaryBtn: slide.showPrimaryBtn !== false,
        showSecondaryBtn: slide.showSecondaryBtn !== false,
        showStats: slide.showStats !== false,
        showOverlay: slide.showOverlay !== false,
      });
    } else {
      setEditingSlide(null);
      setFormData({
        id: `slide-${Date.now()}`,
        image: heroImage,
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
        imagePosition: 'center center',
        imageScale: 1,
        showKicker: true,
        showSubline: true,
        showSubtitle: true,
        showPrimaryBtn: true,
        showSecondaryBtn: true,
        showStats: true,
        showOverlay: true,
        enabled: true,
        order: slides.length + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleApplyCrop = async () => {
    if (!formData.image) return;
    try {
      setIsCropping(true);
      const croppedUrl = await cropImageToDataUrl(
        formData.image,
        cropAspectRatio,
        cropFocalX,
        cropFocalY,
        cropZoom
      );
      setFormData((prev) => ({ ...prev, image: croppedUrl }));
      setShowCropDialog(false);
      toast({
        title: 'ครอบตัดรูปภาพสำเร็จ',
        description: 'ปรับแต่งสัดส่วนและนำภาพที่ครอบตัดแล้วมาใช้บนสไลด์เรียบร้อย',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'ครอบตัดภาพไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาดในการตัดแต่งรูปภาพ',
      });
    } finally {
      setIsCropping(false);
    }
  };

  const handleSaveSlideForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'กรุณากรอกหัวข้อสไลด์',
      });
      return;
    }

    let updated: HeroSlideItem[] = [];
    if (editingSlide) {
      updated = slides.map((s) => (s.id === editingSlide.id ? { ...formData } : s));
    } else {
      const newSlide = {
        ...formData,
        id: formData.id || `slide-${Date.now()}`,
        order: slides.length + 1,
      };
      updated = [...slides, newSlide];
    }

    setIsDialogOpen(false);
    await persistSlides(
      updated,
      autoplayEnabled,
      autoplayInterval,
      true,
      editingSlide ? 'บันทึกการแก้ไขสไลด์สำเร็จ' : 'เพิ่มภาพสไลด์ใหม่สำเร็จ'
    );
  };

  const confirmDeleteSlide = async () => {
    if (!slideToDelete) return;
    const targetId = slideToDelete.id;
    const targetTitle = slideToDelete.title;

    try {
      setSaving(true);
      // 1. Delete from hero_slides table directly
      try {
        await (supabase as any)
          .from('hero_slides')
          .delete()
          .eq('id', targetId);
      } catch (e) {
        console.warn('Direct delete from hero_slides failed:', e);
      }

      // 2. Filter remaining and re-order
      const remaining = slides
        .filter((s) => s.id !== targetId)
        .map((s, idx) => ({ ...s, order: idx + 1 }));

      setSlideToDelete(null);
      await persistSlides(remaining, autoplayEnabled, autoplayInterval, true, `ลบสไลด์ "${targetTitle || ''}" เรียบร้อยแล้ว`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'ลบสไลด์ไม่สำเร็จ',
        description: error?.message || 'เกิดข้อผิดพลาดในการลบสไลด์',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const defaults = DEFAULT_HERO_SLIDES.map((s, idx) => ({ ...s, order: idx + 1 }));
    setAutoplayEnabled(true);
    setAutoplayInterval('6000');

    // Clean table and insert defaults
    try {
      await (supabase as any).from('hero_slides').delete().neq('id', 'keep_none');
      const records = defaults.map((s, idx) => itemToRecord(s, idx));
      await (supabase as any).from('hero_slides').insert(records);
    } catch (e) {
      console.warn('Failed resetting hero_slides table:', e);
    }

    await persistSlides(defaults, true, '6000', true, 'รีเซ็ตภาพสไลด์เป็นค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  const handleSaveAll = async () => {
    await persistSlides(
      slides,
      autoplayEnabled,
      autoplayInterval,
      true,
      'บันทึกภาพสไลด์สำเร็จ (Realtime Sync)'
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-primary animate-spin" />
        <p>กำลังโหลดข้อมูลภาพสไลด์บนหัวเว็บจาก Supabase (hero_slides)...</p>
      </div>
    );
  }

  const enabledCount = slides.filter((s) => s.enabled).length;

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Full Control System
            </Badge>
            {isTableConnected ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                🟢 Supabase Table: hero_slides
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                🟡 โหมดสำรอง Realtime Sync (school_settings)
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSqlDialog(true)}
              className="text-xs h-6 px-2 gap-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Database className="w-3 h-3" />
              คำสั่ง SQL สำหรับ Supabase
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5 mt-1.5">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            จัดการภาพสไลด์บนหัวเว็บ (Hero Slider Console)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ปรับแต่ง เพิ่ม ลบ แก้ไขภาพสไลด์บนหัวเว็บไซต์ จัดลำดับ และอัปโหลดรูปภาพได้อิสระแบบ Full Control โดยไม่จำกัดขนาด
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open('/', '_blank')}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            ดูหน้าเว็บจริง
          </Button>

          <Button type="button" onClick={handleSaveAll} disabled={saving} className="gap-2 text-xs sm:text-sm">
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกภาพสไลด์'}
          </Button>
        </div>
      </div>

      {/* Quick Link Banner to Sub-Hero 2 Images */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              ต้องการแก้ไขรูปภาพ 2 รูปด้านล่างภาพสไลด์หัวเว็บ?
              <Badge className="bg-sky-500 text-white text-[10px] h-4 px-1.5">ใหม่</Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              แก้ไขภาพบรรยากาศโรงเรียน (ซ้าย) และภาพกิจกรรมนักเรียน (ขวา) ที่ประกบข้อความต้อนรับ
            </p>
          </div>
        </div>
        <Button variant="default" size="sm" asChild className="bg-sky-500 hover:bg-sky-600 text-white gap-1.5 text-xs shrink-0 shadow-xs">
          <Link to="/admin/dashboard?tab=subhero_images">
            เปิดเมนูจัดการ 2 รูปไฮไลท์ <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
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
              <Switch
                checked={autoplayEnabled}
                onCheckedChange={(val) => {
                  setAutoplayEnabled(val);
                  persistSlides(slides, val, autoplayInterval, true, val ? 'เปิดสไลด์อัตโนมัติแล้ว' : 'ปิดสไลด์อัตโนมัติแล้ว');
                }}
              />
            </div>

            {autoplayEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">ความเร็ว:</span>
                <Select
                  value={autoplayInterval}
                  onValueChange={(val) => {
                    setAutoplayInterval(val);
                    persistSlides(slides, autoplayEnabled, val, true, 'ปรับความเร็วสไลด์แล้ว');
                  }}
                >
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
          {slides.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-border rounded-xl bg-secondary/20">
              <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-foreground">ยังไม่มีภาพสไลด์บนหัวเว็บ</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">กดปุ่มด้านล่างเพื่อเพิ่มภาพสไลด์ใหม่ หรือรีเซ็ตเป็นค่าเริ่มต้น</p>
              <div className="flex justify-center gap-2">
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  เพิ่มภาพสไลด์แรก
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetDefaults}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  คืนค่าเริ่มต้น 3 ภาพ
                </Button>
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {slides.map((slide, idx) => (
                    <SortableHeroSlideRow
                      key={slide.id}
                      slide={slide}
                      index={idx}
                      total={slides.length}
                      onMoveUp={() => handleMoveSlide(idx, 'up')}
                      onMoveDown={() => handleMoveSlide(idx, 'down')}
                      onToggle={(checked) => handleToggleSlide(slide.id, checked)}
                      onEdit={() => handleOpenDialog(slide, idx)}
                      onDelete={() => setSlideToDelete(slide)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Edit / Add Slide Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5 text-primary" />
              {editingSlide ? 'แก้ไขภาพสไลด์หัวเว็บ' : 'เพิ่มภาพสไลด์หัวเว็บใหม่'}
            </DialogTitle>
            <DialogDescription>
              กำหนดรูปภาพ ข้อความ และปุ่มกดบนแบนเนอร์ภาพสไลด์หัวเว็บ บันทึกจัดเก็บในตาราง hero_slides
            </DialogDescription>
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
                    onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Enhanced ImageUpload component */}
              <ImageUpload
                currentImage={formData.image}
                onUploadComplete={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                folder="hero_slider"
                compressionPreset="hero"
                maxSizeMB={0}
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>รองรับรูปภาพทุกประเภทและทุกขนาด (JPG, PNG, WebP, HEIC/iPhone/iPad) ไม่จำกัดขนาด</span>
                <span className="text-primary font-medium">Full Control</span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">หรือวาง URL ลิงก์รูปภาพโดยตรง:</Label>
                <Input
                  value={formData.image}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, image: val }));
                  }}
                  placeholder="https://images.unsplash.com/... หรือ URL รูปภาพ"
                />
              </div>

              {/* Interactive Image Positioning, Scaling & Cropping Controls */}
              {formData.image && (
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-3 mt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      ปรับตำแหน่งภาพ (ลูกศรเลือกจุดโฟกัส) & ซูม (Zoom / Scale)
                    </Label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => setShowCropDialog(true)}
                    >
                      <Crop className="w-3.5 h-3.5 text-amber-500" />
                      ✂️ ครอบตัดรูปภาพ (Crop Tool)
                    </Button>
                  </div>

                  {/* Visual Preview Box with current position & scale */}
                  <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] rounded-lg overflow-hidden bg-slate-950 border border-slate-700">
                    <img
                      src={formData.image}
                      alt="Preview positioning"
                      style={{
                        objectPosition: formData.imagePosition || 'center center',
                        transform:
                          formData.imageScale && formData.imageScale !== 1
                            ? `scale(${formData.imageScale})`
                            : undefined,
                        transformOrigin: formData.imagePosition || 'center center',
                      }}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
                    />
                    {formData.showOverlay !== false && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />
                    )}
                    <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 text-white px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                      ตำแหน่ง: {formData.imagePosition || 'center center'} · ซูม: {((formData.imageScale || 1) * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Direction Controls (Arrows) & Zoom Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Focal Position Direction Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-muted-foreground block font-medium">ทิศทางจัดวาง (ลูกศรเลือกจุดโฟกัส):</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                          type="button"
                          variant={formData.imagePosition === 'center top' ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setFormData((prev) => ({ ...prev, imagePosition: 'center top' }))}
                          title="เน้นด้านบน"
                        >
                          <ArrowUp className="w-3 h-3" /> บน
                        </Button>
                        <Button
                          type="button"
                          variant={(!formData.imagePosition || formData.imagePosition === 'center center') ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setFormData((prev) => ({ ...prev, imagePosition: 'center center' }))}
                          title="กึ่งกลางภาพ"
                        >
                          🎯 กลาง
                        </Button>
                        <Button
                          type="button"
                          variant={formData.imagePosition === 'center bottom' ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setFormData((prev) => ({ ...prev, imagePosition: 'center bottom' }))}
                          title="เน้นด้านล่าง"
                        >
                          <ArrowDown className="w-3 h-3" /> ล่าง
                        </Button>
                        <Button
                          type="button"
                          variant={formData.imagePosition === 'left center' ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setFormData((prev) => ({ ...prev, imagePosition: 'left center' }))}
                          title="เน้นฝั่งซ้าย"
                        >
                          ⬅️ ซ้าย
                        </Button>
                        <Button
                          type="button"
                          variant={formData.imagePosition === 'right center' ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setFormData((prev) => ({ ...prev, imagePosition: 'right center' }))}
                          title="เน้นฝั่งขวา"
                        >
                          ➡️ ขวา
                        </Button>
                      </div>
                    </div>

                    {/* Zoom / Scale Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-muted-foreground block font-medium">ระดับการซูม (Zoom & Scale):</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              imageScale: Math.max(0.7, Number(((prev.imageScale || 1) - 0.1).toFixed(2))),
                            }))
                          }
                          title="ซูมออก (-10%)"
                        >
                          <ZoomOut className="w-3 h-3" /> -10%
                        </Button>
                        <Button
                          type="button"
                          variant={formData.imageScale === 1 ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs px-2 font-mono"
                          onClick={() => setFormData((prev) => ({ ...prev, imageScale: 1 }))}
                          title="รีเซ็ตขนาดปกติ 100%"
                        >
                          100%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              imageScale: Math.min(2.2, Number(((prev.imageScale || 1) + 0.1).toFixed(2))),
                            }))
                          }
                          title="ซูมเข้า (+10%)"
                        >
                          <ZoomIn className="w-3 h-3" /> +10%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              imageScale: Math.min(2.2, Number(((prev.imageScale || 1) + 0.25).toFixed(2))),
                            }))
                          }
                          title="ซูมเข้า (+25%)"
                        >
                          +25%
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Element Visibility Control Card */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  การแสดงผลองค์ประกอบบนสไลด์ (Show/Hide Elements)
                </Label>
                <span className="text-xs text-muted-foreground">เปิดหรือปิดการแสดงผลแต่ละส่วนได้ตามต้องการ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-xs font-medium">ป้ายบนสุด (Kicker)</span>
                  <Switch
                    checked={formData.showKicker !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showKicker: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-xs font-medium">คำขวัญย่อย (Subline)</span>
                  <Switch
                    checked={formData.showSubline !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showSubline: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-xs font-medium">คำอธิบาย (Subtitle)</span>
                  <Switch
                    checked={formData.showSubtitle !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showSubtitle: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-xs font-medium">ปุ่มกดหลัก (Primary)</span>
                  <Switch
                    checked={formData.showPrimaryBtn !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showPrimaryBtn: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-xs font-medium">ปุ่มกดรอง (Secondary)</span>
                  <Switch
                    checked={formData.showSecondaryBtn !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showSecondaryBtn: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-xs font-medium">กล่องสถิติ (Stats Cards)</span>
                  <Switch
                    checked={formData.showStats !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showStats: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border sm:col-span-2 lg:col-span-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">ฟิลเตอร์เงาพื้นหลัง (Contrast Overlay)</span>
                    <span className="text-[11px] text-muted-foreground">ไล่เฉดเงาดำช่วยให้อ่านตัวหนังสือชัดเจนขึ้น</span>
                  </div>
                  <Switch
                    checked={formData.showOverlay !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showOverlay: checked })}
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

      {/* Interactive Crop Image Modal Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Crop className="w-5 h-5" />
              ครอบตัดรูปภาพภาพสไลด์ (Crop Image Tool)
            </DialogTitle>
            <DialogDescription>
              เลือกสัดส่วนภาพและจุดโฟกัสที่ต้องการ ระบบจะประมวลผลตัดรูปภาพให้อัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">สัดส่วนภาพ (Aspect Ratio):</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '16:9 แบนเนอร์', value: 16 / 9 },
                  { label: '21:9 จอกว้าง', value: 21 / 9 },
                  { label: '4:3 มาตรฐาน', value: 4 / 3 },
                  { label: '1:1 จัตุรัส', value: 1 },
                ].map((ratio, rIdx) => (
                  <Button
                    key={rIdx}
                    type="button"
                    variant={cropAspectRatio === ratio.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setCropAspectRatio(ratio.value)}
                  >
                    {ratio.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Focal Point percent sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">จุดโฟกัสแนวนอน (X: {cropFocalX}%):</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cropFocalX}
                  onChange={(e) => setCropFocalX(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">จุดโฟกัสแนวตั้ง (Y: {cropFocalY}%):</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cropFocalY}
                  onChange={(e) => setCropFocalY(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Live Crop Preview Box */}
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
              <img
                src={formData.image}
                alt="Crop preview"
                style={{
                  objectPosition: `${cropFocalX}% ${cropFocalY}%`,
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setShowCropDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleApplyCrop}
              disabled={isCropping}
              className="gap-1.5"
            >
              <Crop className="w-4 h-4" />
              {isCropping ? 'กำลังตัดแต่งภาพ...' : 'ยืนยันครอบตัดภาพ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* In-app Delete Confirmation Modal (solves confirm() block on iOS/Dialogs) */}
      <Dialog open={!!slideToDelete} onOpenChange={(open) => !open && setSlideToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการลบภาพสไลด์
            </DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบสไลด์นี้ออกจากหน้าแรกของโรงเรียน? การลบนี้จะมีผลทันที
            </DialogDescription>
          </DialogHeader>

          {slideToDelete && (
            <div className="p-3 rounded-lg border bg-secondary/30 flex items-center gap-3 my-2">
              <div className="w-16 h-12 rounded-md overflow-hidden bg-slate-900 border shrink-0">
                <img
                  src={slideToDelete.image || heroImage}
                  alt={slideToDelete.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{slideToDelete.title || 'สไลด์ไม่มีหัวข้อ'}</p>
                <p className="text-xs text-muted-foreground truncate">{slideToDelete.subtitle || 'ไม่มีคำอธิบาย'}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSlideToDelete(null)}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteSlide}
              disabled={saving}
              className="gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {saving ? 'กำลังลบ...' : 'ยืนยันลบสไลด์นี้'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SQL Migration Instruction Dialog */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Database className="w-5 h-5" />
              คำสั่ง SQL สำหรับเพิ่มตาราง hero_slides ใน Supabase
            </DialogTitle>
            <DialogDescription>
              คัดลอกคำสั่งด้านล่างนี้ไปวางและกดรันใน Supabase SQL Editor เพื่อสร้างตาราง hero_slides พร้อมสิทธิ์ RLS และเปิด Realtime
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              💡 <strong>คำแนะนำ:</strong> คำสั่งนี้ปลอดภัย 100% (ใช้ IF NOT EXISTS) สามารถรันซ้ำได้โดยไม่กระทบข้อมูลเดิมของโรงเรียน และถึงแม้ยังไม่ได้รัน ระบบก็ยังสามารถบันทึกสไลด์ผ่าน school_settings แบบ Full Control ได้ทันที
            </div>

            <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-64 leading-relaxed">
{`-- 1. สร้างตาราง hero_slides
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  kicker TEXT DEFAULT '',
  subline TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  primary_label TEXT DEFAULT 'สมัครเรียนออนไลน์',
  primary_href TEXT DEFAULT '/enrollment',
  secondary_label TEXT DEFAULT 'เกี่ยวกับโรงเรียน',
  secondary_href TEXT DEFAULT '/about',
  track1_name TEXT DEFAULT 'นักเรียนปัจจุบัน',
  track1_range TEXT DEFAULT '74 คน',
  track2_name TEXT DEFAULT 'ระยะเวลาหลักสูตร',
  track2_range TEXT DEFAULT '9 ปี',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. กำหนดสิทธิ์ RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read for hero_slides" ON public.hero_slides;
CREATE POLICY "Public Read for hero_slides" ON public.hero_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Full Access for hero_slides" ON public.hero_slides;
CREATE POLICY "Public Full Access for hero_slides" ON public.hero_slides FOR ALL USING (true) WITH CHECK (true);

-- 3. เปิดใช้งาน Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hero_slides'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_slides;
    END IF;
  END IF;
END $$;`}
            </pre>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const sqlText = `-- 1. สร้างตาราง hero_slides\nCREATE TABLE IF NOT EXISTS public.hero_slides (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  subtitle TEXT DEFAULT '',\n  kicker TEXT DEFAULT '',\n  subline TEXT DEFAULT '',\n  image_url TEXT DEFAULT '',\n  primary_label TEXT DEFAULT 'สมัครเรียนออนไลน์',\n  primary_href TEXT DEFAULT '/enrollment',\n  secondary_label TEXT DEFAULT 'เกี่ยวกับโรงเรียน',\n  secondary_href TEXT DEFAULT '/about',\n  track1_name TEXT DEFAULT 'นักเรียนปัจจุบัน',\n  track1_range TEXT DEFAULT '74 คน',\n  track2_name TEXT DEFAULT 'ระยะเวลาหลักสูตร',\n  track2_range TEXT DEFAULT '9 ปี',\n  is_active BOOLEAN NOT NULL DEFAULT true,\n  order_position INTEGER NOT NULL DEFAULT 1,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n\n-- 2. กำหนดสิทธิ์ RLS\nALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Public Read for hero_slides" ON public.hero_slides;\nCREATE POLICY "Public Read for hero_slides" ON public.hero_slides FOR SELECT USING (true);\nDROP POLICY IF EXISTS "Public Full Access for hero_slides" ON public.hero_slides;\nCREATE POLICY "Public Full Access for hero_slides" ON public.hero_slides FOR ALL USING (true) WITH CHECK (true);\n\n-- 3. เปิดใช้งาน Supabase Realtime\nDO $$\nBEGIN\n  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN\n    IF NOT EXISTS (\n      SELECT 1 FROM pg_publication_tables \n      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hero_slides'\n    ) THEN\n      ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_slides;\n    END IF;\n  END IF;\nEND $$;`;
                navigator.clipboard.writeText(sqlText);
                toast({ title: 'คัดลอกคำสั่ง SQL แล้ว', description: 'นำไปวางและกด Run ใน Supabase SQL Editor ได้ทันที' });
              }}
              className="gap-1.5"
            >
              <Copy className="w-4 h-4" />
              คัดลอกคำสั่ง SQL
            </Button>
            <Button
              type="button"
              onClick={() => window.open('https://supabase.com/dashboard/project/fhfckuypfstlokashcmu/sql/new', '_blank')}
              className="gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              เปิด Supabase SQL Editor ↗
            </Button>
          </DialogFooter>
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
