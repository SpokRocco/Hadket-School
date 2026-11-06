import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  ExternalLink,
  Check,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AdminRole,
  getCurrentAdminUser,
  getLocalLoginPortals,
  LoginPortalLink,
  normalizeRole,
  ROLE_INFO,
  saveLocalLoginPortals,
} from '@/utils/authUtils';

export const LoginPortalsManagement = () => {
  const [portals, setPortals] = useState<LoginPortalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    portal_key: '',
    token: '',
    target_role: 'teacher' as AdminRole | 'all',
    description: '',
    is_active: true,
  });

  const { toast } = useToast();
  const currentUser = getCurrentAdminUser();

  useEffect(() => {
    fetchPortals();
  }, []);

  const generateRandomToken = (prefix: string = 'portal') => {
    const rand = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${rand}`;
  };

  const fetchPortals = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('login_portals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        setPortals(data);
        saveLocalLoginPortals(data);
      } else {
        setPortals(getLocalLoginPortals());
      }
    } catch {
      setPortals(getLocalLoginPortals());
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewDialog = () => {
    const defaultKey = 'custom';
    setFormData({
      title: '',
      portal_key: defaultKey,
      token: generateRandomToken(defaultKey),
      target_role: 'teacher',
      description: '',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleRolePresetChange = (val: string) => {
    const roleKeyMap: Record<string, { key: string; title: string; desc: string }> = {
      executive: {
        key: 'exec',
        title: 'ทางเข้าสำหรับผู้บริหาร (Executive Portal)',
        desc: 'ลิงก์เข้าสู่ระบบสำหรับผู้บริหารสถานศึกษา',
      },
      admin: {
        key: 'admin',
        title: 'ทางเข้าสำหรับผู้ดูแลระบบ (Admin Portal)',
        desc: 'ลิงก์เข้าสู่ระบบจัดการหลังบ้านสำหรับแอดมิน',
      },
      teacher: {
        key: 'teacher',
        title: 'ทางเข้าสำหรับครูผู้สอน (Teacher Portal)',
        desc: 'ลิงก์เข้าสู่ระบบจัดการสื่อการสอนประจำตัวครู',
      },
      staff: {
        key: 'staff',
        title: 'ทางเข้าสำหรับเจ้าหน้าที่ (Staff CMS Portal)',
        desc: 'ลิงก์เข้าสู่ระบบจัดการข่าวประชาสัมพันธ์และประกาศ',
      },
      sapha_plus: {
        key: 'saphaplus',
        title: 'ทางเข้าสู่ระบบสภาพลัส (Sapha Plus Portal)',
        desc: 'ลิงก์เข้าสู่ระบบบริหารงานสภานักเรียน สภาพลัส',
      },
      all: {
        key: 'backoffice',
        title: 'ทางเข้าสู่ระบบรวมทุกบทบาท (General Portal)',
        desc: 'ลิงก์ทางเข้าเฉพาะกิจสำหรับบุคลากรทุกฝ่าย',
      },
    };

    const preset = roleKeyMap[val] || roleKeyMap.all;
    setFormData((prev) => ({
      ...prev,
      target_role: val as AdminRole | 'all',
      portal_key: preset.key,
      title: prev.title || preset.title,
      description: prev.description || preset.desc,
      token: generateRandomToken(preset.key),
    }));
  };

  const handleCreatePortal = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPortal: LoginPortalLink = {
      id: `portal-${Date.now()}`,
      title: formData.title.trim(),
      portal_key: formData.portal_key.trim().toLowerCase().replace(/\s+/g, '-'),
      token: formData.token.trim(),
      target_role: formData.target_role,
      description: formData.description.trim(),
      is_active: formData.is_active,
      created_by: currentUser?.username || 'admin',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await (supabase as any)
        .from('login_portals')
        .insert({
          title: newPortal.title,
          portal_key: newPortal.portal_key,
          token: newPortal.token,
          target_role: newPortal.target_role,
          description: newPortal.description,
          is_active: newPortal.is_active,
          created_by: newPortal.created_by,
        })
        .select()
        .single();

      const savedItem = !error && data ? data : newPortal;
      const nextList = [savedItem, ...portals];
      setPortals(nextList);
      saveLocalLoginPortals(nextList);

      toast({
        title: 'สร้างลิงก์เข้าสู่ระบบใหม่สำเร็จ',
        description: `สร้างลิงก์ "${savedItem.title}" เรียบร้อยแล้ว`,
      });
      setIsDialogOpen(false);
    } catch {
      const nextList = [newPortal, ...portals];
      setPortals(nextList);
      saveLocalLoginPortals(nextList);
      toast({
        title: 'สร้างลิงก์เข้าสู่ระบบใหม่สำเร็จ',
        description: `บันทึกลิงก์ "${newPortal.title}" เรียบร้อยแล้ว`,
      });
      setIsDialogOpen(false);
    }
  };

  const handleToggleActive = async (item: LoginPortalLink, checked: boolean) => {
    const updatedList = portals.map((p) =>
      p.id === item.id ? { ...p, is_active: checked } : p
    );
    setPortals(updatedList);
    saveLocalLoginPortals(updatedList);

    try {
      await (supabase as any)
        .from('login_portals')
        .update({ is_active: checked })
        .eq('id', item.id);
    } catch {
      // Ignored if table not yet created
    }

    toast({
      title: checked ? 'เปิดใช้งานลิงก์แล้ว' : 'ระงับการใช้งานลิงก์แล้ว',
      description: `สถานะของ "${item.title}" ถูกอัปเดตเรียบร้อยแล้ว`,
    });
  };

  const handleDeletePortal = async (item: LoginPortalLink) => {
    if (!confirm(`ต้องการยกเลิกและลบลิงก์ทางเข้า "${item.title}" หรือไม่?`)) return;

    const updatedList = portals.filter((p) => p.id !== item.id);
    setPortals(updatedList);
    saveLocalLoginPortals(updatedList);

    try {
      await (supabase as any).from('login_portals').delete().eq('id', item.id);
    } catch {
      // Ignored if table not yet created
    }

    toast({
      title: 'ลบลิงก์ทางเข้าเรียบร้อยแล้ว',
      description: 'ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบผ่านลิงก์เดิมนี้ได้อีก',
    });
  };

  const getFullPortalUrl = (item: LoginPortalLink, useToken: boolean = false) => {
    const origin = window.location.origin;
    if (useToken) {
      return `${origin}/admin?portal=${encodeURIComponent(item.portal_key)}&token=${encodeURIComponent(item.token)}`;
    }
    return `${origin}/admin?portal=${encodeURIComponent(item.portal_key)}`;
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: 'คัดลอกลิงก์สำเร็จ',
      description: url,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2.5">
            <Link2 className="w-8 h-8 text-primary" />
            ระบบจัดการลิงก์ทางเข้าสู่ระบบ (Custom Login Link Generator)
          </h1>
          <p className="text-muted-foreground mt-1">
            สร้าง URL ทางเข้าสู่ระบบเฉพาะกลุ่ม (เช่น ผู้บริหาร, ครู, เจ้าหน้าที่, สภาพลัส) พร้อมปุ่มคัดลอกและยกเลิกลิงก์เก่าที่ไม่ใช้งาน
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNewDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              สร้างลิงก์เข้าสู่ระบบใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>สร้างลิงก์ทางเข้าสู่ระบบใหม่ (New Login Portal Link)</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreatePortal} className="space-y-4">
              <div className="space-y-2">
                <Label>กลุ่มผู้ใช้งานเป้าหมาย (Target Role) *</Label>
                <Select
                  value={formData.target_role}
                  onValueChange={handleRolePresetChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกลุ่มผู้ใช้งาน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">ผู้บริหารสถานศึกษา (Executive)</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ (Admin)</SelectItem>
                    <SelectItem value="teacher">ครูผู้สอน (Teacher)</SelectItem>
                    <SelectItem value="staff">เจ้าหน้าที่ประชาสัมพันธ์ (Staff)</SelectItem>
                    <SelectItem value="sapha_plus">สภานักเรียน - สภาพลัส (Sapha Plus)</SelectItem>
                    <SelectItem value="all">ทุกบทบาท (All Roles)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portal_title">ชื่อลิงก์ทางเข้า *</Label>
                <Input
                  id="portal_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น ทางเข้าสู่ระบบสภาพลัส ประจำภาคเรียนที่ 1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="portal_key">รหัสพอร์ทัล (`?portal=`) *</Label>
                  <Input
                    id="portal_key"
                    value={formData.portal_key}
                    onChange={(e) => setFormData({ ...formData, portal_key: e.target.value })}
                    placeholder="เช่น exec, teacher, saphaplus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="portal_token">รหัส Token เฉพาะกิจ</Label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          token: generateRandomToken(prev.portal_key || 'portal'),
                        }))
                      }
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      สุ่มใหม่
                    </button>
                  </div>
                  <Input
                    id="portal_token"
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    placeholder="token"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portal_desc">คำอธิบายหน้าเข้าสู่ระบบ</Label>
                <Input
                  id="portal_desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ข้อความต้อนรับที่จะแสดงบนการ์ดล็อกอินของลิงก์นี้"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>เปิดใช้งานทันที</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">สร้างลิงก์</Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดรายการลิงก์ทางเข้า...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {portals.map((item) => {
            const shortUrl = getFullPortalUrl(item, false);
            const tokenUrl = getFullPortalUrl(item, true);
            const roleMeta =
              item.target_role !== 'all'
                ? ROLE_INFO[normalizeRole(item.target_role)]
                : null;

            return (
              <Card
                key={item.id}
                className={`border ${!item.is_active ? 'opacity-60 bg-muted/40' : 'bg-card'}`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {roleMeta ? (
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleMeta.badgeClass}`}
                          >
                            {roleMeta.label}
                          </span>
                        ) : (
                          <Badge variant="secondary">ทุกบทบาท (All Roles)</Badge>
                        )}
                        {!item.is_active && (
                          <Badge variant="destructive">ระงับการใช้งาน</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) => handleToggleActive(item, checked)}
                      />
                    </div>
                  </div>

                  {/* Standard Portal Link */}
                  <div className="space-y-2 bg-secondary/60 p-3.5 rounded-xl border border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        ลิงก์พอร์ทัลมาตรฐาน (`?portal={item.portal_key}`)
                      </span>
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        ทดสอบเปิดลิงก์ <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input value={shortUrl} readOnly className="h-9 text-xs font-mono bg-card" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyUrl(`${item.id}-short`, shortUrl)}
                        className="gap-1.5 flex-shrink-0"
                      >
                        {copiedId === `${item.id}-short` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            คัดลอกแล้ว
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            คัดลอก
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Token Link */}
                  <div className="space-y-2 bg-secondary/40 p-3.5 rounded-xl border border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">ลิงก์เฉพาะกิจพร้อมรหัส Token (`&token={item.token}`)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input value={tokenUrl} readOnly className="h-9 text-xs font-mono bg-card" />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyUrl(`${item.id}-token`, tokenUrl)}
                        className="gap-1.5 flex-shrink-0"
                      >
                        {copiedId === `${item.id}-token` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            คัดลอกแล้ว
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            คัดลอก Token
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                    <span>สร้างโดย: @{item.created_by}</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePortal(item)}
                      className="h-8 gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      ยกเลิก / ลบลิงก์นี้
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

