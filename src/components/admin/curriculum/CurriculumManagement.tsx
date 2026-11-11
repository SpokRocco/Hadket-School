import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, BookOpen, FlaskConical, Languages, Calculator, Monitor, Palette, Music, Dumbbell, GraduationCap, Award, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CurriculumProgram {
    id: string;
    title: string;
    description: string | null;
    icon: string;
    color: string;
    subjects: string[] | null;
    careers: string[] | null;
    order_position: number;
    is_active: boolean;
}

const iconOptions = [
    { value: 'FlaskConical', label: 'วิทยาศาสตร์', icon: FlaskConical },
    { value: 'Languages', label: 'ภาษา', icon: Languages },
    { value: 'Calculator', label: 'คำนวณ', icon: Calculator },
    { value: 'Monitor', label: 'คอมพิวเตอร์', icon: Monitor },
    { value: 'BookOpen', label: 'หนังสือ', icon: BookOpen },
    { value: 'Palette', label: 'ศิลปะ', icon: Palette },
    { value: 'Music', label: 'ดนตรี', icon: Music },
    { value: 'Dumbbell', label: 'กีฬา', icon: Dumbbell },
    { value: 'GraduationCap', label: 'การศึกษา', icon: GraduationCap },
];

const colorOptions = [
    { value: 'bg-blue-500', label: 'น้ำเงิน' },
    { value: 'bg-purple-500', label: 'ม่วง' },
    { value: 'bg-green-500', label: 'เขียว' },
    { value: 'bg-orange-500', label: 'ส้ม' },
    { value: 'bg-red-500', label: 'แดง' },
    { value: 'bg-yellow-500', label: 'เหลือง' },
    { value: 'bg-pink-500', label: 'ชมพู' },
    { value: 'bg-teal-500', label: 'เทา' },
];

