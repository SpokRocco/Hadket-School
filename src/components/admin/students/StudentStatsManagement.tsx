import { useState, useEffect, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Plus,
    Edit,
    Trash2,
    BarChart3,
    Users,
    GraduationCap,
    BookOpen,
    Trophy,
    TrendingUp,
    Star,
    Award,
    ArrowLeft,
    ArrowRight,
    LucideIcon,
    Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface StudentStat {
    id: string;
    label: string;
    value: string;
    icon: string;
    color: string;
    order_position: number;
    is_active: boolean;
    created_at?: string;
}

const iconMap: Record<string, LucideIcon> = {
    Users,
    GraduationCap,
    BookOpen,
    Trophy,
    TrendingUp,
    Star,
    Award,
    BarChart3,
};

const iconOptions = [
    { value: 'Users', label: 'นักเรียน / บุคคล (Users)' },
    { value: 'GraduationCap', label: 'หมวกปริญญา / ปฐมวัย (GraduationCap)' },
    { value: 'BookOpen', label: 'หนังสือ / ประถมศึกษา (BookOpen)' },
    { value: 'Trophy', label: 'ถ้วยรางวัล / มัธยมศึกษา (Trophy)' },
    { value: 'TrendingUp', label: 'พัฒนาการ / กราฟ (TrendingUp)' },
    { value: 'Star', label: 'ดาวเด่น (Star)' },
    { value: 'Award', label: 'เหรียญรางวัล (Award)' },
];

const colorOptions = [
    { value: 'text-primary', label: 'สีน้ำเงินหลัก (Primary)', dotClass: 'bg-primary' },
    { value: 'text-amber-500', label: 'สีทอง / ส้มสว่าง (Accent Gold)', dotClass: 'bg-amber-500' },
    { value: 'text-emerald-500', label: 'สีเขียวสด (Emerald)', dotClass: 'bg-emerald-500' },
    { value: 'text-violet-500', label: 'สีม่วง (Violet)', dotClass: 'bg-violet-500' },
    { value: 'text-sky-500', label: 'สีฟ้าคราม (Sky Blue)', dotClass: 'bg-sky-500' },
    { value: 'text-rose-500', label: 'สีชมพู / แดง (Rose)', dotClass: 'bg-rose-500' },
];

export const StudentStatsManagement = () => {
    const [stats, setStats] = useState<StudentStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            let loadedStats: StudentStat[] = [];

            // 1. Fetch from Supabase student_stats table
            const { data, error } = await supabase
                .from('student_stats')
                .select('*')
                .order('order_position', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                // Filter out legacy 1250-student mock rows
                loadedStats = data.filter((s) => {
                    const isLegacyMock = s.value === '1,250' || s.value === '650' || s.value === '600';
                    return !isLegacyMock;
                }) as StudentStat[];
            }

            // 2. Dual cloud fallback: Check school_settings.student_stats_json
            if (loadedStats.length === 0) {
                try {
                    const { data: settingsData } = await supabase
                        .from('school_settings')
                        .select('value')
                        .eq('key', 'student_stats_json')
                        .maybeSingle();

                    if (settingsData?.value) {
                        const parsed = JSON.parse(settingsData.value);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            loadedStats = parsed;
                        }
                    }
                } catch {
                    // ignore
                }
            }

            setStats(loadedStats);
        } catch (error: any) {
            console.error('Error fetching student_stats:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
                description: error?.message || 'ไม่สามารถโหลดข้อมูลสถิติได้',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
        return subscribeToRealtimeTables(
            'realtime_student_stats_admin',
            ['student_stats', 'school_settings'],
            fetchData
        );
    }, [fetchData]);

    const persistStats = async (newStats: StudentStat[]) => {
        try {
            setSaving(true);
            setStats(newStats);

            // 1. Update student_stats table in Supabase
            try {
                const recordsToUpsert = newStats.map((s, idx) => ({
                    id: s.id || crypto.randomUUID(),
                    label: s.label,
                    value: s.value,
                    icon: s.icon || 'Users',
                    color: s.color || 'text-primary',
                    order_position: idx + 1,
                    is_active: s.is_active !== false,
                }));

                const { error: upsertErr } = await (supabase as any)
                    .from('student_stats')
                    .upsert(recordsToUpsert, { onConflict: 'id' });

                if (upsertErr) {
                    console.warn('student_stats table upsert note:', upsertErr.message);
                }
            } catch (tableErr) {
                console.warn('student_stats direct table sync caught:', tableErr);
            }

            // 2. Backup to school_settings for dual cloud safety
            try {
                await (supabase as any).from('school_settings').upsert({
                    key: 'student_stats_json',
                    value: JSON.stringify(newStats),
                    category: 'students',
                }, { onConflict: 'key' });
            } catch (settingsErr) {
                console.warn('school_settings student_stats_json backup note:', settingsErr);
            }

            notifyLocalRealtimeListeners('student_stats');
            notifyLocalRealtimeListeners('school_settings');
        } catch (err: any) {
            console.error('Save stats error:', err);
            toast({
                variant: 'destructive',
                title: 'บันทึกไม่สำเร็จ',
                description: err?.message || 'ไม่สามารถบันทึกข้อมูลสถิติไปยัง Supabase ได้',
            });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            label: '',
            value: '',
            icon: 'Users',
            color: 'text-primary',
            is_active: true,
        });
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: StudentStat) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                label: item.label,
                value: item.value,
                icon: item.icon,
                color: item.color,
                is_active: item.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const nextList = stats.map((s) =>
                    s.id === editingItem.id
                        ? {
                              ...s,
                              label: formData.label,
                              value: formData.value,
                              icon: formData.icon,
                              color: formData.color,
                              is_active: formData.is_active,
                          }
                        : s
                );
                await persistStats(nextList);
                toast({ title: 'สำเร็จ', description: 'แก้ไขสถิติเรียบร้อยแล้ว' });
            } else {
                const newItem: StudentStat = {
                    id: crypto.randomUUID(),
                    label: formData.label,
                    value: formData.value,
                    icon: formData.icon,
                    color: formData.color,
                    order_position: stats.length + 1,
                    is_active: formData.is_active,
                };
                await persistStats([...stats, newItem]);
                toast({ title: 'สำเร็จ', description: 'เพิ่มสถิติใหม่เรียบร้อยแล้ว' });
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
        if (!confirm('ต้องการลบสถิตินี้หรือไม่?')) return;
        try {
            const nextList = stats.filter((s) => s.id !== id);

            try {
                await supabase.from('student_stats').delete().eq('id', id);
            } catch (delErr) {
                console.warn('Direct delete note:', delErr);
            }

            await persistStats(nextList);
            toast({ title: 'สำเร็จ', description: 'ลบสถิติเรียบร้อยแล้ว' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleToggleActive = async (id: string, current: boolean) => {
        const nextList = stats.map((s) =>
            s.id === id ? { ...s, is_active: !current } : s
        );
        await persistStats(nextList);
        toast({
            title: !current ? 'เปิดการแสดงผลแล้ว' : 'ปิดการแสดงผลแล้ว',
            description: 'อัปเดตสถานะแบบเรียลไทม์เรียบร้อย',
        });
    };

    const handleMoveOrder = async (index: number, direction: 'left' | 'right') => {
        if (
            (direction === 'left' && index === 0) ||
            (direction === 'right' && index === stats.length - 1)
        ) {
            return;
        }

        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        const nextList = [...stats];
        const temp = nextList[index];
        nextList[index] = nextList[targetIndex];
        nextList[targetIndex] = temp;

        const reordered = nextList.map((item, idx) => ({
            ...item,
            order_position: idx + 1,
        }));

        await persistStats(reordered);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Database className="w-8 h-8 animate-pulse text-primary" />
                <p>กำลังเชื่อมต่อและโหลดข้อมูลสถิติจาก Supabase...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        สถิติภาพรวมนักเรียน (Overview Stats)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        แสดงผลเป็นการ์ดสรุปตัวเลขบนหน้าข้อมูลนักเรียน (/students) และหน้าหลัก
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2 shadow-sm">
                    <Plus className="w-4 h-4" />
                    เพิ่มสถิติใหม่
                </Button>
            </div>

            {stats.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h4 className="text-lg font-bold mb-1">ยังไม่มีข้อมูลสถิติในฐานข้อมูล</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            คลิกปุ่มด้านล่างเพื่อเพิ่มการ์ดสถิตินักเรียนของโรงเรียนบ้านหาดเค็ด
                        </p>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มสถิติแรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => {
                        const IconComponent = iconMap[stat.icon] || BarChart3;
                        return (
                            <Card
                                key={stat.id || index}
                                className={`transition-all hover:shadow-md border border-border relative ${
                                    !stat.is_active ? 'opacity-60 bg-muted/20' : 'bg-card'
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
                                                    onClick={() => handleMoveOrder(index, 'left')}
                                                    className="p-1 rounded hover:bg-secondary disabled:opacity-20"
                                                    title="เลื่อนไปข้างหน้า"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === stats.length - 1}
                                                    onClick={() => handleMoveOrder(index, 'right')}
                                                    className="p-1 rounded hover:bg-secondary disabled:opacity-20"
                                                    title="เลื่อนไปข้างหลัง"
                                                >
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-3 shadow-xs">
                                            <IconComponent className={`w-7 h-7 ${stat.color}`} />
                                        </div>

                                        <div className={`text-3xl font-extrabold ${stat.color} mb-1 text-center`}>
                                            {stat.value}
                                        </div>
                                        <div className="text-sm font-semibold text-foreground text-center mb-4">
                                            {stat.label}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Switch
                                                checked={stat.is_active}
                                                onCheckedChange={() => handleToggleActive(stat.id, stat.is_active)}
                                            />
                                            <span className="text-[11px] text-muted-foreground">
                                                {stat.is_active ? 'เปิด' : 'ปิด'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenDialog(stat)}
                                                className="h-8 px-2 text-xs"
                                            >
                                                <Edit className="w-3.5 h-3.5 mr-1" />
                                                แก้ไข
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(stat.id)}
                                                className="h-8 px-2 text-destructive hover:bg-destructive/10"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal Dialog for Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'แก้ไขสถิติ' : 'เพิ่มการ์ดสถิติใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="stat-label">ป้ายชื่อสถิติ *</Label>
                            <Input
                                id="stat-label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                placeholder="เช่น นักเรียนปัจจุบัน, ระดับปฐมวัย, ระดับประถม"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stat-value">ค่าตัวเลขหรือข้อความ *</Label>
                            <Input
                                id="stat-value"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder="เช่น 74 คน, 14 คน, 100%"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ไอคอน</Label>
                                <Select
                                    value={formData.icon}
                                    onValueChange={(v) => setFormData({ ...formData, icon: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {iconOptions.map((opt) => {
                                            const IconC = iconMap[opt.value] || BarChart3;
                                            return (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-2">
                                                        <IconC className="w-4 h-4 text-primary" />
                                                        <span className="text-xs">{opt.label}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>โทนสีตัวเลข</Label>
                                <Select
                                    value={formData.color}
                                    onValueChange={(v) => setFormData({ ...formData, color: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colorOptions.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded-full ${c.dotClass}`} />
                                                    <span className="text-xs">{c.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                            <div>
                                <Label className="font-semibold">สถานะการแสดงผล</Label>
                                <p className="text-xs text-muted-foreground">แสดงผลบนหน้าเว็บไซต์</p>
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
                            <Button type="submit" disabled={saving}>
                                {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มสถิติ'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
