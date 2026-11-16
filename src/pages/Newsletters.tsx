import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText,
  Search,
  Calendar,
  Eye,
  ExternalLink,
  Download,
  PlusCircle,
  ZoomIn,
  Printer,
  Hash,
  Images,
  Loader2,
} from 'lucide-react';
import {
  DEFAULT_NEWSLETTER_ORG_SETTINGS,
  NEWSLETTER_CATEGORIES,
  formatThaiDate,
  isNewsletterPubliclyVisible,
  parseImageUrlsList,
  type NewsletterOrgSettings,
  type SchoolNewsletter,
} from '@/utils/newsletterUtils';
import { fetchNewslettersWithCompat } from '@/utils/newsletterStorage';
import { ScaledNewsletterA4Preview } from '@/components/admin/newsletters/NewsletterA4Sheet';
import { useNewsletterPrintAndPdf } from '@/components/admin/newsletters/NewsletterA4PreviewModal';

export { NEWSLETTER_CATEGORIES, formatThaiDate, type SchoolNewsletter };

export const DEFAULT_NEWSLETTERS: SchoolNewsletter[] = [
  {
    id: 'sample-nl-1',
    issue_no: '01',
    academic_year: '2568',
    issue_date: new Date().toISOString().split('T')[0],
    title: 'กิจกรรมปฐมนิเทศนักเรียนใหม่ และประชุมผู้ปกครองประจำภาคเรียนที่ 1',
    summary:
      'ผู้อำนวยการโรงเรียนเป็นประธานในพิธีปฐมนิเทศนักเรียนใหม่ พร้อมชี้แจงนโยบายการจัดการศึกษาและแนวทางการพัฒนาผู้เรียนร่วมกับผู้ปกครอง',
    content:
      'ทางโรงเรียนได้จัดกิจกรรมปฐมนิเทศนักเรียนใหม่และประชุมผู้ปกครองประจำภาคเรียนที่ 1 เพื่อสร้างความเข้าใจอันดีระหว่างบ้านและโรงเรียน พร้อมแนะนำคณะครูประจำชั้นและแนวทางการส่งเสริมการเรียนรู้ในยุคดิจิทัล',
    category: 'กิจกรรมสถานศึกษา',
    image_url: null,
    image_urls: [],
    template_type: 'template_1',
    status: 'approved',
    file_url: null,
    views: 156,
    is_published: true,
    order_position: 1,
  },
  {
    id: 'sample-nl-2',
    issue_no: '02',
    academic_year: '2568',
    issue_date: new Date().toISOString().split('T')[0],
    title: 'การอบรมเชิงปฏิบัติการพัฒนาสื่อการสอนออนไลน์ด้วยเทคโนโลยีดิจิทัลและ AI',
    summary:
      'คณะครูเข้าร่วมการอบรมพัฒนาคลังสื่อการสอนออนไลน์ (Google Sites) เพื่อยกระดับการจัดการเรียนรู้ในศตวรรษที่ 21',
    content:
      'คณะครูทุกกลุ่มสาระการเรียนรู้เข้าร่วมกิจกรรมพัฒนาวิชาชีพ (PLC) ในการสร้างและพัฒนาคลังสื่อการสอนออนไลน์ เพื่อให้นักเรียนสามารถทบทวนบทเรียนได้ทุกที่ทุกเวลา',
    category: 'งานวิชาการ',
    image_url: null,
    image_urls: [],
    template_type: 'template_2',
    status: 'approved',
    file_url: null,
    views: 142,
    is_published: true,
    order_position: 2,
  },
  {
    id: 'sample-nl-3',
    issue_no: '03',
    academic_year: '2568',
    issue_date: new Date().toISOString().split('T')[0],
    title: 'ขอแสดงความยินดีกับนักเรียนที่ได้รับรางวัลชนะเลิศการแข่งขันทักษะวิชาการ',
    summary:
      'ตัวแทนนักเรียนคว้ารางวัลเหรียญทองจากการแข่งขันทักษะวิชาการระดับเขตพื้นที่การศึกษา สร้างชื่อเสียงและความภาคภูมิใจให้แก่โรงเรียน',
    content:
      'โรงเรียนขอแสดงความยินดีกับนักเรียนและครูผู้ฝึกซ้อมที่ได้รับรางวัลเหรียญทองชนะเลิศจากการแข่งขันทักษะวิชาการ เป็นแบบอย่างที่ดีด้านความมุ่งมั่นตั้งใจศึกษาเล่าเรียน',
    category: 'ผลงานและความภูมิใจ',
    image_url: null,
    image_urls: [],
    template_type: 'template_4',
    status: 'approved',
    file_url: null,
    views: 218,
    is_published: true,
    order_position: 3,
  },
];

