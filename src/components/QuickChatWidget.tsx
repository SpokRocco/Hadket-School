import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  User,
  Phone,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const QuickChatWidget = () => {
  const { settings } = useSchoolSettings();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    topic: 'สมัครเรียน',
    message: '',
    targetLine: 'school' as 'school' | 'director',
  });

  // Check if feature is enabled in admin settings
  const isEnabled = settings.quick_chat_enabled !== 'false';

  // Always show and pop up on refresh or navigating back to homepage (/)
  useEffect(() => {
    setIsDismissed(false);
    setShowGreetingBubble(true);

    if (location.pathname === '/' && settings.quick_chat_auto_open_home !== 'false') {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, settings.quick_chat_auto_open_home]);

  if (!isEnabled || isDismissed) {
    return null;
  }

  const schoolLineUrl = settings.quick_chat_school_line || 'https://line.me/ti/p/~hadkedschool';
  const directorLineUrl = settings.quick_chat_director_line || 'https://line.me/ti/p/~director.hadked';
  const chatTitle = settings.quick_chat_title || 'แชทด่วนสอบถามข้อมูล';
  const greetingText =
    settings.quick_chat_greeting ||
    'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด มีข้อสงสัยหรือต้องการสอบถามข้อมูล สามารถแชทคุยกับเราได้เลยครับ';
  const schoolPhone = settings.quick_chat_phone || settings.contact_phone || '054-710-123';

  const handleDismissForever = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
  };

  const handleOpenDirectLine = (type: 'school' | 'director') => {
    const url = type === 'school' ? schoolLineUrl : directorLineUrl;
    window.open(url, '_blank');
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      toast({
        variant: 'destructive',
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        description: 'กรุณากรอกชื่อและข้อความที่ต้องการสอบถาม',
      });
      return;
    }

    setSending(true);
    try {
      const targetChannel =
        formData.targetLine === 'director' ? 'ผู้อำนวยการโรงเรียน' : 'กลุ่ม LINE โรงเรียน / แอดมิน';

      // 1. Save to contact_messages table in Supabase
      const { error } = await supabase.from('contact_messages' as any).insert([
        {
          name: formData.name,
          email: `${formData.phone || 'quick-chat'}@hadket.ac.th`,
          phone: formData.phone || null,
          subject: `[แชทด่วน LINE -> ${targetChannel}] ${formData.topic}`,
          message: formData.message,
          is_read: false,
        },
      ]);

      if (error) {
        console.warn('contact_messages insert note:', error);
      }

      setSentSuccess(true);
      toast({
        title: 'ส่งข้อความสอบถามสำเร็จ',
        description: `ระบบบันทึกข้อมูลและส่งเรื่องถึง ${targetChannel} เรียบร้อยแล้ว`,
      });

      // 2. Open LINE directly with prefilled text
      const targetUrl = formData.targetLine === 'director' ? directorLineUrl : schoolLineUrl;
      const textToEncode = `[สอบถามข้อมูลโรงเรียนบ้านหาดเค็ด]\nจาก: ${formData.name}\nเบอร์โทร/LINE ID: ${formData.phone || '-'}\nเรื่อง: ${formData.topic}\nข้อความ: ${formData.message}`;
      const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(textToEncode)}`;

      // Open LINE share or direct URL in new tab after short delay
      setTimeout(() => {
        window.open(lineShareUrl, '_blank');
      }, 700);
    } catch (err: any) {
      console.error('Error sending quick chat message:', err);
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: err.message || 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setSending(false);
    }
  };

  const handleResetForm = () => {
    setSentSuccess(false);
    setFormData({
      name: '',
      phone: '',
      topic: 'สมัครเรียน',
      message: '',
      targetLine: 'school',
    });
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Floating Greeting Speech Bubble (Desktop) */}
      {!isOpen && showGreetingBubble && (
        <div className="hidden sm:flex items-center gap-2 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl px-4 py-2.5 max-w-xs animate-in slide-in-from-bottom-3 duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">สอบถามข้อมูลด่วน / แชท LINE</p>
            <p className="text-[11px] text-muted-foreground truncate">ติดต่อกลุ่มโรงเรียนหรือ ผอ. ได้ทันที</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowGreetingBubble(false);
            }}
            title="ปิดป้ายแจ้งเตือนนี้"
            className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-secondary shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chat Box Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] max-w-[calc(100vw-32px)] max-h-[88vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 mb-3">
          {/* Header with LINE Theme */}
          <div className="bg-gradient-to-r from-[#06C755] to-[#00B900] text-white p-4 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                <MessageCircle className="w-6 h-6 fill-current" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                  {chatTitle}
                </h3>
                <p className="text-[11px] text-white/90 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  โรงเรียนบ้านหาดเค็ด · พร้อมให้บริการ
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 shrink-0"
              title="ปิดหน้าต่างแชท (กดกากบาท)"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Chat Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-sm bg-gradient-to-b from-secondary/30 via-background to-background">
            {/* School Welcome Card */}
            <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  บหค
                </span>
                <div>
                  <p className="font-semibold text-xs text-foreground">ฝ่ายประชาสัมพันธ์และผู้บริหาร</p>
                  <p className="text-[10px] text-muted-foreground">โรงเรียนบ้านหาดเค็ด อ.ภูเพียง จ.น่าน</p>
                </div>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed bg-background/80 p-2.5 rounded-xl border border-border/60">
                "{greetingText}"
              </p>
            </div>

            {/* Direct LINE Fast Connect Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#06C755]" />
                เลือกช่องทางติดต่อผ่าน LINE ได้โดยตรง:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDirectLine('school')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#06C755]/10 hover:bg-[#06C755]/20 border border-[#06C755]/30 text-foreground transition-all hover:scale-[1.02] text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageSquare className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-[#06C755] truncate">LINE กลุ่มโรงเรียน</p>
                    <p className="text-[10px] text-muted-foreground truncate">ผู้ปกครอง & ข่าวสาร</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDirectLine('director')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-foreground transition-all hover:scale-[1.02] text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-blue-600 dark:text-blue-400 truncate">LINE ผู้อำนวยการ</p>
                    <p className="text-[10px] text-muted-foreground truncate">ติดต่อฝ่ายบริหาร</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0" />
                </button>
              </div>
            </div>

            {/* Inquiry Form or Success Message */}
            {sentSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">ส่งข้อความสอบถามเรียบร้อยแล้ว</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    ระบบได้ส่งข้อมูลไปยังระบบสารสนเทศของโรงเรียนและเปิดห้องสนทนา LINE ให้เรียบร้อยแล้ว
                  </p>
                </div>
                <div className="flex gap-2 justify-center pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#06C755] hover:bg-[#05b34c] text-white text-xs gap-1.5"
                    onClick={() => {
                      const targetUrl = formData.targetLine === 'director' ? directorLineUrl : schoolLineUrl;
                      window.open(targetUrl, '_blank');
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    เปิดคุยใน LINE ต่อ
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleResetForm} className="text-xs">
                    ส่งข้อความอื่นเพิ่ม
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-primary" />
                    หรือส่งข้อความด่วนผ่านแบบฟอร์มนี้:
                  </p>
                </div>

                {/* Target Channel Picker */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">ส่งข้อความถึง:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetLine: 'school' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        formData.targetLine === 'school'
                          ? 'bg-[#06C755] text-white border-[#06C755] shadow-xs'
                          : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      กลุ่ม LINE โรงเรียน
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, targetLine: 'director' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        formData.targetLine === 'director'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      LINE ผู้อำนวยการ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="qc_name" className="text-[11px]">ชื่อผู้ติดต่อ *</Label>
                    <Input
                      id="qc_name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น สมชาย ใจดี"
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="qc_phone" className="text-[11px]">เบอร์โทรศัพท์ / LINE ID</Label>
                    <Input
                      id="qc_phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08X-XXX-XXXX"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="qc_topic" className="text-[11px]">เรื่องที่ต้องการสอบถาม</Label>
                  <Select
                    value={formData.topic}
                    onValueChange={(val) => setFormData({ ...formData, topic: val })}
                  >
                    <SelectTrigger id="qc_topic" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="สมัครเรียน">สมัครเรียน / แผนการเรียน 2569</SelectItem>
                      <SelectItem value="หลักสูตรการศึกษา">หลักสูตรและวิชาการ</SelectItem>
                      <SelectItem value="งานธุรการและเอกสาร">ขอเอกสาร / งานธุรการ</SelectItem>
                      <SelectItem value="กิจกรรมโรงเรียน">กิจกรรมและโครงการนักเรียน</SelectItem>
                      <SelectItem value="ติดต่อผู้อำนวยการ">ติดต่อผู้อำนวยการโดยตรง</SelectItem>
                      <SelectItem value="สอบถามเรื่องทั่วไป">สอบถามเรื่องทั่วไป</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="qc_message" className="text-[11px]">ข้อความสอบถาม *</Label>
                  <Textarea
                    id="qc_message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="พิมพ์รายละเอียดที่ต้องการสอบถามที่นี่..."
                    rows={2}
                    className="text-xs resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full h-9 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-semibold gap-1.5 shadow-sm"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      กำลังส่งข้อความ...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      ส่งข้อความและเปิด LINE
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Quick Hotline Phone */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-primary" />
                เบอร์โทรโรงเรียน: {schoolPhone}
              </span>
              <a
                href={`tel:${schoolPhone.replace(/-/g, '')}`}
                className="text-primary hover:underline font-medium"
              >
                โทรออกทันที
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (LINE Theme) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="เปิดแชทด่วนสอบถามข้อมูล"
          className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#00B900] to-[#06C755] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none"
        >
          {/* Animated Glow Rings */}
          <span className="absolute -inset-1 rounded-full bg-[#06C755] opacity-35 group-hover:opacity-60 animate-ping pointer-events-none" />
          <span className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <MessageCircle className="w-7 h-7 fill-current" />
            )}
          </span>
        </button>

        {/* Small dismiss button to close widget trigger if user doesn't want it */}
        {!isOpen && (
          <button
            type="button"
            onClick={handleDismissForever}
            title="ซ่อนปุ่มแชทด่วนนี้"
            className="w-5 h-5 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center shadow-xs"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
export default QuickChatWidget;
