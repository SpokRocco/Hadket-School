import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Calendar,
  FileText,
  UserPlus,
  PhoneCall,
  Play,
  MapPin,
  Phone,
  Mail,
  Newspaper,
} from 'lucide-react';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
  SCHOOL_NEWS_CATEGORIES,
  filterNewsItems,
  partitionNewsHomeSections,
  sortNewsForDisplay,
} from '@/utils/newsUtils';
import type { NewsHubSubSectionId } from '@/utils/homepageLayoutUtils';
import heroImage from '@/assets/hero-school.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';

interface NewsItem {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  views: number;
  featured?: boolean;
  is_pinned?: boolean;
  sort_order?: number;
  published_at?: string | null;
  created_at?: string;
  cover_image_url?: string;
}

const NewsSection = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([...SCHOOL_NEWS_CATEGORIES]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ทั้งหมด');
  const [prPage, setPrPage] = useState(0);
  const [actPage, setActPage] = useState(0);
  const navigate = useNavigate();
  const { settings } = useSchoolSettings();

  const fetchNews = useCallback(async () => {
    try {
      const [newsRes, catRes] = await Promise.all([
        supabase
          .from('news')
          .select('*')
          .eq('published', true)
          .order('sort_order', { ascending: true })
          .order('is_pinned', { ascending: false }),
        supabase.from('news_categories' as any).select('name').order('name'),
      ]);

      if (newsRes.error) throw newsRes.error;

      const formattedNews: NewsItem[] = (newsRes.data || []).map((item: any, index: number) => ({
        id: item.id,
        category: item.category || 'ข่าวประชาสัมพันธ์',
        title: item.title,
        excerpt: item.excerpt || '',
        date: item.published_at
          ? format(new Date(item.published_at), 'd MMMM yyyy', { locale: th })
          : format(new Date(item.created_at), 'd MMMM yyyy', { locale: th }),
        views: item.views || 0,
        featured: index === 0 && item.is_pinned,
        is_pinned: Boolean(item.is_pinned),
        sort_order: typeof item.sort_order === 'number' ? item.sort_order : index + 1,
        published_at: item.published_at,
        created_at: item.created_at,
        cover_image_url: item.cover_image_url || undefined,
      }));

      setNewsItems(sortNewsForDisplay(formattedNews, true));

      if (!catRes.error && Array.isArray(catRes.data) && catRes.data.length > 0) {
        const dbCategories = catRes.data.map((c: any) => c.name).filter(Boolean);
        const merged = Array.from(new Set([...SCHOOL_NEWS_CATEGORIES, ...dbCategories]));
        setCategories(merged);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    return subscribeToRealtimeTables(
      'realtime_home_news',
      ['news', 'news_categories'],
      () => {
        fetchNews();
      }
    );
  }, [fetchNews]);

  if (isLoading) {
    return (
      <section id="news" className="section-padding bg-slate-50/70 dark:bg-slate-900/40">
        <div className="container-school">
          <div className="text-center py-12">
            <p className="text-slate-500">กำลังโหลดข่าวสารและกิจกรรม...</p>
          </div>
        </div>
      </section>
    );
  }

  const { publicRelations, studentActivities, smartStudents, prideItems } =
    partitionNewsHomeSections(newsItems);

  const prList = publicRelations.length > 0 ? publicRelations : newsItems.slice(0, 6);
  const actList = studentActivities;

  const prTotalPages = Math.max(1, Math.ceil(prList.length / 3));
  const actTotalPages = Math.max(1, Math.ceil(actList.length / 3));

  const safePrPage = Math.min(prPage, prTotalPages - 1);
  const safeActPage = Math.min(actPage, actTotalPages - 1);

  const visiblePrCards = prList.slice(safePrPage * 3, safePrPage * 3 + 3);
  const visibleActCards = actList.slice(safeActPage * 3, safeActPage * 3 + 3);

  const filteredByTab = filterNewsItems(newsItems, { category: activeCategoryTab });

  const renderNewsCard = (item: NewsItem) => (
    <article
      key={item.id}
      onClick={() => navigate(`/news?id=${item.id}`)}
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
    >
      <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
        <img
          src={item.cover_image_url || heroImage}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
          {item.category}
          {item.is_pinned ? ' · ปักหมุดเด่น' : ''}
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 mb-2.5 leading-snug">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono tabular-nums">
          <span>{item.date}</span>
          <span aria-hidden="true">-</span>
          <span>อ่าน {item.views.toLocaleString()} ครั้ง</span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-5 flex-1">
          {item.excerpt}
        </p>

        <div className="pt-2 mt-auto">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform">
            อ่านต่อ →
          </span>
        </div>
      </div>
    </article>
  );

  const subSectionRegistry: Record<NewsHubSubSectionId, ReactNode> = {
    public_relations: (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            ข่าวประชาสัมพันธ์
          </h2>
          <Link
            to="/news?category=ข่าวประชาสัมพันธ์"
            className="inline-flex items-center gap-1 text-sm sm:text-base font-semibold text-rose-600 hover:text-rose-700 transition-colors whitespace-nowrap"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {visiblePrCards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
            <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</p>
          </div>
        ) : (
          <div
            className={`grid gap-7 ${
              visiblePrCards.length === 1
                ? 'md:grid-cols-2 lg:grid-cols-3'
                : 'md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {visiblePrCards.map((item) => renderNewsCard(item))}
          </div>
        )}

        {prTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2.5 mt-8">
            {Array.from({ length: prTotalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`ข่าวประชาสัมพันธ์ หน้าที่ ${idx + 1}`}
                onClick={() => setPrPage(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  safePrPage === idx
                    ? 'w-7 bg-sky-500'
                    : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    ),

    student_activities: (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            กิจกรรมล่าสุด
          </h2>
          <Link
            to="/news?category=กิจกรรม"
            className="inline-flex items-center gap-1 text-sm sm:text-base font-semibold text-rose-600 hover:text-rose-700 transition-colors whitespace-nowrap"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {visibleActCards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Calendar className="w-5 h-5 text-sky-600 shrink-0" />
              <span className="text-sm">ยังไม่มีข่าวในหมวดกิจกรรม สามารถติดตามกำหนดการได้ที่ปฏิทินกิจกรรม</span>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 whitespace-nowrap"
            >
              <span>ดูปฏิทินกิจกรรม</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {visibleActCards.map((item) => renderNewsCard(item))}
            </div>

            {actTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-8">
                {Array.from({ length: actTotalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`กิจกรรมล่าสุด หน้าที่ ${idx + 1}`}
                    onClick={() => setActPage(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      safeActPage === idx
                        ? 'w-7 bg-sky-500'
                        : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    ),

    featured_highlight: (
      <div className="rounded-3xl overflow-hidden bg-slate-900 text-white border border-slate-800 shadow-lg">
        <div className="grid lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[360px] bg-slate-950 overflow-hidden group">
            <img
              src={studentGraduationActivity}
              alt={`กิจกรรมเด่นของ${settings.school_name}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              aria-label="เปิดชมประมวลภาพกิจกรรมเด่น"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
                <Play className="w-7 h-7 fill-current ml-0.5" />
              </span>
            </button>
            <div className="absolute bottom-5 left-6 right-6 text-xs sm:text-sm text-slate-200">
              กิจกรรมพัฒนาผู้เรียน · งานวิชาการ ดนตรี กีฬา และศิลปวัฒนธรรม · {settings.school_name}
            </div>
          </div>

          <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">
              HIGHLIGHT ACTIVITIES
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              <strong className="text-amber-400">กิจกรรมเด่น</strong> {settings.school_name}
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              ส่งเสริมการเรียนรู้ผ่านการปฏิบัติจริง ทั้งกิจกรรมวิชาการ ดนตรี กีฬา ศิลปะ งานอาชีพ
              และทักษะเทคโนโลยี เพื่อให้ผู้เรียนพัฒนาศักยภาพได้อย่างเต็มที่
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
              >
                <span>ดูประมวลภาพกิจกรรม</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors whitespace-nowrap"
              >
                <span>ปฏิทินกิจกรรม</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    ),

    spotlight_columns: (
      <div className="grid lg:grid-cols-3 gap-8 pt-4">
        {/* Column 1: ผลงานนักเรียน */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">ผลงานนักเรียน</h3>
            <Link
              to="/news?category=ผลงานนักเรียน"
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap"
            >
              <span>เพิ่มเติม</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {smartStudents.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                <p className="mb-2">ยังไม่มีข่าวผลงานนักเรียนในขณะนี้</p>
                <Link to="/news" className="text-xs font-semibold text-sky-600 hover:underline">
                  ดูข่าวสารทั้งหมด →
                </Link>
              </div>
            ) : (
              smartStudents.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/news?id=${item.id}`)}
                  className="group flex gap-4 cursor-pointer p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <img
                    src={item.cover_image_url || studentScienceLab}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-sky-600 mb-1">
                      {item.category} · {item.date}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: ประกาศและข่าวความภาคภูมิใจ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">ประกาศสำคัญ</h3>
            <Link
              to="/news?category=ประกาศ"
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap"
            >
              <span>เพิ่มเติม</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {prideItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                <p className="mb-2">ยังไม่มีประกาศสำคัญในขณะนี้</p>
                <Link to="/news" className="text-xs font-semibold text-sky-600 hover:underline">
                  ดูข่าวสารทั้งหมด →
                </Link>
              </div>
            ) : (
              prideItems.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/news?id=${item.id}`)}
                  className="group flex gap-4 cursor-pointer p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <img
                    src={item.cover_image_url || studentGraduationActivity}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-600 mb-1">
                      {item.category} · {item.date}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: ติดต่อเรา */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">ติดต่อเรา</h3>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 whitespace-nowrap"
              >
                <span>แผนที่โรงเรียน</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-1" />
                <span>{settings.contact_address}</span>
              </div>
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{settings.contact_phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="break-all">{settings.contact_email}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 truncate">
              {settings.contact_hours || 'จันทร์ - ศุกร์ 07:30 - 16:30 น.'}
            </span>
            <Link to="/contact" className="text-xs font-bold text-sky-600 hover:text-sky-700 shrink-0">
              ส่งข้อความติดต่อ →
            </Link>
          </div>
        </div>
      </div>
    ),

    quick_services: (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
        <Link
          to="/calendar"
          className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
              ปฏิทินกิจกรรม
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">ตารางกิจกรรมประจำปี</p>
          </div>
        </Link>

        <Link
          to="/newsletters"
          className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
              จดหมายข่าวโรงเรียน
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">วารสารและเอกสารเผยแพร่</p>
          </div>
        </Link>

        <Link
          to="/enrollment"
          className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              การสมัครเรียน
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">ระเบียบการและสมัครออนไลน์</p>
          </div>
        </Link>

        <Link
          to="/contact"
          className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
              ช่องทางการติดต่อ
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">สอบถามข้อมูลและแผนที่</p>
          </div>
        </Link>
      </div>
    ),
  };

  const orderedSubSections = settings.newsHubSubSections.filter((s) => s.enabled);

  return (
    <section id="news" className="section-padding bg-slate-50/80 dark:bg-slate-900/50">
      <div className="container-school space-y-20">
        {/* Interactive Category Switcher Bar */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
              NEWS & ACTIVITIES HUB · ข่าวสารและกิจกรรมโรงเรียน
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-[1.38]">
              อัปเดตข่าวสาร กิจกรรมนักเรียน และผลงานของ{settings.school_name}
            </h2>
          </div>

          {/* Interactive Filter Controls */}
          <div
            role="tablist"
            aria-label="หมวดหมู่ข่าวสาร"
            className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-xl shrink-0"
          >
            {['ทั้งหมด', ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategoryTab === cat}
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeCategoryTab === cat
                    ? 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered View when a specific category tab is active */}
        {activeCategoryTab !== 'ทั้งหมด' ? (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                หมวดหมู่: {activeCategoryTab}
              </h3>
              <button
                type="button"
                onClick={() =>
                  navigate(`/news?category=${encodeURIComponent(activeCategoryTab)}`)
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {filteredByTab.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
                <p className="text-slate-500 text-sm mb-3">
                  ยังไม่มีข่าวสารในหมวด "{activeCategoryTab}" ในขณะนี้
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('ทั้งหมด')}
                  className="text-xs font-semibold text-sky-600 hover:underline"
                >
                  ดูข่าวสารทุกหมวด →
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredByTab.map((item) => renderNewsCard(item))}
              </div>
            )}
          </div>
        ) : (
          <>
            {orderedSubSections.map((sub) => (
              <div key={sub.id} data-news-subsection={sub.id}>
                {subSectionRegistry[sub.id]}
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default NewsSection;
