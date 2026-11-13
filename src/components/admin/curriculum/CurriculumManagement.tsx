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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  FlaskConical,
  Languages,
  Calculator,
  Monitor,
  Palette,
  Music,
  Dumbbell,
  GraduationCap,
  Award,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Layers,
  Database,
  ExternalLink,
  Copy,
  Check,
  Crop,
  ZoomIn,
  ZoomOut,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link2,
} from 'lucide-react';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { cropImageToDataUrl } from '@/utils/imageUtils';
import { SUPABASE_CURRICULUM_MIGRATION_SQL } from '@/utils/supabaseMigrationSql';
import {
  DEFAULT_CURRICULUM_LEVELS,
  fetchSyncedCurriculumBundle,
  getCurriculumImageStyle,
  isLegacyHighSchoolTemplateProgram,
  matchGradesToLevel,
  normalizeCurriculumLevel,
  normalizeDirectImageUrl,
  resolveLevelHref,
  saveCurriculumJsonToSchoolSettings,
  type CurriculumLevelItem,
  type CurriculumProgramItem,
  type GradeDataRow,
  type LevelPattern,
} from '@/utils/curriculumUtils';

const iconOptions = [
  { value: 'FlaskConical', label: 'วิทยาศาสตร์', icon: FlaskConical },
  { value: 'Languages', label: 'ภาษา', icon: Languages },
  { value: 'Calculator', label: 'คำนวณ', icon: Calculator },
  { value: 'Monitor', label: 'คอมพิวเตอร์', icon: Monitor },
  { value: 'BookOpen', label: 'หนังสือ', icon: BookOpen },
  { value: 'Palette', label: 'ศิลปะ / ปฐมวัย', icon: Palette },
  { value: 'Music', label: 'ดนตรี', icon: Music },
  { value: 'Dumbbell', label: 'กีฬา', icon: Dumbbell },
  { value: 'GraduationCap', label: 'การศึกษา', icon: GraduationCap },
];

const colorOptions = [
  { value: 'bg-sky-600', label: 'ฟ้าสดใส (ประถมศึกษา)' },
  { value: 'bg-amber-500', label: 'ส้มทอง (ปฐมวัย)' },
  { value: 'bg-indigo-600', label: 'น้ำเงินคราม (มัธยมต้น)' },
  { value: 'bg-blue-500', label: 'น้ำเงิน' },
  { value: 'bg-purple-500', label: 'ม่วง' },
  { value: 'bg-green-500', label: 'เขียว' },
  { value: 'bg-orange-500', label: 'ส้ม' },
  { value: 'bg-red-500', label: 'แดง' },
  { value: 'bg-pink-500', label: 'ชมพู' },
  { value: 'bg-teal-500', label: 'เขียวน้ำทะเล' },
];

const levelPatternOptions: { value: LevelPattern; label: string }[] = [
  { value: 'kindergarten', label: 'เชื่อมข้อมูลระดับปฐมวัย (อนุบาล)' },
  { value: 'primary', label: 'เชื่อมข้อมูลระดับประถมศึกษา (ป.1 – ป.6)' },
  { value: 'lower-sec', label: 'เชื่อมข้อมูลระดับมัธยมศึกษาตอนต้น (ม.1 – ม.3)' },
  { value: 'upper-sec', label: 'เชื่อมข้อมูลระดับมัธยมศึกษาตอนปลาย (ม.4 – ม.6)' },
  { value: 'custom', label: 'กำหนดเอง (ไม่ผูกอัตโนมัติ)' },
];

