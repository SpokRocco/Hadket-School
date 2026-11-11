import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, History, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Milestone {
    id: string;
    year: string;
    event: string;
    order_position: number;
    is_active: boolean;
}

export const MilestonesManagement = () => {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [formData, setFormData] = useState({
        year: '',
        event: '',
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchMilestones();
    }, []);

    const fetchMilestones = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('milestones')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setMilestones(data || []);
        } catch (error: any) {
            console.error('Error fetching milestones:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ year: '', event: '', is_active: true });
        setEditingMilestone(null);
    };

    const handleOpenDialog = (milestone?: Milestone) => {
        if (milestone) {
            setEditingMilestone(milestone);
            setFormData({
                year: milestone.year,
                event: milestone.event,
                is_active: milestone.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingMilestone) {
                const { error } = await supabase
                    .from('milestones')
                    .update({
                        year: formData.year,
                        event: formData.event,
                        is_active: formData.is_active,
                    })
                    .eq('id', editingMilestone.id);

                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขเรียบร้อยแล้ว' });
            } else {
                const maxOrder = milestones.length > 0 ? Math.max(...milestones.map(m => m.order_position)) : 0;
                const { error } = await supabase
                    .from('milestones')
                    .insert({
                        year: formData.year,
                        event: formData.event,
                        is_active: formData.is_active,
                        order_position: maxOrder + 1,
                    });

                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มเรียบร้อยแล้ว' });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('milestones');
            fetchMilestones();
        } catch (error: any) {
            console.error('Error saving:', error);
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกได้' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหรือไม่?')) return;
        try {
            const { error } = await supabase.from('milestones').delete().eq('id', id);
            if (error) throw error;
            notifyLocalRealtimeListeners('milestones');
            toast({ title: 'สำเร็จ', description: 'ลบเรียบร้อยแล้ว' });
            fetchMilestones();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= milestones.length) return;
        const clone = [...milestones];
        const [moved] = clone.splice(index, 1);
        clone.splice(targetIndex, 0, moved);
        const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
        setMilestones(reordered);
        try {
            await Promise.all(
                reordered.map((item) =>
                    supabase.from('milestones').update({ order_position: item.order_position }).eq('id', item.id)
                )
            );
            notifyLocalRealtimeListeners('milestones');
            toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับไทม์ไลน์แล้ว' });
        } catch {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถจัดเรียงได้' });
            fetchMilestones();
        }
    };

    if (loading) {
        return <div className="p-8"><div className="text-center py-12"><p className="text-muted-foreground">กำลังโหลด...</p></div></div>;
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">ประวัติความเป็นมา</h1>
                    <p className="text-muted-foreground mt-1">จัดการ Timeline ประวัติโรงเรียน</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มประวัติ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingMilestone ? 'แก้ไข' : 'เพิ่มประวัติใหม่'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="year">ปี พ.ศ. *</Label>
                                <Input id="year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="2517" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="event">เหตุการณ์ *</Label>
                                <Input id="event" value={formData.event} onChange={(e) => setFormData({ ...formData, event: e.target.value })} placeholder="ก่อตั้งโรงเรียน..." required />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                                <Label>แสดงบนเว็บไซต์</Label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                                <Button type="submit">{editingMilestone ? 'บันทึก' : 'เพิ่ม'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {milestones.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูล</h3>
                        <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />เพิ่มประวัติแรก</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {milestones.map((milestone, idx) => (
                        <Card key={milestone.id} className={`${!milestone.is_active ? 'opacity-50' : ''}`}>
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="text-2xl font-bold text-primary w-16 shrink-0">{milestone.year}</div>
                                    <div className="text-foreground">{milestone.event}</div>
                                    {!milestone.is_active && <span className="text-xs bg-muted px-2 py-1 rounded">ซ่อน</span>}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={idx === 0} onClick={() => handleMoveOrder(idx, 'up')}><ArrowUp className="w-3.5 h-3.5" /></Button>
                                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={idx === milestones.length - 1} onClick={() => handleMoveOrder(idx, 'down')}><ArrowDown className="w-3.5 h-3.5" /></Button>
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(milestone)}><Edit className="w-4 h-4 mr-1" />แก้ไข</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(milestone.id)}><Trash2 className="w-4 h-4 mr-1" />ลบ</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
