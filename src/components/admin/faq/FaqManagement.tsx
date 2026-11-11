import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Faq {
    id: string;
    question: string;
    answer: string;
    order_position: number;
    is_active: boolean;
}

export const FaqManagement = () => {
    const [faqItems, setFaqItems] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchFaqItems();
    }, []);

    const fetchFaqItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('faq')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setFaqItems(data || []);
        } catch (error: any) {
            console.error('Error fetching FAQ:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูล FAQ ได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            question: '',
            answer: '',
            is_active: true,
        });
        setEditingFaq(null);
    };

    const handleOpenDialog = (faq?: Faq) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                is_active: faq.is_active,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingFaq) {
                const { error } = await supabase
                    .from('faq')
                    .update({
                        question: formData.question,
                        answer: formData.answer,
                        is_active: formData.is_active,
                    })
                    .eq('id', editingFaq.id);

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'แก้ไข FAQ เรียบร้อยแล้ว',
                });
            } else {
                const maxOrder = faqItems.length > 0
                    ? Math.max(...faqItems.map(f => f.order_position))
                    : 0;

                const { error } = await supabase
                    .from('faq')
                    .insert({
                        question: formData.question,
                        answer: formData.answer,
                        is_active: formData.is_active,
                        order_position: maxOrder + 1,
                    });

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'เพิ่ม FAQ ใหม่เรียบร้อยแล้ว',
                });
            }

            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('faq');
            fetchFaqItems();
        } catch (error: any) {
            console.error('Error saving FAQ:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบ FAQ นี้หรือไม่?')) return;

        try {
            const { error } = await supabase
                .from('faq')
                .delete()
                .eq('id', id);

            if (error) throw error;

            notifyLocalRealtimeListeners('faq');
            toast({
                title: 'สำเร็จ',
                description: 'ลบ FAQ เรียบร้อยแล้ว',
            });

            fetchFaqItems();
        } catch (error: any) {
            console.error('Error deleting FAQ:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถลบข้อมูลได้',
            });
        }
    };

    const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= faqItems.length) return;
        const clone = [...faqItems];
        const [moved] = clone.splice(index, 1);
        clone.splice(targetIndex, 0, moved);
        const reordered = clone.map((item, idx) => ({ ...item, order_position: idx + 1 }));
        setFaqItems(reordered);
        try {
            await Promise.all(
                reordered.map((item) =>
                    supabase.from('faq').update({ order_position: item.order_position }).eq('id', item.id)
                )
            );
            notifyLocalRealtimeListeners('faq');
            toast({ title: 'จัดเรียงสำเร็จ', description: 'บันทึกลำดับคำถามที่พบบ่อยแล้ว' });
        } catch {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถจัดเรียงได้' });
            fetchFaqItems();
        }
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
                    <h1 className="text-3xl font-bold text-foreground">จัดการ FAQ</h1>
                    <p className="text-muted-foreground mt-1">คำถามที่พบบ่อย - แสดงในหน้าติดต่อเรา</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่ม FAQ
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingFaq ? 'แก้ไข FAQ' : 'เพิ่ม FAQ ใหม่'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="question">คำถาม *</Label>
                                <Input
                                    id="question"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="ค่าธรรมเนียมการศึกษาเท่าไหร่?"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="answer">คำตอบ *</Label>
                                <Textarea
                                    id="answer"
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                    placeholder="ค่าธรรมเนียมการศึกษาต่อภาคเรียน..."
                                    rows={4}
                                    required
                                />
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
                                    {editingFaq ? 'บันทึก' : 'เพิ่ม'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {faqItems.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <HelpCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มี FAQ</h3>
                        <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มคำถามที่พบบ่อยได้เลย</p>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่ม FAQ แรก
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {faqItems.map((faq, idx) => (
                        <Card key={faq.id} className={`${!faq.is_active ? 'opacity-50' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <HelpCircle className="w-5 h-5 text-primary" />
                                            <h3 className="font-bold text-foreground">{faq.question}</h3>
                                            {!faq.is_active && (
                                                <span className="text-xs bg-muted px-2 py-1 rounded">ซ่อน</span>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground text-sm pl-7">{faq.answer}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={idx === 0} onClick={() => handleMoveOrder(idx, 'up')}><ArrowUp className="w-3.5 h-3.5" /></Button>
                                        <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={idx === faqItems.length - 1} onClick={() => handleMoveOrder(idx, 'down')}><ArrowDown className="w-3.5 h-3.5" /></Button>
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(faq)}>
                                            <Edit className="w-4 h-4 mr-1" />
                                            แก้ไข
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(faq.id)}>
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            ลบ
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
