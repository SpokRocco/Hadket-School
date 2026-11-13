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
  Heart,
  Trophy,
  Users,
  Gamepad2,
  LucideIcon,
  ChevronRight,
} from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  fetchSyncedCurriculumBundle,
  getCurriculumImageStyle,
  matchGradesToLevel,
  normalizeDirectImageUrl,
  resolveLevelHref,
  type CurriculumActivityItem,
  type CurriculumLevelItem,
  type CurriculumProgramItem,
  type GradeDataRow,
} from '@/utils/curriculumUtils';

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
  Heart,
  Trophy,
  Users,
  Gamepad2,
};

const CurriculumSection = () => {
  const { settings } = useSchoolSettings();
  const [levels, setLevels] = useState<CurriculumLevelItem[]>([]);
  const [programs, setPrograms] = useState<CurriculumProgramItem[]>([]);
  const [activities, setActivities] = useState<CurriculumActivityItem[]>([]);
  const [gradeData, setGradeData] = useState<GradeDataRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const bundle = await fetchSyncedCurriculumBundle({ activeOnly: true });
      setLevels(bundle.levels);
      setPrograms(bundle.programs);
      setActivities(bundle.activities);
      setGradeData(bundle.grades);
    } catch (error) {
      console.error('Error fetching curriculum data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return subscribeToRealtimeTables(
      'realtime_curriculum_home',
      ['curriculum_levels', 'curriculum_programs', 'curriculum_activities', 'grade_data', 'school_settings'],
      fetchData
    );
  }, [fetchData]);

  const getIconComponent = (iconName?: string | null) => {
    return (iconName && iconMap[iconName]) || BookOpen;
  };

  // Combine synced levels with live Supabase `grade_data` statistics
  const levelCards = levels.map((lvl) => {
    const stats = lvl.sync_grade_stats
      ? matchGradesToLevel(gradeData, lvl.level_pattern || lvl.id)
      : null;
    const summaryText =
      stats && stats.levelCount > 0
        ? stats.summaryText
        : lvl.subjects && lvl.subjects.length > 0
        ? `${lvl.subjects.length} กลุ่มสาระการเรียนรู้ · คลิกดูรายละเอียด`
        : 'คลิกดูรายละเอียดหลักสูตร';

    return {
      ...lvl,
      resolvedHref: resolveLevelHref(lvl),
      resolvedImage: normalizeDirectImageUrl(lvl.image_url),
      summaryText,
    };
  });

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

        {/* Dynamic School Levels Showcase synced 1:1 with `/curriculum` & Supabase `grade_data` */}
        {!loading && levelCards.length > 0 && (
          <div className={levelGridClass}>
            {levelCards.map((card, idx) => {
              const IconComponent = getIconComponent(card.icon);
              return (
                <Link
                  key={card.id}
                  to={card.resolvedHref}
                  className="group relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[4/4.2] bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-end"
                >
                  {card.resolvedImage ? (
                    <img
                      src={card.resolvedImage}
                      alt={card.title}
                      referrerPolicy="no-referrer"
                      style={getCurriculumImageStyle(card.image_position, card.image_scale)}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 pb-20">
                      <div
                        className={`w-16 h-16 rounded-2xl ${card.color || 'bg-sky-600'} text-white flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <span className="text-[11px] font-mono tracking-wider uppercase text-sky-300/80">
                        LEVEL {String(idx + 1).padStart(2, '0')} · หลักสูตรสถานศึกษา
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

                  <div className="relative z-10 p-6">
                    <p className="text-xs font-medium text-sky-300 mb-1 line-clamp-1">
                      {card.subtitle}
                    </p>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors mb-1.5">
                      {card.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-mono text-slate-200/90">
                        {card.summaryText}
                      </p>
                      <span className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:bg-sky-500 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Specialized Study Plans / Additional Subjects from Supabase */}
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
                const imgUrl = normalizeDirectImageUrl(program.image_url);
                const targetLevelObj = levels.find((l) => l.id === program.target_level);
                return (
                  <div
                    key={program.id}
                    className="group bg-slate-50/90 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/60 transition-all duration-200 flex flex-col shadow-xs hover:shadow-md"
                  >
                    {imgUrl ? (
                      <div className="relative w-full h-44 overflow-hidden bg-slate-900 shrink-0">
                        <img
                          src={imgUrl}
                          alt={program.title}
                          referrerPolicy="no-referrer"
                          style={getCurriculumImageStyle(program.image_position, program.image_scale)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 text-[11px] font-mono font-bold bg-black/60 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full">
                          {targetLevelObj ? targetLevelObj.title : `${String(idx + 1).padStart(2, '0')}. PROGRAM`}
                        </span>
                        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow">
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>
                    ) : null}

                    <div className="p-6 flex-1 flex flex-col">
                      {!imgUrl && (
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-mono font-bold text-sky-600">
                            {targetLevelObj
                              ? targetLevelObj.title
                              : `${String(idx + 1).padStart(2, '0')}. PROGRAM`}
                          </span>
                          <IconComponent className="w-5 h-5 text-sky-600" />
                        </div>
                      )}
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
                        <span>ดูรายละเอียดรายวิชา / แผนการเรียน</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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

        {/* Extracurricular Clubs Strip (Links directly to /curriculum#activities) */}
        {activities.length > 0 && (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <Link to="/curriculum#activities" className="group inline-flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                  กิจกรรมชมรมและพัฒนาผู้เรียนรอบด้าน
                </h3>
                <ChevronRight className="w-4 h-4 text-sky-600" />
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                ส่งเสริมทักษะดนตรี กีฬา ศิลปะ และการค้นคว้าทางวิชาการนอกห้องเรียน
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
              {activities.map((activity) => {
                const IconComponent = getIconComponent(activity.icon);
                const imgUrl = normalizeDirectImageUrl(activity.image_url);
                return (
                  <Link
                    key={activity.id}
                    to={`/curriculum#activity-${activity.id}`}
                    className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={activity.name}
                        referrerPolicy="no-referrer"
                        style={getCurriculumImageStyle(activity.image_position, activity.image_scale)}
                        className="w-6 h-6 rounded-md object-cover border border-slate-300 dark:border-slate-700"
                      />
                    ) : (
                      <IconComponent className="w-4 h-4 text-sky-600" />
                    )}
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
