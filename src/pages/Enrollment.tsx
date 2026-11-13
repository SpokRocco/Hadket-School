import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Search,
  Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
  fetchSyncedCurriculumBundle,
  HADKET_DEFAULT_GRADE_OPTIONS,
  type CurriculumLevelItem,
} from '@/utils/curriculumUtils';

const enrollmentSchema = z.object({
  // Student Info
  prefix: z.string().min(1, 'กรุณาเลือกคำนำหน้า'),
  firstName: z.string().min(2, 'กรุณากรอกชื่อ').max(50),
  lastName: z.string().min(2, 'กรุณากรอกนามสกุล').max(50),
  idCard: z.string().length(13, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  birthDate: z.string().min(1, 'กรุณาเลือกวันเกิด'),
  nationality: z.string().min(1, 'กรุณากรอกสัญชาติ'),
  religion: z.string().min(1, 'กรุณากรอกศาสนา'),
  phone: z.string().min(9, 'กรุณากรอกเบอร์โทรศัพท์').max(10),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  address: z.string().min(10, 'กรุณากรอกที่อยู่'),

  // Parent Info
  fatherName: z.string().min(2, 'กรุณากรอกชื่อบิดา').max(100),
  fatherPhone: z.string().min(9, 'กรุณากรอกเบอร์โทรศัพท์').max(10),
  fatherOccupation: z.string().min(1, 'กรุณากรอกอาชีพ'),
  motherName: z.string().min(2, 'กรุณากรอกชื่อมารดา').max(100),
  motherPhone: z.string().min(9, 'กรุณากรอกเบอร์โทรศัพท์').max(10),
  motherOccupation: z.string().min(1, 'กรุณากรอกอาชีพ'),

  // Academic Info
  previousSchool: z.string().min(1, 'กรุณากรอกชื่อโรงเรียนเดิม (หรือระบุ "-")'),
  previousLevel: z.string().min(1, 'กรุณาเลือกระดับชั้นที่จบ'),
  gpa: z.string().min(1, 'กรุณากรอกเกรดเฉลี่ย (หรือระบุ "-")'),
  enrollLevel: z.string().min(1, 'กรุณาเลือกระดับชั้นที่ต้องการสมัคร'),
  program: z.string().min(1, 'กรุณาเลือกแผนการเรียน / หลักสูตร'),

  // Agreements
  agreeTerms: z.boolean().refine(val => val === true, 'กรุณายอมรับข้อตกลง'),
  agreePrivacy: z.boolean().refine(val => val === true, 'กรุณายอมรับนโยบายความเป็นส่วนตัว'),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

const steps = [
  { id: 1, title: 'ข้อมูลนักเรียน', icon: User },
  { id: 2, title: 'ข้อมูลผู้ปกครอง', icon: Users },
  { id: 3, title: 'ข้อมูลการศึกษา', icon: BookOpen },
  { id: 4, title: 'ตรวจสอบข้อมูล', icon: FileText },
];

interface ProgramOption {
  value: string;
  label: string;
  target_level?: string;
}

const Enrollment = () => {
  const [searchParams] = useSearchParams();
  const levelParam = (searchParams.get('level') || '').trim();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundAdmission, setFoundAdmission] = useState<any>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [curriculumLevels, setCurriculumLevels] = useState<CurriculumLevelItem[]>([]);
  const [gradeOptions, setGradeOptions] = useState<string[]>(HADKET_DEFAULT_GRADE_OPTIONS);
  const { toast } = useToast();
  const { settings } = useSchoolSettings();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const searchAdmission = async () => {
    if (!searchQuery.trim()) {
      toast({ variant: 'destructive', title: 'กรุณากรอกข้อมูลค้นหา' });
      return;
    }
    setIsSearching(true);
    try {
      // Try searching by name first
      let { data, error } = await supabase
        .from('admissions')
        .select('*')
        .ilike('student_name', `%${searchQuery.trim()}%`)
        .limit(1);

      // If no results by name, try searching by ID number (from admission number like ENR-2568-1234)
      if ((!data || data.length === 0) && searchQuery.includes('-')) {
        const idPart = searchQuery.split('-').pop();
        if (idPart) {
          const result = await supabase
            .from('admissions')
            .select('*')
            .ilike('id', `%${idPart}%`)
            .limit(1);
          data = result.data;
          error = result.error;
        }
      }

      if (error) {
        console.error('Search error:', error);
        toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        return;
      }

      if (!data || data.length === 0) {
        toast({ variant: 'destructive', title: 'ไม่พบใบสมัคร', description: 'กรุณาตรวจสอบชื่อหรือหมายเลขอีกครั้ง' });
        return;
      }

      setFoundAdmission(data[0]);
      setShowSearchDialog(true);
    } catch (e) {
      console.error('Search exception:', e);
      toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด' });
    } finally {
      setIsSearching(false);
    }
  };

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      prefix: '',
      firstName: '',
      lastName: '',
      idCard: '',
      birthDate: '',
      nationality: 'ไทย',
      religion: 'พุทธ',
      phone: '',
      email: '',
      address: '',
      fatherName: '',
      fatherPhone: '',
      fatherOccupation: '',
      motherName: '',
      motherPhone: '',
      motherOccupation: '',
      previousSchool: '',
      previousLevel: '',
      gpa: '',
      enrollLevel: '',
      program: '',
      agreeTerms: false,
      agreePrivacy: false,
    },
  });

  // Fetch synchronized curriculum levels, programs, and live grade_data options
  useEffect(() => {
    const fetchEnrollmentOptions = async () => {
      try {
        const bundle = await fetchSyncedCurriculumBundle({ activeOnly: true });
        setCurriculumLevels(bundle.levels);

        const resolvedGrades =
          bundle.grades.length > 0
            ? Array.from(new Set(bundle.grades.map((g) => g.level.trim()).filter(Boolean)))
            : HADKET_DEFAULT_GRADE_OPTIONS;
        setGradeOptions(resolvedGrades);

        const dbProgramOpts: ProgramOption[] = bundle.programs.map((p) => ({
          value: p.id,
          label: p.title,
          target_level: p.target_level,
        }));

        const coveredLevels = new Set(
          dbProgramOpts.map((p) => p.target_level).filter((t): t is string => Boolean(t && t !== 'all'))
        );

        const levelFallbackOpts: ProgramOption[] = bundle.levels
          .filter((lvl) => !coveredLevels.has(lvl.id))
          .map((lvl) => ({
            value: lvl.id,
            label: lvl.title,
            target_level: lvl.id,
          }));

        const resolvedPrograms: ProgramOption[] =
          dbProgramOpts.length > 0
            ? [...dbProgramOpts, ...levelFallbackOpts]
            : bundle.levels.length > 0
            ? bundle.levels.map((lvl) => ({
                value: lvl.id,
                label: lvl.title,
                target_level: lvl.id,
              }))
            : [
                { value: 'kindergarten', label: 'หลักสูตรปฐมวัย (อนุบาล)', target_level: 'kindergarten' },
                { value: 'primary', label: 'หลักสูตรประถมศึกษา (ป.1 – ป.6)', target_level: 'primary' },
                { value: 'lower-sec', label: 'หลักสูตรมัธยมศึกษาตอนต้น (ม.1 – ม.3)', target_level: 'lower-sec' },
                { value: 'integrated-skills', label: 'หลักสูตรบูรณาการทักษะอาชีพและเทคโนโลยี', target_level: 'all' },
              ];

        setPrograms(resolvedPrograms);

        if (levelParam) {
          const matchedLevel = bundle.levels.find((l) => l.id === levelParam);
          const pattern = matchedLevel?.level_pattern || levelParam;

          if (!form.getValues('enrollLevel')) {
            const matchedGrade = resolvedGrades.find((grade) => {
              if (pattern === 'kindergarten') return grade.includes('อนุบาล') || grade.includes('ปฐมวัย');
              if (pattern === 'primary') return grade.includes('ประถม') || /^ป\.\s*\d/.test(grade);
              if (pattern === 'lower-sec') return /มัธยมศึกษาปีที่\s*[1-3]|ม\.\s*[1-3]/.test(grade);
              if (pattern === 'upper-sec') return /มัธยมศึกษาปีที่\s*[4-6]|ม\.\s*[4-6]/.test(grade);
              return false;
            });
            if (matchedGrade) {
              form.setValue('enrollLevel', matchedGrade);
            }
          }

          if (!form.getValues('program')) {
            const matchedProgram = resolvedPrograms.find(
              (p) => p.target_level === levelParam || p.value === levelParam
            );
            if (matchedProgram) {
              form.setValue('program', matchedProgram.value);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching synchronized enrollment options:', error);
        setGradeOptions(HADKET_DEFAULT_GRADE_OPTIONS);
        setPrograms([
          { value: 'kindergarten', label: 'หลักสูตรปฐมวัย (อนุบาล)', target_level: 'kindergarten' },
          { value: 'primary', label: 'หลักสูตรประถมศึกษา (ป.1 – ป.6)', target_level: 'primary' },
          { value: 'lower-sec', label: 'หลักสูตรมัธยมศึกษาตอนต้น (ม.1 – ม.3)', target_level: 'lower-sec' },
          { value: 'integrated-skills', label: 'หลักสูตรบูรณาการทักษะอาชีพและเทคโนโลยี', target_level: 'all' },
        ]);
      }
    };

    fetchEnrollmentOptions();
  }, [levelParam, form]);

  const nextStep = async () => {
    let fieldsToValidate: (keyof EnrollmentFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['prefix', 'firstName', 'lastName', 'idCard', 'birthDate', 'nationality', 'religion', 'phone', 'email', 'address'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['fatherName', 'fatherPhone', 'fatherOccupation', 'motherName', 'motherPhone', 'motherOccupation'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['previousSchool', 'previousLevel', 'gpa', 'enrollLevel', 'program'];
    }

    const result = await form.trigger(fieldsToValidate);
    if (result) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);

    try {
      // Get the program label for display
      const programLabel = programs.find(p => p.value === data.program)?.label || data.program;

      // Insert into Supabase
      const { error } = await supabase
        .from('admissions')
        .insert({
          student_name: `${data.prefix}${data.firstName} ${data.lastName}`,
          student_id_card: data.idCard,
          birth_date: data.birthDate,
          gender: data.prefix.includes('ชาย') || data.prefix === 'นาย' ? 'ชาย' : 'หญิง',
          parent_name: data.fatherName,
          parent_phone: data.fatherPhone,
          parent_email: data.email,
          address: data.address,
          previous_school: data.previousSchool,
          grade_applying: data.enrollLevel,
          program_applying: programLabel,
          status: 'pending',
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'สมัครเรียนสำเร็จ!',
        description: 'เราได้รับใบสมัครของคุณแล้ว จะติดต่อกลับโดยเร็ว',
      });
    } catch (error: any) {
      console.error('Error submitting admission:', error);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งใบสมัครได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    const formData = form.getValues();
    const programLabel = programs.find(p => p.value === formData.program)?.label || formData.program;

    return (
      <>
        {/* Print-only styles */}
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 8mm; }
            body * { visibility: hidden; }
            #print-enrollment, #print-enrollment * { visibility: visible; }
            #print-enrollment { position: absolute; left: 0; top: 0; width: 100%; }
            nav, footer, .print\\:hidden { display: none !important; }
          }
        `}</style>

        <div className="min-h-screen bg-background print:hidden">
          <Navbar />
          <section className="pt-32 pb-16">
            <div className="container-school">
              <Card className="max-w-2xl mx-auto text-center">
                <CardContent className="py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">สมัครเรียนสำเร็จ!</h2>
                  <p className="text-muted-foreground mb-2">เราได้รับใบสมัครของคุณเรียบร้อยแล้ว</p>
                  <p className="text-muted-foreground mb-8">
                    หมายเลขใบสมัคร: <span className="font-bold text-primary">ENR-{settings.academic_year}-{Math.floor(Math.random() * 9000) + 1000}</span>
                  </p>
                  <div className="bg-secondary rounded-lg p-6 mb-8 text-left">
                    <h3 className="font-semibold mb-4">ขั้นตอนถัดไป:</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li>1. พิมพ์ใบสมัครและติดรูปถ่าย 1 นิ้ว</li>
                      <li>2. นำใบสมัครมายื่นที่โรงเรียนพร้อมเอกสารประกอบ</li>
                      <li>3. รอเข้าสอบวัดความรู้พื้นฐาน</li>
                      <li>4. ประกาศผลการคัดเลือก</li>
                    </ol>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Link to="/"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />กลับหน้าหลัก</Button></Link>
                    <Button onClick={() => window.print()} className="gap-2"><FileText className="w-4 h-4" />พิมพ์ใบสมัคร</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
          <Footer />
        </div>

        {/* Print Form - 1 A4 Page */}
        <div id="print-enrollment" className="hidden print:block bg-white text-black p-4" style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '11px' }}>
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-2 mb-3">
            <h1 className="text-lg font-bold">ใบสมัครเข้าเรียน</h1>
            <h2 className="text-base font-semibold">{settings?.school_name || 'โรงเรียน'} ปีการศึกษา {settings.academic_year}</h2>
          </div>

          {/* Top Row: Info + Photo */}
          <div className="flex justify-between mb-3">
            <div>
              <p><strong>เลขที่ใบสมัคร:</strong> ENR-{settings.academic_year}-____</p>
              <p><strong>วันที่สมัคร:</strong> {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="mt-2"><strong>สมัครเข้าชั้น:</strong> {formData.enrollLevel} <strong>แผน:</strong> {programLabel}</p>
            </div>
            <div className="w-20 h-24 border-2 border-black flex items-center justify-center text-center" style={{ fontSize: '8px' }}>
              <div>ติดรูปถ่าย<br />1 นิ้ว</div>
            </div>
          </div>

          {/* Section 1: Student */}
          <div className="mb-2">
            <div className="bg-black text-white px-2 py-0.5 text-xs font-bold mb-1">ส่วนที่ 1: ข้อมูลนักเรียน</div>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-1 w-24"><strong>ชื่อ-สกุล:</strong></td>
                  <td className="border border-gray-400 p-1" colSpan={3}>{formData.prefix}{formData.firstName} {formData.lastName}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1"><strong>เลขบัตร:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.idCard}</td>
                  <td className="border border-gray-400 p-1 w-16"><strong>วันเกิด:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.birthDate}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1"><strong>สัญชาติ:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.nationality}</td>
                  <td className="border border-gray-400 p-1"><strong>ศาสนา:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.religion}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1"><strong>โทร:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.phone}</td>
                  <td className="border border-gray-400 p-1"><strong>อีเมล:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.email}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1"><strong>ที่อยู่:</strong></td>
                  <td className="border border-gray-400 p-1" colSpan={3}>{formData.address}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Parents */}
          <div className="mb-2">
            <div className="bg-black text-white px-2 py-0.5 text-xs font-bold mb-1">ส่วนที่ 2: ข้อมูลผู้ปกครอง</div>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-1 w-24"><strong>ชื่อบิดา:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.fatherName}</td>
                  <td className="border border-gray-400 p-1 w-12"><strong>โทร:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.fatherPhone}</td>
                  <td className="border border-gray-400 p-1 w-16"><strong>อาชีพ:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.fatherOccupation}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1"><strong>ชื่อมารดา:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.motherName}</td>
                  <td className="border border-gray-400 p-1"><strong>โทร:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.motherPhone}</td>
                  <td className="border border-gray-400 p-1"><strong>อาชีพ:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.motherOccupation}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Academic */}
          <div className="mb-2">
            <div className="bg-black text-white px-2 py-0.5 text-xs font-bold mb-1">ส่วนที่ 3: ข้อมูลการศึกษา</div>
            <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-1 w-24"><strong>โรงเรียนเดิม:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.previousSchool}</td>
                  <td className="border border-gray-400 p-1 w-20"><strong>ระดับที่จบ:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.previousLevel}</td>
                  <td className="border border-gray-400 p-1 w-12"><strong>GPA:</strong></td>
                  <td className="border border-gray-400 p-1">{formData.gpa}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Declaration */}
          <div className="border border-black p-2 mb-3" style={{ fontSize: '10px' }}>
            <strong>คำรับรอง:</strong> ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ หากปรากฏว่าเป็นเท็จ ข้าพเจ้ายินยอมให้โรงเรียนเพิกถอนการรับสมัครได้ทันที
          </div>

          {/* Signatures */}
          <div className="flex justify-around mt-4">
            <div className="text-center" style={{ fontSize: '10px' }}>
              <div className="border-b border-black w-36 h-8 mb-1"></div>
              <p>ลงชื่อ ..........................</p>
              <p>(....................................)</p>
              <p>ผู้สมัคร</p>
            </div>
            <div className="text-center" style={{ fontSize: '10px' }}>
              <div className="border-b border-black w-36 h-8 mb-1"></div>
              <p>ลงชื่อ ..........................</p>
              <p>(....................................)</p>
              <p>ผู้ปกครอง</p>
            </div>
          </div>

          {/* Officer Section */}
          <div className="mt-4 pt-2 border-t border-gray-400 text-center" style={{ fontSize: '9px' }}>
            <p><strong>สำหรับเจ้าหน้าที่</strong></p>
            <div className="flex justify-center gap-6 mt-1">
              <span>☐ รับเอกสารครบ</span>
              <span>☐ ตรวจสอบแล้ว</span>
              <span>ผู้รับสมัคร .................</span>
              <span>วันที่ ...../...../.....</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-8 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="container-school text-center">
          <Badge className="mb-4 bg-accent/20 text-accent border-0">สมัครเรียน</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-card mb-4">
            สมัครเรียนออนไลน์
          </h1>
          <p className="text-card/80 text-lg max-w-2xl mx-auto mb-6">
            ปีการศึกษา {settings.academic_year} |{' '}
            {curriculumLevels.length > 0
              ? curriculumLevels.map((l) => l.title).join(' · ')
              : 'เปิดรับสมัครระดับปฐมวัย (อนุบาล) – ประถมศึกษา (ป.1–ป.6) – มัธยมศึกษาตอนต้น (ม.1–ม.3)'}
          </p>

          {/* Search existing admission */}
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-card/90 text-sm mb-2">ค้นหาใบสมัครที่ยื่นไปแล้ว</p>
            <div className="flex gap-2">
              <Input
                placeholder="ชื่อนักเรียน หรือ หมายเลขใบสมัคร"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/90 text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && searchAdmission()}
              />
              <Button onClick={searchAdmission} disabled={isSearching} variant="secondary" className="gap-2">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                ค้นหา
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Result Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ข้อมูลใบสมัคร</DialogTitle>
          </DialogHeader>
          {foundAdmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">ชื่อ:</span> <strong>{foundAdmission.student_name}</strong></div>
                <div><span className="text-muted-foreground">สถานะ:</span>
                  <Badge className={`ml-2 ${foundAdmission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    foundAdmission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      foundAdmission.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {foundAdmission.status === 'approved' ? 'อนุมัติแล้ว' :
                      foundAdmission.status === 'rejected' ? 'ไม่อนุมัติ' :
                        foundAdmission.status === 'reviewing' ? 'กำลังตรวจสอบ' : 'รอดำเนินการ'}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">ระดับชั้น:</span> {foundAdmission.grade_applying}</div>
                <div><span className="text-muted-foreground">แผนการเรียน:</span> {foundAdmission.program_applying}</div>
                <div><span className="text-muted-foreground">โรงเรียนเดิม:</span> {foundAdmission.previous_school}</div>
                <div><span className="text-muted-foreground">วันที่สมัคร:</span> {new Date(foundAdmission.created_at).toLocaleDateString('th-TH')}</div>
              </div>
              <div className="pt-4 border-t flex justify-between">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                        <head>
                          <title>ใบสมัครเข้าเรียน</title>
                          <style>
                            @page { size: A4 portrait; margin: 8mm; }
                            body { font-family: 'Sarabun', sans-serif; font-size: 11px; padding: 16px; }
                            h1 { font-size: 18px; margin: 0; }
                            h2 { font-size: 14px; margin: 4px 0 16px 0; }
                            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
                            .top-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
                            .photo-box { width: 80px; height: 96px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 8px; text-align: center; }
                            .section-title { background: #000; color: #fff; padding: 2px 8px; font-weight: bold; font-size: 10px; margin-bottom: 4px; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
                            td { border: 1px solid #999; padding: 4px; }
                            .declaration { border: 1px solid #000; padding: 8px; margin: 12px 0; font-size: 10px; }
                            .signatures { display: flex; justify-content: space-around; margin-top: 16px; }
                            .sig-box { text-align: center; font-size: 10px; }
                            .sig-line { border-bottom: 1px solid #000; width: 144px; height: 32px; margin-bottom: 4px; }
                            .officer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #999; text-align: center; font-size: 9px; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>ใบสมัครเข้าเรียน</h1>
                            <h2>${settings?.school_name || 'โรงเรียน'} ปีการศึกษา ${settings.academic_year}</h2>
                          </div>
                          <div class="top-row">
                            <div>
                              <p><strong>วันที่สมัคร:</strong> ${new Date(foundAdmission.created_at).toLocaleDateString('th-TH')}</p>
                              <p><strong>สมัครเข้าชั้น:</strong> ${foundAdmission.grade_applying} <strong>แผน:</strong> ${foundAdmission.program_applying}</p>
                            </div>
                            <div class="photo-box">ติดรูปถ่าย<br/>1 นิ้ว</div>
                          </div>
                          <div class="section-title">ส่วนที่ 1: ข้อมูลนักเรียน</div>
                          <table>
                            <tr><td width="25%"><strong>ชื่อ-สกุล:</strong></td><td colspan="3">${foundAdmission.student_name}</td></tr>
                            <tr><td><strong>เลขบัตร:</strong></td><td>${foundAdmission.student_id_card || '-'}</td><td width="15%"><strong>วันเกิด:</strong></td><td>${foundAdmission.birth_date || '-'}</td></tr>
                            <tr><td><strong>ที่อยู่:</strong></td><td colspan="3">${foundAdmission.address || '-'}</td></tr>
                          </table>
                          <div class="section-title">ส่วนที่ 2: ข้อมูลผู้ปกครอง</div>
                          <table>
                            <tr><td width="25%"><strong>ชื่อผู้ปกครอง:</strong></td><td>${foundAdmission.parent_name}</td><td width="15%"><strong>โทร:</strong></td><td>${foundAdmission.parent_phone}</td></tr>
                            <tr><td><strong>อีเมล:</strong></td><td colspan="3">${foundAdmission.parent_email || '-'}</td></tr>
                          </table>
                          <div class="section-title">ส่วนที่ 3: ข้อมูลการศึกษา</div>
                          <table>
                            <tr><td width="25%"><strong>โรงเรียนเดิม:</strong></td><td colspan="3">${foundAdmission.previous_school || '-'}</td></tr>
                          </table>
                          <div class="declaration">
                            <strong>คำรับรอง:</strong> ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ หากปรากฏว่าเป็นเท็จ ข้าพเจ้ายินยอมให้โรงเรียนเพิกถอนการรับสมัครได้ทันที
                          </div>
                          <div class="signatures">
                            <div class="sig-box"><div class="sig-line"></div><p>ลงชื่อ ..........................</p><p>(....................................)</p><p>ผู้สมัคร</p></div>
                            <div class="sig-box"><div class="sig-line"></div><p>ลงชื่อ ..........................</p><p>(....................................)</p><p>ผู้ปกครอง</p></div>
                          </div>
                          <div class="officer">
                            <p><strong>สำหรับเจ้าหน้าที่</strong></p>
                            <p>☐ รับเอกสารครบ &nbsp;&nbsp; ☐ ตรวจสอบแล้ว &nbsp;&nbsp; ผู้รับสมัคร ................. &nbsp;&nbsp; วันที่ ...../...../.....</p>
                          </div>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                >
                  <Printer className="w-4 h-4" />
                  พิมพ์ใบสมัคร
                </Button>
                <Button onClick={() => setShowSearchDialog(false)}>ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Steps */}
      <section className="py-8 bg-card border-b">
        <div className="container-school">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                      }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-sm mt-2 hidden md:block ${currentStep >= step.id ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 md:w-24 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-primary' : 'bg-secondary'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Content */}
      <section className="py-12">
        <div className="container-school">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {currentStep === 1 && <><User className="w-5 h-5" /> ข้อมูลนักเรียน</>}
                    {currentStep === 2 && <><Users className="w-5 h-5" /> ข้อมูลผู้ปกครอง</>}
                    {currentStep === 3 && <><BookOpen className="w-5 h-5" /> ข้อมูลการศึกษา</>}
                    {currentStep === 4 && <><FileText className="w-5 h-5" /> ตรวจสอบและยืนยัน</>}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 && 'กรอกข้อมูลส่วนตัวของนักเรียน'}
                    {currentStep === 2 && 'กรอกข้อมูลบิดาและมารดา'}
                    {currentStep === 3 && 'กรอกข้อมูลการศึกษาและแผนการเรียนที่ต้องการ'}
                    {currentStep === 4 && 'ตรวจสอบความถูกต้องของข้อมูลก่อนส่งใบสมัคร'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Student Info */}
                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="prefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>คำนำหน้า</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกคำนำหน้า" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="เด็กชาย">เด็กชาย</SelectItem>
                                <SelectItem value="เด็กหญิง">เด็กหญิง</SelectItem>
                                <SelectItem value="นาย">นาย</SelectItem>
                                <SelectItem value="นางสาว">นางสาว</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="hidden md:block" />

                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อ</FormLabel>
                            <FormControl>
                              <Input placeholder="กรอกชื่อ" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>นามสกุล</FormLabel>
                            <FormControl>
                              <Input placeholder="กรอกนามสกุล" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="idCard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เลขบัตรประชาชน</FormLabel>
                            <FormControl>
                              <Input placeholder="X-XXXX-XXXXX-XX-X" maxLength={13} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>วันเกิด</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>สัญชาติ</FormLabel>
                            <FormControl>
                              <Input placeholder="สัญชาติ" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ศาสนา</FormLabel>
                            <FormControl>
                              <Input placeholder="ศาสนา" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เบอร์โทรศัพท์</FormLabel>
                            <FormControl>
                              <Input placeholder="0XX-XXX-XXXX" maxLength={10} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>อีเมล</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="example@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>ที่อยู่ปัจจุบัน</FormLabel>
                            <FormControl>
                              <Textarea placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 2: Parent Info */}
                  {currentStep === 2 && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          ข้อมูลบิดา
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="fatherName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ชื่อ-นามสกุล</FormLabel>
                                <FormControl>
                                  <Input placeholder="นาย..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="fatherPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>เบอร์โทรศัพท์</FormLabel>
                                <FormControl>
                                  <Input placeholder="0XX-XXX-XXXX" maxLength={10} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="fatherOccupation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>อาชีพ</FormLabel>
                                <FormControl>
                                  <Input placeholder="อาชีพ" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          ข้อมูลมารดา
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="motherName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ชื่อ-นามสกุล</FormLabel>
                                <FormControl>
                                  <Input placeholder="นาง/นางสาว..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="motherPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>เบอร์โทรศัพท์</FormLabel>
                                <FormControl>
                                  <Input placeholder="0XX-XXX-XXXX" maxLength={10} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="motherOccupation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>อาชีพ</FormLabel>
                                <FormControl>
                                  <Input placeholder="อาชีพ" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Academic Info */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="previousSchool"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>โรงเรียนเดิม</FormLabel>
                              <FormControl>
                                <Input placeholder='ชื่อโรงเรียนเดิม (หรือระบุ "-" หากเข้าเรียนครั้งแรก)' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="previousLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ระดับชั้นเดิม / ชั้นที่จบ</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกระดับชั้นเดิม" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ยังไม่เคยเข้าเรียน / เตรียมอนุบาล">ยังไม่เคยเข้าเรียน / เตรียมอนุบาล</SelectItem>
                                  <SelectItem value="อนุบาล 1">อนุบาล 1</SelectItem>
                                  <SelectItem value="อนุบาล 2">อนุบาล 2</SelectItem>
                                  <SelectItem value="อนุบาล 3">อนุบาล 3</SelectItem>
                                  <SelectItem value="ประถมศึกษาปีที่ 1–5 (ย้ายสถานศึกษา)">ประถมศึกษาปีที่ 1–5 (ย้ายสถานศึกษา)</SelectItem>
                                  <SelectItem value="ป.6">ประถมศึกษาปีที่ 6</SelectItem>
                                  <SelectItem value="มัธยมศึกษาปีที่ 1–2 (ย้ายสถานศึกษา)">มัธยมศึกษาปีที่ 1–2 (ย้ายสถานศึกษา)</SelectItem>
                                  <SelectItem value="ม.3">มัธยมศึกษาปีที่ 3</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gpa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>เกรดเฉลี่ยสะสม (GPA)</FormLabel>
                              <FormControl>
                                <Input placeholder='เช่น 3.50 (หรือระบุ "-" กรณีระดับปฐมวัย)' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="enrollLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ระดับชั้นที่ต้องการสมัคร</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกระดับชั้นที่สมัคร" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {gradeOptions.map((grade) => (
                                    <SelectItem key={grade} value={grade}>
                                      {grade}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="program"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>หลักสูตร / แผนการเรียนที่ต้องการ</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกหลักสูตร / แผนการเรียน" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {programs.map((program) => (
                                    <SelectItem key={program.value} value={program.value}>
                                      {program.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <User className="w-4 h-4" />
                              ข้อมูลนักเรียน
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            <p><span className="text-muted-foreground">ชื่อ:</span> {form.getValues('prefix')} {form.getValues('firstName')} {form.getValues('lastName')}</p>
                            <p><span className="text-muted-foreground">เลขบัตรประชาชน:</span> {form.getValues('idCard')}</p>
                            <p><span className="text-muted-foreground">วันเกิด:</span> {form.getValues('birthDate')}</p>
                            <p><span className="text-muted-foreground">โทรศัพท์:</span> {form.getValues('phone')}</p>
                            <p><span className="text-muted-foreground">อีเมล:</span> {form.getValues('email')}</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              ข้อมูลผู้ปกครอง
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            <p><span className="text-muted-foreground">บิดา:</span> {form.getValues('fatherName')}</p>
                            <p><span className="text-muted-foreground">โทร:</span> {form.getValues('fatherPhone')}</p>
                            <p><span className="text-muted-foreground">มารดา:</span> {form.getValues('motherName')}</p>
                            <p><span className="text-muted-foreground">โทร:</span> {form.getValues('motherPhone')}</p>
                          </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              ข้อมูลการศึกษา
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm grid grid-cols-2 gap-4">
                            <p><span className="text-muted-foreground">โรงเรียนเดิม:</span> {form.getValues('previousSchool')}</p>
                            <p><span className="text-muted-foreground">ระดับชั้นที่จบ:</span> {form.getValues('previousLevel')}</p>
                            <p><span className="text-muted-foreground">GPA:</span> {form.getValues('gpa')}</p>
                            <p><span className="text-muted-foreground">สมัครเข้า:</span> {form.getValues('enrollLevel')}</p>
                            <p><span className="text-muted-foreground">แผนการเรียน:</span> {programs.find(p => p.value === form.getValues('program'))?.label}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Agreements */}
                      <div className="space-y-4 p-4 bg-secondary rounded-lg">
                        <FormField
                          control={form.control}
                          name="agreeTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  ข้าพเจ้ายืนยันว่าข้อมูลทั้งหมดเป็นความจริงทุกประการ
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="agreePrivacy"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  ข้าพเจ้ายินยอมให้โรงเรียนเก็บและใช้ข้อมูลส่วนบุคคลเพื่อการสมัครเรียน
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t">
                    <div>
                      {currentStep > 1 && (
                        <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                          <ArrowLeft className="w-4 h-4" />
                          ย้อนกลับ
                        </Button>
                      )}
                      <Link to="/" className="ml-2">
                        <Button type="button" variant="ghost" className="gap-2">
                          <ArrowLeft className="w-4 h-4" />
                          กลับหน้าหลัก
                        </Button>
                      </Link>
                    </div>
                    <div>
                      {currentStep < 4 ? (
                        <Button type="button" onClick={nextStep} className="gap-2">
                          ถัดไป
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button type="submit" className="gap-2" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              กำลังส่ง...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              ส่งใบสมัคร
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Enrollment;
