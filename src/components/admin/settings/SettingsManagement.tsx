import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Save,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  LayoutTemplate,
  Megaphone,
  Eye,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import WelcomePopupModal from '@/components/WelcomePopupModal';
import heroImage from '@/assets/hero-school.jpg';
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_NEWS_HUB_SUBSECTIONS,
  DEFAULT_WELCOME_POPUP_CONFIG,
  parseHomepageSections,
  parseNewsHubSubSections,
  parseWelcomePopupConfig,
  moveItemInOrder,
  type HomepageSectionConfig,
  type NewsHubSubSectionConfig,
} from '@/utils/homepageLayoutUtils';

const parseSocialLinksSafe = (raw?: string): { platform: string; url: string }[] => {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const SettingsManagement = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewPopupOpen, setPreviewPopupOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('school_settings').select('*');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      (data as any[])?.forEach((setting: any) => {
        settingsMap[setting.key] = setting.value || '';
      });
      setSettings(settingsMap);
    } catch {
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

  const homepageSections: HomepageSectionConfig[] = parseHomepageSections(
    settings.homepage_sections_order
  );
  const newsHubSections: NewsHubSubSectionConfig[] = parseNewsHubSubSections(
    settings.news_hub_order
  );
  const popupConfig = parseWelcomePopupConfig(settings, heroImage);

  const updateHomepageSections = (next: HomepageSectionConfig[]) => {
    handleChange('homepage_sections_order', JSON.stringify(next));
  };

  const updateNewsHubSections = (next: NewsHubSubSectionConfig[]) => {
    handleChange('news_hub_order', JSON.stringify(next));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

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

      // Clear cached settings (both legacy & v3 cache keys) and notify realtime listeners
      localStorage.removeItem('school_settings_cache');
      localStorage.removeItem('school_settings_cache_v3');
      notifyLocalRealtimeListeners('school_settings');
      notifyLocalRealtimeListeners('homepage_sections');
      notifyLocalRealtimeListeners('site_popups');

      toast({
        title: 'สำเร็จ',
        description: 'บันทึกการตั้งค่าเรียบร้อยแล้ว ข้อมูลอัปเดตบนหน้าเว็บไซต์ทันที',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error?.message || 'ไม่สามารถบันทึกการตั้งค่าได้',
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

  const socialLinksList = parseSocialLinksSafe(settings.social_links);

  return (
    <div className="p-8 max-w-4xl">
      {/* Live Preview Popup Modal triggered only by Preview button */}
      <WelcomePopupModal
        overrideConfig={{ ...popupConfig, enabled: true }}
        forceOpen={previewPopupOpen}
        onCloseOverride={() => setPreviewPopupOpen(false)}
      />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลโรงเรียน โลโก้ ลำดับส่วนหน้าแรก ป๊อปอัปประกาศ และระบบเชื่อมต่อฐานข้อมูล
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" asChild className="gap-2">
            <Link to="/admin/dashboard?tab=homepage_layout">
              <LayoutTemplate className="w-4 h-4 text-primary" />
              จัดการหน้าแรก / ป๊อปอัป / Cloud
            </Link>
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              ข้อมูลทั่วไป และโลโก้โรงเรียน
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
                    placeholder="บหค"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    หากไม่ได้อัปโหลดรูปโลโก้ ระบบจะแสดงวงกลมพร้อมตัวอักษรย่อนี้แทน
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    ตัวอย่างการแสดงผลบนแถบเมนู:
                  </p>
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
                          {settings.school_short_name || 'บหค'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">
                        {settings.school_name || 'โรงเรียนบ้านหาดเค็ด'}
                      </p>
                      <p className="text-xs text-primary-foreground/75 truncate">
                        {settings.school_tagline || 'ร่วมมือ วิชาการ งานอาชีพ'}
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
                placeholder="โรงเรียนบ้านหาดเค็ด"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_tagline">คำขวัญ/Tagline</Label>
              <Input
                id="school_tagline"
                value={settings.school_tagline || ''}
                onChange={(e) => handleChange('school_tagline', e.target.value)}
                placeholder="ร่วมมือ วิชาการ งานอาชีพ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic_year">ปีการศึกษาปัจจุบัน</Label>
              <Input
                id="academic_year"
                value={settings.academic_year || ''}
                onChange={(e) => handleChange('academic_year', e.target.value)}
                placeholder="2569"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_description">คำอธิบายโรงเรียน (แสดงใน Hero Section)</Label>
              <textarea
                id="school_description"
                value={settings.school_description || ''}
                onChange={(e) => handleChange('school_description', e.target.value)}
                placeholder="มุ่งพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษา..."
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Homepage Sections Ordering & News Hub Ordering */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-primary" />
                  จัดลำดับและเปิด/ปิดส่วนแสดงผลหน้าแรก
                </CardTitle>
                <CardDescription>
                  จัดลำดับส่วนประกอบบนหน้าแรก (Index) และลำดับหมวดย่อยใน News Hub ได้แบบเรียลไทม์
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => updateHomepageSections(DEFAULT_HOMEPAGE_SECTIONS)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ตหน้าแรก
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2.5">
              {homepageSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    sec.enabled ? 'bg-card border-border' : 'bg-muted/40 border-border/60 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => updateHomepageSections(moveItemInOrder(homepageSections, idx, 'up'))}
                        title="เลื่อนขึ้น"
                        className="p-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === homepageSections.length - 1}
                        onClick={() =>
                          updateHomepageSections(moveItemInOrder(homepageSections, idx, 'down'))
                        }
                        title="เลื่อนลง"
                        className="p-0.5 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{sec.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{sec.subtitle}</p>
                    </div>
                  </div>
                  <Switch
                    checked={sec.enabled}
                    onCheckedChange={(checked) => {
                      const next = homepageSections.map((item) =>
                        item.id === sec.id ? { ...item, enabled: checked } : item
                      );
                      updateHomepageSections(next);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    ส่วนย่อยภายในศูนย์ข่าวประชาสัมพันธ์ (News Hub)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    เลือกแสดง/ซ่อน หรือสลับตำแหน่งบล็อกภายในหมวดข่าวสารหน้าแรก
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => updateNewsHubSections(DEFAULT_NEWS_HUB_SUBSECTIONS)}
                >
                  <RotateCcw className="w-3 h-3" />
                  รีเซ็ต News Hub
                </Button>
              </div>
              <div className="space-y-2">
                {newsHubSections.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border ${
                      sub.enabled ? 'bg-secondary/30 border-border' : 'bg-muted/30 border-border/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => updateNewsHubSections(moveItemInOrder(newsHubSections, idx, 'up'))}
                          className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === newsHubSections.length - 1}
                          onClick={() =>
                            updateNewsHubSections(moveItemInOrder(newsHubSections, idx, 'down'))
                          }
                          className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{sub.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{sub.subtitle}</p>
                      </div>
                    </div>
                    <Switch
                      checked={sub.enabled}
                      onCheckedChange={(checked) => {
                        const next = newsHubSections.map((item) =>
                          item.id === sub.id ? { ...item, enabled: checked } : item
                        );
                        updateNewsHubSections(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Popup Modal Config */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  หน้าต่างป๊อปอัปต้อนรับ / ประกาศด่วนหน้าแรก
                </CardTitle>
                <CardDescription>
                  เปิดแสดงประกาศรับสมัครนักเรียน กิจกรรมสำคัญ หรือป้ายประชาสัมพันธ์เมื่อเข้าเว็บไซต์
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPreviewPopupOpen(true)}
              >
                <Eye className="w-4 h-4" />
                ดูตัวอย่างป๊อปอัป
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border">
              <div>
                <p className="font-semibold text-sm">เปิดใช้งานป๊อปอัปหน้าแรก (Welcome Popup)</p>
                <p className="text-xs text-muted-foreground">
                  หากปิดอยู่ ผู้เข้าชมจะไม่เห็นหน้าต่างป๊อปอัปเมื่อเข้าหน้าแรก
                </p>
              </div>
              <Switch
                checked={popupConfig.enabled}
                onCheckedChange={(checked) =>
                  handleChange('popup_enabled', checked ? 'true' : 'false')
                }
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>รูปแบบการแสดงผล</Label>
                <Select
                  value={popupConfig.layout}
                  onValueChange={(val) => handleChange('popup_layout', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image_and_text">รูปภาพ + ข้อความประกาศ</SelectItem>
                    <SelectItem value="image_only">โปสเตอร์รูปภาพอย่างเดียว</SelectItem>
                    <SelectItem value="text_only">ข้อความประกาศอย่างเดียว</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ความถี่ในการแสดง</Label>
                <Select
                  value={popupConfig.frequency}
                  onValueChange={(val) => handleChange('popup_frequency', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once_per_day">วันละ 1 ครั้ง (แนะนำ)</SelectItem>
                    <SelectItem value="once_per_session">Session ละ 1 ครั้ง</SelectItem>
                    <SelectItem value="every_visit">แสดงทุกครั้งที่เปิดหน้าแรก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>โทนสีปุ่มและแถบหัว</Label>
                <Select
                  value={popupConfig.themeAccent}
                  onValueChange={(val) => handleChange('popup_theme_accent', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sky">ฟ้าสดใส (Sky)</SelectItem>
                    <SelectItem value="navy">น้ำเงินกรม (Navy)</SelectItem>
                    <SelectItem value="amber">ทอง (Amber)</SelectItem>
                    <SelectItem value="rose">แดงทับทิม (Rose)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="popup_badge">ป้ายกำกับด้านบน (Badge)</Label>
                <Input
                  id="popup_badge"
                  value={settings.popup_badge ?? ''}
                  onChange={(e) => handleChange('popup_badge', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.badge}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup_title">หัวข้อประกาศหลัก</Label>
                <Input
                  id="popup_title"
                  value={settings.popup_title ?? ''}
                  onChange={(e) => handleChange('popup_title', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.title}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="popup_subtitle">หัวข้อรอง</Label>
              <Input
                id="popup_subtitle"
                value={settings.popup_subtitle ?? ''}
                onChange={(e) => handleChange('popup_subtitle', e.target.value)}
                placeholder={DEFAULT_WELCOME_POPUP_CONFIG.subtitle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="popup_description">รายละเอียดข้อความในป๊อปอัป</Label>
              <textarea
                id="popup_description"
                value={settings.popup_description ?? ''}
                onChange={(e) => handleChange('popup_description', e.target.value)}
                placeholder={DEFAULT_WELCOME_POPUP_CONFIG.description}
                className="w-full min-h-[70px] px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>รูปภาพแบนเนอร์/โปสเตอร์ป๊อปอัป</Label>
              <ImageUpload
                currentImage={settings.popup_image_url || ''}
                onUploadComplete={(url) => handleChange('popup_image_url', url)}
                folder="popups"
                compressionPreset="cover"
              />
              <Input
                value={settings.popup_image_url || ''}
                onChange={(e) => handleChange('popup_image_url', e.target.value)}
                placeholder="หรือวางลิงก์รูปภาพ (https://...)"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="popup_cta_text">ข้อความปุ่มหลัก</Label>
                <Input
                  id="popup_cta_text"
                  value={settings.popup_cta_text ?? ''}
                  onChange={(e) => handleChange('popup_cta_text', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.ctaText}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup_cta_url">ลิงก์ปุ่มหลัก</Label>
                <Input
                  id="popup_cta_url"
                  value={settings.popup_cta_url ?? ''}
                  onChange={(e) => handleChange('popup_cta_url', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.ctaUrl}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup_secondary_text">ข้อความปุ่มรอง</Label>
                <Input
                  id="popup_secondary_text"
                  value={settings.popup_secondary_text ?? ''}
                  onChange={(e) => handleChange('popup_secondary_text', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.secondaryText}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup_secondary_url">ลิงก์ปุ่มรอง</Label>
                <Input
                  id="popup_secondary_url"
                  value={settings.popup_secondary_url ?? ''}
                  onChange={(e) => handleChange('popup_secondary_url', e.target.value)}
                  placeholder={DEFAULT_WELCOME_POPUP_CONFIG.secondaryUrl}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="popup_start_date">วันเริ่มต้นแสดง (ไม่บังคับ)</Label>
                <Input
                  id="popup_start_date"
                  type="date"
                  value={settings.popup_start_date || ''}
                  onChange={(e) => handleChange('popup_start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="popup_end_date">วันสิ้นสุดการแสดง (ไม่บังคับ)</Label>
                <Input
                  id="popup_end_date"
                  type="date"
                  value={settings.popup_end_date || ''}
                  onChange={(e) => handleChange('popup_end_date', e.target.value)}
                />
              </div>
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
                placeholder="เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2569"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_title_1">ข้อความหัวเรื่อง บรรทัด 1</Label>
              <Input
                id="hero_title_1"
                value={settings.hero_title_1 || ''}
                onChange={(e) => handleChange('hero_title_1', e.target.value)}
                placeholder="ร่วมมือ วิชาการ งานอาชีพ"
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
                  placeholder="74"
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
                <Label htmlFor="stat_university">อัตราการศึกษาต่อ</Label>
                <Input
                  id="stat_university"
                  value={settings.stat_university || ''}
                  onChange={(e) => handleChange('stat_university', e.target.value)}
                  placeholder="90 %"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stat_university_label">Label</Label>
                <Input
                  id="stat_university_label"
                  value={settings.stat_university_label || ''}
                  onChange={(e) => handleChange('stat_university_label', e.target.value)}
                  placeholder="อัตราการศึกษาต่อ"
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
                  placeholder="116"
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
                placeholder="พัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐาน..."
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_mission">พันธกิจ</Label>
              <textarea
                id="school_mission"
                value={settings.school_mission || ''}
                onChange={(e) => handleChange('school_mission', e.target.value)}
                placeholder="จัดการศึกษาที่มีคุณภาพ พัฒนาหลักสูตรที่ทันสมัย..."
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_values">ค่านิยม</Label>
              <textarea
                id="school_values"
                value={settings.school_values || ''}
                onChange={(e) => handleChange('school_values', e.target.value)}
                placeholder="วิชาการดี มีวินัย ใฝ่คุณธรรม..."
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2 Highlight Images below Hero Slider */}
        <Card className="border-sky-500/20 bg-sky-500/5 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-sky-500" />
                รูปภาพ 2 รูปด้านล่างภาพสไลด์หัวเว็บ (Sub-Hero Showcase)
              </CardTitle>
              <Button variant="outline" size="sm" asChild className="text-xs gap-1">
                <Link to="/admin/dashboard?tab=subhero_images">
                  จัดการเต็มรูปแบบ <Eye className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              รูปภาพ 2 ภาพที่ประกบซ้าย-ขวาของข้อความต้อนรับโรงเรียน (ภาพบรรยากาศและกิจกรรมนักเรียน)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Image */}
              <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                <Label className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                  รูปภาพซ้าย (ภาพบรรยากาศ/อาคารสถานที่)
                </Label>
                <ImageUpload
                  currentImage={settings.about_left_image_url || ''}
                  onUploadComplete={(url) => handleChange('about_left_image_url', url)}
                  bucket="images"
                  folder="about_showcase"
                  compressionPreset="cover"
                />
                <div className="space-y-1">
                  <Label htmlFor="about_left_url" className="text-xs text-muted-foreground">
                    หรือใส่ลิงก์รูปภาพ (URL) โดยตรง
                  </Label>
                  <Input
                    id="about_left_url"
                    value={settings.about_left_image_url || ''}
                    onChange={(e) => handleChange('about_left_image_url', e.target.value)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="about_left_caption" className="text-xs">
                    คำบรรยายภาพ (Caption / Alt)
                  </Label>
                  <Input
                    id="about_left_caption"
                    value={settings.about_left_image_caption || ''}
                    onChange={(e) => handleChange('about_left_image_caption', e.target.value)}
                    placeholder="บรรยากาศโรงเรียนบ้านหาดเค็ด"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Right Image */}
              <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                <Label className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                  รูปภาพขวา (ภาพกิจกรรมนักเรียน/ผลงาน)
                </Label>
                <ImageUpload
                  currentImage={settings.about_right_image_url || ''}
                  onUploadComplete={(url) => handleChange('about_right_image_url', url)}
                  bucket="images"
                  folder="about_showcase"
                  compressionPreset="cover"
                />
                <div className="space-y-1">
                  <Label htmlFor="about_right_url" className="text-xs text-muted-foreground">
                    หรือใส่ลิงก์รูปภาพ (URL) โดยตรง
                  </Label>
                  <Input
                    id="about_right_url"
                    value={settings.about_right_image_url || ''}
                    onChange={(e) => handleChange('about_right_image_url', e.target.value)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="about_right_caption" className="text-xs">
                    คำบรรยายภาพ (Caption / Alt)
                  </Label>
                  <Input
                    id="about_right_caption"
                    value={settings.about_right_image_caption || ''}
                    onChange={(e) => handleChange('about_right_image_caption', e.target.value)}
                    placeholder="กิจกรรมนักเรียน โรงเรียนบ้านหาดเค็ด"
                    className="text-xs"
                  />
                </div>
              </div>
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
                className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm bg-background"
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
                  placeholder="08.30-16.30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="curriculum_class_size">จำนวนนักเรียนต่อห้อง</Label>
                <Input
                  id="curriculum_class_size"
                  value={settings.curriculum_class_size || ''}
                  onChange={(e) => handleChange('curriculum_class_size', e.target.value)}
                  placeholder="10"
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
                  placeholder="9 ปี"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="curriculum_duration_label">Label ระยะเวลา</Label>
                <Input
                  id="curriculum_duration_label"
                  value={settings.curriculum_duration_label || ''}
                  onChange={(e) => handleChange('curriculum_duration_label', e.target.value)}
                  placeholder="ระยะเวลาหลักสูตร"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Stats */}
        <Card>
          <CardHeader>
            <CardTitle>สถิติ (ส่วน About)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="about_stat_1">สถิติ 1 (ปีแห่งประสบการณ์)</Label>
                <Input
                  id="about_stat_1"
                  value={settings.about_stat_1 || ''}
                  onChange={(e) => handleChange('about_stat_1', e.target.value)}
                  placeholder="116"
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
                  placeholder="78"
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
                  placeholder="16"
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
                  placeholder="1000+"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about_stat_4_label">Label</Label>
                <Input
                  id="about_stat_4_label"
                  value={settings.about_stat_4_label || ''}
                  onChange={(e) => handleChange('about_stat_4_label', e.target.value)}
                  placeholder="ศิษย์เก่าโรงเรียนบ้านหาดเค็ด"
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="084-949-3448"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">อีเมล</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="hadketschool.official@gmail.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_hours">เวลาทำการ</Label>
              <Input
                id="contact_hours"
                value={settings.contact_hours || ''}
                onChange={(e) => handleChange('contact_hours', e.target.value)}
                placeholder="จันทร์ - ศุกร์ 07:30 - 16:30 น."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_address">ที่อยู่</Label>
              <textarea
                id="contact_address"
                value={settings.contact_address || ''}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                placeholder="207 ม.1 ต.เมืองจัง อ.ภูเพียง จ.น่าน 55000"
                className="w-full min-h-[60px] px-3 py-2 border rounded-md text-sm bg-background"
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
                คัดลอก URL หรือวางโค้ด <code className="font-mono">&lt;iframe src="..."&gt;</code> จาก Google Maps → Share → Embed a map (ระบบดึง URL ให้อัตโนมัติ)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* LINE Contact & Quick Chat Configuration */}
        <Card className="border-[#06C755]/30 bg-gradient-to-br from-[#06C755]/5 to-transparent shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <div className="w-8 h-8 rounded-lg bg-[#06C755] text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                ช่องทางติดต่อ LINE และแชทด่วน (LINE Official & ผู้อำนวยการ)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="qc_enabled" className="text-xs font-semibold">เปิดใช้งานแชทด่วน:</Label>
                <Switch
                  id="qc_enabled"
                  checked={settings.quick_chat_enabled !== 'false'}
                  onCheckedChange={(checked) => handleChange('quick_chat_enabled', checked ? 'true' : 'false')}
                />
              </div>
            </div>
            <CardDescription>
              กำหนด URL ลิงก์ LINE สำหรับให้ผู้ปกครองและนักเรียนติดต่อทาง LINE ผ่านหน้าเว็บและฟุตเดอร์ด้านล่าง
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* School LINE */}
              <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="qc_school_line" className="text-xs font-bold text-[#06C755] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#06C755]" />
                    ลิงก์ LINE กลุ่มโรงเรียน / LINE Official
                  </Label>
                  {settings.quick_chat_school_line && (
                    <a
                      href={settings.quick_chat_school_line}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline"
                    >
                      ทดสอบเปิดลิงก์
                    </a>
                  )}
                </div>
                <Input
                  id="qc_school_line"
                  value={settings.quick_chat_school_line || ''}
                  onChange={(e) => handleChange('quick_chat_school_line', e.target.value)}
                  placeholder="https://line.me/ti/p/~hadkedschool หรือ https://lin.ee/..."
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  แสดงในป๊อปอัพแชทด่วน และเป็นปุ่มติดต่อหลักที่ส่วนล่างสุดของเว็บไซต์ (Footer)
                </p>
              </div>

              {/* Director LINE */}
              <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="qc_director_line" className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    ลิงก์ LINE ผู้อำนวยการโรงเรียน (ผู้บริหาร)
                  </Label>
                  {settings.quick_chat_director_line && (
                    <a
                      href={settings.quick_chat_director_line}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      ทดสอบเปิดลิงก์
                    </a>
                  )}
                </div>
                <Input
                  id="qc_director_line"
                  value={settings.quick_chat_director_line || ''}
                  onChange={(e) => handleChange('quick_chat_director_line', e.target.value)}
                  placeholder="https://line.me/ti/p/~director.hadked"
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  สำหรับติดต่อสายตรงผู้บริหารสถานศึกษา แสดงทั้งในป๊อปอัพและที่ฟุตเดอร์
                </p>
              </div>
            </div>

            {/* Auto Open Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="qc_auto_open" className="text-xs font-semibold text-foreground">
                  แสดงผลป๊อปอัพติดต่อ LINE อัตโนมัติทุกครั้งเมื่อรีเฟรชหน้าจอหรือกลับหน้าหลัก
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  ระบบจะเปิดหน้าต่างป๊อปอัพทักทายขึ้นมาอัตโนมัติ เพื่อต้อนรับและอำนวยความสะดวกให้ผู้เข้าชม
                </p>
              </div>
              <Switch
                id="qc_auto_open"
                checked={settings.quick_chat_auto_open_home !== 'false'}
                onCheckedChange={(checked) => handleChange('quick_chat_auto_open_home', checked ? 'true' : 'false')}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="qc_title" className="text-xs">หัวข้อป๊อปอัพแชท</Label>
                <Input
                  id="qc_title"
                  value={settings.quick_chat_title || ''}
                  onChange={(e) => handleChange('quick_chat_title', e.target.value)}
                  placeholder="แชทด่วนสอบถามข้อมูล"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qc_greeting" className="text-xs">ข้อความต้อนรับอัตโนมัติ</Label>
                <Input
                  id="qc_greeting"
                  value={settings.quick_chat_greeting || ''}
                  onChange={(e) => handleChange('quick_chat_greeting', e.target.value)}
                  placeholder="สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด..."
                  className="text-xs"
                />
              </div>
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
              {socialLinksList.map((link, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-1/3">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={link.platform}
                      onChange={(e) => {
                        const newLinks = [...socialLinksList];
                        newLinks[index] = { ...newLinks[index], platform: e.target.value };
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
                        const newLinks = [...socialLinksList];
                        newLinks[index] = { ...newLinks[index], url: e.target.value };
                        handleChange('social_links', JSON.stringify(newLinks));
                      }}
                      placeholder="URL (เช่น https://facebook.com/...)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const newLinks = socialLinksList.filter((_, i) => i !== index);
                      handleChange('social_links', JSON.stringify(newLinks));
                    }}
                  >
                    <span className="sr-only">Delete</span>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newLinks = [...socialLinksList, { platform: 'facebook', url: '' }];
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
                    placeholder="https://... หรือ /..."
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Creator / Developer Info (Footer Credits) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลผู้จัดทำเว็บไซต์ (Website Creator / Developer)</CardTitle>
            <CardDescription>
              ระบุชื่อและอีเมลของผู้จัดทำเว็บไซต์เพื่อแสดงเครดิตที่ส่วนท้ายของเว็บไซต์ (Footer) หากเว้นว่างไว้จะไม่แสดงผล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creator_name">ชื่อผู้จัดทำ / ผู้พัฒนาเว็บไซต์</Label>
                <Input
                  id="creator_name"
                  value={settings.creator_name || ''}
                  onChange={(e) => handleChange('creator_name', e.target.value)}
                  placeholder="เช่น นายสมคิด สดใส หรือ ทีมผู้พัฒนาเว็บไซต์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creator_email">อีเมลผู้จัดทำ (Creator Email)</Label>
                <Input
                  id="creator_email"
                  type="email"
                  value={settings.creator_email || ''}
                  onChange={(e) => handleChange('creator_email', e.target.value)}
                  placeholder="creator@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creator_url">ลิงก์เว็บไซต์หรือโปรไฟล์ผู้จัดทำ (ตัวเลือกเสริม)</Label>
              <Input
                id="creator_url"
                type="url"
                value={settings.creator_url || ''}
                onChange={(e) => handleChange('creator_url', e.target.value)}
                placeholder="https://github.com/... หรือ https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick LINE Chat Widget Settings */}
        <Card className="border-[#06C755]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <div className="w-7 h-7 rounded-lg bg-[#06C755] text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </div>
                  ระบบแชทด่วนมุมขวาล่าง (Quick LINE Chat Widget)
                </CardTitle>
                <CardDescription>
                  ป๊อปอัปแชทด่วนมุมขวาล่างสำหรับติดต่อไปยังกลุ่ม LINE โรงเรียน หรือ LINE ผู้อำนวยการ พร้อมกล่องฝากข้อความสอบถาม
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {settings.quick_chat_enabled !== 'false' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
                <Switch
                  checked={settings.quick_chat_enabled !== 'false'}
                  onCheckedChange={(checked) =>
                    handleChange('quick_chat_enabled', checked ? 'true' : 'false')
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick_chat_title">หัวข้อแชทด่วน</Label>
                <Input
                  id="quick_chat_title"
                  value={settings.quick_chat_title || 'แชทด่วนสอบถามข้อมูล'}
                  onChange={(e) => handleChange('quick_chat_title', e.target.value)}
                  placeholder="แชทด่วนสอบถามข้อมูล"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick_chat_phone">เบอร์โทรศัพท์ติดต่อด่วน</Label>
                <Input
                  id="quick_chat_phone"
                  value={settings.quick_chat_phone || '054-710-123'}
                  onChange={(e) => handleChange('quick_chat_phone', e.target.value)}
                  placeholder="054-710-123"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick_chat_school_line" className="text-[#06C755] font-semibold">
                  🔗 ลิงก์กลุ่ม LINE โรงเรียน หรือ LINE Official
                </Label>
                <Input
                  id="quick_chat_school_line"
                  value={settings.quick_chat_school_line || ''}
                  onChange={(e) => handleChange('quick_chat_school_line', e.target.value)}
                  placeholder="https://line.me/ti/p/~hadkedschool หรือ https://line.me/ti/g/..."
                />
                <p className="text-xs text-muted-foreground">
                  ใส่ URL สำหรับให้ผู้ปกครองหรือผู้สนใจกดเข้าร่วมกลุ่ม LINE ของโรงเรียน
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick_chat_director_line" className="text-blue-600 dark:text-blue-400 font-semibold">
                  🔗 ลิงก์ LINE ผู้อำนวยการ หรือ ผู้บริหารโรงเรียน
                </Label>
                <Input
                  id="quick_chat_director_line"
                  value={settings.quick_chat_director_line || ''}
                  onChange={(e) => handleChange('quick_chat_director_line', e.target.value)}
                  placeholder="https://line.me/ti/p/~director.hadked"
                />
                <p className="text-xs text-muted-foreground">
                  ใส่ URL LINE ID หรือ LINE ส่วนตัวของผู้อำนวยการเพื่อรับเรื่องโดยตรง
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick_chat_greeting">ข้อความทักทายอัตโนมัติในหน้าต่างแชท</Label>
              <Input
                id="quick_chat_greeting"
                value={
                  settings.quick_chat_greeting ||
                  'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด มีข้อสงสัยหรือต้องการสอบถามข้อมูล สามารถแชทคุยกับเราได้เลยครับ'
                }
                onChange={(e) => handleChange('quick_chat_greeting', e.target.value)}
                placeholder="ข้อความทักทายเมื่อเปิดหน้าต่างแชท"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </div>
    </div>
  );
};
