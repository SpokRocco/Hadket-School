import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const primaryNavLinks = [
  { name: 'หน้าหลัก', href: '/' },
  { name: 'เกี่ยวกับเรา', href: '/about' },
  { name: 'หลักสูตร', href: '/curriculum' },
  { name: 'ข่าวสาร', href: '/news' },
  { name: 'คลังสื่อ', href: '/media-library' },
  { name: 'ติดต่อเรา', href: '/contact' },
];

const moreSchoolLinks = [
  { name: 'ผู้บริหารสถานศึกษา', href: '/administrators' },
  { name: 'ทำเนียบบุคลากร', href: '/staff' },
  { name: 'ข้อมูลนักเรียน', href: '/students' },
  { name: 'สภานักเรียน (Sapha Plus)', href: '/student-council' },
  { name: 'จดหมายข่าวโรงเรียน', href: '/newsletters' },
  { name: 'แกลเลอรี่กิจกรรม', href: '/gallery' },
  { name: 'ปฏิทินกิจกรรม', href: '/calendar' },
];

const mobileAllLinks = [
  { name: 'หน้าหลัก', href: '/' },
  { name: 'เกี่ยวกับเรา', href: '/about' },
  { name: 'หลักสูตร', href: '/curriculum' },
  { name: 'ข่าวประชาสัมพันธ์', href: '/news' },
  { name: 'จดหมายข่าว', href: '/newsletters' },
  { name: 'คลังสื่อการสอน', href: '/media-library' },
  { name: 'สภานักเรียน', href: '/student-council' },
  { name: 'บุคลากร', href: '/staff' },
  { name: 'ข้อมูลนักเรียน', href: '/students' },
  { name: 'แกลเลอรี่', href: '/gallery' },
  { name: 'ปฏิทินกิจกรรม', href: '/calendar' },
  { name: 'ติดต่อเรา', href: '/contact' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { settings } = useSchoolSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isMoreActive = moreSchoolLinks.some((item) => location.pathname.startsWith(item.href));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800'
          : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/70 dark:border-slate-800'
      }`}
    >
      <div className="container-school">
        <div className="flex items-center justify-between gap-4 h-20">
          {/* Zone 1: School Logo + Name + Tagline */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            {settings.school_logo_url ? (
              <img
                src={settings.school_logo_url}
                alt={settings.school_name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-contain bg-white border border-slate-200/80 p-0.5 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-sm shrink-0">
                <span className="text-accent font-bold text-base">
                  {settings.school_short_name || 'บหค'}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <span className="block text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-sky-600 transition-colors whitespace-nowrap">
                {settings.school_name}
              </span>
              {settings.school_tagline && (
                <span className="hidden xl:block text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                  {settings.school_tagline}
                </span>
              )}
            </div>
          </Link>

          {/* Zone 2: Desktop Single-Line Navigation + School Info Dropdown */}
          <nav
            aria-label="เมนูหลัก"
            className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {primaryNavLinks.slice(0, 5).map((link) => {
              const isActive =
                link.href === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-sky-600 dark:text-sky-400 border-sky-600 font-semibold'
                      : 'border-transparent hover:text-sky-600 hover:border-sky-600/40'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger
                className={`inline-flex items-center gap-1 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 outline-none ${
                  isMoreActive
                    ? 'text-sky-600 dark:text-sky-400 border-sky-600 font-semibold'
                    : 'border-transparent hover:text-sky-600 hover:border-sky-600/40'
                }`}
              >
                <span>ข้อมูลโรงเรียน</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {moreSchoolLinks.map((subLink) => (
                  <DropdownMenuItem key={subLink.href} asChild>
                    <Link
                      to={subLink.href}
                      className={`w-full cursor-pointer ${
                        location.pathname.startsWith(subLink.href)
                          ? 'font-semibold text-sky-600'
                          : ''
                      }`}
                    >
                      {subLink.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/contact"
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                location.pathname.startsWith('/contact')
                  ? 'text-sky-600 dark:text-sky-400 border-sky-600 font-semibold'
                  : 'border-transparent hover:text-sky-600 hover:border-sky-600/40'
              }`}
            >
              ติดต่อเรา
            </Link>
          </nav>

          {/* Zone 3: Primary Action & Mobile Drawer Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/enrollment"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              สมัครเรียนออนไลน์
            </Link>

            <button
              type="button"
              aria-label={isOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden pb-5 pt-2 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mobileAllLinks.map((link) => {
                const isActive =
                  link.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap truncate transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                to="/enrollment"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap"
              >
                สมัครเรียนออนไลน์
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
