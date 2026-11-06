import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';

interface Setting {
    key: string;
    value: string | null;
    category: string;
    description: string | null;
}

export const SettingsManagement = () => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('school_settings')
                .select('*');

            if (error) throw error;

            const settingsMap: Record<string, string> = {};
            (data as any[])?.forEach((setting: any) => {
                settingsMap[setting.key] = setting.value || '';
            });
            setSettings(settingsMap);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดการตั้งค่าได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Upsert each setting
            const updates = Object.entries(settings).map(([key, value]) => ({
                key,
                value,
            }));

            for (const update of updates) {
                const { error } = await supabase
                    .from('school_settings')
                    .upsert(
                        { key: update.key, value: update.value } as any,
                        { onConflict: 'key' }
                    );

                if (error) throw error;
            }

            // Clear cached settings so changes reflect immediately across the site
            localStorage.removeItem('school_settings_cache');

            toast({
                title: 'สำเร็จ',
                description: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setSaving(false);
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
        <div className="p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">ตั้งค่าระบบ</h1>
                    <p className="text-muted-foreground">จัดการข้อมูลและการตั้งค่าโรงเรียน</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </Button>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            ข้อมูลทั่วไป
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6 p-4 rounded-xl bg-secondary/40 border border-border">
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 font-semibold">
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                    รูปโลโก้โรงเรียน
                                </Label>
                                <ImageUpload
                                    currentImage={settings.school_logo_url || ''}
                                    onUploadComplete={(url) => handleChange('school_logo_url', url)}
                                    folder="school_logo"
                                    compressionPreset="avatar"
                                />
                                <div className="space-y-1.5">
                                    <Label htmlFor="school_logo_url" className="text-xs text-muted-foreground">
                                        หรือใส่ลิงก์รูปภาพโลโก้ (URL) โดยตรง
                                    </Label>
                                    <Input
                                        id="school_logo_url"
                                        value={settings.school_logo_url || ''}
                                        onChange={(e) => handleChange('school_logo_url', e.target.value)}
                                        placeholder="https://... หรือ /logo.png"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="school_short_name">อักษรย่อโรงเรียน (ใช้แสดงเมื่อไม่มีรูปโลโก้)</Label>
                                    <Input
                                        id="school_short_name"
                                        value={settings.school_short_name || ''}
                                        onChange={(e) => handleChange('school_short_name', e.target.value)}
                                        placeholder="วค"
                                        maxLength={6}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        หากไม่ได้อัปโหลดรูปโลโก้ ระบบจะแสดงวงกลมพร้อมตัวอักษรย่อนี้แทน
                                    </p>
                                </div>

                                <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">ตัวอย่างการแสดงผลบนแถบเมนู:</p>
                                    <div className="flex items-center gap-3 p-2 rounded-lg bg-primary text-primary-foreground">
                                        {settings.school_logo_url ? (
                                            <img
                                                src={settings.school_logo_url}
                                                alt="Logo Preview"
                                                className="w-12 h-12 rounded-full object-contain bg-white p-0.5 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                                                <span className="text-accent-foreground font-bold text-xl">
                                                    {settings.school_short_name || 'วค'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate">
                                                {settings.school_name || 'โรงเรียนห้องสื่อครูคอมวิทยาคม'}
                                            </p>
                                            <p className="text-xs text-primary-foreground/75 truncate">
                                                {settings.school_tagline || 'ก้าวสู่อนาคตด้วยปัญญา'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="school_name">ชื่อโรงเรียน</Label>
                            <Input
                                id="school_name"
                                value={settings.school_name || ''}
                                onChange={(e) => handleChange('school_name', e.target.value)}
                                placeholder="โรงเรียน..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="school_tagline">คำขวัญ/Tagline</Label>
                            <Input
                                id="school_tagline"
                                value={settings.school_tagline || ''}
                                onChange={(e) => handleChange('school_tagline', e.target.value)}
                                placeholder="ก้าวสู่อนาคตด้วยปัญญา"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="academic_year">ปีการศึกษาปัจจุบัน</Label>
                            <Input
                                id="academic_year"
                                value={settings.academic_year || ''}
                                onChange={(e) => handleChange('academic_year', e.target.value)}
                                placeholder="2568"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="school_description">คำอธิบายโรงเรียน (แสดงใน Hero Section)</Label>
                            <textarea
                                id="school_description"
                                value={settings.school_description || ''}
                                onChange={(e) => handleChange('school_description', e.target.value)}
                                placeholder="สถาบันการศึกษาชั้นนำระดับมัธยมศึกษา..."
                                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Hero Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>ส่วน Hero (หน้าแรก)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hero_badge">ข้อความ Badge (เช่น เปิดรับสมัครนักเรียนใหม่)</Label>
                            <Input
                                id="hero_badge"
                                value={settings.hero_badge || ''}
                                onChange={(e) => handleChange('hero_badge', e.target.value)}
                                placeholder="เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2568"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hero_title_1">ข้อความหัวเรื่อง บรรทัด 1</Label>
                            <Input
                                id="hero_title_1"
                                value={settings.hero_title_1 || ''}
                                onChange={(e) => handleChange('hero_title_1', e.target.value)}
                                placeholder="ก้าวสู่อนาคต"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hero_title_2">ข้อความหัวเรื่อง บรรทัด 2 (สีเน้น)</Label>
                            <Input
                                id="hero_title_2"
                                value={settings.hero_title_2 || ''}
                                onChange={(e) => handleChange('hero_title_2', e.target.value)}
                                placeholder="ด้วยปัญญา"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>สถิติโรงเรียน (แสดงใน Hero Section)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stat_students">จำนวนนักเรียน</Label>
                                <Input
                                    id="stat_students"
                                    value={settings.stat_students || ''}
                                    onChange={(e) => handleChange('stat_students', e.target.value)}
                                    placeholder="2,500+"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stat_students_label">Label</Label>
                                <Input
                                    id="stat_students_label"
                                    value={settings.stat_students_label || ''}
                                    onChange={(e) => handleChange('stat_students_label', e.target.value)}
                                    placeholder="นักเรียน"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stat_university">อัตราเข้ามหาวิทยาลัย</Label>
                                <Input
                                    id="stat_university"
                                    value={settings.stat_university || ''}
                                    onChange={(e) => handleChange('stat_university', e.target.value)}
                                    placeholder="98%"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stat_university_label">Label</Label>
                                <Input
                                    id="stat_university_label"
                                    value={settings.stat_university_label || ''}
                                    onChange={(e) => handleChange('stat_university_label', e.target.value)}
                                    placeholder="ผ่านเข้ามหาวิทยาลัย"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stat_years">จำนวนปีก่อตั้ง</Label>
                                <Input
                                    id="stat_years"
                                    value={settings.stat_years || ''}
                                    onChange={(e) => handleChange('stat_years', e.target.value)}
                                    placeholder="50+"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stat_years_label">Label</Label>
                                <Input
                                    id="stat_years_label"
                                    value={settings.stat_years_label || ''}
                                    onChange={(e) => handleChange('stat_years_label', e.target.value)}
                                    placeholder="ปีแห่งความเป็นเลิศ"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vision/Mission/Values */}
                <Card>
                    <CardHeader>
                        <CardTitle>วิสัยทัศน์ พันธกิจ ค่านิยม</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="school_vision">วิสัยทัศน์</Label>
                            <textarea
                                id="school_vision"
                                value={settings.school_vision || ''}
                                onChange={(e) => handleChange('school_vision', e.target.value)}
                                placeholder="เป็นสถานศึกษาชั้นนำที่พัฒนาผู้เรียนให้มีความเป็นเลิศ..."
                                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="school_mission">พันธกิจ</Label>
                            <textarea
                                id="school_mission"
                                value={settings.school_mission || ''}
                                onChange={(e) => handleChange('school_mission', e.target.value)}
                                placeholder="จัดการศึกษาที่มีคุณภาพ พัฒนาหลักสูตรที่ทันสมัย..."
                                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="school_values">ค่านิยม</Label>
                            <textarea
                                id="school_values"
                                value={settings.school_values || ''}
                                onChange={(e) => handleChange('school_values', e.target.value)}
                                placeholder="ความซื่อสัตย์ ความรับผิดชอบ ความเคารพ..."
                                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section Headers */}
                <Card>
                    <CardHeader>
                        <CardTitle>หัวข้อส่วนต่างๆ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="about_title_1">หัวข้อ About ส่วน 1</Label>
                                <Input
                                    id="about_title_1"
                                    value={settings.about_title_1 || ''}
                                    onChange={(e) => handleChange('about_title_1', e.target.value)}
                                    placeholder="สถาบันการศึกษาที่"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="about_title_2">หัวข้อ About ส่วน 2 (สีเน้น)</Label>
                                <Input
                                    id="about_title_2"
                                    value={settings.about_title_2 || ''}
                                    onChange={(e) => handleChange('about_title_2', e.target.value)}
                                    placeholder="ไว้วางใจ"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="curriculum_title_1">หัวข้อ หลักสูตร ส่วน 1</Label>
                                <Input
                                    id="curriculum_title_1"
                                    value={settings.curriculum_title_1 || ''}
                                    onChange={(e) => handleChange('curriculum_title_1', e.target.value)}
                                    placeholder="หลักสูตรที่"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="curriculum_title_2">หัวข้อ หลักสูตร ส่วน 2 (สีเน้น)</Label>
                                <Input
                                    id="curriculum_title_2"
                                    value={settings.curriculum_title_2 || ''}
                                    onChange={(e) => handleChange('curriculum_title_2', e.target.value)}
                                    placeholder="หลากหลาย"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="curriculum_description">คำอธิบายหลักสูตร</Label>
                            <textarea
                                id="curriculum_description"
                                value={settings.curriculum_description || ''}
                                onChange={(e) => handleChange('curriculum_description', e.target.value)}
                                placeholder="เราออกแบบหลักสูตรที่ตอบโจทย์ความสนใจและเป้าหมายของนักเรียนทุกคน..."
                                className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Curriculum Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>สถิติ (หน้าหลักสูตร)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="curriculum_study_time">เวลาเรียน</Label>
                                <Input
                                    id="curriculum_study_time"
                                    value={settings.curriculum_study_time || ''}
                                    onChange={(e) => handleChange('curriculum_study_time', e.target.value)}
                                    placeholder="07:30 - 15:30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="curriculum_class_size">จำนวนนักเรียนต่อห้อง</Label>
                                <Input
                                    id="curriculum_class_size"
                                    value={settings.curriculum_class_size || ''}
                                    onChange={(e) => handleChange('curriculum_class_size', e.target.value)}
                                    placeholder="30-35 คน"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="curriculum_duration">ระยะเวลาหลักสูตร</Label>
                                <Input
                                    id="curriculum_duration"
                                    value={settings.curriculum_duration || ''}
                                    onChange={(e) => handleChange('curriculum_duration', e.target.value)}
                                    placeholder="6 ปี"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="curriculum_duration_label">Label ระยะเวลา</Label>
                                <Input
                                    id="curriculum_duration_label"
                                    value={settings.curriculum_duration_label || ''}
                                    onChange={(e) => handleChange('curriculum_duration_label', e.target.value)}
                                    placeholder="ระยะเวลาหลักสูตร (ม.1-ม.6)"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>สถิติ (ส่วน About - พื้นหลังสีน้ำเงิน)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_1">สถิติ 1 (ปีแห่งประสบการณ์)</Label>
                                <Input
                                    id="about_stat_1"
                                    value={settings.about_stat_1 || ''}
                                    onChange={(e) => handleChange('about_stat_1', e.target.value)}
                                    placeholder="50+"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_1_label">Label</Label>
                                <Input
                                    id="about_stat_1_label"
                                    value={settings.about_stat_1_label || ''}
                                    onChange={(e) => handleChange('about_stat_1_label', e.target.value)}
                                    placeholder="ปีแห่งประสบการณ์"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_2">สถิติ 2 (นักเรียนปัจจุบัน)</Label>
                                <Input
                                    id="about_stat_2"
                                    value={settings.about_stat_2 || ''}
                                    onChange={(e) => handleChange('about_stat_2', e.target.value)}
                                    placeholder="2,500+"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_2_label">Label</Label>
                                <Input
                                    id="about_stat_2_label"
                                    value={settings.about_stat_2_label || ''}
                                    onChange={(e) => handleChange('about_stat_2_label', e.target.value)}
                                    placeholder="นักเรียนปัจจุบัน"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_3">สถิติ 3 (บุคลากร)</Label>
                                <Input
                                    id="about_stat_3"
                                    value={settings.about_stat_3 || ''}
                                    onChange={(e) => handleChange('about_stat_3', e.target.value)}
                                    placeholder="200+"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_3_label">Label</Label>
                                <Input
                                    id="about_stat_3_label"
                                    value={settings.about_stat_3_label || ''}
                                    onChange={(e) => handleChange('about_stat_3_label', e.target.value)}
                                    placeholder="บุคลากรคุณภาพ"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_4">สถิติ 4 (ศิษย์เก่า)</Label>
                                <Input
                                    id="about_stat_4"
                                    value={settings.about_stat_4 || ''}
                                    onChange={(e) => handleChange('about_stat_4', e.target.value)}
                                    placeholder="15,000+"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="about_stat_4_label">Label</Label>
                                <Input
                                    id="about_stat_4_label"
                                    value={settings.about_stat_4_label || ''}
                                    onChange={(e) => handleChange('about_stat_4_label', e.target.value)}
                                    placeholder="ศิษย์เก่าทั่วประเทศ"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลติดต่อ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">เบอร์โทรศัพท์</Label>
                            <Input
                                id="contact_phone"
                                value={settings.contact_phone || ''}
                                onChange={(e) => handleChange('contact_phone', e.target.value)}
                                placeholder="02-xxx-xxxx"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_email">อีเมล</Label>
                            <Input
                                id="contact_email"
                                type="email"
                                value={settings.contact_email || ''}
                                onChange={(e) => handleChange('contact_email', e.target.value)}
                                placeholder="info@school.ac.th"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_address">ที่อยู่</Label>
                            <textarea
                                id="contact_address"
                                value={settings.contact_address || ''}
                                onChange={(e) => handleChange('contact_address', e.target.value)}
                                placeholder="123 ถนน... เขต... จังหวัด..."
                                className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="google_maps_embed">Google Maps Embed URL</Label>
                            <Input
                                id="google_maps_embed"
                                value={settings.google_maps_embed || ''}
                                onChange={(e) => handleChange('google_maps_embed', e.target.value)}
                                placeholder="https://www.google.com/maps/embed?pb=..."
                            />
                            <p className="text-xs text-muted-foreground">
                                คัดลอก URL จาก Google Maps → Share → Embed a map
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media */}
                <Card>
                    <CardHeader>
                        <CardTitle>โซเชียลมีเดีย</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            {(settings.social_links ? JSON.parse(settings.social_links as string) : []).map((link: any, index: number) => (
                                <div key={index} className="flex gap-4 items-start">
                                    <div className="w-1/3">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={link.platform}
                                            onChange={(e) => {
                                                const newLinks = [...(settings.social_links ? JSON.parse(settings.social_links as string) : [])];
                                                newLinks[index].platform = e.target.value;
                                                handleChange('social_links', JSON.stringify(newLinks));
                                            }}
                                        >
                                            <option value="facebook">Facebook</option>
                                            <option value="line">Line</option>
                                            <option value="youtube">Youtube</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="twitter">Twitter/X</option>
                                            <option value="tiktok">TikTok</option>
                                            <option value="website">Website</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            value={link.url}
                                            onChange={(e) => {
                                                const newLinks = [...(settings.social_links ? JSON.parse(settings.social_links as string) : [])];
                                                newLinks[index].url = e.target.value;
                                                handleChange('social_links', JSON.stringify(newLinks));
                                            }}
                                            placeholder="URL (เช่น https://facebook.com/...)"
                                        />
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => {
                                            const newLinks = (settings.social_links ? JSON.parse(settings.social_links as string) : []).filter((_: any, i: number) => i !== index);
                                            handleChange('social_links', JSON.stringify(newLinks));
                                        }}
                                    >
                                        <span className="sr-only">Delete</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 w-4 h-4"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const newLinks = [...(settings.social_links ? JSON.parse(settings.social_links as string) : []), { platform: 'facebook', url: '' }];
                                    handleChange('social_links', JSON.stringify(newLinks));
                                }}
                            >
                                + เพิ่มโซเชียลมีเดีย
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                    <CardHeader>
                        <CardTitle>เอกสารดาวน์โหลด</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="academic_calendar_url">ลิงก์ปฏิทินการศึกษา (PDF)</Label>
                            <Input
                                id="academic_calendar_url"
                                value={settings.academic_calendar_url || ''}
                                onChange={(e) => handleChange('academic_calendar_url', e.target.value)}
                                placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">
                                ใส่ลิงก์ไฟล์ PDF (เช่นจาก Google Drive) หากไม่ใส่ ปุ่มดาวน์โหลดจะไม่ทำงาน
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Services */}
                <Card>
                    <CardHeader>
                        <CardTitle>บริการออนไลน์ (Footer)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3, 4].map((num) => (
                            <div key={num} className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`footer_service_${num}_name`}>ชื่อบริการ {num}</Label>
                                    <Input
                                        id={`footer_service_${num}_name`}
                                        value={settings[`footer_service_${num}_name`] || ''}
                                        onChange={(e) => handleChange(`footer_service_${num}_name`, e.target.value)}
                                        placeholder={`บริการที่ ${num}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`footer_service_${num}_url`}>ลิงก์ (URL)</Label>
                                    <Input
                                        id={`footer_service_${num}_url`}
                                        value={settings[`footer_service_${num}_url`] || ''}
                                        onChange={(e) => handleChange(`footer_service_${num}_url`, e.target.value)}
                                        placeholder="https://... หรือ #"
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
