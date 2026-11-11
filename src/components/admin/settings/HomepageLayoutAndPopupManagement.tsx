import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  SUPABASE_PROJECT_REF,
  isSupabaseConfigured,
  notifyLocalRealtimeListeners,
  onRealtimeSyncStatusChange,
  subscribeToRealtimeTables,
  type RealtimeSyncStatus,
} from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutTemplate,
  Megaphone,
  CloudCog,
  Save,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Rocket,
  Radio,
  Database,
  Newspaper,
  UserCog,
  BookOpen,
  Palette,
  Trash2,
  Menu,
  FileText,
  Sliders,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import WelcomePopupModal from '@/components/WelcomePopupModal';
import { deleteStorageImage } from '@/utils/storageUtils';
import heroImage from '@/assets/hero-school.jpg';
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_NAVBAR_MENU_ITEMS,
  DEFAULT_NEWSLETTER_DISPLAY_CONFIG,
  DEFAULT_NEWS_HUB_SUBSECTIONS,
  DEFAULT_WELCOME_POPUP_CONFIG,
  isPopupActiveNow,
  mergeHomepageSectionsFromTable,
  moveItemInOrder,
  parseHomepageSections,
  parseNavbarMenuItems,
  parseNewsletterDisplayConfig,
  parseNewsHubSubSections,
  parseWelcomePopupConfig,
  reorderItemsById,
  resetWelcomePopupDismissal,
  type HomepageSectionConfig,
  type NavbarMenuItemConfig,
  type NewsHubSubSectionConfig,
} from '@/utils/homepageLayoutUtils';
import { NEWSLETTER_CATEGORIES } from '@/pages/Newsletters';
import { SUPABASE_EXTENDED_MIGRATION_SQL } from '@/utils/supabaseMigrationSql';

interface TableHealthResult {
  table: string;
  label: string;
  group: 'existing' | 'extended';
  ok: boolean;
  count: number;
  error?: string;
}

const HEALTH_CHECK_TABLES: { table: string; label: string; group: 'existing' | 'extended' }[] = [
  { table: 'school_settings', label: 'ตั้งค่าข้อมูลโรงเรียน (school_settings)', group: 'existing' },
  { table: 'administrators', label: 'ผู้บริหารสถานศึกษา (administrators)', group: 'existing' },
  { table: 'staff', label: 'บุคลากร (staff)', group: 'existing' },
  { table: 'news', label: 'ข่าวประชาสัมพันธ์ (news)', group: 'existing' },
  { table: 'newsletters', label: 'จดหมายข่าวประชาสัมพันธ์ (newsletters)', group: 'existing' },
  { table: 'grade_data', label: 'จำนวนนักเรียนแยกชั้น (grade_data)', group: 'existing' },
  { table: 'curriculum_programs', label: 'หลักสูตร (curriculum_programs)', group: 'existing' },
  { table: 'curriculum_activities', label: 'กิจกรรมพัฒนาผู้เรียน (curriculum_activities)', group: 'existing' },
  { table: 'teacher_media_items', label: 'สื่อการสอนครู (teacher_media_items)', group: 'existing' },
  { table: 'milestones', label: 'ประวัติโรงเรียน (milestones)', group: 'existing' },
  { table: 'faq', label: 'คำถามที่พบบ่อย (faq)', group: 'existing' },
  { table: 'homepage_sections', label: 'ลำดับส่วนหน้าแรก (homepage_sections)', group: 'extended' },
  { table: 'site_popups', label: 'หน้าต่างป๊อปอัปหน้าแรก (site_popups)', group: 'extended' },
  { table: 'deployment_configs', label: 'ข้อมูลเชื่อมต่อ Cloud/Deploy (deployment_configs)', group: 'extended' },
];

interface SortableSectionRowProps {
  id: string;
  index: number;
  total: number;
  label: string;
  subtitle: string;
  enabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: (checked: boolean) => void;
  compact?: boolean;
}

