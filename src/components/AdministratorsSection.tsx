import { useState, useEffect } from 'react';
import { Award, GraduationCap, Quote, Sparkles } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';

interface Administrator {
  id: string;
  name: string;
  position: string;
  education: string;
  quote: string;
  photo_url: string;
  order_position: number;
}

const AdministratorsSection = () => {
  const { settings } = useSchoolSettings();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdministrators();
  }, []);

  const fetchAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setAdministrators(data);
      } else {
        setAdministrators([
          {
            id: 'default-director',
            name: 'ดร.สมศักดิ์ วิทยาการ',
            position: 'ผู้อำนวยการโรงเรียน',
            education: 'ปริญญาเอก การบริหารการศึกษา',
            quote: 'มุ่งมั่นพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรม ก้าวทันเทคโนโลยี สู่มาตรฐานสากล',
            photo_url: '',
            order_position: 1,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching administrators:', error);
      setAdministrators([
        {
          id: 'default-director',
          name: 'ดร.สมศักดิ์ วิทยาการ',
          position: 'ผู้อำนวยการโรงเรียน',
          education: 'ปริญญาเอก การบริหารการศึกษา',
          quote: 'มุ่งมั่นพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรม ก้าวทันเทคโนโลยี สู่มาตรฐานสากล',
          photo_url: '',
          order_position: 1,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section id="administrators" className="section-padding bg-secondary/30">
        <div className="container-school">
          <div className="text-center py-12">
            <p className="text-muted-foreground">กำลังโหลดข้อมูลผู้บริหาร...</p>
          </div>
        </div>
      </section>
    );
  }

  // แสดงผู้บริหารหลัก (คนแรก) แบบโดดเด่นตรงกลาง
  const primaryDirector = administrators[0];

  return (
    <section id="administrators" className="section-padding bg-gradient-to-b from-secondary/50 via-background to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-school relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 text-accent font-semibold text-sm mb-4">
            <Award className="w-4 h-4" />
            ผู้บริหารสถานศึกษา
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            ทำเนียบ<span className="text-primary">ผู้บริหาร</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            ผู้นำองค์กรแห่งการเรียนรู้ มุ่งพัฒนาคุณภาพการศึกษาและเยาวชนอย่างยั่งยืน
          </p>
        </div>

        {/* Single Director Featured Showcase */}
        {primaryDirector && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-3xl overflow-hidden shadow-xl border border-border/80 relative">
              <div className="grid md:grid-cols-12 items-stretch">
                {/* Director Portrait Column */}
                <div className="md:col-span-5 bg-gradient-to-br from-primary via-primary/95 to-navy-light p-8 md:p-10 flex flex-col items-center justify-center relative text-center">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                  <div className="relative z-10">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-full p-1.5 bg-gradient-to-tr from-accent via-gold-light to-white shadow-2xl">
                      {primaryDirector.photo_url ? (
                        <img
                          src={primaryDirector.photo_url}
                          alt={primaryDirector.name}
                          className="w-full h-full rounded-full object-cover border-4 border-primary"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/90 flex items-center justify-center border-4 border-card/20">
                          <span className="text-6xl font-bold text-accent">
                            {primaryDirector.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-accent text-accent-foreground font-semibold text-xs shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      {settings.school_name}
                    </div>
                  </div>
                </div>

                {/* Director Information & Vision Quote Column */}
                <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-6">
                    <span className="text-sm font-semibold uppercase tracking-wider text-accent">
                      {primaryDirector.position}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-3">
                      {primaryDirector.name}
                    </h3>
                    {primaryDirector.education && (
                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3.5 py-1.5 rounded-lg">
                        <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{primaryDirector.education}</span>
                      </div>
                    )}
                  </div>

                  {primaryDirector.quote && (
                    <div className="relative bg-secondary/50 rounded-2xl p-6 border-l-4 border-accent">
                      <Quote className="w-8 h-8 text-accent/30 absolute top-4 right-4" />
                      <p className="text-foreground/90 italic text-base sm:text-lg leading-relaxed relative z-10">
                        "{primaryDirector.quote}"
                      </p>
                      <p className="text-xs font-semibold text-primary mt-3">
                        — สารจากผู้อำนวยการโรงเรียน
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdministratorsSection;
