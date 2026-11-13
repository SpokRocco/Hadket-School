import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  supabase,
  SUPABASE_PROJECT_REF,
  notifyLocalRealtimeListeners,
  subscribeToRealtimeTables,
} from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Palette,
  Music,
  Dumbbell,
  Heart,
  Trophy,
  Users,
  Gamepad2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Crop,
  ZoomIn,
  ZoomOut,
  Sliders,
  Sparkles,
  ExternalLink,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { cropImageToDataUrl } from '@/utils/imageUtils';
import { SUPABASE_CURRICULUM_MIGRATION_SQL } from '@/utils/supabaseMigrationSql';
import {
  fetchSyncedCurriculumBundle,
  getCurriculumImageStyle,
  normalizeDirectImageUrl,
  saveCurriculumJsonToSchoolSettings,
  type CurriculumActivityItem,
} from '@/utils/curriculumUtils';

const iconOptions = [
  { value: 'Palette', label: 'ศิลปะ', icon: Palette },
  { value: 'Music', label: 'ดนตรี', icon: Music },
  { value: 'Dumbbell', label: 'กีฬา', icon: Dumbbell },
  { value: 'BookOpen', label: 'หนังสือ', icon: BookOpen },
  { value: 'Heart', label: 'จิตอาสา', icon: Heart },
  { value: 'Trophy', label: 'ถ้วยรางวัล', icon: Trophy },
  { value: 'Users', label: 'กลุ่ม', icon: Users },
  { value: 'Gamepad2', label: 'เกม', icon: Gamepad2 },
];

