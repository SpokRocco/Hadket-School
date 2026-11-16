import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, FileText, Hash, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { SchoolSettings } from '@/hooks/useSchoolSettings';
import {
  DEFAULT_NEWSLETTER_ORG_SETTINGS,
  parseImageUrlsList,
  type NewsletterOrgSettings,
  type NewsletterTemplateType,
  type SchoolNewsletter,
} from '@/utils/newsletterUtils';

export const A4_PIXEL_WIDTH = 794;
export const A4_PIXEL_HEIGHT = 1123;

const formatThaiDateSafe = (dateStr?: string | null) => {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: th });
  } catch {
    return dateStr;
  }
};

interface NewsletterA4SheetProps {
  newsletter: Partial<SchoolNewsletter>;
  settings: SchoolSettings;
  orgSettings?: NewsletterOrgSettings;
  sheetRef?: React.Ref<HTMLDivElement>;
}

const PhotoFrame = ({
  src,
  alt,
  className = '',
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  if (!src) {
    return (
      <div
        className={`bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 ${className}`}
      >
        <FileText className="w-7 h-7 mb-1 opacity-60" />
        <span className="text-[11px]">รอรูปภาพประกอบ</span>
      </div>
    );
  }
  return (
    <div className={`bg-slate-100 overflow-hidden border border-slate-200 ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export const NewsletterA4Sheet = ({
  newsletter,
  settings,
  orgSettings = DEFAULT_NEWSLETTER_ORG_SETTINGS,
  sheetRef,
}: NewsletterA4SheetProps) => {
  const photos = parseImageUrlsList(newsletter.image_urls, newsletter.image_url);
  const template: NewsletterTemplateType =
    (newsletter.template_type as NewsletterTemplateType) ||
    orgSettings.defaultTemplate ||
    'template_1';

  const title = newsletter.title?.trim() || 'หัวข้อจดหมายข่าวประชาสัมพันธ์';
  const summary = newsletter.summary?.trim() || '';
  const content = newsletter.content?.trim() || '';
  const category = newsletter.category || 'กิจกรรมสถานศึกษา';
  const issueNo = newsletter.issue_no || '01';
  const academicYear = newsletter.academic_year || '2569';
  const issueDate = formatThaiDateSafe(newsletter.issue_date);
  const status = newsletter.status || (newsletter.is_published ? 'approved' : 'draft');

  const headerTitle = orgSettings.headerTitle || 'จดหมายข่าวประชาสัมพันธ์';
  const headerSubtitle =
    orgSettings.headerSubtitle || 'SCHOOL NEWSLETTER • วารสารประชาสัมพันธ์สถานศึกษา';
  const footerLine =
    orgSettings.footerText ||
    `${settings.school_name}${settings.contact_address ? ` • ${settings.contact_address}` : ''}${
      settings.contact_phone ? ` • โทร ${settings.contact_phone}` : ''
    }`;

  const renderTemplateBody = () => {
    // TEMPLATE 1: Hero + Grid (Large hero top + 3-5 bottom grid)
    if (template === 'template_1') {
      const subPhotos = photos.slice(1);
      const subGridCols =
        subPhotos.length <= 1
          ? 'grid-cols-1'
          : subPhotos.length === 2
            ? 'grid-cols-2'
            : subPhotos.length === 4
              ? 'grid-cols-2 grid-rows-2'
              : subPhotos.length >= 5
                ? 'grid-cols-3 grid-rows-2'
                : 'grid-cols-3';

      return (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
          <PhotoFrame
            src={photos[0]}
            alt={title}
            className="h-[325px] shrink-0 rounded-xl shadow-xs"
          />

          <div className="shrink-0 space-y-2">
            {summary && (
              <div className="bg-slate-50 border-l-4 border-[#11294b] px-3.5 py-2 rounded-r-lg">
                <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2">
                  {summary}
                </p>
              </div>
            )}
            {content && (
              <p className="text-[12.5px] leading-[1.6] text-slate-700 whitespace-pre-line line-clamp-5">
                {content}
              </p>
            )}
          </div>

          {subPhotos.length > 0 && (
            <div className={`flex-1 min-h-0 grid gap-2.5 ${subGridCols}`}>
              {subPhotos.map((src, idx) => (
                <PhotoFrame
                  key={`${idx}-${src.slice(0, 24)}`}
                  src={src}
                  alt={`${title} ภาพที่ ${idx + 2}`}
                  className="rounded-lg h-full"
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // TEMPLATE 2: Magazine / Editorial Zig-zag
    if (template === 'template_2') {
      const stripPhotos = photos.slice(2);
      const stripCols =
        stripPhotos.length <= 1
          ? 'grid-cols-1'
          : stripPhotos.length === 2
            ? 'grid-cols-2'
            : stripPhotos.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-4';

      return (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
          {/* Row 1: Image Left + Editorial Lead Right */}
          <div className="grid grid-cols-12 gap-3.5 h-[245px] shrink-0">
            <PhotoFrame
              src={photos[0]}
              alt={`${title} ภาพหลัก`}
              className="col-span-6 rounded-xl h-full"
            />
            <div className="col-span-6 flex flex-col justify-between bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 overflow-hidden">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full mb-2">
                  สาระสำคัญ • EDITORIAL HIGHLIGHT
                </span>
                <p className="text-[13.5px] font-semibold text-slate-800 leading-relaxed line-clamp-6">
                  {summary || content || title}
                </p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-amber-200/70 pt-2 mt-2 flex items-center justify-between">
                <span>หมวด: {category}</span>
                <span>{settings.school_short_name || 'บหค'}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Body Article Left + Image Right (Zig-zag) */}
          <div className="grid grid-cols-12 gap-3.5 h-[265px] shrink-0">
            <div className="col-span-7 bg-slate-50/80 border border-slate-200 rounded-xl p-4 overflow-hidden flex flex-col justify-center">
              <h4 className="text-xs font-bold text-[#11294b] uppercase tracking-wider mb-1.5">
                รายละเอียดกิจกรรมและผลการดำเนินงาน
              </h4>
              <p className="text-[12.5px] leading-[1.65] text-slate-700 whitespace-pre-line line-clamp-9">
                {content || summary || 'รายละเอียดกิจกรรมและภาพบรรยากาศการดำเนินงานของสถานศึกษา'}
              </p>
            </div>
            <PhotoFrame
              src={photos[1] || photos[0]}
              alt={`${title} ภาพที่ 2`}
              className="col-span-5 rounded-xl h-full"
            />
          </div>

          {/* Row 3: Bottom Strip of Remaining Photos */}
          {stripPhotos.length > 0 && (
            <div className={`flex-1 min-h-0 grid gap-2.5 ${stripCols}`}>
              {stripPhotos.map((src, idx) => (
                <PhotoFrame
                  key={`${idx}-${src.slice(0, 24)}`}
                  src={src}
                  alt={`${title} ภาพที่ ${idx + 3}`}
                  className="rounded-lg h-full"
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // TEMPLATE 3: Collage / Bento Grid
    if (template === 'template_3') {
      const bottomRowPhotos = photos.slice(3);
      const bottomGridCols =
        bottomRowPhotos.length <= 1
          ? 'grid-cols-1'
          : bottomRowPhotos.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-3';

      return (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
          {summary && (
            <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <p className="text-[12.5px] font-semibold text-slate-800 leading-snug line-clamp-2">
                {summary}
              </p>
            </div>
          )}

          {/* Bento Photo Grid */}
          <div className="h-[515px] shrink-0 flex flex-col gap-2.5">
            <div className="grid grid-cols-12 gap-2.5 h-[335px]">
              <PhotoFrame
                src={photos[0]}
                alt={`${title} ภาพที่ 1`}
                className="col-span-7 rounded-xl h-full"
              />
              <div className="col-span-5 grid grid-rows-2 gap-2.5 h-full">
                <PhotoFrame
                  src={photos[1] || photos[0]}
                  alt={`${title} ภาพที่ 2`}
                  className="rounded-xl h-full"
                />
                <PhotoFrame
                  src={photos[2] || photos[0]}
                  alt={`${title} ภาพที่ 3`}
                  className="rounded-xl h-full"
                />
              </div>
            </div>

            {bottomRowPhotos.length > 0 && (
              <div className={`grid gap-2.5 flex-1 min-h-0 ${bottomGridCols}`}>
                {bottomRowPhotos.map((src, idx) => (
                  <PhotoFrame
                    key={`${idx}-${src.slice(0, 24)}`}
                    src={src}
                    alt={`${title} ภาพที่ ${idx + 4}`}
                    className="rounded-xl h-full"
                  />
                ))}
              </div>
            )}
          </div>

          {content && (
            <div className="flex-1 min-h-0 bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 overflow-hidden">
              <p className="text-[12.5px] leading-[1.6] text-slate-700 whitespace-pre-line line-clamp-5">
                {content}
              </p>
            </div>
          )}
        </div>
      );
    }

    // TEMPLATE 4: Classic Gallery (Top 2-Column Editorial + Uniform 2x2 / 3x2 Gallery)
    const galleryCols =
      photos.length <= 1
        ? 'grid-cols-1'
        : photos.length <= 4
          ? 'grid-cols-2 grid-rows-2'
          : 'grid-cols-3 grid-rows-2';

    return (
      <div className="flex-1 min-h-0 flex flex-col gap-3.5 overflow-hidden">
        <div className="shrink-0 space-y-2.5">
          {summary && (
            <div className="bg-sky-50/70 border-l-4 border-[#1e5c8a] px-3.5 py-2 rounded-r-lg">
              <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2">
                {summary}
              </p>
            </div>
          )}
          {content && (
            <div className="columns-2 gap-5 text-[12.2px] leading-[1.62] text-slate-700 whitespace-pre-line max-h-[195px] overflow-hidden">
              {content}
            </div>
          )}
        </div>

        <div className={`flex-1 min-h-0 grid gap-2.5 ${galleryCols}`}>
          {(photos.length > 0 ? photos : [undefined]).map((src, idx) => (
            <PhotoFrame
              key={`${idx}-${src?.slice(0, 24) || 'empty'}`}
              src={src}
              alt={`${title} ภาพที่ ${idx + 1}`}
              className="rounded-xl h-full"
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={sheetRef}
      style={{ width: `${A4_PIXEL_WIDTH}px`, height: `${A4_PIXEL_HEIGHT}px` }}
      className="bg-white text-slate-900 flex flex-col overflow-hidden border border-slate-200 shadow-lg box-border select-text font-sarabun"
    >
      {/* Official Institutional Header */}
      <header className="h-[112px] shrink-0 bg-gradient-to-r from-[#11294b] via-[#173663] to-[#1e5c8a] px-7 py-4 text-white border-b-4 border-amber-400 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {settings.school_logo_url ? (
            <img
              src={settings.school_logo_url}
              alt={settings.school_name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-contain bg-white p-1 shadow-md shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-amber-400 text-[#11294b] font-bold text-lg flex items-center justify-center shadow-md shrink-0">
              {settings.school_short_name || 'บหค'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase text-amber-300 truncate">
              {headerSubtitle}
            </p>
            <h1 className="text-xl font-bold leading-tight text-white truncate">
              {headerTitle} — {settings.school_name}
            </h1>
            {settings.school_tagline && (
              <p className="text-[11px] text-white/80 truncate mt-0.5">
                {settings.school_tagline}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-right">
          <div className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1">
            <Hash className="w-3.5 h-3.5" />
            ฉบับที่ {issueNo} / {academicYear}
          </div>
          <div className="text-[11px] text-white/90 mt-0.5">{issueDate}</div>
          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 text-[10px] font-semibold">
            {category}
          </span>
        </div>
      </header>

      {/* Main Content + Selected Template Grid */}
      <main className="flex-1 min-h-0 px-7 py-4 flex flex-col overflow-hidden">
        <div className="shrink-0 mb-3">
          <h2 className="text-[21px] font-bold text-[#11294b] leading-snug line-clamp-2">
            {title}
          </h2>
          <div className="w-16 h-1 bg-amber-400 rounded-full mt-1.5" />
        </div>

        {renderTemplateBody()}
      </main>

      {/* Standard Footer & Approval Sign-off */}
      <footer className="h-[88px] shrink-0 px-7 py-2.5 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-0.5 text-[11px] text-slate-600">
          <p className="font-semibold text-[#11294b] truncate">{footerLine}</p>
          <p className="text-[10.5px] text-slate-500 truncate">
            {newsletter.created_by_name
              ? `จัดทำโดย: ${newsletter.created_by_name} • `
              : 'งานประชาสัมพันธ์สถานศึกษา • '}
            {settings.contact_email || ''}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {status === 'approved' ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-right">
              <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>อนุมัติเผยแพร่</span>
              </div>
              <p className="text-[10.5px] font-semibold text-slate-800 truncate max-w-[200px]">
                {newsletter.approved_by || orgSettings.directorTitle}
              </p>
              <p className="text-[9.5px] text-slate-500">
                {newsletter.approved_at
                  ? formatThaiDateSafe(newsletter.approved_at)
                  : orgSettings.directorTitle}
              </p>
            </div>
          ) : status === 'pending' ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
              <Clock className="w-3.5 h-3.5" />
              <span>รอผู้บริหารอนุมัติ</span>
            </div>
          ) : status === 'revision' ? (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ส่งกลับแก้ไข</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-[11px] font-medium text-slate-600">
              แบบร่าง (Draft)
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

/**
 * Responsive wrapper that scales the 794x1123px A4 sheet cleanly to fit any container width
 * while preserving exact 1:1.414 A4 visual proportions.
 */
export const ScaledNewsletterA4Preview = ({
  newsletter,
  settings,
  orgSettings,
  sheetRef,
  maxWidth = 680,
}: NewsletterA4SheetProps & { maxWidth?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableW = Math.min(el.clientWidth || maxWidth, maxWidth);
      if (availableW > 0) {
        setScale(availableW / A4_PIXEL_WIDTH);
      }
    };

    updateScale();
    if (typeof ResizeObserver !== 'undefined') {
      const obs = new ResizeObserver(updateScale);
      obs.observe(el);
      return () => obs.disconnect();
    }
    return undefined;
  }, [maxWidth]);

  const scaledHeight = Math.round(A4_PIXEL_HEIGHT * scale);
  const scaledWidth = Math.round(A4_PIXEL_WIDTH * scale);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div
        style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
        className="relative overflow-hidden rounded-xl border border-border shadow-md bg-white"
      >
        <div
          style={{
            width: `${A4_PIXEL_WIDTH}px`,
            height: `${A4_PIXEL_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <NewsletterA4Sheet
            newsletter={newsletter}
            settings={settings}
            orgSettings={orgSettings}
            sheetRef={sheetRef}
          />
        </div>
      </div>
    </div>
  );
};
