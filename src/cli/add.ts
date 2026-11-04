import { parseArgs } from "node:util";
import { db, must, type WatchItem } from "../db";

const USAGE = `Usage: pnpm watch:add "<title>" [--query "<nyaa search>"] [--regex "<pattern>"]
                      [--season <n>] [--groups SubsPlease,Erai-raws] [--from <n>]
  --from <n>  notify episode n and later (default: everything already on Nyaa counts as seen)`;

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
    console.error(`--${name} must be an integer: ${v}\n${USAGE}`);
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
console.log(`Added: ${added.title} (${added.id})`);
console.log(
  from !== null
    ? `Episode ${from} and later will be notified`
    : "The first scan marks what's already on Nyaa as seen; later episodes will be notified",
);
