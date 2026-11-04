import { XMLParser } from "fast-xml-parser";
import { setTimeout as sleep } from "node:timers/promises";

export interface NyaaItem {
  title: string;
  link: string; // .torrent
  guid: string; // nyaa page
  pubDate: Date;
  infoHash: string;
  seeders: number;
  size: string;
  trusted: boolean;
  categoryId: string;
}

const repo = process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : "local";
const USER_AGENT = `anime-watcher/1.0 (+${repo})`;

export const rssUrl = (query: string) =>
  `https://nyaa.si/?page=rss&c=1_2&f=0&q=${encodeURIComponent(`${query} 1080p`)}`;

// isArray: a single-result feed would otherwise come back as an object
// htmlEntities: Nyaa titles contain numeric refs like &#39;
const parser = new XMLParser({ isArray: (name) => name === "item", parseTagValue: false, htmlEntities: true });

export function parseRss(xml: string): NyaaItem[] {
  // a block/error page would parse to zero items and look like "nothing new"
  if (!xml.includes("<rss")) throw new Error(`RSS bekleniyordu, gelen: ${xml.slice(0, 80)}`);
  const items: Record<string, string>[] = parser.parse(xml).rss?.channel?.item ?? [];
  return items
    .filter((i) => i["nyaa:categoryId"] === "1_2")
    .map((i) => ({
      title: i.title,
      link: i.link,
      guid: i.guid,
      pubDate: new Date(i.pubDate),
      infoHash: i["nyaa:infoHash"],
      seeders: Number(i["nyaa:seeders"]) || 0,
      size: i["nyaa:size"],
      trusted: i["nyaa:trusted"] === "Yes",
      categoryId: i["nyaa:categoryId"],
    }));
}

export async function fetchNyaa(query: string, retries = 1): Promise<NyaaItem[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(rssUrl(query), {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Nyaa HTTP ${res.status}`);
      return parseRss(await res.text());
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(2000 * 2 ** attempt);
    }
  }
}
