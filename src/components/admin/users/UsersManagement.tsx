import { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Shield, UserCheck, KeyRound, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AdminRole,
  AdminUser,
  ALL_ADMIN_MENUS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_INFO,
  getCurrentAdminUser,
  setCurrentAdminUser,
} from '@/utils/authUtils';

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
    role: 'staff' as AdminRole,
    permissions: DEFAULT_ROLE_PERMISSIONS.staff,
    is_active: true,
  });

  const { toast } = useToast();
  const currentUser = getCurrentAdminUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching admin_users:', error);
      toast({
        variant: 'destructive',
        title: 'ยังไม่ได้สร้างตารางผู้ใช้งาน หรือโหลดข้อมูลไม่สำเร็จ',
        description: 'กรุณารันคำสั่ง SQL สร้างตาราง admin_users ใน Supabase SQL Editor',
      });
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
      role: 'staff',
      permissions: [...DEFAULT_ROLE_PERMISSIONS.staff],
      is_active: true,
    });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        display_name: user.display_name,
        email: user.email || '',
        role: user.role,
        permissions:
          user.role === 'super_admin'
            ? ALL_ADMIN_MENUS.map((m) => m.id)
            : Array.isArray(user.permissions)
              ? [...user.permissions]
              : [...DEFAULT_ROLE_PERMISSIONS[user.role]],
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
    if (menuId === 'dashboard') return; // Dashboard is always enabled
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
      formData.role === 'super_admin'
        ? ALL_ADMIN_MENUS.map((m) => m.id)
        : Array.from(new Set(['dashboard', ...formData.permissions]));

    try {
      if (editingUser) {
        const updatePayload: Record<string, any> = {
          username: formData.username.trim(),
          display_name: formData.display_name.trim(),
          email: formData.email.trim() || null,
          role: formData.role,
          permissions: finalPermissions,
          is_active: formData.is_active,
        };

        if (formData.password.trim() !== '') {
          updatePayload.password = formData.password.trim();
        }

        const { data, error } = await (supabase as any)
          .from('admin_users')
          .update(updatePayload)
          .eq('id', editingUser.id)
          .select()
          .single();

        if (error) throw error;

        if (currentUser && currentUser.id === editingUser.id && data) {
          setCurrentAdminUser(data);
        }

        toast({
          title: 'บันทึกสำเร็จ',
          description: `อัปเดตข้อมูลและสิทธิ์ของ ${formData.display_name} เรียบร้อยแล้ว`,
        });
      } else {
        if (!formData.password.trim()) {
          toast({
            variant: 'destructive',
            title: 'กรุณากรอกรหัสผ่าน',
            description: 'ต้องกำหนดรหัสผ่านสำหรับบัญชีผู้ใช้ใหม่',
          });
          return;
        }

        const { error } = await (supabase as any).from('admin_users').insert({
          username: formData.username.trim(),
          password: formData.password.trim(),
          display_name: formData.display_name.trim(),
          email: formData.email.trim() || null,
          role: formData.role,
          permissions: finalPermissions,
          is_active: formData.is_active,
        });

        if (error) throw error;

        toast({
          title: 'เพิ่มผู้ใช้งานสำเร็จ',
          description: `สร้างบัญชี ${formData.username} (${ROLE_INFO[formData.role].label}) เรียบร้อยแล้ว`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving admin_user:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: error.message?.includes('unique')
          ? 'ชื่อผู้ใช้นี้ (Username) มีอยู่ในระบบแล้ว'
          : error.message || 'ไม่สามารถบันทึกข้อมูลผู้ใช้ได้',
      });
    }
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

    const superAdminCount = users.filter((u) => u.role === 'super_admin').length;
    if (user.role === 'super_admin' && superAdminCount <= 1) {
      toast({
        variant: 'destructive',
        title: 'ไม่สามารถลบได้',
        description: 'ระบบต้องมีผู้ดูแลระบบสูงสุด (Super Admin) อย่างน้อย 1 บัญชี',
      });
      return;
    }

    if (!confirm(`ต้องการลบบัญชีผู้ใช้ "${user.display_name} (${user.username})" หรือไม่?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('admin_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'ลบสำเร็จ',
        description: `ลบบัญชี ${user.username} เรียบร้อยแล้ว`,
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบผู้ใช้งานได้',
      });
    }
  };

  const getMenuLabel = (menuId: string) => {
    return ALL_ADMIN_MENUS.find((m) => m.id === menuId)?.label || menuId;
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            จัดการผู้ใช้งานและระดับสิทธิ์ (Admin & Staff Levels)
          </h1>
          <p className="text-muted-foreground mt-1">
            กำหนดระดับผู้ใช้งาน (Level 1 - 3) และเลือกเมนูที่อนุญาตให้เข้าถึงรายบุคคล
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มผู้ใช้ / เจ้าหน้าที่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? `แก้ไขผู้ใช้: ${editingUser.display_name}` : 'เพิ่มผู้ใช้งานใหม่ (Admin / Staff)'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">ชื่อผู้ใช้สำหรับล็อกอิน (Username) *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="เช่น staff01 หรือ teacher_somchai"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {editingUser ? 'รหัสผ่านใหม่ (เว้นว่างไว้หากไม่เปลี่ยน)' : 'รหัสผ่าน (Password) *'}
                  </Label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingUser ? '•••••••• (ไม่เปลี่ยน)' : 'กำหนดรหัสผ่านอย่างน้อย 6 ตัวอักษร'}
                      className="pl-9"
                      required={!editingUser}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">ชื่อ-นามสกุล / ชื่อที่แสดง *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="เช่น ครูสมชาย ใจดี (งานประชาสัมพันธ์)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล (ถ้ามี)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="teacher@school.ac.th"
                  />
                </div>
              </div>

              {/* Role / Level Selector */}
              <div className="space-y-2 p-4 rounded-xl bg-secondary/60 border border-border">
                <div className="flex items-center justify-between">
                  <Label>ระดับผู้ใช้งาน (Role / Level) *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleRoleChange(formData.role)}
                  >
                    <RotateCcw className="w-3 h-3" />
                    รีเซ็ตสิทธิ์ตามค่าเริ่มต้นของระดับนี้
                  </Button>
                </div>
                <Select
                  value={formData.role}
                  onValueChange={(val) => handleRoleChange(val as AdminRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกระดับสิทธิ์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">
                      Staff (Level 1) - เจ้าหน้าที่ / ครูผู้รับผิดชอบเฉพาะส่วน
                    </SelectItem>
                    <SelectItem value="admin">
                      Admin (Level 2) - ผู้ดูแลระบบ (จัดการข้อมูลโรงเรียนทั้งหมด)
                    </SelectItem>
                    <SelectItem value="super_admin">
                      Super Admin (Level 3) - ผู้ดูแลระบบสูงสุด (เข้าถึงได้ทุกส่วน + จัดการผู้ใช้)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROLE_INFO[formData.role].description}
                </p>
              </div>

              {/* Custom Menu Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    กำหนดสิทธิ์การเข้าถึงเมนู (Custom Permissions)
                  </Label>
                  {formData.role !== 'super_admin' && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            permissions: ALL_ADMIN_MENUS.map((m) => m.id),
                          }))
                        }
                      >
                        เลือกทั้งหมด
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            permissions: ['dashboard'],
                          }))
                        }
                      >
                        ล้างทั้งหมด
                      </Button>
                    </div>
                  )}
                </div>

                {formData.role === 'super_admin' ? (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-200 text-sm text-red-700">
                    ระดับ <strong>Super Admin (Level 3)</strong> มีสิทธิ์เข้าถึงและจัดการได้ทุกเมนูในระบบโดยอัตโนมัติ
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-3 border rounded-lg bg-card">
                    {ALL_ADMIN_MENUS.map((menu) => {
                      const isChecked =
                        menu.id === 'dashboard' || formData.permissions.includes(menu.id);
                      return (
                        <label
                          key={menu.id}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
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
                          <div className="text-xs">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {menu.label}
                              {menu.adminOnly && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700">
                                  สำคัญ
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-0.5">{menu.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>เปิดใช้งานบัญชีนี้ (Active)</Label>
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

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['super_admin', 'admin', 'staff'] as AdminRole[]).map((roleKey) => {
          const info = ROLE_INFO[roleKey];
          const count = users.filter((u) => u.role === roleKey).length;
          return (
            <Card key={roleKey}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${info.badgeClass}`}>
                    {info.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">{info.description}</p>
                </div>
                <div className="text-3xl font-bold text-foreground pl-4">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้งาน...</div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มีข้อมูลผู้ใช้งานในฐานข้อมูล</h3>
            <p className="text-sm text-muted-foreground mb-4">
              กรุณารันคำสั่ง SQL สร้างตาราง admin_users หรือกดปุ่มเพิ่มผู้ใช้ด้านบน
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้ใช้คนแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const roleInfo = ROLE_INFO[user.role] || ROLE_INFO.staff;
            const userPermissions =
              user.role === 'super_admin'
                ? ALL_ADMIN_MENUS.map((m) => m.id)
                : user.permissions || [];

            return (
              <Card key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{user.display_name}</h3>
                        <span className="text-sm text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded">
                          @{user.username}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleInfo.badgeClass}`}
                        >
                          {roleInfo.label}
                        </span>
                        {!user.is_active && (
                          <Badge variant="destructive">ระงับการใช้งาน</Badge>
                        )}
                        {currentUser?.id === user.id && (
                          <Badge variant="secondary">บัญชีของคุณ</Badge>
                        )}
                      </div>

                      {user.email && (
                        <p className="text-xs text-muted-foreground">อีเมล: {user.email}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs font-medium text-muted-foreground mr-1">
                          สิทธิ์เข้าถึงเมนู:
                        </span>
                        {user.role === 'super_admin' ? (
                          <Badge variant="outline" className="text-xs bg-red-500/5">
                            เข้าถึงได้ทุกเมนูในระบบ (Full Access)
                          </Badge>
                        ) : (
                          userPermissions.map((permId) => (
                            <Badge key={permId} variant="secondary" className="text-xs font-normal">
                              {getMenuLabel(permId)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <Button size="sm" variant="outline" onClick={() => handleOpenDialog(user)}>
                        <Edit className="w-4 h-4 mr-1" />
                        แก้ไขสิทธิ์ / รหัสผ่าน
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

