import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// We use placeholders to prevent the entire app from crashing on load if Vercel misses the env vars.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
