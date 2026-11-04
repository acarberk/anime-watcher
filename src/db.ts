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
  seeded: boolean; // false → next run marks what's already on Nyaa as seen, sends nothing
  user_id: string | null; // null = added via CLI, notified through the env channels
  anilist_id: number | null;
  cover_url: string | null;
  cover_color: string | null;
  last_scanned_at: string | null;
  last_match_count: number | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type ScanItem = WatchItem & {
  profiles: { ntfy_topic: string | null; push_subscriptions: PushSubscriptionRow[] } | null;
};

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

export async function activeWatchlist(): Promise<ScanItem[]> {
  return must(
    await db
      .from("watchlist")
      .select("*, profiles(ntfy_topic, push_subscriptions(id, endpoint, p256dh, auth))")
      .eq("active", true)
      .order("created_at"),
  );
}

/** Devices that never received anything yet; they get a one-time welcome push */
export async function unconfirmedSubscriptions(): Promise<PushSubscriptionRow[]> {
  return must(await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").is("last_success_at", null));
}

export async function recordPushResults(succeeded: Iterable<string>, failed: Map<string, string>, gone: Iterable<string>) {
  const ok = [...succeeded];
  const dead = [...gone];
  if (ok.length) must(await db.from("push_subscriptions").update({ last_success_at: new Date().toISOString(), last_error: null }).in("id", ok));
  for (const [id, error] of failed) must(await db.from("push_subscriptions").update({ last_error: error.slice(0, 300) }).eq("id", id));
  if (dead.length) must(await db.from("push_subscriptions").delete().in("id", dead));
}

export async function seenKeys(watchlistId: string): Promise<Set<string>> {
  const rows: Pick<SeenEpisode, "season" | "episode">[] = must(
    await db.from("seen_episodes").select("season, episode").eq("watchlist_id", watchlistId),
  );
  return new Set(rows.map((r) => episodeKey(r.season, r.episode)));
}

export async function setSeeded(id: string): Promise<void> {
  must(await db.from("watchlist").update({ seeded: true }).eq("id", id));
}

/** Lets the web app flag rows whose search keeps matching nothing */
export async function recordScan(id: string, matchCount: number): Promise<void> {
  must(
    await db
      .from("watchlist")
      .update({ last_scanned_at: new Date().toISOString(), last_match_count: matchCount })
      .eq("id", id),
  );
}

export async function markSeen(rows: SeenEpisode | SeenEpisode[]): Promise<void> {
  must(
    await db
      .from("seen_episodes")
      .upsert(rows, { onConflict: "watchlist_id,season,episode", ignoreDuplicates: true }),
  );
}
