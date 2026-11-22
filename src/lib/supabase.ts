import { createClient } from '@supabase/supabase-js';

// SERVER-SIDE ONLY. Only API routes and server code import this file.
// It uses the service-role key so the database tables can stay locked
// (RLS on, no public policies). Falls back to the anon key only if the
// service key is missing, so a misconfiguration is visible rather than silent.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
