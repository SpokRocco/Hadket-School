import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, X, ExternalLink, Image as ImageIcon, Link as LinkIcon, Plus, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, compressionPresets } from '@/utils/imageUtils';
import { ImageUpload } from '../shared/ImageUpload';
import type { Album } from './GalleryManagement';
import heroImage from '@/assets/hero-school.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';

interface AlbumFormProps {
    album?: Album | null;
    onSuccess: () => void;
    onCancel: () => void;
}

interface SamplePhotoItem {
    id?: string;
    file?: File;
    previewUrl: string;
    isExisting?: boolean;
}

export const AlbumForm = ({ album, onSuccess, onCancel }: AlbumFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: album?.title || (album as any)?.name || '',
        description: album?.description || '',
        category: album?.category || 'ทั่วไป',
        cover_photo_url: album?.cover_photo_url || (album as any)?.cover_image_url || '',
        event_date: album?.event_date || '',
        location: album?.location || '',
        is_published: album?.is_published ?? true,
        google_drive_url: album?.google_drive_url || '',
        google_photos_url: album?.google_photos_url || '',
    });

    const [samplePhotos, setSamplePhotos] = useState<SamplePhotoItem[]>([]);
    const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch existing sample photos for this album if editing
    useEffect(() => {
        if (album?.id) {
            const fetchExistingPhotos = async () => {
                try {
                    const { data, error } = await supabase
                        .from('gallery_photos')
                        .select('*')
                        .eq('album_id', album.id)
                        .order('order_position')
                        .limit(10);

                    if (!error && Array.isArray(data)) {
                        setSamplePhotos(
                            data.map((p: any) => ({
                                id: p.id,
                                previewUrl: p.photo_url || p.image_url,
                                isExisting: true,
                            }))
                        );
                    }
                } catch (err) {
                    console.warn('Could not fetch existing album photos:', err);
                }
            };
            fetchExistingPhotos();
        }
    }, [album?.id]);

    const handleSampleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFiles = Array.from(e.target.files || []);
        if (rawFiles.length === 0) return;

        const validImages = rawFiles.filter(
            (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|gif|bmp|avif)$/i.test(f.name)
        );

        if (validImages.length === 0) {
            toast({
                title: 'ไม่พบไฟล์รูปภาพ',
                description: 'กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPEG, PNG, WebP, HEIC, ฯลฯ)',
                variant: 'destructive',
            });
            return;
        }

        const remainingSlots = 10 - samplePhotos.length;
        if (remainingSlots <= 0) {
            toast({
                title: 'ครบโควตา 10 รูปแล้ว',
                description: 'สามารถอัปโหลดรูปภาพตัวอย่างได้สูงสุด 10 รูปต่ออัลบั้ม',
                variant: 'destructive',
            });
            return;
        }

        const toAdd = validImages.slice(0, remainingSlots);
        if (validImages.length > remainingSlots) {
            toast({
                title: 'เลือกได้สูงสุด 10 รูป',
                description: `นำเข้ารูปภาพ ${toAdd.length} รูปรวมเป็น 10 รูปตามโควตาตัวอย่าง`,
            });
        }

        const newItems: SamplePhotoItem[] = toAdd.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            isExisting: false,
        }));

        setSamplePhotos((prev) => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveSamplePhoto = (index: number) => {
        const target = samplePhotos[index];
        if (target?.isExisting && target.id) {
            setDeletedPhotoIds((prev) => [...prev, target.id!]);
        }
        setSamplePhotos((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Dual-key payload ensures compatibility whether database schema uses (title, cover_photo_url) or (name, cover_image_url)
            const dataToSave: any = {
                title: formData.title,
                name: formData.title,
                description: formData.description,
                category: formData.category || 'ทั่วไป',
                cover_photo_url: formData.cover_photo_url || null,
                cover_image_url: formData.cover_photo_url || null,
                event_date: formData.event_date || null,
                location: formData.location || null,
                is_published: formData.is_published,
                google_drive_url: formData.google_drive_url || null,
                google_photos_url: formData.google_photos_url || null,
                updated_at: new Date().toISOString(),
            };

            let targetAlbumId = album?.id;

            if (album) {
                // Update existing album
                let { error } = await supabase
                    .from('gallery_albums')
                    .update(dataToSave)
                    .eq('id', album.id);

                if (error) {
                    console.warn('Update with full schema failed, retrying with legacy schema:', error.message);
                    const legacyData = {
                        name: formData.title,
                        description: formData.description,
                        category: formData.category || 'ทั่วไป',
                        cover_image_url: formData.cover_photo_url || null,
                        is_published: formData.is_published,
                        updated_at: new Date().toISOString(),
                    };
                    const { error: retryError } = await supabase
                        .from('gallery_albums')
                        .update(legacyData)
                        .eq('id', album.id);

                    if (retryError) throw error;
                }
            } else {
                // Create new album
                let { data: newAlbumData, error } = await supabase
                    .from('gallery_albums')
                    .insert({
                        ...dataToSave,
                        views: 0,
                    })
                    .select('id')
                    .single();

                if (!error && newAlbumData?.id) {
                    targetAlbumId = newAlbumData.id;
                } else if (error) {
                    console.warn('Insert with full schema failed, retrying with legacy schema:', error.message);
                    const legacyData = {
                        name: formData.title,
                        description: formData.description,
                        category: formData.category || 'ทั่วไป',
                        cover_image_url: formData.cover_photo_url || null,
                        is_published: formData.is_published,
                    };
                    const { data: legacyNewData, error: retryError } = await supabase
                        .from('gallery_albums')
                        .insert(legacyData)
                        .select('id')
                        .single();

                    if (retryError) throw error;
                    targetAlbumId = legacyNewData?.id;
                }

                // If still no ID returned, fetch latest inserted album
                if (!targetAlbumId) {
                    const { data: latest } = await supabase
                        .from('gallery_albums')
                        .select('id')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    targetAlbumId = latest?.id;
                }
            }

            // Remove deleted photos from database if any
            if (deletedPhotoIds.length > 0) {
                await supabase
                    .from('gallery_photos')
                    .delete()
                    .in('id', deletedPhotoIds);
            }

            // Upload and insert newly added sample photos (up to 10 photos, optional)
            const newPhotosToUpload = samplePhotos.filter((p) => !p.isExisting && p.file);
            if (targetAlbumId && newPhotosToUpload.length > 0) {
                setUploadProgress({ current: 0, total: newPhotosToUpload.length });
                const uploadedBatch: any[] = [];

                for (let i = 0; i < newPhotosToUpload.length; i++) {
                    const item = newPhotosToUpload[i];
                    setUploadProgress({ current: i + 1, total: newPhotosToUpload.length });

                    try {
                        const compressedBlob = await compressImage(item.file!, compressionPresets.gallery);
                        const isWebP = compressedBlob.type === 'image/webp';
                        const fileExt = isWebP ? 'webp' : 'jpg';
                        const contentType = isWebP ? 'image/webp' : 'image/jpeg';
                        const fileName = `gallery/${targetAlbumId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

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

                            const { data: { publicUrl } } = supabase.storage
                                .from('images')
                                .getPublicUrl(uploadData.path);
                            photoUrl = publicUrl;
                        } catch (stErr) {
                            console.warn('Storage fallback to data URL for sample photo:', stErr);
                            photoUrl = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.onerror = () => resolve('');
                                reader.readAsDataURL(compressedBlob);
                            });
                        }

                        if (photoUrl) {
                            uploadedBatch.push({
                                album_id: targetAlbumId,
                                photo_url: photoUrl,
                                image_url: photoUrl,
                                thumbnail_url: photoUrl,
                                caption: null,
                                order_position: i + 1,
                                sort_order: i + 1,
                            });
                        }
                    } catch (singleErr) {
                        console.error('Failed to compress/upload sample photo:', item.file?.name, singleErr);
                    }
                }

                if (uploadedBatch.length > 0) {
                    let { error: insertPhotosErr } = await supabase
                        .from('gallery_photos')
                        .insert(uploadedBatch);

                    if (insertPhotosErr) {
                        console.warn('Standard photos insert fallback to legacy:', insertPhotosErr.message);
                        const legacyPhotos = uploadedBatch.map((p, idx) => ({
                            album_id: targetAlbumId,
                            image_url: p.photo_url,
                            caption: null,
                            sort_order: idx + 1,
                        }));
                        await supabase.from('gallery_photos').insert(legacyPhotos);
                    }
                }
            }

            notifyLocalRealtimeListeners('gallery_photos');
            notifyLocalRealtimeListeners('gallery_albums');

            toast({
                title: album ? 'บันทึกสำเร็จ' : 'สร้างสำเร็จ',
                description: album
                    ? 'แก้ไขข้อมูลอัลบั้มและรูปภาพตัวอย่างเรียบร้อยแล้ว'
                    : 'เพิ่มอัลบั้มใหม่และรูปภาพตัวอย่างเรียบร้อยแล้ว',
            });

            onSuccess();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                description: error.message || 'ไม่สามารถบันทึกอัลบั้มลงในฐานข้อมูลได้',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
            setUploadProgress(null);
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                {album ? 'แก้ไขอัลบั้มกิจกรรม' : 'สร้างอัลบั้มกิจกรรมใหม่'}
                            </CardTitle>
                            <CardDescription>
                                จัดการข้อมูลอัลบั้ม รูปภาพหน้าปก และรูปภาพตัวอย่าง 10 รูปสำหรับแสดงผลในคลังภาพ
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={onCancel} size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            ย้อนกลับ
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-semibold">
                                ชื่ออัลบั้ม <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="เช่น กิจกรรมวันไหว้ครู ประจำปีการศึกษา 2569"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold">คำอธิบายอัลบั้ม</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="บรรยายรายละเอียดหรือความประทับใจของกิจกรรม..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-semibold">หมวดหมู่</Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="เช่น กีฬาสี, วันสำคัญ, ศึกษาดูงาน, กิจกรรมวิชาการ"
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-sm font-semibold">สถานที่จัดงาน</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="เช่น อาคารหอประชุมใหญ่ หรือ สนามกีฬาโรงเรียน"
                                />
                            </div>
                        </div>

                        {/* Event Date */}
                        <div className="space-y-2">
                            <Label htmlFor="event_date" className="text-sm font-semibold">วันที่จัดกิจกรรม</Label>
                            <Input
                                id="event_date"
                                type="date"
                                value={formData.event_date}
                                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                            />
                        </div>

                        {/* Cover Photo with Direct URL, Device Upload & Presets */}
                        <div className="space-y-3 p-5 rounded-2xl bg-card border border-border shadow-2xs">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                    รูปภาพหน้าปกอัลบั้ม (Cover Photo)
                                </Label>
                                {formData.cover_photo_url && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, cover_photo_url: '' })}
                                        className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
                                    >
                                        ลบรูปปก
                                    </Button>
                                )}
                            </div>

                            {/* Image Upload from Device */}
                            <ImageUpload
                                currentImage={formData.cover_photo_url}
                                onUploadComplete={(url) => setFormData({ ...formData, cover_photo_url: url })}
                                bucket="images"
                                folder="gallery/covers"
                                compressionPreset="cover"
                            />

                            {/* Direct URL Input */}
                            <div className="space-y-1.5 pt-2 border-t border-border/60">
                                <Label htmlFor="cover_photo_url_input" className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    หรือใส่/วางลิงก์ URL รูปภาพหน้าปกโดยตรง:
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="cover_photo_url_input"
                                        type="url"
                                        value={formData.cover_photo_url}
                                        onChange={(e) => setFormData({ ...formData, cover_photo_url: e.target.value })}
                                        placeholder="https://... หรือ data:image/..."
                                        className="text-xs flex-1"
                                    />
                                    {formData.cover_photo_url && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs shrink-0"
                                            onClick={() => window.open(formData.cover_photo_url, '_blank')}
                                        >
                                            ดูรูปภาพ <ExternalLink className="w-3 h-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Preset Buttons */}
                            <div className="space-y-1 pt-1">
                                <p className="text-[11px] text-muted-foreground">เลือกใช้ภาพหน้าปกเริ่มต้นของโรงเรียน:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[11px] h-6 px-2"
                                        onClick={() => setFormData({ ...formData, cover_photo_url: heroImage })}
                                    >
                                        ภาพโรงเรียน
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[11px] h-6 px-2"
                                        onClick={() => setFormData({ ...formData, cover_photo_url: studentGraduationActivity })}
                                    >
                                        ภาพกิจกรรมนักเรียน
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[11px] h-6 px-2"
                                        onClick={() => setFormData({ ...formData, cover_photo_url: studentScienceLab })}
                                    >
                                        ภาพห้องแล็บ
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 10 Sample Preview Photos - Multi-file Manual Uploader (Optional) */}
                        <div className="space-y-4 p-5 rounded-2xl bg-card border border-border shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                        <ImageIcon className="w-4 h-4 text-primary" />
                                        รูปภาพตัวอย่าง 10 รูป (Sample / Preview Photos)
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (ไม่บังคับให้เพิ่ม หรือไม่เพิ่มก็ได้)
                                        </span>
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        เลือกอัปโหลดรูปภาพตัวอย่างของกิจกรรมได้สูงสุด 10 รูป รองรับการเลือกทีละหลายไฟล์พร้อมกันจากเครื่อง ไม่จำกัดขนาดไฟล์
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="text-xs font-mono">
                                        {samplePhotos.length}/10 รูป
                                    </Badge>
                                    {samplePhotos.length < 10 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs gap-1.5 bg-primary text-white hover:bg-primary/90"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            เลือกรูปตัวอย่าง (หลายไฟล์)
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleSampleFilesSelected}
                            />

                            {/* Thumbnails Grid */}
                            {samplePhotos.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                                    {samplePhotos.map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            className="relative aspect-square rounded-xl overflow-hidden border border-border bg-slate-900 group shadow-xs"
                                        >
                                            <img
                                                src={item.previewUrl}
                                                alt={`รูปตัวอย่างที่ ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] text-white font-mono">
                                                #{idx + 1}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSamplePhoto(idx)}
                                                className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm transition-all opacity-80 group-hover:opacity-100"
                                                title="ลบรูปนี้"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-8 border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
                                >
                                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-foreground">
                                        คลิกเพื่อเลือกไฟล์รูปภาพตัวอย่าง (รองรับการเลือกทีละหลายไฟล์ สูงสุด 10 รูป)
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        ไม่บังคับ สามารถบันทึกอัลบั้มโดยไม่เพิ่มรูปตัวอย่าง หรือเข้ามาเพิ่มภายหลังได้ตลอดเวลา
                                    </p>
                                </div>
                            )}

                            {uploadProgress && (
                                <div className="p-3 rounded-lg bg-primary/10 text-primary text-xs flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                                    <span>
                                        กำลังประมวลผลและอัปโหลดรูปภาพตัวอย่าง ({uploadProgress.current}/{uploadProgress.total} รูป)...
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Google Drive Link (For Full Image Collection & Right Click Download) */}
                        <div className="space-y-2 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                            <Label htmlFor="google_drive_url" className="flex items-center gap-2">
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                                    📁 ลิงก์โฟลเดอร์ Google Drive รวมรูปภาพทั้งหมด (ดาวน์โหลดความละเอียดสูง)
                                </span>
                            </Label>
                            <Input
                                id="google_drive_url"
                                type="url"
                                value={formData.google_drive_url}
                                onChange={(e) => setFormData({ ...formData, google_drive_url: e.target.value })}
                                placeholder="https://drive.google.com/drive/folders/..."
                            />
                            <p className="text-xs text-muted-foreground">
                                เมื่อผู้เข้าชมคลิกขวาที่รูปภาพเพื่อต้องการบันทึก ระบบจะแสดงลิงก์เชื่อมต่อไปยัง Google Drive นี้โดยอัตโนมัติ เพื่อให้ดาวน์โหลดภาพกิจกรรมทั้งหมดแบบความละเอียดสูงได้สะดวก
                            </p>
                        </div>

                        {/* Google Photos Sync Link */}
                        <div className="space-y-2 p-5 bg-secondary/50 rounded-2xl border border-border">
                            <Label htmlFor="google_photos_url" className="flex items-center gap-2">
                                <span className="text-primary font-semibold text-sm">
                                    🔗 ซิงค์เชื่อมโยงอัลบั้ม Google Photos (ตัวเลือกเสริม)
                                </span>
                            </Label>
                            <Input
                                id="google_photos_url"
                                type="url"
                                value={formData.google_photos_url}
                                onChange={(e) => setFormData({ ...formData, google_photos_url: e.target.value })}
                                placeholder="https://photos.app.goo.gl/... หรือ https://photos.google.com/share/..."
                            />
                            <p className="text-xs text-muted-foreground">
                                สามารถวางลิงก์อัลบั้ม Google Photos ที่แชร์สาธารณะ เพื่อให้ผู้เข้าชมสามารถกดเปิดชมอัลบั้มภาพเต็มผ่าน Google Photos ได้ทันที
                            </p>
                        </div>

                        {/* Publish Switch */}
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">เผยแพร่อัลบั้ม</Label>
                                <p className="text-xs text-muted-foreground">
                                    อัลบั้มจะแสดงบนหน้าเว็บทันที
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_published}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4 border-t border-border">
                            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white">
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'กำลังบันทึก...' : album ? 'บันทึกการแก้ไข' : 'สร้างอัลบั้ม'}
                            </Button>
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                                <X className="w-4 h-4 mr-2" />
                                ยกเลิก
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
