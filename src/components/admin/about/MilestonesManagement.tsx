import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, History, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { useToast } from '@/hooks/use-toast';

interface Milestone {
    id: string;
    year: string;
    event: string;
    image_url?: string | null;
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
        image_url: '',
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
        setFormData({ year: '', event: '', image_url: '', is_active: true });
        setEditingMilestone(null);
    };

    const handleOpenDialog = (milestone?: Milestone) => {
        if (milestone) {
            setEditingMilestone(milestone);
            setFormData({
                year: milestone.year,
                event: milestone.event,
                image_url: milestone.image_url || '',
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
            const payloadWithImage = {
                year: formData.year.trim(),
                event: formData.event.trim(),
                image_url: formData.image_url.trim() || null,
                is_active: formData.is_active,
            };

            const payloadWithoutImage = {
                year: formData.year.trim(),
                event: formData.event.trim(),
                is_active: formData.is_active,
            };

            if (editingMilestone) {
                let { error } = await supabase
                    .from('milestones')
                    .update(payloadWithImage)
                    .eq('id', editingMilestone.id);

                if (error && (error.message?.includes('image_url') || (error as any).code === '42703')) {
                    console.warn('milestones.image_url column not found, falling back to legacy schema');
                    const retry = await supabase
                        .from('milestones')
                        .update(payloadWithoutImage)
                        .eq('id', editingMilestone.id);
                    error = retry.error;
                }

                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขข้อมูลประวัติเรียบร้อยแล้ว' });
            } else {
                const maxOrder = milestones.length > 0 ? Math.max(...milestones.map(m => m.order_position)) : 0;
                let { error } = await supabase
                    .from('milestones')
                    .insert({
                        ...payloadWithImage,
                        order_position: maxOrder + 1,
                    });

                if (error && (error.message?.includes('image_url') || (error as any).code === '42703')) {
                    console.warn('milestones.image_url column not found, falling back to legacy schema');
                    const retry = await supabase
                        .from('milestones')
                        .insert({
                            ...payloadWithoutImage,
                            order_position: maxOrder + 1,
                        });
                    error = retry.error;
                }

                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มประวัติเรียบร้อยแล้ว' });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('milestones');
            fetchMilestones();
        } catch (error: any) {
            console.error('Error saving milestone:', error);
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกได้' });
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
                    <p className="text-muted-foreground mt-1">จัดการ Timeline ประวัติโรงเรียน เพิ่มปี พ.ศ. ขยายรายละเอียด และรูปภาพประกอบ</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มประวัติ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingMilestone ? 'แก้ไขประวัติความเป็นมา' : 'เพิ่มประวัติใหม่'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="year">ปี พ.ศ. *</Label>
                                <Input
                                    id="year"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    placeholder="เช่น 2517"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event">เหตุการณ์ / รายละเอียดประวัติความเป็นมา *</Label>
                                <Textarea
                                    id="event"
                                    rows={5}
                                    value={formData.event}
                                    onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                                    placeholder="กรอกรายละเอียดเหตุการณ์สำคัญในประวัติโรงเรียน สามารถพิมพ์ข้อความยาวและขึ้นบรรทัดใหม่ได้..."
                                    required
                                    className="resize-y leading-relaxed text-sm"
                                />
                                <p className="text-xs text-muted-foreground">สามารถพิมพ์รายละเอียดความยาวได้ตามต้องการ และขึ้นบรรทัดใหม่เพื่อแบ่งย่อหน้า</p>
                            </div>

                            <div className="space-y-3 pt-1 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="image_url" className="flex items-center gap-1.5 font-medium text-foreground">
                                        <ImageIcon className="w-4 h-4 text-primary" />
                                        รูปภาพประกอบเหตุการณ์ (ไม่บังคับ)
                                    </Label>
                                    {formData.image_url && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, image_url: '' })}
                                            className="h-6 text-xs text-destructive hover:text-destructive px-2"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            ลบรูปภาพ
                                        </Button>
                                    )}
                                </div>

                                <ImageUpload
                                    currentImage={formData.image_url}
                                    onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                                    bucket="images"
                                    folder="milestones"
                                    compressionPreset="cover"
                                />

                                <div className="space-y-1">
                                    <Label htmlFor="image_url_text" className="text-xs text-muted-foreground">หรือระบุ URL รูปภาพโดยตรง</Label>
                                    <Input
                                        id="image_url_text"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="https://example.com/photo.jpg"
                                        className="text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-border">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">แสดงบนเว็บไซต์</Label>
                            </div>

                            <div className="flex gap-2 justify-end pt-3">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                                <Button type="submit">{editingMilestone ? 'บันทึกการแก้ไข' : 'เพิ่มประวัติ'}</Button>
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
                        <p className="text-sm text-muted-foreground mb-4">เริ่มต้นบันทึกประวัติความเป็นมาและเหตุการณ์สำคัญของโรงเรียน</p>
                        <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />เพิ่มประวัติแรก</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {milestones.map((milestone, idx) => (
                        <Card key={milestone.id} className={`${!milestone.is_active ? 'opacity-60 bg-muted/20' : ''}`}>
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                                    <div className="text-2xl font-bold text-primary w-16 shrink-0 pt-0.5 sm:pt-0">{milestone.year}</div>
                                    {milestone.image_url && (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0 bg-slate-900 shadow-xs">
                                            <img
                                                src={milestone.image_url}
                                                alt={milestone.year}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground text-sm sm:text-base line-clamp-2 leading-relaxed whitespace-pre-line">{milestone.event}</p>
                                        {!milestone.is_active && (
                                            <span className="inline-block mt-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                                ซ่อนการแสดงผล
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={idx === 0} onClick={() => handleMoveOrder(idx, 'up')} title="เลื่อนขึ้น"><ArrowUp className="w-3.5 h-3.5" /></Button>
                                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={idx === milestones.length - 1} onClick={() => handleMoveOrder(idx, 'down')} title="เลื่อนลง"><ArrowDown className="w-3.5 h-3.5" /></Button>
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
