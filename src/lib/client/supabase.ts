"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the public Supabase URL and anon key are configured. */
export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Browser client using the anon key; all access is restricted by Row Level Security. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "s2c-auth" },
    });
  }
  return client;
}
