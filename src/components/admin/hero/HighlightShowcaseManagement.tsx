import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { supabase, notifyLocalRealtimeListeners, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Eye,
  Sliders,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  BookOpen,
  Palette,
  Image as ImageIcon,
  Database,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-school.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';
import {
  DEFAULT_FEATURED_HIGHLIGHT,
  parseFeaturedHighlights,
  type FeaturedHighlightItem,
} from '@/utils/homepageLayoutUtils';

const PRESET_HIGHLIGHT_IMAGES = [
  { label: 'ภาพกิจกรรมสำเร็จการศึกษา / พิธีบัณฑิตน้อย', url: studentGraduationActivity },
  { label: 'ห้องปฏิบัติการวิทยาศาสตร์ / AI & เทคโนโลยี', url: studentScienceLab },
  { label: 'ภาพบรรยากาศโรงเรียนหลัก (Hero Campus)', url: heroImage },
];

export const HighlightShowcaseManagement = () => {
  const { settings } = useSchoolSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingDb, setLoadingDb] = useState(true);

  // Live Curriculum & Grade stats from Supabase for sync preview
  const [dbCurriculums, setDbCurriculums] = useState<any[]>([]);
  const [dbActivities, setDbActivities] = useState<any[]>([]);
  const [dbGrades, setDbGrades] = useState<any[]>([]);

  // Local editable highlight item state
  const [highlightData, setHighlightData] = useState<FeaturedHighlightItem>({
    ...DEFAULT_FEATURED_HIGHLIGHT,
  });

  const [tagInput, setTagInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Fetch live rows from Supabase curriculum & grades
  const fetchSupabaseCurriculumData = async () => {
    try {
      const [currRes, actRes, gradeRes] = await Promise.all([
        supabase
          .from('curriculum_programs')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
        supabase
          .from('curriculum_activities')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
        supabase
          .from('grade_data')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
      ]);

      if (!currRes.error && currRes.data) setDbCurriculums(currRes.data);
      if (!actRes.error && actRes.data) setDbActivities(actRes.data);
      if (!gradeRes.error && gradeRes.data) setDbGrades(gradeRes.data);
    } catch (e) {
      console.warn('Error fetching Supabase curriculum info:', e);
    }
  };

  // Fetch current highlight configuration from homepage_highlights table or school_settings
  const fetchHighlightRecord = async () => {
    setLoadingDb(true);
    try {
      const { data, error } = await (supabase as any)
        .from('homepage_highlights')
        .select('*')
        .order('order_position', { ascending: true })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0];
        setHighlightData({
          id: row.id,
          badge: row.badge || DEFAULT_FEATURED_HIGHLIGHT.badge,
          titleHighlight: row.title_highlight || DEFAULT_FEATURED_HIGHLIGHT.titleHighlight,
          title: row.title || DEFAULT_FEATURED_HIGHLIGHT.title,
          description: row.description || '',
          image: row.image_url || '',
          imageCaption: row.image_caption || '',
          imagePosition: row.image_position || 'center center',
          imageScale: typeof row.image_scale === 'number' && !isNaN(row.image_scale) ? row.image_scale : 1,
          showOverlay: row.show_overlay !== undefined ? Boolean(row.show_overlay) : true,
          showCaption: row.show_caption !== undefined ? Boolean(row.show_caption) : true,
          showBadge: row.show_badge !== undefined ? Boolean(row.show_badge) : true,
          showPlayButton: row.show_play_button !== undefined ? Boolean(row.show_play_button) : false,
          playActionType: row.play_action_type || 'link',
          mediaLinkUrl: row.media_link_url || '/curriculum',
          syncCurriculum: row.sync_curriculum !== undefined ? Boolean(row.sync_curriculum) : true,
          syncActivities: row.sync_activities !== undefined ? Boolean(row.sync_activities) : true,
          syncGrades: row.sync_grades !== undefined ? Boolean(row.sync_grades) : true,
          autoCaptionFromDb: row.auto_caption_from_db !== undefined ? Boolean(row.auto_caption_from_db) : true,
          autoDescriptionFromDb: row.auto_description_from_db !== undefined ? Boolean(row.auto_description_from_db) : true,
          customTags: Array.isArray(row.custom_tags) ? row.custom_tags : DEFAULT_FEATURED_HIGHLIGHT.customTags,
          primaryLabel: row.primary_label || DEFAULT_FEATURED_HIGHLIGHT.primaryLabel,
          primaryHref: row.primary_href || DEFAULT_FEATURED_HIGHLIGHT.primaryHref,
          showPrimaryBtn: row.show_primary_btn !== undefined ? Boolean(row.show_primary_btn) : true,
          secondaryLabel: row.secondary_label || DEFAULT_FEATURED_HIGHLIGHT.secondaryLabel,
          secondaryHref: row.secondary_href || DEFAULT_FEATURED_HIGHLIGHT.secondaryHref,
          showSecondaryBtn: row.show_secondary_btn !== undefined ? Boolean(row.show_secondary_btn) : true,
          enabled: row.is_active !== undefined ? Boolean(row.is_active) : true,
          order: row.order_position || 1,
        });
      } else if (settings.featuredHighlights && settings.featuredHighlights.length > 0) {
        setHighlightData({ ...settings.featuredHighlights[0] });
      }
    } catch (e) {
      console.warn('Falling back to settings.featuredHighlights:', e);
      if (settings.featuredHighlights && settings.featuredHighlights.length > 0) {
        setHighlightData({ ...settings.featuredHighlights[0] });
      }
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchSupabaseCurriculumData();
    fetchHighlightRecord();

    return subscribeToRealtimeTables(
      'realtime_highlight_admin',
      ['homepage_highlights', 'curriculum_programs', 'curriculum_activities', 'grade_data'],
      () => {
        fetchSupabaseCurriculumData();
        if (!isDirty) {
          fetchHighlightRecord();
        }
      }
    );
  }, []);

  const updateField = <K extends keyof FeaturedHighlightItem>(key: K, value: FeaturedHighlightItem[K]) => {
    setHighlightData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  // Add custom tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const current = highlightData.customTags || [];
    if (!current.includes(tagInput.trim())) {
      updateField('customTags', [...current, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    const current = highlightData.customTags || [];
    updateField('customTags', current.filter((_, i) => i !== index));
  };

  // Compute live auto-synced description preview
  const liveLevelsSummary = (() => {
    const levels: string[] = [];
    if (dbGrades.some((g) => g.level.includes('อนุบาล') || g.level.includes('ปฐมวัย'))) {
      levels.push('ปฐมวัย (อนุบาล)');
    }
    if (dbGrades.some((g) => g.level.includes('ประถม') || /^ป\.\s*\d/.test(g.level.trim()))) {
      levels.push('ประถมศึกษา (ป.1 - ป.6)');
    }
    if (dbGrades.some((g) => /มัธยมศึกษาปีที่\s*[1-3]|ม\.\s*[1-3]/.test(g.level))) {
      levels.push('มัธยมศึกษาตอนต้น (ม.1 - ม.3)');
    }
    if (levels.length === 0) {
      levels.push('ระดับปฐมวัย', 'ระดับประถมศึกษา', 'ระดับมัธยมศึกษาตอนต้น');
    }
    return levels.join(' · ');
  })();

  const liveCurriculumNames = dbCurriculums.map((c) => c.title).slice(0, 4).join(', ');
  const liveActivitiesNames = dbActivities.map((a) => a.name).slice(0, 4).join(', ');

  const computedLiveDescription = `โรงเรียนบ้านหาดเค็ด เปิดสอนครอบคลุม ${liveLevelsSummary} ${
    liveCurriculumNames ? `มุ่งเน้น ${liveCurriculumNames}` : 'มุ่งเน้นวิชาการ ทักษะชีวิต และงานอาชีพ'
  } พร้อมกิจกรรมพัฒนาผู้เรียนรอบด้าน ${liveActivitiesNames ? `(เช่น ${liveActivitiesNames})` : ''}`;

  const computedLiveCaption = `หลักสูตรและกิจกรรมพัฒนาผู้เรียน · ${liveLevelsSummary} · ${settings.school_name}`;

  // Save to Database (Full Control)
  const handleSave = async () => {
    setSaving(true);
    try {
      const dbRow = {
        id: highlightData.id || 'highlight-curriculum-main',
        badge: highlightData.badge,
        title_highlight: highlightData.titleHighlight,
        title: highlightData.title,
        description: highlightData.description,
        image_url: highlightData.image,
        image_caption: highlightData.imageCaption,
        image_position: highlightData.imagePosition || 'center center',
        image_scale: highlightData.imageScale || 1,
        show_overlay: highlightData.showOverlay ?? true,
        show_caption: highlightData.showCaption ?? true,
        show_badge: highlightData.showBadge ?? true,
        show_play_button: highlightData.showPlayButton ?? false,
        play_action_type: highlightData.playActionType || 'link',
        media_link_url: highlightData.mediaLinkUrl || '/curriculum',
        sync_curriculum: highlightData.syncCurriculum ?? true,
        sync_activities: highlightData.syncActivities ?? true,
        sync_grades: highlightData.syncGrades ?? true,
        auto_caption_from_db: highlightData.autoCaptionFromDb ?? true,
        auto_description_from_db: highlightData.autoDescriptionFromDb ?? true,
        custom_tags: highlightData.customTags || [],
        primary_label: highlightData.primaryLabel,
        primary_href: highlightData.primaryHref,
        show_primary_btn: highlightData.showPrimaryBtn ?? true,
        secondary_label: highlightData.secondaryLabel,
        secondary_href: highlightData.secondaryHref,
        show_secondary_btn: highlightData.showSecondaryBtn ?? true,
        is_active: highlightData.enabled ?? true,
        order_position: highlightData.order || 1,
        updated_at: new Date().toISOString(),
      };

      // 1. Try upserting to dedicated homepage_highlights table
      let savedToTable = false;
      try {
        const { error: upsertErr } = await (supabase as any)
          .from('homepage_highlights')
          .upsert(dbRow, { onConflict: 'id' });

        if (!upsertErr) {
          savedToTable = true;
        } else {
          console.warn('Upsert to homepage_highlights note:', upsertErr.message);
        }
      } catch (err) {
        console.warn('homepage_highlights table not yet ready:', err);
      }

      // 2. Also save to school_settings.featured_highlights_json (Dual-cloud safety guarantee)
      const jsonPayload = JSON.stringify([highlightData]);
      const { error: settingsErr } = await supabase
        .from('school_settings')
        .upsert(
          {
            key: 'featured_highlights_json',
            value: jsonPayload,
            category: 'homepage',
          } as any,
          { onConflict: 'key' }
        );

      if (settingsErr) {
        console.warn('Note saving to school_settings:', settingsErr.message);
      }

      // 3. Update localStorage live cache & notify realtime channels
      try {
        localStorage.setItem('kk_school_featured_highlights_live', jsonPayload);
        const cachedSettings = localStorage.getItem('school_settings_cache_v3');
        if (cachedSettings) {
          const parsed = JSON.parse(cachedSettings);
          parsed.featured_highlights_json = jsonPayload;
          localStorage.setItem('school_settings_cache_v3', JSON.stringify(parsed));
        }
      } catch (e) {
        console.warn('Cache write notice:', e);
      }

      notifyLocalRealtimeListeners('homepage_highlights');
      notifyLocalRealtimeListeners('school_settings');
      window.dispatchEvent(new CustomEvent('homepage-highlights-updated'));
      window.dispatchEvent(new CustomEvent('school-settings-updated'));

      setIsDirty(false);
      toast({
        title: 'บันทึกข้อมูลเรียบร้อย (Full Control Realtime)',
        description: savedToTable
          ? 'อัปเดตข้อมูลลงตาราง homepage_highlights และ school_settings ใน Supabase สำเร็จ หน้าแรกเปลี่ยนทันที!'
          : 'บันทึกการตั้งค่าลง Supabase สำเร็จ หน้าเว็บไซต์เปลี่ยนทันที!',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: error?.message || 'ไม่สามารถเชื่อมต่อ Supabase ได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    setHighlightData({ ...DEFAULT_FEATURED_HIGHLIGHT });
    setIsDirty(true);
    toast({
      title: 'รีเซ็ตเป็นค่าเริ่มต้น',
      description: 'กด "บันทึกการเปลี่ยนแปลง" เพื่อนำค่าเริ่มต้นไปปรับใช้บนหน้าแรก',
    });
  };

  const currentDisplayImage = highlightData.image || studentGraduationActivity;
  const currentDisplayCaption =
    highlightData.autoCaptionFromDb && highlightData.syncCurriculum
      ? computedLiveCaption
      : highlightData.imageCaption || `กิจกรรมและหลักสูตรเด่น · ${settings.school_name}`;

  const currentDisplayDescription =
    highlightData.autoDescriptionFromDb && highlightData.syncCurriculum
      ? computedLiveDescription
      : highlightData.description ||
        'ส่งเสริมการเรียนรู้ผ่านการปฏิบัติจริง ทั้งกิจกรรมวิชาการ ดนตรี กีฬา ศิลปะ งานอาชีพ และทักษะเทคโนโลยี เพื่อให้ผู้เรียนพัฒนาศักยภาพได้อย่างเต็มที่';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-sky-500 text-sky-600 dark:text-sky-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              FULL CONTROL & REALTIME SYNC
            </Badge>
            <Badge className={highlightData.enabled ? 'bg-emerald-600' : 'bg-slate-500'}>
              {highlightData.enabled ? 'เปิดแสดงผลหน้าแรก' : 'ปิดการแสดงผล'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            จัดการแบนเนอร์หลักสูตรและกิจกรรมเด่นหน้าแรก
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ซิงค์ตรงกับฐานข้อมูลหลักสูตร (<code className="font-mono text-xs">curriculum_programs</code>,{' '}
            <code className="font-mono text-xs">curriculum_activities</code>,{' '}
            <code className="font-mono text-xs">grade_data</code>) และปรับแต่งอิสระได้ทุกจุด
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            รีเซ็ตค่าเริ่มต้น
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open('/#news', '_blank')}
            className="gap-1.5 text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            ดูหน้าแรก
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 shadow-md bg-sky-600 hover:bg-sky-500 text-white"
          >
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </Button>
        </div>
      </div>

      {/* Supabase Dynamic Data Status Card */}
      <Card className="bg-sky-50/60 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  สถานะการเชื่อมต่อข้อมูลหลักสูตรจาก Supabase:
                </p>
                <Badge variant="outline" className="text-xs bg-white dark:bg-slate-900 text-emerald-600 border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 mr-1 inline" /> ซิงค์อัตโนมัติ Realtime
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                หลักสูตรเปิดสอน: <strong>{dbCurriculums.length} หลักสูตร</strong> ({liveCurriculumNames || 'ไม่มี'}) ·{' '}
                กิจกรรมเสริม: <strong>{dbActivities.length} กิจกรรม</strong> ({liveActivitiesNames || 'ไม่มี'}) ·{' '}
                ระดับชั้น: <strong>{dbGrades.length} ระดับ</strong> ({liveLevelsSummary})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/admin/dashboard?tab=curriculum">
              <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                จัดการหลักสูตร
              </Button>
            </Link>
            <Link to="/admin/dashboard?tab=activities">
              <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5">
                <Palette className="w-3.5 h-3.5 text-rose-600" />
                จัดการกิจกรรมเสริม
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Card */}
      <Card className="overflow-hidden border-2 border-slate-700 bg-slate-950 text-white shadow-xl">
        <CardHeader className="bg-slate-900/90 py-3 px-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>ตัวอย่างการแสดงผลจริงบนหน้าแรก (Live Interactive Preview)</span>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-slate-700 text-slate-300">
            {highlightData.syncCurriculum ? '⚡ SYNC WITH SUPABASE' : '✏️ CUSTOM OVERRIDE'}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-12 items-stretch min-h-[380px]">
            {/* Left Photo Showcase */}
            <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[360px] bg-slate-950 overflow-hidden group">
              <img
                src={currentDisplayImage}
                alt={highlightData.title}
                referrerPolicy="no-referrer"
                style={{
                  objectPosition: highlightData.imagePosition || 'center center',
                  transform: `scale(${highlightData.imageScale || 1})`,
                }}
                className="w-full h-full object-cover opacity-85 transition-transform duration-500"
              />
              {highlightData.showOverlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />
              )}

              {/* Play or Action Button */}
              {highlightData.showPlayButton && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  </span>
                </div>
              )}

              {/* Caption */}
              {highlightData.showCaption && (
                <div className="absolute bottom-5 left-6 right-6 text-xs sm:text-sm text-slate-200 drop-shadow-md">
                  {currentDisplayCaption}
                </div>
              )}
            </div>

            {/* Right Content */}
            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center bg-slate-900">
              {highlightData.showBadge && (
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">
                  {highlightData.badge || 'CURRICULUM & HIGHLIGHT ACTIVITIES'}
                </p>
              )}
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                <strong className="text-amber-400">{highlightData.titleHighlight || 'หลักสูตรและกิจกรรมเด่น'}</strong>{' '}
                {highlightData.title || settings.school_name}
              </h3>

              {/* Tags */}
              {highlightData.customTags && highlightData.customTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {highlightData.customTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-sky-300 border border-slate-700/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {currentDisplayDescription}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                {highlightData.showPrimaryBtn && (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-sm shadow-md">
                    <span>{highlightData.primaryLabel || 'ดูหลักสูตรที่เปิดสอน'}</span>
                    <span>→</span>
                  </span>
                )}
                {highlightData.showSecondaryBtn && (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/10">
                    <span>{highlightData.secondaryLabel || 'ประมวลภาพกิจกรรม'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Controls Accordion / Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Section 1: Image & Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sky-600" />
              1. รูปภาพและตำแหน่งแสดงผล (Image & Framing)
            </CardTitle>
            <CardDescription>
              อัปโหลดรูปภาพใหม่จากเครื่อง เลือกจากภาพแนะนำ หรือปรับตำแหน่งโฟกัส
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>อัปโหลดรูปภาพไฮไลท์ใหม่</Label>
              <ImageUpload
                currentImage={highlightData.image}
                onUploadComplete={(url) => updateField('image', url)}
                bucket="images"
                folder="highlights"
                maxSizeMB={0}
                compressionPreset="cover"
              />
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="highlight_image_url" className="text-xs text-muted-foreground">
                  หรือวาง URL ลิงก์รูปภาพโดยตรง (Google Drive / เว็บไซต์ภายนอก)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="highlight_image_url"
                    value={highlightData.image || ''}
                    onChange={(e) => updateField('image', e.target.value)}
                    placeholder="https://... หรือลิงก์รูปภาพ"
                    className="text-xs"
                  />
                  {highlightData.image && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => updateField('image', '')}
                      className="text-xs text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      ลบรูป
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">หรือเลือกจากภาพเริ่มต้นที่มีในระบบ:</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_HIGHLIGHT_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => updateField('image', preset.url)}
                    className={`relative rounded-lg overflow-hidden border-2 aspect-video transition-all ${
                      highlightData.image === preset.url
                        ? 'border-sky-500 ring-2 ring-sky-500/30'
                        : 'border-border hover:border-sky-300'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[10px] text-white p-1 truncate">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Position and Scale */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="image_pos">ตำแหน่งโฟกัส (Object Position)</Label>
                <Select
                  value={highlightData.imagePosition || 'center center'}
                  onValueChange={(val) => updateField('imagePosition', val)}
                >
                  <SelectTrigger id="image_pos">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center center">กึ่งกลาง (Center)</SelectItem>
                    <SelectItem value="center top">เน้นด้านบน (Top)</SelectItem>
                    <SelectItem value="center bottom">เน้นด้านล่าง (Bottom)</SelectItem>
                    <SelectItem value="left center">เน้นซ้าย (Left)</SelectItem>
                    <SelectItem value="right center">เน้นขวา (Right)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_scale">อัตราขยายภาพ (Scale: {highlightData.imageScale || 1}x)</Label>
                <Input
                  id="image_scale"
                  type="number"
                  min="0.8"
                  max="2"
                  step="0.05"
                  value={highlightData.imageScale || 1}
                  onChange={(e) => updateField('imageScale', parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Caption & Play Button toggles */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">เปิดแสดงเงาดำทับรูปภาพ (Overlay Gradient)</Label>
                  <p className="text-xs text-muted-foreground">ช่วยให้อ่านคำบรรยายบนรูปได้ชัดเจนยิ่งขึ้น</p>
                </div>
                <Switch
                  checked={highlightData.showOverlay ?? true}
                  onCheckedChange={(val) => updateField('showOverlay', val)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">แสดงคำบรรยายใต้รูปภาพ (Photo Caption)</Label>
                  <p className="text-xs text-muted-foreground">ข้อความระบุกิจกรรมที่มุมล่างของรูปภาพ</p>
                </div>
                <Switch
                  checked={highlightData.showCaption ?? true}
                  onCheckedChange={(val) => updateField('showCaption', val)}
                />
              </div>

              {highlightData.showCaption && (
                <div className="space-y-2 pl-4 border-l-2 border-sky-400">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">ดึงคำบรรยายจาก Supabase อัตโนมัติ</Label>
                    <Switch
                      checked={highlightData.autoCaptionFromDb ?? true}
                      onCheckedChange={(val) => updateField('autoCaptionFromDb', val)}
                    />
                  </div>
                  {!highlightData.autoCaptionFromDb && (
                    <Input
                      value={highlightData.imageCaption || ''}
                      onChange={(e) => updateField('imageCaption', e.target.value)}
                      placeholder="ใส่คำบรรยายภาพด้วยตนเอง..."
                      className="text-xs"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">แสดงปุ่มกด Play บนรูปภาพ</Label>
                  <p className="text-xs text-muted-foreground">เมื่อคลิกจะเปิดวิดีโอหรือแกลเลอรี่</p>
                </div>
                <Switch
                  checked={highlightData.showPlayButton ?? false}
                  onCheckedChange={(val) => updateField('showPlayButton', val)}
                />
              </div>

              {highlightData.showPlayButton && (
                <div className="space-y-2 pl-4 border-l-2 border-rose-400">
                  <Label className="text-xs">ลิงก์เมื่อคลิกปุ่ม Play (URL หรือเส้นทาง เช่น /gallery หรือ YouTube)</Label>
                  <Input
                    value={highlightData.mediaLinkUrl || ''}
                    onChange={(e) => updateField('mediaLinkUrl', e.target.value)}
                    placeholder="/gallery หรือ https://..."
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Text, Sync & Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              2. ข้อความและระบบเชื่อมต่อ Supabase (Content & Sync)
            </CardTitle>
            <CardDescription>
              ควบคุมการซิงค์ข้อมูลกับหลักสูตรในฐานข้อมูล และปรับแก้ข้อความได้แบบ Full Control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto-Sync Switch */}
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    เชื่อมต่อข้อมูลหลักสูตรกับ Supabase อัตโนมัติ (Dynamic Sync)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ดึงระดับชั้นเรียน ({liveLevelsSummary}) และหลักสูตรจริงมารวมเป็นเนื้อหา
                  </p>
                </div>
                <Switch
                  checked={highlightData.syncCurriculum ?? true}
                  onCheckedChange={(val) => updateField('syncCurriculum', val)}
                />
              </div>

              {highlightData.syncCurriculum && (
                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">สร้างเนื้อหาอัตโนมัติจากฐานข้อมูล Supabase:</span>
                    <Switch
                      checked={highlightData.autoDescriptionFromDb ?? true}
                      onCheckedChange={(val) => updateField('autoDescriptionFromDb', val)}
                    />
                  </div>
                  {highlightData.autoDescriptionFromDb && (
                    <div className="p-2.5 rounded-lg bg-background border text-[11px] text-muted-foreground leading-relaxed">
                      💡 <strong>ข้อความที่ระบบสร้างให้:</strong> &ldquo;{computedLiveDescription}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Badge & Headers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="badge_text">ข้อความแท็กด้านบนสุด (Badge)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">แสดง</span>
                  <Switch
                    checked={highlightData.showBadge ?? true}
                    onCheckedChange={(val) => updateField('showBadge', val)}
                  />
                </div>
              </div>
              {highlightData.showBadge && (
                <Input
                  id="badge_text"
                  value={highlightData.badge}
                  onChange={(e) => updateField('badge', e.target.value)}
                  placeholder="CURRICULUM & HIGHLIGHT ACTIVITIES"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="title_hi">คำเน้นหัวข้อ (สีทอง/เหลือง)</Label>
                <Input
                  id="title_hi"
                  value={highlightData.titleHighlight}
                  onChange={(e) => updateField('titleHighlight', e.target.value)}
                  placeholder="หลักสูตรและกิจกรรมเด่น"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title_main">ชื่อโรงเรียนต่อท้าย</Label>
                <Input
                  id="title_main"
                  value={highlightData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={settings.school_name}
                />
              </div>
            </div>

            {/* Custom Tags */}
            <div className="space-y-2">
              <Label>แท็กป้ายระดับชั้น / หมวดหมู่เด่น</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(highlightData.customTags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="พิมพ์ระดับชั้น เช่น ระดับปฐมวัย (อ.2-อ.3) แล้วกดเพิ่ม"
                  className="text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddTag} className="gap-1 text-xs shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มแท็ก
                </Button>
              </div>
            </div>

            {/* Description textarea */}
            {(!highlightData.syncCurriculum || !highlightData.autoDescriptionFromDb) && (
              <div className="space-y-1.5">
                <Label htmlFor="desc_text">คำอธิบายรายละเอียด (Custom Description)</Label>
                <Textarea
                  id="desc_text"
                  rows={3}
                  value={highlightData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="พิมพ์คำอธิบายหลักสูตรและการจัดกิจกรรมของโรงเรียนที่ต้องการแสดง..."
                />
              </div>
            )}

            {/* Buttons Setup */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-semibold">ปุ่มดำเนินการ (Action Buttons)</Label>

              {/* Primary Button */}
              <div className="p-3 rounded-lg border bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-600">ปุ่มหลัก (Primary Button)</span>
                  <Switch
                    checked={highlightData.showPrimaryBtn ?? true}
                    onCheckedChange={(val) => updateField('showPrimaryBtn', val)}
                  />
                </div>
                {highlightData.showPrimaryBtn && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={highlightData.primaryLabel}
                      onChange={(e) => updateField('primaryLabel', e.target.value)}
                      placeholder="ข้อความปุ่ม เช่น ดูหลักสูตรที่เปิดสอน"
                      className="text-xs"
                    />
                    <Input
                      value={highlightData.primaryHref}
                      onChange={(e) => updateField('primaryHref', e.target.value)}
                      placeholder="ลิงก์ปลายทาง เช่น /curriculum"
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Secondary Button */}
              <div className="p-3 rounded-lg border bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">ปุ่มรอง (Secondary Button)</span>
                  <Switch
                    checked={highlightData.showSecondaryBtn ?? true}
                    onCheckedChange={(val) => updateField('showSecondaryBtn', val)}
                  />
                </div>
                {highlightData.showSecondaryBtn && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={highlightData.secondaryLabel}
                      onChange={(e) => updateField('secondaryLabel', e.target.value)}
                      placeholder="ข้อความปุ่ม เช่น ประมวลภาพกิจกรรม"
                      className="text-xs"
                    />
                    <Input
                      value={highlightData.secondaryHref}
                      onChange={(e) => updateField('secondaryHref', e.target.value)}
                      placeholder="ลิงก์ปลายทาง เช่น /gallery หรือ /events"
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button Bottom Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.open('/#news', '_blank')}
          className="gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          เปิดดูหน้าแรกของเว็บไซต์
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-sky-600 hover:bg-sky-500 text-white min-w-[180px] shadow-lg"
        >
          <Save className="w-4 h-4" />
          {saving ? 'กำลังบันทึกลง Supabase...' : 'บันทึกการเปลี่ยนแปลงทั้งหมด'}
        </Button>
      </div>
    </div>
  );
};

export default HighlightShowcaseManagement;
