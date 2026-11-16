import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  LayoutTemplate,
  Loader2,
  Paperclip,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentAdminUser, normalizeRole } from '@/utils/authUtils';
import {
  DEFAULT_NEWSLETTER_ORG_SETTINGS,
  NEWSLETTER_CATEGORIES,
  NEWSLETTER_MIN_IMAGES,
  NEWSLETTER_SCHEMA_MIGRATION_SQL,
  NEWSLETTER_STATUS_META,
  NEWSLETTER_TEMPLATES,
  formatThaiDate,
  parseImageUrlsList,
  type NewsletterOrgSettings,
  type NewsletterStatus,
  type NewsletterTemplateType,
  type SchoolNewsletter,
} from '@/utils/newsletterUtils';
import {
  deleteNewsletterWithCompat,
  fetchNewslettersWithCompat,
  saveNewsletterOrgSettings,
  saveNewsletterWithCompat,
} from '@/utils/newsletterStorage';
import {
  runAiContentRefiner,
  runAiSmartLayoutAssistant,
} from '@/utils/newsletterBrowserUtils';
import { NewsletterMultiImageUploader } from './NewsletterMultiImageUploader';
import { ScaledNewsletterA4Preview } from './NewsletterA4Sheet';
import {
  NewsletterA4PreviewModal,
  useNewsletterPrintAndPdf,
} from './NewsletterA4PreviewModal';

const TemplateWireframeIcon = ({ type }: { type: NewsletterTemplateType }) => {
  if (type === 'template_1') {
    return (
      <div className="w-12 h-14 rounded border border-current/30 p-1 flex flex-col gap-0.5 shrink-0">
        <div className="h-5 rounded-xs bg-current/25" />
        <div className="h-2 rounded-xs bg-current/15" />
        <div className="flex-1 grid grid-cols-3 gap-0.5">
          <div className="bg-current/25 rounded-xs" />
          <div className="bg-current/25 rounded-xs" />
          <div className="bg-current/25 rounded-xs" />
        </div>
      </div>
    );
  }
  if (type === 'template_2') {
    return (
      <div className="w-12 h-14 rounded border border-current/30 p-1 flex flex-col gap-0.5 shrink-0">
        <div className="grid grid-cols-2 gap-0.5 h-4">
          <div className="bg-current/25 rounded-xs" />
          <div className="bg-current/15 rounded-xs" />
        </div>
        <div className="grid grid-cols-2 gap-0.5 h-4">
          <div className="bg-current/15 rounded-xs" />
          <div className="bg-current/25 rounded-xs" />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-0.5">
          <div className="bg-current/25 rounded-xs" />
          <div className="bg-current/25 rounded-xs" />
          <div className="bg-current/25 rounded-xs" />
        </div>
      </div>
    );
  }
  if (type === 'template_3') {
    return (
      <div className="w-12 h-14 rounded border border-current/30 p-1 flex flex-col gap-0.5 shrink-0">
        <div className="grid grid-cols-3 gap-0.5 h-7">
          <div className="col-span-2 bg-current/25 rounded-xs" />
          <div className="grid grid-rows-2 gap-0.5">
            <div className="bg-current/25 rounded-xs" />
            <div className="bg-current/25 rounded-xs" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0.5 h-2.5">
          <div className="bg-current/25 rounded-xs" />
          <div className="bg-current/25 rounded-xs" />
          <div className="bg-current/25 rounded-xs" />
        </div>
        <div className="flex-1 bg-current/15 rounded-xs" />
      </div>
    );
  }
  return (
    <div className="w-12 h-14 rounded border border-current/30 p-1 flex flex-col gap-0.5 shrink-0">
      <div className="h-4 bg-current/15 rounded-xs" />
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-0.5">
        <div className="bg-current/25 rounded-xs" />
        <div className="bg-current/25 rounded-xs" />
        <div className="bg-current/25 rounded-xs" />
        <div className="bg-current/25 rounded-xs" />
      </div>
    </div>
  );
};

