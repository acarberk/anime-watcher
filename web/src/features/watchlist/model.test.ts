import { describe, expect, it } from "vitest";
import { prefillFromMedia, stripSeason, type AniMedia } from "@/lib/anilist";
import { formatCountdown } from "@/lib/time";
import { animeFormSchema, emptyForm, health, joinLastSeen, toInsertRow, toUpdatePatch, type WatchRow } from "./model";

const row: WatchRow = {
  id: "a",
  title: "Frieren",
  query: "Sousou no Frieren",
  title_regex: null,
  season: null,
  min_episode: 0,
  groups: null,
  active: true,
  seeded: true,
  user_id: "u",
  anilist_id: 1,
  cover_url: null,
  cover_color: null,
  last_scanned_at: null,
  last_match_count: null,
  created_at: "",
};

const parse = (over: Partial<typeof emptyForm>) => animeFormSchema.parse({ ...emptyForm, title: "Frieren", query: "Sousou no Frieren", ...over });

describe("stripSeason", () => {
  it.each([
    ["Sousou no Frieren 2nd Season", "Sousou no Frieren"],
    ["Hotel Inhumans 2nd Season", "Hotel Inhumans"],
    ["Frieren: Beyond Journey’s End Season 2", "Frieren: Beyond Journey’s End"],
    ["Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season Part 2", "Re:Zero kara Hajimeru Isekai Seikatsu"],
    ["Chitose-kun wa Ramune Bin no Naka Part 2", "Chitose-kun wa Ramune Bin no Naka"],
    ["Kaiju No. 8", "Kaiju No. 8"],
    ["86: Eighty Six", "86: Eighty Six"],
  ])("%s → %s", (input, out) => expect(stripSeason(input)).toBe(out));

  it("prefills title from English and query from romaji", () => {
    const m = {
      id: 199426,
      title: { romaji: "Hotel Inhumans 2nd Season", english: "HOTEL INHUMANS Season 2" },
      coverImage: { large: "x.jpg", color: "#e4a15d" },
    } as AniMedia;
    expect(prefillFromMedia(m)).toMatchObject({ title: "HOTEL INHUMANS", query: "Hotel Inhumans", anilist_id: 199426 });
  });
});

describe("form → row", () => {
  it("new anime: first scan seeds, nothing old is notified", () => {
    expect(toInsertRow(parse({}))).toMatchObject({ min_episode: 0, seeded: false, groups: null, season: null });
  });

  it("from episode n: skips the first scan, notifies n and later", () => {
    expect(toInsertRow(parse({ startMode: "from", fromEpisode: "5" }))).toMatchObject({ min_episode: 4, seeded: true });
  });

  it("requires the episode when starting from one", () => {
    expect(animeFormSchema.safeParse({ ...emptyForm, title: "x", query: "xy", startMode: "from" }).success).toBe(false);
  });

  it("rejects a broken regex and accepts a valid one", () => {
    expect(animeFormSchema.safeParse({ ...emptyForm, title: "x", query: "xy", regex: "([" }).success).toBe(false);
    expect(parse({ regex: "^\\[SubsPlease\\]" }).regex).toBe("^\\[SubsPlease\\]");
  });

  it("edit re-seeds only when the search changes", () => {
    expect(toUpdatePatch(parse({ title: "Frieren!" }), row)).not.toHaveProperty("seeded");
    expect(toUpdatePatch(parse({ groups: ["SubsPlease"] }), row)).toMatchObject({ seeded: false });
    expect(toUpdatePatch(parse({ query: "Frieren" }), row)).toMatchObject({ seeded: false });
  });
});

describe("list helpers", () => {
  it("picks the latest season/episode per row", () => {
    const [e] = joinLastSeen([row], [
      { watchlist_id: "a", season: 1, episode: 28 },
      { watchlist_id: "a", season: 2, episode: 3 },
      { watchlist_id: "a", season: 2, episode: 12.5 },
    ]);
    expect(e.lastSeen).toEqual({ season: 2, episode: 12.5 });
  });

  it("health", () => {
    expect(health({ ...row, active: false })).toBe("paused");
    expect(health({ ...row, seeded: false })).toBe("pending");
    expect(health({ ...row, last_scanned_at: "2026-11-04T00:00:00Z", last_match_count: 0 })).toBe("no-matches");
    expect(health({ ...row, last_scanned_at: "2026-11-04T00:00:00Z", last_match_count: 3 })).toBe("ok");
  });

  it.each([
    [30, "any minute now"],
    [12 * 60, "in 12m"],
    [3 * 3600 + 12 * 60, "in 3h 12m"],
    [2 * 86400 + 4 * 3600, "in 2d 4h"],
    [86400, "in 1d"],
  ])("countdown %i s → %s", (s, out) => expect(formatCountdown(s)).toBe(out));
});
