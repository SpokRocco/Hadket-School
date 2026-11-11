import {
  DEFAULT_LOGIN_PORTALS,
  SEED_ADMIN_USERS,
} from '@/utils/authUtils';
import heroSchool1 from '@/assets/hero-school-1.jpg';
import heroSchool2 from '@/assets/hero-school.jpg';
// real school campus hero uses heroSchool2
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';
// classroom fallback uses heroSchool1

const STORAGE_PREFIX = 'kk_school_mock_db_v2_';

const memoryStore = new Map<string, string>();

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fallback to memory
  }
  return memoryStore.get(key) ?? null;
};

const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // fallback to memory
  }
  memoryStore.set(key, value);
};

const nowIso = () => new Date().toISOString();
const futureDateStr = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SEED_DATA: Record<string, any[]> = {
  school_settings: [
    { id: 'set-1', key: 'school_name', value: 'โรงเรียนบ้านหาดเค็ด', category: 'general' },
    { id: 'set-2', key: 'school_short_name', value: 'บหค', category: 'general' },
    { id: 'set-3', key: 'school_tagline', value: 'ก้าวสู่อนาคตด้วยปัญญา', category: 'general' },
    { id: 'set-4', key: 'academic_year', value: '2569', category: 'general' },
  ],
  news_categories: [
    { id: 'cat-1', name: 'ข่าวประชาสัมพันธ์', description: 'ข่าวประชาสัมพันธ์และการตรวจประเมินคุณภาพการศึกษาภายในโรงเรียน', color: 'blue', created_at: nowIso() },
    { id: 'cat-2', name: 'กิจกรรมนักเรียน', description: 'กิจกรรมล่าสุดและโครงการพัฒนาศักยภาพผู้เรียนรอบด้าน', color: 'green', created_at: nowIso() },
    { id: 'cat-3', name: 'ผลงานนักเรียน', description: 'ทำเนียบคนเก่งและผลงานวิชาการระดับชาติของนักเรียน', color: 'purple', created_at: nowIso() },
    { id: 'cat-4', name: 'ความภาคภูมิใจ', description: 'รางวัลเกียรติยศและความภาคภูมิใจของสถาบัน', color: 'amber', created_at: nowIso() },
    { id: 'cat-5', name: 'ประกาศ', description: 'ประกาศสำคัญและการรับสมัครนักเรียนใหม่', color: 'red', created_at: nowIso() },
  ],
  news: [
    {
      id: 'news-1',
      title: 'ประเมินคุณภาพการศึกษาภายในโรงเรียน ตามเกณฑ์คุณภาพการศึกษาเพื่อการดำเนินการที่เป็นเลิศ ประจำปีการศึกษา 2569',
      content: '<p>กองอำนวยการออกตรวจประเมินคุณภาพการศึกษาภายในโรงเรียนตามเกณฑ์คุณภาพการศึกษาเพื่อการดำเนินการที่เป็นเลิศ ประจำปีการศึกษา 2569 (Summer) เพื่อเป็นประโยชน์ต่อการพัฒนาคุณภาพการจัดการเรียนรู้และสภาพแวดล้อมภายในโรงเรียนให้ได้มาตรฐานดีเลิศต่อไป</p><p>คณะกรรมการตรวจประเมินได้เข้าเยี่ยมชมชั้นเรียน English Programme ห้องปฏิบัติการวิทยาศาสตร์ และระบบคลังสื่อดิจิทัลของคณะครู พร้อมให้ข้อเสนอแนะเชิงสร้างสรรค์ในการยกระดับผลสัมฤทธิ์ทางการเรียนของผู้เรียนทุกระดับชั้น</p>',
      excerpt: 'กองอำนวยการออกตรวจประเมินคุณภาพการศึกษาภายในระดับโรงเรียนตามเกณฑ์คุณภาพการศึกษาเพื่อการดำเนินการที่เป็นเลิศ ประจำปีการศึกษา 2569 เพื่อพัฒนาคุณภาพสู่มาตรฐานดีเลิศ',
      category: 'ข่าวประชาสัมพันธ์',
      published: true,
      published_at: '2026-11-09T09:00:00.000Z',
      views: 642,
      is_pinned: true,
      sort_order: 1,
      cover_image_url: heroSchool2,
      external_links: [{ title: 'ดูรายละเอียดเกณฑ์การประเมินคุณภาพ', url: '/about' }],
      created_at: '2026-11-09T09:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-2',
      title: 'โรงเรียนได้รับการรับรองเป็นองค์กรสุขภาพเพื่อการสร้างชาติ Certificate of Achievement ระดับ 5A',
      content: '<p>ขอแสดงความยินดีในโอกาสที่สถานศึกษาได้รับการรับรองเป็นองค์กรสุขภาพเพื่อการสร้างชาติ (Certificate of Achievement ระดับ 5A) ร่วมกับการตรวจประเมินคุณภาพการศึกษาภายในโรงเรียน ประจำปีการศึกษา 2569 สะท้อนถึงความมุ่งมั่นในการดูแลสุขภาวะ โภชนาการ และสภาพแวดล้อมที่ปลอดภัยสำหรับนักเรียนและบุคลากรทุกคน</p>',
      excerpt: 'ได้รับการรับรองเป็นองค์กรสุขภาพเพื่อการสร้างชาติ Certificate of Achievement ระดับ 5A และการประเมินคุณภาพการศึกษาภายในระดับดีเลิศ',
      category: 'ความภาคภูมิใจ',
      published: true,
      published_at: '2026-10-15T10:00:00.000Z',
      views: 538,
      is_pinned: true,
      sort_order: 2,
      cover_image_url: studentGraduationActivity,
      external_links: [],
      created_at: '2026-10-15T10:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-3',
      title: 'เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2570 และกิจกรรม Open House Experience Day ทดลองเรียนฟรี',
      content: '<p>ขอเชิญน้องๆ และครอบครัวร่วมสัมผัสบรรยากาศการเรียนรู้ในงาน OPEN HOUSE EXPERIENCE DAY เปิดรับสมัครนักเรียนใหม่ ปีการศึกษา 2570 ทั้งหลักสูตรสามัญศึกษา และหลักสูตรสองภาษา (English Programme) พร้อมรับสิทธิ์ทุนศักยภาพเป็นเลิศ (GPA 3.70 ขึ้นไป หรือผลงานระดับเขต/จังหวัด/ประเทศ) และสิทธิพิเศษสำหรับครอบครัวและบุตรศิษย์เก่า</p>',
      excerpt: 'ขอเชิญน้องๆ และครอบครัวร่วมสัมผัสบรรยากาศการเรียนรู้ในงาน Open House Experience Day พร้อมทดลองเรียนฟรีและรับทุนศักยภาพเป็นเลิศ',
      category: 'ข่าวประชาสัมพันธ์',
      published: true,
      published_at: '2026-09-18T08:30:00.000Z',
      views: 890,
      is_pinned: true,
      sort_order: 3,
      cover_image_url: heroSchool1,
      external_links: [{ title: 'สมัครเรียนออนไลน์ทันที', url: '/enrollment' }],
      created_at: '2026-09-18T08:30:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-4',
      title: 'ตรวจประเมินคุณภาพการศึกษาภายในระดับโรงเรียน ภาคเรียนฤดูร้อน และติดตามโครงการพัฒนาวิชาการ',
      content: '<p>คณะกรรมการตรวจประเมินคุณภาพการศึกษาภายในเข้าตรวจเยี่ยมการจัดกิจกรรมการเรียนการสอน การวัดและประเมินผลตามสภาพจริง และการบริหารจัดการชั้นเรียนคุณภาพ เพื่อยกระดับสมรรถนะผู้เรียนในศตวรรษที่ 21</p>',
      excerpt: 'การตรวจติดตามและประเมินคุณภาพการศึกษาภายในโรงเรียนอย่างต่อเนื่อง เพื่อรักษามาตรฐานความเป็นเลิศทางวิชาการและการดูแลผู้เรียน',
      category: 'ข่าวประชาสัมพันธ์',
      published: true,
      published_at: '2026-08-24T09:00:00.000Z',
      views: 412,
      is_pinned: false,
      sort_order: 4,
      cover_image_url: heroSchool2,
      external_links: [],
      created_at: '2026-08-24T09:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-5',
      title: 'พิธีมอบวุฒิบัตร นักเรียนชั้นมัธยมศึกษาปีที่ 6 รุ่นที่ 12 ประจำปีการศึกษา 2568',
      content: '<p>ณ อาคารหอประชุมใหญ่ โรงเรียนได้จัดกิจกรรมพิธีมอบวุฒิบัตรแก่นักเรียนระดับชั้นมัธยมศึกษาปีที่ 6 รุ่นที่ 12 ที่สำเร็จการศึกษาประจำปีการศึกษา 2568 ท่ามกลางบรรยากาศแห่งความภาคภูมิใจของคณะผู้บริหาร คณะครู ผู้ปกครอง และนักเรียนทุกคน</p>',
      excerpt: 'ณ อาคารหอประชุมใหญ่ โรงเรียนได้จัดพิธีมอบวุฒิบัตรแก่นักเรียนระดับชั้นมัธยมศึกษาปีที่ 6 รุ่นที่ 12 ที่สำเร็จการศึกษาอย่างภาคภูมิ',
      category: 'กิจกรรมนักเรียน',
      published: true,
      published_at: '2026-07-24T10:00:00.000Z',
      views: 675,
      is_pinned: false,
      sort_order: 5,
      cover_image_url: studentGraduationActivity,
      external_links: [],
      created_at: '2026-07-24T10:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-6',
      title: 'วจนพิธีปิดปีการศึกษา และพิธีมอบผ้าพันคอสายใย ประจำปีการศึกษา 2568',
      content: '<p>โรงเรียนได้จัดวจนพิธีปิดปีการศึกษาและพิธีมอบผ้าพันคอสายใย โดยมีนักเรียนระดับชั้นมัธยมศึกษาปีที่ 1 - 6 เข้าร่วมอย่างพร้อมเพรียง เพื่อแสดงความกตัญญูกตเวทีและเสริมสร้างความผูกพันอันอบอุ่นระหว่างรุ่นพี่และรุ่นน้อง</p>',
      excerpt: 'กิจกรรมวจนพิธีปิดปีการศึกษาและพิธีมอบผ้าพันคอสายใย โดยมีนักเรียนระดับมัธยมศึกษาปีที่ 1 - 6 เข้าร่วมด้วยความอบอุ่นและพร้อมเพรียง',
      category: 'กิจกรรมนักเรียน',
      published: true,
      published_at: '2026-07-20T09:30:00.000Z',
      views: 498,
      is_pinned: false,
      sort_order: 6,
      cover_image_url: heroSchool2,
      external_links: [],
      created_at: '2026-07-20T09:30:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-7',
      title: 'ทัศนศึกษา เปิดโลกแห่งศิลปะ ณ หอศิลป์ และศูนย์วิทยาศาสตร์เพื่อการศึกษา "ควงคู่ดูดาวปีที่ 7"',
      content: '<p>นักเรียนเข้าร่วมกิจกรรมทัศนศึกษาเรียนรู้แหล่งรวบรวมการจัดแสดงผลงานศิลปะ ภาพยนตร์ ละครเวที ดนตรี วรรณกรรม และการออกแบบสร้างสรรค์ พร้อมทั้งเข้าร่วมโครงการสร้างเสริมความรู้ทางวิทยาศาสตร์และดาราศาสตร์ "ควงคู่ดูดาวปีที่ 7" ณ ศูนย์วิทยาศาสตร์เพื่อการศึกษา</p>',
      excerpt: 'เรียนรู้การจัดแสดงผลงานศิลปะร่วมสมัย และการออกแบบสร้างสรรค์ พร้อมเข้าร่วมโครงการวิทยาศาสตร์และดาราศาสตร์ "ควงคู่ดูดาวปีที่ 7"',
      category: 'กิจกรรมนักเรียน',
      published: true,
      published_at: '2026-06-18T08:00:00.000Z',
      views: 445,
      is_pinned: false,
      sort_order: 7,
      cover_image_url: heroSchool1,
      external_links: [],
      created_at: '2026-06-18T08:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-8',
      title: 'กิจกรรม Youth Leadership Network Camp พัฒนาศักยภาพเครือข่ายผู้นำเยาวชนรุ่นใหม่',
      content: '<p>ตัวแทนนักเรียนเข้าร่วมค่ายพัฒนาศักยภาพผู้นำเยาวชน Youth Leadership Network Camp เพื่อฝึกฝนทักษะการเป็นผู้นำ การทำงานร่วมกับผู้อื่น การคิดวิเคราะห์แก้ปัญหาเชิงสร้างสรรค์ และการสร้างเครือข่ายเยาวชนต้นแบบ</p>',
      excerpt: 'ผู้แทนนักเรียนเข้าร่วมค่าย Youth Leadership Network Camp ฝึกฝนทักษะความเป็นผู้นำ การทำงานเป็นทีม และการสร้างเครือข่ายเยาวชน',
      category: 'กิจกรรมนักเรียน',
      published: true,
      published_at: '2026-06-10T11:00:00.000Z',
      views: 389,
      is_pinned: false,
      sort_order: 8,
      cover_image_url: studentScienceLab,
      external_links: [],
      created_at: '2026-06-10T11:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-9',
      title: 'CATC OPEN HOUSE “Universe of Aviation” ก้าวเข้าสู่บ้านค้นหาโอกาสในจักรวาลแห่งการบิน',
      content: '<p>อีกหนึ่งกิจกรรมของชมรมมุ่งสู่อาชีพสายการบิน (Inspiration Club) เปิดโอกาสให้นักเรียนได้ศึกษาดูงานและเรียนรู้ทักษะวิชาชีพด้านการบิน วิศวกรรมอากาศยาน และการจัดการจราจรทางอากาศ ณ สถาบันการบินพลเรือน</p>',
      excerpt: 'ก้าวเข้าสู่บ้านค้นหาโอกาสในจักรวาลแห่งการบิน กิจกรรมชมรมมุ่งสู่อาชีพสายการบิน Inspiration Club เปิดโลกทัศน์สู่วิชาชีพการบิน',
      category: 'กิจกรรมนักเรียน',
      published: true,
      published_at: '2026-05-28T13:00:00.000Z',
      views: 410,
      is_pinned: false,
      sort_order: 9,
      cover_image_url: heroSchool1,
      external_links: [],
      created_at: '2026-05-28T13:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-10',
      title: 'ภาพบรรยากาศการสอบประเมินความรู้ทางภาษาอังกฤษตามมาตรฐานสากล "CEFR" ระดับชั้น EP และสามัญ',
      content: '<p>เวลาเรียนก็ตั้งใจ! ภาพบรรยากาศการสอบประเมินความรู้ความสามารถทางภาษาอังกฤษตามกรอบมาตรฐานสากล CEFR (Common European Framework of Reference for Languages) สำหรับนักเรียนระดับชั้น EP และหลักสูตรสามัญ ม.1 - ม.6</p>',
      excerpt: 'ภาพบรรยากาศการสอบประเมินความรู้ทางภาษาอังกฤษตามมาตรฐานสากล "CEFR" ระดับชั้น EP และมัธยมศึกษาปีที่ 1 - 6',
      category: 'กิจกรรมนักเรียน',
      published: true,
      published_at: '2026-05-14T09:00:00.000Z',
      views: 372,
      is_pinned: false,
      sort_order: 10,
      cover_image_url: heroSchool1,
      external_links: [],
      created_at: '2026-05-14T09:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-11',
      title: 'ถึงดูไม่เหมือนเด็ก Nurse แต่ก็เรียน First Aid มานะ: อบรมเชิงปฏิบัติการการปฐมพยาบาลเบื้องต้น',
      content: '<p>นักเรียนระดับชั้นมัธยมศึกษาตอนปลายเข้าร่วมอบรมเชิงปฏิบัติการหลักการปฐมพยาบาลและการดูแลผู้ป่วยเบื้องต้น (First Aid & Basic Life Support) ฝึกปฏิบัติการทำ CPR และการช่วยเหลือผู้ประสบเหตุฉุกเฉินอย่างถูกวิธี</p>',
      excerpt: 'นักเรียนระดับชั้นมัธยมศึกษาตอนปลายเข้าร่วมอบรมเชิงปฏิบัติการหลักการปฐมพยาบาลและการดูแลผู้ป่วยเบื้องต้น (First Aid & CPR)',
      category: 'กิจกรรมนักเรียน',
      published: true,
      published_at: '2026-05-02T14:00:00.000Z',
      views: 356,
      is_pinned: false,
      sort_order: 11,
      cover_image_url: studentScienceLab,
      external_links: [],
      created_at: '2026-05-02T14:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-12',
      title: 'คนเก่งคว้ารางวัลชนะเลิศเหรียญทอง การแข่งขันหุ่นยนต์และนวัตกรรม AI ระดับชาติ ประจำปี 2569',
      content: '<p>ขอแสดงความยินดีกับตัวแทนนักเรียนคนเก่งของโรงเรียน ที่ได้รับรางวัลชนะเลิศเหรียญทอง การแข่งขันพัฒนาหุ่นยนต์อัตโนมัติและนวัตกรรมปัญญาประดิษฐ์ระดับประเทศ สร้างชื่อเสียงและความภาคภูมิใจให้แก่สถาบัน</p>',
      excerpt: 'ตัวแทนนักเรียนคนเก่งคว้ารางวัลชนะเลิศเหรียญทอง การแข่งขันหุ่นยนต์และนวัตกรรมปัญญาประดิษฐ์ (AI) ระดับประเทศ',
      category: 'ผลงานนักเรียน',
      published: true,
      published_at: '2026-04-20T10:00:00.000Z',
      views: 520,
      is_pinned: false,
      sort_order: 12,
      cover_image_url: studentScienceLab,
      external_links: [],
      created_at: '2026-04-20T10:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-13',
      title: 'คนเก่งสอบผ่านการคัดเลือกเข้าศึกษาต่อระดับอุดมศึกษา รอบ Portfolio คณะแพทยศาสตร์และวิศวกรรมศาสตร์',
      content: '<p>ขอแสดงความยินดีกับนักเรียนชั้นมัธยมศึกษาปีที่ 6 ที่ผ่านการคัดเลือกเข้าศึกษาต่อในมหาวิทยาลัยชั้นนำของประเทศ รอบที่ 1 (Portfolio) ในคณะแพทยศาสตร์ วิศวกรรมศาสตร์ เภสัชศาสตร์ และวิทยาการคอมพิวเตอร์</p>',
      excerpt: 'แสดงความยินดีกับนักเรียนชั้น ม.6 ที่สอบติดคณะแพทยศาสตร์ วิศวกรรมศาสตร์ และมหาวิทยาลัยชั้นนำในรอบ Portfolio',
      category: 'ผลงานนักเรียน',
      published: true,
      published_at: '2026-04-12T10:00:00.000Z',
      views: 485,
      is_pinned: false,
      sort_order: 13,
      cover_image_url: studentGraduationActivity,
      external_links: [],
      created_at: '2026-04-12T10:00:00.000Z',
      updated_at: nowIso(),
    },
    {
      id: 'news-14',
      title: 'เปิดตัวพอร์ทัลคลังสื่อการสอนดิจิทัล Google Sites ครบทุกกลุ่มสาระการเรียนรู้',
      content: '<p>ความภาคภูมิใจในการยกระดับนวัตกรรมการศึกษา ทางโรงเรียนได้พัฒนาคลังสื่อการสอนออนไลน์ (E-Learning & Google Sites Portal) เพื่อให้ผู้เรียนสามารถทบทวนบทเรียน ดูวิดีโอการสอน และดาวน์โหลดใบงานได้ทุกที่ทุกเวลา</p>',
      excerpt: 'ยกระดับการเรียนรู้ยุคดิจิทัลด้วยพอร์ทัลคลังสื่อการสอนออนไลน์จากคณะครูครบทุกกลุ่มสาระการเรียนรู้',
      category: 'ความภาคภูมิใจ',
      published: true,
      published_at: '2026-04-01T09:00:00.000Z',
      views: 364,
      is_pinned: false,
      sort_order: 14,
      cover_image_url: heroSchool2,
      external_links: [{ title: 'เข้าสู่คลังสื่อการสอนออนไลน์', url: '/media-library' }],
      created_at: '2026-04-01T09:00:00.000Z',
      updated_at: nowIso(),
    },
  ],
  newsletters: [
    {
      id: 'nl-1',
      issue_no: '01',
      academic_year: '2568',
      issue_date: futureDateStr(-5),
      title: 'กิจกรรมปฐมนิเทศนักเรียนใหม่ และประชุมผู้ปกครองประจำภาคเรียนที่ 1',
      summary: 'ผู้อำนวยการโรงเรียนเป็นประธานในพิธีปฐมนิเทศนักเรียนใหม่ พร้อมชี้แจงนโยบายการจัดการศึกษาและแนวทางการพัฒนาผู้เรียนร่วมกับผู้ปกครอง',
      content: 'ทางโรงเรียนได้จัดกิจกรรมปฐมนิเทศนักเรียนใหม่และประชุมผู้ปกครองประจำภาคเรียนที่ 1 เพื่อสร้างความเข้าใจอันดีระหว่างบ้านและโรงเรียน พร้อมแนะนำคณะครูประจำชั้นและแนวทางการส่งเสริมการเรียนรู้ในยุคดิจิทัล',
      category: 'กิจกรรมสถานศึกษา',
      image_url: heroSchool2,
      file_url: null,
      views: 156,
      is_published: true,
      order_position: 1,
      created_at: nowIso(),
    },
    {
      id: 'nl-2',
      issue_no: '02',
      academic_year: '2568',
      issue_date: futureDateStr(-2),
      title: 'การอบรมเชิงปฏิบัติการพัฒนาสื่อการสอนออนไลน์ด้วยเทคโนโลยีดิจิทัลและ AI',
      summary: 'คณะครูเข้าร่วมการอบรมพัฒนาคลังสื่อการสอนออนไลน์ (Google Sites) เพื่อยกระดับการจัดการเรียนรู้ในศตวรรษที่ 21',
      content: 'คณะครูทุกกลุ่มสาระการเรียนรู้เข้าร่วมกิจกรรมพัฒนาวิชาชีพ (PLC) ในการสร้างและพัฒนาคลังสื่อการสอนออนไลน์ เพื่อให้นักเรียนสามารถทบทวนบทเรียนได้ทุกที่ทุกเวลา',
      category: 'งานวิชาการ',
      image_url: heroSchool1,
      file_url: null,
      views: 142,
      is_published: true,
      order_position: 2,
      created_at: nowIso(),
    },
    {
      id: 'nl-3',
      issue_no: '03',
      academic_year: '2568',
      issue_date: futureDateStr(0),
      title: 'ขอแสดงความยินดีกับนักเรียนที่ได้รับรางวัลชนะเลิศการแข่งขันทักษะวิชาการ',
      summary: 'ตัวแทนนักเรียนคว้ารางวัลเหรียญทองจากการแข่งขันทักษะวิชาการระดับเขตพื้นที่การศึกษา สร้างชื่อเสียงและความภาคภูมิใจให้แก่โรงเรียน',
      content: 'โรงเรียนขอแสดงความยินดีกับนักเรียนและครูผู้ฝึกซ้อมที่ได้รับรางวัลเหรียญทองชนะเลิศจากการแข่งขันทักษะวิชาการ เป็นแบบอย่างที่ดีด้านความมุ่งมั่นตั้งใจศึกษาเล่าเรียน',
      category: 'ผลงานและความภูมิใจ',
      image_url: heroSchool2,
      file_url: null,
      views: 218,
      is_published: true,
      order_position: 3,
      created_at: nowIso(),
    },
  ],
  media_resources: [
    {
      id: 'media-1',
      teacher_name: 'นายสมชาย ใจดี',
      teacher_photo_url: null,
      subject_department: 'ภาษาไทย',
      title: 'คลังสื่อการสอนภาษาไทยและวรรณคดีไทย',
      description: 'รวมบทเรียนออนไลน์ ใบงาน วิดีโอสอนหลักภาษาไทย และการอ่านคิดวิเคราะห์',
      google_site_url: 'https://sites.google.com/',
      grade_level: 'ม.1 - ม.6',
      badge_color: 'blue',
      views: 128,
      order_position: 1,
      is_active: true,
      created_at: nowIso(),
    },
    {
      id: 'media-2',
      teacher_name: 'นางสาวสุภา รักเรียน',
      teacher_photo_url: null,
      subject_department: 'คณิตศาสตร์',
      title: 'ห้องเรียนคณิตศาสตร์ออนไลน์ (Math Google Site)',
      description: 'สรุปสูตรคณิตศาสตร์ แบบฝึกหัดพร้อมเฉลยละเอียด และข้อสอบติว O-NET / A-Level',
      google_site_url: 'https://sites.google.com/',
      grade_level: 'ม.1 - ม.6',
      badge_color: 'emerald',
      views: 245,
      order_position: 2,
      is_active: true,
      created_at: nowIso(),
    },
    {
      id: 'media-3',
      teacher_name: 'นายวิทยา ฉลาดคิด',
      teacher_photo_url: null,
      subject_department: 'วิทยาศาสตร์และเทคโนโลยี',
      title: 'คลังสื่อวิทยาศาสตร์และเทคโนโลยีดิจิทัล (Sci-Tech Portal)',
      description: 'สื่อการทดลองเสมือนจริง โครงงานวิทยาศาสตร์ และการเขียนโปรแกรมเบื้องต้น',
      google_site_url: 'https://sites.google.com/',
      grade_level: 'ทุกระดับชั้น',
      badge_color: 'purple',
      views: 310,
      order_position: 3,
      is_active: true,
      created_at: nowIso(),
    },
    {
      id: 'media-4',
      teacher_name: 'นางภาวินี สุขสม',
      teacher_photo_url: null,
      subject_department: 'ภาษาต่างประเทศ',
      title: 'English & Foreign Languages Learning Center',
      description: 'คลังคำศัพท์ บทสนทนาภาษาอังกฤษ สื่อฝึกฟัง-พูด และแบบทดสอบออนไลน์',
      google_site_url: 'https://sites.google.com/',
      grade_level: 'ม.1 - ม.6',
      badge_color: 'rose',
      views: 189,
      order_position: 4,
      is_active: true,
      created_at: nowIso(),
    },
  ],
  teacher_media_items: [
    {
      id: 'tm-1',
      teacher_username: 'teacher',
      teacher_name: 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)',
      subject_department: 'ภาษาไทย',
      grade_level: 'ม.1 - ม.3',
      title: 'วิดีโอสรุปหลักภาษาไทย: คำเป็น-คำตาย และไตรยางศ์',
      description: 'คลิปวิดีโอประกอบการสอนและตัวอย่างการจำแนกคำ พร้อมแบบฝึกหัดท้ายบท',
      media_type: 'video',
      media_url: 'https://www.youtube.com/',
      created_at: nowIso(),
    },
    {
      id: 'tm-2',
      teacher_username: 'teacher',
      teacher_name: 'ครูสมชาย ใจดี (กลุ่มสาระฯ ภาษาไทย)',
      subject_department: 'ภาษาไทย',
      grade_level: 'ม.1 - ม.3',
      title: 'สไลด์ Canva: วรรณคดีวิจักษ์และศิลปะการประพันธ์',
      description: 'สื่อนำเสนออินโฟกราฟิกจาก Canva สำหรับทบทวนก่อนสอบกลางภาค',
      media_type: 'canva',
      media_url: 'https://www.canva.com/',
      created_at: nowIso(),
    },
    {
      id: 'tm-3',
      teacher_username: 'teacher_math',
      teacher_name: 'ครูสุภา รักเรียน (กลุ่มสาระฯ คณิตศาสตร์)',
      subject_department: 'คณิตศาสตร์',
      grade_level: 'ป.1 - ม.3',
      title: 'เอกสาร PDF สรุปสูตรคณิตศาสตร์และแบบฝึกหัดทบทวนบทเรียน',
      description: 'รวมสูตรสำคัญและแนวข้อสอบพร้อมเฉลยละเอียด ดาวน์โหลดไปอ่านทบทวนได้ฟรี',
      media_type: 'pdf',
      media_url: 'https://drive.google.com/',
      created_at: nowIso(),
    },
  ],
  administrators: [
    {
      id: 'admin-dir-1',
      name: 'ดร.สมศักดิ์ วิทยาการ',
      position: 'ผู้อำนวยการโรงเรียน',
      education: 'ปริญญาเอก การบริหารการศึกษา',
      quote: 'การศึกษาคือกุญแจสู่อนาคตที่สดใส มุ่งพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรม ก้าวทันเทคโนโลยี สู่มาตรฐานสากล',
      photo_url: '',
      order_position: 1,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  staff: [
    { id: 'st-1', name: 'นายสมชาย ใจดี', position: 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาไทย', subject: 'ภาษาไทย', department: 'ฝ่ายวิชาการ', education: 'ปริญญาโท ภาษาไทย', experience: '15 ปี', photo_url: '', staff_type: 'teaching', order_position: 1 },
    { id: 'st-2', name: 'นางสาวสุภา รักเรียน', position: 'หัวหน้ากลุ่มสาระการเรียนรู้คณิตศาสตร์', subject: 'คณิตศาสตร์', department: 'ฝ่ายวิชาการ', education: 'ปริญญาโท คณิตศาสตร์ศึกษา', experience: '12 ปี', photo_url: '', staff_type: 'teaching', order_position: 2 },
    { id: 'st-3', name: 'นายวิทยา ฉลาดคิด', position: 'หัวหน้ากลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', subject: 'วิทยาศาสตร์', department: 'ฝ่ายวิชาการ', education: 'ปริญญาโท วิทยาศาสตร์ศึกษา', experience: '10 ปี', photo_url: '', staff_type: 'teaching', order_position: 3 },
    { id: 'st-4', name: 'นางภาวินี สุขสม', position: 'หัวหน้ากลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', subject: 'ภาษาอังกฤษ', department: 'ฝ่ายวิชาการ', education: 'ปริญญาโท ภาษาอังกฤษ', experience: '14 ปี', photo_url: '', staff_type: 'teaching', order_position: 4 },
    { id: 'st-5', name: 'นางสาวปราณี รักงาน', position: 'หัวหน้างานธุรการ', subject: '', department: 'ฝ่ายบริหารทั่วไป', education: 'ปริญญาตรี บริหารธุรกิจ', experience: '10 ปี', photo_url: '', staff_type: 'support', order_position: 101 },
    { id: 'st-6', name: 'นายคอมพิวเตอร์ เก่งมาก', position: 'หัวหน้างานเทคโนโลยีสารสนเทศ', subject: '', department: 'ฝ่ายวิชาการ', education: 'ปริญญาตรี วิทยาการคอมพิวเตอร์', experience: '6 ปี', photo_url: '', staff_type: 'support', order_position: 102 },
  ],
  student_stats: [
    { id: 'ss-1', label: 'นักเรียนทั้งหมด', value: '1,250', icon: 'Users', color: 'text-primary', order_position: 1, is_active: true },
    { id: 'ss-2', label: 'ม.ปลาย', value: '650', icon: 'GraduationCap', color: 'text-accent', order_position: 2, is_active: true },
    { id: 'ss-3', label: 'ม.ต้น', value: '600', icon: 'BookOpen', color: 'text-green-500', order_position: 3, is_active: true },
    { id: 'ss-4', label: 'นักเรียนเกียรตินิยม', value: '180', icon: 'Trophy', color: 'text-purple-500', order_position: 4, is_active: true },
  ],
  grade_data: [
    { id: 'gd-1', level: 'มัธยมศึกษาปีที่ 1', rooms: 6, students: 210, boys: 105, girls: 105, order_position: 1, is_active: true },
    { id: 'gd-2', level: 'มัธยมศึกษาปีที่ 2', rooms: 6, students: 200, boys: 98, girls: 102, order_position: 2, is_active: true },
    { id: 'gd-3', level: 'มัธยมศึกษาปีที่ 3', rooms: 6, students: 190, boys: 95, girls: 95, order_position: 3, is_active: true },
    { id: 'gd-4', level: 'มัธยมศึกษาปีที่ 4', rooms: 6, students: 220, boys: 110, girls: 110, order_position: 4, is_active: true },
    { id: 'gd-5', level: 'มัธยมศึกษาปีที่ 5', rooms: 6, students: 215, boys: 108, girls: 107, order_position: 5, is_active: true },
    { id: 'gd-6', level: 'มัธยมศึกษาปีที่ 6', rooms: 6, students: 215, boys: 107, girls: 108, order_position: 6, is_active: true },
  ],
  student_achievements: [
    { id: 'ach-1', title: 'เหรียญทองโอลิมปิกวิชาการ', description: 'นักเรียนได้รับเหรียญทองการแข่งขันคณิตศาสตร์โอลิมปิกระดับชาติ', year: '2567', category: 'โอลิมปิก', order_position: 1 },
    { id: 'ach-2', title: 'รางวัลชนะเลิศวิทยาศาสตร์', description: 'โครงงานวิทยาศาสตร์ได้รับรางวัลชนะเลิศระดับภาค', year: '2567', category: 'วิทยาศาสตร์', order_position: 2 },
    { id: 'ach-3', title: 'ทุนการศึกษาต่อต่างประเทศ', description: 'นักเรียนได้รับทุนเรียนต่อมหาวิทยาลัยชั้นนำในต่างประเทศ', year: '2567', category: 'ทุนการศึกษา', order_position: 3 },
    { id: 'ach-4', title: 'ผลสอบ O-NET สูงกว่าค่าเฉลี่ย', description: 'ผลสอบ O-NET ทุกวิชาสูงกว่าค่าเฉลี่ยระดับประเทศ', year: '2566', category: 'วิชาการ', order_position: 4 },
  ],
  student_activities: [
    { id: 'act-1', name: 'ชมรมวิทยาศาสตร์', members: 85, description: 'ทดลองและค้นคว้าทางวิทยาศาสตร์', order_position: 1 },
    { id: 'act-2', name: 'ชมรมคณิตศาสตร์', members: 70, description: 'พัฒนาทักษะการคิดวิเคราะห์', order_position: 2 },
    { id: 'act-3', name: 'ชมรมภาษาอังกฤษ', members: 90, description: 'พัฒนาทักษะการสื่อสารภาษาอังกฤษ', order_position: 3 },
    { id: 'act-4', name: 'ชมรมดนตรี', members: 65, description: 'เรียนรู้และแสดงดนตรีหลากหลายแนว', order_position: 4 },
    { id: 'act-5', name: 'ชมรมกีฬา', members: 120, description: 'ฝึกฝนกีฬาและส่งเสริมสุขภาพ', order_position: 5 },
    { id: 'act-6', name: 'ชมรมศิลปะ', members: 55, description: 'สร้างสรรค์ผลงานศิลปะหลากหลายรูปแบบ', order_position: 6 },
  ],
  student_council: [
    { id: 'sc-1', name: 'นายประสิทธิ์ เก่งมาก', position: 'ประธานสภานักเรียน', class: 'ม.6/1', initial: 'ป', image_url: null, order_position: 1, is_active: true },
    { id: 'sc-2', name: 'นางสาวสุดา รักเรียน', position: 'รองประธานสภานักเรียนฝ่ายบริหาร', class: 'ม.6/2', initial: 'ส', image_url: null, order_position: 2, is_active: true },
    { id: 'sc-3', name: 'นายวิชัย ใจดี', position: 'เลขานุการสภานักเรียน', class: 'ม.5/1', initial: 'ว', image_url: null, order_position: 3, is_active: true },
    { id: 'sc-4', name: 'นางสาวกานดา พัฒนา', position: 'หัวหน้าฝ่ายประชาสัมพันธ์ (Sapha Plus)', class: 'ม.5/2', initial: 'ก', image_url: null, order_position: 4, is_active: true },
  ],
  curriculum_programs: [
    {
      id: 'prog-1',
      title: 'วิทย์-คณิต',
      description: 'หลักสูตรเน้นวิทยาศาสตร์และคณิตศาสตร์ เตรียมความพร้อมสู่คณะแพทย์ วิศวกรรม และวิทยาศาสตร์',
      icon: 'FlaskConical',
      color: 'bg-blue-500',
      subjects: ['ฟิสิกส์', 'เคมี', 'ชีววิทยา', 'คณิตศาสตร์ขั้นสูง'],
      careers: ['แพทย์', 'วิศวกร', 'นักวิทยาศาสตร์', 'เภสัชกร'],
      order_position: 1,
      is_active: true,
    },
    {
      id: 'prog-2',
      title: 'ศิลป์-ภาษา',
      description: 'เน้นทักษะภาษาอังกฤษ จีน ญี่ปุ่น และฝรั่งเศส พร้อมสู่ความเป็นสากล',
      icon: 'Languages',
      color: 'bg-purple-500',
      subjects: ['ภาษาอังกฤษ', 'ภาษาจีน', 'ภาษาญี่ปุ่น', 'ภาษาฝรั่งเศส'],
      careers: ['นักแปล', 'มัคคุเทศก์', 'นักการทูต', 'ครูสอนภาษา'],
      order_position: 2,
      is_active: true,
    },
    {
      id: 'prog-3',
      title: 'ศิลป์-คำนวณ',
      description: 'รวมศาสตร์สังคมศึกษากับคณิตศาสตร์ เตรียมพร้อมสู่คณะบริหาร เศรษฐศาสตร์ และนิติศาสตร์',
      icon: 'Calculator',
      color: 'bg-green-500',
      subjects: ['สังคมศึกษา', 'เศรษฐศาสตร์', 'คณิตศาสตร์', 'การบัญชี'],
      careers: ['นักบัญชี', 'นักเศรษฐศาสตร์', 'ทนายความ', 'นักธุรกิจ'],
      order_position: 3,
      is_active: true,
    },
    {
      id: 'prog-4',
      title: 'คอมพิวเตอร์และ AI',
      description: 'หลักสูตรเทคโนโลยีสารสนเทศ เขียนโปรแกรม และ AI เตรียมความพร้อมสู่โลกดิจิทัล',
      icon: 'Monitor',
      color: 'bg-orange-500',
      subjects: ['การเขียนโปรแกรม', 'AI และ Machine Learning', 'Web Development', 'Cybersecurity'],
      careers: ['โปรแกรมเมอร์', 'นักวิเคราะห์ข้อมูล', 'UX Designer', 'AI Engineer'],
      order_position: 4,
      is_active: true,
    },
  ],
  curriculum_activities: [
    { id: 'cact-1', name: 'ชมรมศิลปะ', description: 'วาดภาพ ปั้น และงานหัตถกรรม', icon: 'Palette', order_position: 1, is_active: true },
    { id: 'cact-2', name: 'วงดนตรี', description: 'ดนตรีสากลและดนตรีไทย', icon: 'Music', order_position: 2, is_active: true },
    { id: 'cact-3', name: 'กีฬา', description: 'ฟุตบอล บาสเกตบอล ว่ายน้ำ', icon: 'Dumbbell', order_position: 3, is_active: true },
    { id: 'cact-4', name: 'ห้องสมุด', description: 'ชมรมหนังสือและการอ่าน', icon: 'BookOpen', order_position: 4, is_active: true },
  ],
  events: [
    {
      id: 'evt-1',
      title: 'พิธีปฐมนิเทศและเปิดภาคเรียน ปีการศึกษา 2568',
      description: 'พิธีต้อนรับนักเรียนใหม่และเปิดภาคเรียนพร้อมกัน ณ หอประชุมใหญ่',
      event_date: futureDateStr(7),
      event_time: '08:00',
      location: 'หอประชุมใหญ่โรงเรียน',
      category: 'academic',
      image_url: heroSchool2,
      status: 'published',
      created_at: nowIso(),
    },
    {
      id: 'evt-2',
      title: 'การแข่งขันกีฬาสีภายใน "วิทยาคมเกมส์"',
      description: 'กิจกรรมแข่งขันกีฬาและขบวนพาเหรดเพื่อสร้างความสามัคคีในหมู่คณะ',
      event_date: futureDateStr(21),
      event_time: '08:30',
      location: 'สนามกีฬากลางโรงเรียน',
      category: 'sports',
      image_url: heroSchool1,
      status: 'published',
      created_at: nowIso(),
    },
    {
      id: 'evt-3',
      title: 'นิทรรศการวิชาการ Open House & สัปดาห์วิทยาศาสตร์',
      description: 'แสดงผลงานนวัตกรรมนักเรียน การแข่งขันตอบปัญหาวิชาการ และแนะแนวศึกษาต่อ',
      event_date: '2026-08-18',
      event_time: '09:00',
      location: 'อาคารศูนย์วิทยาศาสตร์และหอประชุม',
      category: 'academic',
      image_url: heroSchool2,
      status: 'published',
      created_at: nowIso(),
    },
  ],
  gallery_albums: [
    {
      id: 'alb-1',
      title: 'ประมวลภาพกิจกรรมวันไหว้ครูและปฐมนิเทศ 2568',
      description: 'บรรยากาศความประทับใจในพิธีไหว้ครูและต้อนรับนักเรียนใหม่',
      category: 'พิธีการ',
      cover_photo_url: heroSchool2,
      event_date: futureDateStr(-10),
      location: 'หอประชุมใหญ่โรงเรียน',
      is_published: true,
      views: 120,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: 'alb-2',
      title: 'การแข่งขันทักษะวิชาการและนวัตกรรมหุ่นยนต์',
      description: 'นักเรียนเข้าร่วมการแข่งขันทักษะวิชาการและจัดแสดงโครงงานวิทยาศาสตร์',
      category: 'กิจกรรมวิชาการ',
      cover_photo_url: heroSchool1,
      event_date: futureDateStr(-5),
      location: 'ศูนย์ปฏิบัติการคอมพิวเตอร์และ AI',
      is_published: true,
      views: 95,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  gallery_photos: [
    {
      id: 'ph-1',
      album_id: 'alb-1',
      photo_url: heroSchool2,
      thumbnail_url: heroSchool2,
      caption: 'พิธีเปิดงานและกล่าวต้อนรับโดยผู้อำนวยการโรงเรียน',
      order_position: 1,
      created_at: nowIso(),
    },
    {
      id: 'ph-2',
      album_id: 'alb-1',
      photo_url: heroSchool1,
      thumbnail_url: heroSchool1,
      caption: 'ตัวแทนนักเรียนร่วมกิจกรรมอย่างพร้อมเพรียง',
      order_position: 2,
      created_at: nowIso(),
    },
    {
      id: 'ph-3',
      album_id: 'alb-2',
      photo_url: heroSchool1,
      thumbnail_url: heroSchool1,
      caption: 'การนำเสนอโครงงานนวัตกรรมและเทคโนโลยี',
      order_position: 1,
      created_at: nowIso(),
    },
  ],
  admissions: [
    {
      id: 'ENR-2568-1001',
      student_name: 'เด็กชายธนกร พัฒนาวิทย์',
      student_id_card: '1100100234567',
      birth_date: '2012-05-14',
      gender: 'ชาย',
      parent_name: 'นายพงศ์ศักดิ์ พัฒนาวิทย์',
      parent_phone: '0812345678',
      parent_email: 'pongsak@example.com',
      address: '99/12 ถนนสุขุมวิท กรุงเทพมหานคร 10110',
      previous_school: 'โรงเรียนประถมสาธิตวิทยา',
      grade_applying: 'ม.1',
      program_applying: 'วิทย์-คณิต',
      status: 'approved',
      notes: 'เอกสารครบถ้วน ผ่านการคัดเลือก',
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: 'ENR-2568-1002',
      student_name: 'นางสาวพิมพ์ชนก รักการเรียน',
      student_id_card: '1100100891234',
      birth_date: '2009-09-20',
      gender: 'หญิง',
      parent_name: 'นางวิภา รักการเรียน',
      parent_phone: '0898765432',
      parent_email: 'wipa@example.com',
      address: '45/8 ถนนพหลโยธิน กรุงเทพมหานคร 10900',
      previous_school: 'โรงเรียนมัธยมศึกษาตอนต้นวิทยา',
      grade_applying: 'ม.4',
      program_applying: 'คอมพิวเตอร์และ AI',
      status: 'pending',
      notes: '',
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  faq: [
    { id: 'faq-1', question: 'ค่าธรรมเนียมการศึกษาเท่าไหร่?', answer: 'ค่าธรรมเนียมการศึกษาต่อภาคเรียน ม.ต้น 15,000 บาท และ ม.ปลาย 18,000 บาท รวมค่าอุปกรณ์การเรียนและสื่อดิจิทัล', order_position: 1, is_active: true },
    { id: 'faq-2', question: 'มีรถรับส่งนักเรียนหรือไม่?', answer: 'มีบริการรถรับส่งนักเรียนปรับอากาศ ครอบคลุมพื้นที่กรุงเทพฯ และปริมณฑล สอบถามเส้นทางได้ที่ฝ่ายธุรการ', order_position: 2, is_active: true },
    { id: 'faq-3', question: 'เปิดรับสมัครนักเรียนใหม่เมื่อไหร่?', answer: 'เปิดรับสมัครนักเรียนใหม่ทุกปี ช่วงเดือนกุมภาพันธ์ - พฤษภาคม และสามารถยื่นใบสมัครออนไลน์ได้ตลอดผ่านหน้าเว็บไซต์', order_position: 3, is_active: true },
  ],
  milestones: [
    { id: 'ms-1', year: '2517', event: 'ก่อตั้งโรงเรียนบ้านหาดเค็ด', order_position: 1, is_active: true },
    { id: 'ms-2', year: '2530', event: 'เปิดหลักสูตรห้องเรียนพิเศษวิทยาศาสตร์-คณิตศาสตร์', order_position: 2, is_active: true },
    { id: 'ms-3', year: '2545', event: 'ได้รับรางวัลสถานศึกษาพระราชทานระดับมัธยมศึกษาขนาดใหญ่', order_position: 3, is_active: true },
    { id: 'ms-4', year: '2555', event: 'เปิดหลักสูตรภาษาต่างประเทศและโครงการแลกเปลี่ยนนานาชาติ', order_position: 4, is_active: true },
    { id: 'ms-5', year: '2567', event: 'เปิดศูนย์การเรียนรู้ปัญญาประดิษฐ์ (AI) และคลังสื่อการสอนออนไลน์ครบวงจร', order_position: 5, is_active: true },
  ],
  facilities: [
    { id: 'fac-1', title: 'อาคารเรียนอัจฉริยะ (Smart Classroom)', description: 'อาคารเรียนทันสมัย 5 หลัง พร้อมห้องเรียนปรับอากาศและจอ Interactive ทุกห้อง', icon: 'Building2', order_position: 1, is_active: true },
    { id: 'fac-2', title: 'ศูนย์วิทยบริการและ e-Library', description: 'ห้องสมุดดิจิทัลขนาดใหญ่ หนังสือกว่า 50,000 เล่ม และพื้นที่ Co-Working Space', icon: 'BookOpen', order_position: 2, is_active: true },
    { id: 'fac-3', title: 'ศูนย์กีฬาและนันทนาการครบวงจร', description: 'สนามฟุตบอลมาตรฐาน สระว่ายน้ำ โรงยิมเนเซียมในร่ม และฟิตเนสเซ็นเตอร์', icon: 'Award', order_position: 3, is_active: true },
  ],
  contact_messages: [
    {
      id: 'msg-1',
      name: 'คุณสมศรี มีสุข',
      email: 'somsri@example.com',
      phone: '081-555-1234',
      subject: 'สอบถามรายละเอียดการสมัครเรียนชั้น ม.1',
      message: 'ต้องการทราบกำหนดการสอบคัดเลือกและเอกสารที่ต้องใช้สำหรับสมัครเรียนแผนวิทย์-คณิตค่ะ',
      is_read: false,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  admin_users: [...SEED_ADMIN_USERS],
  login_portals: [...DEFAULT_LOGIN_PORTALS],
  sapha_projects: [
    {
      id: 'sp-1',
      title: 'โครงการ Sapha Voice รับฟังความคิดเห็นและข้อเสนอแนะนักเรียน',
      description: 'เปิดช่องทางออนไลน์ให้นักเรียนทุกระดับชั้นร่วมเสนอแนะแนวทางพัฒนาโรงเรียนและสวัสดิการนักเรียน',
      division: 'ฝ่ายประชาสัมพันธ์และสารสนเทศ',
      status: 'in_progress',
      progress: 80,
      target_date: '2026-12-15',
      external_url: 'https://forms.google.com/',
      created_at: nowIso(),
    },
    {
      id: 'sp-2',
      title: 'โครงการโรงเรียนสีเขียว Zero Waste & ธนาคารขยะรีไซเคิล',
      description: 'รณรงค์คัดแยกขยะในโรงเรียนและเปลี่ยนขยะรีไซเคิลเป็นแต้มสะสมแลกอุปกรณ์การเรียน',
      division: 'ฝ่ายอนุรักษ์สิ่งแวดล้อม',
      status: 'in_progress',
      progress: 65,
      target_date: '2026-11-30',
      external_url: 'https://sites.google.com/',
      created_at: nowIso(),
    },
    {
      id: 'sp-3',
      title: 'โครงการพี่สอนน้อง (Peer Tutoring) เตรียมความพร้อมก่อนสอบ',
      description: 'จัดกลุ่มติววิชาหลักโดยรุ่นพี่สภานักเรียนและชมรมวิชาการให้กับน้องๆ ม.ต้น',
      division: 'ฝ่ายวิชาการสภานักเรียน',
      status: 'completed',
      progress: 100,
      target_date: '2026-10-20',
      external_url: 'https://sites.google.com/',
      created_at: nowIso(),
    },
  ],
  sapha_links: [
    {
      id: 'sl-1',
      title: 'Sapha Voice (ระบบแจ้งเรื่องและรับฟังเสียงนักเรียน)',
      subtitle: 'Student Feedback & Suggestion System',
      description: 'ส่งข้อเสนอแนะ แจ้งปัญหาภายในโรงเรียน หรือเสนอโครงการใหม่ถึงคณะกรรมการสภานักเรียนโดยตรง',
      url: 'https://docs.google.com/forms/',
      icon_name: 'MessageSquareHeart',
      color_theme: 'violet',
      badge_text: 'เปิดรับความคิดเห็น 24 ชม.',
      is_active: true,
      order_position: 1,
    },
    {
      id: 'sl-2',
      title: 'Sapha Vote (ระบบโหวตและสำรวจประชามตินักเรียน)',
      subtitle: 'E-Voting & Student Poll Platform',
      description: 'ร่วมลงคะแนนโหวตกิจกรรมโรงเรียน เลือกตั้งสภานักเรียน และทำแบบสำรวจออนไลน์แบบโปร่งใส',
      url: 'https://docs.google.com/forms/',
      icon_name: 'Vote',
      color_theme: 'indigo',
      badge_text: 'E-Voting System',
      is_active: true,
      order_position: 2,
    },
    {
      id: 'sl-3',
      title: 'Sapha Check-In (ระบบลงทะเบียนและเช็คชื่อกิจกรรม)',
      subtitle: 'Smart Activity Check-In & QR Pass',
      description: 'ระบบลงทะเบียนเข้าร่วมกิจกรรมสภานักเรียน ตรวจสอบชั่วโมงจิตอาสา และดาวน์โหลดเกียรติบัตรออนไลน์',
      url: 'https://sites.google.com/',
      icon_name: 'QrCode',
      color_theme: 'emerald',
      badge_text: 'เช็คชื่อ & เกียรติบัตร',
      is_active: true,
      order_position: 3,
    },
    {
      id: 'sl-4',
      title: 'Sapha Docs & Budget (คลังเอกสารและรายงานงบประมาณสภา)',
      subtitle: 'Open Council Documents & Transparency',
      description: 'ศูนย์รวมเอกสารโครงการ สรุปรายงานการประชุมสภานักเรียน และรายงานการใช้จ่ายงบประมาณอย่างโปร่งใส',
      url: 'https://drive.google.com/',
      icon_name: 'FileSpreadsheet',
      color_theme: 'amber',
      badge_text: 'โปร่งใส ตรวจสอบได้',
      is_active: true,
      order_position: 4,
    },
  ],
};

export const getTableData = (table: string): any[] => {
  const key = `${STORAGE_PREFIX}${table}`;
  const raw = getStorageItem(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore parse error
    }
  }
  const initial = INITIAL_SEED_DATA[table] ? [...INITIAL_SEED_DATA[table]] : [];
  setStorageItem(key, JSON.stringify(initial));
  return initial;
};

type RealtimeCallback = (payload: { table: string; eventType: string; new?: any; old?: any }) => void;
const localRealtimeListeners = new Set<RealtimeCallback>();

export const notifyLocalRealtimeListeners = (
  table: string,
  eventType = '*',
  payload: { new?: any; old?: any } = {}
): void => {
  localRealtimeListeners.forEach((listener) => {
    try {
      listener({ table, eventType, ...payload });
    } catch {
      // ignore listener errors
    }
  });
  if (typeof window !== 'undefined') {
    const detail = { table, eventType, ...payload };
    window.dispatchEvent(new CustomEvent('kk-supabase-realtime', { detail }));
    window.dispatchEvent(new CustomEvent('kk-school-local-db-change', { detail }));
  }
};

export const saveTableData = (table: string, rows: any[]): void => {
  const key = `${STORAGE_PREFIX}${table}`;
  setStorageItem(key, JSON.stringify(rows));
  notifyLocalRealtimeListeners(table, '*');
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const matchesPattern = (value: any, pattern: string, caseInsensitive: boolean): boolean => {
  if (value === null || value === undefined) return false;
  const str = String(value);
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  const regex = new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : '');
  return regex.test(str);
};

class MockQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any = null;
  private upsertConflictKey = 'id';
  private countMode: 'exact' | null = null;
  private headOnly = false;
  private filters: Array<(row: any) => boolean> = [];
  private sorts: Array<{ column: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private rangeSlice: [number, number] | null = null;
  private returnSingle = false;
  private returnMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    if (this.action === 'select') {
      this.action = 'select';
    }
    if (options?.count) {
      this.countMode = options.count;
    }
    if (options?.head) {
      this.headOnly = true;
    }
    return this;
  }

  insert(values: any) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  upsert(values: any, options?: { onConflict?: string }) {
    this.action = 'upsert';
    this.payload = values;
    if (options?.onConflict) {
      this.upsertConflictKey = options.onConflict;
    }
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((row) => row[column] > value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push((row) => matchesPattern(row[column], pattern, false));
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push((row) => matchesPattern(row[column], pattern, true));
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => Array.isArray(values) && values.includes(row[column]));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  or(expr: string) {
    const clauses = expr.split(',').map((c) => c.trim()).filter(Boolean);
    this.filters.push((row) =>
      clauses.some((clause) => {
        const parts = clause.split('.');
        if (parts.length < 3) return false;
        const col = parts[0];
        const op = parts[1];
        const val = parts.slice(2).join('.');
        if (op === 'eq') return String(row[col] ?? '').toLowerCase() === val.toLowerCase();
        if (op === 'ilike') return matchesPattern(row[col], val, true);
        return false;
      })
    );
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sorts.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeSlice = [from, to + 1];
    return this;
  }

  single() {
    this.returnSingle = true;
    return this;
  }

  maybeSingle() {
    this.returnMaybeSingle = true;
    return this;
  }

  private execute(): { data: any; error: null; count?: number | null } {
    const rows = getTableData(this.table);

    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const created = items.map((item) => ({
        id: item.id || generateId(),
        created_at: item.created_at || nowIso(),
        updated_at: item.updated_at || nowIso(),
        ...item,
      }));
      const nextRows = [...rows, ...created];
      saveTableData(this.table, nextRows);
      const resultData = this.returnSingle || this.returnMaybeSingle ? created[0] ?? null : created;
      return { data: resultData, error: null, count: created.length };
    }

    if (this.action === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const nextRows = [...rows];
      const upserted: any[] = [];

      for (const item of items) {
        const conflictKey = this.upsertConflictKey;
        const existingIdx = nextRows.findIndex(
          (r) => r[conflictKey] !== undefined && r[conflictKey] === item[conflictKey]
        );
        if (existingIdx !== -1) {
          const updated = {
            ...nextRows[existingIdx],
            ...item,
            updated_at: nowIso(),
          };
          nextRows[existingIdx] = updated;
          upserted.push(updated);
        } else {
          const created = {
            id: item.id || generateId(),
            created_at: item.created_at || nowIso(),
            updated_at: nowIso(),
            ...item,
          };
          nextRows.push(created);
          upserted.push(created);
        }
      }
      saveTableData(this.table, nextRows);
      const resultData = this.returnSingle || this.returnMaybeSingle ? upserted[0] ?? null : upserted;
      return { data: resultData, error: null, count: upserted.length };
    }

    if (this.action === 'update') {
      const updatedRows: any[] = [];
      const nextRows = rows.map((row) => {
        const matches = this.filters.every((fn) => fn(row));
        if (!matches) return row;
        const updated = { ...row, ...this.payload, updated_at: nowIso() };
        updatedRows.push(updated);
        return updated;
      });
      saveTableData(this.table, nextRows);
      const resultData = this.returnSingle || this.returnMaybeSingle ? updatedRows[0] ?? null : updatedRows;
      return { data: resultData, error: null, count: updatedRows.length };
    }

    if (this.action === 'delete') {
      const deletedRows: any[] = [];
      const nextRows = rows.filter((row) => {
        const matches = this.filters.every((fn) => fn(row));
        if (matches) {
          deletedRows.push(row);
          return false;
        }
        return true;
      });
      saveTableData(this.table, nextRows);
      return { data: deletedRows, error: null, count: deletedRows.length };
    }

    // SELECT
    let filtered = rows.filter((row) => this.filters.every((fn) => fn(row)));
    const totalCount = filtered.length;

    if (this.sorts.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const { column, ascending } of this.sorts) {
          const av = a[column];
          const bv = b[column];
          if (av === bv) continue;
          if (av === undefined || av === null) return 1;
          if (bv === undefined || bv === null) return -1;
          const cmp = av < bv ? -1 : 1;
          return ascending ? cmp : -cmp;
        }
        return 0;
      });
    }

    if (this.rangeSlice) {
      filtered = filtered.slice(this.rangeSlice[0], this.rangeSlice[1]);
    } else if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount);
    }

    if (this.headOnly) {
      return { data: null, error: null, count: totalCount };
    }

    if (this.returnSingle || this.returnMaybeSingle) {
      return {
        data: filtered[0] ?? null,
        error: null,
        count: this.countMode ? totalCount : undefined,
      };
    }

    return {
      data: filtered,
      error: null,
      count: this.countMode ? totalCount : undefined,
    };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const uploadedBlobUrls = new Map<string, string>();

export const createMockSupabaseClient = () => {
  return {
    from: (table: string) => new MockQueryBuilder(table),
    rpc: async (fnName: string, args?: Record<string, any>) => {
      if (fnName === 'increment_news_view' && args?.news_id) {
        const news = getTableData('news');
        const next = news.map((n) =>
          n.id === args.news_id ? { ...n, views: (Number(n.views) || 0) + 1 } : n
        );
        saveTableData('news', next);
      }
      return { data: null, error: null };
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, fileOrBlob: Blob | File) => {
          try {
            if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
              const url = URL.createObjectURL(fileOrBlob);
              uploadedBlobUrls.set(path, url);
            }
          } catch {
            // ignore in non-browser
          }
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          const url = uploadedBlobUrls.get(path) || heroSchool2;
          return { data: { publicUrl: url } };
        },
        remove: async (paths: string[]) => {
          paths.forEach((p) => uploadedBlobUrls.delete(p));
          return { data: paths, error: null };
        },
        list: async () => ({ data: [], error: null }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    channel: (_name: string) => {
      const channelHandlers: RealtimeCallback[] = [];
      const channelObj = {
        on: (
          _type: string,
          filter: { event?: string; schema?: string; table?: string },
          callback: (payload: any) => void
        ) => {
          const handler: RealtimeCallback = (payload) => {
            if (!filter?.table || filter.table === '*' || filter.table === payload.table) {
              callback(payload);
            }
          };
          channelHandlers.push(handler);
          localRealtimeListeners.add(handler);
          return channelObj;
        },
        subscribe: (statusCb?: (status: string) => void) => {
          if (statusCb) statusCb('SUBSCRIBED');
          return channelObj;
        },
        unsubscribe: async () => {
          channelHandlers.forEach((h) => localRealtimeListeners.delete(h));
          return 'ok';
        },
      };
      return channelObj;
    },
    removeChannel: async (channelObj: any) => {
      if (channelObj && typeof channelObj.unsubscribe === 'function') {
        await channelObj.unsubscribe();
      }
      return 'ok';
    },
  };
};

