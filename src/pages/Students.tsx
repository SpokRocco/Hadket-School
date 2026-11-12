import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, GraduationCap, Trophy, BookOpen, TrendingUp, Star, LucideIcon } from 'lucide-react';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';

interface StudentStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface GradeData {
  id: string;
  level: string;
  rooms: number;
  students: number;
  boys: number;
  girls: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  year: string;
  category: string;
}

interface Activity {
  id: string;
  name: string;
  members: number;
  description: string;
}

interface StudentCouncil {
  id: string;
  name: string;
  position: string;
  class: string | null;
  initial: string | null;
  image_url: string | null;
}

const iconMap: Record<string, LucideIcon> = {
  Users, GraduationCap, Trophy, BookOpen, TrendingUp, Star,
};

const Students = () => {
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [studentCouncil, setStudentCouncil] = useState<StudentCouncil[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      const [statsRes, gradeRes, achievementsRes, activitiesRes, councilRes] = await Promise.all([
        supabase
          .from('student_stats')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
        supabase
          .from('grade_data')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
        supabase
          .from('student_achievements')
          .select('*')
          .order('order_position', { ascending: true }),
        supabase
          .from('student_activities')
          .select('*')
          .order('order_position', { ascending: true }),
        supabase
          .from('student_council')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true }),
      ]);

      let loadedStats: StudentStat[] = (!statsRes.error && Array.isArray(statsRes.data)) ? statsRes.data : [];
      let loadedGrades: GradeData[] = (!gradeRes.error && Array.isArray(gradeRes.data)) ? gradeRes.data : [];
      let loadedAchievements: Achievement[] = (!achievementsRes.error && Array.isArray(achievementsRes.data)) ? achievementsRes.data : [];
      let loadedActivities: Activity[] = (!activitiesRes.error && Array.isArray(activitiesRes.data)) ? activitiesRes.data : [];
      let loadedCouncil: StudentCouncil[] = (!councilRes.error && Array.isArray(councilRes.data)) ? councilRes.data : [];

      // Dual Cloud check from school_settings if any table is empty
      if (
        loadedStats.length === 0 ||
        loadedGrades.length === 0 ||
        loadedAchievements.length === 0 ||
        loadedActivities.length === 0 ||
        loadedCouncil.length === 0
      ) {
        try {
          const { data: settingsData } = await supabase
            .from('school_settings')
            .select('key, value')
            .in('key', [
              'grade_data_json',
              'student_stats_json',
              'student_achievements_json',
              'student_activities_json',
              'student_council_json',
            ]);

          if (settingsData && Array.isArray(settingsData)) {
            const map: Record<string, string> = {};
            settingsData.forEach((row) => {
              map[row.key] = row.value;
            });

            if (loadedGrades.length === 0 && map.grade_data_json) {
              const p = JSON.parse(map.grade_data_json);
              if (Array.isArray(p)) loadedGrades = p;
            }
            if (loadedStats.length === 0 && map.student_stats_json) {
              const p = JSON.parse(map.student_stats_json);
              if (Array.isArray(p)) loadedStats = p;
            }
            if (loadedAchievements.length === 0 && map.student_achievements_json) {
              const p = JSON.parse(map.student_achievements_json);
              if (Array.isArray(p)) loadedAchievements = p;
            }
            if (loadedActivities.length === 0 && map.student_activities_json) {
              const p = JSON.parse(map.student_activities_json);
              if (Array.isArray(p)) loadedActivities = p;
            }
            if (loadedCouncil.length === 0 && map.student_council_json) {
              const p = JSON.parse(map.student_council_json);
              if (Array.isArray(p)) loadedCouncil = p;
            }
          }
        } catch {
          // ignore
        }
      }

      // Filter out any legacy mock data (1,250 students, ม.4-ม.6, etc.)
      setStudentStats(loadedStats.filter(s => s.value !== '1,250' && s.value !== '650'));
      setGradeData(loadedGrades.filter(g => !(/มัธยมศึกษาปีที่\s*[4-6]|ม\.\s*[4-6]/.test(g.level) && (Number(g.students) > 100))));
      setAchievements(loadedAchievements.filter(a => a.title !== 'เหรียญทองโอลิมปิกวิชาการ'));
      setActivities(loadedActivities.filter(a => !(a.name === 'ชมรมวิทยาศาสตร์' && a.members === 85)));
      setStudentCouncil(loadedCouncil.filter(c => !(c.class && (c.class.includes('ม.6') || c.class.includes('ม.5')))));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    return subscribeToRealtimeTables(
      'realtime_students_page',
      ['student_stats', 'grade_data', 'student_achievements', 'student_activities', 'student_council', 'school_settings'],
      fetchAllData
    );
  }, [fetchAllData]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-accent font-semibold mb-4">นักเรียน</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                ข้อมูลนักเรียน
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                ข้อมูลสถิตินักเรียน ผลงานความสำเร็จ และกิจกรรมต่างๆ ของโรงเรียน
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {studentStats.map((stat) => {
                const IconComponent = iconMap[stat.icon] || Users;
                return (
                  <div key={stat.id} className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                    <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grade Distribution */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-accent font-semibold mb-4">สถิติ</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                จำนวนนักเรียนแยกตามระดับชั้น
              </h2>
              <p className="text-muted-foreground">
                ข้อมูลจำนวนนักเรียนในแต่ละระดับชั้น
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-card rounded-2xl shadow-md border border-border overflow-hidden">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">ระดับชั้น</th>
                    <th className="px-6 py-4 text-center font-semibold">จำนวนห้อง</th>
                    <th className="px-6 py-4 text-center font-semibold">นักเรียนชาย</th>
                    <th className="px-6 py-4 text-center font-semibold">นักเรียนหญิง</th>
                    <th className="px-6 py-4 text-center font-semibold">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.map((grade, index) => (
                    <tr key={index} className="border-t border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{grade.level}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{grade.rooms}</td>
                      <td className="px-6 py-4 text-center text-blue-500 font-semibold">{grade.boys}</td>
                      <td className="px-6 py-4 text-center text-pink-500 font-semibold">{grade.girls}</td>
                      <td className="px-6 py-4 text-center text-primary font-bold">{grade.students}</td>
                    </tr>
                  ))}
                  {gradeData.length > 0 ? (
                    <tr className="bg-secondary/50 font-bold border-t-2 border-border">
                      <td className="px-6 py-4 text-foreground">รวมทั้งหมด</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {gradeData.reduce((sum, g) => sum + (Number(g.rooms) || 0), 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-500">
                        {gradeData.reduce((sum, g) => sum + (Number(g.boys) || 0), 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-pink-500">
                        {gradeData.reduce((sum, g) => sum + (Number(g.girls) || 0), 0)}
                      </td>
                      <td className="px-6 py-4 text-center text-primary">
                        {gradeData.reduce((sum, g) => sum + (Number(g.students) || 0), 0)}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        ยังไม่มีข้อมูลจำนวนนักเรียน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-accent font-semibold mb-4">ความสำเร็จ</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                ผลงานนักเรียนดีเด่น
              </h2>
              <p className="text-muted-foreground">
                ความสำเร็จและรางวัลที่นักเรียนได้รับจากการแข่งขันต่างๆ
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Trophy className="w-6 h-6 text-accent" />
                  </div>
                  <span className="text-sm text-primary font-semibold">{achievement.year}</span>
                  <h3 className="text-lg font-bold text-foreground mt-1 mb-2">{achievement.title}</h3>
                  <p className="text-muted-foreground text-sm">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activities */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block text-accent font-semibold mb-4">กิจกรรม</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                ชมรมและกิจกรรมนักเรียน
              </h2>
              <p className="text-muted-foreground">
                กิจกรรมหลากหลายเพื่อพัฒนาทักษะและความสามารถของนักเรียน
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">{activity.name}</h3>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                      {activity.members} คน
                    </span>
                  </div>
                  <p className="text-muted-foreground">{activity.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Student Council */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-accent font-semibold mb-4">สภานักเรียน</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-6">
                คณะกรรมการสภานักเรียน
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                ตัวแทนนักเรียนที่ได้รับเลือกตั้งเพื่อทำหน้าที่เป็นสื่อกลางระหว่างนักเรียนและโรงเรียน
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {studentCouncil.length === 0 ? (
                  <p className="text-primary-foreground/75 text-sm col-span-full">
                    ยังไม่มีข้อมูลคณะกรรมการสภานักเรียนในฐานข้อมูล
                  </p>
                ) : (
                  studentCouncil.map((member) => (
                    <div key={member.id} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl font-bold text-accent-foreground">{member.initial || member.name.charAt(0)}</span>
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-primary-foreground">{member.name}</h3>
                      <p className="text-accent font-semibold">{member.position}</p>
                      <p className="text-primary-foreground/70 text-sm mt-2">{member.class}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Students;
