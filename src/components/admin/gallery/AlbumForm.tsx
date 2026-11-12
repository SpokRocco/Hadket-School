import { useState } from 'react';
import { ArrowLeft, Save, X, ExternalLink, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

            if (album) {
                // Update existing album
                let { error } = await supabase
                    .from('gallery_albums')
                    .update(dataToSave)
                    .eq('id', album.id);

                // If column error occurs on legacy database, retry with minimum required columns
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

                toast({
                    title: 'บันทึกสำเร็จ',
                    description: 'แก้ไขอัลบั้มเรียบร้อยแล้ว',
                });
            } else {
                // Create new album
                let { error } = await supabase.from('gallery_albums').insert({
                    ...dataToSave,
                    views: 0,
                });

                // If column error occurs, retry with minimum legacy columns
                if (error) {
                    console.warn('Insert with full schema failed, retrying with legacy schema:', error.message);
                    const legacyData = {
                        name: formData.title,
                        description: formData.description,
                        category: formData.category || 'ทั่วไป',
                        cover_image_url: formData.cover_photo_url || null,
                        is_published: formData.is_published,
                    };
                    const { error: retryError } = await supabase
                        .from('gallery_albums')
                        .insert(legacyData);

                    if (retryError) throw error;
                }

                toast({
                    title: 'สร้างสำเร็จ',
                    description: 'เพิ่มอัลบั้มใหม่เรียบร้อยแล้ว',
                });
            }

            notifyLocalRealtimeListeners('gallery_albums');
            onSuccess();
        } catch (error: any) {
            toast({
                title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                description: error.message || 'ไม่สามารถบันทึกอัลบั้มลงในฐานข้อมูลได้',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">
                                {album ? 'แก้ไขอัลบั้ม' : 'สร้างอัลบั้มใหม่'}
                            </CardTitle>
                            <CardDescription>กรอกข้อมูลอัลบั้มให้ครบถ้วน</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onCancel}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            ย้อนกลับ
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                ชื่ออัลบั้ม <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="ระบุชื่ออัลบั้ม"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">คำอธิบาย</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="คำอธิบายอัลบั้ม"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category">หมวดหมู่</Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="เช่น กีฬาสี, วันสำคัญ, ศึกษาดูงาน"
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="location">สถานที่</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="สถานที่จัดงาน"
                                />
                            </div>
                        </div>

                        {/* Event Date */}
                        <div className="space-y-2">
                            <Label htmlFor="event_date">วันที่จัดงาน</Label>
                            <Input
                                id="event_date"
                                type="date"
                                value={formData.event_date}
                                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                            />
                        </div>

                        {/* Cover Photo with Direct URL, Device Upload & Presets */}
                        <div className="space-y-3 p-4 rounded-xl bg-card border border-border shadow-2xs">
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
                                    หรือใส่/วางลิงก์ URL รูปภาพหน้าปกโดยตรง (รองรับ HTTPS, Google Drive, Google Photos, Direct Link หรือ Data URL):
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

                        {/* Google Drive Link (For Full Image Collection & Right Click Download) */}
                        <div className="space-y-2 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                            <Label htmlFor="google_drive_url" className="flex items-center gap-2">
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">📁 ลิงก์โฟลเดอร์ Google Drive รวมรูปภาพทั้งหมด (ดาวน์โหลดความละเอียดสูง)</span>
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
                        <div className="space-y-2 p-4 bg-secondary/50 rounded-lg border border-border">
                            <Label htmlFor="google_photos_url" className="flex items-center gap-2">
                                <span className="text-primary font-semibold">🔗 ซิงค์เชื่อมโยงอัลบั้ม Google Photos (ตัวเลือกเสริม)</span>
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

                        {/* 10 Preview Photos Guide */}
                        <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                            <p className="font-semibold flex items-center gap-1.5">
                                📸 ระบบแสดงผลรูปภาพตัวอย่าง 10 รูปในแต่ละอัลบั้ม:
                            </p>
                            <p>
                                นอกจากภาพหน้าปกแล้ว หน้าแกลเลอรีจะแสดงผลภาพตัวอย่างจำนวน 10 รูปแรกของอัลบั้มโดยอัตโนมัติ เพื่อให้ผู้เข้าชมสามารถดูตัวอย่างกิจกรรมได้ทันที โดยสามารถเข้าไปอัปโหลดรูปภาพตัวอย่างและรูปทั้งหมดได้ที่เมนู <strong>"จัดการรูปภาพ"</strong>
                            </p>
                        </div>

                        {/* Publish Switch */}
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                            <div className="space-y-0.5">
                                <Label>เผยแพร่อัลบั้ม</Label>
                                <p className="text-sm text-muted-foreground">
                                    อัลบั้มจะแสดงบนหน้าเว็บทันที
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_published}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4 border-t">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'กำลังบันทึก...' : album ? 'บันทึกการแก้ไข' : 'สร้างอัลบัม'}
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
