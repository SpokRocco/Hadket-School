import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, User, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AdminUser,
  DEFAULT_ROLE_PERMISSIONS,
  getLocalLoginPortals,
  getLocalUsers,
  LoginPortalLink,
  normalizeRole,
  ROLE_INFO,
  saveLocalUsers,
  setCurrentAdminUser,
} from '@/utils/authUtils';

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePortal, setActivePortal] = useState<LoginPortalLink | null>(null);
  const [portalRevoked, setPortalRevoked] = useState(false);

  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get('portal');
  const tokenParam = searchParams.get('token');

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    validatePortalLink();
  }, [portalParam, tokenParam]);

  const validatePortalLink = async () => {
    if (!portalParam && !tokenParam) {
      setActivePortal(null);
      setPortalRevoked(false);
      return;
    }

    let portals = getLocalLoginPortals();

    try {
      const { data, error } = await (supabase as any)
        .from('login_portals')
        .select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        portals = data;
      }
    } catch {
      // Fallback to localStorage portals
    }

    const matched = portals.find((p) => {
      if (tokenParam && p.token === tokenParam) return true;
      if (portalParam && p.portal_key.toLowerCase() === portalParam.toLowerCase()) return true;
      return false;
    });

    if (!matched || !matched.is_active) {
      setPortalRevoked(true);
      setActivePortal(null);
    } else {
      setPortalRevoked(false);
      setActivePortal(matched);
    }
  };

  const routeAfterLogin = (user: AdminUser) => {
    const normalizedRole = normalizeRole(user.role);
    setCurrentAdminUser({ ...user, role: normalizedRole });

    const roleMeta = ROLE_INFO[normalizedRole] || ROLE_INFO.staff;
    toast({
      title: 'เข้าสู่ระบบสำเร็จ',
      description: `ยินดีต้อนรับ ${user.display_name} (${roleMeta.label})`,
    });

    navigate(`/admin/dashboard?tab=${roleMeta.defaultTab}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portalRevoked) {
      toast({
        title: 'ไม่สามารถเข้าสู่ระบบผ่านลิงก์นี้ได้',
        description: 'ลิงก์ทางเข้าสู่ระบบนี้ถูกยกเลิกหรือหมดอายุแล้ว',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const trimmedId = identifier.trim();

      // 1. ตรวจสอบจากตาราง admin_users ในฐานข้อมูล Supabase
      const { data: dbUsers, error } = await (supabase as any)
        .from('admin_users')
        .select('*')
        .or(`username.eq.${trimmedId},email.eq.${trimmedId}`);

      let dbUser = Array.isArray(dbUsers)
        ? dbUsers.find((u: any) => u.password === password || u.password_hash === password)
        : null;

      // 1.1 ถ้ายังไม่พบในตาราง admin_users ให้ตรวจสอบสำรองจาก school_settings.admin_users_json
      if (!dbUser) {
        try {
          const { data: settingData } = await (supabase as any)
            .from('school_settings')
            .select('value')
            .eq('key', 'admin_users_json')
            .single();

          if (settingData?.value) {
            const parsed = JSON.parse(settingData.value);
            if (Array.isArray(parsed)) {
              dbUser = parsed.find(
                (u: any) =>
                  (u.username?.toLowerCase() === trimmedId.toLowerCase() ||
                    (u.email && u.email.toLowerCase() === trimmedId.toLowerCase())) &&
                  (u.password === password || u.password_hash === password)
              );
            }
          }
        } catch (sErr) {
          console.warn('school_settings login fallback note:', sErr);
        }
      }

      if (dbUser) {
        if (!dbUser.is_active) {
          toast({
            title: 'บัญชีถูกระงับการใช้งาน',
            description: 'กรุณาติดต่อผู้ดูแลระบบ (Admin) เพื่อเปิดสิทธิ์การเข้าใช้งาน',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const userRole = normalizeRole(dbUser.role);

        // หากเข้าผ่านลิงก์เฉพาะกลุ่ม ให้ตรวจสอบว่าตรงกับกลุ่มเป้าหมายหรือไม่ (ยกเว้น Admin เข้าได้ทุกลิงก์)
        if (
          activePortal &&
          activePortal.target_role !== 'all' &&
          userRole !== 'admin' &&
          normalizeRole(activePortal.target_role) !== userRole
        ) {
          toast({
            title: 'ลิงก์ทางเข้าไม่ตรงกับบทบาทของคุณ',
            description: `ลิงก์นี้สำหรับ ${ROLE_INFO[normalizeRole(activePortal.target_role)]?.label}`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        try {
          const isUuid =
            typeof dbUser.id === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              dbUser.id
            );
          let updateQuery = (supabase as any)
            .from('admin_users')
            .update({ last_login: new Date().toISOString() });
          if (isUuid) {
            updateQuery = updateQuery.eq('id', dbUser.id);
          } else {
            updateQuery = updateQuery.eq('username', dbUser.username);
          }
          await updateQuery;
        } catch {
          // ignore
        }

        const loggedInUser: AdminUser = {
          id: dbUser.id || `user-${Date.now()}`,
          username: dbUser.username,
          display_name: dbUser.display_name,
          email: dbUser.email,
          role: userRole,
          subject_department: dbUser.subject_department || null,
          custom_link_slug: dbUser.custom_link_slug || null,
          google_site_url: dbUser.google_site_url || null,
          permissions:
            Array.isArray(dbUser.permissions) && dbUser.permissions.length > 0
              ? dbUser.permissions
              : DEFAULT_ROLE_PERMISSIONS[userRole],
          is_active: dbUser.is_active !== false,
          last_login: new Date().toISOString(),
        };

        routeAfterLogin(loggedInUser);
        return;
      }

      // 2. ตรวจสอบจาก Local State (Seed & LocalStorage Users)
      const localUsers = getLocalUsers();
      const matchedLocal = localUsers.find(
        (u) =>
          (u.username.toLowerCase() === trimmedId.toLowerCase() ||
            (u.email && u.email.toLowerCase() === trimmedId.toLowerCase())) &&
          (u.password === password || u.password_hash === password)
      );

      if (matchedLocal) {
        if (!matchedLocal.is_active) {
          toast({
            title: 'บัญชีถูกระงับการใช้งาน',
            description: 'กรุณาติดต่อผู้ดูแลระบบ (Admin) เพื่อเปิดสิทธิ์การเข้าใช้งาน',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const userRole = normalizeRole(matchedLocal.role);

        if (
          activePortal &&
          activePortal.target_role !== 'all' &&
          userRole !== 'admin' &&
          normalizeRole(activePortal.target_role) !== userRole
        ) {
          toast({
            title: 'ลิงก์ทางเข้าไม่ตรงกับบทบาทของคุณ',
            description: `ลิงก์นี้สำหรับ ${ROLE_INFO[normalizeRole(activePortal.target_role)]?.label}`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const updatedUser: AdminUser = {
          ...matchedLocal,
          role: userRole,
          last_login: new Date().toISOString(),
        };

        const updatedList = localUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
        saveLocalUsers(updatedList);

        routeAfterLogin(updatedUser);
        return;
      }

      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง',
        variant: 'destructive',
      });
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        description: 'กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-navy-light flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl border border-border/50 rounded-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardHeader className="text-center pb-3 pt-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary shadow-lg flex items-center justify-center border-2 border-accent/40">
            <ShieldCheck className="w-10 h-10 text-accent" />
          </div>
          {activePortal && (
            <div className="mb-2">
              <Badge
                variant="outline"
                className={
                  activePortal.target_role !== 'all'
                    ? ROLE_INFO[normalizeRole(activePortal.target_role)]?.badgeClass
                    : 'bg-primary/10 text-primary'
                }
              >
                {activePortal.title}
              </Badge>
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-primary">
            ระบบจัดการหลังบ้านของสถานศึกษา
          </CardTitle>
          <CardDescription>
            {activePortal
              ? activePortal.description
              : 'School Back-Office Management System'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8 px-6 sm:px-8">
          {portalRevoked ? (
            <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 text-center space-y-3">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <h3 className="font-bold text-destructive text-base">
                ลิงก์ทางเข้าสู่ระบบนี้ถูกยกเลิกแล้ว
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ลิงก์ทางเข้าเฉพาะกิจที่คุณใช้งานอาจถูกยกเลิกหรือลบโดยผู้ดูแลระบบ กรุณาเข้าสู่ระบบผ่านหน้าล็อกอินหลัก
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="w-full"
              >
                ไปยังหน้าเข้าสู่ระบบหลัก
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier">ชื่อผู้ใช้ หรือ อีเมล (Username / Email)</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10 h-11"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน (Password)</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-semibold text-base" disabled={isLoading}>
                {isLoading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับสู่หน้าเว็บไซต์หลัก
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
