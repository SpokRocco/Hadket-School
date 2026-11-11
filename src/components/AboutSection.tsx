import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-school.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';

const AboutSection = () => {
  const { settings } = useSchoolSettings();

  const welcomeCounters = [
    {
      value: settings.about_stat_1 || settings.stat_years,
      label: settings.about_stat_1_label || 'ปีแห่งประสบการณ์',
    },
    {
      value: settings.about_stat_2 || settings.stat_students,
      label: settings.about_stat_2_label || 'นักเรียนปัจจุบัน',
    },
    {
      value: settings.about_stat_3,
      label: settings.about_stat_3_label || 'บุคลากรคุณภาพ',
    },
  ];

  const pillars = [
    {
      index: '01',
      title: 'วิสัยทัศน์ (Vision)',
      description: settings.school_vision,
    },
    {
      index: '02',
      title: 'พันธกิจ (Mission)',
      description: settings.school_mission,
    },
    {
      index: '03',
      title: 'ค่านิยมองค์กร (Core Values)',
      description: settings.school_values,
    },
    {
      index: '04',
      title: 'ศิษย์เก่าและภาคีเครือข่าย',
      description: `${settings.about_stat_4} ${settings.about_stat_4_label} · คำขวัญประจำโรงเรียน: ${settings.school_tagline}`,
    },
  ];

  return (
    <section id="about" className="section-padding bg-white dark:bg-slate-950">
      <div className="container-school">
        {/* 3-Column Welcome & Counter Showcase */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center mb-20">
          {/* Left Real Campus Aerial Photo */}
          <div className="lg:col-span-4">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100">
              <img
                src={heroImage}
                alt={`บรรยากาศโรงเรียน ${settings.school_name}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Center Welcome Statement & 3 Sky-Blue Tabular Counters */}
          <div className="lg:col-span-4 text-center px-2 sm:px-4">
            <p className="text-base sm:text-lg italic font-medium text-rose-600 dark:text-rose-400 mb-2">
              ยินดีต้อนรับสู่
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-[1.38] mb-5">
              {settings.school_name}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 text-base">
              {settings.school_description || settings.school_vision}
            </p>

            {/* 3-Column Sky-Blue Tabular Counter Row from Supabase */}
            <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800 py-6 mb-8 border-y border-slate-200/80 dark:border-slate-800">
              {welcomeCounters.map((counter, idx) => (
                <div key={idx} className="text-center px-2">
                  <div className="text-2xl sm:text-3xl font-extrabold text-sky-500 font-mono tabular-nums tracking-tight mb-1 whitespace-nowrap">
                    {counter.value}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    {counter.label}
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/about"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-sm transition-colors whitespace-nowrap"
            >
              เกี่ยวกับเรา
            </Link>
          </div>

          {/* Right Student Excellence & Activities Photo */}
          <div className="lg:col-span-4">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100">
              <img
                src={studentGraduationActivity}
                alt={`กิจกรรมนักเรียน ${settings.school_name}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* Clean 4-Column Editorial Institutional Pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-200/80 dark:border-slate-800">
          {pillars.map((pillar) => (
            <div
              key={pillar.index}
              className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 transition-colors"
            >
              <span className="block text-xs font-mono font-bold text-sky-600 dark:text-sky-400 mb-2">
                {pillar.index}. แนวทางการพัฒนา
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2.5">
                {pillar.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
