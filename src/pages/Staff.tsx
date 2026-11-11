import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
  Mail,
  Phone,
  GraduationCap,
  Award,
  Users,
  Briefcase,
  Quote,
  Sparkles,
} from 'lucide-react';

interface DirectorItem {
  id: string;
  name: string;
  position: string;
  education: string;
  quote: string;
  photo_url: string;
  order_position: number;
}

interface StaffItem {
  id: string;
  name: string;
  position: string;
  department: string;
  subject: string;
  education: string;
  experience: string;
  photo_url: string;
  staff_type: 'director' | 'teaching' | 'support';
  order_position: number;
}

const cardGradients = [
  'from-blue-600 to-blue-400',
  'from-emerald-600 to-emerald-400',
  'from-purple-600 to-purple-400',
  'from-amber-600 to-amber-400',
  'from-rose-600 to-rose-400',
  'from-teal-600 to-teal-400',
  'from-indigo-600 to-indigo-400',
  'from-cyan-600 to-cyan-400',
];

const Staff = () => {
  const { settings } = useSchoolSettings();
  const [directors, setDirectors] = useState<DirectorItem[]>([]);
  const [teachingStaff, setTeachingStaff] = useState<StaffItem[]>([]);
  const [supportStaff, setSupportStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonnelData = useCallback(async () => {
    try {
      const [adminRes, staffRes] = await Promise.all([
        supabase
          .from('administrators')
          .select('*')
          .order('order_position', { ascending: true }),
        supabase
          .from('staff')
          .select('*')
          .order('order_position', { ascending: true }),
      ]);

      const adminList: DirectorItem[] = (adminRes.data || []).map((a: any) => ({
        id: a.id,
        name: a.name || '',
        position: a.position || 'ผู้อำนวยการโรงเรียน',
        education: a.education || '',
        quote: a.quote || '',
        photo_url: a.photo_url || '',
        order_position: a.order_position ?? 1,
      }));

      const rawStaff: any[] = staffRes.data || [];

      const extraDirectors: DirectorItem[] = rawStaff
        .filter((s) => s.staff_type === 'director' || s.department === '__director__')
        .map((s) => ({
          id: s.id,
          name: s.name || '',
          position: s.position || 'ผู้อำนวยการโรงเรียน',
          education: s.education || '',
          quote: s.experience || '',
          photo_url: s.photo_url || '',
          order_position: s.order_position ?? 1,
        }));

      const teachingList: StaffItem[] = rawStaff
        .filter(
          (s) =>
            (s.staff_type === 'teaching' || !s.staff_type) &&
            s.department !== '__director__'
        )
        .map((s) => ({
          id: s.id,
          name: s.name || '',
          position: s.position || '',
          department: s.department || '',
          subject: s.subject || '',
          education: s.education || '',
          experience: s.experience || '',
          photo_url: s.photo_url || '',
          staff_type: 'teaching',
          order_position: s.order_position ?? 1,
        }));

      const supportList: StaffItem[] = rawStaff
        .filter((s) => s.staff_type === 'support')
        .map((s) => ({
          id: s.id,
          name: s.name || '',
          position: s.position || '',
          department: s.department || '',
          subject: s.subject || '',
          education: s.education || '',
          experience: s.experience || '',
          photo_url: s.photo_url || '',
          staff_type: 'support',
          order_position: s.order_position ?? 1,
        }));

      setDirectors([...adminList, ...extraDirectors]);
      setTeachingStaff(teachingList);
      setSupportStaff(supportList);
    } catch (error) {
      console.error('Error fetching personnel data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonnelData();
    return subscribeToRealtimeTables(
      'realtime_staff_page',
      ['administrators', 'staff'],
      fetchPersonnelData
    );
  }, [fetchPersonnelData]);

  const totalPersonnel = directors.length + teachingStaff.length + supportStaff.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-accent font-semibold mb-4">ทำเนียบบุคลากร</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                ผู้บริหาร ครู และบุคลากรทางการศึกษา
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                ทีมผู้บริหาร คณะครู และบุคลากรที่มีความเชี่ยวชาญและทุ่มเทในการพัฒนาผู้เรียน
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-amber-500 mb-2">
                  {loading ? '-' : directors.length}
                </div>
                <div className="text-muted-foreground text-sm">ผู้อำนวยการ</div>
              </div>

              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {loading ? '-' : teachingStaff.length}
                </div>
                <div className="text-muted-foreground text-sm">ครูและบุคลากรทางการศึกษา</div>
              </div>

              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6 text-accent" />
                </div>
                <div className="text-3xl font-bold text-accent mb-2">
                  {loading ? '-' : supportStaff.length}
                </div>
                <div className="text-muted-foreground text-sm">บุคลากรสายสนับสนุน</div>
              </div>

              <div className="bg-card rounded-2xl p-6 text-center shadow-md border border-border">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-3xl font-bold text-emerald-500 mb-2">
                  {loading ? '-' : totalPersonnel}
                </div>
                <div className="text-muted-foreground text-sm">บุคลากรรวมทั้งหมด</div>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <p className="text-muted-foreground text-lg">กำลังโหลดข้อมูลบุคลากร...</p>
            </div>
          </section>
        ) : (
          <>
            {/* แถวที่ 1: ผู้อำนวยการ */}
            <section className="py-16 md:py-20 bg-gradient-to-b from-secondary/40 via-background to-background">
              <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 text-accent font-semibold text-sm mb-3">
                    <Award className="w-4 h-4" />
                    ผู้บริหารสถานศึกษา
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                    ผู้อำนวยการ
                  </h2>
                  <p className="text-muted-foreground">
                    ผู้นำองค์กรแห่งการเรียนรู้ มุ่งพัฒนาคุณภาพการศึกษาอย่างยั่งยืน
                  </p>
                </div>

                {directors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ยังไม่มีข้อมูลผู้อำนวยการ
                  </div>
                ) : directors.length === 1 ? (
                  <div className="max-w-3xl mx-auto">
                    {directors.map((director) => (
                      <div
                        key={director.id}
                        className="bg-card rounded-3xl overflow-hidden shadow-xl border border-border/80"
                      >
                        <div className="grid md:grid-cols-12 items-stretch">
                          <div className="md:col-span-5 bg-gradient-to-br from-primary via-primary/95 to-navy-light p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full p-1.5 bg-gradient-to-tr from-accent via-gold-light to-white shadow-2xl">
                              {director.photo_url ? (
                                <img
                                  src={director.photo_url}
                                  alt={director.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full rounded-full object-cover border-4 border-primary"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-primary/90 flex items-center justify-center border-4 border-card/20">
                                  <span className="text-5xl font-bold text-accent">
                                    {director.name ? director.name.charAt(0) : 'ผ'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent text-accent-foreground font-semibold text-xs shadow">
                              <Sparkles className="w-3.5 h-3.5" />
                              {settings.school_name}
                            </div>
                          </div>

                          <div className="md:col-span-7 p-8 flex flex-col justify-center">
                            <span className="text-sm font-semibold uppercase tracking-wider text-accent">
                              {director.position}
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-3">
                              {director.name}
                            </h3>
                            {director.education && (
                              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3.5 py-1.5 rounded-lg w-fit mb-4">
                                <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
                                <span>{director.education}</span>
                              </div>
                            )}
                            {director.quote && (
                              <div className="relative bg-secondary/50 rounded-2xl p-5 border-l-4 border-accent">
                                <Quote className="w-6 h-6 text-accent/30 absolute top-3 right-3" />
                                <p className="text-foreground/90 italic text-sm sm:text-base leading-relaxed">
                                  "{director.quote}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {directors.map((director) => (
                      <div
                        key={director.id}
                        className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border text-center"
                      >
                        <div className="h-36 bg-gradient-to-br from-primary to-navy-light flex items-center justify-center">
                          {director.photo_url ? (
                            <img
                              src={director.photo_url}
                              alt={director.name}
                              referrerPolicy="no-referrer"
                              className="w-24 h-24 rounded-full object-cover border-4 border-accent shadow-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/50">
                              <span className="text-3xl font-bold text-white">
                                {director.name ? director.name.charAt(0) : 'ผ'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-foreground mb-1">{director.name}</h3>
                          <p className="text-accent font-semibold text-sm mb-2">{director.position}</p>
                          {director.education && (
                            <p className="text-sm text-muted-foreground mb-2">{director.education}</p>
                          )}
                          {director.quote && (
                            <p className="text-xs italic text-muted-foreground bg-secondary/50 p-3 rounded-xl">
                              "{director.quote}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* แถวที่ 2: ครูและบุคลากรทางการศึกษา */}
            <section className="py-16 md:py-20 border-t border-border/50">
              <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-3">
                    <GraduationCap className="w-4 h-4" />
                    คณาจารย์และบุคลากรวิชาการ
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                    ครูและบุคลากรทางการศึกษา
                  </h2>
                  <p className="text-muted-foreground">
                    ครูผู้เชี่ยวชาญในแต่ละกลุ่มสาระการเรียนรู้ พร้อมถ่ายทอดความรู้อย่างมีคุณภาพ
                  </p>
                </div>

                {teachingStaff.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ยังไม่มีข้อมูลครูและบุคลากรทางการศึกษา
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {teachingStaff.map((teacher, index) => {
                      const gradient = cardGradients[index % cardGradients.length];
                      return (
                        <div
                          key={teacher.id}
                          className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border"
                        >
                          <div
                            className={`h-36 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}
                          >
                            {teacher.photo_url ? (
                              <img
                                src={teacher.photo_url}
                                alt={teacher.name}
                                referrerPolicy="no-referrer"
                                className="w-24 h-24 rounded-full object-cover border-4 border-white/80 shadow-md"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center border-4 border-card/50">
                                <span className="text-3xl font-bold text-card">
                                  {teacher.name ? teacher.name.charAt(0) : 'ค'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-5 text-center">
                            <h3 className="text-lg font-bold text-foreground mb-1">
                              {teacher.name}
                            </h3>
                            <p className="text-accent font-medium text-sm mb-2">
                              {teacher.position}
                            </p>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {teacher.subject && <p>กลุ่มสาระ/วิชา: {teacher.subject}</p>}
                              {teacher.department && <p>ฝ่าย: {teacher.department}</p>}
                              {teacher.education && <p>{teacher.education}</p>}
                              {teacher.experience && <p>ประสบการณ์: {teacher.experience}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* แถวที่ 3: บุคลากรสายสนับสนุน */}
            <section className="py-16 md:py-20 bg-secondary/30 border-t border-border/50">
              <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 text-accent font-semibold text-sm mb-3">
                    <Briefcase className="w-4 h-4" />
                    ฝ่ายสนับสนุนการจัดการศึกษา
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                    บุคลากรสายสนับสนุน
                  </h2>
                  <p className="text-muted-foreground">
                    ทีมงานสนับสนุนที่ช่วยให้การดำเนินงานของโรงเรียนเป็นไปอย่างราบรื่นและมีประสิทธิภาพ
                  </p>
                </div>

                {supportStaff.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ยังไม่มีข้อมูลบุคลากรสายสนับสนุน
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {supportStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className="bg-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border text-center"
                      >
                        {staff.photo_url ? (
                          <img
                            src={staff.photo_url}
                            alt={staff.name}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary/20 shadow-sm"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-primary">
                              {staff.name ? staff.name.charAt(0) : 'บ'}
                            </span>
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-foreground mb-1">{staff.name}</h3>
                        <p className="text-accent font-medium text-sm mb-2">{staff.position}</p>
                        {staff.department && (
                          <p className="text-sm text-muted-foreground mb-1">{staff.department}</p>
                        )}
                        {staff.education && (
                          <p className="text-sm text-muted-foreground mb-1">{staff.education}</p>
                        )}
                        {staff.experience && (
                          <p className="text-sm text-muted-foreground">
                            ประสบการณ์: {staff.experience}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Contact */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                    ติดต่อฝ่ายบุคลากร
                  </h3>
                  <p className="text-primary-foreground/80">
                    สอบถามข้อมูลเพิ่มเติมเกี่ยวกับบุคลากรของ {settings.school_name}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {settings.contact_phone && (
                    <a
                      href={`tel:${settings.contact_phone}`}
                      className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      {settings.contact_phone}
                    </a>
                  )}
                  {settings.contact_email && (
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="inline-flex items-center gap-3 bg-primary-foreground/10 text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/20"
                    >
                      <Mail className="w-5 h-5" />
                      {settings.contact_email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Staff;
