import { notifyLocalRealtimeListeners, supabase } from '@/integrations/supabase/client';
import { deleteMultipleStorageImages } from '@/utils/storageUtils';
import {
  DEFAULT_NEWSLETTER_ORG_SETTINGS,
  LOCAL_NEWSLETTER_META_CACHE_KEY,
  LOCAL_NEWSLETTER_ORG_CACHE_KEY,
  NEWSLETTER_EXTENDED_META_SETTINGS_KEY,
  NEWSLETTER_ORG_SETTINGS_KEY,
  normalizeNewsletterRecord,
  parseImageUrlsList,
  parseNewsletterOrgSettings,
  type NewsletterOrgSettings,
  type SchoolNewsletter,
} from './newsletterUtils';

type ExtendedMetaMap = Record<string, Partial<SchoolNewsletter>>;

const isMissingColumnError = (err: any): boolean => {
  const msg = String(err?.message || err?.details || err?.hint || '').toLowerCase();
  const code = String(err?.code || '');
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('does not exist') ||
    msg.includes('could not find')
  );
};

const readLocalMetaMap = (): ExtendedMetaMap => {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(LOCAL_NEWSLETTER_META_CACHE_KEY);
    return raw ? (JSON.parse(raw) as ExtendedMetaMap) : {};
  } catch {
    return {};
  }
};

const writeLocalMetaMap = (map: ExtendedMetaMap) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_NEWSLETTER_META_CACHE_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore storage quota errors
  }
};

const readLocalOrgSettings = (): NewsletterOrgSettings | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(LOCAL_NEWSLETTER_ORG_CACHE_KEY);
    return raw ? parseNewsletterOrgSettings(raw) : null;
  } catch {
    return null;
  }
};

const writeLocalOrgSettings = (org: NewsletterOrgSettings) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_NEWSLETTER_ORG_CACHE_KEY, JSON.stringify(org));
    }
  } catch {
    // Ignore
  }
};

const persistExtendedMetaOverlay = async (
  id: string,
  meta: Partial<SchoolNewsletter> | null
) => {
  const current = { ...readLocalMetaMap() };
  try {
    const { data } = await (supabase as any)
      .from('school_settings')
      .select('value')
      .eq('key', NEWSLETTER_EXTENDED_META_SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      Object.assign(current, JSON.parse(data.value));
    }
  } catch {
    // Ignore fetch error
  }

  if (meta === null) {
    delete current[id];
  } else {
    current[id] = meta;
  }

  writeLocalMetaMap(current);

  try {
    await (supabase as any).from('school_settings').upsert(
      {
        key: NEWSLETTER_EXTENDED_META_SETTINGS_KEY,
        value: JSON.stringify(current),
        category: 'newsletters',
      },
      { onConflict: 'key' }
    );
  } catch {
    // Local fallback already saved
  }
};

export interface LoadedNewsletterBundle {
  newsletters: SchoolNewsletter[];
  orgSettings: NewsletterOrgSettings;
  nativeSchemaReady: boolean;
}

/**
 * Fetches newsletters and organization settings from Supabase with seamless fallback
 * for both pre-migration and post-migration schemas.
 */
export const fetchNewslettersWithCompat = async (options?: {
  onlyPublished?: boolean;
}): Promise<LoadedNewsletterBundle> => {
  const onlyPublished = Boolean(options?.onlyPublished);

  const buildQuery = (withOrderPosition: boolean) => {
    let query = (supabase as any).from('newsletters').select('*');
    if (onlyPublished) {
      query = query.eq('is_published', true);
    }
    if (withOrderPosition) {
      query = query
        .order('order_position', { ascending: true })
        .order('issue_date', { ascending: false });
    } else {
      query = query.order('issue_date', { ascending: false });
    }
    return query;
  };

  let nlRes = await buildQuery(true);
  if (nlRes.error) {
    nlRes = await buildQuery(false);
  }
  if (nlRes.error) {
    throw nlRes.error;
  }

  let metaOverlay: ExtendedMetaMap = readLocalMetaMap();
  let orgSettings: NewsletterOrgSettings =
    readLocalOrgSettings() || { ...DEFAULT_NEWSLETTER_ORG_SETTINGS };

  try {
    const { data: settingsRows } = await (supabase as any)
      .from('school_settings')
      .select('key, value')
      .in('key', [NEWSLETTER_EXTENDED_META_SETTINGS_KEY, NEWSLETTER_ORG_SETTINGS_KEY]);

    if (Array.isArray(settingsRows)) {
      for (const row of settingsRows) {
        if (row.key === NEWSLETTER_EXTENDED_META_SETTINGS_KEY && row.value) {
          try {
            metaOverlay = { ...metaOverlay, ...JSON.parse(row.value) };
          } catch {
            // ignore
          }
        } else if (row.key === NEWSLETTER_ORG_SETTINGS_KEY && row.value) {
          orgSettings = parseNewsletterOrgSettings(row.value);
          writeLocalOrgSettings(orgSettings);
        }
      }
    }
  } catch {
    // Ignore optional settings lookup errors
  }

  const rows: any[] = Array.isArray(nlRes.data) ? nlRes.data : [];

  // Detect whether the upgraded columns exist on the DB table
  let nativeSchemaReady = rows.some(
    (r) =>
      Object.prototype.hasOwnProperty.call(r, 'image_urls') &&
      Object.prototype.hasOwnProperty.call(r, 'template_type') &&
      Object.prototype.hasOwnProperty.call(r, 'status')
  );

  if (!nativeSchemaReady && rows.length === 0) {
    try {
      const probe = await (supabase as any)
        .from('newsletters')
        .select('id, image_urls, template_type, status')
        .limit(1);
      nativeSchemaReady = !probe.error;
    } catch {
      nativeSchemaReady = false;
    }
  }

  const newsletters = rows.map((row) => normalizeNewsletterRecord(row, metaOverlay));
  return { newsletters, orgSettings, nativeSchemaReady };
};

