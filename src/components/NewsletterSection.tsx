import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { FileText, ChevronRight, PlusCircle, Calendar, Paperclip } from 'lucide-react';
import { formatThaiDate, SchoolNewsletter } from '@/pages/Newsletters';

const NewsletterSection = () => {
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<SchoolNewsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const { title, subtitle, limit, category, sortMode } = settings.newsletterDisplay;

  const fetchLatestNewsletters = useCallback(async () => {
    try {
      setFetchError(false);

      const buildQuery = (withOrderPosition: boolean) => {
        let query = (supabase as any)
          .from('newsletters')
          .select('*')
          .eq('is_published', true);

        if (category && category !== 'ทั้งหมด') {
          query = query.eq('category', category);
        }

        if (withOrderPosition) {
          if (sortMode === 'custom_order') {
            query = query
              .order('order_position', { ascending: true })
              .order('issue_date', { ascending: false });
          } else {
            query = query
              .order('issue_date', { ascending: false })
              .order('order_position', { ascending: false });
          }
        } else {
          query = query.order('issue_date', { ascending: false });
        }

        return query.limit(limit);
      };

      let { data, error } = await buildQuery(true);

      // Fallback if an older DB table misses order_position
      if (error) {
        const retry = await buildQuery(false);
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      setNewsletters(data || []);
    } catch (error) {
      console.error('Error fetching homepage newsletters:', error);
      setFetchError(true);
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  }, [category, limit, sortMode]);

  useEffect(() => {
    fetchLatestNewsletters();
    return subscribeToRealtimeTables(
      'realtime_newsletters_home',
      ['newsletters', 'school_settings'],
      fetchLatestNewsletters
    );
  }, [fetchLatestNewsletters]);

  const gridClass =
    limit === 4
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
      : 'grid grid-cols-1 md:grid-cols-3 gap-7';

  return (
    <section
      id="newsletters"
      className="section-padding bg-white dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800"
    >
      <div className="container-school">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
              SCHOOL NEWSLETTER · วารสารโรงเรียน
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              {title || 'จดหมายข่าวประชาสัมพันธ์'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base mt-1.5">
              {subtitle || `วารสารและจดหมายข่าวสรุปกิจกรรมสำคัญของ${settings.school_name}`}
              {category && category !== 'ทั้งหมด' ? ` · หมวดหมู่: ${category}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/newsletters"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-sm font-semibold text-rose-600 dark:text-rose-400 transition-colors whitespace-nowrap"
            >
              <span>ดูจดหมายข่าวทั้งหมด</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Loading Skeleton / Real Supabase Cards / Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 h-80 animate-pulse"
              />
            ))}
          </div>
        ) : newsletters.length === 0 ? (
          <div className="bg-slate-50/80 dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
            <FileText className="w-11 h-11 text-sky-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              {fetchError
                ? 'ยังไม่พบข้อมูลจากตารางจดหมายข่าว (newsletters) ใน Supabase'
                : category !== 'ทั้งหมด'
                ? `ยังไม่มีจดหมายข่าวในหมวดหมู่ "${category}"`
                : 'ยังไม่มีจดหมายข่าวประชาสัมพันธ์ที่เผยแพร่ในฐานข้อมูล'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 max-w-xl mx-auto">
              {fetchError
                ? 'ผู้ดูแลระบบสามารถตรวจสอบการเชื่อมต่อตาราง newsletters ได้จากเมนูตั้งค่า Supabase หรือสร้างฉบับใหม่ในหลังบ้าน'
                : 'สามารถเพิ่มและเผยแพร่จดหมายข่าวฉบับใหม่ได้จากหลังบ้าน ระบบจะอัปเดตแสดงบนหน้าแรกทันทีแบบเรียลไทม์'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/newsletters"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <span>ไปหน้าจดหมายข่าว</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/admin/dashboard?tab=newsletters"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>เพิ่มจดหมายข่าวในหลังบ้าน</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className={gridClass}>
            {newsletters.map((item) => (
              <article
                key={item.id}
                onClick={() => navigate(`/newsletters?id=${encodeURIComponent(item.id)}`)}
                className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-500/60 transition-all duration-200 flex flex-col"
              >
                {/* Masthead with Dynamic School Logo / Short Name */}
                <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {settings.school_logo_url ? (
                      <img
                        src={settings.school_logo_url}
                        alt={settings.school_name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-contain bg-white p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {settings.school_short_name || 'บหค'}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-amber-400 truncate">
                      จดหมายข่าว {settings.school_name}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-300 shrink-0">
                    ฉบับที่ {item.issue_no}/{item.academic_year}
                  </span>
                </div>

                {/* Preview Image */}
                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <FileText className="w-10 h-10 text-sky-600 mb-2" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        ฉบับที่ {item.issue_no} / ปีการศึกษา {item.academic_year}
                      </span>
                    </div>
                  )}
                  {item.file_url && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 text-white text-[11px] font-medium backdrop-blur-sm">
                      <Paperclip className="w-3 h-3 text-amber-400" />
                      มีไฟล์แนบ
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 mb-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {item.category} · {formatThaiDate(item.issue_date)}
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 flex-1">
                      {item.summary}
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                    <span>อ่าน {item.views || 0} ครั้ง</span>
                    <span className="font-sans font-bold text-rose-600">อ่านจดหมายข่าว →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsletterSection;
