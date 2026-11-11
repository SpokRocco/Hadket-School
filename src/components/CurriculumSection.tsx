import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  FlaskConical,
  Languages,
  Calculator,
  Palette,
  Music,
  Monitor,
  Dumbbell,
  GraduationCap,
  LucideIcon,
  ChevronRight,
} from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-school.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';

interface CurriculumProgram {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Activity {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
}

interface GradeRow {
  id: string;
  level: string;
  rooms: number;
  students: number;
  boys?: number;
  girls?: number;
  is_active?: boolean;
  order_position?: number;
}

interface LevelShowcaseCard {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  image: string;
  href: string;
}

const iconMap: Record<string, LucideIcon> = {
  FlaskConical,
  Languages,
  Calculator,
  Monitor,
  BookOpen,
  Palette,
  Music,
  Dumbbell,
  GraduationCap,
};

const buildLevelCardsFromGrades = (grades: GradeRow[]): LevelShowcaseCard[] => {
  if (!grades || grades.length === 0) return [];

  const kinderRows = grades.filter(
    (g) => g.level.includes('อนุบาล') || g.level.includes('ปฐมวัย')
  );
  const primaryRows = grades.filter(
    (g) => g.level.includes('ประถม') || /^ป\.\s*\d/.test(g.level.trim())
  );
  const lowerSecRows = grades.filter((g) =>
    /มัธยมศึกษาปีที่\s*[1-3]|ม\.\s*[1-3]/.test(g.level)
  );
  const upperSecRows = grades.filter((g) =>
    /มัธยมศึกษาปีที่\s*[4-6]|ม\.\s*[4-6]/.test(g.level)
  );

  const cards: LevelShowcaseCard[] = [];

  if (kinderRows.length > 0) {
    const rooms = kinderRows.reduce((sum, r) => sum + (Number(r.rooms) || 0), 0);
    const students = kinderRows.reduce((sum, r) => sum + (Number(r.students) || 0), 0);
    cards.push({
      id: 'kindergarten',
      title: 'ระดับปฐมวัย (อนุบาล)',
      subtitle: 'เตรียมความพร้อมด้านพัฒนาการและทักษะพื้นฐาน',
      summary: `${kinderRows.map((r) => r.level).join(', ')} · ${rooms} ห้องเรียน · ${students} คน`,
      image: heroImage,
      href: '/students',
    });
  }

  if (primaryRows.length > 0) {
    const rooms = primaryRows.reduce((sum, r) => sum + (Number(r.rooms) || 0), 0);
    const students = primaryRows.reduce((sum, r) => sum + (Number(r.students) || 0), 0);
    cards.push({
      id: 'primary',
      title: 'ระดับประถมศึกษา (ป.1 – ป.6)',
      subtitle: 'ปูพื้นฐานวิชาการ คุณธรรม และทักษะการเรียนรู้ตลอดชีวิต',
      summary: `${primaryRows.length} ระดับชั้น · ${rooms} ห้องเรียน · ${students} คน`,
      image: studentGraduationActivity,
      href: '/students',
    });
  }

  if (lowerSecRows.length > 0) {
    const rooms = lowerSecRows.reduce((sum, r) => sum + (Number(r.rooms) || 0), 0);
    const students = lowerSecRows.reduce((sum, r) => sum + (Number(r.students) || 0), 0);
    cards.push({
      id: 'lower-sec',
      title: 'ระดับมัธยมศึกษาตอนต้น (ม.1 – ม.3)',
      subtitle: 'ค้นพบศักยภาพ วิทยาศาสตร์ คอมพิวเตอร์ และงานอาชีพ',
      summary: `${lowerSecRows.length} ระดับชั้น · ${rooms} ห้องเรียน · ${students} คน`,
      image: studentScienceLab,
      href: '/curriculum',
    });
  }

  if (upperSecRows.length > 0) {
    const rooms = upperSecRows.reduce((sum, r) => sum + (Number(r.rooms) || 0), 0);
    const students = upperSecRows.reduce((sum, r) => sum + (Number(r.students) || 0), 0);
    cards.push({
      id: 'upper-sec',
      title: 'ระดับมัธยมศึกษาตอนปลาย (ม.4 – ม.6)',
      subtitle: 'เตรียมความพร้อมสู่ระดับอุดมศึกษาและสายอาชีพ',
      summary: `${upperSecRows.length} ระดับชั้น · ${rooms} ห้องเรียน · ${students} คน`,
      image: studentGraduationActivity,
      href: '/curriculum',
    });
  }

  return cards;
};

const CurriculumSection = () => {
  const { settings } = useSchoolSettings();
  const [programs, setPrograms] = useState<CurriculumProgram[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gradeData, setGradeData] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [programsRes, activitiesRes, gradesRes] = await Promise.all([
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

      if (!programsRes.error) {
        setPrograms((programsRes.data as CurriculumProgram[]) || []);
      }
      if (!activitiesRes.error) {
        setActivities((activitiesRes.data as Activity[]) || []);
      }
      if (!gradesRes.error) {
        setGradeData((gradesRes.data as GradeRow[]) || []);
      }
    } catch (error) {
      console.error('Error fetching curriculum data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = (supabase as any)
      .channel('realtime_curriculum_home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'curriculum_programs' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'curriculum_activities' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grade_data' }, fetchData)
      .subscribe();

    const handleCustomRealtime = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (
        !detail ||
        detail.table === 'curriculum_programs' ||
        detail.table === 'curriculum_activities' ||
        detail.table === 'grade_data' ||
        detail.table === '*'
      ) {
        fetchData();
      }
    };

    window.addEventListener('kk-supabase-realtime', handleCustomRealtime);

    return () => {
      window.removeEventListener('kk-supabase-realtime', handleCustomRealtime);
      if (channel && typeof (supabase as any).removeChannel === 'function') {
        (supabase as any).removeChannel(channel);
      }
    };
  }, [fetchData]);

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || BookOpen;
  };

  const levelCards = buildLevelCardsFromGrades(gradeData);

  const levelGridClass =
    levelCards.length >= 4
      ? 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14'
      : levelCards.length === 3
      ? 'grid md:grid-cols-3 gap-6 mb-14'
      : levelCards.length === 2
      ? 'grid md:grid-cols-2 gap-6 mb-14 max-w-4xl mx-auto'
      : 'grid grid-cols-1 max-w-md mx-auto mb-14';

  const programGridClass =
    programs.length >= 4
      ? 'grid md:grid-cols-2 lg:grid-cols-4 gap-6'
      : programs.length === 3
      ? 'grid md:grid-cols-3 gap-6'
      : programs.length === 2
      ? 'grid md:grid-cols-2 gap-6'
      : 'grid grid-cols-1 max-w-2xl';

  return (
    <section id="curriculum" className="section-padding bg-white dark:bg-slate-950">
      <div className="container-school">
        {/* Clean Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">
              COURSES OFFERED · หลักสูตรการศึกษา
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              <span className="text-primary">{settings.curriculum_title_1}</span>
              {settings.curriculum_title_2}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg mt-2 max-w-2xl">
              {settings.curriculum_description}
            </p>
          </div>
          <Link
            to="/curriculum"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 whitespace-nowrap"
          >
            <span>ดูรายละเอียดหลักสูตรทั้งหมด</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dynamic School Levels Showcase from Live Supabase `grade_data` */}
        {!loading && levelCards.length > 0 && (
          <div className={levelGridClass}>
            {levelCards.map((card) => (
              <Link
                key={card.id}
                to={card.href}
                className="group relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[4/4.2] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-end"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                <div className="relative z-10 p-6">
                  <p className="text-xs font-medium text-sky-300 mb-1">
                    {card.subtitle}
                  </p>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-xs font-mono text-slate-200/90">
                    {card.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Specialized Study Plans / Curriculum Tracks from Supabase */}
        {loading ? (
          <div className="text-center py-10 text-slate-500">กำลังโหลดข้อมูลหลักสูตร...</div>
        ) : programs.length > 0 ? (
          <div className="mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
              รายวิชาเพิ่มเติมและแผนการเรียนรู้
            </h3>
            <div className={programGridClass}>
              {programs.map((program, idx) => {
                const IconComponent = getIconComponent(program.icon);
                return (
                  <div
                    key={program.id}
                    className="group bg-slate-50/90 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 transition-all duration-200 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-sky-600">
                        {String(idx + 1).padStart(2, '0')}. PROGRAM
                      </span>
                      <IconComponent className="w-5 h-5 text-sky-600" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {program.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 flex-1">
                      {program.description}
                    </p>
                    <Link
                      to={`/curriculum#${program.id}`}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 mt-auto"
                    >
                      <span>ดูรายละเอียดแผนการเรียน</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : levelCards.length === 0 ? (
          <div className="text-center py-10 mb-12 text-slate-500 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            ยังไม่มีข้อมูลหลักสูตรที่เปิดเผยแพร่ในขณะนี้
          </div>
        ) : null}

        {/* Extracurricular Clubs Strip */}
        {activities.length > 0 && (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                กิจกรรมชมรมและพัฒนาผู้เรียนรอบด้าน
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                ส่งเสริมทักษะดนตรี กีฬา ศิลปะ และการค้นคว้าทางวิชาการนอกห้องเรียน
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {activities.map((activity) => {
                const IconComponent = getIconComponent(activity.icon);
                return (
                  <Link
                    key={activity.id}
                    to="/students"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 transition-colors"
                  >
                    <IconComponent className="w-4 h-4 text-sky-600" />
                    <span>{activity.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CurriculumSection;
