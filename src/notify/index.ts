import { config, type Channel } from "../config";
import type { WatchItem } from "../db";
import type { Candidate } from "../filter";
import { ntfy } from "./ntfy";
import { telegram } from "./telegram";

export interface Notification {
  title: string;
  body: string;
  url: string;
}

const senders: Record<Channel, (n: Notification) => Promise<void>> = { ntfy, telegram };

export function formatNotification(w: Pick<WatchItem, "title">, c: Candidate): Notification {
  const season = c.season > 1 ? ` S${c.season}` : "";
  return {
    title: `🆕 ${w.title}${season} — Bölüm ${c.episode}`,
    body: [`${c.resolution}p`, c.group, c.size, `${c.seeders} seeder`].filter(Boolean).join(" · "),
    url: c.guid,
  };
}

export async function notify(n: Notification): Promise<void> {
  await Promise.all(config.NOTIFY_CHANNELS.map((ch) => senders[ch](n)));
}