export const ActivitiesManagement = () => {
  const [activities, setActivities] = useState<CurriculumActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CurriculumActivityItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Palette',
    image_url: '',
    image_position: 'center center',
    image_scale: 1,
    is_active: true,
  });

  // Crop Tool State
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropAspectRatio, setCropAspectRatio] = useState<number>(16 / 10);
  const [cropFocalX, setCropFocalX] = useState<number>(50);
  const [cropFocalY, setCropFocalY] = useState<number>(50);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [isCropping, setIsCropping] = useState(false);

  // SQL Helper State
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const { toast } = useToast();

  const fetchActivities = useCallback(async () => {
    try {
      const bundle = await fetchSyncedCurriculumBundle({ activeOnly: false });
      setActivities(bundle.activities);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลกิจกรรมได้',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchActivities();
    return subscribeToRealtimeTables(
      'realtime_activities_admin',
      ['curriculum_activities', 'school_settings'],
      fetchActivities
    );
  }, [fetchActivities]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Palette',
      image_url: '',
      image_position: 'center center',
      image_scale: 1,
      is_active: true,
    });
    setEditingActivity(null);
  };

  const handleOpenDialog = (activity?: CurriculumActivityItem) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        name: activity.name,
        description: activity.description || '',
        icon: activity.icon || 'Palette',
        image_url: activity.image_url || '',
        image_position: activity.image_position || 'center center',
        image_scale: activity.image_scale || 1,
        is_active: activity.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'กรุณากรอกชื่อกิจกรรม' });
      return;
    }

    const normalizedUrl = normalizeDirectImageUrl(formData.image_url);
    setSaving(true);

    try {
      const fullFields = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        image_url: normalizedUrl || null,
        image_position: formData.image_position || 'center center',
        image_scale: Number(formData.image_scale) || 1,
        is_active: formData.is_active,
      };

      const coreFields = {
        name: fullFields.name,
        description: fullFields.description,
        icon: fullFields.icon,
        image_url: normalizedUrl || null,
        is_active: fullFields.is_active,
      };

      const minimalFields = {
        name: fullFields.name,
        description: fullFields.description,
        icon: fullFields.icon,
        is_active: fullFields.is_active,
      };

      if (editingActivity) {
        let res = await (supabase as any)
          .from('curriculum_activities')
          .update(fullFields)
          .eq('id', editingActivity.id)
          .select()
          .maybeSingle();

        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_activities')
            .update(coreFields)
            .eq('id', editingActivity.id)
            .select()
            .maybeSingle();
        }
        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_activities')
            .update(minimalFields)
            .eq('id', editingActivity.id)
            .select()
            .maybeSingle();
        }
        if (res.error) throw res.error;

        const updatedList = activities.map((a) =>
          a.id === editingActivity.id
            ? { ...a, ...fullFields }
            : a
        );
        setActivities(updatedList);
        await saveCurriculumJsonToSchoolSettings('curriculum_activities_json', updatedList);

        toast({ title: 'สำเร็จ', description: 'แก้ไขกิจกรรมเรียบร้อยแล้ว' });
      } else {
        const maxOrder =
          activities.length > 0 ? Math.max(...activities.map((a) => a.order_position || 0)) : 0;

        let res = await (supabase as any)
          .from('curriculum_activities')
          .insert({ ...fullFields, order_position: maxOrder + 1 })
          .select()
          .maybeSingle();

        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_activities')
            .insert({ ...coreFields, order_position: maxOrder + 1 })
            .select()
            .maybeSingle();
        }
        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_activities')
            .insert({ ...minimalFields, order_position: maxOrder + 1 })
            .select()
            .maybeSingle();
        }
        if (res.error) throw res.error;

        const newId = res.data?.id || `activity-${Date.now()}`;
        const inserted: CurriculumActivityItem = {
          id: String(newId),
          ...fullFields,
          order_position: maxOrder + 1,
        };
        const updatedList = [...activities, inserted];
        setActivities(updatedList);
        await saveCurriculumJsonToSchoolSettings('curriculum_activities_json', updatedList);

        toast({ title: 'สำเร็จ', description: 'เพิ่มกิจกรรมใหม่เรียบร้อยแล้ว' });
      }

      setIsDialogOpen(false);
      resetForm();
      notifyLocalRealtimeListeners('curriculum_activities');
      notifyLocalRealtimeListeners('school_settings');
      fetchActivities();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error?.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบกิจกรรมนี้หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('curriculum_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const remaining = activities.filter((a) => a.id !== id);
      setActivities(remaining);
      await saveCurriculumJsonToSchoolSettings('curriculum_activities_json', remaining);
      notifyLocalRealtimeListeners('curriculum_activities');

      toast({ title: 'สำเร็จ', description: 'ลบกิจกรรมเรียบร้อยแล้ว' });
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบข้อมูลได้',
      });
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    const clone = [...activities];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIndex, 0, moved);
    const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
    setActivities(reordered);

    try {
      await Promise.all(
        reordered.map((item) =>
          supabase
            .from('curriculum_activities')
            .update({ order_position: item.order_position })
            .eq('id', item.id)
        )
      );
      await saveCurriculumJsonToSchoolSettings('curriculum_activities_json', reordered);
      notifyLocalRealtimeListeners('curriculum_activities');
      toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับกิจกรรมเสริมใหม่แล้ว' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกลำดับได้',
      });
      fetchActivities();
    }
  };

  const handleApplyCrop = async () => {
    const src = normalizeDirectImageUrl(formData.image_url);
    if (!src) return;
    try {
      setIsCropping(true);
      const croppedUrl = await cropImageToDataUrl(
        src,
        cropAspectRatio,
        cropFocalX,
        cropFocalY,
        cropZoom
      );
      setFormData((prev) => ({
        ...prev,
        image_url: croppedUrl,
        image_position: 'center center',
        image_scale: 1,
      }));
      setShowCropDialog(false);
      toast({
        title: 'ครอบตัดรูปภาพสำเร็จ',
        description: 'นำภาพที่ครอบตัดใหม่มาใช้งานเรียบร้อยแล้ว',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'ครอบตัดภาพไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาดในการครอบตัดรูปภาพ',
      });
    } finally {
      setIsCropping(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_CURRICULUM_MIGRATION_SQL);
      setCopiedSql(true);
      toast({ title: 'คัดลอกคำสั่ง SQL แล้ว' });
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      toast({ variant: 'destructive', title: 'คัดลอกไม่สำเร็จ' });
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((i) => i.value === iconName);
    return iconOption ? iconOption.icon : Palette;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className="bg-sky-600 text-white gap-1">
              <Sparkles className="w-3 h-3" />
              Full Control · Unlimited Upload
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            จัดการกิจกรรมเสริมหลักสูตร
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            เพิ่ม แก้ไข จัดลำดับ และอัปโหลดรูปภาพจริงของกิจกรรมชมรม (ซิงค์ระหว่างหน้าหลักและ /curriculum#activities)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSqlDialog(true)}
            className="gap-1.5 text-xs"
          >
            <Database className="w-3.5 h-3.5 text-primary" />
            คำสั่ง SQL
          </Button>
          <Button type="button" variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link to="/curriculum#activities" target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              ดูหน้ากิจกรรมจริง
            </Link>
          </Button>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มกิจกรรม
          </Button>
        </div>
      </div>

      {/* Add/Edit Activity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'แก้ไขกิจกรรมเสริมหลักสูตร' : 'เพิ่มกิจกรรมเสริมใหม่'}
            </DialogTitle>
            <DialogDescription>
              อัปโหลดรูปภาพจริงได้ไม่จำกัดขนาด พร้อมจัดวางจุดโฟกัสและครอบตัดรูปภาพ
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2 p-3.5 rounded-xl bg-secondary/40 border border-border">
              <Label className="flex items-center gap-1.5 font-semibold">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>รูปภาพจริงประจำกิจกรรม (Full Control ไม่จำกัดขนาดไฟล์)</span>
              </Label>
              <ImageUpload
                currentImage={formData.image_url}
                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                bucket="images"
                folder="curriculum_activities"
                maxSizeMB={0}
                compressionPreset="event"
              />
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-muted-foreground">
                  หรือวาง URL ลิงก์รูปภาพโดยตรง (Google Drive / HTTPS URL):
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://... หรือลิงก์รูปภาพ"
                  />
                  {formData.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          image_url: '',
                          image_position: 'center center',
                          image_scale: 1,
                        })
                      }
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      ลบรูป
                    </Button>
                  )}
                </div>
              </div>

              {formData.image_url && (
                <div className="p-3 rounded-xl bg-card border border-border space-y-2.5 mt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      ปรับตำแหน่ง & ซูมภาพ
                    </Label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => setShowCropDialog(true)}
                    >
                      <Crop className="w-3.5 h-3.5 text-amber-500" />
                      ครอบตัด (Crop)
                    </Button>
                  </div>

                  <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-950 border">
                    <img
                      src={normalizeDirectImageUrl(formData.image_url)}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      style={getCurriculumImageStyle(formData.image_position, formData.image_scale)}
                      className="w-full h-full object-cover transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {[
                        { value: 'center top', label: 'บน' },
                        { value: 'center center', label: 'กลาง' },
                        { value: 'center bottom', label: 'ล่าง' },
                        { value: 'left center', label: 'ซ้าย' },
                        { value: 'right center', label: 'ขวา' },
                      ].map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.image_position || 'center center') === opt.value
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, image_position: opt.value }))
                          }
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            image_scale: Math.max(
                              0.7,
                              Number(((prev.image_scale || 1) - 0.1).toFixed(2))
                            ),
                          }))
                        }
                      >
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant={formData.image_scale === 1 ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs px-2 font-mono"
                        onClick={() => setFormData((prev) => ({ ...prev, image_scale: 1 }))}
                      >
                        {((formData.image_scale || 1) * 100).toFixed(0)}%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            image_scale: Math.min(
                              2.2,
                              Number(((prev.image_scale || 1) + 0.1).toFixed(2))
                            ),
                          }))
                        }
                      >
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อกิจกรรม *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น ชมรมศิลปะและหัตถกรรม"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="เช่น วาดภาพ ปั้น และงานประดิษฐ์สร้างสรรค์"
              />
            </div>

            <div className="space-y-2">
              <Label>ไอคอน</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกไอคอน" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>แสดงบนเว็บไซต์</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : editingActivity ? 'บันทึก' : 'เพิ่ม'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-amber-500" />
              ครอบตัดรูปภาพกิจกรรม
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { label: '16:10 (การ์ดกิจกรรม)', ratio: 16 / 10 },
                { label: '4:3', ratio: 4 / 3 },
                { label: '1:1 (สี่เหลี่ยมจัตุรัส)', ratio: 1 },
              ].map((opt) => (
                <Button
                  key={opt.label}
                  type="button"
                  size="sm"
                  variant={Math.abs(cropAspectRatio - opt.ratio) < 0.01 ? 'default' : 'outline'}
                  onClick={() => setCropAspectRatio(opt.ratio)}
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {formData.image_url && (
              <div
                className="relative w-full overflow-hidden rounded-xl border bg-slate-950"
                style={{ aspectRatio: String(cropAspectRatio), maxHeight: '260px' }}
              >
                <img
                  src={normalizeDirectImageUrl(formData.image_url)}
                  alt="Crop Preview"
                  referrerPolicy="no-referrer"
                  style={{
                    objectPosition: `${cropFocalX}% ${cropFocalY}%`,
                    transform: `scale(${cropZoom})`,
                    transformOrigin: `${cropFocalX}% ${cropFocalY}%`,
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">X ({cropFocalX}%)</Label>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={cropFocalX}
                  onChange={(e) => setCropFocalX(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y ({cropFocalY}%)</Label>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={cropFocalY}
                  onChange={(e) => setCropFocalY(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ซูม ({cropZoom.toFixed(1)}x)</Label>
                <Input
                  type="range"
                  min={1}
                  max={2.2}
                  step={0.1}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCropDialog(false)}>
              ปิด
            </Button>
            <Button type="button" onClick={handleApplyCrop} disabled={isCropping}>
              {isCropping ? 'กำลังครอบตัด...' : 'นำภาพมาใช้งาน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SQL Modal */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              คำสั่ง SQL สำหรับฐานข้อมูลหลักสูตรและกิจกรรมเสริม (Supabase)
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleCopySql} className="gap-1.5">
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedSql ? 'คัดลอกแล้ว' : 'คัดลอก SQL'}
            </Button>
            <Button type="button" size="sm" variant="outline" asChild className="gap-1.5">
              <a
                href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                เปิด Supabase SQL Editor
              </a>
            </Button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs overflow-x-auto max-h-[380px] font-mono leading-relaxed">
            {SUPABASE_CURRICULUM_MIGRATION_SQL}
          </pre>
        </DialogContent>
      </Dialog>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Palette className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูลกิจกรรม</h3>
            <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มกิจกรรมได้เลย</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มกิจกรรมแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activities.map((activity, idx) => {
            const IconComponent = getIconComponent(activity.icon);
            const imgUrl = normalizeDirectImageUrl(activity.image_url);
            return (
              <Card key={activity.id} className={`${!activity.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4 text-center">
                  <div className="flex justify-end mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">#{idx + 1}</span>
                  </div>
                  {imgUrl ? (
                    <div className="w-full h-28 mb-3 rounded-lg overflow-hidden border border-border relative bg-slate-900">
                      <img
                        src={imgUrl}
                        alt={activity.name}
                        referrerPolicy="no-referrer"
                        style={getCurriculumImageStyle(
                          activity.image_position,
                          activity.image_scale
                        )}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white">
                        <IconComponent className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <h3 className="font-bold text-foreground mb-1">{activity.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {activity.description || '-'}
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      title="เลื่อนขึ้น"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      disabled={idx === activities.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      title="เลื่อนลง"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(activity)}
                      className="text-xs px-2"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      แก้ไข
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(activity.id)}
                      className="text-xs px-2"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
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
