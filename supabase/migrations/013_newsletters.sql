-- =============================================
-- 013_newsletters.sql
-- School Newsletters (จดหมายข่าวประชาสัมพันธ์)
-- =============================================

DROP TABLE IF EXISTS public.newsletters CASCADE;

CREATE TABLE public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_no VARCHAR(50) NOT NULL DEFAULT '01',
  academic_year VARCHAR(20) NOT NULL DEFAULT '2568',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'กิจกรรมสถานศึกษา',
  image_url TEXT,
  file_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.newsletters IS 'ตารางเก็บจดหมายข่าวประชาสัมพันธ์ของโรงเรียน (School Newsletter)';

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for newsletters" ON public.newsletters;
CREATE POLICY "Allow full access for newsletters"
  ON public.newsletters
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_newsletters_updated_at ON public.newsletters;
CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.newsletters (issue_no, academic_year, issue_date, title, summary, content, category, views, order_position) VALUES
  (
    '01',
    '2568',
    CURRENT_DATE,
    'กิจกรรมปฐมนิเทศนักเรียนใหม่ และประชุมผู้ปกครองประจำภาคเรียนที่ 1',
    'ผู้อำนวยการโรงเรียนเป็นประธานในพิธีปฐมนิเทศนักเรียนใหม่ พร้อมชี้แจงนโยบายการจัดการศึกษาและแนวทางการพัฒนาผู้เรียนร่วมกับผู้ปกครอง',
    'ทางโรงเรียนได้จัดกิจกรรมปฐมนิเทศนักเรียนใหม่และประชุมผู้ปกครองประจำภาคเรียนที่ 1 เพื่อสร้างความเข้าใจอันดีระหว่างบ้านและโรงเรียน พร้อมแนะนำคณะครูประจำชั้นและแนวทางการส่งเสริมการเรียนรู้ในยุคดิจิทัล',
    'กิจกรรมสถานศึกษา',
    156,
    1
  ),
  (
    '02',
    '2568',
    CURRENT_DATE,
    'การอบรมเชิงปฏิบัติการพัฒนาสื่อการสอนออนไลน์ด้วยเทคโนโลยีดิจิทัลและ AI',
    'คณะครูเข้าร่วมการอบรมพัฒนาคลังสื่อการสอนออนไลน์ (Google Sites) เพื่อยกระดับการจัดการเรียนรู้ในศตวรรษที่ 21',
    'คณะครูทุกกลุ่มสาระการเรียนรู้เข้าร่วมกิจกรรมพัฒนาวิชาชีพ (PLC) ในการสร้างและพัฒนาคลังสื่อการสอนออนไลน์ เพื่อให้นักเรียนสามารถทบทวนบทเรียนได้ทุกที่ทุกเวลา',
    'งานวิชาการ',
    142,
    2
  ),
  (
    '03',
    '2568',
    CURRENT_DATE,
    'ขอแสดงความยินดีกับนักเรียนที่ได้รับรางวัลชนะเลิศการแข่งขันทักษะวิชาการ',
    'ตัวแทนนักเรียนคว้ารางวัลเหรียญทองจากการแข่งขันทักษะวิชาการระดับเขตพื้นที่การศึกษา สร้างชื่อเสียงและความภาคภูมิใจให้แก่โรงเรียน',
    'โรงเรียนขอแสดงความยินดีกับนักเรียนและครูผู้ฝึกซ้อมที่ได้รับรางวัลเหรียญทองชนะเลิศจากการแข่งขันทักษะวิชาการ เป็นแบบอย่างที่ดีด้านความมุ่งมั่นตั้งใจศึกษาเล่าเรียน',
    'ผลงานและความภูมิใจ',
    218,
    3
  );

