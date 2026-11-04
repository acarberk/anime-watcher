import { db, must, type WatchItem } from "../db";

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm watch:remove <id | "exact title">');
  process.exit(1);
}

const column = /^[0-9a-f-]{36}$/i.test(arg) ? "id" : "title";
const removed: WatchItem[] = must(await db.from("watchlist").delete().eq(column, arg).select());
if (!removed.length) {
  console.error(`Not found: ${arg}`);
  process.exit(1);
}
for (const w of removed) console.log(`Removed: ${w.title} (${w.id})`);
