import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, GraduationCap, Trophy, Users, Award, BarChart3, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { StudentStatsManagement } from './StudentStatsManagement';
import { GradeDataManagement } from './GradeDataManagement';
import { StudentCouncilManagement } from './StudentCouncilManagement';

interface StudentAchievement {
    id: string;
    title: string;
    description: string;
    year: string;
    category: string;
    order_position: number;
}

interface StudentActivity {
    id: string;
    name: string;
    members: number;
    description: string;
    order_position: number;
}

export const StudentsManagement = () => {
    const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
    const [activities, setActivities] = useState<StudentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('achievements');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StudentAchievement | StudentActivity | null>(null);
    const [formType, setFormType] = useState<'achievement' | 'activity'>('achievement');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        year: new Date().getFullYear().toString().replace('20', '25'),
        category: 'รางวัล',
        name: '',
        members: 0,
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch achievements
            const { data: achievementsData, error: achievementsError } = await supabase
                .from('student_achievements')
                .select('*')
                .order('order_position', { ascending: true });

            if (achievementsError) throw achievementsError;
            setAchievements(achievementsData || []);

            // Fetch activities
            const { data: activitiesData, error: activitiesError } = await supabase
                .from('student_activities')
                .select('*')
                .order('order_position', { ascending: true });

            if (activitiesError) throw activitiesError;
            setActivities(activitiesData || []);

        } catch (error: any) {
            console.error('Error fetching data:', error);
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
        setFormData({
            title: '',
            description: '',
            year: new Date().getFullYear().toString().replace('20', '25'),
            category: 'รางวัล',
            name: '',
            members: 0,
        });
        setEditingItem(null);
    };

    const handleOpenDialog = (type: 'achievement' | 'activity', item?: StudentAchievement | StudentActivity) => {
        setFormType(type);
        if (item) {
            setEditingItem(item);
            if (type === 'achievement') {
                const achievement = item as StudentAchievement;
                setFormData({
                    ...formData,
                    title: achievement.title,
                    description: achievement.description || '',
                    year: achievement.year || '',
                    category: achievement.category || 'รางวัล',
                });
            } else {
                const activity = item as StudentActivity;
                setFormData({
                    ...formData,
                    name: activity.name,
                    members: activity.members || 0,
                    description: activity.description || '',
                });
            }
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmitAchievement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from('student_achievements')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        year: formData.year,
                        category: formData.category,
                    })
                    .eq('id', editingItem.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขผลงานเรียบร้อยแล้ว' });
            } else {
                const maxOrder = achievements.length > 0
                    ? Math.max(...achievements.map(a => a.order_position))
                    : 0;
                const { error } = await supabase
                    .from('student_achievements')
                    .insert({
                        title: formData.title,
                        description: formData.description,
                        year: formData.year,
                        category: formData.category,
                        order_position: maxOrder + 1,
                    });
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มผลงานใหม่เรียบร้อยแล้ว' });
            }
            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('student_achievements');
            fetchData();
        } catch (error: any) {
            console.error('Error saving achievement:', error);
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกข้อมูลได้' });
        }
    };

    const handleSubmitActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from('student_activities')
                    .update({
                        name: formData.name,
                        members: formData.members,
                        description: formData.description,
                    })
                    .eq('id', editingItem.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขกิจกรรมเรียบร้อยแล้ว' });
            } else {
                const maxOrder = activities.length > 0
                    ? Math.max(...activities.map(a => a.order_position))
                    : 0;
                const { error } = await supabase
                    .from('student_activities')
                    .insert({
                        name: formData.name,
                        members: formData.members,
                        description: formData.description,
                        order_position: maxOrder + 1,
                    });
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มกิจกรรมใหม่เรียบร้อยแล้ว' });
            }
            setIsDialogOpen(false);
            resetForm();
            notifyLocalRealtimeListeners('student_activities');
            fetchData();
        } catch (error: any) {
            console.error('Error saving activity:', error);
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกข้อมูลได้' });
        }
    };

    const handleDeleteAchievement = async (id: string) => {
        if (!confirm('ต้องการลบผลงานนี้หรือไม่?')) return;
        try {
            const { error } = await supabase.from('student_achievements').delete().eq('id', id);
            if (error) throw error;
            notifyLocalRealtimeListeners('student_achievements');
            toast({ title: 'สำเร็จ', description: 'ลบผลงานเรียบร้อยแล้ว' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleDeleteActivity = async (id: string) => {
        if (!confirm('ต้องการลบกิจกรรมนี้หรือไม่?')) return;
        try {
            const { error } = await supabase.from('student_activities').delete().eq('id', id);
            if (error) throw error;
            notifyLocalRealtimeListeners('student_activities');
            toast({ title: 'สำเร็จ', description: 'ลบกิจกรรมเรียบร้อยแล้ว' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
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
                    <h1 className="text-3xl font-bold text-foreground">จัดการข้อมูลนักเรียน</h1>
                    <p className="text-muted-foreground mt-1">จัดการผลงานนักเรียนและกิจกรรม/ชมรม</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="stats" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        สถิติภาพรวม
                    </TabsTrigger>
                    <TabsTrigger value="grades" className="gap-2">
                        <Table className="w-4 h-4" />
                        ข้อมูลแต่ละชั้น
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="gap-2">
                        <Trophy className="w-4 h-4" />
                        ผลงาน ({achievements.length})
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="gap-2">
                        <Users className="w-4 h-4" />
                        ชมรม ({activities.length})
                    </TabsTrigger>
                    <TabsTrigger value="council" className="gap-2">
                        <Award className="w-4 h-4" />
                        สภานักเรียน
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stats">
                    <StudentStatsManagement />
                </TabsContent>

                <TabsContent value="grades">
                    <GradeDataManagement />
                </TabsContent>

                <TabsContent value="council">
                    <StudentCouncilManagement />
                </TabsContent>

                <TabsContent value="achievements">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => handleOpenDialog('achievement')} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มผลงาน
                        </Button>
                    </div>
                    {achievements.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">ยังไม่มีผลงานนักเรียน</h3>
                                <p className="text-muted-foreground">เริ่มต้นเพิ่มผลงานนักเรียนได้เลย</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {achievements.map((achievement) => (
                                <Card key={achievement.id}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">
                                                {achievement.year}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{achievement.category}</span>
                                        </div>
                                        <h3 className="font-bold text-foreground mb-2">{achievement.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{achievement.description}</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog('achievement', achievement)}>
                                                <Edit className="w-3 h-3 mr-1" /> แก้ไข
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteAchievement(achievement.id)}>
                                                <Trash2 className="w-3 h-3 mr-1" /> ลบ
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="activities">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => handleOpenDialog('activity')} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มชมรม/กิจกรรม
                        </Button>
                    </div>
                    {activities.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">ยังไม่มีกิจกรรม</h3>
                                <p className="text-muted-foreground">เริ่มต้นเพิ่มชมรม/กิจกรรมได้เลย</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activities.map((activity) => (
                                <Card key={activity.id}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-foreground">{activity.name}</h3>
                                            <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-semibold">
                                                {activity.members} คน
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog('activity', activity)}>
                                                <Edit className="w-3 h-3 mr-1" /> แก้ไข
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteActivity(activity.id)}>
                                                <Trash2 className="w-3 h-3 mr-1" /> ลบ
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialog for Achievement */}
            <Dialog open={isDialogOpen && formType === 'achievement'} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAchievement} className="space-y-4">
                        <div className="space-y-2">
                            <Label>หัวข้อ *</Label>
                            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ปี พ.ศ.</Label>
                                <Input value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>หมวดหมู่</Label>
                                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>รายละเอียด</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                            <Button type="submit">{editingItem ? 'บันทึก' : 'เพิ่ม'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog for Activity */}
            <Dialog open={isDialogOpen && formType === 'activity'} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'แก้ไขชมรม/กิจกรรม' : 'เพิ่มชมรม/กิจกรรมใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitActivity} className="space-y-4">
                        <div className="space-y-2">
                            <Label>ชื่อชมรม/กิจกรรม *</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>จำนวนสมาชิก</Label>
                            <Input type="number" value={formData.members} onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label>รายละเอียด</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                            <Button type="submit">{editingItem ? 'บันทึก' : 'เพิ่ม'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
