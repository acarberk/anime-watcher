import { setTimeout as sleep } from "node:timers/promises";
import { config } from "./config";
import { activeWatchlist, episodeKey, markSeen, seenKeys } from "./db";
import { filterItems, pickBest } from "./filter";
import { fetchNyaa } from "./nyaa";
import { formatNotification, notify } from "./notify/index";

const watchlist = await activeWatchlist();
let fresh = 0;
let failed = 0;

for (const [i, w] of watchlist.entries()) {
  if (i > 0) await sleep(config.REQUEST_DELAY_MS); // sequential on purpose, go easy on Nyaa
  try {
    const best = pickBest(filterItems(await fetchNyaa(w.query), w));
    const seen = await seenKeys(w.id);

    for (const c of best.filter((c) => !seen.has(episodeKey(c.season, c.episode)))) {
      const n = formatNotification(w, c);
      if (config.DRY_RUN) {
        fresh++;
        console.log(`[dry-run] ${n.title} | ${n.body} | ${n.url}`);
        continue;
      }
      await notify(n);
      fresh++;
      console.log(`[gönderildi] ${n.title}`);
      try {
        await markSeen({
          watchlist_id: w.id,
          season: c.season,
          episode: c.episode,
          info_hash: c.infoHash,
          release_title: c.title,
        });
      } catch (e) {
        console.error(`[${w.title}] bildirim gitti ama kayıt yazılamadı, sonraki run tekrar gönderebilir`);
        throw e;
      }
    }
  } catch (e) {
    failed++;
    console.error(`[${w.title}] hata:`, e instanceof Error ? e.message : e);
  }
}

console.log(`tarandı: ${watchlist.length}, yeni: ${fresh}, hata: ${failed}${config.DRY_RUN ? " (dry-run)" : ""}`);
if (failed) process.exitCode = 1;
