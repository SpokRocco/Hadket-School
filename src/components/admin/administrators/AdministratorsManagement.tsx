import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, UserCog, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '../shared/ImageUpload';
import { deleteStorageImage } from '@/utils/storageUtils';

interface Administrator {
    id: string;
    name: string;
    position: string;
    education: string;
    quote: string;
    photo_url: string;
    order_position: number;
}

export const AdministratorsManagement = () => {
    const [administrators, setAdministrators] = useState<Administrator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        education: '',
        quote: '',
        photo_url: '',
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchAdministrators();
    }, []);

    const fetchAdministrators = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('administrators')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setAdministrators(data || []);
        } catch (error: any) {
            console.error('Error fetching administrators:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลผู้บริหารได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            position: '',
            education: '',
            quote: '',
            photo_url: '',
        });
        setEditingAdmin(null);
    };

    const handleOpenDialog = (admin?: Administrator) => {
        if (admin) {
            setEditingAdmin(admin);
            setFormData({
                name: admin.name,
                position: admin.position,
                education: admin.education || '',
                quote: admin.quote || '',
                photo_url: admin.photo_url || '',
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingAdmin) {
                // Update
                const { data, error } = await supabase
                    .from('administrators')
                    .update({
                        name: formData.name.trim(),
                        position: formData.position.trim(),
                        education: formData.education.trim(),
                        quote: formData.quote.trim(),
                        photo_url: formData.photo_url,
                    })
                    .eq('id', editingAdmin.id)
                    .select();

                if (error) throw error;
                if (!data || data.length === 0) {
                    throw new Error('ไม่สามารถอัปเดตข้อมูลผู้บริหารในฐานข้อมูลได้');
                }

                toast({
                    title: 'สำเร็จ',
                    description: 'แก้ไขข้อมูลผู้บริหารเรียบร้อยแล้ว',
                });
            } else {
                // Create
                const maxOrder = administrators.length > 0
                    ? Math.max(...administrators.map(a => a.order_position))
                    : 0;

                const { error } = await supabase
                    .from('administrators')
                    .insert({
                        name: formData.name,
                        position: formData.position,
                        education: formData.education,
                        quote: formData.quote,
                        photo_url: formData.photo_url,
                        order_position: maxOrder + 1,
                    });

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'เพิ่มผู้บริหารใหม่เรียบร้อยแล้ว',
                });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('administrators');
            fetchAdministrators();
        } catch (error: any) {
            console.error('Error saving administrator:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบผู้บริหารนี้หรือไม่?')) return;

        try {
            // Find the admin to get the photo_url
            const adminToDelete = administrators.find(a => a.id === id);

            // Delete image from storage if exists
            if (adminToDelete?.photo_url) {
                await deleteStorageImage(adminToDelete.photo_url);
            }

            const { error } = await supabase
                .from('administrators')
                .delete()
                .eq('id', id);

            if (error) throw error;

            notifyLocalRealtimeListeners('administrators');
            toast({
                title: 'สำเร็จ',
                description: 'ลบผู้บริหารเรียบร้อยแล้ว',
            });

            fetchAdministrators();
        } catch (error: any) {
            console.error('Error deleting administrator:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถลบข้อมูลได้',
            });
        }
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= administrators.length) return;

        const clone = [...administrators];
        const [moved] = clone.splice(index, 1);
        clone.splice(targetIndex, 0, moved);
        const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
        setAdministrators(reordered);

        try {
            await Promise.all(
                reordered.map((item) =>
                    supabase
                        .from('administrators')
                        .update({ order_position: item.order_position })
                        .eq('id', item.id)
                )
            );
            notifyLocalRealtimeListeners('administrators');
            toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับผู้บริหารใหม่แล้ว' });
        } catch {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกลำดับได้' });
            fetchAdministrators();
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">จัดการผู้บริหาร</h1>
                    <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข หรือลบข้อมูลผู้บริหารโรงเรียน</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มผู้บริหาร
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingAdmin ? 'แก้ไขผู้บริหาร' : 'เพิ่มผู้บริหารใหม่'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ดร.สมศักดิ์ วิทยาการ"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">ตำแหน่ง *</Label>
                                <Input
                                    id="position"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="ผู้อำนวยการโรงเรียน"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="education">การศึกษา</Label>
                                <Input
                                    id="education"
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    placeholder="ปริญญาเอก บริหารการศึกษา"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quote">คำคม/วิสัยทัศน์</Label>
                                <Input
                                    id="quote"
                                    value={formData.quote}
                                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                    placeholder="การศึกษาคือกุญแจสู่อนาคตที่สดใส"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>รูปภาพ</Label>
                                <ImageUpload
                                    currentImage={formData.photo_url}
                                    onUploadComplete={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
                                    folder="administrators"
                                    maxSizeMB={0}
                                    compressionPreset="profile"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button type="submit">
                                    {editingAdmin ? 'บันทึก' : 'เพิ่ม'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {administrators.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <UserCog className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูลผู้บริหาร</h3>
                        <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มผู้บริหารโรงเรียนได้เลย</p>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มผู้บริหารคนแรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {administrators.map((admin, idx) => (
                        <Card key={admin.id} className="overflow-hidden">
                            <div className="h-32 bg-gradient-to-br from-primary to-navy-light flex items-center justify-center relative">
                                <span className="absolute top-2 right-2 text-[10px] bg-black/35 text-white px-2 py-0.5 rounded-full font-mono">
                                    #{idx + 1}
                                </span>
                                {admin.photo_url ? (
                                    <img
                                        src={admin.photo_url}
                                        alt={admin.name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-white/50"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/50">
                                        <span className="text-2xl font-bold text-white">
                                            {admin.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-bold text-foreground">{admin.name}</h3>
                                <p className="text-sm text-accent font-medium">{admin.position}</p>
                                {admin.education && (
                                    <p className="text-xs text-muted-foreground mt-1">{admin.education}</p>
                                )}
                                {admin.quote && (
                                    <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-accent pl-2">
                                        "{admin.quote}"
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        disabled={idx === 0}
                                        onClick={() => handleMoveOrder(idx, 'up')}
                                        title="เลื่อนขึ้น"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        disabled={idx === administrators.length - 1}
                                        onClick={() => handleMoveOrder(idx, 'down')}
                                        title="เลื่อนลง"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenDialog(admin)}
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        แก้ไข
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(admin.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        ลบ
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