export const CurriculumManagement = () => {
    const [programs, setPrograms] = useState<CurriculumProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<CurriculumProgram | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'BookOpen',
        color: 'bg-blue-500',
        subjects: '',
        careers: '',
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('curriculum_programs')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setPrograms(data || []);
        } catch (error: any) {
            console.error('Error fetching programs:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            icon: 'BookOpen',
            color: 'bg-blue-500',
            subjects: '',
            careers: '',
            is_active: true,
        });
        setEditingProgram(null);
    };

    const handleOpenDialog = (program?: CurriculumProgram) => {
        if (program) {
            setEditingProgram(program);
            setFormData({
                title: program.title,
                description: program.description || '',
                icon: program.icon || 'BookOpen',
                color: program.color || 'bg-blue-500',
                subjects: program.subjects?.join(', ') || '',
                careers: program.careers?.join(', ') || '',
                is_active: program.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse comma-separated values into arrays
        const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
        const careersArray = formData.careers.split(',').map(s => s.trim()).filter(s => s);

        try {
            if (editingProgram) {
                const { error } = await supabase
                    .from('curriculum_programs')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        icon: formData.icon,
                        color: formData.color,
                        subjects: subjectsArray,
                        careers: careersArray,
                        is_active: formData.is_active,
                    })
                    .eq('id', editingProgram.id);

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'แก้ไขหลักสูตรเรียบร้อยแล้ว',
                });
            } else {
                const maxOrder = programs.length > 0
                    ? Math.max(...programs.map(p => p.order_position))
                    : 0;

                const { error } = await supabase
                    .from('curriculum_programs')
                    .insert({
                        title: formData.title,
                        description: formData.description,
                        icon: formData.icon,
                        color: formData.color,
                        subjects: subjectsArray,
                        careers: careersArray,
                        is_active: formData.is_active,
                        order_position: maxOrder + 1,
                    });

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'เพิ่มหลักสูตรใหม่เรียบร้อยแล้ว',
                });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('curriculum_programs');
            fetchPrograms();
        } catch (error: any) {
            console.error('Error saving program:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหลักสูตรนี้หรือไม่?')) return;

        try {
            const { error } = await supabase
                .from('curriculum_programs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            notifyLocalRealtimeListeners('curriculum_programs');
            toast({
                title: 'สำเร็จ',
                description: 'ลบหลักสูตรเรียบร้อยแล้ว',
            });

            fetchPrograms();
        } catch (error: any) {
            console.error('Error deleting program:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถลบข้อมูลได้',
            });
        }
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= programs.length) return;

        const clone = [...programs];
        const [moved] = clone.splice(index, 1);
        clone.splice(targetIndex, 0, moved);
        const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
        setPrograms(reordered);

        try {
            await Promise.all(
                reordered.map((item) =>
                    supabase
                        .from('curriculum_programs')
                        .update({ order_position: item.order_position })
                        .eq('id', item.id)
                )
            );
            notifyLocalRealtimeListeners('curriculum_programs');
            toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับหลักสูตรใหม่แล้ว' });
        } catch {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกลำดับได้' });
            fetchPrograms();
        }
    };

    const getIconComponent = (iconName: string) => {
        const iconOption = iconOptions.find(i => i.value === iconName);
        return iconOption ? iconOption.icon : BookOpen;
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
                    <h1 className="text-3xl font-bold text-foreground">จัดการหลักสูตร</h1>
                    <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข หรือลบแผนการเรียน</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มหลักสูตร
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProgram ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตรใหม่'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">ชื่อหลักสูตร *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="วิทย์-คณิต"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">รายละเอียด</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="หลักสูตรเน้นวิทยาศาสตร์และคณิตศาสตร์..."
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subjects">รายวิชาหลัก (คั่นด้วยเครื่องหมาย ,)</Label>
                                <Textarea
                                    id="subjects"
                                    value={formData.subjects}
                                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                                    placeholder="ฟิสิกส์, เคมี, ชีววิทยา, คณิตศาสตร์"
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="careers">อาชีพในอนาคต (คั่นด้วยเครื่องหมาย ,)</Label>
                                <Textarea
                                    id="careers"
                                    value={formData.careers}
                                    onChange={(e) => setFormData({ ...formData, careers: e.target.value })}
                                    placeholder="แพทย์, วิศวกร, นักวิทยาศาสตร์"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="space-y-2">
                                    <Label>สี</Label>
                                    <Select
                                        value={formData.color}
                                        onValueChange={(value) => setFormData({ ...formData, color: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกสี" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {colorOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded ${option.value}`} />
                                                        {option.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
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
                                    {editingProgram ? 'บันทึก' : 'เพิ่ม'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {programs.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <GraduationCap className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูลหลักสูตร</h3>
                        <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มหลักสูตรได้เลย</p>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มหลักสูตรแรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {programs.map((program, idx) => {
                        const IconComponent = getIconComponent(program.icon);
                        return (
                            <Card key={program.id} className={`overflow-hidden ${!program.is_active ? 'opacity-50' : ''}`}>
                                <div className={`h-24 ${program.color} flex items-center justify-center relative`}>
                                    <span className="absolute top-2 right-2 text-[10px] bg-black/30 text-white px-2 py-0.5 rounded-full font-mono">
                                        #{idx + 1}
                                    </span>
                                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                                        <IconComponent className="w-7 h-7 text-white" />
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-foreground text-lg">{program.title}</h3>
                                        {!program.is_active && (
                                            <span className="text-xs bg-muted px-2 py-1 rounded">ซ่อน</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                        {program.description}
                                    </p>
                                    {program.subjects && program.subjects.length > 0 && (
                                        <div className="mb-2">
                                            <div className="flex items-center gap-1 text-xs text-primary mb-1">
                                                <BookOpen className="w-3 h-3" />
                                                รายวิชา: {program.subjects.slice(0, 3).join(', ')}{program.subjects.length > 3 ? '...' : ''}
                                            </div>
                                        </div>
                                    )}
                                    {program.careers && program.careers.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center gap-1 text-xs text-accent mb-1">
                                                <Award className="w-3 h-3" />
                                                อาชีพ: {program.careers.slice(0, 3).join(', ')}{program.careers.length > 3 ? '...' : ''}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
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
                                            disabled={idx === programs.length - 1}
                                            onClick={() => handleMoveOrder(idx, 'down')}
                                            title="เลื่อนลง"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(program)}>
                                            <Edit className="w-4 h-4 mr-1" />
                                            แก้ไข
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(program.id)}>
                                            <Trash2 className="w-4 h-4 mr-1" />
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
