import { setTimeout as sleep } from "node:timers/promises";
import { config } from "./config";
import {
  activeWatchlist,
  episodeKey,
  markSeen,
  recordPushResults,
  recordScan,
  seenKeys,
  setSeeded,
  unconfirmedSubscriptions,
  type ScanItem,
  type WatchItem,
} from "./db";
import { deliver, type Channel, type DeliveryResult } from "./deliver";
import { filterItems, pickBest, type Candidate } from "./filter";
import { fetchNyaa, type NyaaItem } from "./nyaa";
import { formatNotification, notify, type Notification } from "./notify/index";
import { ntfy } from "./notify/ntfy";
import { pushEnabled, sendPush, type PushPayload } from "./notify/webpush";

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

// a user's devices repeat on every one of their rows, so push outcomes are collected and written once
const pushOk = new Set<string>();
const pushFailed = new Map<string, string>();
const pushGone = new Set<string>();
function collect(r: DeliveryResult) {
  r.succeededPush.forEach((id) => pushOk.add(id));
  r.failed.filter((f) => f.kind === "push").forEach((f) => pushFailed.set(f.id, f.error));
  r.gone.forEach((id) => pushGone.add(id));
}

const pushTargets = (w: ScanItem) => (w.profiles?.push_subscriptions ?? []).filter((s) => !pushGone.has(s.id));
const hasChannel = (w: ScanItem) => !w.user_id || !!w.profiles?.ntfy_topic || pushTargets(w).length > 0;

/** CLI rows (no user) use the env channels; a user's rows go to their topic and every device they connected */
function channelsFor(w: ScanItem, n: Notification, push: PushPayload): Channel[] {
  if (!w.user_id) return [{ id: "env", kind: "env", send: () => notify(n, null) }];
  const out: Channel[] = [];
  const topic = w.profiles?.ntfy_topic;
  if (topic) out.push({ id: "ntfy", kind: "ntfy", send: () => ntfy(n, topic) });
  if (pushEnabled) for (const s of pushTargets(w)) out.push({ id: s.id, kind: "push", send: () => sendPush(s, push) });
  // devices exist but the keys are missing: fail the row (retried next run) instead of silently dropping episodes
  if (!out.length) throw new Error("Web Push keys (VAPID) aren't configured, the user's devices can't be reached");
  return out;
}

const watchlist = await activeWatchlist();
let fresh = 0;
let failed = 0;

for (const w of watchlist) {
  try {
    const items = await feed(w.query);
    const best = pickBest(filterItems(items, w));
    // scan health answers "does this search find the show at all?", so it ignores min_episode;
    // otherwise a "start from episode 12" row would look broken until episode 12 airs
    if (!config.DRY_RUN) await recordScan(w.id, pickBest(filterItems(items, { ...w, min_episode: -1 })).length);

    // Mark what's on Nyaa as seen without sending anything:
    // - first scan of a new row (spam guard, per season+episode so a new season still notifies)
    // - user with no way to be reached yet, so connecting a device later doesn't flood it
    if (!w.seeded || !hasChannel(w)) {
      const why = w.seeded ? "user has no notification channel" : "first scan";
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
      // same tag on a retry replaces the earlier notification on the device instead of stacking
      const r = await deliver(channelsFor(w, n, { title: n.title, body: n.body, url: n.url, tag: `${w.id}:${c.season}:${c.episode}` }));
      collect(r);
      for (const f of r.failed) console.error(`[${w.title}] ${f.kind} delivery failed: ${f.error}`);
      if (!r.delivered) throw new Error("no notification channel accepted the episode");
      fresh++;
      console.log(`[sent] ${n.title} → ${r.delivered} channel(s)`);
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

// A device that has never received anything gets a one-time welcome, so a broken subscription shows up right away
// (and Settings can say "connected") instead of only when the next episode airs.
if (pushEnabled) {
  const pending = (await unconfirmedSubscriptions()).filter((s) => !pushOk.has(s.id) && !pushGone.has(s.id));
  if (config.DRY_RUN) {
    if (pending.length) console.log(`[dry-run] ${pending.length} new device(s) would get a welcome push`);
  } else {
    for (const s of pending) {
      const r = await deliver([
        {
          id: s.id,
          kind: "push",
          send: () => sendPush(s, { title: "🔔 Alerts are on", body: "New episodes from your watchlist will show up on this device.", tag: "welcome" }),
        },
      ]);
      collect(r);
      console.log(`[welcome] device ${s.id.slice(0, 8)}: ${r.delivered ? "sent" : r.gone.length ? "gone" : `failed (${r.failed[0]?.error})`}`);
    }
  }
} else {
  console.log("[push] VAPID keys not set, Web Push is off");
}

if (!config.DRY_RUN) await recordPushResults(pushOk, pushFailed, pushGone);

console.log(
  `scanned: ${watchlist.length} rows / ${feeds.size} queries, new: ${fresh}, errors: ${failed}${config.DRY_RUN ? " (dry-run)" : ""}`,
);
if (failed) process.exitCode = 1;
