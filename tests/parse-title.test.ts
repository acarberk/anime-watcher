import { describe, expect, it } from "vitest";
import { parseTitle } from "../src/parse-title";

describe("parseTitle", () => {
  it.each([
    // plan §5 table
    ["[SubsPlease] Sousou no Frieren - 05 (1080p) [A1B2C3D4].mkv", "SubsPlease", 1, 5, 1080, false],
    ["[Erai-raws] Kusuriya no Hitorigoto 2nd Season - 12 [1080p][Multiple Subtitle]", "Erai-raws", 2, 12, 1080, false],
    ["[ToonsHub] Dandadan S02E07 1080p CR WEB-DL", "ToonsHub", 2, 7, 1080, false],
    ["[SubsPlease] Frieren - 12.5 (1080p)", "SubsPlease", 1, 12.5, 1080, false],
    ["[Judas] Frieren (Season 1) [1080p][Batch]", "Judas", 1, null, 1080, true],
    ["[Group] Show - 01-12 (1080p)", "Group", 1, null, 1080, true],
    ["[SubsPlease] Show - 03 (720p)", "SubsPlease", 1, 3, 720, false],
    ["[Group] Show - 03v2 (2160p)", "Group", 1, 3, 2160, false],
    // real-world traps
    ["[SubsPlease] Kaiju No. 8 - 05 (1080p) [ABCD1234].mkv", "SubsPlease", 1, 5, 1080, false],
    ["[SubsPlease] Dandadan S2 - 05 (1080p) [ABCD1234].mkv", "SubsPlease", 2, 5, 1080, false],
    ["[Erai-raws] Sousou no Frieren 2nd Season [1080p CR WEBRip HEVC AAC][MultiSub] (unofficial batch)", "Erai-raws", 2, null, 1080, true],
    ["[Group] Show - 01 ~ 12 [4K]", "Group", 1, null, 2160, true],
    ["[Group] Show - 05 [4K HDR]", "Group", 1, 5, 2160, false],
    ["Show - 05", null, 1, 5, null, false],
  ])("%s", (title, group, season, episode, resolution, isBatch) => {
    expect(parseTitle(title)).toEqual({ group, season, episode, resolution, isBatch });
  });
});
