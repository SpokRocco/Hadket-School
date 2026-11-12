import { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlbumForm } from './AlbumForm';
import { AlbumList } from './AlbumList';
import { PhotoManager } from './PhotoManager';

export interface Album {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    cover_photo_url: string | null;
    event_date: string | null;
    location: string | null;
    views: number;
    is_published: boolean;
    created_at: string;
    photo_count?: number;
    google_photos_url?: string | null;
}

export const GalleryManagement = () => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        fetchAlbums();
    }, []);

    useEffect(() => {
        filterAlbums();
    }, [albums, searchTerm]);

    const fetchAlbums = async () => {
        try {
            const { data: albumsData, error: albumsError } = await supabase
                .from('gallery_albums')
                .select('*')
                .order('created_at', { ascending: false });

            if (albumsError) throw albumsError;

            // Fetch photo counts for each album
            const albumsWithCounts = await Promise.all(
                (albumsData || []).map(async (album) => {
                    const { count } = await supabase
                        .from('gallery_photos')
                        .select('*', { count: 'exact', head: true })
                        .eq('album_id', album.id);

                    return {
                        ...album,
                        photo_count: count || 0,
                    };
                })
            );

            setAlbums(albumsWithCounts);
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filterAlbums = () => {
        let filtered = albums;

        if (searchTerm) {
            filtered = filtered.filter(
                (album) =>
                    album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    album.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredAlbums(filtered);
    };

    const handleDelete = async (id: string) => {
        try {
            // Delete all photos in the album first
            await supabase.from('gallery_photos').delete().eq('album_id', id);

            // Then delete the album
            const { error } = await supabase.from('gallery_albums').delete().eq('id', id);

            if (error) throw error;

            notifyLocalRealtimeListeners('gallery_albums');
            toast({
                title: 'ลบสำเร็จ',
                description: 'ลบอัลบั้มเรียบร้อยแล้ว',
            });

            fetchAlbums();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleTogglePublish = async (album: Album) => {
        try {
            const { error } = await supabase
                .from('gallery_albums')
                .update({ is_published: !album.is_published })
                .eq('id', album.id);

            if (error) throw error;

            notifyLocalRealtimeListeners('gallery_albums');
            toast({
                title: 'อัปเดตสำเร็จ',
                description: !album.is_published ? 'เผยแพร่อัลบั้มแล้ว' : 'ซ่อนอัลบั้มแล้ว',
            });

            fetchAlbums();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingAlbum(null);
        fetchAlbums();
    };

    const handleManagePhotos = (album: Album) => {
        setSelectedAlbum(album);
    };

    const handleBackFromPhotos = () => {
        setSelectedAlbum(null);
        fetchAlbums();
    };

    if (selectedAlbum) {
        return <PhotoManager album={selectedAlbum} onBack={handleBackFromPhotos} />;
    }

    if (showForm) {
        return (
            <AlbumForm
                album={editingAlbum}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                    setShowForm(false);
                    setEditingAlbum(null);
                }}
            />
        );
    }

    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">จัดการแกลเลอรี่</CardTitle>
                            <CardDescription>เพิ่ม แก้ไข และจัดการอัลบั้มรูปภาพของโรงเรียน</CardDescription>
                        </div>
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            สร้างอัลบั้มใหม่
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาอัลบั้ม..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Album List */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">กำลังโหลด...</p>
                        </div>
                    ) : filteredAlbums.length === 0 ? (
                        <div className="text-center py-12">
                            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">ไม่พบอัลบั้ม</p>
                        </div>
                    ) : (
                        <AlbumList
                            albums={filteredAlbums}
                            onEdit={(album) => {
                                setEditingAlbum(album);
                                setShowForm(true);
                            }}
                            onDelete={handleDelete}
                            onTogglePublish={handleTogglePublish}
                            onManagePhotos={handleManagePhotos}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
