import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Megaphone, ChevronRight, ExternalLink, Calendar } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { isPopupActiveNow, type WelcomePopupConfig } from '@/utils/homepageLayoutUtils';
import heroImage from '@/assets/hero-school.jpg';

const SESSION_DISMISSED_KEY = 'kk_welcome_popup_dismissed_session';
const DAY_DISMISSED_KEY = 'kk_welcome_popup_dismissed_day';

interface WelcomePopupModalProps {
  overrideConfig?: WelcomePopupConfig;
  forceOpen?: boolean;
  onCloseOverride?: () => void;
}

const WelcomePopupModal = ({
  overrideConfig,
  forceOpen = false,
  onCloseOverride,
}: WelcomePopupModalProps) => {
  const { settings, loading } = useSchoolSettings();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hideForToday, setHideForToday] = useState(false);

  const config = overrideConfig || settings.welcomePopup;

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (loading && !overrideConfig) return;

    if (!isPopupActiveNow(config)) {
      setIsOpen(false);
      return;
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const dismissedDay = localStorage.getItem(DAY_DISMISSED_KEY);
      if (dismissedDay === todayStr && config.frequency === 'once_per_day') {
        setIsOpen(false);
        return;
      }

      if (config.frequency === 'once_per_session') {
        const dismissedSession = sessionStorage.getItem(SESSION_DISMISSED_KEY);
        if (dismissedSession === 'true') {
          setIsOpen(false);
          return;
        }
      }
    } catch {
      // ignore storage errors
    }

    setIsOpen(true);
  }, [config, forceOpen, loading, overrideConfig]);

  if (!isOpen) return null;

  const handleClose = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (hideForToday || config.frequency === 'once_per_day') {
        localStorage.setItem(DAY_DISMISSED_KEY, todayStr);
      }
      if (config.frequency === 'once_per_session') {
        sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
      }
    } catch {
      // ignore storage errors
    }

    setIsOpen(false);
    if (onCloseOverride) {
      onCloseOverride();
    }
  };

  const handleNavigate = (targetUrl: string) => {
    if (!targetUrl) return;
    handleClose();
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.location.href = targetUrl;
    } else {
      navigate(targetUrl);
    }
  };

  const accentClasses: Record<
    WelcomePopupConfig['themeAccent'],
    {
      headerBg: string;
      badgeText: string;
      primaryBtn: string;
    }
  > = {
    sky: {
      headerBg: 'from-slate-900 via-sky-950 to-slate-900',
      badgeText: 'text-sky-300',
      primaryBtn: 'bg-sky-500 hover:bg-sky-600 text-white',
    },
    rose: {
      headerBg: 'from-slate-900 via-rose-950 to-slate-900',
      badgeText: 'text-rose-300',
      primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    amber: {
      headerBg: 'from-slate-900 via-amber-950 to-slate-900',
      badgeText: 'text-amber-300',
      primaryBtn: 'bg-amber-500 hover:bg-amber-600 text-slate-950',
    },
    navy: {
      headerBg: 'from-slate-950 via-blue-950 to-slate-900',
      badgeText: 'text-sky-300',
      primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const currentAccent = accentClasses[config.themeAccent] || accentClasses.sky;
  const displayImage = config.imageUrl || heroImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="ปิดหน้าต่างประกาศ"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition-colors shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Layout 1: IMAGE ONLY */}
        {config.layout === 'image_only' ? (
          <div className="flex flex-col overflow-y-auto">
            <div
              onClick={() => config.ctaUrl && handleNavigate(config.ctaUrl)}
              className={`relative bg-slate-950 ${config.ctaUrl ? 'cursor-pointer group' : ''}`}
            >
              <img
                src={displayImage}
                alt={config.title || 'ประกาศสำคัญจากโรงเรียน'}
                referrerPolicy="no-referrer"
                className="w-full max-h-[70vh] object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              {config.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-6 text-white">
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${currentAccent.badgeText}`}>
                    {config.badge}
                  </p>
                  <h2 id="welcome-popup-title" className="text-xl sm:text-2xl font-bold leading-snug">
                    {config.title}
                  </h2>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideForToday}
                  onChange={(e) => setHideForToday(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>ไม่ต้องแสดงอีกในวันนี้</span>
              </label>
              <div className="flex items-center gap-2.5">
                {config.ctaText && config.ctaUrl && (
                  <button
                    type="button"
                    onClick={() => handleNavigate(config.ctaUrl)}
                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors ${currentAccent.primaryBtn}`}
                  >
                    <span>{config.ctaText}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                >
                  เข้าสู่เว็บไซต์
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Layout 2 & 3: IMAGE AND TEXT or TEXT ONLY */
          <div className="flex flex-col overflow-y-auto">
            {config.layout === 'image_and_text' && (
              <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden shrink-0">
                <img
                  src={displayImage}
                  alt={config.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
                <div className="absolute bottom-4 left-6 right-14 flex items-center gap-3">
                  {settings.school_logo_url && (
                    <img
                      src={settings.school_logo_url}
                      alt={settings.school_name}
                      className="w-11 h-11 rounded-full object-contain bg-white/95 p-0.5 shadow-md shrink-0"
                    />
                  )}
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-300 mb-0.5">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>{config.badge}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-sky-200 font-medium">
                      {settings.school_name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {config.layout === 'text_only' && (
              <div className={`px-6 sm:px-8 py-6 bg-gradient-to-r ${currentAccent.headerBg} text-white shrink-0 flex items-center gap-3.5`}>
                {settings.school_logo_url && (
                  <img
                    src={settings.school_logo_url}
                    alt={settings.school_name}
                    className="w-12 h-12 rounded-full object-contain bg-white p-0.5 shadow-md shrink-0"
                  />
                )}
                <div>
                  <div className={`inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase ${currentAccent.badgeText} mb-1`}>
                    <Megaphone className="w-4 h-4" />
                    <span>{config.badge}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">{settings.school_name}</p>
                </div>
              </div>
            )}

            {/* Main Popup Body */}
            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <h2
                  id="welcome-popup-title"
                  className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-[1.38] mb-2"
                >
                  {config.title}
                </h2>
                {config.subtitle && (
                  <p className="text-sm sm:text-base font-semibold text-sky-600 dark:text-sky-400">
                    {config.subtitle}
                  </p>
                )}
              </div>

              {config.description && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {config.description}
                </p>
              )}

              {(config.startDate || config.endDate) && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  <span>
                    ช่วงเวลาประกาศ: {config.startDate || 'วันนี้'} ถึง {config.endDate || 'จนกว่าจะมีการเปลี่ยนแปลง'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                {config.ctaText && config.ctaUrl && (
                  <button
                    type="button"
                    onClick={() => handleNavigate(config.ctaUrl)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors ${currentAccent.primaryBtn}`}
                  >
                    <span>{config.ctaText}</span>
                    {config.ctaUrl.startsWith('http') ? (
                      <ExternalLink className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}

                {config.secondaryText && config.secondaryUrl && (
                  <button
                    type="button"
                    onClick={() => handleNavigate(config.secondaryUrl)}
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
                  >
                    <span>{config.secondaryText}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="px-6 sm:px-8 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideForToday}
                  onChange={(e) => setHideForToday(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>ไม่ต้องแสดงหน้าต่างนี้อีกในวันนี้</span>
              </label>

              <button
                type="button"
                onClick={handleClose}
                className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                ปิดหน้าต่างเข้าสู่เว็บไซต์ →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomePopupModal;
