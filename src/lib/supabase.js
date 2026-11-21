import { createClient } from '@supabase/supabase-js';

// Read public client environment variables injected by Vite.
// Never expose Supabase service-role keys in frontend code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * True only when both Supabase URL and Anon Key are configured.
 * When false, AgriShield automatically runs in Local Demo Mode
 * backed by browser LocalStorage so the app works without a backend.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http')
);

/**
 * Initialized Supabase client instance (or null when running in Local Demo Mode).
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export default supabase;
