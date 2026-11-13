import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import {
  CURRICULUM_ACTIVITIES_CACHE_KEY,
  CURRICULUM_LEVELS_CACHE_KEY,
  CURRICULUM_PROGRAMS_CACHE_KEY,
  DEFAULT_CURRICULUM_LEVELS,
  filterValidSchoolGrades,
  normalizeCurriculumActivity,
  normalizeCurriculumLevel,
  normalizeCurriculumProgram,
  parseCurriculumJsonSetting,
  type CurriculumActivityItem,
  type CurriculumLevelItem,
  type CurriculumProgramItem,
  type GradeDataRow,
} from './curriculumHelpers';

export * from './curriculumHelpers';

export interface LoadedCurriculumBundle {
  levels: CurriculumLevelItem[];
  programs: CurriculumProgramItem[];
  activities: CurriculumActivityItem[];
  grades: GradeDataRow[];
  levelsTableExists: boolean;
}

/**
 * Fetches synchronized curriculum data from Supabase tables with Dual-Cloud JSON fallbacks
 * from `school_settings` so Homepage, `/curriculum`, and Admin always agree 100%.
 */
export const fetchSyncedCurriculumBundle = async (options?: {
  activeOnly?: boolean;
}): Promise<LoadedCurriculumBundle> => {
  const activeOnly = options?.activeOnly ?? true;

  const levelsQuery = (supabase as any)
    .from('curriculum_levels')
    .select('*')
    .order('order_position', { ascending: true });

  const programsQuery = supabase
    .from('curriculum_programs')
    .select('*')
    .order('order_position', { ascending: true });

  const activitiesQuery = supabase
    .from('curriculum_activities')
    .select('*')
    .order('order_position', { ascending: true });

  const gradesQuery = supabase
    .from('grade_data')
    .select('*')
    .order('order_position', { ascending: true });

  const settingsQuery = (supabase as any)
    .from('school_settings')
    .select('key, value')
    .in('key', [
      'curriculum_levels_json',
      'curriculum_programs_json',
      'curriculum_activities_json',
      'grade_data_json',
    ]);

  const [levelsRes, programsRes, activitiesRes, gradesRes, settingsRes] = await Promise.all([
    levelsQuery,
    programsQuery,
    activitiesQuery,
    gradesQuery,
    settingsQuery,
  ]);

  const settingsMap: Record<string, string> = {};
  if (!settingsRes.error && Array.isArray(settingsRes.data)) {
    settingsRes.data.forEach((row: any) => {
      if (row?.key) settingsMap[row.key] = row.value || '';
    });
  }

  // 1. Grades (Direct DB + Dual-Cloud fallback)
  let rawGrades: GradeDataRow[] =
    !gradesRes.error && Array.isArray(gradesRes.data) ? (gradesRes.data as GradeDataRow[]) : [];
  if (rawGrades.length === 0 && settingsMap.grade_data_json) {
    rawGrades = parseCurriculumJsonSetting<GradeDataRow>(settingsMap.grade_data_json);
  }
  const validGrades = filterValidSchoolGrades(rawGrades).filter((g) =>
    activeOnly ? g.is_active !== false : true
  );

  // 2. Curriculum Levels (Direct Table -> Dual-Cloud school_settings -> Local Live Cache -> Hadket Defaults)
  const levelsTableExists = !levelsRes.error;
  const tableLevels =
    !levelsRes.error && Array.isArray(levelsRes.data) ? levelsRes.data : [];
  const cloudJsonLevels = parseCurriculumJsonSetting<any>(settingsMap.curriculum_levels_json);

  let localCachedLevels: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const localRaw = window.localStorage.getItem(CURRICULUM_LEVELS_CACHE_KEY);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed)) localCachedLevels = parsed;
      }
    } catch {
      // ignore localStorage read failure
    }
  }

  let resolvedLevels: CurriculumLevelItem[] = [];
  if (tableLevels.length > 0) {
    // Merge framing/media overrides if DB table hasn't added extended columns yet
    const cloudById = new Map(cloudJsonLevels.map((item: any) => [item?.id, item]));
    resolvedLevels = tableLevels.map((row: any, idx: number) => {
      const cloudOverlay = cloudById.get(row.id) || {};
      return normalizeCurriculumLevel({ ...cloudOverlay, ...row }, idx);
    });
  } else if (cloudJsonLevels.length > 0) {
    resolvedLevels = cloudJsonLevels.map((row: any, idx: number) => normalizeCurriculumLevel(row, idx));
  } else if (localCachedLevels.length > 0) {
    resolvedLevels = localCachedLevels.map((row: any, idx: number) => normalizeCurriculumLevel(row, idx));
  } else {
    resolvedLevels = DEFAULT_CURRICULUM_LEVELS.map((lvl, idx) => normalizeCurriculumLevel(lvl, idx));
  }

  resolvedLevels.sort((a, b) => a.order_position - b.order_position);
  if (activeOnly) {
    resolvedLevels = resolvedLevels.filter((lvl) => lvl.is_active);
  }

  // 3. Curriculum Programs (merge optional Full Control columns from Dual-Cloud backup)
  const tablePrograms =
    !programsRes.error && Array.isArray(programsRes.data) ? programsRes.data : [];
  const cloudJsonPrograms = parseCurriculumJsonSetting<any>(settingsMap.curriculum_programs_json);
  const cloudProgramById = new Map(cloudJsonPrograms.map((item: any) => [item?.id, item]));

  let resolvedPrograms: CurriculumProgramItem[] = [];
  if (tablePrograms.length > 0) {
    resolvedPrograms = tablePrograms.map((row: any, idx: number) => {
      const overlay = cloudProgramById.get(row.id) || {};
      return normalizeCurriculumProgram(
        {
          ...overlay,
          ...row,
          image_url: row.image_url ?? overlay.image_url ?? null,
          image_position: row.image_position || overlay.image_position || 'center center',
          image_scale:
            row.image_scale !== undefined && row.image_scale !== null
              ? Number(row.image_scale)
              : overlay.image_scale ?? 1,
          target_level: row.target_level || overlay.target_level || 'all',
        },
        idx
      );
    });
  } else if (cloudJsonPrograms.length > 0) {
    resolvedPrograms = cloudJsonPrograms.map((row: any, idx: number) =>
      normalizeCurriculumProgram(row, idx)
    );
  }

  resolvedPrograms.sort((a, b) => a.order_position - b.order_position);
  if (activeOnly) {
    resolvedPrograms = resolvedPrograms.filter((p) => p.is_active);
  }

  // 4. Curriculum Activities (merge optional Full Control framing columns from Dual-Cloud backup)
  const tableActivities =
    !activitiesRes.error && Array.isArray(activitiesRes.data) ? activitiesRes.data : [];
  const cloudJsonActivities = parseCurriculumJsonSetting<any>(
    settingsMap.curriculum_activities_json
  );
  const cloudActivityById = new Map(cloudJsonActivities.map((item: any) => [item?.id, item]));

  let resolvedActivities: CurriculumActivityItem[] = [];
  if (tableActivities.length > 0) {
    resolvedActivities = tableActivities.map((row: any, idx: number) => {
      const overlay = cloudActivityById.get(row.id) || {};
      return normalizeCurriculumActivity(
        {
          ...overlay,
          ...row,
          image_url: row.image_url ?? overlay.image_url ?? null,
          image_position: row.image_position || overlay.image_position || 'center center',
          image_scale:
            row.image_scale !== undefined && row.image_scale !== null
              ? Number(row.image_scale)
              : overlay.image_scale ?? 1,
        },
        idx
      );
    });
  } else if (cloudJsonActivities.length > 0) {
    resolvedActivities = cloudJsonActivities.map((row: any, idx: number) =>
      normalizeCurriculumActivity(row, idx)
    );
  }

  resolvedActivities.sort((a, b) => a.order_position - b.order_position);
  if (activeOnly) {
    resolvedActivities = resolvedActivities.filter((a) => a.is_active);
  }

  return {
    levels: resolvedLevels,
    programs: resolvedPrograms,
    activities: resolvedActivities,
    grades: validGrades,
    levelsTableExists,
  };
};