export const NewslettersManagement = () => {
  const { settings } = useSchoolSettings();
  const currentUser = getCurrentAdminUser();
  const role = normalizeRole(currentUser?.role);
  const isAdmin = role === 'admin';
  const isExecutive = role === 'executive';
  const isTeacher = role === 'teacher';

  const [newsletters, setNewsletters] = useState<SchoolNewsletter[]>([]);
  const [orgSettings, setOrgSettings] = useState<NewsletterOrgSettings>(
    DEFAULT_NEWSLETTER_ORG_SETTINGS
  );
  const [nativeSchemaReady, setNativeSchemaReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter tabs
  const [statusFilter, setStatusFilter] = useState<'all' | NewsletterStatus>(
    isExecutive ? 'pending' : 'all'
  );

  // Dialog states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolNewsletter | null>(null);
  const [previewItem, setPreviewItem] = useState<SchoolNewsletter | null>(null);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // AI assistant states
  const [isRunningAiLayout, setIsRunningAiLayout] = useState(false);
  const [isRunningAiContent, setIsRunningAiContent] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Org settings draft form (Admin)
  const [orgForm, setOrgForm] = useState<NewsletterOrgSettings>(DEFAULT_NEWSLETTER_ORG_SETTINGS);

  // Newsletter Editor form
  const [formData, setFormData] = useState({
    issue_no: '01',
    academic_year: settings.academic_year || '2569',
    issue_date: new Date().toISOString().split('T')[0],
    title: '',
    summary: '',
    content: '',
    category: 'กิจกรรมสถานศึกษา',
    image_urls: [] as string[],
    template_type: 'template_1' as NewsletterTemplateType,
    file_url: '',
    is_published: false,
    status: 'draft' as NewsletterStatus,
    revision_note: '' as string,
    approved_by: '' as string,
    approved_at: '' as string,
    created_by: currentUser?.username || '',
    created_by_name: currentUser?.display_name || '',
  });

  const { toast } = useToast();

  // Live preview hook for the editor dialog
  const draftPreviewModel: Partial<SchoolNewsletter> = useMemo(
    () => ({
      id: editingItem?.id || 'draft-preview',
      issue_no: formData.issue_no,
      academic_year: formData.academic_year,
      issue_date: formData.issue_date,
      title: formData.title,
      summary: formData.summary,
      content: formData.content,
      category: formData.category,
      image_url: formData.image_urls[0] || null,
      image_urls: formData.image_urls,
      template_type: formData.template_type,
      status: formData.status,
      approved_by: formData.approved_by || null,
      approved_at: formData.approved_at || null,
      created_by_name: formData.created_by_name || currentUser?.display_name || null,
      is_published: formData.is_published,
    }),
    [editingItem?.id, formData, currentUser?.display_name]
  );

  const {
    sheetRef: editorSheetRef,
    exportingPdf: editorExportingPdf,
    handlePrintA4: handleEditorPrintA4,
    handleExportPdf: handleEditorExportPdf,
    printPortal: editorPrintPortal,
  } = useNewsletterPrintAndPdf(draftPreviewModel, settings, orgSettings);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchNewslettersWithCompat();
      setNewsletters(result.newsletters);
      setOrgSettings(result.orgSettings);
      setOrgForm(result.orgSettings);
      setNativeSchemaReady(result.nativeSchemaReady);
    } catch (error: any) {
      console.error('Error fetching newsletters:', error);
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลจดหมายข่าวไม่สำเร็จ',
        description: error?.message || 'กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล Supabase',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    return subscribeToRealtimeTables(
      'realtime_admin_newsletters',
      ['newsletters', 'school_settings'],
      loadData
    );
  }, [loadData]);

  // Role-scoped list
  const visibleByRole = useMemo(() => {
    if (isTeacher && currentUser?.username) {
      return newsletters.filter(
        (n) => (n.created_by || '').toLowerCase() === currentUser.username.toLowerCase()
      );
    }
    return newsletters;
  }, [isTeacher, currentUser?.username, newsletters]);

  const filteredNewsletters = useMemo(() => {
    if (statusFilter === 'all') return visibleByRole;
    return visibleByRole.filter((n) => (n.status || 'draft') === statusFilter);
  }, [visibleByRole, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: visibleByRole.length, draft: 0, pending: 0, revision: 0, approved: 0 };
    for (const item of visibleByRole) {
      const st = item.status || (item.is_published ? 'approved' : 'draft');
      if (st in counts) {
        counts[st as NewsletterStatus] += 1;
      }
    }
    return counts;
  }, [visibleByRole]);

  const resetForm = useCallback(() => {
    const nextIssueNum = String(newsletters.length + 1).padStart(2, '0');
    setFormData({
      issue_no: nextIssueNum,
      academic_year: settings.academic_year || '2569',
      issue_date: new Date().toISOString().split('T')[0],
      title: '',
      summary: '',
      content: '',
      category: 'กิจกรรมสถานศึกษา',
      image_urls: [],
      template_type: orgSettings.defaultTemplate || 'template_1',
      file_url: '',
      is_published: false,
      status: 'draft',
      revision_note: '',
      approved_by: '',
      approved_at: '',
      created_by: currentUser?.username || '',
      created_by_name: currentUser?.display_name || '',
    });
    setEditingItem(null);
    setAiInsight(null);
  }, [
    newsletters.length,
    settings.academic_year,
    orgSettings.defaultTemplate,
    currentUser?.username,
    currentUser?.display_name,
  ]);

  const handleOpenEditor = (item?: SchoolNewsletter) => {
    if (item) {
      const resolvedUrls = parseImageUrlsList(item.image_urls, item.image_url);
      setEditingItem(item);
      setFormData({
        issue_no: item.issue_no,
        academic_year: item.academic_year || '2569',
        issue_date: item.issue_date,
        title: item.title,
        summary: item.summary || '',
        content: item.content || '',
        category: item.category || 'กิจกรรมสถานศึกษา',
        image_urls: resolvedUrls,
        template_type: item.template_type || orgSettings.defaultTemplate || 'template_1',
        file_url: item.file_url || '',
        is_published: item.is_published,
        status: item.status || (item.is_published ? 'approved' : 'draft'),
        revision_note: item.revision_note || '',
        approved_by: item.approved_by || '',
        approved_at: item.approved_at || '',
        created_by: item.created_by || currentUser?.username || '',
        created_by_name: item.created_by_name || currentUser?.display_name || '',
      });
      setAiInsight(null);
    } else {
      resetForm();
    }
    setIsEditorOpen(true);
  };

  const handleAiSmartLayout = async () => {
    if (formData.image_urls.length === 0) {
      toast({
        variant: 'destructive',
        title: 'กรุณาอัปโหลดรูปภาพก่อน',
        description: 'อัปโหลดรูปภาพ 4–6 รูปเพื่อให้ AI วิเคราะห์สัดส่วนและจัดวางเทมเพลตที่เหมาะสม',
      });
      return;
    }

    setIsRunningAiLayout(true);
    try {
      const plan = await runAiSmartLayoutAssistant({
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        category: formData.category,
        imageUrls: formData.image_urls,
      });

      setFormData((prev) => ({
        ...prev,
        template_type: plan.recommendedTemplate,
        image_urls: plan.orderedUrls,
      }));
      setAiInsight(plan.reason);

      const templateLabel =
        NEWSLETTER_TEMPLATES.find((t) => t.id === plan.recommendedTemplate)?.name ||
        plan.recommendedTemplate;

      toast({
        title:
          plan.source === 'gemini'
            ? `AI Gemini เลือกเทมเพลต ${templateLabel} ให้แล้ว`
            : `AI จัดองค์ประกอบ (${templateLabel}) สำเร็จ`,
        description: plan.reason,
      });
    } finally {
      setIsRunningAiLayout(false);
    }
  };

  const handleAiRefineContent = async () => {
    if (!formData.title.trim() && !formData.content.trim() && !formData.summary.trim()) {
      toast({
        variant: 'destructive',
        title: 'กรุณากรอกหัวข้อหรือเนื้อหาเบื้องต้นก่อน',
      });
      return;
    }

    setIsRunningAiContent(true);
    try {
      const refined = await runAiContentRefiner({
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        templateType: formData.template_type,
      });

      setFormData((prev) => ({
        ...prev,
        summary: refined.summary,
        content: refined.content,
      }));

      toast({
        title: 'AI ปรับสมดุลเนื้อหาเรียบร้อย',
        description: refined.note,
      });
    } finally {
      setIsRunningAiContent(false);
    }
  };

  const handleSaveWithStatus = async (targetStatus: NewsletterStatus) => {
    if (!formData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'กรุณากรอกหัวข้อจดหมายข่าว',
      });
      return;
    }

    const isLegacySinglePoster =
      Boolean(editingItem) &&
      (Boolean(editingItem?.image_url) || Boolean(formData.file_url.trim())) &&
      formData.image_urls.length <= 1;

    if (
      targetStatus !== 'draft' &&
      !isLegacySinglePoster &&
      formData.image_urls.length < NEWSLETTER_MIN_IMAGES
    ) {
      toast({
        variant: 'destructive',
        title: `กรุณาอัปโหลดรูปภาพอย่างน้อย ${NEWSLETTER_MIN_IMAGES} รูป (4–6 รูป)`,
        description:
          'กรุณาเพิ่มรูปภาพให้ครบ 4–6 รูปก่อนส่งขออนุมัติหรือเผยแพร่ (หรือกด “บันทึกแบบร่าง” ไว้ก่อนได้)',
      });
      return;
    }

    setSaving(true);
    try {
      const isApproved = targetStatus === 'approved';
      const maxOrder =
        newsletters.length > 0
          ? Math.max(...newsletters.map((n) => n.order_position || 0))
          : 0;

      const approvedBy = isApproved
        ? formData.approved_by || currentUser?.display_name || 'ผู้ดูแลระบบ'
        : targetStatus === 'pending'
          ? null
          : formData.approved_by || null;
      const approvedAt = isApproved
        ? formData.approved_at || new Date().toISOString()
        : targetStatus === 'pending'
          ? null
          : formData.approved_at || null;

      await saveNewsletterWithCompat(
        {
          issue_no: formData.issue_no,
          academic_year: formData.academic_year,
          issue_date: formData.issue_date,
          title: formData.title,
          summary: formData.summary || null,
          content: formData.content || null,
          category: formData.category,
          image_urls: formData.image_urls,
          template_type: formData.template_type,
          status: targetStatus,
          revision_note: targetStatus === 'pending' ? null : formData.revision_note || null,
          approved_by: approvedBy,
          approved_at: approvedAt,
          created_by: formData.created_by || currentUser?.username || null,
          created_by_name: formData.created_by_name || currentUser?.display_name || null,
          file_url: formData.file_url || null,
          is_published: isApproved,
          order_position: editingItem ? editingItem.order_position : maxOrder + 1,
        },
        editingItem?.id
      );

      const statusMsg =
        targetStatus === 'pending'
          ? 'ส่งเรื่องถึงผู้บริหารเพื่อขออนุมัติเผยแพร่แล้ว'
          : targetStatus === 'approved'
            ? 'อนุมัติและเผยแพร่จดหมายข่าวบนเว็บไซต์แล้ว'
            : 'บันทึกแบบร่างจดหมายข่าวเรียบร้อยแล้ว';

      toast({
        title: 'บันทึกข้อมูลสำเร็จ',
        description: statusMsg,
      });

      setIsEditorOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Save newsletter error:', error);
      toast({
        variant: 'destructive',
        title: 'บันทึกไม่สำเร็จ',
        description: error?.message || 'ไม่สามารถบันทึกจดหมายข่าวได้',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveNewsletter = async (item: SchoolNewsletter) => {
    try {
      const urls = parseImageUrlsList(item.image_urls, item.image_url);
      await saveNewsletterWithCompat(
        {
          issue_no: item.issue_no,
          academic_year: item.academic_year,
          issue_date: item.issue_date,
          title: item.title,
          summary: item.summary,
          content: item.content,
          category: item.category,
          image_urls: urls,
          template_type: item.template_type || 'template_1',
          status: 'approved',
          revision_note: null,
          approved_by: currentUser?.display_name || 'ผู้บริหารสถานศึกษา',
          approved_at: new Date().toISOString(),
          created_by: item.created_by,
          created_by_name: item.created_by_name,
          file_url: item.file_url,
          is_published: true,
          order_position: item.order_position,
        },
        item.id
      );

      toast({
        title: 'อนุมัติเผยแพร่เรียบร้อยแล้ว',
        description: `ฉบับที่ ${item.issue_no}/${item.academic_year} แสดงผลบนหน้าเว็บไซต์ทันที`,
      });
      await loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'อนุมัติไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาด',
      });
    }
  };

  const handleRequestRevision = async (item: SchoolNewsletter, note: string) => {
    try {
      const urls = parseImageUrlsList(item.image_urls, item.image_url);
      await saveNewsletterWithCompat(
        {
          issue_no: item.issue_no,
          academic_year: item.academic_year,
          issue_date: item.issue_date,
          title: item.title,
          summary: item.summary,
          content: item.content,
          category: item.category,
          image_urls: urls,
          template_type: item.template_type || 'template_1',
          status: 'revision',
          revision_note: note,
          approved_by: null,
          approved_at: null,
          created_by: item.created_by,
          created_by_name: item.created_by_name,
          file_url: item.file_url,
          is_published: false,
          order_position: item.order_position,
        },
        item.id
      );

      toast({
        title: 'ส่งกลับให้แก้ไขแล้ว',
        description: 'บันทึกหมายเหตุแก้ไขส่งถึงผู้จัดทำเรียบร้อยแล้ว',
      });
      await loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'ส่งกลับไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาด',
      });
    }
  };

  const handleTogglePublished = async (item: SchoolNewsletter, checked: boolean) => {
    try {
      const urls = parseImageUrlsList(item.image_urls, item.image_url);
      await saveNewsletterWithCompat(
        {
          issue_no: item.issue_no,
          academic_year: item.academic_year,
          issue_date: item.issue_date,
          title: item.title,
          summary: item.summary,
          content: item.content,
          category: item.category,
          image_urls: urls,
          template_type: item.template_type || 'template_1',
          status: checked ? 'approved' : 'draft',
          revision_note: item.revision_note,
          approved_by: checked
            ? item.approved_by || currentUser?.display_name || 'ผู้ดูแลระบบ'
            : item.approved_by,
          approved_at: checked ? item.approved_at || new Date().toISOString() : item.approved_at,
          created_by: item.created_by,
          created_by_name: item.created_by_name,
          file_url: item.file_url,
          is_published: checked,
          order_position: item.order_position,
        },
        item.id
      );

      toast({
        title: checked ? 'เผยแพร่จดหมายข่าวแล้ว' : 'ซ่อนเป็นแบบร่างแล้ว',
        description: `ฉบับที่ ${item.issue_no}/${item.academic_year}`,
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'อัปเดตสถานะไม่สำเร็จ',
        description: error?.message || 'ไม่สามารถเปลี่ยนสถานะการเผยแพร่ได้',
      });
    }
  };

  const handleDelete = async (item: SchoolNewsletter) => {
    if (!confirm(`ต้องการลบจดหมายข่าว "${item.title}" หรือไม่?`)) return;
    try {
      await deleteNewsletterWithCompat(item);
      toast({
        title: 'ลบสำเร็จ',
        description: 'ลบจดหมายข่าวและรูปภาพที่เกี่ยวข้องเรียบร้อยแล้ว',
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'ลบไม่สำเร็จ',
        description: error?.message || 'ไม่สามารถลบจดหมายข่าวได้',
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
      await Promise.all(
        normalized.map((item) =>
          saveNewsletterWithCompat(
            {
              issue_no: item.issue_no,
              academic_year: item.academic_year,
              issue_date: item.issue_date,
              title: item.title,
              summary: item.summary,
              content: item.content,
              category: item.category,
              image_urls: parseImageUrlsList(item.image_urls, item.image_url),
              template_type: item.template_type || 'template_1',
              status: item.status || (item.is_published ? 'approved' : 'draft'),
              revision_note: item.revision_note,
              approved_by: item.approved_by,
              approved_at: item.approved_at,
              created_by: item.created_by,
              created_by_name: item.created_by_name,
              file_url: item.file_url,
              is_published: item.is_published,
              order_position: item.order_position,
            },
            item.id
          )
        )
      );
      toast({
        title: 'จัดลำดับสำเร็จ',
        description: 'บันทึกลำดับจดหมายข่าวลง Supabase แล้ว',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'บันทึกลำดับไม่สำเร็จ',
        description: error?.message || 'ไม่สามารถบันทึกลำดับได้',
      });
      await loadData();
    }
  };

  const handleSaveOrgDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveNewsletterOrgSettings(orgForm);
      setOrgSettings(orgForm);
      setIsOrgDialogOpen(false);
      toast({
        title: 'บันทึกการตั้งค่ามาตรฐานสำเร็จ',
        description: 'อัปเดตเทมเพลตเริ่มต้น หัวกระดาษ และท้ายกระดาษ A4 เรียบร้อยแล้ว',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'บันทึกไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาด',
      });
    }
  };

  const categoryChoices = NEWSLETTER_CATEGORIES.filter((c) => c !== 'ทั้งหมด');

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {editorPrintPortal}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <Sparkles className="w-3 h-3 text-accent" />
              4–6 Photos • 4 Templates • AI Layout • A4 PDF
            </Badge>
            {isTeacher && (
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                โหมดครูผู้จัดทำ (จัดการฉบับของตนเอง & ส่งอนุมัติ)
              </Badge>
            )}
            {isExecutive && (
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-800 bg-amber-50">
                โหมดผู้บริหาร (ตรวจสอบ & อนุมัติเผยแพร่)
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
            {isExecutive
              ? 'ตรวจสอบและอนุมัติจดหมายข่าว (Executive Review)'
              : 'จัดการจดหมายข่าวประชาสัมพันธ์ (School Newsletter)'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isExecutive
              ? 'ตรวจสอบจดหมายข่าวขนาด A4 จริง อนุมัติเผยแพร่ ส่งกลับแก้ไข และดาวน์โหลดฉบับ PDF'
              : 'อัปโหลด 4–6 รูปภาพ เลือก 4 เทมเพลต ให้ AI ช่วยจัดองค์ประกอบ และส่งออก A4 PDF ได้ทันที'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSqlDialogOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Database className="w-3.5 h-3.5 text-primary" />
                คำสั่ง SQL (Supabase)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOrgDialogOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Settings2 className="w-3.5 h-3.5 text-primary" />
                ตั้งค่าหัว/ท้าย A4 & เทมเพลตเริ่มต้น
              </Button>
              <Link to="/admin/dashboard?tab=homepage_layout">
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                  <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                  แสดงผลหน้าแรก
                </Button>
              </Link>
            </>
          )}

          {!isExecutive && (
            <Button onClick={() => handleOpenEditor()} className="gap-2">
              <Plus className="w-4 h-4" />
              ออกจดหมายข่าวฉบับใหม่
            </Button>
          )}
        </div>
      </div>

      {/* Database Migration Notice (Non-blocking — system still saves via dual fallback) */}
      {!nativeSchemaReady && isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-foreground">
                ตรวจพบว่าตาราง newsletters ใน Supabase ยังไม่มีคอลัมน์เสริมใหม่ (image_urls, template_type, status)
              </p>
              <p className="text-muted-foreground">
                ระบบกำลังใช้โหมดจัดเก็บสำรองอัตโนมัติเพื่อให้ใช้งานได้ทันที แต่แนะนำให้กดรันคำสั่ง SQL อัปเดตตารางใน Supabase SQL Editor เพื่อรองรับคอลัมน์จริงเต็มรูปแบบ
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsSqlDialogOpen(true)}
            className="gap-1.5 text-xs shrink-0 border-amber-400"
          >
            <Database className="w-3.5 h-3.5" />
            ดูคำสั่ง SQL อัปเดตตาราง
          </Button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList className="flex-wrap h-auto gap-1">
          {isExecutive ? (
            <>
              <TabsTrigger value="pending" className="gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                รอการอนุมัติ ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                อนุมัติเผยแพร่แล้ว ({statusCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="revision" className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                ส่งกลับแก้ไข ({statusCounts.revision})
              </TabsTrigger>
              <TabsTrigger value="all">ทั้งหมด ({statusCounts.all})</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="all">ทั้งหมด ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="pending" className="gap-1.5">
                รออนุมัติ ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="revision" className="gap-1.5">
                ส่งกลับแก้ไข ({statusCounts.revision})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-1.5">
                อนุมัติเผยแพร่แล้ว ({statusCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="draft" className="gap-1.5">
                แบบร่าง ({statusCounts.draft})
              </TabsTrigger>
            </>
          )}
        </TabsList>
      </Tabs>

      {/* Newsletter Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดจดหมายข่าว...</div>
      ) : filteredNewsletters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">
              {statusFilter === 'pending'
                ? 'ยังไม่มีจดหมายข่าวที่รอการอนุมัติในขณะนี้'
                : 'ยังไม่มีรายการจดหมายข่าวในหมวดสถานะนี้'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isExecutive
                ? 'เมื่อครูหรือเจ้าหน้าที่ส่งจดหมายข่าวเข้ามาขออนุมัติ รายการจะปรากฏในแท็บนี้ทันที'
                : 'เริ่มต้นสร้างจดหมายข่าว 4–6 รูปภาพพร้อมพรีวิว A4 ได้ทันที'}
            </p>
            {!isExecutive && (
              <Button onClick={() => handleOpenEditor()}>
                <Plus className="w-4 h-4 mr-2" />
                สร้างจดหมายข่าวฉบับใหม่
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNewsletters.map((item, idx) => {
            const urls = parseImageUrlsList(item.image_urls, item.image_url);
            const statusKey = item.status || (item.is_published ? 'approved' : 'draft');
            const statusMeta = NEWSLETTER_STATUS_META[statusKey];
            const templateMeta = NEWSLETTER_TEMPLATES.find((t) => t.id === item.template_type);

            return (
              <Card
                key={item.id}
                className={`overflow-hidden flex flex-col border transition-shadow hover:shadow-md ${
                  statusKey === 'draft' ? 'opacity-85' : ''
                }`}
              >
                <div className="bg-primary px-4 py-2.5 text-primary-foreground border-b-4 border-accent flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-white/15 font-mono text-[11px] font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold truncate">
                      ฉบับที่ {item.issue_no} / {item.academic_year}
                    </span>
                  </div>
                  <span className="text-[11px] flex items-center gap-1 text-primary-foreground/85 shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatThaiDate(item.issue_date)}
                  </span>
                </div>

                {/* Multi-image preview strip */}
                <div className="h-44 bg-secondary overflow-hidden relative">
                  {urls.length > 0 ? (
                    <img
                      src={urls[0]}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-9 h-9 mb-1 opacity-40" />
                      <span className="text-xs">ยังไม่มีรูปภาพ</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-[10px] shadow-xs ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </Badge>
                    {templateMeta && (
                      <Badge className="bg-slate-900/80 text-white text-[10px] backdrop-blur-xs">
                        {templateMeta.name}
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    {urls.length > 0 && (
                      <Badge className="bg-slate-900/80 text-white text-[10px] backdrop-blur-xs">
                        {urls.length} รูป
                      </Badge>
                    )}
                    {item.file_url && (
                      <Badge className="bg-slate-900/80 text-white text-[10px] gap-1">
                        <Paperclip className="w-3 h-3" />
                        แนบไฟล์
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {item.is_published ? 'เผยแพร่' : 'ซ่อน'}
                        </span>
                        <Switch
                          checked={item.is_published}
                          onCheckedChange={(checked) => void handleTogglePublished(item, checked)}
                          aria-label={`สลับสถานะเผยแพร่ ${item.title}`}
                        />
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-foreground mb-1.5 line-clamp-2">
                    {item.title}
                  </h3>

                  {item.created_by_name && (
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      ผู้จัดทำ: {item.created_by_name}
                    </p>
                  )}

                  {item.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                      {item.summary}
                    </p>
                  )}

                  {/* Revision Note Alert if returned by Executive */}
                  {statusKey === 'revision' && item.revision_note && (
                    <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-300 text-[11px] text-rose-700 dark:text-rose-300">
                      <span className="font-bold block">หมายเหตุให้แก้ไขจากผู้บริหาร:</span>
                      <span>{item.revision_note}</span>
                    </div>
                  )}

                  {/* Approved Stamp Meta */}
                  {statusKey === 'approved' && item.approved_by && (
                    <div className="mb-3 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">อนุมัติโดย: {item.approved_by}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.views || 0}
                      </span>

                      {isAdmin && statusFilter === 'all' && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() => void handleMoveOrder(idx, 'up')}
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
                            onClick={() => void handleMoveOrder(idx, 'down')}
                            title="เลื่อนลง"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewItem(item)}
                        className="text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isExecutive ? 'ตรวจสอบ A4' : 'พรีวิว A4'}
                      </Button>

                      {!isExecutive && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditor(item)}
                            className="text-xs"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            แก้ไข
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDelete(item)}
                            className="text-xs px-2.5"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* CREATE / EDIT NEWSLETTER STUDIO MODAL WITH REAL-TIME A4 LIVE PREVIEW */}
      {/* ===================================================================== */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[94vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="w-5 h-5 text-primary" />
              {editingItem
                ? `แก้ไขจดหมายข่าว ฉบับที่ ${editingItem.issue_no}/${editingItem.academic_year}`
                : 'สร้างจดหมายข่าวประชาสัมพันธ์ฉบับใหม่ (4–6 รูปภาพ & พรีวิว A4)'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              อัปโหลด 4–6 รูปภาพ เลือกเทมเพลต หรือใช้ AI ช่วยจัดองค์ประกอบ แล้วตรวจพรีวิวหน้า A4 แบบ Real-time ก่อนบันทึก
            </DialogDescription>
          </DialogHeader>

          {editingItem?.status === 'revision' && editingItem.revision_note && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-300 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <RotateCcw className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold">ข้อเสนอแนะแก้ไขจากผู้บริหาร: </span>
                <span>{editingItem.revision_note}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* LEFT COLUMN: Form + Multi-Image + Templates + AI */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nl_issue_no" className="text-xs">ฉบับที่ *</Label>
                  <Input
                    id="nl_issue_no"
                    value={formData.issue_no}
                    onChange={(e) => setFormData({ ...formData, issue_no: e.target.value })}
                    placeholder="01"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nl_year" className="text-xs">ปีการศึกษา *</Label>
                  <Input
                    id="nl_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="2569"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nl_date" className="text-xs">ประจำวันที่ *</Label>
                  <Input
                    id="nl_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nl_title" className="text-xs">หัวข้อจดหมายข่าวประชาสัมพันธ์ *</Label>
                  <Input
                    id="nl_title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="เช่น กิจกรรมวันวิทยาศาสตร์และเทคโนโลยี ประจำปีการศึกษา 2569"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">หมวดหมู่ *</Label>
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nl_summary" className="text-xs">สรุปใจความสำคัญ (Lead Summary)</Label>
                <Textarea
                  id="nl_summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="สรุปสั้น ๆ 1–2 ประโยคสำหรับพาดหัวรอง..."
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nl_content" className="text-xs">เนื้อหารายละเอียดข่าว</Label>
                <Textarea
                  id="nl_content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="รายละเอียดกิจกรรม วัตถุประสงค์ ผู้เข้าร่วม และผลสำเร็จของโครงการ..."
                  rows={4}
                />
              </div>

              {/* AI Smart Layout & Content Assistant */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/5 via-accent/10 to-sky-500/5 border border-primary/20 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent" />
                    ผู้ช่วย AI จัดองค์ประกอบและเนื้อหาจดหมายข่าว
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleAiSmartLayout()}
                    disabled={isRunningAiLayout || saving}
                    className="gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs"
                  >
                    {isRunningAiLayout ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-accent" />
                    )}
                    ให้ AI ช่วยจัดองค์ประกอบ
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleAiRefineContent()}
                    disabled={isRunningAiContent || saving}
                    className="gap-1.5 text-xs border-primary/30"
                  >
                    {isRunningAiContent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    )}
                    ให้ AI ช่วยเกลาและปรับสมดุลเนื้อหา
                  </Button>
                </div>

                {aiInsight && (
                  <p className="text-[11px] text-foreground/85 bg-card/90 px-3 py-2 rounded-lg border border-border">
                    💡 <strong>คำแนะนำ AI:</strong> {aiInsight}
                  </p>
                )}
              </div>

              {/* Multi-Image Upload (4-6 Photos) */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  รูปภาพประกอบจดหมายข่าว (แนะนำ 4–6 รูปภาพ)
                </Label>
                <NewsletterMultiImageUploader
                  images={formData.image_urls}
                  onChange={(urls) => setFormData((prev) => ({ ...prev, image_urls: urls }))}
                  disabled={saving}
                />
              </div>

              {/* 4 Template Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  เลือกเทมเพลตการจัดวางหน้า A4 (4 รูปแบบ)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {NEWSLETTER_TEMPLATES.map((tpl) => {
                    const selected = formData.template_type === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, template_type: tpl.id }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card hover:bg-secondary/60 border-border text-foreground'
                        }`}
                      >
                        <TemplateWireframeIcon type={tpl.id} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight">{tpl.name}</p>
                          <p
                            className={`text-[11px] font-medium mt-0.5 ${
                              selected ? 'text-accent' : 'text-primary'
                            }`}
                          >
                            {tpl.thaiName}
                          </p>
                          <p
                            className={`text-[10px] mt-0.5 line-clamp-2 ${
                              selected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}
                          >
                            {tpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nl_file_url" className="text-xs text-muted-foreground">
                  ลิงก์เอกสารแนบเพิ่มเติม (PDF / Google Drive ถ้ามี)
                </Label>
                <Input
                  id="nl_file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Real-Time Scaled A4 Live Preview + Print/PDF */}
            <div className="lg:col-span-6 space-y-3">
              <div className="lg:sticky lg:top-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/60 border border-border">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <LayoutTemplate className="w-4 h-4 text-primary" />
                    พรีวิวหน้ากระดาษ A4 แบบ Real-time
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditorPrintA4()}
                      className="h-7 px-2.5 text-xs gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      พิมพ์ A4
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={editorExportingPdf}
                      onClick={() => void handleEditorExportPdf()}
                      className="h-7 px-2.5 text-xs gap-1"
                    >
                      {editorExportingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      ส่งออก PDF
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 border border-border">
                  <ScaledNewsletterA4Preview
                    newsletter={draftPreviewModel}
                    settings={settings}
                    orgSettings={orgSettings}
                    sheetRef={editorSheetRef}
                    maxWidth={520}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role-Based Action Footer */}
          <DialogFooter className="pt-4 border-t border-border gap-2 flex-wrap sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditorOpen(false)}
              disabled={saving}
            >
              ยกเลิก
            </Button>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void handleSaveWithStatus('draft')}
              >
                บันทึกแบบร่าง
              </Button>

              <Button
                type="button"
                variant={isTeacher ? 'default' : 'secondary'}
                disabled={saving}
                onClick={() => void handleSaveWithStatus('pending')}
                className="gap-1.5"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                ส่งขออนุมัติเผยแพร่
              </Button>

              {!isTeacher && (
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveWithStatus('approved')}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  บันทึกและเผยแพร่ทันที
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* FULL A4 PREVIEW & EXECUTIVE REVIEW MODAL */}
      {/* ===================================================================== */}
      <NewsletterA4PreviewModal
        open={Boolean(previewItem)}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        newsletter={previewItem}
        settings={settings}
        orgSettings={orgSettings}
        canReview={isExecutive || isAdmin}
        onApprove={handleApproveNewsletter}
        onRequestRevision={handleRequestRevision}
      />

      {/* ===================================================================== */}
      {/* ADMIN STANDARD HEADER / FOOTER & DEFAULT TEMPLATE MODAL */}
      {/* ===================================================================== */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              ตั้งค่ามาตรฐานจดหมายข่าวของหน่วยงาน (Admin)
            </DialogTitle>
            <DialogDescription className="text-xs">
              กำหนดเทมเพลตเริ่มต้น หัวกระดาษ และข้อความท้ายกระดาษ A4 สำหรับทุกฉบับในโรงเรียน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOrgDefaults} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">เทมเพลตเริ่มต้น</Label>
              <Select
                value={orgForm.defaultTemplate}
                onValueChange={(val) =>
                  setOrgForm((prev) => ({
                    ...prev,
                    defaultTemplate: val as NewsletterTemplateType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEWSLETTER_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.thaiName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">หัวเรื่องมาตรฐาน (Header Title)</Label>
              <Input
                value={orgForm.headerTitle}
                onChange={(e) => setOrgForm((prev) => ({ ...prev, headerTitle: e.target.value }))}
                placeholder="จดหมายข่าวประชาสัมพันธ์"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ข้อความย่อยบนหัวกระดาษ (Header Subtitle)</Label>
              <Input
                value={orgForm.headerSubtitle}
                onChange={(e) =>
                  setOrgForm((prev) => ({ ...prev, headerSubtitle: e.target.value }))
                }
                placeholder="SCHOOL NEWSLETTER • วารสารประชาสัมพันธ์สถานศึกษา"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ข้อความท้ายกระดาษมาตรฐาน (Footer Text)</Label>
              <Input
                value={orgForm.footerText}
                onChange={(e) => setOrgForm((prev) => ({ ...prev, footerText: e.target.value }))}
                placeholder="เว้นว่างเพื่อใช้ชื่อ ที่อยู่ และเบอร์โทรโรงเรียนอัตโนมัติ"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ตำแหน่งผู้ลงนามอนุมัติท้ายกระดาษ</Label>
              <Input
                value={orgForm.directorTitle}
                onChange={(e) => setOrgForm((prev) => ({ ...prev, directorTitle: e.target.value }))}
                placeholder="ผู้อำนวยการโรงเรียน"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit">บันทึกการตั้งค่ามาตรฐาน</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* SUPABASE SQL MIGRATION MODAL */}
      {/* ===================================================================== */}
      <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Database className="w-5 h-5" />
              คำสั่ง SQL อัปเดตตาราง newsletters ใน Supabase
            </DialogTitle>
            <DialogDescription className="text-xs">
              คัดลอกคำสั่งด้านล่างนี้ไปรันใน Supabase SQL Editor เพื่อเพิ่มคอลัมน์ image_urls, template_type, status, revision_note, approved_by และ approved_at อย่างปลอดภัยโดยไม่ลบข้อมูลเก่า
            </DialogDescription>
          </DialogHeader>

          <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed">
            {NEWSLETTER_SCHEMA_MIGRATION_SQL}
          </pre>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(NEWSLETTER_SCHEMA_MIGRATION_SQL);
                setCopiedSql(true);
                toast({ title: 'คัดลอกคำสั่ง SQL แล้ว' });
                setTimeout(() => setCopiedSql(false), 3000);
              }}
              className="gap-1.5"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedSql ? 'คัดลอกแล้ว' : 'คัดลอกคำสั่ง SQL'}
            </Button>
            <Button
              type="button"
              onClick={() =>
                window.open(
                  'https://supabase.com/dashboard/project/fhfckuypfstlokashcmu/sql/new',
                  '_blank'
                )
              }
              className="gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              เปิด Supabase SQL Editor ↗
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