export interface SaveNewsletterInput {
  issue_no: string;
  academic_year: string;
  issue_date: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string;
  image_urls: string[];
  template_type: SchoolNewsletter['template_type'];
  status: SchoolNewsletter['status'];
  revision_note?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  file_url: string | null;
  is_published: boolean;
  order_position?: number;
}

/**
 * Saves (inserts or updates) a newsletter record to Supabase.
 * Automatically falls back to base columns + school_settings extended metadata
 * if the SQL schema migration has not yet been executed on Supabase.
 */
export const saveNewsletterWithCompat = async (
  input: SaveNewsletterInput,
  editingId?: string
): Promise<{ savedId: string; usedFallbackMeta: boolean }> => {
  const cleanUrls = parseImageUrlsList(input.image_urls, null);
  const primaryUrl = cleanUrls[0] || null;

  const basePayload: Record<string, any> = {
    issue_no: input.issue_no.trim(),
    academic_year: input.academic_year.trim(),
    issue_date: input.issue_date,
    title: input.title.trim(),
    summary: input.summary?.trim() || null,
    content: input.content?.trim() || null,
    category: input.category,
    image_url: primaryUrl,
    file_url: input.file_url?.trim() || null,
    is_published: input.is_published,
  };

  if (typeof input.order_position === 'number') {
    basePayload.order_position = input.order_position;
  }

  const extendedFields: Record<string, any> = {
    image_urls: cleanUrls,
    template_type: input.template_type || 'template_1',
    status: input.status || (input.is_published ? 'approved' : 'draft'),
    revision_note: input.revision_note ?? null,
    approved_by: input.approved_by ?? null,
    approved_at: input.approved_at ?? null,
    created_by: input.created_by ?? null,
    created_by_name: input.created_by_name ?? null,
  };

  const fullPayload = { ...basePayload, ...extendedFields };
  let usedFallbackMeta = false;
  let savedId = editingId || '';

  if (editingId) {
    let { error } = await (supabase as any)
      .from('newsletters')
      .update(fullPayload)
      .eq('id', editingId);

    if (error && isMissingColumnError(error)) {
      usedFallbackMeta = true;
      const retry = await (supabase as any)
        .from('newsletters')
        .update(basePayload)
        .eq('id', editingId);
      error = retry.error;
    }

    if (error) throw error;
    savedId = editingId;
  } else {
    let { data, error } = await (supabase as any)
      .from('newsletters')
      .insert(fullPayload)
      .select('id')
      .single();

    if (error && isMissingColumnError(error)) {
      usedFallbackMeta = true;
      const retry = await (supabase as any)
        .from('newsletters')
        .insert(basePayload)
        .select('id')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    savedId = String(data?.id || '');
  }

  if (savedId) {
    if (usedFallbackMeta) {
      await persistExtendedMetaOverlay(savedId, extendedFields);
    } else {
      // Keep overlay synchronized so cached views never show stale data
      await persistExtendedMetaOverlay(savedId, extendedFields);
    }
  }

  notifyLocalRealtimeListeners('newsletters');
  notifyLocalRealtimeListeners('school_settings');

  return { savedId, usedFallbackMeta };
};

/**
 * Deletes a newsletter and cleans up all associated images in Supabase Storage.
 */
export const deleteNewsletterWithCompat = async (item: SchoolNewsletter): Promise<void> => {
  const allUrls = parseImageUrlsList(item.image_urls, item.image_url);
  if (allUrls.length > 0) {
    await deleteMultipleStorageImages(allUrls);
  }

  const { error } = await (supabase as any)
    .from('newsletters')
    .delete()
    .eq('id', item.id)
    .select();

  if (error) throw error;

  await persistExtendedMetaOverlay(item.id, null);
  notifyLocalRealtimeListeners('newsletters');
};

/**
 * Saves organization-level newsletter defaults (template, header/footer text, director title).
 */
export const saveNewsletterOrgSettings = async (
  orgSettings: NewsletterOrgSettings
): Promise<void> => {
  writeLocalOrgSettings(orgSettings);
  const { error } = await (supabase as any).from('school_settings').upsert(
    {
      key: NEWSLETTER_ORG_SETTINGS_KEY,
      value: JSON.stringify(orgSettings),
      category: 'newsletters',
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
  notifyLocalRealtimeListeners('school_settings');
  notifyLocalRealtimeListeners('newsletters');
};
