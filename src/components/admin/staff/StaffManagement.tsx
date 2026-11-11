import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Briefcase, Award, Layers, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '../shared/ImageUpload';
import { deleteStorageImage } from '@/utils/storageUtils';

export type PersonnelType = 'director' | 'teaching' | 'support';

export interface PersonnelItem {
    id: string;
    name: string;
    position: string;
    department: string;
    subject: string;
    education: string;
    experience: string;
    quote: string;
    photo_url: string;
    staff_type: PersonnelType;
    order_position: number;
    source_table: 'administrators' | 'staff';
}

export const StaffManagement = () => {
    const [personnelList, setPersonnelList] = useState<PersonnelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PersonnelItem | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | PersonnelType>('all');
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        department: '',
        subject: '',
        education: '',
        experience: '',
        quote: '',
        photo_url: '',
        staff_type: 'teaching' as PersonnelType,
        order_position: 1,
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchAllPersonnel();
    }, []);

    const fetchAllPersonnel = async () => {
        try {
            setLoading(true);
            const [adminRes, staffRes] = await Promise.all([
                supabase
                    .from('administrators')
                    .select('*')
                    .order('order_position', { ascending: true }),
                supabase
                    .from('staff')
                    .select('*')
                    .order('order_position', { ascending: true }),
            ]);

            if (adminRes.error) throw adminRes.error;
            if (staffRes.error) throw staffRes.error;

            const directorsFromAdmin: PersonnelItem[] = (adminRes.data || []).map((a: any) => ({
                id: a.id,
                name: a.name || '',
                position: a.position || 'ผู้อำนวยการโรงเรียน',
                department: 'ผู้บริหารสถานศึกษา',
                subject: '',
                education: a.education || '',
                experience: '',
                quote: a.quote || '',
                photo_url: a.photo_url || '',
                staff_type: 'director',
                order_position: a.order_position ?? 1,
                source_table: 'administrators',
            }));

            const staffItems: PersonnelItem[] = (staffRes.data || []).map((s: any) => {
                const rawType = s.staff_type;
                const mappedType: PersonnelType =
                    rawType === 'director' || s.department === '__director__'
                        ? 'director'
                        : rawType === 'support'
                            ? 'support'
                            : 'teaching';

                return {
                    id: s.id,
                    name: s.name || '',
                    position: s.position || '',
                    department: s.department === '__director__' ? '' : (s.department || ''),
                    subject: s.subject || '',
                    education: s.education || '',
                    experience: s.experience || '',
                    quote: s.experience || '',
                    photo_url: s.photo_url || '',
                    staff_type: mappedType,
                    order_position: s.order_position ?? 1,
                    source_table: 'staff',
                };
            });

            setPersonnelList([...directorsFromAdmin, ...staffItems]);
        } catch (error: any) {
            console.error('Error fetching personnel:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลบุคลากรได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const getDefaultTypeForAdd = (presetType?: PersonnelType): PersonnelType => {
        if (presetType) return presetType;
        if (activeTab === 'director' || activeTab === 'teaching' || activeTab === 'support') {
            return activeTab;
        }
        return 'teaching';
    };

    const resetForm = (presetType?: PersonnelType) => {
        const targetType = getDefaultTypeForAdd(presetType);
        const sameTypeItems = personnelList.filter((p) => p.staff_type === targetType);
        const nextOrder =
            sameTypeItems.length > 0
                ? Math.max(...sameTypeItems.map((s) => s.order_position || 0)) + 1
                : 1;

        setFormData({
            name: '',
            position: targetType === 'director' ? 'ผู้อำนวยการโรงเรียน' : '',
            department: '',
            subject: '',
            education: '',
            experience: '',
            quote: '',
            photo_url: '',
            staff_type: targetType,
            order_position: nextOrder,
        });
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: PersonnelItem, presetType?: PersonnelType) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                position: item.position,
                department: item.department || '',
                subject: item.subject || '',
                education: item.education || '',
                experience: item.experience || '',
                quote: item.quote || '',
                photo_url: item.photo_url || '',
                staff_type: item.staff_type,
                order_position: item.order_position || 1,
            });
        } else {
            resetForm(presetType);
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        try {
            setSaving(true);
            const targetType = formData.staff_type;
            const orderPos = Number(formData.order_position) || 1;

            if (editingItem) {
                // กรณีแก้ไขข้อมูลเดิม
                if (targetType === 'director') {
                    if (editingItem.source_table === 'administrators') {
                        const { data, error } = await supabase
                            .from('administrators')
                            .update({
                                name: formData.name.trim(),
                                position: formData.position.trim(),
                                education: formData.education.trim(),
                                quote: formData.quote.trim(),
                                photo_url: formData.photo_url,
                                order_position: orderPos,
                            })
                            .eq('id', editingItem.id)
                            .select();

                        if (error) throw error;
                        if (!data || data.length === 0) {
                            throw new Error('ไม่พบรายการที่ต้องการอัปเดตในฐานข้อมูล');
                        }
                    } else {
                        // ย้ายจากตาราง staff ไปยัง administrators
                        const { error: insertErr } = await supabase
                            .from('administrators')
                            .insert({
                                name: formData.name.trim(),
                                position: formData.position.trim(),
                                education: formData.education.trim(),
                                quote: formData.quote.trim() || formData.experience.trim(),
                                photo_url: formData.photo_url,
                                order_position: orderPos,
                            });
                        if (insertErr) throw insertErr;

                        await supabase.from('staff').delete().eq('id', editingItem.id);
                    }
                } else {
                    // targetType === 'teaching' | 'support'
                    if (editingItem.source_table === 'staff') {
                        const { data, error } = await supabase
                            .from('staff')
                            .update({
                                name: formData.name.trim(),
                                position: formData.position.trim(),
                                department: formData.department.trim(),
                                subject: formData.subject.trim(),
                                education: formData.education.trim(),
                                experience: formData.experience.trim(),
                                photo_url: formData.photo_url,
                                staff_type: targetType,
                                order_position: orderPos,
                            })
                            .eq('id', editingItem.id)
                            .select();

                        if (error) throw error;
                        if (!data || data.length === 0) {
                            throw new Error('ไม่พบรายการที่ต้องการอัปเดตในฐานข้อมูล');
                        }
                    } else {
                        // ย้ายจากตาราง administrators มายัง staff
                        const { error: insertErr } = await supabase
                            .from('staff')
                            .insert({
                                name: formData.name.trim(),
                                position: formData.position.trim(),
                                department: formData.department.trim(),
                                subject: formData.subject.trim(),
                                education: formData.education.trim(),
                                experience: formData.experience.trim() || formData.quote.trim(),
                                photo_url: formData.photo_url,
                                staff_type: targetType,
                                order_position: orderPos,
                            });
                        if (insertErr) throw insertErr;

                        await supabase.from('administrators').delete().eq('id', editingItem.id);
                    }
                }

                toast({
                    title: 'บันทึกสำเร็จ',
                    description: 'อัปเดตข้อมูลบุคลากรลงในฐานข้อมูลเรียบร้อยแล้ว',
                });
            } else {
                // กรณีเพิ่มบุคลากรใหม่
                if (targetType === 'director') {
                    const { error } = await supabase
                        .from('administrators')
                        .insert({
                            name: formData.name.trim(),
                            position: formData.position.trim(),
                            education: formData.education.trim(),
                            quote: formData.quote.trim(),
                            photo_url: formData.photo_url,
                            order_position: orderPos,
                        });

                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('staff')
                        .insert({
                            name: formData.name.trim(),
                            position: formData.position.trim(),
                            department: formData.department.trim(),
                            subject: formData.subject.trim(),
                            education: formData.education.trim(),
                            experience: formData.experience.trim(),
                            photo_url: formData.photo_url,
                            staff_type: targetType,
                            order_position: orderPos,
                        });

                    if (error) throw error;
                }

                toast({
                    title: 'เพิ่มข้อมูลสำเร็จ',
                    description: 'เพิ่มบุคลากรใหม่ลงในฐานข้อมูลเรียบร้อยแล้ว',
                });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('administrators');
            notifyLocalRealtimeListeners('staff');
            await fetchAllPersonnel();
        } catch (error: any) {
            console.error('Error saving staff:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาดในการบันทึก',
                description: error?.message || 'ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: PersonnelItem) => {
        if (!confirm(`ต้องการลบข้อมูลของ "${item.name}" หรือไม่?`)) return;

        try {
            if (item.photo_url) {
                await deleteStorageImage(item.photo_url);
            }

            const { error } = await supabase
                .from(item.source_table)
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            notifyLocalRealtimeListeners(item.source_table);
            notifyLocalRealtimeListeners('staff');
            toast({
                title: 'ลบข้อมูลสำเร็จ',
                description: 'ลบข้อมูลบุคลากรเรียบร้อยแล้ว',
            });

            await fetchAllPersonnel();
        } catch (error: any) {
            console.error('Error deleting personnel:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถลบข้อมูลได้',
            });
        }
    };

    const handleMoveOrder = async (
        groupItems: PersonnelItem[],
        index: number,
        direction: 'up' | 'down'
    ) => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= groupItems.length) return;

        const clone = [...groupItems];
        const [moved] = clone.splice(index, 1);
        clone.splice(targetIndex, 0, moved);
        const updatedGroup = clone.map((item, idx) => ({
            ...item,
            order_position: idx + 1,
        }));

        const orderByKey = new Map(
            updatedGroup.map((item) => [`${item.source_table}-${item.id}`, item.order_position])
        );
        setPersonnelList((prev) =>
            prev.map((item) => {
                const nextOrder = orderByKey.get(`${item.source_table}-${item.id}`);
                return nextOrder !== undefined ? { ...item, order_position: nextOrder } : item;
            })
        );

        try {
            await Promise.all(
                updatedGroup.map((item) =>
                    supabase
                        .from(item.source_table)
                        .update({ order_position: item.order_position })
                        .eq('id', item.id)
                )
            );
            notifyLocalRealtimeListeners('administrators');
            notifyLocalRealtimeListeners('staff');
            toast({
                title: 'จัดเรียงสำเร็จ',
                description: 'บันทึกลำดับบุคลากรใหม่แล้ว',
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกลำดับบุคลากรได้',
            });
            fetchAllPersonnel();
        }
    };

    const directors = personnelList
        .filter((s) => s.staff_type === 'director')
        .sort((a, b) => (a.order_position || 0) - (b.order_position || 0));

    const teachingStaff = personnelList
        .filter((s) => s.staff_type === 'teaching')
        .sort((a, b) => (a.order_position || 0) - (b.order_position || 0));

    const supportStaff = personnelList
        .filter((s) => s.staff_type === 'support')
        .sort((a, b) => (a.order_position || 0) - (b.order_position || 0));

    const renderPersonnelCard = (
        person: PersonnelItem,
        isFeaturedDirector = false,
        groupItems?: PersonnelItem[],
        indexInGroup?: number
    ) => (
        <Card
            key={`${person.source_table}-${person.id}`}
            className={`overflow-hidden border transition-shadow hover:shadow-md ${
                isFeaturedDirector ? 'max-w-md mx-auto w-full border-accent/50 shadow-md' : ''
            }`}
        >
            <div
                className={`${
                    isFeaturedDirector ? 'h-32' : 'h-28'
                } bg-gradient-to-br from-primary to-navy-light flex items-center justify-center relative`}
            >
                <span className="absolute top-2 right-2 text-[10px] bg-black/30 text-white px-2 py-0.5 rounded-full">
                    ลำดับ #{person.order_position}
                </span>
                {person.photo_url ? (
                    <img
                        src={person.photo_url}
                        alt={person.name}
                        className={`${
                            isFeaturedDirector ? 'w-24 h-24' : 'w-20 h-20'
                        } rounded-full object-cover border-2 border-white/70 shadow-md`}
                    />
                ) : (
                    <div
                        className={`${
                            isFeaturedDirector ? 'w-24 h-24' : 'w-20 h-20'
                        } rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50`}
                    >
                        <span className="text-2xl font-bold text-white">
                            {person.name ? person.name.charAt(0) : '?'}
                        </span>
                    </div>
                )}
            </div>
            <CardContent className="p-4 text-center">
                <h3 className="font-bold text-foreground text-base">{person.name}</h3>
                <p className="text-xs text-accent font-semibold mt-0.5">{person.position}</p>
                {person.subject && (
                    <p className="text-xs text-muted-foreground mt-1">กลุ่มสาระ/วิชา: {person.subject}</p>
                )}
                {person.department && person.staff_type !== 'director' && (
                    <p className="text-xs text-muted-foreground mt-0.5">ฝ่าย/งาน: {person.department}</p>
                )}
                {person.education && (
                    <p className="text-xs text-muted-foreground mt-0.5">{person.education}</p>
                )}
                {person.experience && person.staff_type !== 'director' && (
                    <p className="text-xs text-muted-foreground mt-0.5">ประสบการณ์: {person.experience}</p>
                )}
                {person.quote && person.staff_type === 'director' && (
                    <p className="text-xs text-muted-foreground italic mt-2 bg-secondary/60 p-2 rounded-lg">
                        "{person.quote}"
                    </p>
                )}
                <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                    {groupItems && typeof indexInGroup === 'number' && groupItems.length > 1 && (
                        <>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                disabled={indexInGroup === 0}
                                onClick={() => handleMoveOrder(groupItems, indexInGroup, 'up')}
                                title="เลื่อนขึ้น / ซ้าย"
                            >
                                <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                disabled={indexInGroup === groupItems.length - 1}
                                onClick={() => handleMoveOrder(groupItems, indexInGroup, 'down')}
                                title="เลื่อนลง / ขวา"
                            >
                                <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                        </>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(person)}
                        className="text-xs"
                    >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        แก้ไข
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(person)}
                        className="text-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        ลบ
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">กำลังโหลดข้อมูลบุคลากร...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">จัดการทำเนียบบุคลากร</h1>
                    <p className="text-muted-foreground mt-1">
                        จัดเรียงการแสดงผล 3 แถว: แถวที่ 1 ผู้อำนวยการ • แถวที่ 2 ครูและบุคลากรทางการศึกษา • แถวที่ 3 บุคลากรสายสนับสนุน
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    เพิ่มบุคลากร
                </Button>
            </div>

            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingItem(null);
                }}
            >
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="staff_type">แถวที่แสดงผล / ประเภทบุคลากร *</Label>
                            <Select
                                value={formData.staff_type}
                                onValueChange={(value: PersonnelType) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        staff_type: value,
                                        position:
                                            value === 'director' && !prev.position
                                                ? 'ผู้อำนวยการโรงเรียน'
                                                : prev.position,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกแถวที่แสดงผล" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="director">แถวที่ 1: ผู้อำนวยการ</SelectItem>
                                    <SelectItem value="teaching">แถวที่ 2: ครูและบุคลากรทางการศึกษา</SelectItem>
                                    <SelectItem value="support">แถวที่ 3: บุคลากรสายสนับสนุน</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="เช่น นายสมชาย ใจดี"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order_position">ลำดับที่</Label>
                                <Input
                                    id="order_position"
                                    type="number"
                                    min={1}
                                    value={formData.order_position}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            order_position: parseInt(e.target.value, 10) || 1,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">ตำแหน่ง *</Label>
                            <Input
                                id="position"
                                value={formData.position}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, position: e.target.value }))
                                }
                                placeholder={
                                    formData.staff_type === 'director'
                                        ? 'ผู้อำนวยการโรงเรียน'
                                        : formData.staff_type === 'teaching'
                                            ? 'ครูชำนาญการ / หัวหน้ากลุ่มสาระฯ'
                                            : 'เจ้าหน้าที่ธุรการ / นักจัดการงานทั่วไป'
                                }
                                required
                            />
                        </div>

                        {formData.staff_type === 'teaching' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">กลุ่มสาระ/วิชาที่สอน</Label>
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, subject: e.target.value }))
                                        }
                                        placeholder="เช่น ภาษาไทย, คณิตศาสตร์"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">ฝ่าย/แผนก (ถ้ามี)</Label>
                                    <Input
                                        id="department"
                                        value={formData.department}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, department: e.target.value }))
                                        }
                                        placeholder="เช่น ฝ่ายวิชาการ"
                                    />
                                </div>
                            </div>
                        )}

                        {formData.staff_type === 'support' && (
                            <div className="space-y-2">
                                <Label htmlFor="department">แผนก/ฝ่ายงาน</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, department: e.target.value }))
                                    }
                                    placeholder="เช่น ฝ่ายบริหารทั่วไป, งานธุรการ"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="education">วุฒิการศึกษา</Label>
                            <Input
                                id="education"
                                value={formData.education}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, education: e.target.value }))
                                }
                                placeholder="เช่น ปริญญาโท การบริหารการศึกษา"
                            />
                        </div>

                        {formData.staff_type === 'director' ? (
                            <div className="space-y-2">
                                <Label htmlFor="quote">คำคม / วิสัยทัศน์ผู้บริหาร</Label>
                                <Input
                                    id="quote"
                                    value={formData.quote}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, quote: e.target.value }))
                                    }
                                    placeholder="เช่น มุ่งพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรม"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="experience">ประสบการณ์ทำงาน</Label>
                                <Input
                                    id="experience"
                                    value={formData.experience}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, experience: e.target.value }))
                                    }
                                    placeholder="เช่น 10 ปี"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>รูปภาพบุคลากร</Label>
                            <ImageUpload
                                currentImage={formData.photo_url}
                                onUploadComplete={(url) =>
                                    setFormData((prev) => ({ ...prev, photo_url: url }))
                                }
                                folder={formData.staff_type === 'director' ? 'administrators' : 'staff'}
                                maxSizeMB={5}
                                compressionPreset="profile"
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={saving}
                            >
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : editingItem ? (
                                    'บันทึกการแก้ไข'
                                ) : (
                                    'เพิ่มบุคลากร'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="mb-6 flex-wrap h-auto gap-1">
                    <TabsTrigger value="all" className="gap-2">
                        <Layers className="w-4 h-4" />
                        แสดงทั้งหมดตามลำดับแถว ({personnelList.length})
                    </TabsTrigger>
                    <TabsTrigger value="director" className="gap-2">
                        <Award className="w-4 h-4" />
                        แถวที่ 1: ผู้อำนวยการ ({directors.length})
                    </TabsTrigger>
                    <TabsTrigger value="teaching" className="gap-2">
                        <Users className="w-4 h-4" />
                        แถวที่ 2: ครูและบุคลากรทางการศึกษา ({teachingStaff.length})
                    </TabsTrigger>
                    <TabsTrigger value="support" className="gap-2">
                        <Briefcase className="w-4 h-4" />
                        แถวที่ 3: บุคลากรสายสนับสนุน ({supportStaff.length})
                    </TabsTrigger>
                </TabsList>

                {/* แท็บแสดงผลรวมทั้ง 3 แถวตามลำดับ */}
                <TabsContent value="all" className="space-y-10">
                    {/* แถวที่ 1: ผู้อำนวยการ */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1">
                                    แถวที่ 1
                                </Badge>
                                <h2 className="text-xl font-bold text-foreground">
                                    ผู้อำนวยการสถานศึกษา ({directors.length})
                                </h2>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(undefined, 'director')}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                เพิ่มผู้อำนวยการ
                            </Button>
                        </div>
                        {directors.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    ยังไม่มีข้อมูลในแถวที่ 1 (ผู้อำนวยการ)
                                </CardContent>
                            </Card>
                        ) : (
                            <div
                                className={
                                    directors.length === 1
                                        ? 'flex justify-center'
                                        : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                                }
                            >
                                {directors.map((d, idx) =>
                                    renderPersonnelCard(d, directors.length === 1, directors, idx)
                                )}
                            </div>
                        )}
                    </div>

                    {/* แถวที่ 2: ครูและบุคลากรทางการศึกษา */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                                    แถวที่ 2
                                </Badge>
                                <h2 className="text-xl font-bold text-foreground">
                                    ครูและบุคลากรทางการศึกษา ({teachingStaff.length})
                                </h2>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(undefined, 'teaching')}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                เพิ่มครูและบุคลากรทางการศึกษา
                            </Button>
                        </div>
                        {teachingStaff.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    ยังไม่มีข้อมูลในแถวที่ 2 (ครูและบุคลากรทางการศึกษา)
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {teachingStaff.map((s, idx) =>
                                    renderPersonnelCard(s, false, teachingStaff, idx)
                                )}
                            </div>
                        )}
                    </div>

                    {/* แถวที่ 3: บุคลากรสายสนับสนุน */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="font-bold px-3 py-1">
                                    แถวที่ 3
                                </Badge>
                                <h2 className="text-xl font-bold text-foreground">
                                    บุคลากรสายสนับสนุน ({supportStaff.length})
                                </h2>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(undefined, 'support')}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                เพิ่มบุคลากรสายสนับสนุน
                            </Button>
                        </div>
                        {supportStaff.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    ยังไม่มีข้อมูลในแถวที่ 3 (บุคลากรสายสนับสนุน)
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {supportStaff.map((s, idx) =>
                                    renderPersonnelCard(s, false, supportStaff, idx)
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="director">
                    {directors.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูลผู้อำนวยการ</h3>
                                <Button onClick={() => handleOpenDialog(undefined, 'director')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    เพิ่มผู้อำนวยการ
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div
                            className={
                                directors.length === 1
                                    ? 'flex justify-center'
                                    : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                            }
                        >
                            {directors.map((d, idx) =>
                                renderPersonnelCard(d, directors.length === 1, directors, idx)
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="teaching">
                    {teachingStaff.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">
                                    ยังไม่มีข้อมูลครูและบุคลากรทางการศึกษา
                                </h3>
                                <Button onClick={() => handleOpenDialog(undefined, 'teaching')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    เพิ่มครูและบุคลากรทางการศึกษา
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {teachingStaff.map((staff, idx) =>
                                renderPersonnelCard(staff, false, teachingStaff, idx)
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="support">
                    {supportStaff.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">
                                    ยังไม่มีข้อมูลบุคลากรสายสนับสนุน
                                </h3>
                                <Button onClick={() => handleOpenDialog(undefined, 'support')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    เพิ่มบุคลากรสายสนับสนุน
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {supportStaff.map((staff, idx) =>
                                renderPersonnelCard(staff, false, supportStaff, idx)
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