const SortableOrderRow = ({
  id,
  index,
  total,
  label,
  subtitle,
  enabled,
  onMoveUp,
  onMoveDown,
  onToggle,
  compact = false,
}: SortableSectionRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 ${
        compact ? 'p-2.5 rounded-lg' : 'p-3.5 rounded-xl'
      } border transition-colors ${
        enabled ? 'bg-card border-border shadow-xs' : 'bg-muted/40 border-border/60 opacity-70'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="ลากเพื่อจัดลำดับ"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            title="เลื่อนขึ้น"
            className="p-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            title="เลื่อนลง"
            className="p-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
          #{index + 1}
        </span>

        <div className="min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-foreground truncate`}>
            {label}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>

      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
};

interface SortableNavbarMenuRowProps {
  item: NavbarMenuItemConfig;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onLabelChange: (label: string) => void;
  onToggle: (checked: boolean) => void;
}

const SortableNavbarMenuRow = ({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onLabelChange,
  onToggle,
}: SortableNavbarMenuRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
        item.enabled ? 'bg-card border-border shadow-xs' : 'bg-muted/40 border-border/60 opacity-75'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="ลากเพื่อจัดลำดับเมนู"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            title="เลื่อนขึ้น"
            className="p-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            title="เลื่อนลง"
            className="p-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
          #{index + 1}
        </span>

        <div className="flex-1 min-w-0 flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Input
            value={item.label}
            onChange={(e) => onLabelChange(e.target.value)}
            aria-label={`ชื่อเมนู ${item.href}`}
            className="h-8 text-sm font-medium max-w-xs"
          />
          <Badge variant="outline" className="font-mono text-[11px] shrink-0">
            {item.href}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground">
          {item.enabled ? 'แสดงแถบหลัก' : 'ย้ายเข้าเมนูย่อย'}
        </span>
        <Switch checked={item.enabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
};

export const HomepageLayoutAndPopupManagement = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewPopupOpen, setPreviewPopupOpen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeSyncStatus>('CONNECTING');
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [tableHealth, setTableHealth] = useState<TableHealthResult[]>([]);
  const [triggeringDeploy, setTriggeringDeploy] = useState(false);
  const [sitePopupId, setSitePopupId] = useState<string | null>(null);
  const [newsletterStats, setNewsletterStats] = useState<{
    total: number | null;
    published: number | null;
    error: boolean;
  }>({ total: null, published: null, error: false });
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const checkDatabaseHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const results = await Promise.all(
        HEALTH_CHECK_TABLES.map(async (item): Promise<TableHealthResult> => {
          try {
            const { count, error } = await (supabase as any)
              .from(item.table)
              .select('*', { count: 'exact', head: true });
            if (error) {
              return {
                ...item,
                ok: false,
                count: 0,
                error: error.message || 'ไม่พบตาราง',
              };
            }
            return {
              ...item,
              ok: true,
              count: count || 0,
            };
          } catch (err: any) {
            return {
              ...item,
              ok: false,
              count: 0,
              error: err?.message || 'เชื่อมต่อไม่สำเร็จ',
            };
          }
        })
      );

      setTableHealth(results);

      const extReady = ['homepage_sections', 'site_popups', 'deployment_configs'].every((t) =>
        results.find((r) => r.table === t)?.ok
      );

      if (extReady) {
        setSettings((prev) => ({
          ...prev,
          extended_tables_ready: 'true',
        }));
      }

      return extReady;
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  const fetchNewsletterStats = useCallback(async () => {
    try {
      const [allRes, pubRes] = await Promise.all([
        (supabase as any).from('newsletters').select('id', { count: 'exact', head: true }),
        (supabase as any)
          .from('newsletters')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),
      ]);

      if (allRes.error) {
        setNewsletterStats({ total: null, published: null, error: true });
        return;
      }

      setNewsletterStats({
        total: allRes.count ?? 0,
        published: pubRes.error ? null : (pubRes.count ?? 0),
        error: false,
      });
    } catch {
      setNewsletterStats({ total: null, published: null, error: true });
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('school_settings').select('key, value');
      if (error) throw error;

      const map: Record<string, string> = {};
      (data as any[])?.forEach((row) => {
        map[row.key] = row.value || '';
      });

      if (map.extended_tables_ready === 'true') {
        try {
          const [secRes, popupRes, deployRes] = await Promise.all([
            (supabase as any)
              .from('homepage_sections')
              .select('*')
              .order('sort_order', { ascending: true }),
            (supabase as any)
              .from('site_popups')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(1),
            (supabase as any)
              .from('deployment_configs')
              .select('*')
              .eq('id', 'default')
              .maybeSingle(),
          ]);

          if (!secRes.error && Array.isArray(secRes.data) && secRes.data.length > 0) {
            const base = parseHomepageSections(map.homepage_sections_order);
            const merged = mergeHomepageSectionsFromTable(base, secRes.data);
            map.homepage_sections_order = JSON.stringify(merged);
          }

          if (!popupRes.error && Array.isArray(popupRes.data) && popupRes.data[0]) {
            const p = popupRes.data[0];
            setSitePopupId(p.id);
            map.popup_enabled = p.enabled ? 'true' : 'false';
            if (p.layout) map.popup_layout = p.layout;
            if (p.badge) map.popup_badge = p.badge;
            if (p.title) map.popup_title = p.title;
            if (p.subtitle !== undefined && p.subtitle !== null) map.popup_subtitle = p.subtitle;
            if (p.description !== undefined && p.description !== null)
              map.popup_description = p.description;
            if (p.image_url !== undefined && p.image_url !== null) map.popup_image_url = p.image_url;
            if (p.cta_text !== undefined && p.cta_text !== null) map.popup_cta_text = p.cta_text;
            if (p.cta_url !== undefined && p.cta_url !== null) map.popup_cta_url = p.cta_url;
            if (p.secondary_text !== undefined && p.secondary_text !== null)
              map.popup_secondary_text = p.secondary_text;
            if (p.secondary_url !== undefined && p.secondary_url !== null)
              map.popup_secondary_url = p.secondary_url;
            if (p.frequency) map.popup_frequency = p.frequency;
            if (p.theme_accent) map.popup_theme_accent = p.theme_accent;
            if (p.start_date) map.popup_start_date = p.start_date;
            if (p.end_date) map.popup_end_date = p.end_date;
          }

          if (!deployRes.error && deployRes.data) {
            const d = deployRes.data;
            if (d.supabase_project_ref) map.supabase_project_ref = d.supabase_project_ref;
            if (d.vercel_site_url !== undefined && d.vercel_site_url !== null)
              map.vercel_site_url = d.vercel_site_url;
            if (d.vercel_deploy_hook_url !== undefined && d.vercel_deploy_hook_url !== null)
              map.vercel_deploy_hook_url = d.vercel_deploy_hook_url;
            if (d.github_repo_url) map.github_repo_url = d.github_repo_url;
            if (d.github_branch) map.github_branch = d.github_branch;
          }
        } catch {
          // Optional extended tables not created yet
        }
      }

      setSettings(map);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลไม่สำเร็จ',
        description: error?.message || 'ไม่สามารถดึงค่าจาก Supabase ได้',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    fetchNewsletterStats();
    const unsubStatus = onRealtimeSyncStatusChange(setRealtimeStatus);
    const unsubNewsletter = subscribeToRealtimeTables(
      'realtime_admin_layout_newsletters',
      ['newsletters'],
      fetchNewsletterStats
    );
    return () => {
      unsubStatus();
      unsubNewsletter();
    };
  }, [loadData, fetchNewsletterStats]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const homepageSections: HomepageSectionConfig[] = parseHomepageSections(
    settings.homepage_sections_order
  );
  const newsHubSections: NewsHubSubSectionConfig[] = parseNewsHubSubSections(
    settings.news_hub_order
  );
  const navbarMenuItems: NavbarMenuItemConfig[] = parseNavbarMenuItems(
    settings.navbar_menu_items
  );
  const newsletterDisplay = parseNewsletterDisplayConfig(settings);
  const newsletterHomepageSection = homepageSections.find((s) => s.id === 'newsletter');
  const popupConfig = parseWelcomePopupConfig(settings, heroImage);

  const updateHomepageSections = (next: HomepageSectionConfig[]) => {
    handleChange('homepage_sections_order', JSON.stringify(next));
  };

  const updateNewsHubSections = (next: NewsHubSubSectionConfig[]) => {
    handleChange('news_hub_order', JSON.stringify(next));
  };

  const updateNavbarMenuItems = (next: NavbarMenuItemConfig[]) => {
    handleChange('navbar_menu_items', JSON.stringify(next));
  };

  const handleHomepageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateHomepageSections(
        reorderItemsById(homepageSections, String(active.id), String(over.id))
      );
    }
  };

  const handleNewsHubDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateNewsHubSections(
        reorderItemsById(newsHubSections, String(active.id), String(over.id))
      );
    }
  };

  const handleNavbarDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateNavbarMenuItems(
        reorderItemsById(navbarMenuItems, String(active.id), String(over.id))
      );
    }
  };

  const promoteNewsletterSectionTop = () => {
    const nlItem = homepageSections.find((s) => s.id === 'newsletter');
    if (!nlItem) return;
    const others = homepageSections.filter((s) => s.id !== 'newsletter');
    const newsIdxAfterRemoval = others.findIndex((s) => s.id === 'news');
    const insertAt =
      newsIdxAfterRemoval >= 0 ? newsIdxAfterRemoval + 1 : Math.min(2, others.length);
    others.splice(insertAt, 0, { ...nlItem, enabled: true });
    updateHomepageSections(others.map((item, idx) => ({ ...item, order: idx + 1 })));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      const managedEntries: { key: string; value: string; category: string }[] = [
        {
          key: 'homepage_sections_order',
          value: JSON.stringify(homepageSections),
          category: 'homepage',
        },
        {
          key: 'news_hub_order',
          value: JSON.stringify(newsHubSections),
          category: 'homepage',
        },
        {
          key: 'navbar_menu_items',
          value: JSON.stringify(navbarMenuItems),
          category: 'homepage',
        },
        {
          key: 'newsletter_section_title',
          value: settings.newsletter_section_title ?? newsletterDisplay.title,
          category: 'homepage',
        },
        {
          key: 'newsletter_section_subtitle',
          value: settings.newsletter_section_subtitle ?? newsletterDisplay.subtitle,
          category: 'homepage',
        },
        {
          key: 'newsletter_home_limit',
          value: String(newsletterDisplay.limit),
          category: 'homepage',
        },
        {
          key: 'newsletter_home_category',
          value: newsletterDisplay.category,
          category: 'homepage',
        },
        {
          key: 'newsletter_home_sort',
          value: newsletterDisplay.sortMode,
          category: 'homepage',
        },
        {
          key: 'popup_enabled',
          value: popupConfig.enabled ? 'true' : 'false',
          category: 'popup',
        },
        { key: 'popup_layout', value: popupConfig.layout, category: 'popup' },
        { key: 'popup_badge', value: settings.popup_badge ?? popupConfig.badge, category: 'popup' },
        { key: 'popup_title', value: settings.popup_title ?? popupConfig.title, category: 'popup' },
        {
          key: 'popup_subtitle',
          value: settings.popup_subtitle ?? popupConfig.subtitle,
          category: 'popup',
        },
        {
          key: 'popup_description',
          value: settings.popup_description ?? popupConfig.description,
          category: 'popup',
        },
        { key: 'popup_image_url', value: settings.popup_image_url ?? '', category: 'popup' },
        {
          key: 'popup_cta_text',
          value: settings.popup_cta_text ?? popupConfig.ctaText,
          category: 'popup',
        },
        {
          key: 'popup_cta_url',
          value: settings.popup_cta_url ?? popupConfig.ctaUrl,
          category: 'popup',
        },
        {
          key: 'popup_secondary_text',
          value: settings.popup_secondary_text ?? popupConfig.secondaryText,
          category: 'popup',
        },
        {
          key: 'popup_secondary_url',
          value: settings.popup_secondary_url ?? popupConfig.secondaryUrl,
          category: 'popup',
        },
        { key: 'popup_frequency', value: popupConfig.frequency, category: 'popup' },
        { key: 'popup_theme_accent', value: popupConfig.themeAccent, category: 'popup' },
        { key: 'popup_start_date', value: settings.popup_start_date ?? '', category: 'popup' },
        { key: 'popup_end_date', value: settings.popup_end_date ?? '', category: 'popup' },
        {
          key: 'supabase_project_ref',
          value: settings.supabase_project_ref || SUPABASE_PROJECT_REF,
          category: 'deployment',
        },
        { key: 'vercel_site_url', value: settings.vercel_site_url ?? '', category: 'deployment' },
        {
          key: 'vercel_deploy_hook_url',
          value: settings.vercel_deploy_hook_url ?? '',
          category: 'deployment',
        },
        {
          key: 'github_repo_url',
          value: settings.github_repo_url || 'https://github.com/SpokRocco/Hadket-School',
          category: 'deployment',
        },
        {
          key: 'github_branch',
          value: settings.github_branch || 'main',
          category: 'deployment',
        },
      ];

      // Check once if optional extended tables exist in live Supabase
      const extReady =
        settings.extended_tables_ready === 'true' ? true : await checkDatabaseHealth();

      if (extReady) {
        managedEntries.push({
          key: 'extended_tables_ready',
          value: 'true',
          category: 'deployment',
        });
      }

      // 1. Upsert only managed layout/popup/deployment keys (NEVER overwrites existing school identity/stats!)
      for (const item of managedEntries) {
        const { error } = await supabase
          .from('school_settings')
          .upsert(
            { key: item.key, value: item.value, category: item.category } as any,
            { onConflict: 'key' }
          );
        if (error) throw error;
      }

      // 2. Also sync to dedicated Supabase tables if created
      if (extReady) {
        try {
          for (const sec of homepageSections) {
            await (supabase as any).from('homepage_sections').upsert(
              {
                id: sec.id,
                section_key: sec.id,
                label: sec.label,
                subtitle: sec.subtitle,
                enabled: sec.enabled,
                sort_order: sec.order,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'section_key' }
            );
          }

          const popupPayload = {
            enabled: popupConfig.enabled,
            layout: popupConfig.layout,
            badge: settings.popup_badge ?? popupConfig.badge,
            title: settings.popup_title ?? popupConfig.title,
            subtitle: settings.popup_subtitle ?? popupConfig.subtitle,
            description: settings.popup_description ?? popupConfig.description,
            image_url: settings.popup_image_url ?? '',
            cta_text: settings.popup_cta_text ?? popupConfig.ctaText,
            cta_url: settings.popup_cta_url ?? popupConfig.ctaUrl,
            secondary_text: settings.popup_secondary_text ?? popupConfig.secondaryText,
            secondary_url: settings.popup_secondary_url ?? popupConfig.secondaryUrl,
            frequency: popupConfig.frequency,
            theme_accent: popupConfig.themeAccent,
            start_date: settings.popup_start_date ? settings.popup_start_date : null,
            end_date: settings.popup_end_date ? settings.popup_end_date : null,
            updated_at: new Date().toISOString(),
          };

          if (sitePopupId) {
            await (supabase as any)
              .from('site_popups')
              .update(popupPayload)
              .eq('id', sitePopupId);
          } else {
            const { data: insertedPopup } = await (supabase as any)
              .from('site_popups')
              .insert(popupPayload)
              .select('id')
              .maybeSingle();
            if (insertedPopup?.id) setSitePopupId(insertedPopup.id);
          }

          await (supabase as any).from('deployment_configs').upsert(
            {
              id: 'default',
              supabase_project_ref: settings.supabase_project_ref || SUPABASE_PROJECT_REF,
              vercel_site_url: settings.vercel_site_url || '',
              vercel_deploy_hook_url: settings.vercel_deploy_hook_url || '',
              github_repo_url:
                settings.github_repo_url || 'https://github.com/SpokRocco/Hadket-School',
              github_branch: settings.github_branch || 'main',
              realtime_enabled: true,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch {
          // Safe fallback: school_settings already persisted
        }
      }

      // 3. Bust local caches & emit realtime sync across all open clients
      localStorage.removeItem('school_settings_cache');
      localStorage.removeItem('school_settings_cache_v3');
      resetWelcomePopupDismissal();
      notifyLocalRealtimeListeners('school_settings');
      notifyLocalRealtimeListeners('homepage_sections');
      notifyLocalRealtimeListeners('site_popups');
      notifyLocalRealtimeListeners('deployment_configs');
      notifyLocalRealtimeListeners('newsletters');

      toast({
        title: 'บันทึกสำเร็จ (Realtime Sync)',
        description: extReady
          ? 'อัปเดตลง school_settings และตารางเฉพาะใน Supabase พร้อมซิงค์หน้าเว็บทันที'
          : 'บันทึกลงฐานข้อมูล Supabase แล้ว หน้าเว็บไซต์หลักอัปเดตทันที',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'บันทึกไม่สำเร็จ',
        description: error?.message || 'เกิดข้อผิดพลาดในการบันทึกลง Supabase',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearPopupImage = async () => {
    const oldUrl = settings.popup_image_url;
    handleChange('popup_image_url', '');
    if (oldUrl) {
      await deleteStorageImage(oldUrl);
    }
    toast({
      title: 'ลบรูปป๊อปอัปแล้ว',
      description: 'อย่าลืมกด "บันทึกการเปลี่ยนแปลง" เพื่อยืนยันบนฐานข้อมูล',
    });
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_EXTENDED_MIGRATION_SQL);
      toast({
        title: 'คัดลอกสคริปต์ SQL แล้ว',
        description: 'นำไปวางและกด Run ใน Supabase SQL Editor เพื่อสร้างตารางเพิ่มเติมและเปิด Realtime',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'คัดลอกไม่สำเร็จ',
        description: 'กรุณาคัดลอกข้อความ SQL จากไฟล์ SUPABASE_HOMEPAGE_POPUP_REALTIME_UPDATE.sql',
      });
    }
  };

  const handleTriggerVercelDeploy = async () => {
    const hookUrl = (settings.vercel_deploy_hook_url || '').trim();
    if (!hookUrl.startsWith('https://api.vercel.com/')) {
      toast({
        variant: 'destructive',
        title: 'ลิงก์ Deploy Hook ไม่ถูกต้อง',
        description: 'กรุณาใส่ Vercel Deploy Hook URL ที่ขึ้นต้นด้วย https://api.vercel.com/',
      });
      return;
    }

    try {
      setTriggeringDeploy(true);
      const res = await fetch(hookUrl, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: 'ส่งคำสั่ง Deploy ไปยัง Vercel แล้ว',
        description: 'Vercel กำลังดึงโค้ดล่าสุดจาก GitHub และอัปเดตเว็บไซต์ออนไลน์',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'สั่ง Deploy ไม่สำเร็จ',
        description: error?.message || 'กรุณาตรวจสอบ Deploy Hook URL หรือสั่งผ่าน Vercel Dashboard',
      });
    } finally {
      setTriggeringDeploy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        กำลังโหลดข้อมูลการจัดลำดับหน้าแรกและป๊อปอัปจาก Supabase...
      </div>
    );
  }

  const isPopupLiveNow = isPopupActiveNow(popupConfig);
  const enabledHomepageCount = homepageSections.filter((s) => s.enabled).length;
  const projectRef = settings.supabase_project_ref || SUPABASE_PROJECT_REF;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <WelcomePopupModal
        overrideConfig={{ ...popupConfig, enabled: true }}
        forceOpen={previewPopupOpen}
        onCloseOverride={() => setPreviewPopupOpen(false)}
      />

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            จัดลำดับหน้าแรก · ป๊อปอัป · เชื่อมต่อ Realtime
          </h1>
          <p className="text-muted-foreground mt-1">
            จัดเรียงการนำเสนอข้อมูลบนหน้าหลัก แก้ไขป๊อปอัปต้อนรับ และจัดการเชื่อมต่อ Supabase / Vercel / GitHub
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="outline" onClick={() => window.open('/', '_blank')} className="gap-1.5">
            <ExternalLink className="w-4 h-4" />
            ดูหน้าเว็บจริง
          </Button>
          <Button type="button" onClick={handleSaveAll} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </Button>
        </div>
      </div>

      {/* Live Realtime Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 font-medium">
            <Radio
              className={`w-4 h-4 ${
                realtimeStatus === 'SUBSCRIBED'
                  ? 'text-emerald-500 animate-pulse'
                  : 'text-amber-500'
              }`}
            />
            สถานะ Supabase Realtime:
            <Badge
              variant={realtimeStatus === 'SUBSCRIBED' ? 'default' : 'secondary'}
              className={realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-600' : ''}
            >
              {realtimeStatus === 'SUBSCRIBED'
                ? 'เชื่อมต่อออนไลน์แบบเรียลไทม์แล้ว'
                : realtimeStatus === 'LOCAL_ONLY'
                ? 'โหมดออฟไลน์ในเครื่อง'
                : 'กำลังเชื่อมต่อ / ซิงค์ผ่าน Broadcast'}
            </Badge>
          </span>
          <span className="text-xs text-muted-foreground">
            Project Ref: <code className="font-mono">{projectRef}</code>
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            notifyLocalRealtimeListeners('*');
            toast({
              title: 'ส่งสัญญาณ Sync ทันทีแล้ว',
              description: 'หน้าเว็บไซต์ที่เปิดอยู่ทั้งหมดจะอัปเดตข้อมูลล่าสุดจาก Supabase',
            });
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync หน้าเว็บทันที
        </Button>
      </div>

      <Tabs defaultValue="homepage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="homepage" className="py-2.5 gap-2 text-xs sm:text-sm">
            <LayoutTemplate className="w-4 h-4" />
            1. จัดลำดับหน้าแรก ({enabledHomepageCount}/{homepageSections.length})
          </TabsTrigger>
          <TabsTrigger value="popup" className="py-2.5 gap-2 text-xs sm:text-sm">
            <Megaphone className="w-4 h-4" />
            2. ป๊อปอัปก่อนเข้าเว็บ ({popupConfig.enabled ? 'เปิด' : 'ปิด'})
          </TabsTrigger>
          <TabsTrigger value="cloud" className="py-2.5 gap-2 text-xs sm:text-sm">
            <CloudCog className="w-4 h-4" />
            3. Supabase · Vercel · GitHub
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: HOMEPAGE SECTION & CONTENT ORDERING */}
        <TabsContent value="homepage" className="space-y-6">
          {/* Quick shortcut to Hero Slider */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-primary/10 to-indigo-500/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                  ปรับปรุงภาพสไลด์บนหัวเว็บ (Hero Slider Carousel)
                </h4>
                <p className="text-xs text-muted-foreground">
                  แก้ไขรูปภาพ ข้อความ ลิงก์ปุ่ม และเปิด/ปิดการเลื่อนอัตโนมัติของแบนเนอร์ด้านบนสุดของเว็บ
                </p>
              </div>
            </div>
            <Link to="/admin/dashboard?tab=hero_slider">
              <Button type="button" size="sm" className="gap-1.5 shadow-sm">
                <Sliders className="w-3.5 h-3.5" />
                ไปที่เมนูแก้ไขภาพสไลด์หัวเว็บ
              </Button>
            </Link>
          </div>

          {/* Active Sequence Preview Pill Bar */}
          <Card className="bg-secondary/40">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                ลำดับการแสดงผลจริงบนหน้าแรก (Index) ปัจจุบัน:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {homepageSections
                  .filter((s) => s.enabled)
                  .map((s, i) => (
                    <Badge key={s.id} variant="outline" className="bg-background py-1 px-2.5 gap-1.5">
                      <span className="font-mono font-bold text-primary">{i + 1}.</span>
                      <span>{s.id.toUpperCase()}</span>
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-primary" />
                    จัดลำดับส่วนแสดงผลหลักของหน้าเว็บไซต์ (ลากวางหรือกดลูกศร)
                  </CardTitle>
                  <CardDescription>
                    เรียงลำดับหัวข้อที่นำเสนอบนหน้าแรก และเปิด/ปิดแต่ละส่วนได้ตามต้องการ
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => updateHomepageSections(DEFAULT_HOMEPAGE_SECTIONS)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  รีเซ็ตลำดับหน้าแรก
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleHomepageDragEnd}
              >
                <SortableContext
                  items={homepageSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2.5">
                    {homepageSections.map((sec, idx) => (
                      <SortableOrderRow
                        key={sec.id}
                        id={sec.id}
                        index={idx}
                        total={homepageSections.length}
                        label={sec.label}
                        subtitle={sec.subtitle}
                        enabled={sec.enabled}
                        onMoveUp={() =>
                          updateHomepageSections(moveItemInOrder(homepageSections, idx, 'up'))
                        }
                        onMoveDown={() =>
                          updateHomepageSections(moveItemInOrder(homepageSections, idx, 'down'))
                        }
                        onToggle={(checked) => {
                          updateHomepageSections(
                            homepageSections.map((item) =>
                              item.id === sec.id ? { ...item, enabled: checked } : item
                            )
                          );
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          {/* Main Navbar Menu Customization */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Menu className="w-5 h-5 text-primary" />
                    ปรับแต่งเมนูแถบนำทางด้านบนของหน้าหลัก (Main Navbar Menu)
                  </CardTitle>
                  <CardDescription>
                    เลือกแสดงเมนู &ldquo;จดหมายข่าวประชาสัมพันธ์&rdquo; บนแถบเมนูหลัก แก้ไขชื่อเมนู และจัดลำดับซ้าย-ขวาได้ทันที (รายการที่ปิดจะย้ายไปอยู่ในเมนูย่อย &ldquo;ข้อมูลโรงเรียน&rdquo;)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => updateNavbarMenuItems(DEFAULT_NAVBAR_MENU_ITEMS)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  รีเซ็ตเมนูหลัก
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                  ตัวอย่างแถบเมนูหลักด้านบน (Desktop Top Bar Preview):
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {navbarMenuItems
                    .filter((item) => item.enabled)
                    .map((item) => (
                      <Badge
                        key={item.id}
                        variant={item.id === 'newsletters' ? 'default' : 'outline'}
                        className="bg-background text-foreground data-[highlight=true]:bg-primary data-[highlight=true]:text-primary-foreground"
                        data-highlight={item.id === 'newsletters'}
                      >
                        {item.label}
                      </Badge>
                    ))}
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleNavbarDragEnd}
              >
                <SortableContext
                  items={navbarMenuItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {navbarMenuItems.map((item, idx) => (
                      <SortableNavbarMenuRow
                        key={item.id}
                        item={item}
                        index={idx}
                        total={navbarMenuItems.length}
                        onMoveUp={() =>
                          updateNavbarMenuItems(moveItemInOrder(navbarMenuItems, idx, 'up'))
                        }
                        onMoveDown={() =>
                          updateNavbarMenuItems(moveItemInOrder(navbarMenuItems, idx, 'down'))
                        }
                        onLabelChange={(nextLabel) =>
                          updateNavbarMenuItems(
                            navbarMenuItems.map((m) =>
                              m.id === item.id ? { ...m, label: nextLabel } : m
                            )
                          )
                        }
                        onToggle={(checked) =>
                          updateNavbarMenuItems(
                            navbarMenuItems.map((m) =>
                              m.id === item.id ? { ...m, enabled: checked } : m
                            )
                          )
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          {/* Homepage Newsletter Display Settings (Real Supabase Sync) */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    ปรับแต่งส่วนจดหมายข่าวประชาสัมพันธ์บนหน้าหลัก (Real Supabase Sync)
                  </CardTitle>
                  <CardDescription>
                    ดึงข้อมูลจริงจากตาราง <code className="font-mono">newsletters</code> ใน Supabase มาแสดงบนหน้าแรก พร้อมกำหนดหัวข้อ จำนวนฉบับ หมวดหมู่ และการเรียงลำดับ
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {newsletterStats.error ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-400">
                      ยังไม่พบตาราง newsletters
                    </Badge>
                  ) : newsletterStats.total !== null ? (
                    <Badge className="bg-emerald-600">
                      Supabase: {newsletterStats.published ?? 0} เผยแพร่ / {newsletterStats.total} ฉบับ
                    </Badge>
                  ) : null}
                  <Link to="/admin/dashboard?tab=newsletters">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      จัดการข้อมูลจดหมายข่าว
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-secondary/40 border border-border">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      แสดงส่วนจดหมายข่าวประชาสัมพันธ์บนหน้าหลัก (Index)
                    </p>
                    <Badge variant="outline" className="font-mono text-xs">
                      ตำแหน่งปัจจุบัน: #{newsletterHomepageSection?.order ?? 4}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    เปิดแสดงการ์ดจดหมายข่าวจาก Supabase บนหน้าแรกโดยอัตโนมัติ (ซิงค์กับรายการจัดลำดับด้านบน)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(!newsletterHomepageSection?.enabled ||
                    (newsletterHomepageSection?.order ?? 4) > 4) && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={promoteNewsletterSectionTop}
                      className="text-xs"
                    >
                      ย้ายขึ้นแสดงหลังข่าวสาร (#4)
                    </Button>
                  )}
                  <Switch
                    checked={newsletterHomepageSection?.enabled ?? true}
                    onCheckedChange={(checked) => {
                      updateHomepageSections(
                        homepageSections.map((item) =>
                          item.id === 'newsletter' ? { ...item, enabled: checked } : item
                        )
                      );
                    }}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nl_section_title">หัวข้อส่วนจดหมายข่าวบนหน้าหลัก</Label>
                  <Input
                    id="nl_section_title"
                    value={settings.newsletter_section_title ?? newsletterDisplay.title}
                    onChange={(e) => handleChange('newsletter_section_title', e.target.value)}
                    placeholder={DEFAULT_NEWSLETTER_DISPLAY_CONFIG.title}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nl_section_subtitle">คำอธิบายรอง</Label>
                  <Input
                    id="nl_section_subtitle"
                    value={settings.newsletter_section_subtitle ?? newsletterDisplay.subtitle}
                    onChange={(e) => handleChange('newsletter_section_subtitle', e.target.value)}
                    placeholder={DEFAULT_NEWSLETTER_DISPLAY_CONFIG.subtitle}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>จำนวนจดหมายข่าวที่แสดงหน้าหลัก</Label>
                  <Select
                    value={String(newsletterDisplay.limit)}
                    onValueChange={(val) => handleChange('newsletter_home_limit', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 ฉบับ (แนะนำ · 1 แถว)</SelectItem>
                      <SelectItem value="4">4 ฉบับ (4 คอลัมน์)</SelectItem>
                      <SelectItem value="6">6 ฉบับ (2 แถว)</SelectItem>
                      <SelectItem value="9">9 ฉบับ (3 แถว)</SelectItem>
                      <SelectItem value="12">12 ฉบับ (4 แถว)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>กรองหมวดหมู่ที่แสดงหน้าหลัก</Label>
                  <Select
                    value={newsletterDisplay.category}
                    onValueChange={(val) => handleChange('newsletter_home_category', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NEWSLETTER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>วิธีเรียงลำดับจดหมายข่าวหน้าหลัก</Label>
                  <Select
                    value={newsletterDisplay.sortMode}
                    onValueChange={(val) => handleChange('newsletter_home_sort', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">ล่าสุดตามวันที่ออกฉบับ (Latest)</SelectItem>
                      <SelectItem value="custom_order">ตามลำดับที่แอดมินจัดไว้ (order_position)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">
                    จัดลำดับบล็อกย่อยภายในศูนย์ข่าวประชาสัมพันธ์ (News Hub)
                  </CardTitle>
                  <CardDescription>
                    จัดเรียงแถวข่าวประชาสัมพันธ์ กิจกรรมล่าสุด ไฮไลต์ และทางลัดบริการด่วน
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => updateNewsHubSections(DEFAULT_NEWS_HUB_SUBSECTIONS)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  รีเซ็ต News Hub
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleNewsHubDragEnd}
              >
                <SortableContext
                  items={newsHubSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {newsHubSections.map((sub, idx) => (
                      <SortableOrderRow
                        key={sub.id}
                        id={sub.id}
                        index={idx}
                        total={newsHubSections.length}
                        label={sub.label}
                        subtitle={sub.subtitle}
                        enabled={sub.enabled}
                        compact
                        onMoveUp={() =>
                          updateNewsHubSections(moveItemInOrder(newsHubSections, idx, 'up'))
                        }
                        onMoveDown={() =>
                          updateNewsHubSections(moveItemInOrder(newsHubSections, idx, 'down'))
                        }
                        onToggle={(checked) => {
                          updateNewsHubSections(
                            newsHubSections.map((item) =>
                              item.id === sub.id ? { ...item, enabled: checked } : item
                            )
                          );
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          {/* Direct Links to Per-Item Content Ordering */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">จัดเรียงลำดับข้อมูลรายชิ้นภายในแต่ละหมวด</CardTitle>
              <CardDescription>
                เลือกเข้าไปจัดลำดับเนื้อหารายการย่อย (ข่าวสาร, จดหมายข่าว, ผู้บริหาร, หลักสูตร, กิจกรรม) ซึ่งเชื่อมต่อหน้าแรกแบบเรียลไทม์
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link to="/admin/dashboard?tab=news">
                <Button type="button" variant="outline" className="w-full justify-start gap-2">
                  <Newspaper className="w-4 h-4 text-primary" />
                  เรียงลำดับข่าวสารหน้าแรก
                </Button>
              </Link>
              <Link to="/admin/dashboard?tab=newsletters">
                <Button type="button" variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  จัดการ / เรียงลำดับจดหมายข่าว
                </Button>
              </Link>
              <Link to="/admin/dashboard?tab=administrators">
                <Button type="button" variant="outline" className="w-full justify-start gap-2">
                  <UserCog className="w-4 h-4 text-primary" />
                  เรียงลำดับผู้บริหาร
                </Button>
              </Link>
              <Link to="/admin/dashboard?tab=curriculum">
                <Button type="button" variant="outline" className="w-full justify-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  เรียงลำดับหลักสูตร
                </Button>
              </Link>
              <Link to="/admin/dashboard?tab=activities">
                <Button type="button" variant="outline" className="w-full justify-start gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  เรียงลำดับกิจกรรมเสริม
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: WELCOME POPUP MODAL */}
        <TabsContent value="popup" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    หน้าต่างป๊อปอัปแสดงผลก่อนเข้าหน้าแรก (Index Popup)
                  </CardTitle>
                  <CardDescription>
                    แสดงโปสเตอร์รูปภาพ หรือข้อความประกาศสำคัญตามช่วงเวลาที่กำหนด ก่อนผู้เข้าชมใช้งานหน้าหลัก
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetWelcomePopupDismissal();
                      toast({
                        title: 'รีเซ็ตสถานะการซ่อนป๊อปอัปแล้ว',
                        description: 'เมื่อกลับไปที่หน้าแรก (/) ป๊อปอัปจะแสดงผลทันทีหากเปิดใช้งานอยู่',
                      });
                    }}
                  >
                    ล้างประวัติการปิดบนเครื่องนี้
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setPreviewPopupOpen(true)}
                  >
                    <Eye className="w-4 h-4" />
                    ดูตัวอย่างป๊อปอัป
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-secondary/40 border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">เปิดใช้งานหน้าต่างป๊อปอัปหน้าแรก</p>
                    {popupConfig.enabled ? (
                      isPopupLiveNow ? (
                        <Badge className="bg-emerald-600">กำลังแสดงผลออนไลน์</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-400">
                          เปิดไว้แต่นอกช่วงวันที่กำหนด
                        </Badge>
                      )
                    ) : (
                      <Badge variant="secondary">ปิดอยู่</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    เมื่อเปิดใช้งาน หน้าต่างป๊อปอัปจะแสดงทับด้านบนสุดก่อนเข้าดูข้อมูลหน้าแรก (Index)
                  </p>
                </div>
                <Switch
                  checked={popupConfig.enabled}
                  onCheckedChange={(checked) =>
                    handleChange('popup_enabled', checked ? 'true' : 'false')
                  }
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>รูปแบบการแสดงผล</Label>
                  <Select
                    value={popupConfig.layout}
                    onValueChange={(val) => handleChange('popup_layout', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image_and_text">รูปภาพ + ข้อความประกาศ</SelectItem>
                      <SelectItem value="image_only">โปสเตอร์รูปภาพอย่างเดียว</SelectItem>
                      <SelectItem value="text_only">ข้อความสำคัญอย่างเดียว</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ความถี่ในการแสดงผล</Label>
                  <Select
                    value={popupConfig.frequency}
                    onValueChange={(val) => handleChange('popup_frequency', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once_per_day">วันละ 1 ครั้ง (แนะนำ)</SelectItem>
                      <SelectItem value="once_per_session">ครั้งเดียวต่อการเปิดเบราว์เซอร์</SelectItem>
                      <SelectItem value="every_visit">แสดงทุกครั้งที่เข้าหน้าแรก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>โทนสีเน้นปุ่มและแถบหัว</Label>
                  <Select
                    value={popupConfig.themeAccent}
                    onValueChange={(val) => handleChange('popup_theme_accent', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sky">ฟ้าสดใส (Sky)</SelectItem>
                      <SelectItem value="navy">น้ำเงินกรม (Navy)</SelectItem>
                      <SelectItem value="amber">ทอง (Amber)</SelectItem>
                      <SelectItem value="rose">แดงทับทิม (Rose)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_badge">ป้ายกำกับด้านบน (Badge)</Label>
                  <Input
                    id="hp_popup_badge"
                    value={settings.popup_badge ?? ''}
                    onChange={(e) => handleChange('popup_badge', e.target.value)}
                    placeholder={DEFAULT_WELCOME_POPUP_CONFIG.badge}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_title">หัวข้อประกาศสำคัญ</Label>
                  <Input
                    id="hp_popup_title"
                    value={settings.popup_title ?? ''}
                    onChange={(e) => handleChange('popup_title', e.target.value)}
                    placeholder={DEFAULT_WELCOME_POPUP_CONFIG.title}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hp_popup_subtitle">หัวข้อรอง / คำเชิญชวน</Label>
                <Input
                  id="hp_popup_subtitle"
                  value={settings.popup_subtitle ?? ''}
                  onChange={(e) => handleChange('popup_subtitle', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.subtitle}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hp_popup_description">ข้อความรายละเอียดสำคัญ</Label>
                <textarea
                  id="hp_popup_description"
                  value={settings.popup_description ?? ''}
                  onChange={(e) => handleChange('popup_description', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.description}
                  className="w-full min-h-[85px] px-3 py-2 border rounded-md text-sm bg-background"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>รูปภาพโปสเตอร์ / แบนเนอร์ป๊อปอัป</Label>
                  {settings.popup_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearPopupImage}
                      className="text-destructive hover:text-destructive gap-1 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ลบรูปป๊อปอัป
                    </Button>
                  )}
                </div>
                <ImageUpload
                  currentImage={settings.popup_image_url || ''}
                  onUploadComplete={(url) => handleChange('popup_image_url', url)}
                  folder="popups"
                  compressionPreset="cover"
                />
                <Input
                  value={settings.popup_image_url || ''}
                  onChange={(e) => handleChange('popup_image_url', e.target.value)}
                  placeholder="หรือวางลิงก์รูปภาพโดยตรง (https://...)"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_cta_text">ข้อความปุ่มหลัก</Label>
                  <Input
                    id="hp_popup_cta_text"
                    value={settings.popup_cta_text ?? ''}
                    onChange={(e) => handleChange('popup_cta_text', e.target.value)}
                    placeholder={DEFAULT_WELCOME_POPUP_CONFIG.ctaText}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_cta_url">ลิงก์ปลายทางปุ่มหลัก (เช่น /enrollment หรือ https://...)</Label>
                  <Input
                    id="hp_popup_cta_url"
                    value={settings.popup_cta_url ?? ''}
                    onChange={(e) => handleChange('popup_cta_url', e.target.value)}
                    placeholder={DEFAULT_WELCOME_POPUP_CONFIG.ctaUrl}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_sec_text">ข้อความปุ่มรอง</Label>
                  <Input
                    id="hp_popup_sec_text"
                    value={settings.popup_secondary_text ?? ''}
                    onChange={(e) => handleChange('popup_secondary_text', e.target.value)}
                    placeholder={DEFAULT_WELCOME_POPUP_CONFIG.secondaryText}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_sec_url">ลิงก์ปลายทางปุ่มรอง</Label>
                  <Input
                    id="hp_popup_sec_url"
                    value={settings.popup_secondary_url ?? ''}
                    onChange={(e) => handleChange('popup_secondary_url', e.target.value)}
                    placeholder={DEFAULT_WELCOME_POPUP_CONFIG.secondaryUrl}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_start">แสดงตั้งแต่วันที่ (กำหนดช่วงเวลา - ไม่บังคับ)</Label>
                  <Input
                    id="hp_popup_start"
                    type="date"
                    value={settings.popup_start_date || ''}
                    onChange={(e) => handleChange('popup_start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hp_popup_end">ถึงวันที่ (หมดเขตอัตโนมัติ - ไม่บังคับ)</Label>
                  <Input
                    id="hp_popup_end"
                    type="date"
                    value={settings.popup_end_date || ''}
                    onChange={(e) => handleChange('popup_end_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SUPABASE + VERCEL + GITHUB REALTIME CONNECTION */}
        <TabsContent value="cloud" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    ตรวจสอบการเชื่อมต่อฐานข้อมูล Supabase เดิมและตารางเพิ่มเติม
                  </CardTitle>
                  <CardDescription>
                    ยืนยันการอ่านข้อมูลเดิมทั้งหมดในโปรเจกต์ <code className="font-mono">{projectRef}</code> และเช็กความพร้อมของตารางใหม่
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={checkingHealth}
                  onClick={() => void checkDatabaseHealth()}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingHealth ? 'animate-spin' : ''}`} />
                  {checkingHealth ? 'กำลังตรวจสอบ...' : 'ตรวจสอบตารางทั้งหมด'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSupabaseConfigured && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                  ยังไม่พบค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ใน Environment — กำลังทำงานในโหมดสำรองในเครื่อง
                </div>
              )}

              {tableHealth.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-border bg-secondary/20">
                  <p className="text-sm text-muted-foreground mb-3">
                    กดปุ่ม "ตรวจสอบตารางทั้งหมด" เพื่อเช็กจำนวนข้อมูลจริงจาก Supabase และสถานะตารางเพิ่มเติม
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void checkDatabaseHealth()}
                    disabled={checkingHealth}
                  >
                    เริ่มตรวจสอบการเชื่อมต่อทันที
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {tableHealth.map((res) => (
                    <div
                      key={res.table}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                        res.ok
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-amber-500/5 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {res.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{res.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {res.group === 'existing' ? 'ข้อมูลเดิม Supabase' : 'ตารางส่วนเพิ่มเติม (Migration 014)'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={res.ok ? 'outline' : 'secondary'} className="shrink-0 font-mono">
                        {res.ok ? `${res.count} แถว` : 'ยังไม่สร้างตาราง'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* SQL Script Copy Box for New Tables + Postgres Realtime */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      สคริปต์ SQL เพิ่มตารางจัดลำดับ / ป๊อปอัป และเปิด Realtime บน Supabase
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ปลอดภัย 100% ใช้ <code className="font-mono">IF NOT EXISTS</code> และ <code className="font-mono">ON CONFLICT DO NOTHING</code> ไม่ทับข้อมูลโรงเรียนเดิม
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCopySql} className="gap-1.5">
                      <Copy className="w-3.5 h-3.5" />
                      คัดลอก SQL
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        window.open(
                          `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      เปิด Supabase SQL Editor
                    </Button>
                  </div>
                </div>
                <pre className="max-h-44 overflow-auto p-3 rounded-lg bg-slate-950 text-slate-200 text-[11px] font-mono leading-relaxed">
                  {SUPABASE_EXTENDED_MIGRATION_SQL}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Vercel & GitHub Sync Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                ตั้งค่าการเชื่อมต่อ Vercel ออนไลน์และ GitHub
              </CardTitle>
              <CardDescription>
                ข้อมูลจาก Supabase จะอัปเดตบนเว็บไซต์ Vercel แบบเรียลไทม์ทันทีผ่าน Realtime Broadcast และเมื่อ Push ขึ้น GitHub แล้ว Vercel จะ Build อัตโนมัติ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cloud_github_repo">GitHub Repository URL</Label>
                  <Input
                    id="cloud_github_repo"
                    value={
                      settings.github_repo_url || 'https://github.com/SpokRocco/Hadket-School'
                    }
                    onChange={(e) => handleChange('github_repo_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloud_github_branch">GitHub Production Branch</Label>
                  <Input
                    id="cloud_github_branch"
                    value={settings.github_branch || 'main'}
                    onChange={(e) => handleChange('github_branch', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloud_vercel_url">URL เว็บไซต์ออนไลน์บน Vercel</Label>
                <div className="flex gap-2">
                  <Input
                    id="cloud_vercel_url"
                    value={settings.vercel_site_url || ''}
                    onChange={(e) => handleChange('vercel_site_url', e.target.value)}
                    placeholder="https://hadket-school.vercel.app"
                  />
                  {settings.vercel_site_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(settings.vercel_site_url, '_blank')}
                      className="shrink-0 gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      เปิดเว็บ
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloud_vercel_hook">
                  Vercel Deploy Hook URL (ไม่บังคับ — ใช้สั่ง Rebuild เว็บจากหน้าแอดมิน)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cloud_vercel_hook"
                    type="password"
                    value={settings.vercel_deploy_hook_url || ''}
                    onChange={(e) => handleChange('vercel_deploy_hook_url', e.target.value)}
                    placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={triggeringDeploy || !settings.vercel_deploy_hook_url}
                    onClick={handleTriggerVercelDeploy}
                    className="shrink-0 gap-1.5"
                  >
                    <Rocket className="w-4 h-4" />
                    {triggeringDeploy ? 'กำลังสั่ง...' : 'สั่ง Rebuild Vercel'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  หมายเหตุ: การแก้ไขเนื้อหา ข่าวสาร ลำดับหน้าแรก และป๊อปอัป ไม่จำเป็นต้อง Rebuild ใหม่ ระบบอัปเดตจาก Supabase ไปยังเว็บไซต์ออนไลน์อัตโนมัติทันที
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Sticky Save */}
      <div className="flex justify-end pt-2">
        <Button type="button" onClick={handleSaveAll} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </Button>
      </div>
    </div>
  );
};

