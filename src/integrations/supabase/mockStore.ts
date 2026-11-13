import {
  DEFAULT_LOGIN_PORTALS,
  SEED_ADMIN_USERS,
} from '@/utils/authUtils';
import { DEFAULT_CURRICULUM_LEVELS } from '@/utils/curriculumUtils';
import heroSchool1 from '@/assets/hero-school-1.jpg';
import heroSchool2 from '@/assets/hero-school.jpg';
// real school campus hero uses heroSchool2
import studentScienceLab from '@/assets/images/student_science_lab_1794379512287.jpg';
import studentGraduationActivity from '@/assets/images/student_graduation_activity_1794379513899.jpg';
// classroom fallback uses heroSchool1

const STORAGE_PREFIX = 'kk_school_clean_db_v3_';

const memoryStore = new Map<string, string>();

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fallback to memory
  }
  return memoryStore.get(key) ?? null;
};

const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // fallback to memory
  }
  memoryStore.set(key, value);
};

const nowIso = () => new Date().toISOString();
const futureDateStr = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SEED_DATA: Record<string, any[]> = {
  school_settings: [
    { id: 'set-1', key: 'school_name', value: 'โรงเรียนบ้านหาดเค็ด', category: 'general' },
    { id: 'set-2', key: 'school_short_name', value: 'บหค', category: 'general' },
    { id: 'set-3', key: 'school_tagline', value: 'ก้าวสู่อนาคตด้วยปัญญา', category: 'general' },
    { id: 'set-4', key: 'academic_year', value: '2569', category: 'general' },
    { id: 'set-5', key: 'quick_chat_enabled', value: 'true', category: 'chat' },
    { id: 'set-6', key: 'quick_chat_title', value: 'แชทด่วนสอบถามข้อมูล', category: 'chat' },
    { id: 'set-7', key: 'quick_chat_greeting', value: 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โรงเรียนบ้านหาดเค็ด มีข้อสงสัยหรือต้องการสอบถามข้อมูล สามารถแชทคุยกับเราได้เลยครับ', category: 'chat' },
    { id: 'set-8', key: 'quick_chat_school_line', value: 'https://line.me/ti/p/~hadkedschool', category: 'chat' },
    { id: 'set-9', key: 'quick_chat_director_line', value: 'https://line.me/ti/p/~director.hadked', category: 'chat' },
    { id: 'set-10', key: 'quick_chat_phone', value: '054-710-123', category: 'chat' },
  ],
  hero_slides: [
    {
      id: 'slide-admissions',
      image_url: heroSchool1,
      kicker: 'เปิดรับสมัครนักเรียนใหม่ · ปีการศึกษา 2569',
      subline: 'ร่วมมือ วิชาการ งานอาชีพ · โรงเรียนบ้านหาดเค็ด',
      title: 'ร่วมมือ วิชาการ งานอาชีพ ด้วยปัญญา',
      subtitle: 'มุ่งพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษา ส่งเสริมคุณธรรม น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง พร้อมก้าวทันเทคโนโลยี',
      primary_label: 'สมัครเรียนออนไลน์',
      primary_href: '/enrollment',
      secondary_label: 'เกี่ยวกับโรงเรียน',
      secondary_href: '/about',
      track1_name: 'นักเรียนปัจจุบัน',
      track1_range: '74 คน',
      track2_name: 'ระยะเวลาหลักสูตร',
      track2_range: '9 ปี',
      is_active: true,
      order_position: 1,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: 'slide-academic',
      image_url: studentScienceLab,
      kicker: 'พัฒนาศักยภาพผู้เรียนรอบด้าน',
      subline: 'ห้องปฏิบัติการวิทยาศาสตร์ และคอมพิวเตอร์ทันสมัย',
      title: 'มุ่งเน้นความเป็นเลิศทางวิชาการและเทคโนโลยี',
      subtitle: 'ส่งเสริมการเรียนรู้วิทยาศาสตร์ คณิตศาสตร์ ภาษาต่างประเทศ และนวัตกรรมดิจิทัลเพื่ออนาคต',
      primary_label: 'ดูหลักสูตรการศึกษา',
      primary_href: '/curriculum',
      secondary_label: 'ผลงานนักเรียน',
      secondary_href: '/news',
      track1_name: 'ปีแห่งความเป็นเลิศ',
      track1_range: 'พัฒนาต่อเนื่อง',
      track2_name: 'อัตราศึกษาต่อ',
      track2_range: '100 %',
      is_active: true,
      order_position: 2,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: 'slide-activities',
      image_url: studentGraduationActivity,
      kicker: 'กิจกรรมพัฒนาผู้เรียนรอบด้าน',
      subline: 'ดนตรี กีฬา ศิลปะ จิตอาสา',
      title: 'กิจกรรมส่งเสริมทักษะชีวิตและคุณธรรม',
      subtitle: 'ปลูกฝังวินัย คุณธรรม จริยธรรม และการทำงานร่วมกันผ่านกิจกรรมลูกเสือ กีฬา และศิลปวัฒนธรรม',
      primary_label: 'คลังภาพกิจกรรม',
      primary_href: '/gallery',
      secondary_label: 'ติดต่อโรงเรียน',
      secondary_href: '/contact',
      track1_name: 'ศิษย์เก่าโรงเรียน',
      track1_range: 'เครือข่ายเข้มแข็ง',
      track2_name: 'กิจกรรมสภานักเรียน',
      track2_range: 'พัฒนาผู้เรียนรอบด้าน',
      is_active: true,
      order_position: 3,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ],
  news_categories: [
    { id: 'cat-1', name: 'ข่าวประชาสัมพันธ์', description: 'ข่าวประชาสัมพันธ์และการตรวจประเมินคุณภาพการศึกษาภายในโรงเรียน', color: 'blue', created_at: nowIso() },
    { id: 'cat-2', name: 'กิจกรรมนักเรียน', description: 'กิจกรรมล่าสุดและโครงการพัฒนาศักยภาพผู้เรียนรอบด้าน', color: 'green', created_at: nowIso() },
    { id: 'cat-3', name: 'ผลงานนักเรียน', description: 'ทำเนียบคนเก่งและผลงานวิชาการระดับชาติของนักเรียน', color: 'purple', created_at: nowIso() },
    { id: 'cat-4', name: 'ความภาคภูมิใจ', description: 'รางวัลเกียรติยศและความภาคภูมิใจของสถาบัน', color: 'amber', created_at: nowIso() },
    { id: 'cat-5', name: 'ประกาศ', description: 'ประกาศสำคัญและการรับสมัครนักเรียนใหม่', color: 'red', created_at: nowIso() },
  ],
  news: [],
  newsletters: [],
  media_resources: [],
  teacher_media_items: [],
  administrators: [],
  staff: [],
  student_stats: [],
  grade_data: [],
  student_achievements: [],
  student_activities: [],
  student_council: [],
  curriculum_levels: DEFAULT_CURRICULUM_LEVELS.map((lvl) => ({
    ...lvl,
    created_at: nowIso(),
    updated_at: nowIso(),
  })),
  curriculum_programs: [],
  curriculum_activities: [],
  events: [],
  gallery_albums: [],
  gallery_photos: [],
  admissions: [],
  faq: [],
  milestones: [],
  facilities: [],
  contact_messages: [],
  admin_users: [...SEED_ADMIN_USERS],
  login_portals: [...DEFAULT_LOGIN_PORTALS],
  sapha_projects: [],
  sapha_links: [],
};

export const getTableData = (table: string): any[] => {
  const key = `${STORAGE_PREFIX}${table}`;
  const raw = getStorageItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sanitize out old legacy fake high-school data (1,250 students or ม.4-ม.6 or ม.6 council)
        if (table === 'grade_data') {
          const hasFakeHighSchool = parsed.some((r: any) =>
            typeof r?.level === 'string' && (r.level.includes('มัธยมศึกษาปีที่ 4') || r.level.includes('มัธยมศึกษาปีที่ 5') || r.level.includes('มัธยมศึกษาปีที่ 6'))
          );
          if (hasFakeHighSchool) {
            const initial = INITIAL_SEED_DATA[table] ? [...INITIAL_SEED_DATA[table]] : [];
            setStorageItem(key, JSON.stringify(initial));
            return initial;
          }
        }
        if (table === 'student_stats') {
          const hasFake1250 = parsed.some((r: any) =>
            typeof r?.value === 'string' && (r.value.includes('1,250') || r.value.includes('650') || r.value.includes('600'))
          );
          if (hasFake1250) {
            const initial = INITIAL_SEED_DATA[table] ? [...INITIAL_SEED_DATA[table]] : [];
            setStorageItem(key, JSON.stringify(initial));
            return initial;
          }
        }
        if (table === 'student_council') {
          const hasFakeCouncil = parsed.some((r: any) =>
            typeof r?.class === 'string' && (r.class.includes('ม.6') || r.class.includes('ม.5'))
          );
          if (hasFakeCouncil) {
            const initial = INITIAL_SEED_DATA[table] ? [...INITIAL_SEED_DATA[table]] : [];
            setStorageItem(key, JSON.stringify(initial));
            return initial;
          }
        }
        return parsed;
      }
    } catch {
      // ignore parse error
    }
  }
  const initial = INITIAL_SEED_DATA[table] ? [...INITIAL_SEED_DATA[table]] : [];
  setStorageItem(key, JSON.stringify(initial));
  return initial;
};

