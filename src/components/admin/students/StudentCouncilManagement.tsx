import { useState, useEffect, useRef } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Crown, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteStorageImage } from '@/utils/storageUtils';
import { compressImage, compressionPresets } from '@/utils/imageUtils';

interface StudentCouncilMember {
    id: string;
    name: string;
    position: string;
    class: string | null;
    initial: string | null;
    image_url: string | null;
    order_position: number;
    is_active: boolean;
}

export const StudentCouncilManagement = () => {
    const [members, setMembers] = useState<StudentCouncilMember[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('student_council').select('*').order('order_position', { ascending: true });
            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลได้' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', position: '', class: '', initial: '', image_url: '', is_active: true });
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

            // Compress image before upload using shared utility
            const compressedBlob = await compressImage(file, compressionPresets.avatar);
            const fileName = `council_${Date.now()}.webp`;
            const filePath = `student-council/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, compressedBlob, { cacheControl: '3600', upsert: false, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
            setFormData({ ...formData, image_url: urlData.publicUrl });
            toast({ title: 'สำเร็จ', description: 'อัปโหลดรูปเรียบร้อยแล้ว' });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถอัปโหลดรูปได้' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const { error } = await supabase.from('student_council').update({
                    name: formData.name,
                    position: formData.position,
                    class: formData.class,
                    initial: formData.initial || formData.name.charAt(0),
                    image_url: formData.image_url || null,
                    is_active: formData.is_active,
                }).eq('id', editingItem.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขเรียบร้อยแล้ว' });
            } else {
                const maxOrder = members.length > 0 ? Math.max(...members.map(m => m.order_position)) : 0;
                const { error } = await supabase.from('student_council').insert({
                    name: formData.name,
                    position: formData.position,
                    class: formData.class,
                    initial: formData.initial || formData.name.charAt(0),
                    image_url: formData.image_url || null,
                    is_active: formData.is_active,
                    order_position: maxOrder + 1,
                });
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มเรียบร้อยแล้ว' });
            }
            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('student_council');
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกได้' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหรือไม่?')) return;
        try {
            // Get member data to delete image from storage
            const member = members.find(m => m.id === id);
            if (member?.image_url) {
                await deleteStorageImage(member.image_url);
            }

            const { error } = await supabase.from('student_council').delete().eq('id', id);
            if (error) throw error;
            notifyLocalRealtimeListeners('student_council');
            toast({ title: 'สำเร็จ', description: 'ลบเรียบร้อยแล้ว' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleRemoveImage = async () => {
        // Delete from storage if there's an existing image
        if (formData.image_url) {
            await deleteStorageImage(formData.image_url);
        }
        setFormData({ ...formData, image_url: '' });
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">คณะกรรมการสภานักเรียน</h3>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่มกรรมการ</Button>
            </div>

            {members.length === 0 ? (
                <Card><CardContent className="p-8 text-center"><Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p>ยังไม่มีข้อมูล</p></CardContent></Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                        <Card key={member.id} className={`${!member.is_active ? 'opacity-50' : ''}`}>
                            <CardContent className="p-4 text-center">
                                {member.image_url ? (
                                    <img src={member.image_url} alt={member.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                                        <span className="text-xl font-bold text-accent-foreground">{member.initial || member.name.charAt(0)}</span>
                                    </div>
                                )}
                                <h4 className="font-bold text-foreground">{member.name}</h4>
                                <p className="text-sm text-primary font-semibold">{member.position}</p>
                                <p className="text-xs text-muted-foreground">{member.class || '-'}</p>
                                <div className="flex gap-1 justify-center mt-3">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(member)} className="text-xs px-2"><Edit className="w-3 h-3 mr-1" />แก้ไข</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(member.id)} className="text-xs px-2"><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editingItem ? 'แก้ไข' : 'เพิ่มกรรมการใหม่'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label>รูปภาพ</Label>
                            <div className="flex items-center gap-4">
                                {formData.image_url ? (
                                    <div className="relative">
                                        <img src={formData.image_url} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                                        <button type="button" onClick={handleRemoveImage} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                        <Crown className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                                        <Upload className="w-4 h-4" />
                                        {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2"><Label>ชื่อ-นามสกุล *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="นายประสิทธิ์ เก่งมาก" required /></div>
                        <div className="space-y-2"><Label>ตำแหน่ง *</Label><Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="ประธานสภานักเรียน" required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>ชั้น/ห้อง</Label><Input value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} placeholder="ม.6/1" /></div>
                            <div className="space-y-2"><Label>ตัวย่อ (ใช้เมื่อไม่มีรูป)</Label><Input value={formData.initial} onChange={(e) => setFormData({ ...formData, initial: e.target.value })} placeholder="ป" maxLength={2} /></div>
                        </div>
                        <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>แสดงบนเว็บไซต์</Label></div>
                        <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button><Button type="submit">{editingItem ? 'บันทึก' : 'เพิ่ม'}</Button></div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
