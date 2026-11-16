import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Users,
  MonitorPlay,
  Newspaper,
  Sparkles,
  Eye,
  CheckCircle2,
  Clock,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  FileText,
  Calendar,
} from 'lucide-react';
import { getLocalTeacherMedia, TeacherMediaItem } from './TeacherPortal';
import {
  getLocalSaphaLinks,
  getLocalSaphaProjects,
  SaphaProject,
  SaphaSystemLink,
} from '../saphaplus/SaphaPlusDashboard';
import { getCurrentAdminUser, getLocalUsers } from '@/utils/authUtils';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_NEWSLETTER_ORG_SETTINGS,
  NEWSLETTER_STATUS_META,
  parseImageUrlsList,
  type NewsletterOrgSettings,
  type SchoolNewsletter,
} from '@/utils/newsletterUtils';
import {
  fetchNewslettersWithCompat,
  saveNewsletterWithCompat,
} from '@/utils/newsletterStorage';
import { NewsletterA4PreviewModal } from '../newsletters/NewsletterA4PreviewModal';

export const ExecutivePortal = () => {
  const { settings } = useSchoolSettings();
  const currentUser = getCurrentAdminUser();
  const { toast } = useToast();

  const [counts, setCounts] = useState({
    staffCount: 12,
    councilMembers: 15,
    totalMedia: 0,
    totalNews: 0,
    saphaProjectsCount: 0,
  });

  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [teacherMedia, setTeacherMedia] = useState<TeacherMediaItem[]>([]);
  const [saphaProjects, setSaphaProjects] = useState<SaphaProject[]>([]);
  const [saphaLinks, setSaphaLinks] = useState<SaphaSystemLink[]>([]);
  const [newsletters, setNewsletters] = useState<SchoolNewsletter[]>([]);
  const [orgSettings, setOrgSettings] = useState<NewsletterOrgSettings>(
    DEFAULT_NEWSLETTER_ORG_SETTINGS
  );
  const [reviewingNewsletter, setReviewingNewsletter] = useState<SchoolNewsletter | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExecutiveOverview = useCallback(async () => {
    setLoading(true);
    const localMedia = getLocalTeacherMedia();
    const localProjects = getLocalSaphaProjects();
    const localLinks = getLocalSaphaLinks();
    const localAccounts = getLocalUsers();

    setTeacherMedia(localMedia);
    setSaphaProjects(localProjects);
    setSaphaLinks(localLinks);

    try {
      const [staffRes, councilRes, mediaRes, newsRes, nlBundle] = await Promise.all([
        supabase.from('staff').select('id', { count: 'exact', head: true }),
        supabase.from('student_council').select('id', { count: 'exact', head: true }),
        (supabase as any).from('media_resources').select('id', { count: 'exact', head: true }),
        supabase
          .from('news')
          .select('id, title, category, created_at, views, published')
          .order('created_at', { ascending: false })
          .limit(5),
        fetchNewslettersWithCompat().catch(() => ({
          newsletters: [] as SchoolNewsletter[],
          orgSettings: DEFAULT_NEWSLETTER_ORG_SETTINGS,
          nativeSchemaReady: false,
        })),
      ]);

      const googleSiteCount = mediaRes.count || 4;
      setRecentNews(newsRes.data || []);
      setNewsletters(nlBundle.newsletters);
      setOrgSettings(nlBundle.orgSettings);

      setCounts({
        staffCount: (staffRes.count || 0) + localAccounts.length,
        councilMembers: councilRes.count || 12,
        totalMedia: localMedia.length + googleSiteCount,
        totalNews: newsRes.data?.length || 1,
        saphaProjectsCount: localProjects.length,
      });
    } catch {
      setCounts({
        staffCount: localAccounts.length + 10,
        councilMembers: 12,
        totalMedia: localMedia.length + 4,
        totalNews: 4,
        saphaProjectsCount: localProjects.length,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExecutiveOverview();
    return subscribeToRealtimeTables(
      'realtime_executive_newsletters',
      ['newsletters', 'school_settings'],
      loadExecutiveOverview
    );
  }, [loadExecutiveOverview]);

  const handleApproveNewsletter = async (item: SchoolNewsletter) => {
    try {
      await saveNewsletterWithCompat(
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
        title: 'อนุมัติเผยแพร่จดหมายข่าวแล้ว',
        description: `ฉบับที่ ${item.issue_no}/${item.academic_year} แสดงผลบนหน้าเว็บไซต์ทันที`,
      });
      await loadExecutiveOverview();
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
      await saveNewsletterWithCompat(
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
      await loadExecutiveOverview();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'ส่งกลับไม่สำเร็จ',
        description: err?.message || 'เกิดข้อผิดพลาด',
      });
    }
  };

  const pendingNewsletters = newsletters.filter((n) => n.status === 'pending');
  const displayReviewList =
    pendingNewsletters.length > 0 ? pendingNewsletters : newsletters.slice(0, 4);

  return (
    <div className="p-8 space-y-8">
      {/* Executive Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-primary p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
              <BarChart3 className="w-4 h-4" />
              EXECUTIVE ANALYTICS DASHBOARD (READ-ONLY)
            </div>
            <h1 className="text-3xl font-bold">รายงานภาพรวมสำหรับผู้บริหารสถานศึกษา</h1>
            <p className="text-white/85 text-sm mt-1">
              ติดตามสถิติบุคลากร คลังสื่อการสอนของครู ข่าวสารประชาสัมพันธ์ และผลการดำเนินงานจากระบบสภาพลัสแบบเรียลไทม์
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs flex items-center gap-2 self-start md:self-center">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>โหมดอ่านรายงานอย่างเดียว (Read-Only Mode)</span>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">จำนวนบุคลากรและครู</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">
                {loading ? '...' : counts.staffCount}
              </p>
              <span className="text-[11px] text-blue-600 font-medium">ปฏิบัติงานปกติ</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">สมาชิกสภา & โครงการสภาพลัส</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">
                {loading ? '...' : `${counts.councilMembers} / ${counts.saphaProjectsCount}`}
              </p>
              <span className="text-[11px] text-violet-600 font-medium">
                กรรมการสภา / โครงการที่ดำเนินการ
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">จำนวนสื่อการสอนทั้งหมด</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">
                {loading ? '...' : counts.totalMedia}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                สื่อรายบุคคล & Google Sites
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <MonitorPlay className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">ข่าวประชาสัมพันธ์ล่าสุด</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">
                {loading ? '...' : counts.totalNews}
              </p>
              <span className="text-[11px] text-amber-600 font-medium">อัปเดตโดยฝ่ายประชาสัมพันธ์</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Newsletter Approval & Review Queue */}
      <Card className="border-amber-300/70 dark:border-amber-700/60 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  รอการอนุมัติ / ตรวจสอบจดหมายข่าว
                  {pendingNewsletters.length > 0 && (
                    <Badge className="bg-amber-500 text-slate-950 font-bold">
                      รออนุมัติ {pendingNewsletters.length} ฉบับ
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  กดตรวจสอบพรีวิวขนาด A4 จริง เพื่ออนุมัติเผยแพร่ ส่งกลับแก้ไข หรือดาวน์โหลดฉบับ PDF
                </p>
              </div>
            </div>

            <Link to="/admin/dashboard?tab=newsletters">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-primary" />
                เปิดหน้าจัดการอนุมัติจดหมายข่าวทั้งหมด
              </Button>
            </Link>
          </div>

          {displayReviewList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              ยังไม่มีรายการจดหมายข่าวที่รอการตรวจสอบในขณะนี้
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayReviewList.map((nl) => {
                const st = nl.status || (nl.is_published ? 'approved' : 'draft');
                const stMeta = NEWSLETTER_STATUS_META[st];
                const urls = parseImageUrlsList(nl.image_urls, nl.image_url);
                return (
                  <div
                    key={nl.id}
                    className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {urls[0] ? (
                        <img
                          src={urls[0]}
                          alt={nl.title}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-lg object-cover border shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Badge variant="outline" className={`text-[10px] ${stMeta.badgeClass}`}>
                            {stMeta.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            ฉบับที่ {nl.issue_no}/{nl.academic_year}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-foreground truncate">{nl.title}</p>
                        {nl.created_by_name && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            ผู้จัดทำ: {nl.created_by_name} • {urls.length} ภาพ
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setReviewingNewsletter(nl)}
                      className="text-xs gap-1 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      ตรวจสอบ A4
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3 Read-Only Executive Report Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Sapha Plus Activity Report */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h3 className="font-bold text-lg text-foreground">
                  ความเคลื่อนไหวระบบสภาพลัส (Sapha Plus Report)
                </h3>
              </div>
              <Badge variant="outline" className="bg-violet-500/10 text-violet-700 border-violet-200">
                {saphaProjects.length} โครงการ
              </Badge>
            </div>

            <div className="space-y-3">
              {saphaProjects.map((proj) => (
                <div key={proj.id} className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-violet-700">{proj.division}</span>
                    {proj.status === 'completed' ? (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> เสร็จสิ้น 100%
                      </Badge>
                    ) : (
                      <Badge className="bg-violet-600 text-white text-[10px]">
                        <Clock className="w-3 h-3 mr-1" /> คืบหน้า {proj.progress}%
                      </Badge>
                    )}
                  </div>
                  <p className="font-bold text-sm text-foreground">{proj.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                ระบบย่อยที่เชื่อมต่อในสภาพลัส ({saphaLinks.length} ระบบ):
              </p>
              <div className="flex flex-wrap gap-2">
                {saphaLinks.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 font-medium"
                  >
                    {l.title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Teacher Media Activity Report */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg text-foreground">
                  รายงานการอัปโหลดสื่อการสอนของคณะครู
                </h3>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                {teacherMedia.length} รายการล่าสุด
              </Badge>
            </div>

            <div className="space-y-3">
              {teacherMedia.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-secondary/50 border border-border flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {item.subject_department}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.teacher_name}</span>
                    </div>
                    <p className="font-bold text-sm text-foreground">{item.title}</p>
                  </div>
                  <a
                    href={item.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex-shrink-0 inline-flex items-center gap-1"
                  >
                    ดูสื่อ <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Staff PR & News Report */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-lg text-foreground">
                รายงานข่าวประชาสัมพันธ์และประกาศล่าสุด (โดยเจ้าหน้าที่ Staff)
              </h3>
            </div>
          </div>

          {recentNews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              ยังไม่มีรายการข่าวในฐานข้อมูล หรือกำลังใช้ข้อมูลเริ่มต้น
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentNews.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {n.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {n.views || 0} ครั้ง
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-foreground truncate">{n.title}</p>
                  </div>
                  <Badge variant={n.published ? 'default' : 'outline'} className="text-xs">
                    {n.published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewsletterA4PreviewModal
        open={Boolean(reviewingNewsletter)}
        onOpenChange={(open) => !open && setReviewingNewsletter(null)}
        newsletter={reviewingNewsletter}
        settings={settings}
        orgSettings={orgSettings}
        canReview={true}
        onApprove={handleApproveNewsletter}
        onRequestRevision={handleRequestRevision}
      />
    </div>
  );
};

