export interface ParsedTitle {
  group: string | null;
  season: number;
  episode: number | null;
  resolution: number | null;
  isBatch: boolean;
}

const SEASON = [
  /\bS(\d+)E\d+/i,
  /\b(\d+)(?:st|nd|rd|th) Season\b/i,
  /\bSeason (\d+)\b/i,
  /\bS(\d+)\b/, // bare "S2 - 05" (SubsPlease style), else it would key as season 1
];

const EPISODE = [/\bS\d+E(\d+)/i, / - (\d+(?:\.\d)?)(?:v\d)?\b/, /\bE(\d+)\b/];

// ranges only in the episode slot or in brackets, so "Kaiju No. 8 - 05" is not a batch
const BATCH = [/\b(?:Batch|Complete)\b/i, / - \d+\s*[-~]\s*\d+/, /[(\[]\s*\d+\s*[-~]\s*\d+\s*[)\]]/];

const firstMatch = (title: string, patterns: RegExp[]) => {
  for (const p of patterns) {
    const m = title.match(p);
    if (m) return Number(m[1]);
  }
  return null;
};

export function parseTitle(title: string): ParsedTitle {
  const res = title.match(/(\d{3,4})p\b/i);
  const isBatch = BATCH.some((p) => p.test(title));
  return {
    group: title.match(/^\s*\[([^\]]+)\]/)?.[1].trim() ?? null,
    season: firstMatch(title, SEASON) ?? 1,
    episode: isBatch ? null : firstMatch(title, EPISODE),
    resolution: res ? Number(res[1]) : /\b4K\b/i.test(title) ? 2160 : null,
    isBatch,
  };
}
