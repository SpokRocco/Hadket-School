import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  KeyRound,
  RotateCcw,
  Link2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AdminRole,
  AdminUser,
  ALL_ADMIN_MENUS,
  DEFAULT_ROLE_PERMISSIONS,
  getCurrentAdminUser,
  getLocalUsers,
  normalizeRole,
  ROLE_INFO,
  saveLocalUsers,
  setCurrentAdminUser,
} from '@/utils/authUtils';
import { SUBJECT_DEPARTMENTS } from '@/pages/MediaLibrary';

const MAIN_ROLES: AdminRole[] = ['executive', 'admin', 'teacher', 'staff', 'sapha_plus'];

export const UsersManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    display_name: '',
    email: '',
    role: 'teacher' as AdminRole,
    subject_department: 'ภาษาไทย',
    custom_link_slug: '',
    google_site_url: '',
    permissions: DEFAULT_ROLE_PERMISSIONS.teacher,
    is_active: true,
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentAdminUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map((u: any) => ({
          ...u,
          role: normalizeRole(u.role),
        }));
        setUsers(normalized);
        saveLocalUsers(normalized);
      } else {
        setUsers(getLocalUsers());
      }
    } catch {
      setUsers(getLocalUsers());
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      display_name: '',
      email: '',
      role: 'teacher',
      subject_department: 'ภาษาไทย',
      custom_link_slug: '',
      google_site_url: '',
      permissions: [...DEFAULT_ROLE_PERMISSIONS.teacher],
      is_active: true,
    });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: AdminUser) => {
    if (user) {
      const role = normalizeRole(user.role);
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        display_name: user.display_name,
        email: user.email || '',
        role,
        subject_department: user.subject_department || 'ภาษาไทย',
        custom_link_slug: user.custom_link_slug || user.username,
        google_site_url: user.google_site_url || '',
        permissions:
          role === 'admin'
            ? ALL_ADMIN_MENUS.map((m) => m.id)
            : Array.isArray(user.permissions) && user.permissions.length > 0
              ? [...user.permissions]
              : [...DEFAULT_ROLE_PERMISSIONS[role]],
        is_active: user.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleRoleChange = (newRole: AdminRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: [...DEFAULT_ROLE_PERMISSIONS[newRole]],
    }));
  };

  const handleTogglePermission = (menuId: string, checked: boolean) => {
    if (menuId === 'dashboard') return;
    setFormData((prev) => {
      const exists = prev.permissions.includes(menuId);
      let nextPermissions = prev.permissions;
      if (checked && !exists) {
        nextPermissions = [...prev.permissions, menuId];
      } else if (!checked && exists) {
        nextPermissions = prev.permissions.filter((id) => id !== menuId);
      }
      return { ...prev, permissions: nextPermissions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalPermissions =
      formData.role === 'admin'
        ? ALL_ADMIN_MENUS.map((m) => m.id)
        : Array.from(new Set(['dashboard', ...formData.permissions]));

    const cleanUsername = formData.username.trim();
    const cleanSlug =
      (formData.custom_link_slug || cleanUsername)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-') || cleanUsername;

    if (editingUser) {
      const updatedUser: AdminUser = {
        ...editingUser,
        username: cleanUsername,
        password: formData.password.trim() ? formData.password.trim() : editingUser.password,
        display_name: formData.display_name.trim(),
        email: formData.email.trim() || null,
        role: formData.role,
        subject_department: formData.role === 'teacher' ? formData.subject_department : null,
        custom_link_slug: formData.role === 'teacher' ? cleanSlug : null,
        google_site_url: formData.role === 'teacher' ? formData.google_site_url.trim() || null : null,
        permissions: finalPermissions,
        is_active: formData.is_active,
      };

      const nextList = users.map((u) => (u.id === editingUser.id ? updatedUser : u));
      setUsers(nextList);
      saveLocalUsers(nextList);

      try {
        const dbPayload: Record<string, any> = {
          username: updatedUser.username,
          display_name: updatedUser.display_name,
          email: updatedUser.email,
          role: updatedUser.role,
          subject_department: updatedUser.subject_department,
          custom_link_slug: updatedUser.custom_link_slug,
          google_site_url: updatedUser.google_site_url,
          permissions: updatedUser.permissions,
          is_active: updatedUser.is_active,
        };
        if (formData.password.trim()) {
          dbPayload.password = formData.password.trim();
        }
        await (supabase as any).from('admin_users').update(dbPayload).eq('id', editingUser.id);
      } catch {
        // Saved in localStorage fallback
      }

      if (currentUser && currentUser.id === editingUser.id) {
        setCurrentAdminUser(updatedUser);
      }

      toast({
        title: 'อัปเดตผู้ใช้งานสำเร็จ',
        description: `บันทึกสิทธิ์ของ ${updatedUser.display_name} (${ROLE_INFO[updatedUser.role].shortLabel}) เรียบร้อยแล้ว`,
      });
      setIsDialogOpen(false);
      resetForm();
      return;
    }

    if (!formData.password.trim()) {
      toast({
        variant: 'destructive',
        title: 'กรุณากรอกรหัสผ่าน',
        description: 'ต้องกำหนดรหัสผ่านสำหรับบัญชีผู้ใช้งานใหม่',
      });
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'ชื่อผู้ใช้นี้มีอยู่แล้ว',
        description: 'กรุณาตั้งชื่อผู้ใช้ (Username) อื่น',
      });
      return;
    }

    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: formData.password.trim(),
      display_name: formData.display_name.trim(),
      email: formData.email.trim() || null,
      role: formData.role,
      subject_department: formData.role === 'teacher' ? formData.subject_department : null,
      custom_link_slug: formData.role === 'teacher' ? cleanSlug : null,
      google_site_url: formData.role === 'teacher' ? formData.google_site_url.trim() || null : null,
      permissions: finalPermissions,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await (supabase as any)
        .from('admin_users')
        .insert({
          username: newUser.username,
          password: newUser.password,
          display_name: newUser.display_name,
          email: newUser.email,
          role: newUser.role,
          subject_department: newUser.subject_department,
          custom_link_slug: newUser.custom_link_slug,
          google_site_url: newUser.google_site_url,
          permissions: newUser.permissions,
          is_active: newUser.is_active,
        })
        .select()
        .single();

      const finalUser = !error && data ? { ...newUser, id: data.id } : newUser;
      const nextList = [...users, finalUser];
      setUsers(nextList);
      saveLocalUsers(nextList);
    } catch {
      const nextList = [...users, newUser];
      setUsers(nextList);
      saveLocalUsers(nextList);
    }

    toast({
      title: 'เพิ่มผู้ใช้งานสำเร็จ',
      description: `สร้างบัญชี ${newUser.display_name} (${ROLE_INFO[newUser.role].label}) เรียบร้อยแล้ว`,
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleToggleActive = async (user: AdminUser, checked: boolean) => {
    if (currentUser && currentUser.id === user.id && !checked) {
      toast({
        variant: 'destructive',
        title: 'ไม่สามารถระงับบัญชีของตัวเองได้',
        description: 'คุณกำลังเข้าสู่ระบบด้วยบัญชีนี้อยู่',
      });
      return;
    }

    const nextList = users.map((u) => (u.id === user.id ? { ...u, is_active: checked } : u));
    setUsers(nextList);
    saveLocalUsers(nextList);

    try {
      await (supabase as any)
        .from('admin_users')
        .update({ is_active: checked })
        .eq('id', user.id);
    } catch {
      // Saved locally
    }

    toast({
      title: checked ? 'เปิดใช้งานบัญชีแล้ว' : 'ระงับการใช้งานบัญชีแล้ว',
      description: `อัปเดตสถานะของ ${user.display_name} เรียบร้อยแล้ว`,
    });
  };

  const handleDelete = async (user: AdminUser) => {
    if (currentUser && currentUser.id === user.id) {
      toast({
        variant: 'destructive',
        title: 'ไม่สามารถลบบัญชีของตัวเองได้',
        description: 'คุณกำลังเข้าสู่ระบบด้วยบัญชีนี้อยู่',
      });
      return;
    }

    const adminCount = users.filter((u) => normalizeRole(u.role) === 'admin').length;
    if (normalizeRole(user.role) === 'admin' && adminCount <= 1) {
      toast({
        variant: 'destructive',
        title: 'ไม่สามารถลบได้',
        description: 'ระบบต้องมีบัญชี Admin อย่างน้อย 1 บัญชีเสมอ',
      });
      return;
    }

    if (!confirm(`ต้องการลบบัญชีผู้ใช้ "${user.display_name} (@${user.username})" หรือไม่?`)) return;

    const nextList = users.filter((u) => u.id !== user.id);
    setUsers(nextList);
    saveLocalUsers(nextList);

    try {
      await (supabase as any).from('admin_users').delete().eq('id', user.id);
    } catch {
      // Saved locally
    }

    toast({
      title: 'ลบผู้ใช้งานสำเร็จ',
      description: `ลบบัญชี @${user.username} ออกจากระบบแล้ว`,
    });
  };

  const getMenuLabel = (menuId: string) =>
    ALL_ADMIN_MENUS.find((m) => m.id === menuId)?.label || menuId;

  const subjectChoices = SUBJECT_DEPARTMENTS.filter((s) => s !== 'ทั้งหมด');

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2.5">
            <Shield className="w-8 h-8 text-primary" />
            จัดการผู้ใช้งานและลำดับสิทธิ์ (5-Role RBAC Management)
          </h1>
          <p className="text-muted-foreground mt-1">
            กำหนดบทบาทผู้ใช้งานทั้ง 5 ระดับ: ผู้บริหาร (Executive), แอดมิน (Admin), ครู (Teacher), เจ้าหน้าที่ (Staff), และสภานักเรียน (Sapha Plus)
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/dashboard?tab=login_portals')}
            className="gap-2"
          >
            <Link2 className="w-4 h-4 text-primary" />
            จัดการลิงก์เข้าสู่ระบบ (Login Links)
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                เพิ่มผู้ใช้งานใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser
                    ? `แก้ไขบัญชีผู้ใช้: ${editingUser.display_name}`
                    : 'เพิ่มผู้ใช้งานใหม่และกำหนดบทบาท (Role)'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role Selection */}
                <div className="space-y-2 p-4 rounded-xl bg-secondary/60 border border-border">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">บทบาทและระดับสิทธิ์ (Role Hierarchy) *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleRoleChange(formData.role)}
                    >
                      <RotateCcw className="w-3 h-3" />
                      รีเซ็ตสิทธิ์เริ่มต้นตามบทบาท
                    </Button>
                  </div>

                  <Select
                    value={formData.role}
                    onValueChange={(val) => handleRoleChange(val as AdminRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาทผู้ใช้งาน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">
                        1. ผู้บริหารสถานศึกษา (Executive) - ดูสถิติและรายงานภาพรวม (Read-Only)
                      </SelectItem>
                      <SelectItem value="admin">
                        2. ผู้ดูแลระบบ (Admin) - จัดการผู้ใช้ ลิงก์ทางเข้า และตั้งค่าทั้งหมด
                      </SelectItem>
                      <SelectItem value="teacher">
                        3. ครูผู้สอน (Teacher) - จัดการคลังสื่อการสอนและลิงก์ประจำตัวครู
                      </SelectItem>
                      <SelectItem value="staff">
                        4. เจ้าหน้าที่ (Staff) - จัดการข่าวประชาสัมพันธ์ จดหมายข่าว และกิจกรรม
                      </SelectItem>
                      <SelectItem value="sapha_plus">
                        5. สภา / ระบบสภาพลัส (Sapha Plus) - บริหารจัดการงานสภานักเรียนและโมดูลสภาพลัส
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ROLE_INFO[formData.role]?.description}
                  </p>
                </div>

                {/* User Credentials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">ชื่อผู้ใช้ (Username) *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="เช่น teacher01, staff_pr, saphaplus"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {editingUser ? 'รีเซ็ตรหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน (Password) *'}
                    </Label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUser ? '•••••••• (ไม่เปลี่ยน)' : 'กรอกรหัสผ่าน'}
                        className="pl-9"
                        required={!editingUser}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">ชื่อ-นามสกุล / ตำแหน่งที่แสดง *</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="เช่น ครูสมชาย ใจดี (ภาษาไทย)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล (ใช้ล็อกอินแทน Username ได้)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@school.ac.th"
                    />
                  </div>
                </div>

                {/* Extra fields when Role == Teacher */}
                {formData.role === 'teacher' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-200">
                    <div className="space-y-2">
                      <Label>กลุ่มสาระการเรียนรู้ประจำตัวครู</Label>
                      <Select
                        value={formData.subject_department}
                        onValueChange={(val) =>
                          setFormData({ ...formData, subject_department: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกกลุ่มสาระฯ" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjectChoices.map((subj) => (
                            <SelectItem key={subj} value={subj}>
                              {subj}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom_link_slug">รหัสลิงก์ห้องสื่อประจำตัวครู (Slug)</Label>
                      <Input
                        id="custom_link_slug"
                        value={formData.custom_link_slug}
                        onChange={(e) =>
                          setFormData({ ...formData, custom_link_slug: e.target.value })
                        }
                        placeholder="เช่น kru-somchai"
                      />
                    </div>
                  </div>
                )}

                {/* Permissions Customization */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    สิทธิ์การเข้าถึงโมดูลย่อย (Access Permissions)
                  </Label>
                  {formData.role === 'admin' ? (
                    <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-200 text-xs text-red-700">
                      บทบาท <strong>Admin</strong> มีสิทธิ์เข้าถึงและบริหารจัดการทุกส่วนของระบบโดยอัตโนมัติ
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 border rounded-lg bg-card">
                      {ALL_ADMIN_MENUS.map((menu) => {
                        const isChecked =
                          menu.id === 'dashboard' || formData.permissions.includes(menu.id);
                        return (
                          <label
                            key={menu.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer text-xs ${
                              isChecked
                                ? 'bg-primary/5 border-primary/30'
                                : 'hover:bg-secondary/50 border-border'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              disabled={menu.id === 'dashboard'}
                              onCheckedChange={(checked) =>
                                handleTogglePermission(menu.id, Boolean(checked))
                              }
                              className="mt-0.5"
                            />
                            <div>
                              <span className="font-semibold text-foreground">{menu.label}</span>
                              <p className="text-[11px] text-muted-foreground">{menu.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label>เปิดให้บัญชีนี้เข้าใช้งานได้ (Active)</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit">
                      {editingUser ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้'}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 5 Roles Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {MAIN_ROLES.map((roleKey) => {
          const info = ROLE_INFO[roleKey];
          const count = users.filter((u) => normalizeRole(u.role) === roleKey).length;
          return (
            <Card key={roleKey} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${info.badgeClass}`}
                  >
                    {info.shortLabel}
                  </span>
                  <span className="text-2xl font-bold text-foreground">{count}</span>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-1">{info.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้งาน...</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const normalized = normalizeRole(user.role);
            const roleInfo = ROLE_INFO[normalized] || ROLE_INFO.staff;

            return (
              <Card key={user.id} className={!user.is_active ? 'opacity-60 bg-muted/30' : ''}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{user.display_name}</h3>
                        <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded">
                          @{user.username}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleInfo.badgeClass}`}
                        >
                          {roleInfo.label}
                        </span>
                        {user.subject_department && (
                          <Badge variant="outline" className="text-xs">
                            กลุ่มสาระฯ {user.subject_department}
                          </Badge>
                        )}
                        {!user.is_active && <Badge variant="destructive">ระงับสิทธิ์</Badge>}
                      </div>

                      {user.email && (
                        <p className="text-xs text-muted-foreground">อีเมล: {user.email}</p>
                      )}

                      <div className="flex flex-wrap gap-1 pt-1">
                        {normalized === 'admin' ? (
                          <Badge variant="secondary" className="text-[11px]">
                            สิทธิ์เต็มระบบ (Full Admin Access)
                          </Badge>
                        ) : (
                          (user.permissions || DEFAULT_ROLE_PERMISSIONS[normalized]).map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-[11px] font-normal">
                              {getMenuLabel(perm)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end lg:self-center">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={(checked) => handleToggleActive(user, checked)}
                        />
                        <span>{user.is_active ? 'เปิดใช้งาน' : 'ปิด'}</span>
                      </div>

                      <Button size="sm" variant="outline" onClick={() => handleOpenDialog(user)}>
                        <Edit className="w-4 h-4 mr-1" />
                        แก้ไขสิทธิ์/รหัสผ่าน
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(user)}
                        disabled={currentUser?.id === user.id}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        ลบ
                      </Button>
                    </div>
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
