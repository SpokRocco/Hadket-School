import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, X, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
  SCHOOL_NEWS_CATEGORIES,
  filterNewsItems,
  sortNewsForDisplay,
} from '@/utils/newsUtils';
import heroImage from '@/assets/hero-school.jpg';
import NewsDetailModal from '@/components/NewsDetailModal';

interface NewsItem {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  views: number;
  content: string;
  cover_image_url?: string;
  is_pinned: boolean;
  sort_order?: number;
  published_at?: string | null;
  created_at?: string;
  external_links?: { title: string; url: string }[];
}

const News = () => {
  const { settings } = useSchoolSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'ทั้งหมด',
    ...SCHOOL_NEWS_CATEGORIES,
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const viewedNewsIdRef = useRef<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNewsClick = useCallback(async (news: NewsItem) => {
    setSelectedNews(news);
    viewedNewsIdRef.current = news.id;
    window.scrollTo(0, 0);
    try {
      await (supabase as any).rpc('increment_news_view', { news_id: news.id });
    } catch (error) {
      console.error('Error updating views:', error);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    const newsId = params.get('id');
    if (!newsId) {
      viewedNewsIdRef.current = null;
      setSelectedNews(null);
    } else if (allNews.length > 0) {
      const foundNews = allNews.find((n) => n.id === newsId);
      if (foundNews) {
        if (viewedNewsIdRef.current === foundNews.id) {
          setSelectedNews(foundNews);
        } else {
          handleNewsClick(foundNews);
        }
      }
    }
  }, [allNews, location.search, handleNewsClick]);

  const fetchNews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('published', true)
        .order('is_pinned', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const formattedNews: NewsItem[] = ((data as any[]) || []).map((item) => ({
        id: item.id,
        category: item.category || 'ข่าวประชาสัมพันธ์',
        title: item.title,
        excerpt: item.excerpt || '',
        date: item.published_at
          ? format(new Date(item.published_at), 'd MMMM yyyy', { locale: th })
          : format(new Date(item.created_at), 'd MMMM yyyy', { locale: th }),
        views: item.views || 0,
        content: item.content || '',
        cover_image_url: item.cover_image_url || undefined,
        is_pinned: item.is_pinned || false,
        sort_order: item.sort_order ?? 9999,
        published_at: item.published_at,
        created_at: item.created_at,
        external_links: item.external_links || [],
      }));

      setAllNews(sortNewsForDisplay(formattedNews, true));
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories' as any)
        .select('name')
        .order('name');

      if (error) throw error;

      const dbNames = data?.map((c: any) => c.name) || [];
      const merged = Array.from(
        new Set(['ทั้งหมด', ...SCHOOL_NEWS_CATEGORIES, ...dbNames])
      );
      setCategories(merged);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    fetchCategories();
    return subscribeToRealtimeTables(
      'realtime_news_page',
      ['news', 'news_categories'],
      () => {
        fetchNews();
        fetchCategories();
      }
    );
  }, [fetchNews, fetchCategories]);

  const filteredNews = filterNewsItems(allNews, {
    category: selectedCategory,
    searchTerm,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Institutional Header */}
      <section className="bg-slate-900 text-white pt-28 pb-16 border-b border-slate-800">
        <div className="container-school">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-2">
            NEWS & ACTIVITIES DIRECTORY
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            ข่าวสารและกิจกรรมโรงเรียน
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl">
            ติดตามข่าวประชาสัมพันธ์ กิจกรรมนักเรียน ผลงานนักเรียน และประกาศสำคัญของ
            {settings.school_name}
          </p>
        </div>
      </section>

      {/* Search & Category Filter Bar */}
      <section className="py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container-school">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ค้นหาหัวข้อข่าว หรือกิจกรรม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === category
                      ? 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* News Cards Grid */}
      <section className="py-12 bg-slate-50/70 dark:bg-slate-950">
        <div className="container-school">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">กำลังโหลดข่าวสาร...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-3">
                ไม่พบข่าวสารในหมวดหมู่ "{selectedCategory}"
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedCategory('ทั้งหมด');
                  setSearchTerm('');
                }}
              >
                แสดงข่าวสารทั้งหมด
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredNews.map((news) => (
                <article
                  key={news.id}
                  onClick={() => handleNewsClick(news)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                    <img
                      src={news.cover_image_url || heroImage}
                      alt={news.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
                      {news.category}
                      {news.is_pinned ? ' · ปักหมุดเด่น' : ''}
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2.5 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                      {news.title}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-mono tabular-nums">
                      <span>{news.date}</span>
                      <span aria-hidden="true">-</span>
                      <span>อ่าน {news.views.toLocaleString()} ครั้ง</span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 line-clamp-2 flex-1">
                      {news.excerpt}
                    </p>

                    <div className="pt-2 mt-auto">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform">
                        อ่านต่อ →
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Persistent Full Details Modal Popup */}
      <NewsDetailModal
        news={selectedNews}
        isOpen={!!selectedNews}
        onClose={() => {
          setSelectedNews(null);
          window.history.pushState({}, '', '/news');
        }}
      />

      <Footer />
    </div>
  );
};

export default News;
