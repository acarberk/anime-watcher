import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export interface WatchItem {
  id: string;
  title: string;
  query: string;
  title_regex: string | null;
  season: number | null;
  min_episode: number | null;
  groups: string[] | null;
  active: boolean;
  created_at: string;
}

export interface SeenEpisode {
  watchlist_id: string;
  season: number;
  episode: number;
  info_hash: string;
  release_title: string;
}

export const db = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// PostgrestError is a plain object; turn it into a real Error with a message
export function must<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data as T;
}

export const episodeKey = (season: number, episode: number) => `${season}:${Number(episode)}`;

export async function activeWatchlist(): Promise<WatchItem[]> {
  return must(await db.from("watchlist").select("*").eq("active", true).order("created_at"));
}

export async function seenKeys(watchlistId: string): Promise<Set<string>> {
  const rows: Pick<SeenEpisode, "season" | "episode">[] = must(
    await db.from("seen_episodes").select("season, episode").eq("watchlist_id", watchlistId),
  );
  return new Set(rows.map((r) => episodeKey(r.season, r.episode)));
}

export async function markSeen(rows: SeenEpisode | SeenEpisode[]): Promise<void> {
  must(
    await db
      .from("seen_episodes")
      .upsert(rows, { onConflict: "watchlist_id,season,episode", ignoreDuplicates: true }),
  );
}
