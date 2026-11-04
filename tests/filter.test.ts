import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { filterItems, pickBest, type Rules } from "../src/filter";
import { parseRss } from "../src/nyaa";

const items = parseRss(readFileSync(new URL("./fixtures/sample-rss.xml", import.meta.url), "utf8"));
const rules: Rules = { title_regex: null, season: null, min_episode: 0, groups: null };
const titles = (r: Partial<Rules>) => filterItems(items, { ...rules, ...r }).map((c) => c.title);

describe("parseRss", () => {
  it("drops non-1_2 categories and converts fields", () => {
    expect(items).toHaveLength(7);
    expect(items[0]).toMatchObject({
      guid: "https://nyaa.si/view/1005",
      seeders: 312,
      trusted: true,
      size: "1.4 GiB",
      infoHash: "aaaa000000000000000000000000000000001005",
    });
    expect(items[0].pubDate.toISOString()).toBe("2026-10-06T16:01:00.000Z");
  });

  it("single item feed + numeric entities", () => {
    const one = parseRss(
      "<rss><channel><item><title>Frieren: Beyond Journey&#39;s End - 05 (1080p)</title><nyaa:categoryId>1_2</nyaa:categoryId></item></channel></rss>",
    );
    expect(one.map((i) => i.title)).toEqual(["Frieren: Beyond Journey's End - 05 (1080p)"]);
  });

  it("throws on a non-RSS body instead of returning nothing", () => {
    expect(() => parseRss("<html>blocked</html>")).toThrow();
  });
});

describe("filterItems", () => {
  it("drops 720p and batches", () => {
    const all = titles({});
    expect(all.some((t) => t.includes("720p"))).toBe(false);
    expect(all.some((t) => t.includes("Batch"))).toBe(false);
    expect(all).toHaveLength(5);
  });

  it("group whitelist is case-insensitive", () => {
    expect(titles({ groups: ["subsplease"] })).toEqual([
      "[SubsPlease] Sousou no Frieren - 05 (1080p) [A1B2C3D4].mkv",
      "[SubsPlease] Sousou no Frieren - 04 (1080p) [C9D0E1F2].mkv",
    ]);
  });

  it("min_episode hides old episodes", () => {
    expect(titles({ min_episode: 5 })).toEqual([
      "[ToonsHub] Sousou no Frieren - 06 1080p CR WEB-DL",
      "[Random] Sousou no Frieren - 06 (1080p)",
    ]);
  });

  it("season and title_regex", () => {
    expect(titles({ season: 2 })).toEqual([]);
    expect(titles({ title_regex: "toonshub" })).toEqual(["[ToonsHub] Sousou no Frieren - 06 1080p CR WEB-DL"]);
  });
});

describe("pickBest", () => {
  const best = pickBest(filterItems(items, rules));

  it("one release per episode, ascending", () => {
    expect(best.map((c) => c.episode)).toEqual([4, 5, 6]);
  });

  it("trusted beats more seeders", () => {
    expect(best[1].group).toBe("SubsPlease");
  });

  it("equal seeders → older pubDate wins", () => {
    expect(best[2].group).toBe("ToonsHub");
  });

  it("more seeders wins when trust is equal", () => {
    const [a, b] = filterItems(items, { ...rules, min_episode: 5 });
    expect(pickBest([{ ...a, seeders: 1 }, { ...b, seeders: 2 }])[0].group).toBe("Random");
  });
});
