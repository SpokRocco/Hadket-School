import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Trash2, X, Loader2, Link as LinkIcon, Plus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    const [showUrlDialog, setShowUrlDialog] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [urlSubmitting, setUrlSubmitting] = useState(false);
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
                .eq('album_id', album.id);

            if (error) throw error;
            const normalized: Photo[] = (data || []).map((p: any) => ({
                id: p.id,
                photo_url: p.photo_url || p.image_url || '',
                thumbnail_url: p.thumbnail_url || p.photo_url || p.image_url || '',
                caption: p.caption || null,
                order_position: p.order_position ?? p.sort_order ?? 0,
            })).sort((a: any, b: any) => a.order_position - b.order_position);

            setPhotos(normalized);
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

    const handleAddPhotoUrls = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        setUrlSubmitting(true);
        try {
            const urls = urlInput
                .split(/[\n,]/)
                .map((u) => u.trim())
                .filter((u) => u.length > 5);

            if (urls.length === 0) {
                toast({
                    title: 'ไม่พบ URL ที่ถูกต้อง',
                    description: 'กรุณาระบุ URL รูปภาพที่ถูกต้อง เช่น https://... หรือ data:image/...',
                    variant: 'destructive',
                });
                return;
            }

            const nextPosition = photos.length;
            const photosToInsert = urls.map((url, idx) => ({
                album_id: album.id,
                photo_url: url,
                image_url: url,
                thumbnail_url: url,
                caption: null,
                order_position: nextPosition + idx,
                sort_order: nextPosition + idx,
            }));

            let { error: insertError } = await supabase
                .from('gallery_photos')
                .insert(photosToInsert);

            if (insertError) {
                console.warn('Standard insert failed, attempting legacy schema insert:', insertError.message);
                const legacyPhotos = urls.map((url, idx) => ({
                    album_id: album.id,
                    image_url: url,
                    caption: null,
                    sort_order: nextPosition + idx,
                }));
                const { error: legErr } = await supabase.from('gallery_photos').insert(legacyPhotos);
                if (legErr) throw insertError;
            }

            notifyLocalRealtimeListeners('gallery_photos');
            notifyLocalRealtimeListeners('gallery_albums');
            toast({
                title: 'เพิ่มรูปภาพสำเร็จ',
                description: `เพิ่มรูปภาพจาก URL จำนวน ${urls.length} รูปเรียบร้อยแล้ว`,
            });
            setUrlInput('');
            setShowUrlDialog(false);
            fetchPhotos();
        } catch (err: any) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description: err.message || 'ไม่สามารถเพิ่มรูปภาพจาก URL ได้',
                variant: 'destructive',
            });
        } finally {
            setUrlSubmitting(false);
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

                try {
                    // No file size limit - optimize image before upload (handles Sony A7 / Lightroom / HEIC)
                    const compressedBlob = await compressImage(file, compressionPresets.gallery);
                    const isWebP = compressedBlob.type === 'image/webp';
                    const isPng = compressedBlob.type === 'image/png';
                    const isSvg = file.type === 'image/svg+xml';
                    const fileExt = isSvg ? 'svg' : isPng ? 'png' : isWebP ? 'webp' : 'jpg';
                    const contentType = isSvg ? 'image/svg+xml' : isPng ? 'image/png' : isWebP ? 'image/webp' : 'image/jpeg';
                    const fileName = `gallery/${album.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                    let photoUrl = '';
                    try {
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('images')
                            .upload(fileName, compressedBlob, {
                                cacheControl: '3600',
                                upsert: false,
                                contentType,
                            });

                        if (uploadError) throw uploadError;

                        // Get public URL
                        const { data: { publicUrl } } = supabase.storage
                            .from('images')
                            .getPublicUrl(uploadData.path);
                        photoUrl = publicUrl;
                    } catch (stErr) {
                        console.warn('Storage upload fallback to data URL for photo:', file.name, stErr);
                        photoUrl = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = () => resolve('');
                            reader.readAsDataURL(compressedBlob);
                        });
                    }

                    if (photoUrl) {
                        uploadedPhotos.push({
                            photo_url: photoUrl,
                            thumbnail_url: photoUrl,
                        });
                    }
                } catch (singlePhotoErr) {
                    console.error('Failed to process photo:', file.name, singlePhotoErr);
                }
            }

            // Insert photos into database with dual keys (photo_url and image_url, order_position and sort_order)
            if (uploadedPhotos.length > 0) {
                const nextPosition = photos.length;
                const photosToInsert = uploadedPhotos.map((photo, index) => ({
                    album_id: album.id,
                    photo_url: photo.photo_url,
                    image_url: photo.photo_url,
                    thumbnail_url: photo.thumbnail_url,
                    order_position: nextPosition + index,
                    sort_order: nextPosition + index,
                }));

                let { error: insertError } = await supabase
                    .from('gallery_photos')
                    .insert(photosToInsert);

                // If column mismatch in old Supabase schema, retry with legacy columns
                if (insertError) {
                    console.warn('Standard photos insert failed, attempting legacy schema insert:', insertError.message);
                    const legacyPhotos = uploadedPhotos.map((photo, index) => ({
                        album_id: album.id,
                        image_url: photo.photo_url,
                        caption: null,
                        sort_order: nextPosition + index,
                    }));
                    const { error: legacyError } = await supabase.from('gallery_photos').insert(legacyPhotos);
                    if (legacyError) throw insertError;
                }

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

                            <Button
                                variant="outline"
                                onClick={() => setShowUrlDialog(true)}
                                disabled={isUploading}
                                className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                            >
                                <LinkIcon className="w-4 h-4" />
                                <span>เพิ่มด้วยลิงก์ URL</span>
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
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl p-8 bg-secondary/20">
                            <Upload className="w-16 h-16 mx-auto text-primary mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-1">ยังไม่มีรูปภาพในอัลบั้มนี้</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                รองรับการอัปโหลดได้หลายรูปพร้อมกัน เลือกทั้งโฟลเดอร์จากเครื่อง หรือใส่ลิงก์รูปภาพ (URL) ได้ทันที ไม่จำกัดขนาดไฟล์
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                                    <Upload className="w-4 h-4" />
                                    เลือกรูปภาพ (หลายรูป)
                                </Button>
                                <Button variant="secondary" onClick={() => folderInputRef.current?.click()} className="gap-2 border border-border">
                                    <span>📁 เลือกทั้งโฟลเดอร์</span>
                                </Button>
                                <Button variant="outline" onClick={() => setShowUrlDialog(true)} className="gap-2 border-primary/30 text-primary">
                                    <LinkIcon className="w-4 h-4" />
                                    เพิ่มด้วยลิงก์ URL
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo, index) => (
                                <div
                                    key={photo.id}
                                    className="group relative bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all border border-border"
                                >
                                    <div className="aspect-square overflow-hidden relative">
                                        <img
                                            src={photo.photo_url}
                                            alt={photo.caption || ''}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        {index < 10 && (
                                            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-semibold shadow-md backdrop-blur-xs flex items-center gap-1">
                                                <span>⭐ ตัวอย่าง #{index + 1}</span>
                                            </span>
                                        )}
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

            {/* Add Photos via URL Dialog */}
            <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleAddPhotoUrls}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-primary" />
                                เพิ่มรูปภาพด้วยลิงก์ URL
                            </DialogTitle>
                            <DialogDescription>
                                ใส่ลิงก์รูปภาพโดยตรง (รองรับ HTTPS, Google Drive, Google Photos, Cloud Storage หรือ Data URL) สามารถใส่หลายลิงก์ได้โดยขึ้นบรรทัดใหม่
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="photo_urls_input">วางลิงก์ URL รูปภาพ:</Label>
                                <Textarea
                                    id="photo_urls_input"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://images.unsplash.com/...&#10;https://drive.google.com/uc?...&#10;https://..."
                                    rows={5}
                                    className="font-mono text-xs"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                เคล็ดลับ: สามารถคัดลอกลิงก์รูปภาพหลายรูปมาวางพร้อมกันได้ โดยแยกด้วยการขึ้นบรรทัดใหม่
                            </p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowUrlDialog(false)}
                                disabled={urlSubmitting}
                            >
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={urlSubmitting || !urlInput.trim()}>
                                {urlSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    'เพิ่มรูปภาพลงอัลบั้ม'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