type RealtimeCallback = (payload: { table: string; eventType: string; new?: any; old?: any }) => void;
const localRealtimeListeners = new Set<RealtimeCallback>();

export const notifyLocalRealtimeListeners = (
  table: string,
  eventType = '*',
  payload: { new?: any; old?: any } = {}
): void => {
  localRealtimeListeners.forEach((listener) => {
    try {
      listener({ table, eventType, ...payload });
    } catch {
      // ignore listener errors
    }
  });
  if (typeof window !== 'undefined') {
    const detail = { table, eventType, ...payload };
    window.dispatchEvent(new CustomEvent('kk-supabase-realtime', { detail }));
    window.dispatchEvent(new CustomEvent('kk-school-local-db-change', { detail }));
  }
};

export const saveTableData = (table: string, rows: any[]): void => {
  const key = `${STORAGE_PREFIX}${table}`;
  setStorageItem(key, JSON.stringify(rows));
  notifyLocalRealtimeListeners(table, '*');
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const matchesPattern = (value: any, pattern: string, caseInsensitive: boolean): boolean => {
  if (value === null || value === undefined) return false;
  const str = String(value);
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  const regex = new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : '');
  return regex.test(str);
};

class MockQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any = null;
  private upsertConflictKey = 'id';
  private countMode: 'exact' | null = null;
  private headOnly = false;
  private filters: Array<(row: any) => boolean> = [];
  private sorts: Array<{ column: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private rangeSlice: [number, number] | null = null;
  private returnSingle = false;
  private returnMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    if (this.action === 'select') {
      this.action = 'select';
    }
    if (options?.count) {
      this.countMode = options.count;
    }
    if (options?.head) {
      this.headOnly = true;
    }
    return this;
  }

  insert(values: any) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  upsert(values: any, options?: { onConflict?: string }) {
    this.action = 'upsert';
    this.payload = values;
    if (options?.onConflict) {
      this.upsertConflictKey = options.onConflict;
    }
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((row) => row[column] > value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push((row) => matchesPattern(row[column], pattern, false));
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push((row) => matchesPattern(row[column], pattern, true));
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => Array.isArray(values) && values.includes(row[column]));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  or(expr: string) {
    const clauses = expr.split(',').map((c) => c.trim()).filter(Boolean);
    this.filters.push((row) =>
      clauses.some((clause) => {
        const parts = clause.split('.');
        if (parts.length < 3) return false;
        const col = parts[0];
        const op = parts[1];
        const val = parts.slice(2).join('.');
        if (op === 'eq') return String(row[col] ?? '').toLowerCase() === val.toLowerCase();
        if (op === 'ilike') return matchesPattern(row[col], val, true);
        return false;
      })
    );
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sorts.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeSlice = [from, to + 1];
    return this;
  }

  single() {
    this.returnSingle = true;
    return this;
  }

  maybeSingle() {
    this.returnMaybeSingle = true;
    return this;
  }

  private execute(): { data: any; error: null; count?: number | null } {
    const rows = getTableData(this.table);

    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const created = items.map((item) => ({
        id: item.id || generateId(),
        created_at: item.created_at || nowIso(),
        updated_at: item.updated_at || nowIso(),
        ...item,
      }));
      const nextRows = [...rows, ...created];
      saveTableData(this.table, nextRows);
      const resultData = this.returnSingle || this.returnMaybeSingle ? created[0] ?? null : created;
      return { data: resultData, error: null, count: created.length };
    }

    if (this.action === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const nextRows = [...rows];
      const upserted: any[] = [];

      for (const item of items) {
        const conflictKey = this.upsertConflictKey;
        const existingIdx = nextRows.findIndex(
          (r) => r[conflictKey] !== undefined && r[conflictKey] === item[conflictKey]
        );
        if (existingIdx !== -1) {
          const updated = {
            ...nextRows[existingIdx],
            ...item,
            updated_at: nowIso(),
          };
          nextRows[existingIdx] = updated;
          upserted.push(updated);
        } else {
          const created = {
            id: item.id || generateId(),
            created_at: item.created_at || nowIso(),
            updated_at: nowIso(),
            ...item,
          };
          nextRows.push(created);
          upserted.push(created);
        }
      }
      saveTableData(this.table, nextRows);
      const resultData = this.returnSingle || this.returnMaybeSingle ? upserted[0] ?? null : upserted;
      return { data: resultData, error: null, count: upserted.length };
    }

    if (this.action === 'update') {
      const updatedRows: any[] = [];
      const nextRows = rows.map((row) => {
        const matches = this.filters.every((fn) => fn(row));
        if (!matches) return row;
        const updated = { ...row, ...this.payload, updated_at: nowIso() };
        updatedRows.push(updated);
        return updated;
      });
      saveTableData(this.table, nextRows);
      const resultData = this.returnSingle || this.returnMaybeSingle ? updatedRows[0] ?? null : updatedRows;
      return { data: resultData, error: null, count: updatedRows.length };
    }

    if (this.action === 'delete') {
      const deletedRows: any[] = [];
      const nextRows = rows.filter((row) => {
        const matches = this.filters.every((fn) => fn(row));
        if (matches) {
          deletedRows.push(row);
          return false;
        }
        return true;
      });
      saveTableData(this.table, nextRows);
      return { data: deletedRows, error: null, count: deletedRows.length };
    }

    // SELECT
    let filtered = rows.filter((row) => this.filters.every((fn) => fn(row)));
    const totalCount = filtered.length;

    if (this.sorts.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const { column, ascending } of this.sorts) {
          const av = a[column];
          const bv = b[column];
          if (av === bv) continue;
          if (av === undefined || av === null) return 1;
          if (bv === undefined || bv === null) return -1;
          const cmp = av < bv ? -1 : 1;
          return ascending ? cmp : -cmp;
        }
        return 0;
      });
    }

    if (this.rangeSlice) {
      filtered = filtered.slice(this.rangeSlice[0], this.rangeSlice[1]);
    } else if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount);
    }

    if (this.headOnly) {
      return { data: null, error: null, count: totalCount };
    }

    if (this.returnSingle || this.returnMaybeSingle) {
      return {
        data: filtered[0] ?? null,
        error: null,
        count: this.countMode ? totalCount : undefined,
      };
    }

    return {
      data: filtered,
      error: null,
      count: this.countMode ? totalCount : undefined,
    };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const uploadedBlobUrls = new Map<string, string>();

