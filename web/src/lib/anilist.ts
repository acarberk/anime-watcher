// AniList public GraphQL API (no key, CORS enabled). Used for search, cover art and airing times.
const ENDPOINT = "https://graphql.anilist.co";

export interface AniMedia {
  id: number;
  title: { romaji: string | null; english: string | null };
  format: string | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  coverImage: { large: string | null; color: string | null };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

export type Airing = Pick<AniMedia, "id" | "status" | "nextAiringEpisode">;

const MEDIA_FIELDS = `id title { romaji english } format status season seasonYear episodes
  coverImage { large color } nextAiringEpisode { episode airingAt }`;

async function gql<T>(query: string, variables: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (!res.ok) throw new Error(res.status === 429 ? "AniList is rate limiting requests. Try again in a minute." : `AniList error ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(body.errors[0].message);
  return body.data as T;
}

export async function searchAnime(search: string, signal?: AbortSignal): Promise<AniMedia[]> {
  const data = await gql<{ Page: { media: AniMedia[] } }>(
    `query ($search: String) { Page(perPage: 12) {
      media(search: $search, type: ANIME, isAdult: false, sort: [SEARCH_MATCH, POPULARITY_DESC]) { ${MEDIA_FIELDS} } } }`,
    { search },
    signal,
  );
  return data.Page.media;
}

/** One request for the whole list */
export async function fetchAiring(ids: number[], signal?: AbortSignal): Promise<Airing[]> {
  if (!ids.length) return [];
  const data = await gql<{ Page: { media: Airing[] } }>(
    `query ($ids: [Int]) { Page(perPage: 50) { media(id_in: $ids, type: ANIME) { id status nextAiringEpisode { episode airingAt } } } }`,
    { ids },
    signal,
  );
  return data.Page.media;
}

// AniList names later seasons "… 2nd Season" / "Season 2" / "Part 2", release groups write "S2 - 05" or keep
// counting episodes. Searching Nyaa with the suffix finds nothing, so it is dropped from the prefill.
const SEASON_SUFFIX = /[\s:-]*(?:\d+(?:st|nd|rd|th)\s+(?:Season|Cour)|Season\s+\d+|Part\s+\d+|Cour\s+\d+)\s*$/i;

export function stripSeason(title: string): string {
  let t = title.trim();
  for (let prev = ""; prev !== t; ) [prev, t] = [t, t.replace(SEASON_SUFFIX, "").trim()];
  return t;
}

export function prefillFromMedia(m: AniMedia) {
  const romaji = m.title.romaji ?? m.title.english ?? "";
  return {
    title: stripSeason(m.title.english ?? romaji),
    query: stripSeason(romaji),
    anilist_id: m.id,
    cover_url: m.coverImage.large,
    cover_color: m.coverImage.color,
  };
}

const FORMATS: Record<string, string> = { TV: "TV", TV_SHORT: "TV short", MOVIE: "Movie", OVA: "OVA", ONA: "ONA", SPECIAL: "Special" };
const STATUSES: Record<string, string> = {
  RELEASING: "Airing",
  FINISHED: "Finished",
  NOT_YET_RELEASED: "Upcoming",
  HIATUS: "On hiatus",
  CANCELLED: "Cancelled",
};

export const formatLabel = (f: string | null) => (f ? (FORMATS[f] ?? f) : null);
export const statusLabel = (s: string | null) => (s ? (STATUSES[s] ?? s) : null);
