import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { ExternalLink, Globe, ChevronRight, PlusCircle, BookOpen } from 'lucide-react';
import type { MediaResource } from '@/pages/MediaLibrary';
import type { TeacherMediaItem } from '@/components/admin/portals/TeacherPortal';

interface HomeMediaCard {
  id: string;
  title: string;
  description: string | null;
  subject_department: string;
  grade_level: string | null;
  teacher_name: string;
  teacher_photo_url: string | null;
  url: string;
  actionLabel: string;
}

const MediaLibrarySection = () => {
  const [cards, setCards] = useState<HomeMediaCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopResources = useCallback(async () => {
    try {
      const [resourcesRes, teacherMediaRes] = await Promise.all([
        (supabase as any)
          .from('media_resources')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true })
          .limit(4),
        (supabase as any)
          .from('teacher_media_items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4),
      ]);

      const dbResources: MediaResource[] =
        !resourcesRes.error && Array.isArray(resourcesRes.data) ? resourcesRes.data : [];
      const dbTeacherMedia: TeacherMediaItem[] =
        !teacherMediaRes.error && Array.isArray(teacherMediaRes.data)
          ? teacherMediaRes.data
          : [];

      if (dbResources.length > 0) {
        setCards(
          dbResources.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            subject_department: item.subject_department,
            grade_level: item.grade_level,
            teacher_name: item.teacher_name,
            teacher_photo_url: item.teacher_photo_url,
            url: item.google_site_url,
            actionLabel: 'เปิด Google Site',
          }))
        );
      } else if (dbTeacherMedia.length > 0) {
        setCards(
          dbTeacherMedia.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            subject_department: item.subject_department,
            grade_level: item.grade_level,
            teacher_name: item.teacher_name,
            teacher_photo_url: null,
            url: item.media_url,
            actionLabel: 'เปิดสื่อการสอน',
          }))
        );
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error('Error fetching media library section:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopResources();
    return subscribeToRealtimeTables(
      'realtime_media_home',
      ['media_resources', 'teacher_media_items'],
      fetchTopResources
    );
  }, [fetchTopResources]);

  if (loading) return null;

  return (
    <section
      id="media-library"
      className="section-padding bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-200/70 dark:border-slate-800"
    >
      <div className="container-school">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
              E-LEARNING & DIGITAL MEDIA PORTAL
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              คลังสื่อการสอนออนไลน์
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base mt-1.5 max-w-2xl">
              รวมลิงก์ห้องเรียนออนไลน์และสื่อการสอนดิจิทัลของคุณครูแต่ละกลุ่มสาระการเรียนรู้
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/dashboard?tab=media"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>ครูเพิ่มคลังสื่อ</span>
            </Link>
            <Link
              to="/media-library"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <span>ดูคลังสื่อทั้งหมด</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Clean Real-DB Portal Grid */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
              >
                <div className="text-xs font-semibold text-sky-600 mb-3">
                  {item.subject_department}
                  {item.grade_level ? ` · ${item.grade_level}` : ''}
                </div>

                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-5 flex-1">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  {item.teacher_photo_url ? (
                    <img
                      src={item.teacher_photo_url}
                      alt={item.teacher_name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sky-600 font-bold text-sm shrink-0">
                      {item.teacher_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.teacher_name}
                    </p>
                    <p className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-600" />
                      <span>{item.actionLabel}</span>
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-sky-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              ยังไม่มีรายการสื่อการสอนในฐานข้อมูล
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              คุณครูสามารถเข้าสู่ระบบเพื่อเพิ่มลิงก์คลังสื่อการสอนออนไลน์ได้ทันที
            </p>
            <Link
              to="/admin/dashboard?tab=media"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เพิ่มสื่อการสอน</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default MediaLibrarySection;
