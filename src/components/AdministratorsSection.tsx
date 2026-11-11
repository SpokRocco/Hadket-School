import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';

interface Administrator {
  id: string;
  name: string;
  position: string;
  education: string;
  quote: string;
  photo_url: string;
  order_position: number;
}

const AdministratorsSection = () => {
  const { settings } = useSchoolSettings();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdministrators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Error fetching administrators:', error);
      setAdministrators([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdministrators();
    return subscribeToRealtimeTables(
      'realtime_home_administrators',
      ['administrators'],
      fetchAdministrators
    );
  }, [fetchAdministrators]);

  if (isLoading) return null;

  const primaryDirector = administrators[0];
  if (!primaryDirector) return null;

  return (
    <section id="administrators" className="py-16 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800">
      <div className="container-school">
        <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800">
          <div className="grid md:grid-cols-12 items-stretch">
            {/* Director Portrait Column */}
            <div className="md:col-span-4 bg-slate-900 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-sky-400 shadow-lg">
                {primaryDirector.photo_url ? (
                  <img
                    src={primaryDirector.photo_url}
                    alt={primaryDirector.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-4xl font-bold text-amber-400">
                      {primaryDirector.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs font-medium text-sky-300">
                {settings.school_name}
              </p>
            </div>

            {/* Director Information & Editorial Pull Quote */}
            <div className="md:col-span-8 p-8 sm:p-10 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
                EXECUTIVE MESSAGE · {primaryDirector.position}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {primaryDirector.name}
              </h2>
              {primaryDirector.education && (
                <p className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
                  <GraduationCap className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{primaryDirector.education}</span>
                </p>
              )}

              {primaryDirector.quote && (
                <blockquote className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-slate-700 dark:text-slate-200 italic text-base sm:text-lg leading-relaxed">
                    “{primaryDirector.quote}”
                  </p>
                  <footer className="text-xs font-semibold text-slate-500 mt-2">
                    — {primaryDirector.position} {settings.school_name}
                  </footer>
                </blockquote>
              )}

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                  to="/staff"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700"
                >
                  <span>ดูทำเนียบผู้บริหารและบุคลากรทั้งหมด</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdministratorsSection;
