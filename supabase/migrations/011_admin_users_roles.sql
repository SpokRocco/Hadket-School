-- =============================================
-- 011_admin_users_roles.sql
-- Admin & Staff Users with Role Levels & Custom Permissions
-- =============================================

DROP TABLE IF EXISTS public.admin_users CASCADE;

CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  role VARCHAR(30) NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff')),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['dashboard', 'news', 'gallery', 'events', 'students', 'admissions'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_users IS 'ตารางเก็บข้อมูลบัญชีผู้ใช้งานระบบหลังบ้าน (Admin & Staff) และสิทธิ์การเข้าถึงเมนู';
COMMENT ON COLUMN public.admin_users.role IS 'ระดับผู้ใช้งาน: super_admin (Level 3), admin (Level 2), staff (Level 1)';
COMMENT ON COLUMN public.admin_users.permissions IS 'รายการเมนูที่อนุญาตให้เข้าถึง (Array ของ menu id)';

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for admin_users" ON public.admin_users;
CREATE POLICY "Allow full access for admin_users"
  ON public.admin_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Admin & Staff accounts
INSERT INTO public.admin_users (username, password, display_name, email, role, permissions, is_active) VALUES
  (
    'admin',
    'admin123',
    'ผู้ดูแลระบบสูงสุด (Super Admin)',
    'admin@school.ac.th',
    'super_admin',
    ARRAY['dashboard', 'news', 'gallery', 'events', 'students', 'admissions', 'staff', 'administrators', 'curriculum', 'activities', 'milestones', 'facilities', 'messages', 'faq', 'settings', 'users'],
    true
  ),
  (
    'staff',
    'staff123',
    'เจ้าหน้าที่ประชาสัมพันธ์และทะเบียน (Staff)',
    'staff@school.ac.th',
    'staff',
    ARRAY['dashboard', 'news', 'gallery', 'events', 'students', 'admissions'],
    true
  )
ON CONFLICT (username) DO NOTHING;

