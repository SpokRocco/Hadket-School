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
import { Switch } from '@/components/ui/switch';
import {
    Plus,
    Edit,
    Trash2,
    Users,
    ArrowUp,
    ArrowDown,
    Save,
    RotateCcw,
    CheckCircle2,
    Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface GradeData {
    id: string;
    level: string;
    rooms: number;
    students: number;
    boys: number;
    girls: number;
    order_position: number;
    is_active: boolean;
    created_at?: string;
}

export const GradeDataManagement = () => {
    const [grades, setGrades] = useState<GradeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GradeData | null>(null);
    const [formData, setFormData] = useState({
        level: '',
        rooms: 1,
        students: 0,
        boys: 0,
        girls: 0,
        is_active: true,
    });
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            let loadedGrades: GradeData[] = [];

            // 1. Fetch directly from Supabase grade_data table
            const { data, error } = await supabase
                .from('grade_data')
                .select('*')
                .order('order_position', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                // Filter out legacy mock data if any exists (e.g., classes with 100+ students or ม.4-ม.6)
                loadedGrades = data.filter((item) => {
                    const isLegacyHighSchool = /มัธยมศึกษาปีที่\s*[4-6]|ม\.\s*[4-6]/.test(item.level || '') && (Number(item.students) > 100);
                    return !isLegacyHighSchool;
                }) as GradeData[];
            }

            // 2. Dual cloud fallback: Check school_settings.grade_data_json if table had no valid rows
            if (loadedGrades.length === 0) {
                try {
                    const { data: settingsData } = await supabase
                        .from('school_settings')
                        .select('value')
                        .eq('key', 'grade_data_json')
                        .maybeSingle();

                    if (settingsData?.value) {
                        const parsed = JSON.parse(settingsData.value);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            loadedGrades = parsed;
                        }
                    }
                } catch {
                    // ignore
                }
            }

            setGrades(loadedGrades);
        } catch (error: any) {
            console.error('Error fetching grade_data:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
                description: error?.message || 'ไม่สามารถโหลดข้อมูลชั้นเรียนได้',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
        return subscribeToRealtimeTables(
            'realtime_grade_data_admin',
            ['grade_data', 'school_settings'],
            fetchData
        );
    }, [fetchData]);

    // Dual-Cloud Persistence Helper
    const persistGrades = async (newGrades: GradeData[]) => {
        try {
            setSaving(true);
            setGrades(newGrades);

            // 1. Update grade_data table in Supabase
            try {
                const recordsToUpsert = newGrades.map((g, idx) => ({
                    id: g.id || crypto.randomUUID(),
                    level: g.level,
                    rooms: Number(g.rooms) || 1,
                    students: Number(g.students) || 0,
                    boys: Number(g.boys) || 0,
                    girls: Number(g.girls) || 0,
                    order_position: idx + 1,
                    is_active: g.is_active !== false,
                }));

                const { error: upsertErr } = await (supabase as any)
                    .from('grade_data')
                    .upsert(recordsToUpsert, { onConflict: 'id' });

                if (upsertErr) {
                    console.warn('grade_data table upsert note:', upsertErr.message);
                }
            } catch (tableErr) {
                console.warn('grade_data direct table sync caught:', tableErr);
            }

            // 2. Backup to school_settings for dual cloud safety
            try {
                await (supabase as any).from('school_settings').upsert({
                    key: 'grade_data_json',
                    value: JSON.stringify(newGrades),
                    category: 'students',
                }, { onConflict: 'key' });
            } catch (settingsErr) {
                console.warn('school_settings grade_data_json backup note:', settingsErr);
            }

            notifyLocalRealtimeListeners('grade_data');
            notifyLocalRealtimeListeners('school_settings');
        } catch (err: any) {
            console.error('Save grades error:', err);
            toast({
                variant: 'destructive',
                title: 'บันทึกไม่สำเร็จ',
                description: err?.message || 'ไม่สามารถบันทึกข้อมูลไปยัง Supabase ได้',
            });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            level: '',
            rooms: 1,
            students: 0,
            boys: 0,
            girls: 0,
            is_active: true,
        });
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: GradeData) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                level: item.level,
                rooms: item.rooms,
                students: item.students,
                boys: item.boys,
                girls: item.girls,
                is_active: item.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleBoysGirlsChange = (boysVal: number, girlsVal: number) => {
        setFormData((prev) => ({
            ...prev,
            boys: boysVal,
            girls: girlsVal,
            students: boysVal + girlsVal, // Auto calculate sum
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const updatedList = grades.map((g) =>
                    g.id === editingItem.id
                        ? {
                              ...g,
                              level: formData.level,
                              rooms: Number(formData.rooms) || 1,
                              students: Number(formData.students) || 0,
                              boys: Number(formData.boys) || 0,
                              girls: Number(formData.girls) || 0,
                              is_active: formData.is_active,
                          }
                        : g
                );
                await persistGrades(updatedList);
                toast({ title: 'สำเร็จ', description: 'แก้ไขข้อมูลชั้นเรียนเรียบร้อยแล้ว' });
            } else {
                const newItem: GradeData = {
                    id: crypto.randomUUID(),
                    level: formData.level,
                    rooms: Number(formData.rooms) || 1,
                    students: Number(formData.students) || 0,
                    boys: Number(formData.boys) || 0,
                    girls: Number(formData.girls) || 0,
                    order_position: grades.length + 1,
                    is_active: formData.is_active,
                };
                await persistGrades([...grades, newItem]);
                toast({ title: 'สำเร็จ', description: 'เพิ่มข้อมูลชั้นเรียนใหม่เรียบร้อยแล้ว' });
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
        if (!confirm('ต้องการลบข้อมูลชั้นเรียนนี้หรือไม่?')) return;
        try {
            const nextList = grades.filter((g) => g.id !== id);

            // Delete from Supabase table
            try {
                await supabase.from('grade_data').delete().eq('id', id);
            } catch (delErr) {
                console.warn('Direct delete note:', delErr);
            }

            await persistGrades(nextList);
            toast({ title: 'สำเร็จ', description: 'ลบข้อมูลเรียบร้อยแล้ว' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleToggleActive = async (id: string, current: boolean) => {
        const nextList = grades.map((g) =>
            g.id === id ? { ...g, is_active: !current } : g
        );
        await persistGrades(nextList);
        toast({
            title: !current ? 'เปิดการแสดงผลแล้ว' : 'ปิดการแสดงผลแล้ว',
            description: 'อัปเดตสถานะแบบเรียลไทม์เรียบร้อย',
        });
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === grades.length - 1)
        ) {
            return;
        }

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const nextList = [...grades];
        const temp = nextList[index];
        nextList[index] = nextList[targetIndex];
        nextList[targetIndex] = temp;

        const reordered = nextList.map((item, idx) => ({
            ...item,
            order_position: idx + 1,
        }));

        await persistGrades(reordered);
    };

    const totalRooms = grades.reduce((sum, g) => sum + (Number(g.rooms) || 0), 0);
    const totalBoys = grades.reduce((sum, g) => sum + (Number(g.boys) || 0), 0);
    const totalGirls = grades.reduce((sum, g) => sum + (Number(g.girls) || 0), 0);
    const totalStudents = grades.reduce((sum, g) => sum + (Number(g.students) || 0), 0);

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Database className="w-8 h-8 animate-pulse text-primary" />
                <p>กำลังเชื่อมต่อและโหลดข้อมูลจาก Supabase...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        ข้อมูลจำนวนนักเรียนแต่ละชั้นปี (Grade Levels)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        ดึงข้อมูลสดจาก Supabase (grade_data) พร้อมซิงค์เรียลไทม์ทุกหน้า
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2 shadow-sm">
                        <Plus className="w-4 h-4" />
                        เพิ่มระดับชั้น
                    </Button>
                </div>
            </div>

            {grades.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h4 className="text-lg font-bold mb-1">ยังไม่มีข้อมูลจำนวนนักเรียนในฐานข้อมูล</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            คลิกปุ่มด้านล่างเพื่อเริ่มต้นเพิ่มข้อมูลนักเรียนของโรงเรียนบ้านหาดเค็ด
                        </p>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มข้อมูลชั้นเรียนแรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-border shadow-xs bg-card">
                    <table className="min-w-full">
                        <thead className="bg-secondary/60 text-foreground">
                            <tr>
                                <th className="px-4 py-3.5 text-center text-xs font-bold w-16">ลำดับ</th>
                                <th className="px-4 py-3.5 text-left text-xs font-bold">ระดับชั้น</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold">ห้อง</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold">ชาย</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold">หญิง</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold text-primary">รวม (คน)</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold">สถานะ</th>
                                <th className="px-4 py-3.5 text-center text-xs font-bold">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {grades.map((grade, index) => (
                                <tr
                                    key={grade.id || index}
                                    className={`transition-colors hover:bg-secondary/40 ${
                                        !grade.is_active ? 'opacity-60 bg-muted/20' : ''
                                    }`}
                                >
                                    {/* Order / Reorder buttons */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="font-mono text-xs font-bold text-muted-foreground w-5">
                                                #{index + 1}
                                            </span>
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => handleMoveOrder(index, 'up')}
                                                    className="p-0.5 rounded hover:bg-secondary disabled:opacity-20"
                                                    title="เลื่อนขึ้น"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === grades.length - 1}
                                                    onClick={() => handleMoveOrder(index, 'down')}
                                                    className="p-0.5 rounded hover:bg-secondary disabled:opacity-20"
                                                    title="เลื่อนลง"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 font-semibold text-foreground text-sm">
                                        {grade.level}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {grade.rooms}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                        {grade.boys}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-pink-600 dark:text-pink-400 font-semibold">
                                        {grade.girls}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-primary">
                                        {grade.students}
                                    </td>

                                    {/* Active Toggle Switch */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Switch
                                                checked={grade.is_active}
                                                onCheckedChange={() => handleToggleActive(grade.id, grade.is_active)}
                                            />
                                            <span className="text-[11px] font-medium text-muted-foreground">
                                                {grade.is_active ? 'แสดง' : 'ซ่อน'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Action Buttons */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex gap-1.5 justify-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenDialog(grade)}
                                                className="h-8 px-2.5 text-xs gap-1"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                แก้ไข
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(grade.id)}
                                                className="h-8 px-2 text-destructive hover:bg-destructive/10"
                                                title="ลบข้อมูล"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Summary Totals Row */}
                            <tr className="bg-primary/5 font-bold border-t-2 border-border text-foreground">
                                <td colSpan={2} className="px-4 py-3.5 text-right text-xs uppercase tracking-wider">
                                    รวมทั้งสิ้น ({grades.filter((g) => g.is_active).length} ชั้นเรียนที่เปิดแสดง):
                                </td>
                                <td className="px-4 py-3.5 text-center text-sm">{totalRooms} ห้อง</td>
                                <td className="px-4 py-3.5 text-center text-sm text-blue-600 dark:text-blue-400">
                                    {totalBoys} คน
                                </td>
                                <td className="px-4 py-3.5 text-center text-sm text-pink-600 dark:text-pink-400">
                                    {totalGirls} คน
                                </td>
                                <td className="px-4 py-3.5 text-center text-base font-extrabold text-primary">
                                    {totalStudents} คน
                                </td>
                                <td colSpan={2} className="px-4 py-3.5 text-right text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <span className="inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        ซิงค์ตรงกับหน้าเว็บ
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Dialog for Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'แก้ไขข้อมูลชั้นเรียน' : 'เพิ่มข้อมูลระดับชั้นใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="grade-level">ระดับชั้น *</Label>
                            <Input
                                id="grade-level"
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                placeholder="เช่น อนุบาล 2, ประถมศึกษาปีที่ 1, มัธยมศึกษาปีที่ 1"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="grade-rooms">จำนวนห้องเรียน</Label>
                                <Input
                                    id="grade-rooms"
                                    type="number"
                                    min="1"
                                    value={formData.rooms}
                                    onChange={(e) =>
                                        setFormData({ ...formData, rooms: parseInt(e.target.value) || 1 })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="grade-total">รวมจำนวนนักเรียน (คน)</Label>
                                <Input
                                    id="grade-total"
                                    type="number"
                                    min="0"
                                    value={formData.students}
                                    onChange={(e) =>
                                        setFormData({ ...formData, students: parseInt(e.target.value) || 0 })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="grade-boys">นักเรียนชาย (คน)</Label>
                                <Input
                                    id="grade-boys"
                                    type="number"
                                    min="0"
                                    value={formData.boys}
                                    onChange={(e) => {
                                        const b = parseInt(e.target.value) || 0;
                                        handleBoysGirlsChange(b, formData.girls);
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade-girls">นักเรียนหญิง (คน)</Label>
                                <Input
                                    id="grade-girls"
                                    type="number"
                                    min="0"
                                    value={formData.girls}
                                    onChange={(e) => {
                                        const g = parseInt(e.target.value) || 0;
                                        handleBoysGirlsChange(formData.boys, g);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                            <div>
                                <Label className="font-semibold">สถานะการแสดงผล</Label>
                                <p className="text-xs text-muted-foreground">แสดงผลบนหน้าเว็บไซต์และหน้าหลักสูตร</p>
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
                                {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มระดับชั้น'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