const Newsletters = () => {
  const { settings } = useSchoolSettings();
  const [newsletters, setNewsletters] = useState<SchoolNewsletter[]>([]);
  const [orgSettings, setOrgSettings] = useState<NewsletterOrgSettings>(
    DEFAULT_NEWSLETTER_ORG_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedNewsletter, setSelectedNewsletter] = useState<SchoolNewsletter | null>(null);
  const viewedNewsletterIdRef = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { sheetRef, exportingPdf, handlePrintA4, handleExportPdf, printPortal } =
    useNewsletterPrintAndPdf(selectedNewsletter, settings, orgSettings);

  const fetchNewsletters = useCallback(async () => {
    try {
      const bundle = await fetchNewslettersWithCompat({ onlyPublished: true });
      const visible = bundle.newsletters
        .filter(isNewsletterPubliclyVisible)
        .sort((a, b) => {
          const dateDiff = String(b.issue_date).localeCompare(String(a.issue_date));
          if (dateDiff !== 0) return dateDiff;
          return (b.order_position || 0) - (a.order_position || 0);
        });

      setNewsletters(visible);
      setOrgSettings(bundle.orgSettings);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewsletters();
    return subscribeToRealtimeTables(
      'realtime_newsletters_page',
      ['newsletters', 'school_settings'],
      fetchNewsletters
    );
  }, [fetchNewsletters]);

  const handleViewNewsletter = useCallback(async (item: SchoolNewsletter) => {
    setSelectedNewsletter(item);
    viewedNewsletterIdRef.current = item.id;

    setNewsletters((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, views: (n.views || 0) + 1 } : n))
    );

    if (!item.id.startsWith('sample-')) {
      try {
        await (supabase as any)
          .from('newsletters')
          .update({ views: (item.views || 0) + 1 })
          .eq('id', item.id);
      } catch {
        // Ignore view increment error
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    if (!idParam) {
      viewedNewsletterIdRef.current = null;
      return;
    }

    if (newsletters.length > 0) {
      const matched = newsletters.find((n) => n.id === idParam);
      if (matched) {
        if (viewedNewsletterIdRef.current === matched.id) {
          setSelectedNewsletter(matched);
        } else {
          void handleViewNewsletter(matched);
        }
      }
    }
  }, [handleViewNewsletter, location.search, newsletters]);

  const filteredNewsletters = newsletters.filter((item) => {
    const matchesCat =
      selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.issue_no.toLowerCase().includes(q) ||
      (item.summary && item.summary.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {printPortal}
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Hero Header */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-navy-light py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm mb-5 shadow-md">
              <FileText className="w-4 h-4" />
              SCHOOL NEWSLETTER
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-5">
              จดหมายข่าว<span className="text-accent">ประชาสัมพันธ์</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/85 max-w-3xl mx-auto mb-8">
              วารสารและจดหมายข่าวประชาสัมพันธ์กิจกรรมความเคลื่อนไหวของ{settings.school_name}
            </p>

            {/* Search & Admin Action */}
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อเรื่อง หรือ ฉบับที่จดหมายข่าว..."
                  className="pl-12 h-12 bg-card border-0 rounded-xl shadow-lg"
                />
              </div>
              <Link to="/admin/dashboard?tab=newsletters">
                <Button className="h-12 px-6 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2 shadow-lg w-full sm:w-auto">
                  <PlusCircle className="w-5 h-5" />
                  ออกจดหมายข่าวใหม่
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Category Filter & School Newsletter Cards */}
        <section className="section-padding">
          <div className="container mx-auto px-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10">
              {NEWSLETTER_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16 text-muted-foreground">
                กำลังโหลดจดหมายข่าวประชาสัมพันธ์...
              </div>
            ) : filteredNewsletters.length === 0 ? (
              <div className="bg-card rounded-3xl p-12 text-center border border-border max-w-xl mx-auto">
                <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">ไม่พบจดหมายข่าวประชาสัมพันธ์</h3>
                <p className="text-muted-foreground mb-4">ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ทั้งหมด');
                  }}
                >
                  ดูทั้งหมด
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNewsletters.map((item) => {
                  const photos = parseImageUrlsList(item.image_urls, item.image_url);
                  const coverPhoto = photos[0];
                  return (
                    <div
                      key={item.id}
                      onClick={() => void handleViewNewsletter(item)}
                      className="group cursor-pointer bg-card rounded-2xl overflow-hidden border-2 border-border hover:border-primary/60 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                    >
                      {/* Official Thai School Newsletter Masthead Banner */}
                      <div className="bg-gradient-to-r from-primary via-primary to-navy-light px-5 py-3.5 text-primary-foreground border-b-4 border-accent flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {settings.school_logo_url ? (
                            <img
                              src={settings.school_logo_url}
                              alt={settings.school_name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-contain bg-white p-0.5 flex-shrink-0 shadow"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center flex-shrink-0 shadow">
                              {settings.school_short_name || 'บหค'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[11px] text-accent font-semibold tracking-wider uppercase leading-none">
                              {orgSettings.headerTitle || 'จดหมายข่าวประชาสัมพันธ์'}
                            </p>
                            <p className="text-sm font-bold truncate mt-0.5">{settings.school_name}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
                          <span className="block text-[10px] text-primary-foreground/80 leading-none">
                            ฉบับที่
                          </span>
                          <span className="text-xs font-bold text-accent">
                            {item.issue_no}/{item.academic_year}
                          </span>
                        </div>
                      </div>

                      {/* Issue Date & Category Sub-bar */}
                      <div className="bg-secondary/70 px-5 py-2 text-xs flex items-center justify-between border-b border-border">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {formatThaiDate(item.issue_date)}
                        </span>
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {item.category}
                        </Badge>
                      </div>

                      {/* Multi-Photo Collage or Cover Image Area */}
                      <div className="relative bg-secondary/30 overflow-hidden aspect-[4/3]">
                        {photos.length >= 3 ? (
                          <div className="w-full h-full grid grid-cols-12 grid-rows-2 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800">
                            <img
                              src={photos[0]}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="col-span-8 row-span-2 w-full h-full object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-500"
                            />
                            <img
                              src={photos[1]}
                              alt={`${item.title} 2`}
                              referrerPolicy="no-referrer"
                              className="col-span-4 row-span-1 w-full h-full object-cover rounded-lg"
                            />
                            <div className="col-span-4 row-span-1 relative overflow-hidden rounded-lg">
                              <img
                                src={photos[2]}
                                alt={`${item.title} 3`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              {photos.length > 3 && (
                                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white text-xs font-bold">
                                  +{photos.length - 3} ภาพ
                                </div>
                              )}
                            </div>
                          </div>
                        ) : coverPhoto ? (
                          <img
                            src={coverPhoto}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/5 via-accent/10 to-primary/10 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                              <FileText className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-primary">
                              ฉบับที่ {item.issue_no} ปีการศึกษา {item.academic_year}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                              {item.title}
                            </p>
                          </div>
                        )}

                        {photos.length > 1 && (
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 text-white text-[11px] font-semibold backdrop-blur-xs">
                            <Images className="w-3 h-3 text-amber-400" />
                            {photos.length} รูป
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card/95 text-foreground text-xs font-semibold shadow-lg">
                            <ZoomIn className="w-4 h-4 text-primary" />
                            คลิกเพื่ออ่านจดหมายข่าว A4 ฉบับเต็ม
                          </span>
                        </div>
                      </div>

                      {/* Newsletter Content Preview */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        {item.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
                            {item.summary}
                          </p>
                        )}

                        <div className="pt-3 border-t border-border mt-auto flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            อ่านแล้ว {item.views || 0} ครั้ง
                          </span>
                          <span className="font-semibold text-primary group-hover:translate-x-1 transition-transform">
                            เปิดอ่านฉบับนี้ →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Full A4 School Newsletter Reader Modal */}
      <Dialog
        open={Boolean(selectedNewsletter)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNewsletter(null);
            viewedNewsletterIdRef.current = null;
            if (location.search.includes('id=')) {
              navigate('/newsletters', { replace: true });
            }
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[94vh] overflow-y-auto p-4 sm:p-6">
          {selectedNewsletter && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {selectedNewsletter.title}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        ฉบับที่ {selectedNewsletter.issue_no}/{selectedNewsletter.academic_year}
                      </span>
                      <span>•</span>
                      <span>วันที่ {formatThaiDate(selectedNewsletter.issue_date)}</span>
                      <span>•</span>
                      <span>เข้าชม {selectedNewsletter.views || 0} ครั้ง</span>
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {selectedNewsletter.category}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Toolbar: Print A4 / Download PDF / Attachment */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="flex flex-wrap gap-2">
                  {selectedNewsletter.file_url && (
                    <a
                      href={selectedNewsletter.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                        เปิดไฟล์แนบเพิ่มเติม
                      </Button>
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintA4(selectedNewsletter)}
                    className="gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    พิมพ์จดหมายข่าว (Print A4)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleExportPdf(selectedNewsletter)}
                    disabled={exportingPdf}
                    className="gap-1.5 text-xs"
                  >
                    {exportingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        กำลังสร้าง PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        ดาวน์โหลด PDF (A4)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* A4 Sheet Display (supports both 4-6 multi-image templates & legacy single image) */}
              <div className="bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl p-3 sm:p-5 border border-border">
                <ScaledNewsletterA4Preview
                  newsletter={selectedNewsletter}
                  settings={settings}
                  orgSettings={orgSettings}
                  sheetRef={sheetRef}
                  maxWidth={720}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Newsletters;
