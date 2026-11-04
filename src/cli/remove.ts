import { db, must, type WatchItem } from "../db";

const arg = process.argv[2];
if (!arg) {
  console.error('Kullanım: pnpm watch:remove <id | "tam başlık">');
  process.exit(1);
}

const column = /^[0-9a-f-]{36}$/i.test(arg) ? "id" : "title";
const removed: WatchItem[] = must(await db.from("watchlist").delete().eq(column, arg).select());
if (!removed.length) {
  console.error(`Bulunamadı: ${arg}`);
  process.exit(1);
}
for (const w of removed) console.log(`Silindi: ${w.title} (${w.id})`);
