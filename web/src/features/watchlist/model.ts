import { z } from "zod";

/** A watchlist row as stored in Supabase */
export interface WatchRow {
  id: string;
  title: string;
  query: string;
  title_regex: string | null;
  season: number | null;
  min_episode: number | null;
  groups: string[] | null;
  active: boolean;
  seeded: boolean;
  user_id: string | null;
  anilist_id: number | null;
  cover_url: string | null;
  cover_color: string | null;
  last_scanned_at: string | null;
  last_match_count: number | null;
  created_at: string;
}

export interface SeenRow {
  watchlist_id: string;
  season: number;
  episode: number;
}

export interface WatchEntry extends WatchRow {
  lastSeen: { season: number; episode: number } | null;
}

export function joinLastSeen(rows: WatchRow[], seen: SeenRow[]): WatchEntry[] {
  const last = new Map<string, { season: number; episode: number }>();
  for (const s of seen) {
    const cur = last.get(s.watchlist_id);
    const ep = Number(s.episode); // numeric column, e.g. 12.5
    if (!cur || s.season > cur.season || (s.season === cur.season && ep > cur.episode)) {
      last.set(s.watchlist_id, { season: s.season, episode: ep });
    }
  }
  return rows.map((r) => ({ ...r, lastSeen: last.get(r.id) ?? null }));
}

export type Health = "paused" | "pending" | "no-matches" | "ok";

/** What the card's status chip says */
export function health(r: Pick<WatchRow, "active" | "seeded" | "last_scanned_at" | "last_match_count">): Health {
  if (!r.active) return "paused";
  if (!r.seeded) return "pending";
  if (r.last_scanned_at && r.last_match_count === 0) return "no-matches";
  return "ok";
}

export const POPULAR_GROUPS = ["SubsPlease", "Erai-raws", "ToonsHub", "Judas", "EMBER", "VARYG"];

const optionalInt = (min: number, max: number, label: string) =>
  z
    .union([z.literal(""), z.coerce.number().int(`${label} must be a whole number.`).min(min).max(max)])
    .transform((v) => (v === "" ? null : v));

export const animeFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give it a name.").max(120),
    query: z.string().trim().min(2, "Enter what to search for on Nyaa.").max(200),
    season: optionalInt(1, 99, "Season"),
    groups: z.array(z.string().trim().min(1)).max(10),
    regex: z
      .string()
      .trim()
      .refine((v) => {
        if (!v) return true;
        try {
          new RegExp(v, "i"); // same engine the cron uses
          return true;
        } catch {
          return false;
        }
      }, "This isn't a valid regular expression."),
    startMode: z.enum(["new", "from"]),
    fromEpisode: optionalInt(0, 9999, "Episode"),
    anilist_id: z.number().nullable(),
    cover_url: z.string().nullable(),
    cover_color: z.string().nullable(),
  })
  .refine((v) => v.startMode === "new" || v.fromEpisode !== null, {
    path: ["fromEpisode"],
    message: "Which episode should notifications start from?",
  });

export type AnimeFormInput = z.input<typeof animeFormSchema>;
export type AnimeFormValues = z.output<typeof animeFormSchema>;

export const emptyForm: AnimeFormInput = {
  title: "",
  query: "",
  season: "",
  groups: [],
  regex: "",
  startMode: "new",
  fromEpisode: "",
  anilist_id: null,
  cover_url: null,
  cover_color: null,
};

export function rowToForm(r: WatchRow): AnimeFormInput {
  return {
    title: r.title,
    query: r.query,
    season: r.season ?? "",
    groups: r.groups ?? [],
    regex: r.title_regex ?? "",
    startMode: "new",
    fromEpisode: "",
    anilist_id: r.anilist_id,
    cover_url: r.cover_url,
    cover_color: r.cover_color,
  };
}

const searchFields = (v: AnimeFormValues) => ({
  query: v.query,
  title_regex: v.regex || null,
  season: v.season,
  groups: v.groups.length ? v.groups : null,
});

export function toInsertRow(v: AnimeFormValues) {
  const from = v.startMode === "from" ? v.fromEpisode : null;
  return {
    title: v.title,
    ...searchFields(v),
    anilist_id: v.anilist_id,
    cover_url: v.cover_url,
    cover_color: v.cover_color,
    // same as `watch:add --from n`: n and later are notified and the first scan is skipped
    min_episode: from === null ? 0 : from - 1,
    seeded: from !== null,
  };
}

/** Changing what is searched re-runs the first scan, so older matches of the new search don't all notify */
export function toUpdatePatch(v: AnimeFormValues, original: WatchRow) {
  const next = searchFields(v);
  const changed =
    next.query !== original.query ||
    next.title_regex !== original.title_regex ||
    next.season !== original.season ||
    (next.groups ?? []).join("\n") !== (original.groups ?? []).join("\n");
  return {
    title: v.title,
    ...next,
    anilist_id: v.anilist_id,
    cover_url: v.cover_url,
    cover_color: v.cover_color,
    ...(changed && { seeded: false }),
  };
}
