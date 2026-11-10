import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, BarChart3, Users, GraduationCap, BookOpen, Trophy, TrendingUp, Star, Award, LucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentStat {
    id: string;
    label: string;
    value: string;
    icon: string;
    color: string;
    order_position: number;
    is_active: boolean;
}

const iconMap: Record<string, LucideIcon> = {
    Users,
    GraduationCap,
    BookOpen,
    Trophy,
    TrendingUp,
    Star,
    Award,
};

const iconOptions = ['Users', 'GraduationCap', 'BookOpen', 'Trophy', 'TrendingUp', 'Star', 'Award'];
const colorOptions = [
    { value: 'text-primary', label: 'Primary (น้ำเงิน)' },
    { value: 'text-accent', label: 'Accent (ทอง)' },
    { value: 'text-green-500', label: 'เขียว' },
    { value: 'text-purple-500', label: 'ม่วง' },
    { value: 'text-red-500', label: 'แดง' },
    { value: 'text-orange-500', label: 'ส้ม' },
];

export const StudentStatsManagement = () => {
    const [stats, setStats] = useState<StudentStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StudentStat | null>(null);
    const [formData, setFormData] = useState({
        label: '',
        value: '',
        icon: 'Users',
        color: 'text-primary',
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('student_stats').select('*').order('order_position', { ascending: true });
            if (error) throw error;
            setStats(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถโหลดข้อมูลได้' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ label: '', value: '', icon: 'Users', color: 'text-primary', is_active: true });
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: StudentStat) => {
        if (item) {
            setEditingItem(item);
            setFormData({ label: item.label, value: item.value, icon: item.icon, color: item.color, is_active: item.is_active });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const { error } = await supabase.from('student_stats').update({ label: formData.label, value: formData.value, icon: formData.icon, color: formData.color, is_active: formData.is_active }).eq('id', editingItem.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขเรียบร้อยแล้ว' });
            } else {
                const maxOrder = stats.length > 0 ? Math.max(...stats.map(s => s.order_position)) : 0;
                const { error } = await supabase.from('student_stats').insert({ ...formData, order_position: maxOrder + 1 });
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มเรียบร้อยแล้ว' });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกได้' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหรือไม่?')) return;
        try {
            const { error } = await supabase.from('student_stats').delete().eq('id', id);
            if (error) throw error;
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
                <h3 className="text-lg font-semibold">สถิติภาพรวม</h3>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่ม</Button>
            </div>

            {stats.length === 0 ? (
                <Card><CardContent className="p-8 text-center"><BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p>ยังไม่มีข้อมูล</p></CardContent></Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const IconComponent = iconMap[stat.icon] || BarChart3;
                        return (
                            <Card key={stat.id} className={`${!stat.is_active ? 'opacity-50' : ''}`}>
                                <CardContent className="p-4 text-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                        <IconComponent className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                                    <div className="text-sm font-medium text-foreground mb-1">{stat.label}</div>
                                    <div className="text-xs text-muted-foreground mb-3">{stat.icon}</div>
                                    <div className="flex gap-1 justify-center">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(stat)} className="text-xs px-2"><Edit className="w-3 h-3 mr-1" />แก้ไข</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(stat.id)} className="text-xs px-2"><Trash2 className="w-3 h-3" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editingItem ? 'แก้ไข' : 'เพิ่มสถิติใหม่'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><Label>ป้ายชื่อ *</Label><Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="นักเรียนทั้งหมด" required /></div>
                        <div className="space-y-2"><Label>ค่า *</Label><Input value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="1,250" required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ไอคอน</Label>
                                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {iconOptions.map((i) => {
                                            const IconC = iconMap[i] || BarChart3;
                                            return (
                                                <SelectItem key={i} value={i}>
                                                    <div className="flex items-center gap-2">
                                                        <IconC className="w-4 h-4 text-primary" />
                                                        <span>{i}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>สี</Label>
                                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{colorOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>แสดงบนเว็บไซต์</Label></div>
                        <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button><Button type="submit">{editingItem ? 'บันทึก' : 'เพิ่ม'}</Button></div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
