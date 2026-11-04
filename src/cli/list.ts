import { db, must, type WatchItem } from "../db";

const rows: WatchItem[] = must(await db.from("watchlist").select("*").order("created_at"));
if (!rows.length) console.log("Watchlist boş.");
else
  console.table(
    rows.map((w) => ({
      id: w.id,
      title: w.title,
      query: w.query,
      season: w.season ?? "",
      min_episode: w.min_episode,
      groups: w.groups?.join(",") ?? "",
      regex: w.title_regex ?? "",
      active: w.active,
    })),
  );
