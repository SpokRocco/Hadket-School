import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GradeData {
    id: string;
    level: string;
    rooms: number;
    students: number;
    boys: number;
    girls: number;
    order_position: number;
    is_active: boolean;
}

export const GradeDataManagement = () => {
    const [grades, setGrades] = useState<GradeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GradeData | null>(null);
    const [formData, setFormData] = useState({
        level: '',
        rooms: 0,
        students: 0,
        boys: 0,
        girls: 0,
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('grade_data').select('*').order('order_position', { ascending: true });
            if (error) throw error;
            setGrades(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลได้' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ level: '', rooms: 0, students: 0, boys: 0, girls: 0, is_active: true });
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: GradeData) => {
        if (item) {
            setEditingItem(item);
            setFormData({ level: item.level, rooms: item.rooms, students: item.students, boys: item.boys, girls: item.girls, is_active: item.is_active });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const { error } = await supabase.from('grade_data').update({ level: formData.level, rooms: formData.rooms, students: formData.students, boys: formData.boys, girls: formData.girls, is_active: formData.is_active }).eq('id', editingItem.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขเรียบร้อยแล้ว' });
            } else {
                const maxOrder = grades.length > 0 ? Math.max(...grades.map(g => g.order_position)) : 0;
                const { error } = await supabase.from('grade_data').insert({ ...formData, order_position: maxOrder + 1 });
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มเรียบร้อยแล้ว' });
            }
            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('grade_data');
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกได้' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหรือไม่?')) return;
        try {
            const { error } = await supabase.from('grade_data').delete().eq('id', id);
            if (error) throw error;
            notifyLocalRealtimeListeners('grade_data');
            toast({ title: 'สำเร็จ', description: 'ลบเรียบร้อยแล้ว' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">ข้อมูลนักเรียนแต่ละชั้นปี</h3>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่ม</Button>
            </div>

            {grades.length === 0 ? (
                <Card><CardContent className="p-8 text-center"><Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p>ยังไม่มีข้อมูล</p></CardContent></Card>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-card rounded-lg border">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">ระดับชั้น</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">ห้อง</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">จำนวน</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">ชาย</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">หญิง</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">สถานะ</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grades.map((grade) => (
                                <tr key={grade.id} className={`border-t ${!grade.is_active ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3 font-medium">{grade.level}</td>
                                    <td className="px-4 py-3 text-center">{grade.rooms}</td>
                                    <td className="px-4 py-3 text-center font-semibold text-primary">{grade.students}</td>
                                    <td className="px-4 py-3 text-center text-blue-600">{grade.boys}</td>
                                    <td className="px-4 py-3 text-center text-pink-600">{grade.girls}</td>
                                    <td className="px-4 py-3 text-center">{grade.is_active ? <span className="text-green-600">แสดง</span> : <span className="text-muted-foreground">ซ่อน</span>}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex gap-1 justify-center">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(grade)} className="text-xs px-2"><Edit className="w-3 h-3" /></Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(grade.id)} className="text-xs px-2"><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editingItem ? 'แก้ไข' : 'เพิ่มข้อมูลชั้นปี'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><Label>ระดับชั้น *</Label><Input value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} placeholder="มัธยมศึกษาปีที่ 1" required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>จำนวนห้อง</Label><Input type="number" value={formData.rooms} onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) || 0 })} /></div>
                            <div className="space-y-2"><Label>จำนวนนักเรียน</Label><Input type="number" value={formData.students} onChange={(e) => setFormData({ ...formData, students: parseInt(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>ชาย</Label><Input type="number" value={formData.boys} onChange={(e) => setFormData({ ...formData, boys: parseInt(e.target.value) || 0 })} /></div>
                            <div className="space-y-2"><Label>หญิง</Label><Input type="number" value={formData.girls} onChange={(e) => setFormData({ ...formData, girls: parseInt(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>แสดงบนเว็บไซต์</Label></div>
                        <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button><Button type="submit">{editingItem ? 'บันทึก' : 'เพิ่ม'}</Button></div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
