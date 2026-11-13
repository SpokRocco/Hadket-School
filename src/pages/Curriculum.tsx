import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  BookOpen,
  FlaskConical,
  Languages,
  Calculator,
  Monitor,
  Palette,
  Music,
  Dumbbell,
  GraduationCap,
  Heart,
  Trophy,
  Gamepad2,
  Clock,
  Users,
  Award,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'react-router-dom';
import { subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
  fetchSyncedCurriculumBundle,
  getCurriculumImageStyle,
  matchGradesToLevel,
  normalizeDirectImageUrl,
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

const Curriculum = () => {
  const { settings } = useSchoolSettings();
  const [levels, setLevels] = useState<CurriculumLevelItem[]>([]);
  const [programs, setPrograms] = useState<CurriculumProgramItem[]>([]);
  const [activities, setActivities] = useState<CurriculumActivityItem[]>([]);
  const [gradeData, setGradeData] = useState<GradeDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchData = useCallback(async () => {
    try {
      const bundle = await fetchSyncedCurriculumBundle({ activeOnly: true });
      setLevels(bundle.levels);
      setPrograms(bundle.programs);
      setActivities(bundle.activities);
      setGradeData(bundle.grades);
    } catch (error) {
      console.error('Error fetching synced curriculum:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return subscribeToRealtimeTables(
      'realtime_curriculum_page',
      ['curriculum_levels', 'curriculum_programs', 'curriculum_activities', 'grade_data', 'school_settings'],
      fetchData
    );
  }, [fetchData]);

  // Smooth-scroll to targeted anchor (#kindergarten, #primary, #lower-sec, #programs, #activities, etc.)
  useEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    } else if (!loading && !location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, location.hash, levels.length, programs.length, activities.length]);

  const getIconComponent = (iconName?: string | null): LucideIcon => {
    return (iconName && iconMap[iconName]) || BookOpen;
  };

  const totalStudentsFromGrades = gradeData.reduce((sum, g) => sum + (Number(g.students) || 0), 0);
  const totalRoomsFromGrades = gradeData.reduce((sum, g) => sum + (Number(g.rooms) || 0), 0);
  const activeHashId = location.hash ? location.hash.replace('#', '') : '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section synced with Homepage Curriculum Header */}
        <section className="bg-primary py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-1.5 text-accent font-semibold mb-3 text-sm tracking-wider uppercase">
              <Layers className="w-4 h-4" />
              CURRICULUM · หลักสูตรการศึกษา {settings.school_name}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-5">
              {settings.curriculum_title_1}
              {settings.curriculum_title_2}
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/85 max-w-3xl mx-auto mb-8">
              {settings.curriculum_description}
            </p>

            {/* Quick Navigation Anchors synced directly from Homepage cards */}
            {!loading && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto mb-6">
                {levels.map((lvl) => (
                  <a
                    key={lvl.id}
                    href={`#${lvl.id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeHashId === lvl.id
                        ? 'bg-accent text-accent-foreground shadow-md scale-105'
                        : 'bg-white/10 text-primary-foreground hover:bg-white/20 border border-white/15'
                    }`}
                  >
                    <span>{lvl.title}</span>
                  </a>
                ))}
                {programs.length > 0 && (
                  <a
                    href="#programs"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeHashId === 'programs'
                        ? 'bg-accent text-accent-foreground shadow-md'
                        : 'bg-white/10 text-primary-foreground hover:bg-white/20 border border-white/15'
                    }`}
                  >
                    <span>รายวิชาเพิ่มเติม ({programs.length})</span>
                  </a>
                )}
                {activities.length > 0 && (
                  <a
                    href="#activities"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeHashId === 'activities'
                        ? 'bg-accent text-accent-foreground shadow-md'
                        : 'bg-white/10 text-primary-foreground hover:bg-white/20 border border-white/15'
                    }`}
                  >
                    <span>กิจกรรมเสริม ({activities.length})</span>
                  </a>
                )}
              </div>
            )}

            {/* Live Grade Summary Strip */}
            {!loading && gradeData.length > 0 && (
              <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-2.5 rounded-2xl bg-black/20 text-primary-foreground/90 text-xs sm:text-sm font-mono">
                <span>เปิดสอน {gradeData.length} ระดับชั้น</span>
                <span>·</span>
                <span>{totalRoomsFromGrades} ห้องเรียน</span>
                <span>·</span>
                <span>นักเรียนปัจจุบัน {totalStudentsFromGrades.toLocaleString()} คน</span>
              </div>
            )}
          </div>
        </section>

        {/* Section 1: หลักสูตรแต่ละระดับชั้น (Synced 1:1 with Homepage Cards & Supabase `grade_data`) */}
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-10">
              <span className="inline-block text-sky-600 dark:text-sky-400 font-semibold text-xs uppercase tracking-wider mb-2">
                CURRICULUM STRUCTURE · โครงสร้างหลักสูตรสถานศึกษา
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                ระดับชั้นที่เปิดสอนและสาระการเรียนรู้
              </h2>
              <p className="text-muted-foreground">
                แสดงข้อมูลระดับชั้น รูปภาพจริง จำนวนห้องเรียน และจำนวนนักเรียนซิงค์ตรงกันกับฐานข้อมูล Supabase และหน้าหลักของโรงเรียน
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">กำลังโหลดข้อมูลหลักสูตร...</p>
              </div>
            ) : levels.length > 0 ? (
              <div className="space-y-10">
                {levels.map((level, idx) => {
                  const IconComponent = getIconComponent(level.icon);
                  const matchedStats = level.sync_grade_stats
                    ? matchGradesToLevel(gradeData, level.level_pattern || level.id)
                    : null;
                  const imgUrl = normalizeDirectImageUrl(level.image_url);
                  const relatedPrograms = programs.filter(
                    (p) => p.target_level === level.id
                  );
                  const isHighlighted = activeHashId === level.id;

                  return (
                    <article
                      key={level.id}
                      id={level.id}
                      className={`bg-card rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border overflow-hidden relative scroll-mt-24 transition-all ${
                        isHighlighted
                          ? 'border-sky-500 ring-2 ring-sky-500/25'
                          : 'border-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-72 h-72 ${
                          level.color || 'bg-sky-600'
                        } opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`}
                      />

                      <div className="relative grid lg:grid-cols-12 gap-8 items-start">
                        {/* Left Visual + Identity Column */}
                        <div className="lg:col-span-5 flex flex-col">
                          {imgUrl ? (
                            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-5 border border-border shadow-sm relative bg-slate-900 group">
                              <img
                                src={imgUrl}
                                alt={level.title}
                                referrerPolicy="no-referrer"
                                style={getCurriculumImageStyle(
                                  level.image_position,
                                  level.image_scale
                                )}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                              <div
                                className={`absolute top-3 left-3 w-10 h-10 rounded-xl ${
                                  level.color || 'bg-sky-600'
                                } flex items-center justify-center shadow-md`}
                              >
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white text-xs">
                                <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xs font-mono">
                                  LEVEL {String(idx + 1).padStart(2, '0')}
                                </span>
                                {matchedStats && matchedStats.levelCount > 0 && (
                                  <span className="px-2.5 py-1 rounded-full bg-sky-600/90 font-semibold">
                                    {matchedStats.totalStudents} คน · {matchedStats.totalRooms} ห้อง
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`w-full aspect-[4/3] rounded-2xl mb-5 border border-border ${
                                level.color || 'bg-sky-600'
                              } bg-opacity-95 text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`}
                            >
                              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3 shadow">
                                <IconComponent className="w-8 h-8 text-white" />
                              </div>
                              <span className="text-xs font-mono uppercase tracking-wider opacity-90 mb-1">
                                LEVEL {String(idx + 1).padStart(2, '0')}
                              </span>
                              <h3 className="text-xl font-bold">{level.title}</h3>
                              {matchedStats && matchedStats.levelCount > 0 && (
                                <p className="text-xs mt-2 bg-black/25 px-3 py-1 rounded-full font-mono">
                                  {matchedStats.summaryText}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {level.subtitle || 'หลักสูตรสถานศึกษา'}
                            </Badge>
                          </div>

                          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                            {level.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed mb-6">
                            {level.description || level.subtitle}
                          </p>

                          <div className="flex flex-wrap gap-3 mt-auto">
                            <Link to={`/enrollment?level=${encodeURIComponent(level.id)}`}>
                              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                                <span>สมัครเรียนระดับชั้นนี้</span>
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to="/students">
                              <Button variant="outline">ดูสถิตินักเรียนทั้งหมด</Button>
                            </Link>
                          </div>
                        </div>

                        {/* Right Details Column: Live Grade Stats + Subjects + Highlights */}
                        <div className="lg:col-span-7 space-y-6">
                          {/* Live Grade Data Breakdown from Supabase */}
                          {matchedStats && matchedStats.grades.length > 0 && (
                            <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl p-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <h4 className="font-bold text-foreground flex items-center gap-2 text-sm sm:text-base">
                                  <Users className="w-4 h-4 text-sky-600" />
                                  ชั้นเรียนที่เปิดสอนในปัจจุบัน (ข้อมูลจริงจาก Supabase)
                                </h4>
                                <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-500/15 px-2.5 py-1 rounded-full">
                                  รวม {matchedStats.totalRooms} ห้อง · {matchedStats.totalStudents} คน
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {matchedStats.grades.map((g) => (
                                  <div
                                    key={g.id}
                                    className="bg-white dark:bg-slate-900 rounded-xl px-3 py-2 border border-border/80 flex flex-col"
                                  >
                                    <span className="text-xs font-bold text-foreground">
                                      {g.level}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                      {g.rooms} ห้อง · {g.students} คน
                                      {(Number(g.boys) > 0 || Number(g.girls) > 0) &&
                                        ` (ช.${g.boys || 0}/ญ.${g.girls || 0})`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Core Learning Subjects & Highlights */}
                          <div className="grid md:grid-cols-2 gap-5">
                            <div className="bg-secondary/50 rounded-2xl p-5 border border-border/60">
                              <h4 className="font-bold text-foreground mb-3.5 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                กลุ่มสาระการเรียนรู้ / รายวิชาหลัก
                              </h4>
                              <ul className="space-y-2">
                                {level.subjects && level.subjects.length > 0 ? (
                                  level.subjects.map((subject, i) => (
                                    <li
                                      key={i}
                                      className="text-sm text-muted-foreground flex items-start gap-2"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                      <span>{subject}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-sm text-muted-foreground">
                                    จัดการเรียนรู้ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div className="bg-secondary/50 rounded-2xl p-5 border border-border/60">
                              <h4 className="font-bold text-foreground mb-3.5 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                จุดเด่นและเป้าหมายการเรียนรู้
                              </h4>
                              <ul className="space-y-2.5">
                                {level.highlights && level.highlights.length > 0 ? (
                                  level.highlights.map((item, i) => (
                                    <li
                                      key={i}
                                      className="text-sm text-muted-foreground flex items-start gap-2"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                      <span>{item}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-sm text-muted-foreground">
                                    พัฒนาผู้เรียนให้มีคุณภาพและคุณธรรมคู่ความรู้
                                  </li>
                                )}
                              </ul>

                              {relatedPrograms.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/80">
                                  <p className="text-xs font-bold text-foreground mb-2">
                                    รายวิชาเพิ่มเติมในระดับนี้:
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {relatedPrograms.map((rp) => (
                                      <a
                                        key={rp.id}
                                        href={`#${rp.id}`}
                                        className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                                      >
                                        {rp.title} →
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">ยังไม่มีข้อมูลระดับชั้นหลักสูตร</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Additional Programs (`curriculum_programs`) */}
        {programs.length > 0 && (
          <section id="programs" className="section-padding bg-secondary/25 scroll-mt-20">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mb-10">
                <span className="inline-block text-sky-600 dark:text-sky-400 font-semibold text-xs uppercase tracking-wider mb-2">
                  SPECIALIZED TRACKS & PROJECTS · รายวิชาเพิ่มเติม
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  รายวิชาเพิ่มเติมและแผนการเรียนรู้
                </h2>
                <p className="text-muted-foreground">
                  รายวิชาเสริมสมรรถนะที่เปิดสอนและปรับปรุงข้อมูลจริงจากฐานข้อมูลโรงเรียน
                </p>
              </div>

              <div className="space-y-8">
                {programs.map((program) => {
                  const IconComponent = getIconComponent(program.icon);
                  const imgUrl = normalizeDirectImageUrl(program.image_url);
                  const targetLevelObj = levels.find((l) => l.id === program.target_level);
                  const isHighlighted = activeHashId === program.id;

                  return (
                    <div
                      key={program.id}
                      id={program.id}
                      className={`bg-card rounded-3xl p-6 sm:p-8 shadow-md border overflow-hidden relative scroll-mt-24 transition-all ${
                        isHighlighted
                          ? 'border-sky-500 ring-2 ring-sky-500/25'
                          : 'border-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-56 h-56 ${program.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`}
                      />

                      <div className="relative grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 flex flex-col justify-between">
                          <div>
                            {imgUrl ? (
                              <div className="w-full h-48 rounded-2xl overflow-hidden mb-5 border border-border shadow-sm relative group bg-slate-900">
                                <img
                                  src={imgUrl}
                                  alt={program.title}
                                  referrerPolicy="no-referrer"
                                  style={getCurriculumImageStyle(
                                    program.image_position,
                                    program.image_scale
                                  )}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div
                                  className={`absolute top-3 left-3 w-10 h-10 rounded-xl ${program.color} flex items-center justify-center shadow`}
                                >
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`w-14 h-14 rounded-2xl ${program.color} flex items-center justify-center mb-5`}
                              >
                                <IconComponent className="w-7 h-7 text-white" />
                              </div>
                            )}
                            {targetLevelObj && (
                              <Badge variant="outline" className="mb-2 text-xs">
                                สำหรับ: {targetLevelObj.title}
                              </Badge>
                            )}
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                              {program.title}
                            </h3>
                            <p className="text-muted-foreground mb-6">{program.description}</p>
                          </div>
                          <Link
                            to={`/enrollment${
                              targetLevelObj
                                ? `?level=${encodeURIComponent(targetLevelObj.id)}`
                                : ''
                            }`}
                          >
                            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                              สมัครเรียน
                            </Button>
                          </Link>
                        </div>

                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                          <div className="bg-secondary/50 rounded-2xl p-6">
                            <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-primary" />
                              รายวิชา / เนื้อหาสำคัญ
                            </h4>
                            <ul className="space-y-2">
                              {program.subjects && program.subjects.length > 0 ? (
                                program.subjects.map((subject, i) => (
                                  <li
                                    key={i}
                                    className="text-muted-foreground flex items-center gap-2"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    <span>{subject}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">ยังไม่มีข้อมูลรายวิชา</li>
                              )}
                            </ul>
                          </div>
                          <div className="bg-secondary/50 rounded-2xl p-6">
                            <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                              <Award className="w-5 h-5 text-primary" />
                              ทักษะและแนวทางต่อยอดในอนาคต
                            </h4>
                            <ul className="space-y-2">
                              {program.careers && program.careers.length > 0 ? (
                                program.careers.map((career, i) => (
                                  <li
                                    key={i}
                                    className="text-muted-foreground flex items-center gap-2"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    <span>{career}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">ยังไม่มีข้อมูลเพิ่มเติม</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Schedule Info */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { icon: Clock, value: settings.curriculum_study_time, label: 'เวลาเรียน' },
                { icon: Users, value: settings.curriculum_class_size, label: 'จำนวนนักเรียนต่อห้อง' },
                {
                  icon: Award,
                  value: settings.curriculum_duration,
                  label: settings.curriculum_duration_label,
                },
              ].map((info, index) => (
                <div key={index}>
                  <info.icon className="w-10 h-10 text-accent mx-auto mb-4" />
                  <div className="text-3xl font-bold text-primary-foreground mb-2">
                    {info.value}
                  </div>
                  <div className="text-primary-foreground/80">{info.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Extracurricular Activities */}
        <section id="activities" className="section-padding bg-secondary/30 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <span className="inline-block text-accent font-semibold mb-3">
                กิจกรรมเสริมหลักสูตร
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                พัฒนาทักษะรอบด้าน
              </h2>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีข้อมูลกิจกรรมเสริมหลักสูตร
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {activities.map((activity) => {
                  const IconComponent = getIconComponent(activity.icon);
                  const imgUrl = normalizeDirectImageUrl(activity.image_url);
                  const anchorId = `activity-${activity.id}`;
                  const isHighlighted = activeHashId === anchorId;

                  return (
                    <div
                      key={activity.id}
                      id={anchorId}
                      className={`bg-card rounded-2xl overflow-hidden shadow-md border text-center hover:shadow-lg transition-all flex flex-col scroll-mt-24 ${
                        isHighlighted
                          ? 'border-sky-500 ring-2 ring-sky-500/25'
                          : 'border-border'
                      }`}
                    >
                      {imgUrl ? (
                        <div className="w-full h-40 overflow-hidden relative group bg-slate-900">
                          <img
                            src={imgUrl}
                            alt={activity.name}
                            referrerPolicy="no-referrer"
                            style={getCurriculumImageStyle(
                              activity.image_position,
                              activity.image_scale
                            )}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                            <IconComponent className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mt-6 mb-2">
                          <IconComponent className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-foreground mb-2">{activity.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          {activity.description || ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Curriculum;
