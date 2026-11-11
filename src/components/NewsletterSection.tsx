import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { FileText, ChevronRight } from 'lucide-react';
import { formatThaiDate, SchoolNewsletter } from '@/pages/Newsletters';

const NewsletterSection = () => {
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<SchoolNewsletter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLatestNewsletters = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('newsletters')
        .select('*')
        .eq('is_published', true)
        .order('issue_date', { ascending: false })
        .order('order_position', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNewsletters(data || []);
    } catch {
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestNewsletters();
    return subscribeToRealtimeTables(
      'realtime_newsletters_home',
      ['newsletters'],
      fetchLatestNewsletters
    );
  }, [fetchLatestNewsletters]);

  if (loading || newsletters.length === 0) return null;

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
              จดหมายข่าวประชาสัมพันธ์
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base mt-1.5">
              วารสารและจดหมายข่าวสรุปกิจกรรมสำคัญของ{settings.school_name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/newsletters')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap"
          >
            <span>ดูจดหมายข่าวทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Newsletter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {newsletters.map((item) => (
            <article
              key={item.id}
              onClick={() => navigate('/newsletters')}
              className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
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
              <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
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
                    <span className="text-xs font-semibold text-slate-600">
                      ฉบับที่ {item.issue_no} / ปีการศึกษา {item.academic_year}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs font-semibold text-sky-600 mb-2">
                  {item.category} · {formatThaiDate(item.issue_date)}
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
      </div>
    </section>
  );
};

export default NewsletterSection;
