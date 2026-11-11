import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, BookOpen, Palette, Music, Dumbbell, Heart, Trophy, Users, Gamepad2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Activity {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    order_position: number;
    is_active: boolean;
}

const iconOptions = [
    { value: 'Palette', label: 'ศิลปะ', icon: Palette },
    { value: 'Music', label: 'ดนตรี', icon: Music },
    { value: 'Dumbbell', label: 'กีฬา', icon: Dumbbell },
    { value: 'BookOpen', label: 'หนังสือ', icon: BookOpen },
    { value: 'Heart', label: 'จิตอาสา', icon: Heart },
    { value: 'Trophy', label: 'ถ้วยรางวัล', icon: Trophy },
    { value: 'Users', label: 'กลุ่ม', icon: Users },
    { value: 'Gamepad2', label: 'เกม', icon: Gamepad2 },
];

export const ActivitiesManagement = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: 'Palette',
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('curriculum_activities')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setActivities(data || []);
        } catch (error: any) {
            console.error('Error fetching activities:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลกิจกรรมได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            icon: 'Palette',
            is_active: true,
        });
        setEditingActivity(null);
    };

    const handleOpenDialog = (activity?: Activity) => {
        if (activity) {
            setEditingActivity(activity);
            setFormData({
                name: activity.name,
                description: activity.description || '',
                icon: activity.icon || 'Palette',
                is_active: activity.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingActivity) {
                const { error } = await supabase
                    .from('curriculum_activities')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        icon: formData.icon,
                        is_active: formData.is_active,
                    })
                    .eq('id', editingActivity.id);

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'แก้ไขกิจกรรมเรียบร้อยแล้ว',
                });
            } else {
                const maxOrder = activities.length > 0
                    ? Math.max(...activities.map(a => a.order_position))
                    : 0;

                const { error } = await supabase
                    .from('curriculum_activities')
                    .insert({
                        name: formData.name,
                        description: formData.description,
                        icon: formData.icon,
                        is_active: formData.is_active,
                        order_position: maxOrder + 1,
                    });

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'เพิ่มกิจกรรมใหม่เรียบร้อยแล้ว',
                });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('curriculum_activities');
            fetchActivities();
        } catch (error: any) {
            console.error('Error saving activity:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบกิจกรรมนี้หรือไม่?')) return;

        try {
            const { error } = await supabase
                .from('curriculum_activities')
                .delete()
                .eq('id', id);

            if (error) throw error;

            notifyLocalRealtimeListeners('curriculum_activities');
            toast({
                title: 'สำเร็จ',
                description: 'ลบกิจกรรมเรียบร้อยแล้ว',
            });

            fetchActivities();
        } catch (error: any) {
            console.error('Error deleting activity:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถลบข้อมูลได้',
            });
        }
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= activities.length) return;

        const clone = [...activities];
        const [moved] = clone.splice(index, 1);
        clone.splice(targetIndex, 0, moved);
        const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
        setActivities(reordered);

        try {
            await Promise.all(
                reordered.map((item) =>
                    supabase
                        .from('curriculum_activities')
                        .update({ order_position: item.order_position })
                        .eq('id', item.id)
                )
            );
            notifyLocalRealtimeListeners('curriculum_activities');
            toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับกิจกรรมเสริมใหม่แล้ว' });
        } catch {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกลำดับได้' });
            fetchActivities();
        }
    };

    const getIconComponent = (iconName: string) => {
        const iconOption = iconOptions.find(i => i.value === iconName);
        return iconOption ? iconOption.icon : Palette;
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
                    <h1 className="text-3xl font-bold text-foreground">จัดการกิจกรรมเสริม</h1>
                    <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข หรือลบกิจกรรมเสริมหลักสูตร</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มกิจกรรม
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingActivity ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">ชื่อกิจกรรม *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ชมรมศิลปะ"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">รายละเอียด</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="วาดภาพ ปั้น และงานหัตถกรรม"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ไอคอน</Label>
                                <Select
                                    value={formData.icon}
                                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกไอคอน" />
                                    </SelectTrigger>
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
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label>แสดงบนเว็บไซต์</Label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button type="submit">
                                    {editingActivity ? 'บันทึก' : 'เพิ่ม'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {activities.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Palette className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูลกิจกรรม</h3>
                        <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มกิจกรรมได้เลย</p>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มกิจกรรมแรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activities.map((activity, idx) => {
                        const IconComponent = getIconComponent(activity.icon);
                        return (
                            <Card key={activity.id} className={`${!activity.is_active ? 'opacity-50' : ''}`}>
                                <CardContent className="p-4 text-center">
                                    <div className="flex justify-end mb-1">
                                        <span className="text-[10px] font-mono text-muted-foreground">#{idx + 1}</span>
                                    </div>
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                                        <IconComponent className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-1">{activity.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                        {activity.description || '-'}
                                    </p>
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7"
                                            disabled={idx === 0}
                                            onClick={() => handleMoveOrder(idx, 'up')}
                                            title="เลื่อนขึ้น"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7"
                                            disabled={idx === activities.length - 1}
                                            onClick={() => handleMoveOrder(idx, 'down')}
                                            title="เลื่อนลง"
                                        >
                                            <ArrowDown className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(activity)} className="text-xs px-2">
                                            <Edit className="w-3 h-3 mr-1" />
                                            แก้ไข
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(activity.id)} className="text-xs px-2">
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            ลบ
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