export const createMockSupabaseClient = () => {
  return {
    from: (table: string) => new MockQueryBuilder(table),
    rpc: async (fnName: string, args?: Record<string, any>) => {
      if (fnName === 'increment_news_view' && args?.news_id) {
        const news = getTableData('news');
        const next = news.map((n) =>
          n.id === args.news_id ? { ...n, views: (Number(n.views) || 0) + 1 } : n
        );
        saveTableData('news', next);
      }
      return { data: null, error: null };
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, fileOrBlob: Blob | File) => {
          try {
            if (typeof FileReader !== 'undefined') {
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(fileOrBlob);
              });
              if (dataUrl) {
                uploadedBlobUrls.set(path, dataUrl);
                try {
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(`kk_storage_${path}`, dataUrl);
                  }
                } catch {
                  // ignore
                }
              }
            } else if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
              const url = URL.createObjectURL(fileOrBlob);
              uploadedBlobUrls.set(path, url);
            }
          } catch {
            // ignore in non-browser
          }
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          let url = uploadedBlobUrls.get(path);
          if (!url && typeof localStorage !== 'undefined') {
            url = localStorage.getItem(`kk_storage_${path}`) || undefined;
          }
          return { data: { publicUrl: url || heroSchool2 } };
        },
        remove: async (paths: string[]) => {
          paths.forEach((p) => {
            uploadedBlobUrls.delete(p);
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(`kk_storage_${p}`);
              }
            } catch {
              // ignore
            }
          });
          return { data: paths, error: null };
        },
        list: async () => ({ data: [], error: null }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    channel: (_name: string) => {
      const channelHandlers: RealtimeCallback[] = [];
      const channelObj = {
        on: (
          _type: string,
          filter: { event?: string; schema?: string; table?: string },
          callback: (payload: any) => void
        ) => {
          const handler: RealtimeCallback = (payload) => {
            if (!filter?.table || filter.table === '*' || filter.table === payload.table) {
              callback(payload);
            }
          };
          channelHandlers.push(handler);
          localRealtimeListeners.add(handler);
          return channelObj;
        },
        subscribe: (statusCb?: (status: string) => void) => {
          if (statusCb) statusCb('SUBSCRIBED');
          return channelObj;
        },
        send: async (_payload: any) => 'ok',
        unsubscribe: async () => {
          channelHandlers.forEach((h) => localRealtimeListeners.delete(h));
          return 'ok';
        },
      };
      return channelObj;
    },
    removeChannel: async (channelObj: any) => {
      if (channelObj && typeof channelObj.unsubscribe === 'function') {
        await channelObj.unsubscribe();
      }
      return 'ok';
    },
  };
};

