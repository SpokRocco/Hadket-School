import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  BookOpen,
  Globe,
  User,
  GraduationCap,
  ArrowRight,
  MonitorPlay,
  PlusCircle,
} from 'lucide-react';
import {
  CARD_THEMES,
  DEFAULT_MEDIA_RESOURCES,
  MediaResource,
} from '@/pages/MediaLibrary';

const MediaLibrarySection = () => {
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopResources();
  }, []);

  const fetchTopResources = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('media_resources')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true })
        .limit(6);

      if (error) throw error;
      if (data && data.length > 0) {
        setResources(data);
      } else {
        setResources(DEFAULT_MEDIA_RESOURCES.slice(0, 4));
      }
    } catch {
      setResources(DEFAULT_MEDIA_RESOURCES.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <section id="media-library" className="section-padding bg-secondary/40 relative overflow-hidden">
      <div className="container-school relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-3">
              <MonitorPlay className="w-4 h-4" />
              Google Sites Link Panel
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              คลังสื่อการสอน<span className="text-primary">ออนไลน์</span>
            </h2>
            <p className="text-muted-foreground text-lg mt-2 max-w-2xl">
              รวมลิงก์ห้องเรียนออนไลน์และสื่อการสอน (Google Sites) ของคุณครูแต่ละกลุ่มสาระการเรียนรู้
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/admin/dashboard?tab=media">
              <Button variant="outline" className="rounded-xl gap-2 font-semibold">
                <PlusCircle className="w-4 h-4 text-primary" />
                ครูเพิ่มคลังสื่อ
              </Button>
            </Link>
            <Link to="/media-library">
              <Button className="rounded-xl gap-2 font-semibold">
                ดูคลังสื่อทั้งหมด
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Link Panel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((item) => {
            const theme = CARD_THEMES[item.badge_color] || CARD_THEMES.blue;
            return (
              <a
                key={item.id}
                href={item.google_site_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group bg-card rounded-2xl overflow-hidden border border-border/80 ${theme.border} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col`}
              >
                {/* Header Banner */}
                <div className={`h-24 bg-gradient-to-r ${theme.gradient} p-4 relative flex items-start justify-between`}>
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-15" />
                  <span className="relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold">
                    <BookOpen className="w-3 h-3" />
                    {item.subject_department}
                  </span>
                  {item.grade_level && (
                    <span className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/25 text-white text-[11px]">
                      <GraduationCap className="w-3 h-3" />
                      {item.grade_level}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 pt-0 flex-1 flex flex-col">
                  <div className="flex items-end gap-3 -mt-8 mb-3 relative z-10">
                    {item.teacher_photo_url ? (
                      <img
                        src={item.teacher_photo_url}
                        alt={item.teacher_name}
                        className="w-16 h-16 rounded-xl object-cover border-4 border-card shadow-md bg-card"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-navy-light border-4 border-card shadow-md flex items-center justify-center text-accent font-bold text-xl">
                        {item.teacher_name.charAt(0)}
                      </div>
                    )}
                    <div className="pb-0.5 min-w-0">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-primary" />
                        ครูผู้สอน
                      </span>
                      <p className="font-bold text-sm text-foreground truncate">{item.teacher_name}</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {item.description}
                    </p>
                  )}

                  <div className="pt-3 border-t border-border mt-auto flex items-center justify-between text-xs font-semibold text-primary group-hover:text-accent transition-colors">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      เปิด Google Site
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MediaLibrarySection;

