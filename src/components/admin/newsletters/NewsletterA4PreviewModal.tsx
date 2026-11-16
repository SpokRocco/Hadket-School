import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
} from 'lucide-react';
import type { SchoolSettings } from '@/hooks/useSchoolSettings';
import { useToast } from '@/hooks/use-toast';
import { exportNewsletterA4ToPdf } from '@/utils/newsletterBrowserUtils';
import {
  NEWSLETTER_STATUS_META,
  type NewsletterOrgSettings,
  type SchoolNewsletter,
} from '@/utils/newsletterUtils';
import { NewsletterA4Sheet, ScaledNewsletterA4Preview } from './NewsletterA4Sheet';

/**
 * Shared hook that handles strict 1-page A4 browser printing (via document.body portal)
 * and high-DPI 1-page A4 PDF export (via html2canvas + jsPDF).
 */
export const useNewsletterPrintAndPdf = (
  newsletter: Partial<SchoolNewsletter> | null,
  settings: SchoolSettings,
  orgSettings?: NewsletterOrgSettings
) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [printingItem, setPrintingItem] = useState<Partial<SchoolNewsletter> | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('printing-newsletter-a4');
      setPrintingItem(null);
    };
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      document.body.classList.remove('printing-newsletter-a4');
    };
  }, []);

  const handlePrintA4 = useCallback(
    (target?: Partial<SchoolNewsletter>) => {
      const itemToPrint = target || newsletter;
      if (!itemToPrint) return;

      setPrintingItem(itemToPrint);
      document.body.classList.add('printing-newsletter-a4');

      // Allow React one animation frame to mount the print portal before invoking print
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
        }, 120);
      });
    },
    [newsletter]
  );

  const handleExportPdf = useCallback(
    async (target?: Partial<SchoolNewsletter>) => {
      const item = target || newsletter;
      if (!sheetRef.current || !item) {
        toast({
          variant: 'destructive',
          title: 'ไม่พบเอกสารสำหรับส่งออก',
          description: 'กรุณาเปิดหน้าต่างพรีวิว A4 ก่อนดาวน์โหลด PDF',
        });
        return;
      }

      setExportingPdf(true);
      try {
        const issueSlug = `${item.issue_no || '01'}-${item.academic_year || '2569'}`.replace(
          /[^a-zA-Z0-9_-]/g,
          '-'
        );
        await exportNewsletterA4ToPdf(sheetRef.current, `newsletter-${issueSlug}-A4.pdf`);
        toast({
          title: 'ส่งออกไฟล์ PDF (A4) สำเร็จ',
          description: `บันทึกจดหมายข่าวขนาด 1 หน้า A4 เรียบร้อยแล้ว`,
        });
      } catch (err: any) {
        console.error('PDF export error:', err);
        toast({
          variant: 'destructive',
          title: 'ส่งออก PDF ไม่สำเร็จ',
          description: err?.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF',
        });
      } finally {
        setExportingPdf(false);
      }
    },
    [newsletter, toast]
  );

  const printPortal =
    printingItem && typeof document !== 'undefined'
      ? createPortal(
          <div className="newsletter-print-portal hidden print:flex">
            <NewsletterA4Sheet
              newsletter={printingItem}
              settings={settings}
              orgSettings={orgSettings}
            />
          </div>,
          document.body
        )
      : null;

  return {
    sheetRef,
    exportingPdf,
    handlePrintA4,
    handleExportPdf,
    printPortal,
  };
};

interface NewsletterA4PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsletter: SchoolNewsletter | null;
  settings: SchoolSettings;
  orgSettings: NewsletterOrgSettings;
  canReview?: boolean;
  onApprove?: (item: SchoolNewsletter) => Promise<void> | void;
  onRequestRevision?: (item: SchoolNewsletter, note: string) => Promise<void> | void;
}