const parseListInput = (text: string): string[] =>
  text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export const CurriculumManagement = () => {
  const [activeTab, setActiveTab] = useState<'levels' | 'programs'>('levels');
  const [levels, setLevels] = useState<CurriculumLevelItem[]>([]);
  const [programs, setPrograms] = useState<CurriculumProgramItem[]>([]);
  const [grades, setGrades] = useState<GradeDataRow[]>([]);
  const [levelsTableReady, setLevelsTableReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Level Dialog State
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CurriculumLevelItem | null>(null);
  const [levelForm, setLevelForm] = useState({
    id: '',
    title: '',
    subtitle: '',
    description: '',
    level_pattern: 'custom' as LevelPattern,
    subjects: '',
    highlights: '',
    image_url: '',
    image_position: 'center center',
    image_scale: 1,
    href: '',
    icon: 'GraduationCap',
    color: 'bg-sky-600',
    sync_grade_stats: true,
    is_active: true,
  });

  // Program Dialog State
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CurriculumProgramItem | null>(null);
  const [programForm, setProgramForm] = useState({
    title: '',
    description: '',
    icon: 'BookOpen',
    color: 'bg-blue-500',
    target_level: 'all',
    subjects: '',
    careers: '',
    image_url: '',
    image_position: 'center center',
    image_scale: 1,
    is_active: true,
  });

  // Crop Tool State
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropTarget, setCropTarget] = useState<'level' | 'program'>('level');
  const [cropAspectRatio, setCropAspectRatio] = useState<number>(4 / 3);
  const [cropFocalX, setCropFocalX] = useState<number>(50);
  const [cropFocalY, setCropFocalY] = useState<number>(50);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [isCropping, setIsCropping] = useState(false);

  // SQL Dialog State
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const { toast } = useToast();

  const loadAllData = useCallback(async () => {
    try {
      const bundle = await fetchSyncedCurriculumBundle({ activeOnly: false });
      setLevels(bundle.levels);
      setPrograms(bundle.programs);
      setGrades(bundle.grades);
      setLevelsTableReady(bundle.levelsTableExists);
    } catch (error: any) {
      console.error('Error fetching curriculum bundle:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
    return subscribeToRealtimeTables(
      'realtime_curriculum_admin',
      ['curriculum_levels', 'curriculum_programs', 'grade_data', 'school_settings'],
      loadAllData
    );
  }, [loadAllData]);

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((i) => i.value === iconName);
    return iconOption ? iconOption.icon : BookOpen;
  };

  // =========================================================================
  // LEVEL CRUD (Full Control Dual-Cloud Sync)
  // =========================================================================
  const persistLevels = async (
    nextLevels: CurriculumLevelItem[],
    successMsg = 'บันทึกข้อมูลหลักสูตรตามระดับชั้นสำเร็จ'
  ) => {
    const ordered = nextLevels.map((lvl, idx) =>
      normalizeCurriculumLevel({ ...lvl, order_position: idx + 1 }, idx)
    );
    setLevels(ordered);
    setSaving(true);

    try {
      // 1. Always update Dual-Cloud backup in school_settings & local cache
      await saveCurriculumJsonToSchoolSettings('curriculum_levels_json', ordered);

      // 2. Sync to dedicated curriculum_levels table
      let tableSynced = false;
      try {
        const records = ordered.map((lvl, idx) => ({
          id: lvl.id,
          title: lvl.title,
          subtitle: lvl.subtitle,
          description: lvl.description,
          level_pattern: lvl.level_pattern,
          subjects: lvl.subjects,
          highlights: lvl.highlights,
          image_url: lvl.image_url || '',
          image_position: lvl.image_position || 'center center',
          image_scale: Number(lvl.image_scale) || 1,
          href: resolveLevelHref(lvl),
          icon: lvl.icon,
          color: lvl.color,
          sync_grade_stats: lvl.sync_grade_stats,
          order_position: idx + 1,
          is_active: lvl.is_active,
          updated_at: new Date().toISOString(),
        }));

        if (records.length > 0) {
          const { error: upsertErr } = await (supabase as any)
            .from('curriculum_levels')
            .upsert(records, { onConflict: 'id' });
          if (!upsertErr) {
            tableSynced = true;
            setLevelsTableReady(true);
          } else {
            console.warn('curriculum_levels table upsert note:', upsertErr.message);
          }
        }
      } catch (err) {
        console.warn('curriculum_levels sync skipped:', err);
      }

      notifyLocalRealtimeListeners('curriculum_levels');
      notifyLocalRealtimeListeners('school_settings');

      toast({
        title: tableSynced ? 'สำเร็จ (Supabase + Realtime)' : 'สำเร็จ (Dual-Cloud Sync)',
        description: successMsg,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error?.message || 'ไม่สามารถบันทึกข้อมูลระดับชั้นได้',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLevelDialog = (level?: CurriculumLevelItem) => {
    if (level) {
      setEditingLevel(level);
      setLevelForm({
        id: level.id,
        title: level.title,
        subtitle: level.subtitle || '',
        description: level.description || '',
        level_pattern: level.level_pattern || 'custom',
        subjects: (level.subjects || []).join(', '),
        highlights: (level.highlights || []).join(', '),
        image_url: level.image_url || '',
        image_position: level.image_position || 'center center',
        image_scale: level.image_scale || 1,
        href: resolveLevelHref(level),
        icon: level.icon || 'GraduationCap',
        color: level.color || 'bg-sky-600',
        sync_grade_stats: level.sync_grade_stats !== false,
        is_active: level.is_active !== false,
      });
    } else {
      const slug = `level-${Date.now()}`;
      setEditingLevel(null);
      setLevelForm({
        id: slug,
        title: '',
        subtitle: '',
        description: '',
        level_pattern: 'custom',
        subjects: '',
        highlights: '',
        image_url: '',
        image_position: 'center center',
        image_scale: 1,
        href: `/curriculum#${slug}`,
        icon: 'GraduationCap',
        color: 'bg-sky-600',
        sync_grade_stats: true,
        is_active: true,
      });
    }
    setIsLevelDialogOpen(true);
  };

  const handleSaveLevelForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.title.trim()) {
      toast({ variant: 'destructive', title: 'กรุณากรอกชื่อระดับชั้น / หลักสูตร' });
      return;
    }

    const cleanId =
      editingLevel?.id ||
      levelForm.id
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-') ||
      `level-${Date.now()}`;

    const itemPayload: CurriculumLevelItem = {
      id: cleanId,
      title: levelForm.title.trim(),
      subtitle: levelForm.subtitle.trim(),
      description: levelForm.description.trim(),
      level_pattern: levelForm.level_pattern,
      subjects: parseListInput(levelForm.subjects),
      highlights: parseListInput(levelForm.highlights),
      image_url: normalizeDirectImageUrl(levelForm.image_url),
      image_position: levelForm.image_position || 'center center',
      image_scale: Number(levelForm.image_scale) || 1,
      href: levelForm.href.trim() || `/curriculum#${cleanId}`,
      icon: levelForm.icon,
      color: levelForm.color,
      sync_grade_stats: levelForm.sync_grade_stats,
      order_position: editingLevel ? editingLevel.order_position : levels.length + 1,
      is_active: levelForm.is_active,
    };

    const updated = editingLevel
      ? levels.map((lvl) => (lvl.id === editingLevel.id ? itemPayload : lvl))
      : [...levels, itemPayload];

    setIsLevelDialogOpen(false);
    await persistLevels(
      updated,
      editingLevel
        ? `อัปเดต "${itemPayload.title}" และซิงค์หน้าแรกกับหน้า /curriculum แล้ว`
        : `เพิ่ม "${itemPayload.title}" เรียบร้อยแล้ว`
    );
  };

  const handleDeleteLevel = async (level: CurriculumLevelItem) => {
    if (!confirm(`ต้องการลบระดับหลักสูตร "${level.title}" หรือไม่?`)) return;

    try {
      await (supabase as any).from('curriculum_levels').delete().eq('id', level.id);
    } catch {
      // ignore if table not ready
    }

    const remaining = levels.filter((lvl) => lvl.id !== level.id);
    await persistLevels(remaining, `ลบ "${level.title}" เรียบร้อยแล้ว`);
  };

  const handleToggleLevelActive = async (level: CurriculumLevelItem, checked: boolean) => {
    const updated = levels.map((lvl) =>
      lvl.id === level.id ? { ...lvl, is_active: checked } : lvl
    );
    await persistLevels(
      updated,
      checked ? `เปิดแสดงผล "${level.title}" แล้ว` : `ปิดซ่อน "${level.title}" แล้ว`
    );
  };

  const handleMoveLevel = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= levels.length) return;
    const clone = [...levels];
    const [moved] = clone.splice(index, 1);
    clone.splice(target, 0, moved);
    await persistLevels(clone, 'จัดเรียงลำดับระดับหลักสูตรใหม่แล้ว');
  };

  const handleResetDefaultLevels = async () => {
    if (
      !confirm(
        'ต้องการรีเซ็ต 3 ระดับชั้นมาตรฐาน (ปฐมวัย, ประถมศึกษา, มัธยมศึกษาตอนต้น) หรือไม่?'
      )
    ) {
      return;
    }
    try {
      await (supabase as any).from('curriculum_levels').delete().neq('id', '_keep_none_');
    } catch {
      // ignore
    }
    const defaults = DEFAULT_CURRICULUM_LEVELS.map((lvl, idx) => ({
      ...lvl,
      order_position: idx + 1,
    }));
    await persistLevels(defaults, 'คืนค่า 3 ระดับหลักสูตรมาตรฐานของโรงเรียนบ้านหาดเค็ดแล้ว');
  };

  // =========================================================================
  // PROGRAM CRUD (Schema-Tolerant + Dual-Cloud Backup)
  // =========================================================================
  const handleOpenProgramDialog = (program?: CurriculumProgramItem) => {
    if (program) {
      setEditingProgram(program);
      setProgramForm({
        title: program.title,
        description: program.description || '',
        icon: program.icon || 'BookOpen',
        color: program.color || 'bg-blue-500',
        target_level: program.target_level || 'all',
        subjects: (program.subjects || []).join(', '),
        careers: (program.careers || []).join(', '),
        image_url: program.image_url || '',
        image_position: program.image_position || 'center center',
        image_scale: program.image_scale || 1,
        is_active: program.is_active !== false,
      });
    } else {
      setEditingProgram(null);
      setProgramForm({
        title: '',
        description: '',
        icon: 'BookOpen',
        color: 'bg-blue-500',
        target_level: 'all',
        subjects: '',
        careers: '',
        image_url: '',
        image_position: 'center center',
        image_scale: 1,
        is_active: true,
      });
    }
    setIsProgramDialogOpen(true);
  };

  const syncProgramsCloudBackup = async (items: CurriculumProgramItem[]) => {
    await saveCurriculumJsonToSchoolSettings('curriculum_programs_json', items);
  };

  const handleSaveProgramForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title.trim()) {
      toast({ variant: 'destructive', title: 'กรุณากรอกชื่อแผนการเรียน / รายวิชา' });
      return;
    }

    const subjectsArray = parseListInput(programForm.subjects);
    const careersArray = parseListInput(programForm.careers);
    const normalizedImage = normalizeDirectImageUrl(programForm.image_url);

    setSaving(true);
    try {
      const fullFields = {
        title: programForm.title.trim(),
        description: programForm.description.trim(),
        icon: programForm.icon,
        color: programForm.color,
        target_level: programForm.target_level || 'all',
        subjects: subjectsArray,
        careers: careersArray,
        image_url: normalizedImage || null,
        image_position: programForm.image_position || 'center center',
        image_scale: Number(programForm.image_scale) || 1,
        is_active: programForm.is_active,
      };

      const coreFields = {
        title: fullFields.title,
        description: fullFields.description,
        icon: fullFields.icon,
        color: fullFields.color,
        subjects: subjectsArray,
        careers: careersArray,
        image_url: normalizedImage || null,
        is_active: fullFields.is_active,
      };

      const minimalFields = {
        title: fullFields.title,
        description: fullFields.description,
        icon: fullFields.icon,
        color: fullFields.color,
        subjects: subjectsArray,
        careers: careersArray,
        is_active: fullFields.is_active,
      };

      let savedRow: any = null;

      if (editingProgram) {
        let res = await (supabase as any)
          .from('curriculum_programs')
          .update(fullFields)
          .eq('id', editingProgram.id)
          .select()
          .maybeSingle();

        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_programs')
            .update(coreFields)
            .eq('id', editingProgram.id)
            .select()
            .maybeSingle();
        }
        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_programs')
            .update(minimalFields)
            .eq('id', editingProgram.id)
            .select()
            .maybeSingle();
        }
        if (res.error) throw res.error;
        savedRow = res.data || { ...editingProgram, ...fullFields };

        const updatedList = programs.map((p) =>
          p.id === editingProgram.id ? { ...p, ...savedRow, ...fullFields } : p
        );
        setPrograms(updatedList);
        await syncProgramsCloudBackup(updatedList);

        toast({ title: 'สำเร็จ', description: 'แก้ไขรายวิชา / แผนการเรียนเรียบร้อยแล้ว' });
      } else {
        const maxOrder =
          programs.length > 0 ? Math.max(...programs.map((p) => p.order_position || 0)) : 0;

        let res = await (supabase as any)
          .from('curriculum_programs')
          .insert({ ...fullFields, order_position: maxOrder + 1 })
          .select()
          .maybeSingle();

        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_programs')
            .insert({ ...coreFields, order_position: maxOrder + 1 })
            .select()
            .maybeSingle();
        }
        if (res.error) {
          res = await (supabase as any)
            .from('curriculum_programs')
            .insert({ ...minimalFields, order_position: maxOrder + 1 })
            .select()
            .maybeSingle();
        }
        if (res.error) throw res.error;

        const newId = res.data?.id || `program-${Date.now()}`;
        const insertedItem: CurriculumProgramItem = {
          id: String(newId),
          ...fullFields,
          order_position: maxOrder + 1,
        };
        const updatedList = [...programs, insertedItem];
        setPrograms(updatedList);
        await syncProgramsCloudBackup(updatedList);

        toast({ title: 'สำเร็จ', description: 'เพิ่มรายวิชา / แผนการเรียนใหม่เรียบร้อยแล้ว' });
      }

      setIsProgramDialogOpen(false);
      notifyLocalRealtimeListeners('curriculum_programs');
      notifyLocalRealtimeListeners('school_settings');
      loadAllData();
    } catch (error: any) {
      console.error('Error saving program:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error?.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async (program: CurriculumProgramItem) => {
    if (!confirm(`ต้องการลบ "${program.title}" หรือไม่?`)) return;

    try {
      const { error } = await supabase
        .from('curriculum_programs')
        .delete()
        .eq('id', program.id);
      if (error) throw error;

      const remaining = programs.filter((p) => p.id !== program.id);
      setPrograms(remaining);
      await syncProgramsCloudBackup(remaining);
      notifyLocalRealtimeListeners('curriculum_programs');

      toast({ title: 'สำเร็จ', description: `ลบ "${program.title}" เรียบร้อยแล้ว` });
    } catch (error: any) {
      console.error('Error deleting program:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบข้อมูลได้',
      });
    }
  };

  const handleCleanupLegacyTemplates = async () => {
    const legacyRows = programs.filter((p) => isLegacyHighSchoolTemplateProgram(p));
    if (legacyRows.length === 0) return;
    if (
      !confirm(
        `พบหลักสูตรตัวอย่าง ม.ปลาย เดิมจำนวน ${legacyRows.length} รายการ ต้องการลบเฉพาะรายการตัวอย่างเดิมเหล่านี้ออกหรือไม่?`
      )
    ) {
      return;
    }

    try {
      for (const row of legacyRows) {
        await supabase.from('curriculum_programs').delete().eq('id', row.id);
      }
      const remaining = programs.filter((p) => !isLegacyHighSchoolTemplateProgram(p));
      setPrograms(remaining);
      await syncProgramsCloudBackup(remaining);
      notifyLocalRealtimeListeners('curriculum_programs');
      toast({
        title: 'ล้างข้อมูลตัวอย่างเดิมเรียบร้อย',
        description: `ลบรายการตัวอย่างเดิม ${legacyRows.length} รายการออกแล้ว`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'ลบไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาดระหว่างลบข้อมูลตัวอย่าง',
      });
    }
  };

  const handleMoveProgramOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= programs.length) return;

    const clone = [...programs];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIndex, 0, moved);
    const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
    setPrograms(reordered);

    try {
      await Promise.all(
        reordered.map((item) =>
          supabase
            .from('curriculum_programs')
            .update({ order_position: item.order_position })
            .eq('id', item.id)
        )
      );
      await syncProgramsCloudBackup(reordered);
      notifyLocalRealtimeListeners('curriculum_programs');
      toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับหลักสูตรใหม่แล้ว' });
    } catch {
      toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกลำดับได้' });
      loadAllData();
    }
  };

  // =========================================================================
  // CROP TOOL HELPERS
  // =========================================================================
  const openCropTool = (target: 'level' | 'program') => {
    setCropTarget(target);
    setCropAspectRatio(target === 'level' ? 4 / 3 : 16 / 9);
    setCropFocalX(50);
    setCropFocalY(50);
    setCropZoom(1);
    setShowCropDialog(true);
  };

  const currentCropImage =
    cropTarget === 'level' ? levelForm.image_url : programForm.image_url;

  const handleApplyCrop = async () => {
    const src = normalizeDirectImageUrl(currentCropImage);
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
      if (cropTarget === 'level') {
        setLevelForm((prev) => ({
          ...prev,
          image_url: croppedUrl,
          image_position: 'center center',
          image_scale: 1,
        }));
      } else {
        setProgramForm((prev) => ({
          ...prev,
          image_url: croppedUrl,
          image_position: 'center center',
          image_scale: 1,
        }));
      }
      setShowCropDialog(false);
      toast({
        title: 'ครอบตัดรูปภาพสำเร็จ',
        description: 'นำภาพที่จัดสัดส่วนใหม่มาใช้งานเรียบร้อย (อย่าลืมกดบันทึก)',
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
      toast({ title: 'คัดลอกคำสั่ง SQL แล้ว', description: 'นำไปวางและกด Run ใน Supabase SQL Editor ได้เลย' });
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      toast({ variant: 'destructive', title: 'คัดลอกไม่สำเร็จ' });
    }
  };

  const legacyTemplateCount = programs.filter((p) => isLegacyHighSchoolTemplateProgram(p)).length;

  const renderFramingControls = (
    imageUrl: string,
    position: string,
    scale: number,
    onChangePos: (pos: string) => void,
    onChangeScale: (sc: number) => void,
    target: 'level' | 'program'
  ) => {
    if (!imageUrl) return null;
    const displayUrl = normalizeDirectImageUrl(imageUrl);

    return (
      <div className="p-3.5 rounded-xl bg-card border border-border space-y-3 mt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            ปรับตำแหน่งภาพ (Focal Point) & ซูม (Zoom / Scale)
          </Label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={() => openCropTool(target)}
          >
            <Crop className="w-3.5 h-3.5 text-amber-500" />
            ครอบตัดรูปภาพ (Crop)
          </Button>
        </div>

        <div className="relative w-full aspect-[4/3] max-h-52 rounded-lg overflow-hidden bg-slate-950 border border-slate-700">
          <img
            src={displayUrl}
            alt="Framing Preview"
            referrerPolicy="no-referrer"
            style={getCurriculumImageStyle(position, scale)}
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 text-white px-2 py-0.5 rounded font-mono">
            ตำแหน่ง: {position || 'center center'} · ซูม: {((scale || 1) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground block font-medium">
              จุดโฟกัสของรูปภาพ:
            </span>
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
                  variant={(position || 'center center') === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => onChangePos(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground block font-medium">
              ระดับการซูม:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 gap-1"
                onClick={() => onChangeScale(Math.max(0.7, Number(((scale || 1) - 0.1).toFixed(2))))}
              >
                <ZoomOut className="w-3 h-3" /> -10%
              </Button>
              <Button
                type="button"
                variant={scale === 1 ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2 font-mono"
                onClick={() => onChangeScale(1)}
              >
                100%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 gap-1"
                onClick={() => onChangeScale(Math.min(2.2, Number(((scale || 1) + 0.1).toFixed(2))))}
              >
                <ZoomIn className="w-3 h-3" /> +10%
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">กำลังโหลดข้อมูลหลักสูตร...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge className="bg-sky-600 text-white gap-1">
              <Sparkles className="w-3 h-3" />
              Full Control · Unlimited Upload
            </Badge>
            {levelsTableReady ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Supabase Connected (curriculum_levels + programs)
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Dual-Cloud Active (แนะนำรัน SQL เพื่อสร้างตาราง curriculum_levels)
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            จัดการหลักสูตรการศึกษา (หน้าหลัก ↔ หน้าใน)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ซิงค์ข้อมูล 3 ระดับชั้น (ปฐมวัย · ประถม · ม.ต้น) รูปภาพจริง ลิงก์เชื่อมโยง และรายวิชาเพิ่มเติมเข้ากับฐานข้อมูล Supabase โดยตรง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSqlDialog(true)} className="gap-1.5 text-xs">
            <Database className="w-3.5 h-3.5 text-primary" />
            คำสั่ง SQL (Supabase)
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link to="/#curriculum" target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              ดูหน้าแรก
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link to="/curriculum" target="_blank">
              <Link2 className="w-3.5 h-3.5" />
              ดูหน้าหลักสูตรจริง (/curriculum)
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Tabs: Curriculum Levels vs Additional Programs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'levels' | 'programs')}>
        <TabsList className="grid w-full max-w-xl grid-cols-2">
          <TabsTrigger value="levels" className="gap-2">
            <Layers className="w-4 h-4" />
            1. หลักสูตรตามระดับชั้น ({levels.length})
          </TabsTrigger>
          <TabsTrigger value="programs" className="gap-2">
            <BookOpen className="w-4 h-4" />
            2. รายวิชาเพิ่มเติม / แผนการเรียน ({programs.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CURRICULUM LEVELS */}
        <TabsContent value="levels" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/40 border border-border">
            <div className="space-y-1">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                ระดับหลักสูตรที่เปิดสอน (ซิงค์การ์ดหน้าหลัก ↔ หน้า /curriculum)
              </h2>
              <p className="text-xs text-muted-foreground">
                อัปโหลดรูปภาพจริงของแต่ละระดับชั้นโดยไม่จำกัดขนาดไฟล์ ระบบจะแสดงรูปและลิงก์ตรงกันทั้งหน้าแรกและหน้าหลักสูตรด้านใน (ดึงยอดห้อง/นักเรียนจริงจากตาราง grade_data อัตโนมัติ)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetDefaultLevels}
                disabled={saving}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ต 3 ระดับมาตรฐาน
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenLevelDialog()}
                disabled={saving}
                className="gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                เพิ่มระดับหลักสูตร
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {levels.map((level, idx) => {
              const IconComponent = getIconComponent(level.icon);
              const matchedStats = level.sync_grade_stats
                ? matchGradesToLevel(grades, level.level_pattern || level.id)
                : null;
              const imgUrl = normalizeDirectImageUrl(level.image_url);

              return (
                <Card
                  key={level.id}
                  className={`overflow-hidden flex flex-col border-border ${
                    !level.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {/* Visual Preview */}
                  <div className="relative h-48 bg-slate-900 overflow-hidden flex items-end">
                    {imgUrl ? (
                      <>
                        <img
                          src={imgUrl}
                          alt={level.title}
                          referrerPolicy="no-referrer"
                          style={getCurriculumImageStyle(level.image_position, level.image_scale)}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
                      </>
                    ) : (
                      <div className={`w-full h-full ${level.color || 'bg-sky-600'} bg-opacity-90 flex flex-col items-center justify-center p-4 text-white/90`}>
                        <IconComponent className="w-10 h-10 mb-2 opacity-90" />
                        <span className="text-[11px] bg-black/35 px-2.5 py-1 rounded-full">
                          ยังไม่ได้อัปโหลดรูปภาพจริง
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <Badge className="bg-black/65 text-white border-0 text-[10px] font-mono">
                        #{idx + 1} · {level.id}
                      </Badge>
                    </div>
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-full">
                      <Switch
                        checked={level.is_active}
                        onCheckedChange={(checked) => handleToggleLevelActive(level, checked)}
                      />
                    </div>

                    {imgUrl && (
                      <div className="relative z-10 p-3.5 w-full">
                        <p className="text-[11px] text-sky-300 font-medium line-clamp-1">
                          {level.subtitle}
                        </p>
                        <h3 className="text-white font-bold text-base line-clamp-1">
                          {level.title}
                        </h3>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col space-y-3">
                    {!imgUrl && (
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{level.title}</h3>
                        <p className="text-xs text-muted-foreground">{level.subtitle}</p>
                      </div>
                    )}

                    {matchedStats && matchedStats.levelCount > 0 ? (
                      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300 font-medium">
                        📊 ซิงค์จาก Supabase: {matchedStats.summaryText}
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-muted text-xs text-muted-foreground">
                        {level.sync_grade_stats
                          ? 'ยังไม่พบข้อมูลชั้นเรียนในตาราง grade_data ที่ตรงกัน'
                          : 'แสดงคำอธิบายแบบกำหนดเอง'}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1 flex-1">
                      <p className="line-clamp-2">{level.description || '-'}</p>
                      <p className="font-mono text-[11px] text-primary pt-1">
                        🔗 ลิงก์: {resolveLevelHref(level)}
                      </p>
                      <p className="text-[11px]">
                        กลุ่มสาระฯ/รายวิชา: {level.subjects?.length || 0} รายการ
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={idx === 0 || saving}
                        onClick={() => handleMoveLevel(idx, 'up')}
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={idx === levels.length - 1 || saving}
                        onClick={() => handleMoveLevel(idx, 'down')}
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => handleOpenLevelDialog(level)}
                        className="flex-1 gap-1 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        แก้ไข / อัปโหลดรูป
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteLevel(level)}
                        className="px-2.5"
                        title="ลบระดับชั้น"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: CURRICULUM PROGRAMS */}
        <TabsContent value="programs" className="space-y-6 mt-6">
          {legacyTemplateCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    พบข้อมูลหลักสูตรตัวอย่างเดิมระดับ ม.ปลาย ({legacyTemplateCount} รายการ เช่น วิทย์-คณิต เตรียมแพทย์, ศิลป์-ภาษา ฝรั่งเศส)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    คุณสามารถกดปุ่มด้านขวาเพื่อลบเฉพาะรายการตัวอย่างเดิม หรือกดแก้ไขแต่ละรายการให้ตรงกับโรงเรียนบ้านหาดเค็ดได้ทันที
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCleanupLegacyTemplates}
                className="border-amber-500/50 text-amber-700 dark:text-amber-300 shrink-0 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                ล้างหลักสูตรตัวอย่าง ม.ปลาย เดิม
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                รายวิชาเพิ่มเติมและแผนการเรียนรู้ (curriculum_programs)
              </h2>
              <p className="text-xs text-muted-foreground">
                เพิ่ม แก้ไข จัดลำดับ เชื่อมโยงระดับชั้น และอัปโหลดรูปภาพจริงได้ไม่จำกัดขนาดไฟล์
              </p>
            </div>
            <Button onClick={() => handleOpenProgramDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มรายวิชา / แผนการเรียน
            </Button>
          </div>

          {programs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">ยังไม่มีรายวิชาเพิ่มเติมในฐานข้อมูล</h3>
                <p className="text-muted-foreground mb-4">
                  คุณสามารถเพิ่มรายวิชาเพิ่มเติมหรือโครงงานเด่นของโรงเรียนได้ทันที (ส่วนระดับชั้นหลัก 3 ระดับแสดงผลจากแท็บ 1 แล้ว)
                </p>
                <Button onClick={() => handleOpenProgramDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มรายวิชาเพิ่มเติมแรก
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {programs.map((program, idx) => {
                const IconComponent = getIconComponent(program.icon);
                const targetLevelObj = levels.find((l) => l.id === program.target_level);
                const imgUrl = normalizeDirectImageUrl(program.image_url);

                return (
                  <Card
                    key={program.id}
                    className={`overflow-hidden ${!program.is_active ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`h-36 ${program.color} relative overflow-hidden flex items-center justify-center`}
                    >
                      {imgUrl ? (
                        <>
                          <img
                            src={imgUrl}
                            alt={program.title}
                            referrerPolicy="no-referrer"
                            style={getCurriculumImageStyle(
                              program.image_position,
                              program.image_scale
                            )}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40" />
                        </>
                      ) : null}
                      <span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full z-10">
                        {targetLevelObj ? targetLevelObj.title : 'ทุกระดับชั้น'}
                      </span>
                      <span className="absolute top-2 right-2 text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full font-mono z-10">
                        #{idx + 1}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center z-10 shadow">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-foreground text-lg">{program.title}</h3>
                        {!program.is_active && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">ซ่อน</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {program.description}
                      </p>
                      {program.subjects && program.subjects.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1 text-xs text-primary mb-1">
                            <BookOpen className="w-3 h-3" />
                            รายวิชา: {program.subjects.slice(0, 3).join(', ')}
                            {program.subjects.length > 3 ? '...' : ''}
                          </div>
                        </div>
                      )}
                      {program.careers && program.careers.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-1 text-xs text-accent mb-1">
                            <Award className="w-3 h-3" />
                            ทักษะ/ต่อยอด: {program.careers.slice(0, 3).join(', ')}
                            {program.careers.length > 3 ? '...' : ''}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={idx === 0}
                          onClick={() => handleMoveProgramOrder(idx, 'up')}
                          title="เลื่อนขึ้น"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={idx === programs.length - 1}
                          onClick={() => handleMoveProgramOrder(idx, 'down')}
                          title="เลื่อนลง"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenProgramDialog(program)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          แก้ไข
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProgram(program)}
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
        </TabsContent>
      </Tabs>

      {/* ===================================================================== */}
      {/* DIALOG 1: EDIT / ADD CURRICULUM LEVEL (FULL CONTROL + UNLIMITED IMAGE) */}
      {/* ===================================================================== */}
      <Dialog open={isLevelDialogOpen} onOpenChange={setIsLevelDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {editingLevel ? `แก้ไขระดับหลักสูตร: ${editingLevel.title}` : 'เพิ่มระดับหลักสูตรใหม่'}
            </DialogTitle>
            <DialogDescription>
              รูปภาพ ข้อความ ลิงก์ และรายวิชาที่บันทึกจะแสดงตรงกันทั้งหน้าแรกและหน้า /curriculum แบบเรียลไทม์
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLevelForm} className="space-y-5 pt-2">
            {/* Full Control Image Upload */}
            <div className="space-y-3 p-4 rounded-xl bg-secondary/40 border border-border">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>รูปภาพจริงประจำระดับหลักสูตร (Full Control ไม่จำกัดขนาดไฟล์)</span>
                </Label>
                <Badge variant="outline" className="text-[10px]">
                  ไม่จำกัดขนาด (JPG, PNG, WebP, HEIC)
                </Badge>
              </div>

              <ImageUpload
                currentImage={levelForm.image_url}
                onUploadComplete={(url) =>
                  setLevelForm((prev) => ({ ...prev, image_url: url }))
                }
                bucket="images"
                folder="curriculum_levels"
                maxSizeMB={0}
                compressionPreset="cover"
              />

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  หรือวาง URL ลิงก์รูปภาพโดยตรง (รองรับ Google Drive Share Link / HTTPS URL):
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={levelForm.image_url}
                    onChange={(e) =>
                      setLevelForm((prev) => ({ ...prev, image_url: e.target.value }))
                    }
                    placeholder="https://drive.google.com/file/d/... หรือ URL รูปภาพ"
                  />
                  {levelForm.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setLevelForm((prev) => ({
                          ...prev,
                          image_url: '',
                          image_position: 'center center',
                          image_scale: 1,
                        }))
                      }
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      ลบรูป
                    </Button>
                  )}
                </div>
              </div>

              {renderFramingControls(
                levelForm.image_url,
                levelForm.image_position,
                levelForm.image_scale,
                (pos) => setLevelForm((prev) => ({ ...prev, image_position: pos })),
                (sc) => setLevelForm((prev) => ({ ...prev, image_scale: sc })),
                'level'
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lvl_title">ชื่อระดับชั้น / หลักสูตร *</Label>
                <Input
                  id="lvl_title"
                  value={levelForm.title}
                  onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })}
                  placeholder="เช่น ระดับปฐมวัย (อนุบาล)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lvl_subtitle">คำโปรยสั้น (แสดงบนการ์ดหน้าหลัก)</Label>
                <Input
                  id="lvl_subtitle"
                  value={levelForm.subtitle}
                  onChange={(e) => setLevelForm({ ...levelForm, subtitle: e.target.value })}
                  placeholder="เช่น เตรียมความพร้อมด้านพัฒนาการและทักษะพื้นฐาน"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lvl_description">คำอธิบายรายละเอียดหลักสูตร (แสดงในหน้า /curriculum)</Label>
              <Textarea
                id="lvl_description"
                value={levelForm.description}
                onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                rows={3}
                placeholder="อธิบายเป้าหมายและแนวทางการจัดการเรียนการสอนในระดับชั้นนี้..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เชื่อมข้อมูลจำนวนนักเรียน/ห้องจากตาราง grade_data</Label>
                <Select
                  value={levelForm.level_pattern}
                  onValueChange={(val) =>
                    setLevelForm({ ...levelForm, level_pattern: val as LevelPattern })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelPatternOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lvl_href">ลิงก์เชื่อมโยงหน้าหลักสูตร (Anchor Link)</Label>
                <Input
                  id="lvl_href"
                  value={levelForm.href}
                  onChange={(e) => setLevelForm({ ...levelForm, href: e.target.value })}
                  placeholder="/curriculum#kindergarten"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lvl_subjects">
                  กลุ่มสาระการเรียนรู้ / รายวิชา (คั่นด้วยจุลภาค , หรือขึ้นบรรทัดใหม่)
                </Label>
                <Textarea
                  id="lvl_subjects"
                  value={levelForm.subjects}
                  onChange={(e) => setLevelForm({ ...levelForm, subjects: e.target.value })}
                  rows={4}
                  placeholder="ภาษาไทย, คณิตศาสตร์, วิทยาศาสตร์และเทคโนโลยี"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lvl_highlights">
                  จุดเด่นของระดับชั้น (คั่นด้วยจุลภาค , หรือขึ้นบรรทัดใหม่)
                </Label>
                <Textarea
                  id="lvl_highlights"
                  value={levelForm.highlights}
                  onChange={(e) => setLevelForm({ ...levelForm, highlights: e.target.value })}
                  rows={4}
                  placeholder="เน้นการอ่านออกเขียนได้, กิจกรรมโครงงานวิทยาศาสตร์"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ไอคอนประจำระดับชั้น</Label>
                <Select
                  value={levelForm.icon}
                  onValueChange={(val) => setLevelForm({ ...levelForm, icon: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>สีธีมการ์ด (กรณีไม่ได้ใส่รูปภาพ)</Label>
                <Select
                  value={levelForm.color}
                  onValueChange={(val) => setLevelForm({ ...levelForm, color: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${opt.value}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-2">
                <Switch
                  checked={levelForm.sync_grade_stats}
                  onCheckedChange={(checked) =>
                    setLevelForm({ ...levelForm, sync_grade_stats: checked })
                  }
                />
                <Label>ดึงยอดห้องเรียน & จำนวนนักเรียนจาก Supabase อัตโนมัติ</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={levelForm.is_active}
                  onCheckedChange={(checked) =>
                    setLevelForm({ ...levelForm, is_active: checked })
                  }
                />
                <Label>แสดงผลบนเว็บไซต์</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLevelDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลระดับหลักสูตร'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 2: EDIT / ADD CURRICULUM PROGRAM (FULL CONTROL + LEVEL LINK) */}
      {/* ===================================================================== */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'แก้ไขรายวิชาเพิ่มเติม / แผนการเรียน' : 'เพิ่มรายวิชาเพิ่มเติมใหม่'}
            </DialogTitle>
            <DialogDescription>
              อัปโหลดรูปภาพจริงได้ไม่จำกัดขนาดและเชื่อมโยงกับระดับชั้นที่เปิดสอนในหน้า /curriculum
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProgramForm} className="space-y-4 pt-2">
            <div className="space-y-2 p-3.5 rounded-xl bg-secondary/40 border border-border">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 font-semibold">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>รูปภาพจริงประจำรายวิชา (Full Control ไม่จำกัดขนาด)</span>
                </Label>
              </div>
              <ImageUpload
                currentImage={programForm.image_url}
                onUploadComplete={(url) => setProgramForm({ ...programForm, image_url: url })}
                bucket="images"
                folder="curriculum"
                maxSizeMB={0}
                compressionPreset="cover"
              />
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-muted-foreground">
                  หรือวาง URL ลิงก์รูปภาพโดยตรง (Google Drive / HTTPS URL):
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={programForm.image_url}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, image_url: e.target.value })
                    }
                    placeholder="https://... หรือลิงก์รูปภาพ"
                  />
                  {programForm.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setProgramForm({
                          ...programForm,
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

              {renderFramingControls(
                programForm.image_url,
                programForm.image_position,
                programForm.image_scale,
                (pos) => setProgramForm((prev) => ({ ...prev, image_position: pos })),
                (sc) => setProgramForm((prev) => ({ ...prev, image_scale: sc })),
                'program'
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog_title">ชื่อรายวิชา / แผนการเรียน *</Label>
                <Input
                  id="prog_title"
                  value={programForm.title}
                  onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                  placeholder="เช่น โครงงานวิทยาศาสตร์และเกษตรพอเพียง"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>เชื่อมโยงกับระดับชั้น</Label>
                <Select
                  value={programForm.target_level}
                  onValueChange={(value) =>
                    setProgramForm({ ...programForm, target_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกระดับชั้นที่เปิดสอน</SelectItem>
                    {levels.map((lvl) => (
                      <SelectItem key={lvl.id} value={lvl.id}>
                        {lvl.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prog_desc">รายละเอียด</Label>
              <Textarea
                id="prog_desc"
                value={programForm.description}
                onChange={(e) =>
                  setProgramForm({ ...programForm, description: e.target.value })
                }
                placeholder="รายละเอียดแนวทางการเรียนการสอน..."
                rows={2}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog_subjects">รายวิชา/กิจกรรม (คั่นด้วย , หรือขึ้นบรรทัดใหม่)</Label>
                <Textarea
                  id="prog_subjects"
                  value={programForm.subjects}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, subjects: e.target.value })
                  }
                  placeholder="วิทยาการคำนวณ, โครงงานวิทยาศาสตร์"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog_careers">ทักษะ/แนวทางต่อยอด (คั่นด้วย , หรือขึ้นบรรทัดใหม่)</Label>
                <Textarea
                  id="prog_careers"
                  value={programForm.careers}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, careers: e.target.value })
                  }
                  placeholder="ทักษะคิดวิเคราะห์, ศึกษาต่อ ม.ปลาย / ปวช."
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ไอคอน</Label>
                <Select
                  value={programForm.icon}
                  onValueChange={(value) => setProgramForm({ ...programForm, icon: value })}
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
              <div className="space-y-2">
                <Label>สี</Label>
                <Select
                  value={programForm.color}
                  onValueChange={(value) => setProgramForm({ ...programForm, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสี" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${option.value}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={programForm.is_active}
                onCheckedChange={(checked) =>
                  setProgramForm({ ...programForm, is_active: checked })
                }
              />
              <Label>แสดงบนเว็บไซต์</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProgramDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : editingProgram ? 'บันทึก' : 'เพิ่ม'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 3: CROP TOOL */}
      {/* ===================================================================== */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-amber-500" />
              ครอบตัดรูปภาพ (Crop Tool)
            </DialogTitle>
            <DialogDescription>
              เลือกสัดส่วน ตำแหน่ง และกำลังขยายก่อนนำภาพมาแสดงผลบนหน้าเว็บไซต์
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { label: '4:3 (การ์ดหน้าแรก)', ratio: 4 / 3 },
                { label: '16:9 (แนวกว้าง)', ratio: 16 / 9 },
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

            {currentCropImage && (
              <div
                className="relative w-full overflow-hidden rounded-xl border bg-slate-950"
                style={{ aspectRatio: String(cropAspectRatio), maxHeight: '280px' }}
              >
                <img
                  src={normalizeDirectImageUrl(currentCropImage)}
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
                <Label className="text-xs">แนวนอน X ({cropFocalX}%)</Label>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={cropFocalX}
                  onChange={(e) => setCropFocalX(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">แนวตั้ง Y ({cropFocalY}%)</Label>
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
              {isCropping ? 'กำลังครอบตัด...' : 'นำภาพที่ครอบตัดมาใช้งาน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 4: SUPABASE SQL MIGRATION HELPER */}
      {/* ===================================================================== */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              คำสั่ง SQL สำหรับอัปเดตฐานข้อมูลหลักสูตรใน Supabase (Full Control)
            </DialogTitle>
            <DialogDescription>
              คัดลอกคำสั่ง SQL ด้านล่างไปวางในหน้า Supabase SQL Editor แล้วกด Run เพื่อสร้างตาราง curriculum_levels และคอลัมน์รูปภาพ Full Control (ปลอดภัย ไม่ลบข้อมูลที่คุณเพิ่มไว้)
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleCopySql} className="gap-1.5">
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedSql ? 'คัดลอกแล้ว' : 'คัดลอก SQL ทั้งหมด'}
            </Button>
            <Button type="button" size="sm" variant="outline" asChild className="gap-1.5">
              <a
                href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                เปิด Supabase SQL Editor ({SUPABASE_PROJECT_REF})
              </a>
            </Button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs overflow-x-auto max-h-[380px] font-mono leading-relaxed">
            {SUPABASE_CURRICULUM_MIGRATION_SQL}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};
