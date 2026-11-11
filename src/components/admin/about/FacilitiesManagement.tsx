import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Building2, BookOpen, Award, Dumbbell, Monitor, FlaskConical, LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Facility {
    id: string;
    title: string;
    description: string | null;
    icon: string;
    order_position: number;
    is_active: boolean;
}

const iconOptions = [
    { value: 'Building2', label: 'อาคาร', icon: Building2 },
    { value: 'BookOpen', label: 'หนังสือ', icon: BookOpen },
    { value: 'Award', label: 'รางวัล', icon: Award },
    { value: 'Dumbbell', label: 'กีฬา', icon: Dumbbell },
    { value: 'Monitor', label: 'คอมพิวเตอร์', icon: Monitor },
    { value: 'FlaskConical', label: 'วิทยาศาสตร์', icon: FlaskConical },
];

export const FacilitiesManagement = () => {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'Building2',
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('facilities')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setFacilities(data || []);
        } catch (error: any) {
            console.error('Error fetching facilities:', error);
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลได้' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', icon: 'Building2', is_active: true });
        setEditingFacility(null);
    };

    const handleOpenDialog = (facility?: Facility) => {
        if (facility) {
            setEditingFacility(facility);
            setFormData({
                title: facility.title,
                description: facility.description || '',
                icon: facility.icon,
                is_active: facility.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFacility) {
                const { error } = await supabase
                    .from('facilities')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        icon: formData.icon,
                        is_active: formData.is_active,
                    })
                    .eq('id', editingFacility.id);

                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขเรียบร้อยแล้ว' });
            } else {
                const maxOrder = facilities.length > 0 ? Math.max(...facilities.map(f => f.order_position)) : 0;
                const { error } = await supabase
                    .from('facilities')
                    .insert({
                        title: formData.title,
                        description: formData.description,
                        icon: formData.icon,
                        is_active: formData.is_active,
                        order_position: maxOrder + 1,
                    });

                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มเรียบร้อยแล้ว' });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('facilities');
            fetchFacilities();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกได้' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหรือไม่?')) return;
        try {
            const { error } = await supabase.from('facilities').delete().eq('id', id);
            if (error) throw error;
            notifyLocalRealtimeListeners('facilities');
            toast({ title: 'สำเร็จ', description: 'ลบเรียบร้อยแล้ว' });
            fetchFacilities();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= facilities.length) return;
        const clone = [...facilities];
        const [moved] = clone.splice(index, 1);
        clone.splice(targetIndex, 0, moved);
        const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
        setFacilities(reordered);
        try {
            await Promise.all(
                reordered.map((item) =>
                    supabase.from('facilities').update({ order_position: item.order_position }).eq('id', item.id)
                )
            );
            notifyLocalRealtimeListeners('facilities');
            toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับอาคารสถานที่แล้ว' });
        } catch {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถจัดเรียงได้' });
            fetchFacilities();
        }
    };

    const getIconComponent = (iconName: string): LucideIcon => {
        return iconOptions.find(i => i.value === iconName)?.icon || Building2;
    };

    if (loading) {
        return <div className="p-8"><div className="text-center py-12"><p className="text-muted-foreground">กำลังโหลด...</p></div></div>;
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">สิ่งอำนวยความสะดวก</h1>
                    <p className="text-muted-foreground mt-1">จัดการสถานที่และอุปกรณ์ของโรงเรียน</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มสิ่งอำนวยความสะดวก
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingFacility ? 'แก้ไข' : 'เพิ่มใหม่'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">ชื่อ *</Label>
                                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="อาคารเรียน" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">รายละเอียด</Label>
                                <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="อาคาร 5 หลัง..." />
                            </div>
                            <div className="space-y-2">
                                <Label>ไอคอน</Label>
                                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                                    <SelectTrigger><SelectValue placeholder="เลือกไอคอน" /></SelectTrigger>
                                    <SelectContent>
                                        {iconOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                    <option.icon className="w-4 h-4" />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                                <Label>แสดงบนเว็บไซต์</Label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                                <Button type="submit">{editingFacility ? 'บันทึก' : 'เพิ่ม'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {facilities.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูล</h3>
                        <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />เพิ่มข้อมูลแรก</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {facilities.map((facility, idx) => {
                        const IconComponent = getIconComponent(facility.icon);
                        return (
                            <Card key={facility.id} className={`${!facility.is_active ? 'opacity-50' : ''}`}>
                                <CardContent className="p-4 text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                                        <IconComponent className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-1">{facility.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{facility.description || '-'}</p>
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={idx === 0} onClick={() => handleMoveOrder(idx, 'up')}><ArrowUp className="w-3 h-3" /></Button>
                                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={idx === facilities.length - 1} onClick={() => handleMoveOrder(idx, 'down')}><ArrowDown className="w-3 h-3" /></Button>
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(facility)} className="text-xs px-2">
                                            <Edit className="w-3 h-3 mr-1" />แก้ไข
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(facility.id)} className="text-xs px-2">
                                            <Trash2 className="w-3 h-3 mr-1" />ลบ
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