export const NewsletterA4PreviewModal = ({
  open,
  onOpenChange,
  newsletter,
  settings,
  orgSettings,
  canReview = false,
  onApprove,
  onRequestRevision,
}: NewsletterA4PreviewModalProps) => {
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const { toast } = useToast();

  const { sheetRef, exportingPdf, handlePrintA4, handleExportPdf, printPortal } =
    useNewsletterPrintAndPdf(newsletter, settings, orgSettings);

  useEffect(() => {
    if (open && newsletter) {
      setShowRevisionBox(false);
      setRevisionNote(newsletter.revision_note || '');
    }
  }, [open, newsletter]);

  if (!newsletter) return null;

  const statusKey = newsletter.status || (newsletter.is_published ? 'approved' : 'draft');
  const statusMeta = NEWSLETTER_STATUS_META[statusKey];

  const handleApproveClick = async () => {
    if (!onApprove) return;
    setSubmittingAction(true);
    try {
      await onApprove(newsletter);
      onOpenChange(false);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!onRequestRevision) return;
    if (!revisionNote.trim()) {
      toast({
        variant: 'destructive',
        title: 'กรุณาระบุหมายเหตุแก้ไข',
        description: 'โปรดกรอกข้อเสนอแนะเพื่อให้ผู้จัดทำนำไปปรับปรุง',
      });
      return;
    }
    setSubmittingAction(true);
    try {
      await onRequestRevision(newsletter, revisionNote.trim());
      setShowRevisionBox(false);
      onOpenChange(false);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <>
      {printPortal}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[94vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  พรีวิวจดหมายข่าวขนาด A4 (210 × 297 มม.)
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  ฉบับที่ {newsletter.issue_no}/{newsletter.academic_year} • {newsletter.title}
                </DialogDescription>
              </div>
              <Badge variant="outline" className={statusMeta.badgeClass}>
                {statusMeta.label}
              </Badge>
            </div>
          </DialogHeader>

          {/* Top Export & Print Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
            <span className="text-xs text-muted-foreground">
              จัดหน้าอัตโนมัติพอดี 1 หน้ากระดาษ A4 สำหรับพิมพ์และส่งออก PDF ความคมชัดสูง
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePrintA4(newsletter)}
                className="gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                พิมพ์จดหมายข่าว (Print A4)
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleExportPdf(newsletter)}
                disabled={exportingPdf}
                className="gap-1.5 text-xs bg-primary text-primary-foreground"
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    กำลังสร้าง PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    ดาวน์โหลดไฟล์ PDF (Export A4 PDF)
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Executive Approval / Revision Controls */}
          {canReview && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    แผงตรวจสอบและอนุมัติสำหรับผู้บริหาร (Executive Approval)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ตรวจสอบองค์ประกอบ ข้อความ และภาพประกอบก่อนกดอนุมัติเผยแพร่สู่หน้าเว็บไซต์
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={submittingAction}
                    onClick={() => setShowRevisionBox((v) => !v)}
                    className="gap-1.5 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    ส่งกลับให้แก้ไข
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={submittingAction}
                    onClick={() => void handleApproveClick()}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {submittingAction ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    อนุมัติเผยแพร่ (Approve)
                  </Button>
                </div>
              </div>

              {showRevisionBox && (
                <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <Label htmlFor="exec_revision_note" className="text-xs font-semibold">
                    หมายเหตุ / ข้อเสนอแนะในการแก้ไข *
                  </Label>
                  <Textarea
                    id="exec_revision_note"
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="ระบุรายละเอียดที่ต้องการให้ปรับแก้ เช่น ปรับรูปภาพหลัก หรือแก้ไขข้อความย่อหน้าแรก..."
                    rows={2}
                    className="bg-background text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowRevisionBox(false)}
                      className="text-xs"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={submittingAction}
                      onClick={() => void handleRevisionSubmit()}
                      className="text-xs gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      ยืนยันส่งกลับแก้ไข
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scaled Live A4 Preview */}
          <div className="py-2 bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-3 sm:p-5 border border-border">
            <ScaledNewsletterA4Preview
              newsletter={newsletter}
              settings={settings}
              orgSettings={orgSettings}
              sheetRef={sheetRef}
              maxWidth={680}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
