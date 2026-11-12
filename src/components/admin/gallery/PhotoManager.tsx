import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { deleteStorageImage } from '@/utils/storageUtils';
import { compressImage, compressionPresets } from '@/utils/imageUtils';
import type { Album } from './GalleryManagement';

interface Photo {
    id: string;
    photo_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    order_position: number;
}

interface PhotoManagerProps {
    album: Album;
    onBack: () => void;
}

export const PhotoManager = ({ album, onBack }: PhotoManagerProps) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchPhotos();
    }, [album.id]);

    const fetchPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from('gallery_photos')
                .select('*')
                .eq('album_id', album.id)
                .order('order_position');

            if (error) throw error;
            setPhotos(data || []);
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

    const folderInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

    const isImageFile = (file: File) => {
        if (file.type.startsWith('image/')) return true;
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp', 'avif', 'tiff'].includes(ext || '');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFiles = Array.from(e.target.files || []);
        if (rawFiles.length === 0) return;

        // Filter valid images including iPhone/iPad formats
        const files = rawFiles.filter(isImageFile);
        if (files.length === 0) {
            toast({
                title: 'ไม่พบไฟล์รูปภาพ',
                description: 'กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (รองรับ JPG, PNG, WebP, HEIC, ฯลฯ)',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress({ current: 0, total: files.length });
        const uploadedPhotos: any[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress({ current: i + 1, total: files.length });

                // No file size limit - optimize image before upload
                const compressedBlob = await compressImage(file, compressionPresets.gallery);
                const isSvg = file.type === 'image/svg+xml';
                const contentType = isSvg ? 'image/svg+xml' : 'image/webp';
                const fileExt = isSvg ? 'svg' : 'webp';
                const fileName = `gallery/${album.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(fileName, compressedBlob, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType,
                    });

                if (uploadError) {
                    console.error('Error uploading image:', file.name, uploadError);
                    continue;
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(uploadData.path);

                uploadedPhotos.push({
                    photo_url: publicUrl,
                    thumbnail_url: publicUrl,
                });
            }

            // Insert photos into database
            if (uploadedPhotos.length > 0) {
                const nextPosition = photos.length;
                const photosToInsert = uploadedPhotos.map((photo, index) => ({
                    album_id: album.id,
                    photo_url: photo.photo_url,
                    thumbnail_url: photo.thumbnail_url,
                    order_position: nextPosition + index,
                }));

                const { error: insertError } = await supabase
                    .from('gallery_photos')
                    .insert(photosToInsert);

                if (insertError) throw insertError;

                notifyLocalRealtimeListeners('gallery_photos');
                notifyLocalRealtimeListeners('gallery_albums');
                toast({
                    title: 'อัปโหลดสำเร็จ',
                    description: `อัปโหลดรูปภาพ ${uploadedPhotos.length} รูปเรียบร้อยแล้ว`,
                });

                fetchPhotos();
            }
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            setUploadProgress({ current: 0, total: 0 });
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (folderInputRef.current) folderInputRef.current.value = '';
        }
    };

    const handleDelete = async (photo: Photo) => {
        try {
            // Delete from database
            const { error: dbError } = await supabase
                .from('gallery_photos')
                .delete()
                .eq('id', photo.id);

            if (dbError) throw dbError;

            // Delete from storage
            await deleteStorageImage(photo.photo_url);

            notifyLocalRealtimeListeners('gallery_photos');
            notifyLocalRealtimeListeners('gallery_albums');
            toast({
                title: 'ลบสำเร็จ',
                description: 'ลบรูปภาพเรียบร้อยแล้ว',
            });

            fetchPhotos();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleUpdateCaption = async (photoId: string, caption: string) => {
        try {
            const { error } = await supabase
                .from('gallery_photos')
                .update({ caption })
                .eq('id', photoId);

            if (error) throw error;

            setPhotos(photos.map(p => p.id === photoId ? { ...p, caption } : p));
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">จัดการรูปภาพ</CardTitle>
                            <CardDescription>อัลบั้ม: {album.title}</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Single / Multiple Files Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.svg,.gif"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {/* Whole Folder Input */}
                            <input
                                ref={folderInputRef}
                                type="file"
                                multiple
                                {...({ webkitdirectory: '', directory: '' } as any)}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="gap-1.5"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        กำลังอัปโหลด ({uploadProgress.current}/{uploadProgress.total})...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        อัปโหลดรูป (1 หรือหลายรูป)
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => folderInputRef.current?.click()}
                                disabled={isUploading}
                                className="gap-1.5 border border-border"
                            >
                                <span>📁 อัปโหลดทั้งโฟลเดอร์</span>
                            </Button>

                            <Button variant="outline" onClick={onBack}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                ย้อนกลับ
                            </Button>
                        </div>
                    </div>
                    {album.google_photos_url && (
                        <div className="mt-3 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                            <span className="flex items-center gap-1.5">
                                <span>📷</span>
                                <span>อัลบั้มนี้ซิงค์เชื่อมต่อกับ Google Photos: <strong>{album.google_photos_url}</strong></span>
                            </span>
                            <a
                                href={album.google_photos_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-semibold hover:text-blue-900"
                            >
                                เปิดดูใน Google Photos ↗
                            </a>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">กำลังโหลด...</p>
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="text-center py-12">
                            <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">ยังไม่มีรูปภาพในอัลบั้มนี้</p>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                อัปโหลดรูปแรก
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group relative bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
                                >
                                    <div className="aspect-square overflow-hidden">
                                        <img
                                            src={photo.photo_url}
                                            alt={photo.caption || ''}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>

                                    <div className="p-2">
                                        <Input
                                            value={photo.caption || ''}
                                            onChange={(e) => setPhotos(photos.map(p =>
                                                p.id === photo.id ? { ...p, caption: e.target.value } : p
                                            ))}
                                            onBlur={(e) => handleUpdateCaption(photo.id, e.target.value)}
                                            placeholder="คำบรรยาย..."
                                            className="text-sm"
                                        />
                                    </div>

                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setDeleteId(photo.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {photos.length > 0 && (
                        <div className="mt-6 text-sm text-muted-foreground text-center">
                            รูปภาพทั้งหมด: {photos.length} รูป
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={() => {
                    const photo = photos.find(p => p.id === deleteId);
                    if (photo) {
                        handleDelete(photo);
                    }
                    setDeleteId(null);
                }}
                title="ยืนยันการลบรูปภาพ"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />
        </div>
    );
};
