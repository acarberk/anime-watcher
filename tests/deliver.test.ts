import { describe, expect, it } from "vitest";
import { deliver, SubscriptionGoneError, type Channel } from "../src/deliver";

const ok = (id: string, kind: Channel["kind"] = "push"): Channel => ({ id, kind, send: async () => {} });
const fail = (id: string, kind: Channel["kind"] = "push"): Channel => ({ id, kind, send: async () => { throw new Error("HTTP 500"); } });
const gone = (id: string): Channel => ({ id, kind: "push", send: async () => { throw new SubscriptionGoneError("gone"); } });

describe("deliver", () => {
  it("counts an episode as delivered when one channel works, and reports the rest", async () => {
    const r = await deliver([ok("phone"), fail("laptop"), gone("old-tablet"), ok("topic", "ntfy")]);
    expect(r.delivered).toBe(2);
    expect(r.succeededPush).toEqual(["phone"]);
    expect(r.failed).toEqual([{ id: "laptop", kind: "push", error: "HTTP 500" }]);
    expect(r.gone).toEqual(["old-tablet"]);
  });

  it("all channels failing means not delivered", async () => {
    const r = await deliver([fail("a"), gone("b")]);
    expect(r.delivered).toBe(0);
  });
});