/**
 * Dual-cloud backup helper to store curriculum JSON into `school_settings` safely.
 */
export const saveCurriculumJsonToSchoolSettings = async (
  key: 'curriculum_levels_json' | 'curriculum_programs_json' | 'curriculum_activities_json',
  items: any[]
): Promise<boolean> => {
  try {
    const jsonPayload = JSON.stringify(items);

    if (typeof window !== 'undefined') {
      const cacheMap = {
        curriculum_levels_json: CURRICULUM_LEVELS_CACHE_KEY,
        curriculum_programs_json: CURRICULUM_PROGRAMS_CACHE_KEY,
        curriculum_activities_json: CURRICULUM_ACTIVITIES_CACHE_KEY,
      } as const;
      try {
        window.localStorage.setItem(cacheMap[key], jsonPayload);
      } catch {
        // ignore storage quota errors
      }
    }

    const { error } = await (supabase as any)
      .from('school_settings')
      .upsert(
        {
          key,
          value: jsonPayload,
          category: 'curriculum',
        },
        { onConflict: 'key' }
      );

    if (error) {
      await (supabase as any)
        .from('school_settings')
        .update({ value: jsonPayload, category: 'curriculum' })
        .eq('key', key);
    }

    notifyLocalRealtimeListeners('school_settings');
    return true;
  } catch (err) {
    console.warn('Could not save Dual-Cloud curriculum backup:', err);
    return false;
  }
};
