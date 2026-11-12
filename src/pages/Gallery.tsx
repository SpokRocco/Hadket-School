import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Calendar, MapPin } from 'lucide-react';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Album {
  id: string;
  title: string;
  category: string | null;
  date: string;
  location: string | null;
  cover_photo_url: string | null;
  description: string | null;
  google_photos_url?: string | null;
  photos: Photo[];
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  order_position: number;
}

const categoryColors: Record<string, string> = {
  'กีฬาสี': 'bg-blue-500',
  'วันสำคัญ': 'bg-green-500',
  'ศึกษาดูงาน': 'bg-purple-500',
  'กิจกรรมวิชาการ': 'bg-orange-500',
  'พิธีการ': 'bg-red-500',
};

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [categories, setCategories] = useState<string[]>(['ทั้งหมด']);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlbums = useCallback(async () => {
    try {
      const { data: albumsData, error: albumsError } = await supabase
        .from('gallery_albums' as any)
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: false });

      if (albumsError) throw albumsError;

      const albumsWithPhotos = await Promise.all(
        (albumsData || []).map(async (album: any) => {
          const { data: photos } = await supabase
            .from('gallery_photos' as any)
            .select('*')
            .eq('album_id', album.id)
            .order('order_position');

          return {
            id: album.id,
            title: album.title,
            category: album.category,
            date: album.event_date
              ? format(new Date(album.event_date), 'dd MMMM yyyy', { locale: th })
              : format(new Date(album.created_at), 'dd MMMM yyyy', { locale: th }),
            location: album.location,
            cover_photo_url: album.cover_photo_url || ((photos as any)?.[0]?.photo_url) || null,
            description: album.description,
            google_photos_url: album.google_photos_url || null,
            photos: (photos as any[]) || [],
          };
        })
      );

      setAlbums(albumsWithPhotos);

      const uniqueCategories = Array.from(
        new Set((albumsData as any[])?.map((a) => a.category).filter(Boolean))
      ) as string[];
      setCategories(['ทั้งหมด', ...uniqueCategories]);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
    return subscribeToRealtimeTables(
      'realtime_gallery_page',
      ['gallery_albums', 'gallery_photos'],
      fetchAlbums
    );
  }, [fetchAlbums]);

  const filteredAlbums =
    selectedCategory === 'ทั้งหมด'
      ? albums
      : albums.filter((album) => album.category === selectedCategory);

  const handleAlbumClick = (album: Album) => {
    if (album.photos.length > 0) {
      setSelectedAlbum(album);
      setCurrentPhotoIndex(0);
    }
  };

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailContainerRef.current) {
      const scrollAmount = 300;
      thumbnailContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleNext = () => {
    if (selectedAlbum) {
      setCurrentPhotoIndex((prev) => (prev + 1) % selectedAlbum.photos.length);
      // Optional: Auto scroll thumbnail to active
    }
  };

  const handlePrev = () => {
    if (selectedAlbum) {
      setCurrentPhotoIndex((prev) => (prev - 1 + selectedAlbum.photos.length) % selectedAlbum.photos.length);
      // Optional: Auto scroll thumbnail to active
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">คลังภาพกิจกรรม</h1>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 text-base ${selectedCategory === category ? categoryColors[category] || 'bg-primary' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg shadow-md overflow-hidden animate-pulse h-64"></div>
            ))}
          </div>
        ) : filteredAlbums.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">ไม่พบอัลบั้มในหมวดหมู่นี้</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAlbums.map((album) => (
              <div
                key={album.id}
                className="bg-card rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 group relative"
                onClick={() => handleAlbumClick(album)}
              >
                <div className="relative w-full h-48 overflow-hidden">
                  {album.cover_photo_url ? (
                    <img
                      src={album.cover_photo_url}
                      alt={album.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <h3 className="text-lg font-semibold text-white">{album.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{album.title}</h3>
                  {album.category && (
                    <Badge className={`mb-2 ${categoryColors[album.category] || 'bg-gray-500'}`}>
                      {album.category}
                    </Badge>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{album.date}</span>
                  </div>
                  {album.location && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{album.location}</span>
                    </div>
                  )}

                  {album.google_photos_url && (
                    <div className="mt-3 pt-2 border-t border-border">
                      <a
                        href={album.google_photos_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>📷 เปิดอัลบั้มใน Google Photos</span>
                        <span>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 flex flex-col bg-black/50 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden [&>button]:hidden focus:outline-none">
          {selectedAlbum && selectedAlbum.photos.length > 0 && (
            <div className="flex flex-col h-full relative">
              {/* Header - Floating Glass Strip */}
              <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between pointer-events-none">
                <div className="flex-1 min-w-0 pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-2 rounded-full inline-block mr-auto border border-white/10 shadow-lg animate-in slide-in-from-top-4 duration-500">
                  <h3 className="font-bold text-lg truncate text-white">{selectedAlbum.title}</h3>
                  <p className="text-xs text-white/70 uppercase tracking-wider">
                    PHOTO {currentPhotoIndex + 1} OF {selectedAlbum.photos.length}
                  </p>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                  {selectedAlbum.google_photos_url && (
                    <a
                      href={selectedAlbum.google_photos_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-105"
                    >
                      <span>📷 Google Photos</span>
                      <span>↗</span>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md pointer-events-auto shadow-lg border border-white/10 w-10 h-10 transition-transform hover:rotate-90 duration-300"
                    onClick={() => setSelectedAlbum(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Main Stage - Image Area */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-black/50 via-transparent to-black/50">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                <img
                  key={currentPhotoIndex}
                  src={selectedAlbum.photos[currentPhotoIndex].photo_url}
                  alt={selectedAlbum.photos[currentPhotoIndex].caption || `รูปที่ ${currentPhotoIndex + 1}`}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain p-4 sm:p-12 transition-all duration-500 animate-in zoom-in-95"
                />

                {/* Navigation Arrows - Big & Floating */}
                {selectedAlbum.photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full z-10 w-14 h-14 bg-black/20 hover:bg-white/10 text-white/80 hover:text-white backdrop-blur-md border border-white/5 transition-all duration-300 hover:scale-110 active:scale-95 group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                    >
                      <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full z-10 w-14 h-14 bg-black/20 hover:bg-white/10 text-white/80 hover:text-white backdrop-blur-md border border-white/5 transition-all duration-300 hover:scale-110 active:scale-95 group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                    >
                      <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </>
                )}
              </div>

              {/* Footer - Caption & Thumbnails */}
              <div className="shrink-0 bg-black/60 backdrop-blur-xl border-t border-white/5 pb-6 pt-4 px-6">

                {/* Caption - Elegant Typography */}
                {selectedAlbum.photos[currentPhotoIndex].caption && (
                  <div className="mb-4 text-center max-w-4xl mx-auto">
                    <p className="text-base text-white/90 font-light tracking-wide leading-relaxed">
                      "{selectedAlbum.photos[currentPhotoIndex].caption}"
                    </p>
                  </div>
                )}

                {/* Thumbnails - Glass Strip */}
                {selectedAlbum.photos.length > 1 && (
                  <div className="relative group max-w-4xl mx-auto flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-white/50 hover:text-white transition-colors"
                      onClick={() => scrollThumbnails('left')}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>

                    <div
                      ref={thumbnailContainerRef}
                      className="overflow-x-auto scroll-smooth scrollbar-hide py-2 px-4 rounded-xl bg-white/5 border border-white/5"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      <div className="flex gap-3 min-w-max">
                        {selectedAlbum.photos.map((photo, idx) => (
                          <button
                            key={photo.id}
                            onClick={() => setCurrentPhotoIndex(idx)}
                            className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden transition-all duration-300 relative ${idx === currentPhotoIndex
                              ? 'ring-2 ring-white scale-105 shadow-lg opacity-100'
                              : 'opacity-40 hover:opacity-80 hover:scale-105 grayscale hover:grayscale-0'
                              }`}
                          >
                            <img
                              src={photo.photo_url}
                              alt={`รูปที่ ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay for inactive */}
                            {idx !== currentPhotoIndex && <div className="absolute inset-0 bg-black/20" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-white/50 hover:text-white transition-colors"
                      onClick={() => scrollThumbnails('right')}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Gallery;
