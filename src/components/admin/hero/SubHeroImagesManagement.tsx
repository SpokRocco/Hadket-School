import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useToast } from '@/hooks/use-toast';
import {
  Image as ImageIcon,
  Save,
  RotateCcw,
  ExternalLink,
  Eye,
  Sparkles,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-school.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';

const PRESET_SUBHERO_IMAGES = [
  { label: 'ภาพบรรยากาศโรงเรียนหลัก (Hero Campus)', url: heroImage },
  { label: 'ภาพกิจกรรมนักเรียน / พิธีการสำเร็จการศึกษา', url: studentGraduationActivity },
  { label: 'ห้องปฏิบัติการวิทยาศาสตร์ / AI', url: studentScienceLab },
];

export const SubHeroImagesManagement = () => {
  const { settings } = useSchoolSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    about_left_image_url: settings.about_left_image_url || '',
    about_left_image_caption: settings.about_left_image_caption || 'บรรยากาศโรงเรียนบ้านหาดเค็ด',
    about_right_image_url: settings.about_right_image_url || '',
    about_right_image_caption: settings.about_right_image_caption || 'กิจกรรมนักเรียน โรงเรียนบ้านหาดเค็ด',
  });

  // Keep form data in sync if settings update externally
  useEffect(() => {
    setFormData({
      about_left_image_url: settings.about_left_image_url || '',
      about_left_image_caption: settings.about_left_image_caption || 'บรรยากาศโรงเรียนบ้านหาดเค็ด',
      about_right_image_url: settings.about_right_image_url || '',
      about_right_image_caption: settings.about_right_image_caption || 'กิจกรรมนักเรียน โรงเรียนบ้านหาดเค็ด',
    });
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = [
        { key: 'about_left_image_url', value: formData.about_left_image_url },
        { key: 'about_left_image_caption', value: formData.about_left_image_caption },
        { key: 'about_right_image_url', value: formData.about_right_image_url },
        { key: 'about_right_image_caption', value: formData.about_right_image_caption },
      ];

      for (const item of updates) {
        const { error } = await supabase
          .from('school_settings')
          .upsert({ key: item.key, value: item.value } as any, { onConflict: 'key' });
        if (error) {
          console.warn('Upsert note for key:', item.key, error.message);
        }
      }

      // Clear local cache so settings re-fetch immediately
      localStorage.removeItem('school_settings_cache');
      localStorage.removeItem('school_settings_cache_v3');
      notifyLocalRealtimeListeners('school_settings');

      // Dispatch custom DOM event for instant live re-render
      window.dispatchEvent(new CustomEvent('school-settings-updated'));

      toast({
        title: 'บันทึกรูปภาพสำเร็จ',
        description: 'อัปเดตรูปภาพ 2 รูปใต้ภาพสไลด์หัวเว็บเรียบร้อยแล้ว แสดงผลบนหน้าแรกทันที',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData({
      about_left_image_url: '',
      about_left_image_caption: 'บรรยากาศโรงเรียนบ้านหาดเค็ด',
      about_right_image_url: '',
      about_right_image_caption: 'กิจกรรมนักเรียน โรงเรียนบ้านหาดเค็ด',
    });
    toast({
      title: 'คืนค่ารูปภาพเริ่มต้นแล้ว',
      description: 'อย่าลืมกดปุ่ม "บันทึกข้อมูล" เพื่อยืนยันการเปลี่ยนแปลง',
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-sky-500 hover:bg-sky-600 text-white gap-1">
              <Sparkles className="w-3 h-3" />
              Full Control & Unlimited Upload
            </Badge>
            <Badge variant="outline" className="text-xs">
              ตำแหน่ง: ด้านล่างภาพสไลด์หัวเว็บ
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            จัดการรูปภาพ 2 รูปด้านล่างภาพสไลด์หัวเว็บ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            แก้ไขและอัปโหลดรูปภาพ 2 ภาพที่ประกบข้อความต้อนรับของโรงเรียน (ภาพบรรยากาศโรงเรียนทางซ้าย และภาพกิจกรรมนักเรียนทางขวา)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link to="/admin/dashboard?tab=hero_slider">
              <Sliders className="w-3.5 h-3.5 text-primary" />
              ไปที่ภาพสไลด์หัวเว็บ
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            คืนค่าเริ่มต้น
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกรูปภาพทันที'}
          </Button>
        </div>
      </div>

      {/* Grid of 2 Highlight Image Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Image: Campus Aerial / Atmosphere */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-600 text-white">รูปภาพฝั่งซ้าย (Left)</Badge>
              <span className="text-xs text-muted-foreground font-mono">aspect-[4/5]</span>
            </div>
            <CardTitle className="text-lg flex items-center gap-2 mt-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              ภาพบรรยากาศ / ทิวทัศน์โรงเรียน
            </CardTitle>
            <CardDescription>
              แสดงผลที่ฝั่งซ้ายของข้อความต้อนรับในหน้าแรก สามารถอัปโหลดไฟล์จากเครื่องหรือวาง URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live Preview of Left Image */}
            <div className="w-full max-w-[240px] mx-auto aspect-[4/5] rounded-2xl overflow-hidden border border-border shadow-md bg-slate-100 dark:bg-slate-900 relative group">
              <img
                src={formData.about_left_image_url || heroImage}
                alt="รูปภาพซ้าย"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = heroImage;
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white text-xs">
                <span>{formData.about_left_image_caption || 'ภาพตัวอย่าง'}</span>
              </div>
            </div>

            {/* Upload from Device */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                อัปโหลดรูปภาพใหม่จากเครื่อง (ไม่จำกัดขนาด & รองรับ iPhone/iPad):
              </Label>
              <ImageUpload
                currentImage={formData.about_left_image_url}
                onUploadComplete={(url) => setFormData({ ...formData, about_left_image_url: url })}
                bucket="images"
                folder="about_showcase"
                compressionPreset="cover"
              />
            </div>

            {/* Direct URL Input */}
            <div className="space-y-1.5">
              <Label htmlFor="left_url" className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                หรือวางลิงก์ URL รูปภาพโดยตรง (Google Drive / Direct URL / Data URL):
              </Label>
              <Input
                id="left_url"
                value={formData.about_left_image_url}
                onChange={(e) => setFormData({ ...formData, about_left_image_url: e.target.value })}
                placeholder="https://... หรือ data:image/..."
                className="text-xs"
              />
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5">
              <Label htmlFor="left_caption" className="text-xs font-medium">
                คำบรรยายภาพ (Alt text / Caption):
              </Label>
              <Input
                id="left_caption"
                value={formData.about_left_image_caption}
                onChange={(e) => setFormData({ ...formData, about_left_image_caption: e.target.value })}
                placeholder="เช่น บรรยากาศโรงเรียนบ้านหาดเค็ด อาคารเรียนและสนามเด็กเล่น"
                className="text-xs"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground font-medium">เลือกใช้รูปสำเร็จรูปของโรงเรียน:</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUBHERO_IMAGES.map((preset, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2"
                    onClick={() => setFormData({ ...formData, about_left_image_url: preset.url })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Image: Student Activity / Excellence */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-600 text-white">รูปภาพฝั่งขวา (Right)</Badge>
              <span className="text-xs text-muted-foreground font-mono">aspect-[4/5]</span>
            </div>
            <CardTitle className="text-lg flex items-center gap-2 mt-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              ภาพกิจกรรมนักเรียน / ผลงานการศึกษา
            </CardTitle>
            <CardDescription>
              แสดงผลที่ฝั่งขวาของข้อความต้อนรับในหน้าแรก สามารถอัปโหลดไฟล์จากเครื่องหรือวาง URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live Preview of Right Image */}
            <div className="w-full max-w-[240px] mx-auto aspect-[4/5] rounded-2xl overflow-hidden border border-border shadow-md bg-slate-100 dark:bg-slate-900 relative group">
              <img
                src={formData.about_right_image_url || studentGraduationActivity}
                alt="รูปภาพขวา"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = studentGraduationActivity;
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white text-xs">
                <span>{formData.about_right_image_caption || 'ภาพตัวอย่าง'}</span>
              </div>
            </div>

            {/* Upload from Device */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                อัปโหลดรูปภาพใหม่จากเครื่อง (ไม่จำกัดขนาด & รองรับ iPhone/iPad):
              </Label>
              <ImageUpload
                currentImage={formData.about_right_image_url}
                onUploadComplete={(url) => setFormData({ ...formData, about_right_image_url: url })}
                bucket="images"
                folder="about_showcase"
                compressionPreset="cover"
              />
            </div>

            {/* Direct URL Input */}
            <div className="space-y-1.5">
              <Label htmlFor="right_url" className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                หรือวางลิงก์ URL รูปภาพโดยตรง (Google Drive / Direct URL / Data URL):
              </Label>
              <Input
                id="right_url"
                value={formData.about_right_image_url}
                onChange={(e) => setFormData({ ...formData, about_right_image_url: e.target.value })}
                placeholder="https://... หรือ data:image/..."
                className="text-xs"
              />
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5">
              <Label htmlFor="right_caption" className="text-xs font-medium">
                คำบรรยายภาพ (Alt text / Caption):
              </Label>
              <Input
                id="right_caption"
                value={formData.about_right_image_caption}
                onChange={(e) => setFormData({ ...formData, about_right_image_caption: e.target.value })}
                placeholder="เช่น กิจกรรมนักเรียน พิธีมอบประกาศนียบัตร หรือการประกวดผลงาน"
                className="text-xs"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground font-medium">เลือกใช้รูปสำเร็จรูปของโรงเรียน:</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUBHERO_IMAGES.map((preset, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2"
                    onClick={() => setFormData({ ...formData, about_right_image_url: preset.url })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Mockup: How it appears on the Homepage */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              จำลองการแสดงผลบนหน้าแรก (Homepage Layout Preview)
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
              <Link to="/" target="_blank">
                เปิดหน้าแรกจริง <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          </div>
          <CardDescription>
            รูปแบบการจัดวาง 3 คอลัมน์ด้านล่างแบนเนอร์ภาพสไลด์: ภาพซ้าย · ข้อความต้อนรับและสถิติโรงเรียน · ภาพขวา
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-3 sm:gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-inner items-center">
            {/* Left Mockup */}
            <div className="col-span-3">
              <div className="aspect-[4/5] rounded-xl overflow-hidden border border-border bg-slate-200">
                <img
                  src={formData.about_left_image_url || heroImage}
                  alt="ภาพซ้าย"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1 truncate">
                {formData.about_left_image_caption}
              </p>
            </div>

            {/* Center Welcome Mockup */}
            <div className="col-span-6 text-center px-2 space-y-1.5">
              <span className="text-[11px] font-semibold text-rose-500">ยินดีต้อนรับสู่</span>
              <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {settings.school_name}
              </h3>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {settings.school_description || settings.school_vision}
              </p>
              <div className="grid grid-cols-3 divide-x divide-border pt-1.5 border-t border-border text-center">
                <div>
                  <span className="block text-xs font-bold text-sky-500 font-mono">116</span>
                  <span className="text-[9px] text-muted-foreground">ปีแห่งประสบการณ์</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-sky-500 font-mono">74</span>
                  <span className="text-[9px] text-muted-foreground">นักเรียน</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-sky-500 font-mono">12</span>
                  <span className="text-[9px] text-muted-foreground">บุคลากร</span>
                </div>
              </div>
            </div>

            {/* Right Mockup */}
            <div className="col-span-3">
              <div className="aspect-[4/5] rounded-xl overflow-hidden border border-border bg-slate-200">
                <img
                  src={formData.about_right_image_url || studentGraduationActivity}
                  alt="ภาพขวา"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1 truncate">
                {formData.about_right_image_caption}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-20 p-4 bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            การแก้ไขมีผลกับการแสดงผลหน้าแรกทันทีเมื่อกดบันทึก
          </span>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรูปภาพ'}
        </Button>
      </div>
    </div>
  );
};
export default SubHeroImagesManagement;
