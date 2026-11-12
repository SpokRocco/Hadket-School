import { useState, useEffect, useRef, useCallback } from 'react';
import {
    supabase,
    notifyLocalRealtimeListeners,
    subscribeToRealtimeTables,
} from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Edit,
    Trash2,
    Crown,
    Upload,
    X,
    ArrowUp,
    ArrowDown,
    Award,
    Database,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteStorageImage } from '@/utils/storageUtils';
import { compressImage, compressionPresets } from '@/utils/imageUtils';

export interface StudentCouncilMember {
    id: string;
    name: string;
    position: string;
    class: string | null;
    initial: string | null;
    image_url: string | null;
    order_position: number;
    is_active: boolean;
    created_at?: string;
}

export const StudentCouncilManagement = () => {
    const [members, setMembers] = useState<StudentCouncilMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StudentCouncilMember | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        class: '',
        initial: '',
        image_url: '',
        is_active: true,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            let loadedMembers: StudentCouncilMember[] = [];

            // 1. Fetch from Supabase student_council table
            const { data, error } = await supabase
                .from('student_council')
                .select('*')
                .order('order_position', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                // Filter out legacy mock high-school council rows
                loadedMembers = data.filter((m) => {
                    const isLegacyMock = (m.class && (m.class.includes('ม.6') || m.class.includes('ม.5'))) || m.name === 'นายประสิทธิ์ เก่งมาก';
                    return !isLegacyMock;
                }) as StudentCouncilMember[];
            }

            // 2. Dual cloud fallback: Check school_settings.student_council_json
            if (loadedMembers.length === 0) {
                try {
                    const { data: settingsData } = await supabase
                        .from('school_settings')
                        .select('value')
                        .eq('key', 'student_council_json')
                        .maybeSingle();

                    if (settingsData?.value) {
                        const parsed = JSON.parse(settingsData.value);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            loadedMembers = parsed;
                        }
                    }
                } catch {
                    // ignore
                }
            }

            setMembers(loadedMembers);
        } catch (error: any) {
            console.error('Error fetching student_council:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
                description: error?.message || 'ไม่สามารถโหลดข้อมูลสภานักเรียนได้',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
        return subscribeToRealtimeTables(
            'realtime_student_council_admin',
            ['student_council', 'school_settings'],
            fetchData
        );
    }, [fetchData]);

    const persistMembers = async (newMembers: StudentCouncilMember[]) => {
        try {
            setSaving(true);
            setMembers(newMembers);

            // 1. Update student_council table in Supabase
            try {
                const recordsToUpsert = newMembers.map((m, idx) => ({
                    id: m.id || crypto.randomUUID(),
                    name: m.name,
                    position: m.position,
                    class: m.class || null,
                    initial: m.initial || m.name.charAt(0) || null,
                    image_url: m.image_url || null,
                    order_position: idx + 1,
                    is_active: m.is_active !== false,
                }));

                const { error: upsertErr } = await (supabase as any)
                    .from('student_council')
                    .upsert(recordsToUpsert, { onConflict: 'id' });

                if (upsertErr) {
                    console.warn('student_council table upsert note:', upsertErr.message);
                }
            } catch (tableErr) {
                console.warn('student_council direct table sync caught:', tableErr);
            }

            // 2. Backup to school_settings for dual cloud safety
            try {
                await (supabase as any).from('school_settings').upsert({
                    key: 'student_council_json',
                    value: JSON.stringify(newMembers),
                    category: 'students',
                }, { onConflict: 'key' });
            } catch (settingsErr) {
                console.warn('school_settings student_council_json backup note:', settingsErr);
            }

            notifyLocalRealtimeListeners('student_council');
            notifyLocalRealtimeListeners('school_settings');
        } catch (err: any) {
            console.error('Save council error:', err);
            toast({
                variant: 'destructive',
                title: 'บันทึกไม่สำเร็จ',
                description: err?.message || 'ไม่สามารถบันทึกข้อมูลสภานักเรียนไปยัง Supabase ได้',
            });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            position: '',
            class: '',
            initial: '',
            image_url: '',
            is_active: true,
        });
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: StudentCouncilMember) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                position: item.position,
                class: item.class || '',
                initial: item.initial || '',
                image_url: item.image_url || '',
                is_active: item.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);

            // Compress image before upload using shared utility (supports large Sony A7 / camera files)
            const compressedBlob = await compressImage(file, compressionPresets.avatar);
            const isWebP = compressedBlob.type === 'image/webp';
            const isPng = compressedBlob.type === 'image/png';
            const fileExt = isPng ? 'png' : isWebP ? 'webp' : 'jpg';
            const contentType = isPng ? 'image/png' : isWebP ? 'image/webp' : 'image/jpeg';
            const fileName = `council_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `student-council/${fileName}`;

            let finalUrl = '';
            try {
                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, compressedBlob, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType,
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
                finalUrl = urlData.publicUrl;
            } catch (storageErr) {
                console.warn('Storage upload fallback to Data URL for council image:', storageErr);
                finalUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => resolve('');
                    reader.readAsDataURL(compressedBlob);
                });
            }

            if (!finalUrl) {
                throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
            }

            setFormData((prev) => ({
                ...prev,
                image_url: finalUrl,
                initial: prev.initial || prev.name.charAt(0) || 'น',
            }));

            const origSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            const compSizeKB = Math.round(compressedBlob.size / 1024);
            const sizeNote = file.size > 1.5 * 1024 * 1024 ? ` (ลดจาก ${origSizeMB} MB เหลือ ${compSizeKB} KB)` : '';

            toast({ title: 'สำเร็จ', description: `อัปโหลดรูปภาพเรียบร้อย${sizeNote}` });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถอัปโหลดรูปได้',
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = async () => {
        if (formData.image_url && formData.image_url.startsWith('http')) {
            try {
                await deleteStorageImage(formData.image_url);
            } catch {
                // ignore
            }
        }
        setFormData((prev) => ({ ...prev, image_url: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const calculatedInitial = formData.initial || formData.name.charAt(0) || 'ส';
            if (editingItem) {
                const nextList = members.map((m) =>
                    m.id === editingItem.id
                        ? {
                              ...m,
                              name: formData.name,
                              position: formData.position,
                              class: formData.class || null,
                              initial: calculatedInitial,
                              image_url: formData.image_url || null,
                              is_active: formData.is_active,
                          }
                        : m
                );
                await persistMembers(nextList);
                toast({ title: 'สำเร็จ', description: 'แก้ไขข้อมูลสภานักเรียนเรียบร้อยแล้ว' });
            } else {
                const newItem: StudentCouncilMember = {
                    id: crypto.randomUUID(),
                    name: formData.name,
                    position: formData.position,
                    class: formData.class || null,
                    initial: calculatedInitial,
                    image_url: formData.image_url || null,
                    order_position: members.length + 1,
                    is_active: formData.is_active,
                };
                await persistMembers([...members, newItem]);
                toast({ title: 'สำเร็จ', description: 'เพิ่มสมาชิกสภานักเรียนใหม่เรียบร้อยแล้ว' });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบข้อมูลสภานักเรียนนี้หรือไม่?')) return;
        try {
            const member = members.find((m) => m.id === id);
            if (member?.image_url && member.image_url.startsWith('http')) {
                try {
                    await deleteStorageImage(member.image_url);
                } catch {
                    // ignore
                }
            }

            const nextList = members.filter((m) => m.id !== id);

            try {
                await supabase.from('student_council').delete().eq('id', id);
            } catch (delErr) {
                console.warn('Direct delete note:', delErr);
            }

            await persistMembers(nextList);
            toast({ title: 'สำเร็จ', description: 'ลบข้อมูลเรียบร้อยแล้ว' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleToggleActive = async (id: string, current: boolean) => {
        const nextList = members.map((m) =>
            m.id === id ? { ...m, is_active: !current } : m
        );
        await persistMembers(nextList);
        toast({
            title: !current ? 'เปิดการแสดงผลแล้ว' : 'ปิดการแสดงผลแล้ว',
            description: 'อัปเดตสถานะแบบเรียลไทม์เรียบร้อย',
        });
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === members.length - 1)
        ) {
            return;
        }

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const nextList = [...members];
        const temp = nextList[index];
        nextList[index] = nextList[targetIndex];
        nextList[targetIndex] = temp;

        const reordered = nextList.map((item, idx) => ({
            ...item,
            order_position: idx + 1,
        }));

        await persistMembers(reordered);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Database className="w-8 h-8 animate-pulse text-primary" />
                <p>กำลังเชื่อมต่อและโหลดข้อมูลสภานักเรียนจาก Supabase...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        คณะกรรมการสภานักเรียน (Student Council & Sapha Plus)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        เชื่อมต่อตาราง student_council พร้อมระบบอัปโหลดรูปภาพความละเอียดสูง
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2 shadow-sm">
                    <Plus className="w-4 h-4" />
                    เพิ่มกรรมการสภา
                </Button>
            </div>

            {members.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h4 className="text-lg font-bold mb-1">ยังไม่มีข้อมูลคณะกรรมการสภานักเรียนในฐานข้อมูล</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            เพิ่มรายชื่อตัวแทนนักเรียนเพื่อแสดงผลในหน้าสภานักเรียนและหน้าข้อมูลนักเรียน
                        </p>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มรายชื่อแรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {members.map((member, index) => (
                        <Card
                            key={member.id || index}
                            className={`transition-all hover:shadow-md border border-border flex flex-col justify-between ${
                                !member.is_active ? 'opacity-60 bg-muted/20' : 'bg-card'
                            }`}
                        >
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="font-mono text-xs font-bold text-muted-foreground">
                                            #{index + 1}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() => handleMoveOrder(index, 'up')}
                                                className="p-1 rounded hover:bg-secondary disabled:opacity-20"
                                                title="เลื่อนขึ้น"
                                            >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === members.length - 1}
                                                onClick={() => handleMoveOrder(index, 'down')}
                                                className="p-1 rounded hover:bg-secondary disabled:opacity-20"
                                                title="เลื่อนลง"
                                            >
                                                <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Member Image / Avatar */}
                                    <div className="flex justify-center mb-3">
                                        {member.image_url ? (
                                            <img
                                                src={member.image_url}
                                                alt={member.name}
                                                referrerPolicy="no-referrer"
                                                className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-extrabold text-2xl shadow-sm">
                                                {member.initial || member.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="font-bold text-base text-foreground text-center truncate">
                                        {member.name}
                                    </h4>
                                    <p className="text-xs font-semibold text-primary text-center truncate mb-1">
                                        {member.position}
                                    </p>
                                    {member.class && (
                                        <div className="text-center mb-4">
                                            <Badge variant="secondary" className="text-[11px] font-medium">
                                                ชั้น {member.class}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-border flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Switch
                                            checked={member.is_active}
                                            onCheckedChange={() => handleToggleActive(member.id, member.is_active)}
                                        />
                                        <span className="text-[11px] text-muted-foreground">
                                            {member.is_active ? 'เปิด' : 'ปิด'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenDialog(member)}
                                            className="h-8 px-2 text-xs"
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-1" />
                                            แก้ไข
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(member.id)}
                                            className="h-8 px-2 text-destructive hover:bg-destructive/10"
                                            title="ลบ"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal Dialog for Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? 'แก้ไขข้อมูลสภานักเรียน' : 'เพิ่มคณะกรรมการสภานักเรียนใหม่'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        {/* Image Upload Area */}
                        <div className="space-y-2">
                            <Label>รูปถ่าย</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploading}
                            />

                            {formData.image_url ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        referrerPolicy="no-referrer"
                                        className="w-14 h-14 rounded-full object-cover border"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            มีรูปภาพแล้ว
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs text-primary hover:underline"
                                            disabled={uploading}
                                        >
                                            เปลี่ยนรูปภาพ
                                        </button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveImage}
                                        className="text-destructive h-8 px-2"
                                        disabled={uploading}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full gap-2 border-dashed h-16 rounded-xl text-xs"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            กำลังประมวลผลรูปภาพ (รองรับ Sony A7 / กล้อง Mirrorless)...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 text-primary" />
                                            คลิกเพื่ออัปโหลดรูปถ่าย (ไม่จำกัดขนาดไฟล์)
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="council-name">ชื่อ - นามสกุล *</Label>
                            <Input
                                id="council-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="เช่น เด็กชายกิตติภพ สุขใจ"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="council-pos">ตำแหน่งในสภานักเรียน *</Label>
                                <Input
                                    id="council-pos"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="เช่น ประธานสภานักเรียน"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="council-class">ระดับชั้น</Label>
                                <Input
                                    id="council-class"
                                    value={formData.class}
                                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                    placeholder="เช่น ม.3/1 หรือ ป.6"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                            <div>
                                <Label className="font-semibold">สถานะการแสดงผล</Label>
                                <p className="text-xs text-muted-foreground">แสดงผลบนหน้าสภานักเรียนและหน้าข้อมูลนักเรียน</p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={saving || uploading}>
                                {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มรายชื่อ'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
