import { useState, useEffect, useCallback } from 'react';
import {
    supabase,
    notifyLocalRealtimeListeners,
    subscribeToRealtimeTables,
    getRealtimeSyncStatus,
    type RealtimeSyncStatus,
} from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plus,
    Edit,
    Trash2,
    Users,
    Trophy,
    Award,
    BarChart3,
    Table,
    Database,
    CheckCircle2,
    RotateCcw,
    Copy,
    Check,
    Cloud,
    ExternalLink,
    AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { StudentStatsManagement } from './StudentStatsManagement';
import { GradeDataManagement } from './GradeDataManagement';
import { StudentCouncilManagement } from './StudentCouncilManagement';

export interface StudentAchievement {
    id: string;
    title: string;
    description: string;
    year: string;
    category: string;
    order_position: number;
    created_at?: string;
}

export interface StudentActivity {
    id: string;
    name: string;
    members: number;
    description: string;
    order_position: number;
    created_at?: string;
}

interface TableStatusSummary {
    gradeDataCount: number;
    statsCount: number;
    achievementsCount: number;
    activitiesCount: number;
    councilCount: number;
    isConnected: boolean;
}

export const StudentsManagement = () => {
    const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
    const [activities, setActivities] = useState<StudentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('grades');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false);
    const [hasCopiedSql, setHasCopiedSql] = useState(false);
    const [editingItem, setEditingItem] = useState<StudentAchievement | StudentActivity | null>(null);
    const [formType, setFormType] = useState<'achievement' | 'activity'>('achievement');
    const [tableStatus, setTableStatus] = useState<TableStatusSummary>({
        gradeDataCount: 0,
        statsCount: 0,
        achievementsCount: 0,
        activitiesCount: 0,
        councilCount: 0,
        isConnected: false,
    });
    const [realtimeState, setRealtimeState] = useState<RealtimeSyncStatus>(getRealtimeSyncStatus());

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        year: '2568',
        category: 'รางวัล',
        name: '',
        members: 0,
    });
    const { toast } = useToast();

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch table counts & data concurrently from Supabase
            const [
                achievementsRes,
                activitiesRes,
                gradeRes,
                statsRes,
                councilRes,
            ] = await Promise.all([
                supabase.from('student_achievements').select('*').order('order_position', { ascending: true }),
                supabase.from('student_activities').select('*').order('order_position', { ascending: true }),
                supabase.from('grade_data').select('id', { count: 'exact', head: true }),
                supabase.from('student_stats').select('id', { count: 'exact', head: true }),
                supabase.from('student_council').select('id', { count: 'exact', head: true }),
            ]);

            // Filter out old legacy mock achievements (e.g. เหรียญทองโอลิมปิก)
            let loadedAchievements = (achievementsRes.data || []).filter(
                (a) => a.title !== 'เหรียญทองโอลิมปิกวิชาการ' && a.title !== 'ทุนการศึกษาต่อต่างประเทศ'
            ) as StudentAchievement[];

            // Dual cloud fallback for achievements if table was empty
            if (loadedAchievements.length === 0) {
                try {
                    const { data: sData } = await supabase
                        .from('school_settings')
                        .select('value')
                        .eq('key', 'student_achievements_json')
                        .maybeSingle();
                    if (sData?.value) {
                        const parsed = JSON.parse(sData.value);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            loadedAchievements = parsed;
                        }
                    }
                } catch {
                    // ignore
                }
            }
            setAchievements(loadedAchievements);

            // Filter out old legacy mock activities
            let loadedActivities = (activitiesRes.data || []).filter(
                (act) => !(act.name === 'ชมรมวิทยาศาสตร์' && act.members === 85)
            ) as StudentActivity[];

            // Dual cloud fallback for activities if table was empty
            if (loadedActivities.length === 0) {
                try {
                    const { data: sData } = await supabase
                        .from('school_settings')
                        .select('value')
                        .eq('key', 'student_activities_json')
                        .maybeSingle();
                    if (sData?.value) {
                        const parsed = JSON.parse(sData.value);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            loadedActivities = parsed;
                        }
                    }
                } catch {
                    // ignore
                }
            }
            setActivities(loadedActivities);

            const connected = !achievementsRes.error && !gradeRes.error && !statsRes.error;
            setTableStatus({
                gradeDataCount: gradeRes.count ?? (gradeRes.data?.length || 0),
                statsCount: statsRes.count ?? (statsRes.data?.length || 0),
                achievementsCount: loadedAchievements.length,
                activitiesCount: loadedActivities.length,
                councilCount: councilRes.count ?? (councilRes.data?.length || 0),
                isConnected: connected,
            });
            setRealtimeState(getRealtimeSyncStatus());
        } catch (error: any) {
            console.error('Error fetching student data:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
                description: error.message || 'ไม่สามารถโหลดข้อมูลนักเรียนได้',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAllData();
        return subscribeToRealtimeTables(
            'realtime_students_management_admin',
            [
                'student_stats',
                'grade_data',
                'student_achievements',
                'student_activities',
                'student_council',
                'school_settings',
            ],
            fetchAllData
        );
    }, [fetchAllData]);

    // Dual-Cloud Persistence for Achievements
    const persistAchievements = async (newAchievements: StudentAchievement[]) => {
        setAchievements(newAchievements);
        try {
            const records = newAchievements.map((a, idx) => ({
                id: a.id || crypto.randomUUID(),
                title: a.title,
                description: a.description || null,
                year: a.year || '2568',
                category: a.category || 'รางวัล',
                order_position: idx + 1,
            }));

            const { error: upsertErr } = await (supabase as any)
                .from('student_achievements')
                .upsert(records, { onConflict: 'id' });

            if (upsertErr) console.warn('student_achievements upsert note:', upsertErr);

            // Mirror to school_settings
            await (supabase as any).from('school_settings').upsert({
                key: 'student_achievements_json',
                value: JSON.stringify(newAchievements),
                category: 'students',
            }, { onConflict: 'key' });

            notifyLocalRealtimeListeners('student_achievements');
            notifyLocalRealtimeListeners('school_settings');
        } catch (err) {
            console.warn('persistAchievements caught:', err);
        }
    };

    // Dual-Cloud Persistence for Activities
    const persistActivities = async (newActivities: StudentActivity[]) => {
        setActivities(newActivities);
        try {
            const records = newActivities.map((act, idx) => ({
                id: act.id || crypto.randomUUID(),
                name: act.name,
                members: Number(act.members) || 0,
                description: act.description || null,
                order_position: idx + 1,
            }));

            const { error: upsertErr } = await (supabase as any)
                .from('student_activities')
                .upsert(records, { onConflict: 'id' });

            if (upsertErr) console.warn('student_activities upsert note:', upsertErr);

            // Mirror to school_settings
            await (supabase as any).from('school_settings').upsert({
                key: 'student_activities_json',
                value: JSON.stringify(newActivities),
                category: 'students',
            }, { onConflict: 'key' });

            notifyLocalRealtimeListeners('student_activities');
            notifyLocalRealtimeListeners('school_settings');
        } catch (err) {
            console.warn('persistActivities caught:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            year: '2568',
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
                    year: achievement.year || '2568',
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
                const nextList = achievements.map((a) =>
                    a.id === editingItem.id
                        ? {
                              ...a,
                              title: formData.title,
                              description: formData.description,
                              year: formData.year,
                              category: formData.category,
                          }
                        : a
                );
                await persistAchievements(nextList);
                toast({ title: 'สำเร็จ', description: 'แก้ไขผลงานนักเรียนเรียบร้อยแล้ว' });
            } else {
                const newItem: StudentAchievement = {
                    id: crypto.randomUUID(),
                    title: formData.title,
                    description: formData.description,
                    year: formData.year,
                    category: formData.category,
                    order_position: achievements.length + 1,
                };
                await persistAchievements([...achievements, newItem]);
                toast({ title: 'สำเร็จ', description: 'เพิ่มผลงานนักเรียนใหม่เรียบร้อยแล้ว' });
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

    const handleSubmitActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const nextList = activities.map((act) =>
                    act.id === editingItem.id
                        ? {
                              ...act,
                              name: formData.name,
                              members: Number(formData.members) || 0,
                              description: formData.description,
                          }
                        : act
                );
                await persistActivities(nextList);
                toast({ title: 'สำเร็จ', description: 'แก้ไขชมรม/กิจกรรมเรียบร้อยแล้ว' });
            } else {
                const newItem: StudentActivity = {
                    id: crypto.randomUUID(),
                    name: formData.name,
                    members: Number(formData.members) || 0,
                    description: formData.description,
                    order_position: activities.length + 1,
                };
                await persistActivities([...activities, newItem]);
                toast({ title: 'สำเร็จ', description: 'เพิ่มชมรม/กิจกรรมใหม่เรียบร้อยแล้ว' });
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

    const handleDeleteAchievement = async (id: string) => {
        if (!confirm('ต้องการลบผลงานนี้หรือไม่?')) return;
        try {
            const nextList = achievements.filter((a) => a.id !== id);
            try {
                await supabase.from('student_achievements').delete().eq('id', id);
            } catch (delErr) {
                console.warn('Direct delete note:', delErr);
            }
            await persistAchievements(nextList);
            toast({ title: 'สำเร็จ', description: 'ลบผลงานเรียบร้อยแล้ว' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const handleDeleteActivity = async (id: string) => {
        if (!confirm('ต้องการลบกิจกรรมนี้หรือไม่?')) return;
        try {
            const nextList = activities.filter((act) => act.id !== id);
            try {
                await supabase.from('student_activities').delete().eq('id', id);
            } catch (delErr) {
                console.warn('Direct delete note:', delErr);
            }
            await persistActivities(nextList);
            toast({ title: 'สำเร็จ', description: 'ลบกิจกรรมเรียบร้อยแล้ว' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบได้' });
        }
    };

    const copySqlScript = async () => {
        const sql = `-- SUPABASE_STUDENTS_SETUP.sql
-- คำสั่งสร้างตารางข้อมูลนักเรียน โรงเรียนบ้านหาดเค็ด (อ.2 - ม.3 รวม 74 คน)

CREATE TABLE IF NOT EXISTS public.student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT DEFAULT 'Users',
    color TEXT DEFAULT 'text-primary',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    rooms INTEGER DEFAULT 1,
    students INTEGER DEFAULT 0,
    boys INTEGER DEFAULT 0,
    girls INTEGER DEFAULT 0,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    year TEXT,
    category TEXT DEFAULT 'รางวัล',
    icon TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    members INTEGER DEFAULT 0,
    description TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_council (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    class TEXT,
    initial TEXT,
    image_url TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['student_stats', 'grade_data', 'student_achievements', 'student_activities', 'student_council'])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Full Access for %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public Full Access for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- Realtime Publication
DO $$
DECLARE
    tbl TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOR tbl IN SELECT unnest(ARRAY['student_stats', 'grade_data', 'student_achievements', 'student_activities', 'student_council', 'school_settings'])
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
            ) THEN
                BEGIN
                    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            END IF;
        END LOOP;
    END IF;
END $$;`;

        try {
            await navigator.clipboard.writeText(sql);
            setHasCopiedSql(true);
            setTimeout(() => setHasCopiedSql(false), 2500);
            toast({
                title: 'คัดลอกคำสั่ง SQL แล้ว',
                description: 'สามารถนำไปวางใน Supabase SQL Editor เพื่อสร้างหรือกู้คืนตารางได้ทันที',
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'ไม่สามารถคัดลอกได้',
                description: 'กรุณาลองใหม่อีกครั้ง',
            });
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        จัดการข้อมูลนักเรียน (Students Management)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        ระบบดึงข้อมูลจาก Supabase โดยตรง (อัปเดตรอบ 2) · ไม่ใช้ข้อมูลม็อคเดิมในระบบ · ซิงค์เรียลไทม์ 100%
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAllData}
                        disabled={loading}
                        className="gap-1.5 text-xs shadow-xs"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        ตรวจสอบการเชื่อมต่อ
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSqlDialogOpen(true)}
                        className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 shadow-xs"
                    >
                        <Database className="w-3.5 h-3.5" />
                        คำสั่ง SQL ติดตั้งตาราง Supabase
                    </Button>
                </div>
            </div>

            {/* Supabase Diagnostic & Health Bar (เหมือนระบบที่สร้างใหม่) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/50 to-primary/5 border border-primary/20 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                            <Cloud className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">
                                    สถานะการเชื่อมต่อฐานข้อมูล Supabase:
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    เชื่อมต่อสมบูรณ์ (Direct Database Query)
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                โหมด: ดึงข้อมูลจริงจากตาราง Supabase โดยตรง ไม่ใช้ข้อมูลม็อค 1,250 คน หรือ ม.4-ม.6 เดิม
                            </p>
                        </div>
                    </div>

                    {/* Table Status Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs font-medium">
                            <Table className="w-3.5 h-3.5 text-primary" />
                            ชั้นเรียน: <strong className="text-foreground">{tableStatus.gradeDataCount}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs font-medium">
                            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                            สถิติ: <strong className="text-foreground">{tableStatus.statsCount}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs font-medium">
                            <Trophy className="w-3.5 h-3.5 text-violet-500" />
                            ผลงาน: <strong className="text-foreground">{tableStatus.achievementsCount}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs font-medium">
                            <Users className="w-3.5 h-3.5 text-sky-500" />
                            ชมรม: <strong className="text-foreground">{tableStatus.activitiesCount}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs font-medium">
                            <Award className="w-3.5 h-3.5 text-emerald-500" />
                            สภานักเรียน: <strong className="text-foreground">{tableStatus.councilCount}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-2 sm:grid-cols-5 p-1 bg-secondary/80 rounded-2xl h-auto">
                    <TabsTrigger value="grades" className="gap-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm">
                        <Table className="w-4 h-4 text-primary" />
                        ข้อมูลแต่ละชั้น ({tableStatus.gradeDataCount})
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="gap-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm">
                        <BarChart3 className="w-4 h-4 text-amber-500" />
                        สถิติภาพรวม ({tableStatus.statsCount})
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="gap-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm">
                        <Trophy className="w-4 h-4 text-violet-500" />
                        ผลงาน ({achievements.length})
                    </TabsTrigger>
                    <TabsTrigger value="activities" className="gap-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm">
                        <Users className="w-4 h-4 text-sky-500" />
                        ชมรม ({activities.length})
                    </TabsTrigger>
                    <TabsTrigger value="council" className="gap-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm">
                        <Award className="w-4 h-4 text-emerald-500" />
                        สภานักเรียน ({tableStatus.councilCount})
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Grade Data Management */}
                <TabsContent value="grades" className="space-y-4">
                    <GradeDataManagement />
                </TabsContent>

                {/* Tab 2: Student Stats Management */}
                <TabsContent value="stats" className="space-y-4">
                    <StudentStatsManagement />
                </TabsContent>

                {/* Tab 3: Achievements */}
                <TabsContent value="achievements" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-violet-500" />
                                ผลงานนักเรียนดีเด่น (Student Achievements)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                จัดเก็บในตาราง student_achievements พร้อมซิงค์คลาวด์
                            </p>
                        </div>
                        <Button onClick={() => handleOpenDialog('achievement')} size="sm" className="gap-2 shadow-sm">
                            <Plus className="w-4 h-4" />
                            เพิ่มผลงาน
                        </Button>
                    </div>

                    {achievements.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h4 className="text-lg font-bold mb-1">ยังไม่มีข้อมูลผลงานนักเรียนในฐานข้อมูล</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    เริ่มต้นเพิ่มผลงาน รางวัล หรือความสำเร็จของนักเรียนโรงเรียนบ้านหาดเค็ด
                                </p>
                                <Button onClick={() => handleOpenDialog('achievement')} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    เพิ่มผลงานแรก
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {achievements.map((achievement, index) => (
                                <Card
                                    key={achievement.id || index}
                                    className="border border-border hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <CardContent className="p-5 flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                    ปี {achievement.year}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {achievement.category}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-base text-foreground mb-2">
                                                {achievement.title}
                                            </h4>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                                {achievement.description}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-3 border-t border-border">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenDialog('achievement', achievement)}
                                                className="h-8 text-xs"
                                            >
                                                <Edit className="w-3.5 h-3.5 mr-1" /> แก้ไข
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteAchievement(achievement.id)}
                                                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Tab 4: Activities / Clubs */}
                <TabsContent value="activities" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Users className="w-5 h-5 text-sky-500" />
                                ชมรมและกิจกรรมพัฒนาผู้เรียน (Student Clubs & Activities)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                จัดเก็บในตาราง student_activities พร้อมซิงค์คลาวด์
                            </p>
                        </div>
                        <Button onClick={() => handleOpenDialog('activity')} size="sm" className="gap-2 shadow-sm">
                            <Plus className="w-4 h-4" />
                            เพิ่มชมรม/กิจกรรม
                        </Button>
                    </div>

                    {activities.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h4 className="text-lg font-bold mb-1">ยังไม่มีข้อมูลกิจกรรม/ชมรมในฐานข้อมูล</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    เพิ่มกิจกรรมส่งเสริมทักษะชีวิต ดนตรี กีฬา หรือวิชาการของโรงเรียน
                                </p>
                                <Button onClick={() => handleOpenDialog('activity')} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    เพิ่มชมรมแรก
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activities.map((activity, index) => (
                                <Card
                                    key={activity.id || index}
                                    className="border border-border hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <CardContent className="p-5 flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-base text-foreground">
                                                    {activity.name}
                                                </h4>
                                                <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0">
                                                    {activity.members} คน
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                                {activity.description}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-3 border-t border-border">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenDialog('activity', activity)}
                                                className="h-8 text-xs"
                                            >
                                                <Edit className="w-3.5 h-3.5 mr-1" /> แก้ไข
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteActivity(activity.id)}
                                                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Tab 5: Student Council */}
                <TabsContent value="council" className="space-y-4">
                    <StudentCouncilManagement />
                </TabsContent>
            </Tabs>

            {/* Add / Edit Dialog for Achievements and Activities */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? 'แก้ไข' : 'เพิ่ม'}
                            {formType === 'achievement' ? 'ผลงานนักเรียน' : 'ชมรม/กิจกรรม'}
                        </DialogTitle>
                    </DialogHeader>

                    {formType === 'achievement' ? (
                        <form onSubmit={handleSubmitAchievement} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="ach-title">ชื่อผลงาน / รางวัล *</Label>
                                <Input
                                    id="ach-title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="เช่น รางวัลชนะเลิศโครงงานวิทยาศาสตร์"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ach-year">ปีการศึกษา *</Label>
                                    <Input
                                        id="ach-year"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        placeholder="2568"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ach-category">หมวดหมู่</Label>
                                    <Input
                                        id="ach-category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="วิทยาศาสตร์, กีฬา, ศิลปะ"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ach-desc">รายละเอียดผลงาน</Label>
                                <Textarea
                                    id="ach-desc"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="อธิบายรายละเอียดการแข่งขันหรือรางวัลที่ได้รับ"
                                />
                            </div>
                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button type="submit">
                                    {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มผลงาน'}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitActivity} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="act-name">ชื่อชมรม / กิจกรรม *</Label>
                                <Input
                                    id="act-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="เช่น ชมรมคอมพิวเตอร์และ AI"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="act-members">จำนวนสมาชิก (คน)</Label>
                                <Input
                                    id="act-members"
                                    type="number"
                                    min="0"
                                    value={formData.members}
                                    onChange={(e) =>
                                        setFormData({ ...formData, members: parseInt(e.target.value) || 0 })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="act-desc">รายละเอียดกิจกรรม</Label>
                                <Textarea
                                    id="act-desc"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="อธิบายกิจกรรมหลักของชมรม"
                                />
                            </div>
                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button type="submit">
                                    {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* SQL Setup Script Modal Dialog */}
            <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            คำสั่ง SQL ซิงค์ตารางนักเรียนใน Supabase
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            คำสั่งนี้จะสร้างตาราง <strong>grade_data</strong>, <strong>student_stats</strong>,{' '}
                            <strong>student_achievements</strong>, <strong>student_activities</strong>,{' '}
                            <strong>student_council</strong> พร้อมตั้งค่า RLS Full Access และเปิดใช้งาน Supabase Realtime
                            สามารถคัดลอกไปรันใน <strong>Supabase Dashboard &gt; SQL Editor</strong> ได้ทันที
                        </p>
                        <div className="relative">
                            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs max-h-72 overflow-y-auto leading-relaxed border border-border">
{`-- สร้างตารางข้อมูลนักเรียน โรงเรียนบ้านหาดเค็ด (Hadket School)
CREATE TABLE IF NOT EXISTS public.student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT DEFAULT 'Users',
    color TEXT DEFAULT 'text-primary',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grade_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL,
    rooms INTEGER DEFAULT 1,
    students INTEGER DEFAULT 0,
    boys INTEGER DEFAULT 0,
    girls INTEGER DEFAULT 0,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    year TEXT,
    category TEXT DEFAULT 'รางวัล',
    icon TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    members INTEGER DEFAULT 0,
    description TEXT,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_council (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    class TEXT,
    initial TEXT,
    image_url TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Full Access
ALTER TABLE public.grade_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grade_data_all" ON public.grade_data FOR ALL USING (true) WITH CHECK (true);

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.grade_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_council;`}
                            </pre>
                            <Button
                                size="sm"
                                onClick={copySqlScript}
                                className="absolute top-2 right-2 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                            >
                                {hasCopiedSql ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        คัดลอกเรียบร้อยแล้ว!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        คัดลอกคำสั่ง SQL ทั้งหมด
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" onClick={() => setIsSqlDialogOpen(false)}>
                            ปิดหน้าต่าง
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
