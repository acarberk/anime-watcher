import { parseArgs } from "node:util";
import { db, must, type WatchItem } from "../db";

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
if (values.regex) new RegExp(values.regex); // fail fast on an invalid pattern

const from = toInt(values.from, "from");
const row = {
  title,
  query: values.query ?? title,
  title_regex: values.regex ?? null,
  season: toInt(values.season, "season"),
  groups: values.groups?.split(",").map((g) => g.trim()).filter(Boolean) ?? null,
  min_episode: from === null ? 0 : from - 1,
  // unseeded → the next run marks what's already on Nyaa as seen (first-run spam guard)
  seeded: from !== null,
};

const [added]: WatchItem[] = must(await db.from("watchlist").insert(row).select());
console.log(`Eklendi: ${added.title} (${added.id})`);
console.log(
  from !== null
    ? `${from}. bölüm ve sonrası bildirilecek`
    : "İlk taramada Nyaa'daki mevcut bölümler görüldü sayılacak, sonrakiler bildirilecek",
);
