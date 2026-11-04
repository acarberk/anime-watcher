import type { WatchItem } from "./db";
import type { NyaaItem } from "./nyaa";
import { parseTitle, type ParsedTitle } from "./parse-title";

export type Rules = Pick<WatchItem, "title_regex" | "season" | "min_episode" | "groups">;
export type Candidate = NyaaItem & ParsedTitle & { episode: number };

export function filterItems(items: NyaaItem[], rules: Rules): Candidate[] {
  const re = rules.title_regex ? new RegExp(rules.title_regex, "i") : null;
  const groups = rules.groups?.length ? rules.groups.map((g) => g.toLowerCase()) : null;
  const minEpisode = rules.min_episode ?? 0;

  return items.flatMap((item) => {
    const p = parseTitle(item.title);
    if (p.resolution === null || p.resolution < 1080) return [];
    if (p.isBatch || p.episode === null) return [];
    if (re && !re.test(item.title)) return [];
    if (rules.season != null && p.season !== rules.season) return [];
    if (p.episode <= minEpisode) return [];
    if (groups && !(p.group && groups.includes(p.group.toLowerCase()))) return [];
    return [{ ...item, ...p, episode: p.episode }];
  });
}

// trusted first, then more seeders, then older pubDate
const isBetter = (a: Candidate, b: Candidate) =>
  a.trusted !== b.trusted ? a.trusted : a.seeders !== b.seeders ? a.seeders > b.seeders : a.pubDate < b.pubDate;

// one candidate per (season, episode), sorted ascending
export function pickBest(candidates: Candidate[]): Candidate[] {
  const best = new Map<string, Candidate>();
  for (const c of candidates) {
    const key = `${c.season}:${c.episode}`;
    const current = best.get(key);
    if (!current || isBetter(c, current)) best.set(key, c);
  }
  return [...best.values()].sort((a, b) => a.season - b.season || a.episode - b.episode);
}
