// This file initializes the Supabase client using configured env vars, with a local fallback only when env vars are missing.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createMockSupabaseClient, notifyLocalRealtimeListeners } from './mockStore';
export { notifyLocalRealtimeListeners };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasValidSupabaseConfig =
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.trim().startsWith('http') &&
  typeof SUPABASE_PUBLISHABLE_KEY === 'string' &&
  SUPABASE_PUBLISHABLE_KEY.trim().length > 0;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = (hasValidSupabaseConfig
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createMockSupabaseClient()) as ReturnType<typeof createClient<Database>>;
