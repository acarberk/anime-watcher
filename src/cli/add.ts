import { parseArgs } from "node:util";
import { db, markSeen, must, type WatchItem } from "../db";
import { filterItems, pickBest } from "../filter";
import { fetchNyaa } from "../nyaa";

const USAGE = `Kullanım: pnpm watch:add "<başlık>" [--query "<nyaa arama>"] [--regex "<desen>"]
                      [--season <n>] [--groups SubsPlease,Erai-raws] [--from <n>]
  --from <n>  n. bölüm ve sonrası bildirilir (varsayılan: Nyaa'da şu an olan bölümler görüldü sayılır)`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    query: { type: "string" },
    regex: { type: "string" },
    season: { type: "string" },
    groups: { type: "string" },
    from: { type: "string" },
  },
});

const toInt = (v: string | undefined, name: string) => {
  if (v === undefined) return null;
  const n = Number(v);
  if (!Number.isInteger(n)) {
    console.error(`--${name} tam sayı olmalı: ${v}\n${USAGE}`);
    process.exit(1);
  }
  return n;
};

const title = positionals[0];
if (!title) {
  console.error(USAGE);
  process.exit(1);
}

const row = {
  title,
  query: values.query ?? title,
  title_regex: values.regex ?? null,
  season: toInt(values.season, "season"),
  groups: values.groups?.split(",").map((g) => g.trim()).filter(Boolean) ?? null,
  min_episode: 0,
};
if (row.title_regex) new RegExp(row.title_regex); // fail fast on an invalid pattern

const from = toInt(values.from, "from");
if (from !== null) row.min_episode = from - 1;

// first-run spam guard: episodes already on Nyaa are seeded into seen_episodes per (season, episode).
// Not a max-episode min_episode: a stray "S1 - 24" would hide S2 E11-24 forever.
const existing = from === null ? pickBest(filterItems(await fetchNyaa(row.query), row)) : [];

const [added]: WatchItem[] = must(await db.from("watchlist").insert(row).select());
try {
  if (existing.length)
    await markSeen(
      existing.map((c) => ({
        watchlist_id: added.id,
        season: c.season,
        episode: c.episode,
        info_hash: c.infoHash,
        release_title: c.title,
      })),
    );
} catch (e) {
  // without the seed the next run would notify every old episode
  must(await db.from("watchlist").delete().eq("id", added.id));
  throw e;
}

console.log(`Eklendi: ${added.title} (${added.id})`);
if (from !== null) console.log(`${from}. bölüm ve sonrası bildirilecek`);
else console.log(`Nyaa'daki ${existing.length} mevcut bölüm görüldü sayıldı, sonrakiler bildirilecek`);
