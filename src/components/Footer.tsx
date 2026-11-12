import { ChevronUp, Facebook, Youtube, Instagram, Mail, Phone, MapPin, MessageCircle, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Link } from 'react-router-dom';

const quickLinks = [
  { name: 'หน้าแรก', href: '/' },
  { name: 'เกี่ยวกับเรา', href: '/about' },
  { name: 'หลักสูตร', href: '/curriculum' },
  { name: 'ข่าวสาร', href: '/news' },
  { name: 'ติดต่อเรา', href: '/contact' },
];

const Footer = () => {
  const { settings } = useSchoolSettings();

  const resources = [
    { name: settings.footer_service_1_name, href: settings.footer_service_1_url },
    { name: settings.footer_service_2_name, href: settings.footer_service_2_url },
    { name: settings.footer_service_3_name, href: settings.footer_service_3_url },
    { name: settings.footer_service_4_name, href: settings.footer_service_4_url },
  ].filter(link => link.name && link.href);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container-school py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* School Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              {settings.school_logo_url ? (
                <img
                  src={settings.school_logo_url}
                  alt={settings.school_name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-contain bg-white p-0.5 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-accent-foreground font-bold text-xl">{settings.school_short_name || 'บหค'}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold">{settings.school_name}</h3>
                <p className="text-sm text-primary-foreground/70">{settings.school_tagline}</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              {settings.school_description}
            </p>
            <div className="flex gap-3 flex-wrap">
              {settings.social_links && settings.social_links.length > 0 ? (
                settings.social_links.map((link, index) => {
                  const getSocialIcon = (platform: string) => {
                    switch (platform) {
                      case 'facebook': return Facebook;
                      case 'youtube': return Youtube;
                      case 'instagram': return Instagram;
                      case 'line': return MessageCircle;
                      default: return LinkIcon;
                    }
                  };
                  const Icon = getSocialIcon(link.platform);

                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                      aria-label={link.platform}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })
              ) : null}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">ลิงก์ด่วน</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    onClick={() => window.scrollTo(0, 0)}
                    className="text-primary-foreground/80 hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-bold mb-6">บริการออนไลน์</h4>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('/') ? (
                    <Link
                      to={link.href}
                      onClick={() => window.scrollTo(0, 0)}
                      className="text-primary-foreground/80 hover:text-accent transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-primary-foreground/80 hover:text-accent transition-colors"
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6">ติดต่อเรา</h4>
            <ul className="space-y-4">
              {settings.contact_address && (
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/80">
                    {settings.contact_address}
                  </span>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex gap-3">
                  <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-primary-foreground/80">{settings.contact_phone}</span>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex gap-3">
                  <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-primary-foreground/80">{settings.contact_email}</span>
                </li>
              )}
            </ul>

            {/* LINE Contact Channels */}
            <div className="mt-5 pt-4 border-t border-primary-foreground/15 space-y-2">
              <p className="text-xs font-semibold text-accent flex items-center gap-1.5 uppercase tracking-wider">
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                ช่องทางติดต่อทาง LINE
              </p>

              {/* School Official LINE */}
              <a
                href={settings.quick_chat_school_line || settings.social_line || 'https://line.me/ti/p/~hadkedschool'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[#06C755]/20 hover:bg-[#06C755]/30 border border-[#06C755]/40 text-primary-foreground transition-all duration-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-tight group-hover:text-accent transition-colors truncate">
                    LINE กลุ่มโรงเรียน
                  </p>
                  <p className="text-[10px] text-primary-foreground/70 truncate">
                    ข่าวสารและสอบถามข้อมูล
                  </p>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/60 group-hover:text-primary-foreground shrink-0" />
              </a>

              {/* Director LINE */}
              <a
                href={settings.quick_chat_director_line || 'https://line.me/ti/p/~director.hadked'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-primary-foreground transition-all duration-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-tight group-hover:text-accent transition-colors truncate">
                    LINE ผู้อำนวยการ
                  </p>
                  <p className="text-[10px] text-primary-foreground/70 truncate">
                    สายตรงฝ่ายบริหารสถานศึกษา
                  </p>
                </div>
                <ExternalLink className="w-3 h-3 text-primary-foreground/60 group-hover:text-primary-foreground shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container-school py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60 text-center md:text-left">
            © {new Date().getFullYear()} {settings.school_name}. สงวนลิขสิทธิ์.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-accent transition-colors"
          >
            กลับด้านบน
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
