import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Phone, BookOpen, Sparkles } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useNavigate, Link } from 'react-router-dom';
import heroImage from '@/assets/hero-school.jpg';
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';
import { DEFAULT_HERO_SLIDES, type HeroSlideItem } from '@/utils/homepageLayoutUtils';

const HeroSection = () => {
  const { settings } = useSchoolSettings();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const rawSlides: HeroSlideItem[] =
    settings.heroSlides && settings.heroSlides.length > 0
      ? settings.heroSlides
      : DEFAULT_HERO_SLIDES;

  const enabledSlides = rawSlides.filter((s) => s.enabled);
  const slides = enabledSlides.length > 0 ? enabledSlides : DEFAULT_HERO_SLIDES;

  // Auto-play interval timer with hover pause
  useEffect(() => {
    const isAutoPlay = settings.hero_autoplay_enabled !== 'false';
    if (!isAutoPlay || slides.length <= 1 || isPaused) return;

    const intervalMs = Math.max(
      2500,
      Number.parseInt(settings.hero_autoplay_interval || '6000', 10) || 6000
    );

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev >= slides.length - 1 ? 0 : prev + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, settings.hero_autoplay_enabled, settings.hero_autoplay_interval]);

  // Clamp activeSlide if slides count changes dynamically
  const safeActiveSlide = activeSlide < slides.length ? activeSlide : 0;
  const currentSlide = slides[safeActiveSlide] || slides[0];

  const resolveSlideImage = (slide: HeroSlideItem, index: number) => {
    if (slide.image && slide.image.trim()) {
      return slide.image.trim();
    }
    if (slide.id === 'slide-academic' || index === 1) return studentScienceLab;
    if (slide.id === 'slide-activities' || index === 2) return studentGraduationActivity;
    return heroImage;
  };

  const currentImage = resolveSlideImage(currentSlide, safeActiveSlide);

  const currentTracks = [
    {
      name:
        currentSlide.track1Name ||
        (safeActiveSlide === 0
          ? settings.stat_students_label || 'นักเรียนปัจจุบัน'
          : safeActiveSlide === 1
          ? settings.stat_years_label || 'ปีแห่งความเป็นเลิศ'
          : settings.about_stat_4_label || 'ศิษย์เก่าโรงเรียน'),
      range:
        currentSlide.track1Range ||
        (safeActiveSlide === 0
          ? `${settings.stat_students || settings.about_stat_2} คน · ${settings.about_stat_3 || ''} ${settings.about_stat_3_label || 'บุคลากรคุณภาพ'}`.trim()
          : safeActiveSlide === 1
          ? `ก่อตั้งและพัฒนาการศึกษาต่อเนื่อง ${settings.stat_years || settings.about_stat_1} ปี`
          : `${settings.about_stat_4 || '1000+'} เครือข่ายศิษย์เก่าและชุมชนเข้มแข็ง`),
    },
    {
      name:
        currentSlide.track2Name ||
        (safeActiveSlide === 0
          ? settings.curriculum_duration_label || 'ระยะเวลาหลักสูตร'
          : safeActiveSlide === 1
          ? settings.stat_university_label || 'อัตราการศึกษาต่อ'
          : 'การมีส่วนร่วมของผู้เรียน'),
      range:
        currentSlide.track2Range ||
        (safeActiveSlide === 0
          ? `${settings.curriculum_duration || '9 ปี'} · เวลาเรียน ${settings.curriculum_study_time || '08.30-16.30'} น.`
          : safeActiveSlide === 1
          ? `${settings.stat_university || '90 %'} ศึกษาต่อและพัฒนาศักยภาพตามเกณฑ์`
          : 'กิจกรรมสภานักเรียน ชมรม และพัฒนาผู้เรียนรอบด้าน'),
    },
  ];

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev >= slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="home" className="pt-6 pb-10 bg-white dark:bg-slate-950">
      <div className="container-school">
        {/* Framed Editorial Hero Showcase with Auto-play & Hover Pause */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-900 group"
        >
          {/* Background Image with Measured Contrast Scrim */}
          <div className="relative min-h-[540px] lg:min-h-[600px] flex flex-col justify-between">
            <img
              src={currentImage}
              alt={currentSlide.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== heroImage) {
                  e.currentTarget.src = heroImage;
                }
              }}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/25" />

            {/* Top Utility & Slide Status Row */}
            <div className="relative z-10 px-6 sm:px-10 lg:px-14 pt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs sm:text-sm font-medium tracking-wide text-amber-300">
                {currentSlide.kicker || `${settings.school_tagline} · ${settings.school_name}`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="สไลด์ก่อนหน้า"
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono tabular-nums text-white/80 px-2">
                  0{safeActiveSlide + 1} / 0{slides.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="สไลด์ถัดไป"
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Hero Content Grid */}
            <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-10 grid lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7 max-w-2xl">
                {currentSlide.subline && (
                  <p className="text-sm sm:text-base italic text-sky-300 mb-2">
                    {currentSlide.subline}
                  </p>
                )}
                <h1
                  className="text-3xl sm:text-5xl lg:text-[3.15rem] font-bold text-white leading-[1.35] mb-5"
                  style={{ textWrap: 'balance' }}
                >
                  {currentSlide.title}
                </h1>
                <p className="text-base sm:text-lg text-slate-200/95 leading-relaxed mb-8 max-w-xl">
                  {currentSlide.subtitle}
                </p>

                {/* Primary CTA + Secondary Action */}
                <div className="flex flex-wrap items-center gap-4">
                  {currentSlide.primaryLabel && currentSlide.primaryHref && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          currentSlide.primaryHref.startsWith('http://') ||
                          currentSlide.primaryHref.startsWith('https://')
                        ) {
                          window.location.href = currentSlide.primaryHref;
                        } else {
                          navigate(currentSlide.primaryHref);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm sm:text-base shadow-md transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{currentSlide.primaryLabel}</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {currentSlide.secondaryLabel && currentSlide.secondaryHref && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          currentSlide.secondaryHref.startsWith('http://') ||
                          currentSlide.secondaryHref.startsWith('https://')
                        ) {
                          window.location.href = currentSlide.secondaryHref;
                        } else {
                          navigate(currentSlide.secondaryHref);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/12 hover:bg-white/20 text-white border border-white/25 font-semibold text-sm sm:text-base backdrop-blur-sm transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="w-4 h-4 text-amber-300" />
                      <span>{currentSlide.secondaryLabel}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Live Data Highlight Cards */}
              <div className="lg:col-span-5 flex flex-col gap-3.5">
                {currentTracks.map((track, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/15 p-5 text-white"
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                        idx === 0 ? 'text-amber-400' : 'text-sky-400'
                      }`}
                    >
                      {track.name}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white/95">
                      {track.range}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Operational Utility Ribbon */}
            <div className="relative z-10 bg-slate-950/85 backdrop-blur-md border-t border-white/15 px-6 sm:px-10 lg:px-14 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs sm:text-sm text-slate-200">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {settings.contact_address && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{settings.contact_address}</span>
                  </span>
                )}
                {settings.contact_phone && (
                  <span className="inline-flex items-center gap-2 font-mono tabular-nums">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{settings.contact_phone}</span>
                  </span>
                )}
              </div>

              {/* Slide Dots */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`ไปยังสไลด์ที่ ${idx + 1}`}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      safeActiveSlide === idx
                        ? 'w-8 bg-sky-400'
                        : 'w-2.5 bg-white/35 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Hero Operational Quick Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">เวลาทำการ:</span>
            <span>{settings.contact_hours || 'จันทร์ - ศุกร์ 07:30 - 16:30 น.'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-medium">
            <Link to="/calendar" className="hover:text-sky-600 transition-colors whitespace-nowrap">
              ปฏิทินกิจกรรม
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/newsletters" className="hover:text-sky-600 transition-colors whitespace-nowrap">
              จดหมายข่าว
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/student-council" className="hover:text-sky-600 transition-colors whitespace-nowrap">
              สภานักเรียน
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/staff" className="hover:text-sky-600 transition-colors whitespace-nowrap">
              ทำเนียบบุคลากร
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/students" className="hover:text-sky-600 transition-colors whitespace-nowrap">
              ข้อมูลนักเรียน
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/gallery" className="hover:text-sky-600 transition-colors whitespace-nowrap">
              แกลเลอรีรูปภาพ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
