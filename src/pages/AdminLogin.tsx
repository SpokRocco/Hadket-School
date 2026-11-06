import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AdminUser,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_INFO,
  setCurrentAdminUser,
} from '@/utils/authUtils';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedUsername = username.trim();

      // 1. ตรวจสอบจากตาราง admin_users ในฐานข้อมูล Supabase
      const { data: dbUser, error } = await (supabase as any)
        .from('admin_users')
        .select('*')
        .eq('username', trimmedUsername)
        .eq('password', password)
        .maybeSingle();

      if (!error && dbUser) {
        if (!dbUser.is_active) {
          toast({
            title: 'บัญชีถูกระงับการใช้งาน',
            description: 'กรุณาติดต่อผู้ดูแลระบบสูงสุด (Super Admin)',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // อัปเดตเวลาเข้าสู่ระบบล่าสุด
        await (supabase as any)
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', dbUser.id);

        const loggedInUser: AdminUser = {
          id: dbUser.id,
          username: dbUser.username,
          display_name: dbUser.display_name,
          email: dbUser.email,
          role: dbUser.role,
          permissions: Array.isArray(dbUser.permissions)
            ? dbUser.permissions
            : DEFAULT_ROLE_PERMISSIONS[dbUser.role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || DEFAULT_ROLE_PERMISSIONS.staff,
          is_active: dbUser.is_active,
          last_login: new Date().toISOString(),
        };

        setCurrentAdminUser(loggedInUser);
        toast({
          title: 'เข้าสู่ระบบสำเร็จ',
          description: `ยินดีต้อนรับ ${loggedInUser.display_name} (${ROLE_INFO[loggedInUser.role]?.label || loggedInUser.role})`,
        });
        navigate('/admin/dashboard');
        return;
      }

      // 2. Fallback กรณีที่ยังไม่ได้รัน SQL สร้างตาราง admin_users หรือใช้บัญชีเริ่มต้น
      if (error || !dbUser) {
        if (trimmedUsername === 'admin' && password === 'admin123') {
          const fallbackAdmin: AdminUser = {
            id: 'default-super-admin',
            username: 'admin',
            display_name: 'ผู้ดูแลระบบสูงสุด',
            email: 'admin@school.ac.th',
            role: 'super_admin',
            permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
            is_active: true,
          };
          setCurrentAdminUser(fallbackAdmin);
          toast({
            title: 'เข้าสู่ระบบสำเร็จ',
            description: `ยินดีต้อนรับ ${fallbackAdmin.display_name} (${ROLE_INFO.super_admin.label})`,
          });
          navigate('/admin/dashboard');
          return;
        }

        if (trimmedUsername === 'staff' && password === 'staff123') {
          const fallbackStaff: AdminUser = {
            id: 'default-staff',
            username: 'staff',
            display_name: 'เจ้าหน้าที่ประชาสัมพันธ์และทะเบียน',
            email: 'staff@school.ac.th',
            role: 'staff',
            permissions: DEFAULT_ROLE_PERMISSIONS.staff,
            is_active: true,
          };
          setCurrentAdminUser(fallbackStaff);
          toast({
            title: 'เข้าสู่ระบบสำเร็จ',
            description: `ยินดีต้อนรับ ${fallbackStaff.display_name} (${ROLE_INFO.staff.label})`,
          });
          navigate('/admin/dashboard');
          return;
        }
      }

      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        variant: 'destructive',
      });
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <span className="text-accent font-bold text-2xl">วค</span>
          </div>
          <CardTitle className="text-2xl text-primary">ระบบจัดการโรงเรียน</CardTitle>
          <CardDescription>กรุณาเข้าสู่ระบบสำหรับ Admin และ Staff</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้ (เช่น admin หรือ staff)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับสู่หน้าหลัก
            </button>
          </div>

          <div className="mt-4 p-3 bg-secondary rounded-lg space-y-1">
            <p className="text-xs text-center text-muted-foreground">
              <strong>Super Admin (Level 3):</strong> admin | รหัสผ่าน: admin123
            </p>
            <p className="text-xs text-center text-muted-foreground">
              <strong>Staff (Level 1):</strong> staff | รหัสผ่าน: staff123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
