import { setTimeout as sleep } from "node:timers/promises";
import { config } from "./config";
import { activeWatchlist, episodeKey, markSeen, recordScan, seenKeys, setSeeded, type WatchItem } from "./db";
import { filterItems, pickBest, type Candidate } from "./filter";
import { fetchNyaa, type NyaaItem } from "./nyaa";
import { formatNotification, notify } from "./notify/index";

const seenRow = (w: WatchItem, c: Candidate) => ({
  watchlist_id: w.id,
  season: c.season,
  episode: c.episode,
  info_hash: c.infoHash,
  release_title: c.title,
});

// one Nyaa request per distinct query per run, shared by every row/user that uses it.
// The promise is cached even when it fails, so a broken query isn't retried per row.
const feeds = new Map<string, Promise<NyaaItem[]>>();
const feed = (query: string) => {
  const key = query.trim().toLowerCase();
  let p = feeds.get(key);
  if (!p) {
    const delay = feeds.size ? sleep(config.REQUEST_DELAY_MS) : Promise.resolve(); // go easy on Nyaa
    p = delay.then(() => fetchNyaa(query));
    feeds.set(key, p);
  }
  return p;
};

const watchlist = await activeWatchlist();
let fresh = 0;
let failed = 0;

for (const w of watchlist) {
  try {
    const items = await feed(w.query);
    const best = pickBest(filterItems(items, w));
    const topic = w.profiles?.ntfy_topic ?? null;
    // scan health answers "does this search find the show at all?", so it ignores min_episode;
    // otherwise a "start from episode 12" row would look broken until episode 12 airs
    if (!config.DRY_RUN) await recordScan(w.id, pickBest(filterItems(items, { ...w, min_episode: -1 })).length);

    // Mark what's on Nyaa as seen without sending anything:
    // - first scan of a new row (spam guard, per season+episode so a new season still notifies)
    // - user without a topic yet, so setting one later doesn't flood
    if (!w.seeded || (w.user_id && !topic)) {
      const why = w.seeded ? "user has no ntfy topic" : "first scan";
      console.log(`[silent] ${w.title}: ${best.length} episode(s) marked as seen (${why})`);
      if (!config.DRY_RUN) {
        if (best.length) await markSeen(best.map((c) => seenRow(w, c)));
        if (!w.seeded) await setSeeded(w.id);
      }
      continue;
    }

    const seen = await seenKeys(w.id);

    for (const c of best.filter((c) => !seen.has(episodeKey(c.season, c.episode)))) {
      const n = formatNotification(w, c);
      if (config.DRY_RUN) {
        fresh++;
        console.log(`[dry-run] ${n.title} | ${n.body} | ${n.url}`);
        continue;
      }
      await notify(n, topic);
      fresh++;
      console.log(`[sent] ${n.title}`);
      try {
        await markSeen(seenRow(w, c));
      } catch (e) {
        console.error(`[${w.title}] notification sent but the seen row failed to save; the next run may send it again`);
        throw e;
      }
    }
  } catch (e) {
    failed++;
    console.error(`[${w.title}] error:`, e instanceof Error ? e.message : e);
  }
}

console.log(
  `scanned: ${watchlist.length} rows / ${feeds.size} queries, new: ${fresh}, errors: ${failed}${config.DRY_RUN ? " (dry-run)" : ""}`,
);
if (failed) process.exitCode = 1;
