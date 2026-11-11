// This file initializes the Supabase client using configured env vars,
// with a multi-layer Realtime Sync hub (postgres_changes + Supabase Broadcast + BroadcastChannel)
// and a local mock fallback only when env vars are missing.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import {
  createMockSupabaseClient,
  notifyLocalRealtimeListeners as triggerLocalRealtimeEvent,
} from './mockStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasValidSupabaseConfig =
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.trim().startsWith('http') &&
  typeof SUPABASE_PUBLISHABLE_KEY === 'string' &&
  SUPABASE_PUBLISHABLE_KEY.trim().length > 0;

export const isSupabaseConfigured = hasValidSupabaseConfig;

export const extractSupabaseProjectRef = (url?: string): string => {
  if (!url) return 'fhfckuypfstlokashcmu';
  try {
    const host = new URL(url).hostname;
    return host.split('.')[0] || 'fhfckuypfstlokashcmu';
  } catch {
    return 'fhfckuypfstlokashcmu';
  }
};

export const SUPABASE_PROJECT_REF = extractSupabaseProjectRef(SUPABASE_URL);

export const supabase = (hasValidSupabaseConfig
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createMockSupabaseClient()) as ReturnType<typeof createClient<Database>>;

export type RealtimeSyncStatus = 'SUBSCRIBED' | 'CONNECTING' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'LOCAL_ONLY';

let currentRealtimeStatus: RealtimeSyncStatus = hasValidSupabaseConfig ? 'CONNECTING' : 'LOCAL_ONLY';
const statusListeners = new Set<(status: RealtimeSyncStatus) => void>();
const globalBroadcastCallbacks = new Set<(table: string) => void>();

const setRealtimeStatus = (next: RealtimeSyncStatus) => {
  currentRealtimeStatus = next;
  statusListeners.forEach((cb) => {
    try {
      cb(next);
    } catch {
      // ignore listener errors
    }
  });
};

export const getRealtimeSyncStatus = (): RealtimeSyncStatus => currentRealtimeStatus;

export const onRealtimeSyncStatusChange = (
  listener: (status: RealtimeSyncStatus) => void
): (() => void) => {
  statusListeners.add(listener);
  listener(currentRealtimeStatus);
  return () => {
    statusListeners.delete(listener);
  };
};

let browserBroadcastChannel: BroadcastChannel | null = null;
const getBrowserBroadcastChannel = (): BroadcastChannel | null => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!browserBroadcastChannel) {
    try {
      browserBroadcastChannel = new BroadcastChannel('kk_school_realtime_bc');
      browserBroadcastChannel.onmessage = (event) => {
        const tbl = event?.data?.table || '*';
        globalBroadcastCallbacks.forEach((cb) => {
          try {
            cb(tbl);
          } catch {
            // ignore
          }
        });
      };
    } catch {
      return null;
    }
  }
  return browserBroadcastChannel;
};

let sharedSyncChannel: any = null;
let sharedSyncSubscribed = false;

const ensureSharedRealtimeSyncChannel = () => {
  if (typeof window === 'undefined') return null;
  getBrowserBroadcastChannel();

  if (!hasValidSupabaseConfig) {
    setRealtimeStatus('LOCAL_ONLY');
    return null;
  }

  if (sharedSyncChannel) return sharedSyncChannel;

  try {
    setRealtimeStatus('CONNECTING');
    sharedSyncChannel = (supabase as any)
      .channel('kk_school_live_sync', {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'table_changed' }, (msg: any) => {
        const tbl = msg?.payload?.table || '*';
        globalBroadcastCallbacks.forEach((cb) => {
          try {
            cb(tbl);
          } catch {
            // ignore
          }
        });
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          sharedSyncSubscribed = true;
          setRealtimeStatus('SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR') {
          sharedSyncSubscribed = false;
          setRealtimeStatus('CHANNEL_ERROR');
        } else if (status === 'TIMED_OUT') {
          sharedSyncSubscribed = false;
          setRealtimeStatus('TIMED_OUT');
        }
      });
  } catch {
    setRealtimeStatus('CHANNEL_ERROR');
  }

  return sharedSyncChannel;
};

if (typeof window !== 'undefined') {
  ensureSharedRealtimeSyncChannel();
}

export const notifyLocalRealtimeListeners = (table = '*'): void => {
  // 1. Same-tab window event + mock store subscribers
  triggerLocalRealtimeEvent(table);

  // 2. Same-browser cross-tab BroadcastChannel
  try {
    const bc = getBrowserBroadcastChannel();
    bc?.postMessage({ table, ts: Date.now() });
  } catch {
    // ignore
  }

  // 3. Cross-device Supabase Realtime WebSocket Broadcast (Vercel <-> Admin)
  try {
    const ch = ensureSharedRealtimeSyncChannel();
    if (ch && sharedSyncSubscribed && typeof ch.send === 'function') {
      void ch.send({
        type: 'broadcast',
        event: 'table_changed',
        payload: { table, ts: Date.now() },
      });
    }
  } catch {
    // ignore broadcast send errors
  }
};

export const subscribeToRealtimeTables = (
  channelName: string,
  tables: string[],
  onUpdate: (table: string) => void
): (() => void) => {
  ensureSharedRealtimeSyncChannel();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastFocusSyncAt = 0;

  const scheduleUpdate = (tbl = '*') => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onUpdate(tbl);
    }, 80);
  };

  const matchesTable = (tbl?: string) => {
    if (!tbl || tbl === '*') return true;
    return tables.includes('*') || tables.includes(tbl);
  };

  // Layer A: Supabase Postgres CDC (postgres_changes)
  let pgChannel: any = null;
  try {
    pgChannel = (supabase as any).channel(channelName);
    for (const table of tables) {
      if (table === '*') continue;
      pgChannel = pgChannel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          scheduleUpdate(table);
        }
      );
    }
    pgChannel.subscribe();
  } catch {
    // ignore if Realtime channel creation fails
  }

  // Layer B: Shared Supabase Broadcast + Same-browser BroadcastChannel
  const broadcastListener = (tbl: string) => {
    if (matchesTable(tbl)) {
      scheduleUpdate(tbl);
    }
  };
  globalBroadcastCallbacks.add(broadcastListener);

  // Layer C: Same-tab window custom event
  const handleCustomRealtime = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const tbl = detail?.table || '*';
    if (matchesTable(tbl)) {
      scheduleUpdate(tbl);
    }
  };

  // Layer D: Tab visibility / window focus revalidation for live Vercel freshness
  const handleFocusOrVisible = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const now = Date.now();
    if (now - lastFocusSyncAt < 3000) return;
    lastFocusSyncAt = now;
    scheduleUpdate('*');
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kk-supabase-realtime', handleCustomRealtime);
    window.addEventListener('focus', handleFocusOrVisible);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleFocusOrVisible);
  }

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    globalBroadcastCallbacks.delete(broadcastListener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('kk-supabase-realtime', handleCustomRealtime);
      window.removeEventListener('focus', handleFocusOrVisible);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    }
    if (pgChannel && typeof (supabase as any).removeChannel === 'function') {
      try {
        (supabase as any).removeChannel(pgChannel);
      } catch {
        // ignore
      }
    }
  };
};
