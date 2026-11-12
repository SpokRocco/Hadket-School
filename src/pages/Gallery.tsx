import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Calendar, MapPin, FolderDown, ExternalLink } from 'lucide-react';
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
  google_drive_url?: string | null;
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
  const [rightClickTarget, setRightClickTarget] = useState<{
    isOpen: boolean;
    album: Album | null;
    photoUrl?: string;
  }>({ isOpen: false, album: null });

  const handlePhotoContextMenu = (e: React.MouseEvent, album: Album, photoUrl?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRightClickTarget({
      isOpen: true,
      album,
      photoUrl: photoUrl || album.cover_photo_url || undefined,
    });
  };

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
            google_drive_url: album.google_drive_url || null,
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
            {filteredAlbums.map((album) => {
              const previewPhotos = (album.photos || []).slice(0, 10);
              return (
                <div
                  key={album.id}
                  className="bg-card rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-border overflow-hidden cursor-pointer flex flex-col group"
                  onClick={() => handleAlbumClick(album)}
                >
                  {/* Cover Photo with Right Click Interceptor */}
                  <div
                    className="relative w-full h-52 overflow-hidden bg-slate-900"
                    onContextMenu={(e) => handlePhotoContextMenu(e, album, album.cover_photo_url || undefined)}
                    title="คลิกเพื่อเปิดดูภาพเต็ม · คลิกขวาเพื่อดาวน์โหลดผ่าน Google Drive"
                  >
                    {album.cover_photo_url ? (
                      <img
                        src={album.cover_photo_url}
                        alt={album.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5">
                      <div className="flex justify-between items-start gap-2">
                        {album.category && (
                          <Badge className={`${categoryColors[album.category] || 'bg-primary'} text-white shadow-md text-xs`}>
                            {album.category}
                          </Badge>
                        )}
                        {album.photos.length > 0 && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs border border-white/10">
                            📸 {album.photos.length} รูป
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 drop-shadow-md">
                          {album.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Album Body & 10 Sample Preview Photos */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{album.date}</span>
                        </div>
                        {album.location && (
                          <div className="flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{album.location}</span>
                          </div>
                        )}
                      </div>

                      {album.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {album.description}
                        </p>
                      )}
                    </div>

                    {/* 10 Sample Preview Thumbnails */}
                    {previewPhotos.length > 0 && (
                      <div className="pt-2 border-t border-border/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-primary" />
                            รูปภาพตัวอย่าง ({previewPhotos.length} รูป)
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            คลิกขวาเพื่อดู Drive
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {previewPhotos.map((photo, pIdx) => (
                            <div
                              key={photo.id || pIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlbum(album);
                                setCurrentPhotoIndex(pIdx);
                              }}
                              onContextMenu={(e) => handlePhotoContextMenu(e, album, photo.photo_url)}
                              title={photo.caption || `รูปตัวอย่างที่ ${pIdx + 1} (คลิกขวาเพื่อดูลิงก์ Google Drive)`}
                              className="relative aspect-square rounded-md overflow-hidden bg-slate-900 border border-border/70 hover:border-primary hover:scale-105 transition-all cursor-pointer group/thumb shadow-xs"
                            >
                              <img
                                src={photo.photo_url}
                                alt={photo.caption || `รูปที่ ${pIdx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Direct Links (Google Drive & Google Photos) */}
                    <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                      {album.google_drive_url && (
                        <a
                          href={album.google_drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <FolderDown className="w-3.5 h-3.5" />
                            Google Drive รวมภาพทั้งหมด
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {album.google_photos_url && (
                        <a
                          href={album.google_photos_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-500/20 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            อัลบั้ม Google Photos
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 flex flex-col bg-black/50 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden [&>button]:hidden focus:outline-none">
          {selectedAlbum && selectedAlbum.photos.length > 0 && (
            <div className="flex flex-col h-full relative">
              {/* Header - Floating Glass Strip */}
              <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between pointer-events-none">
                <div className="flex-1 min-w-0 pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-2 rounded-full inline-block mr-auto border border-white/10 shadow-lg animate-in slide-in-from-top-4 duration-500">
                  <h3 className="font-bold text-lg truncate text-white">{selectedAlbum.title}</h3>
                  <p className="text-xs text-white/70 uppercase tracking-wider">
                    PHOTO {currentPhotoIndex + 1} OF {selectedAlbum.photos.length} · คลิกขวาเพื่อเปิด Google Drive
                  </p>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                  {selectedAlbum.google_drive_url && (
                    <a
                      href={selectedAlbum.google_drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-105"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Google Drive รวมภาพทั้งหมด</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
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
                  onContextMenu={(e) => handlePhotoContextMenu(e, selectedAlbum, selectedAlbum.photos[currentPhotoIndex].photo_url)}
                  className="max-w-full max-h-full object-contain p-4 sm:p-12 transition-all duration-500 animate-in zoom-in-95 cursor-pointer"
                  title="คลิกขวาเพื่อดาวน์โหลดผ่าน Google Drive"
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
                {/* Caption */}
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
                            onContextMenu={(e) => handlePhotoContextMenu(e, selectedAlbum, photo.photo_url)}
                            className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden transition-all duration-300 relative ${
                              idx === currentPhotoIndex
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

      {/* Right-Click Interception Modal for Google Drive */}
      <Dialog
        open={rightClickTarget.isOpen}
        onOpenChange={(open) => !open && setRightClickTarget({ isOpen: false, album: null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <FolderDown className="w-5 h-5" />
              ดาวน์โหลดรูปภาพทั้งหมดผ่าน Google Drive
            </DialogTitle>
            <DialogDescription>
              โรงเรียนบ้านหาดเค็ดจัดเก็บรูปภาพกิจกรรมต้นฉบับความละเอียดสูงไว้บน Google Drive
            </DialogDescription>
          </DialogHeader>

          {rightClickTarget.album && (
            <div className="space-y-3 my-2">
              <div className="p-3 rounded-xl border bg-secondary/30 flex items-center gap-3">
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-900 border shrink-0">
                  <img
                    src={rightClickTarget.photoUrl || rightClickTarget.album.cover_photo_url || ''}
                    alt={rightClickTarget.album.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm line-clamp-2">{rightClickTarget.album.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rightClickTarget.album.date}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                เพื่อความสะดวกในการดาวน์โหลดรูปภาพกิจกรรมคุณภาพสูงของนักเรียน ผู้ปกครอง และคณะครู ท่านสามารถเข้าถึงโฟลเดอร์ Google Drive รวมรูปภาพทั้งหมดของอัลบั้มนี้ได้โดยตรง
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-2">
            {rightClickTarget.album?.google_drive_url ? (
              <Button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                onClick={() => {
                  window.open(rightClickTarget.album?.google_drive_url || '', '_blank');
                  setRightClickTarget({ isOpen: false, album: null });
                }}
              >
                <FolderDown className="w-4 h-4" />
                เปิดโฟลเดอร์ Google Drive รวมรูปภาพทั้งหมด ↗
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                onClick={() => {
                  window.open('https://drive.google.com', '_blank');
                  setRightClickTarget({ isOpen: false, album: null });
                }}
              >
                <FolderDown className="w-4 h-4" />
                ไปยังคลัง Google Drive ของโรงเรียน ↗
              </Button>
            )}

            {rightClickTarget.album?.google_photos_url && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                onClick={() => {
                  window.open(rightClickTarget.album?.google_photos_url || '', '_blank');
                  setRightClickTarget({ isOpen: false, album: null });
                }}
              >
                <ImageIcon className="w-4 h-4" />
                หรือเปิดดูอัลบั้มใน Google Photos ↗
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => setRightClickTarget({ isOpen: false, album: null })}
              className="w-full text-xs text-muted-foreground"
            >
              ปิดหน้าต่าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Gallery;
