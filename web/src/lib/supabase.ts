import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uuodvqphbulhjbphhaas.supabase.co";
// publishable key is public by design; RLS limits every user to their own rows
const SUPABASE_KEY = "sb_publishable_Sq_ZQAtlp0yTrRk0fPc11A_AYZyTvWj";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // ?code= in the query string plays nicely with client-side routes (implicit puts tokens in the hash)
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Absolute URL inside the app, e.g. appUrl("auth/callback") → https://…/anime-watcher/auth/callback */
export const appUrl = (path: string) => new URL(path, location.origin + import.meta.env.BASE_URL).href;
