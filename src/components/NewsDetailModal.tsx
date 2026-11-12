import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, ExternalLink, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import heroImage from '@/assets/hero-school.jpg';

export interface NewsModalItem {
  id: string;
  title: string;
  category?: string;
  date?: string;
  published_at?: string | null;
  created_at?: string;
  views?: number;
  cover_image_url?: string;
  excerpt?: string;
  content?: string;
  external_links?: { title: string; url: string }[];
}

interface NewsDetailModalProps {
  news: NewsModalItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NewsDetailModal = ({ news, isOpen, onClose }: NewsDetailModalProps) => {
  const viewedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && news?.id && viewedIdRef.current !== news.id) {
      viewedIdRef.current = news.id;
      // Increment view counter in Supabase
      try {
        (supabase as any).rpc('increment_news_view', { news_id: news.id });
      } catch (err) {
        console.warn('Could not increment view count:', err);
      }
    }
  }, [isOpen, news?.id]);

  if (!news) return null;

  const displayDate =
    news.date ||
    (news.published_at
      ? format(new Date(news.published_at), 'd MMMM yyyy', { locale: th })
      : news.created_at
      ? format(new Date(news.created_at), 'd MMMM yyyy', { locale: th })
      : '');

  const viewsCount = typeof news.views === 'number' ? news.views : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border shadow-2xl bg-card">
        {/* Sticky Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Badge className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold px-2.5 py-0.5">
              {news.category || 'ข่าวประชาสัมพันธ์'}
            </Badge>
            {displayDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {displayDate}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-8 h-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          <DialogHeader className="text-left space-y-3">
            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-snug">
              {news.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <Eye className="w-3.5 h-3.5 text-primary" />
                เข้าชม {viewsCount.toLocaleString()} ครั้ง
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Cover Photo */}
          <div className="w-full aspect-[16/9] max-h-[420px] rounded-2xl overflow-hidden bg-slate-900 border border-border shadow-sm">
            <img
              src={news.cover_image_url || heroImage}
              alt={news.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = heroImage;
              }}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Excerpt Lead */}
          {news.excerpt && (
            <div className="p-4 rounded-xl bg-muted/60 border-l-4 border-rose-500 text-sm sm:text-base text-foreground font-medium leading-relaxed">
              {news.excerpt}
            </div>
          )}

          {/* Full Rich Article Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base">
            {news.content ? (
              <div dangerouslySetInnerHTML={{ __html: news.content }} />
            ) : (
              <p className="text-muted-foreground leading-relaxed">{news.excerpt || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
            )}
          </div>

          {/* External Links / Attachments */}
          {news.external_links && news.external_links.length > 0 && (
            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                เอกสารและลิงก์ที่เกี่ยวข้อง:
              </h4>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {news.external_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary hover:bg-muted/50 transition-all text-xs group"
                  >
                    <span className="font-semibold text-foreground group-hover:text-primary truncate pr-2">
                      {link.title || link.url}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            โรงเรียนบ้านหาดเค็ด · ข่าวสารประชาสัมพันธ์
          </span>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs px-5 rounded-full"
          >
            ปิดหน้าต่าง
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsDetailModal;
