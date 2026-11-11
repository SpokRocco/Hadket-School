import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BookOpen, FlaskConical, Languages, Calculator, Monitor, Palette, Music, Dumbbell, Clock, Users, Award, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

interface CurriculumProgram {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  subjects: string[] | null;
  careers: string[] | null;
  is_active: boolean;
}

interface Activity {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
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
};

const Curriculum = () => {
  const { settings } = useSchoolSettings();
  const [programs, setPrograms] = useState<CurriculumProgram[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchData = useCallback(async () => {
    try {
      const [programsRes, activitiesRes] = await Promise.all([
        supabase
          .from('curriculum_programs')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
        supabase
          .from('curriculum_activities')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true })
      ]);

      if (programsRes.error) throw programsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      setPrograms(programsRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return subscribeToRealtimeTables(
      'realtime_curriculum_page',
      ['curriculum_programs', 'curriculum_activities'],
      fetchData
    );
  }, [fetchData]);

  // Scroll to program when hash changes
  useEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [loading, location.hash]);

  const getIconComponent = (iconName: string): LucideIcon => {
    return iconMap[iconName] || BookOpen;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block text-accent font-semibold mb-4">หลักสูตรการศึกษา</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              หลักสูตรที่หลากหลาย
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              เราออกแบบหลักสูตรที่ตอบโจทย์ความสนใจและเป้าหมายของนักเรียนทุกคน
              พร้อมทีมครูผู้เชี่ยวชาญในแต่ละสาขา
            </p>
          </div>
        </section>

        {/* Programs Detail */}
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">กำลังโหลด...</p>
              </div>
            ) : programs.length > 0 ? (
              <div className="space-y-12">
                {programs.map((program) => {
                  const IconComponent = getIconComponent(program.icon);
                  return (
                    <div
                      key={program.id}
                      id={program.id}
                      className="bg-card rounded-3xl p-8 md:p-10 shadow-lg border border-border overflow-hidden relative scroll-mt-24"
                    >
                      <div className={`absolute top-0 right-0 w-64 h-64 ${program.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />

                      <div className="relative grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                          <div className={`w-16 h-16 rounded-2xl ${program.color} flex items-center justify-center mb-6`}>
                            <IconComponent className="w-8 h-8 text-card" />
                          </div>
                          <h2 className="text-3xl font-bold text-foreground mb-4">{program.title}</h2>
                          <p className="text-muted-foreground text-lg mb-6">{program.description}</p>
                          <Link to="/enrollment">
                            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                              สมัครเรียน
                            </Button>
                          </Link>
                        </div>

                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                          <div className="bg-secondary/50 rounded-2xl p-6">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-primary" />
                              รายวิชาหลัก
                            </h3>
                            <ul className="space-y-2">
                              {(program.subjects && program.subjects.length > 0) ? (
                                program.subjects.map((subject, i) => (
                                  <li key={i} className="text-muted-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    {subject}
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">ยังไม่มีข้อมูลรายวิชา</li>
                              )}
                            </ul>
                          </div>
                          <div className="bg-secondary/50 rounded-2xl p-6">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                              <Award className="w-5 h-5 text-primary" />
                              อาชีพในอนาคต
                            </h3>
                            <ul className="space-y-2">
                              {(program.careers && program.careers.length > 0) ? (
                                program.careers.map((career, i) => (
                                  <li key={i} className="text-muted-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    {career}
                                  </li>
                                ))
                              ) : (
                                <li className="text-muted-foreground">ยังไม่มีข้อมูลอาชีพ</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">ยังไม่มีข้อมูลหลักสูตร</p>
              </div>
            )}
          </div>
        </section>

        {/* Schedule Info */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { icon: Clock, value: settings.curriculum_study_time, label: 'เวลาเรียน' },
                { icon: Users, value: settings.curriculum_class_size, label: 'จำนวนนักเรียนต่อห้อง' },
                { icon: Award, value: settings.curriculum_duration, label: settings.curriculum_duration_label },
              ].map((info, index) => (
                <div key={index}>
                  <info.icon className="w-10 h-10 text-accent mx-auto mb-4" />
                  <div className="text-3xl font-bold text-primary-foreground mb-2">{info.value}</div>
                  <div className="text-primary-foreground/80">{info.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activities */}
        <section className="section-padding bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block text-accent font-semibold mb-4">กิจกรรมเสริมหลักสูตร</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                พัฒนาทักษะรอบด้าน
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activities.map((activity) => {
                const IconComponent = getIconComponent(activity.icon);
                return (
                  <div key={activity.id} className="bg-card rounded-2xl p-8 shadow-md border border-border text-center hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{activity.name}</h3>
                    <p className="text-muted-foreground">{activity.description || ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Curriculum;
