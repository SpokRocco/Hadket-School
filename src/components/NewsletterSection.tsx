import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  DEFAULT_NEWSLETTERS,
  formatThaiDate,
  SchoolNewsletter,
} from '@/pages/Newsletters';

const NewsletterSection = () => {
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<SchoolNewsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestNewsletters();
  }, []);

  const fetchLatestNewsletters = async () => {
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
  };

  if (loading || newsletters.length === 0) return null;

  return (
    <section id="newsletters" className="section-padding bg-secondary/30">
      <div className="container-school">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 text-accent font-semibold text-sm mb-3">
              <FileText className="w-4 h-4" />
              SCHOOL NEWSLETTER
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              จดหมายข่าว<span className="text-primary">ประชาสัมพันธ์</span>
            </h2>
            <p className="text-muted-foreground text-lg mt-2">
              วารสารและจดหมายข่าวสรุปกิจกรรมสำคัญของ{settings.school_name}
            </p>
          </div>
          <Button
            variant="outline"
            className="self-start md:self-auto gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate('/newsletters')}
          >
            ดูจดหมายข่าวทั้งหมด
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Newsletter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {newsletters.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/newsletters')}
              className="group cursor-pointer bg-card rounded-2xl overflow-hidden border-2 border-border hover:border-primary/60 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
            >
              {/* Official School Newsletter Masthead */}
              <div className="bg-gradient-to-r from-primary via-primary to-navy-light px-4 py-3 text-primary-foreground border-b-4 border-accent flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center flex-shrink-0">
                    วค
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-accent font-semibold uppercase leading-none">
                      จดหมายข่าวประชาสัมพันธ์
                    </p>
                    <p className="text-xs font-bold truncate mt-0.5">{settings.school_name}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 bg-white/10 px-2 py-1 rounded border border-white/15">
                  <span className="block text-[9px] text-primary-foreground/80 leading-none">
                    ฉบับที่
                  </span>
                  <span className="text-xs font-bold text-accent">
                    {item.issue_no}/{item.academic_year}
                  </span>
                </div>
              </div>

              {/* Date & Category Sub-bar */}
              <div className="bg-secondary/70 px-4 py-2 text-xs flex items-center justify-between border-b border-border">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {formatThaiDate(item.issue_date)}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {item.category}
                </Badge>
              </div>

              {/* Preview Image */}
              <div className="aspect-[4/3] bg-secondary/30 relative overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/5 via-accent/10 to-primary/10 flex flex-col items-center justify-center p-6 text-center">
                    <FileText className="w-10 h-10 text-primary mb-2" />
                    <span className="text-xs font-semibold text-primary">
                      ฉบับที่ {item.issue_no} / ปีการศึกษา {item.academic_year}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-base text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {item.summary}
                  </p>
                )}

                <div className="pt-3 border-t border-border mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    {item.views || 0} ครั้ง
                  </span>
                  <span className="font-semibold text-primary">อ่านจดหมายข่าว →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;

