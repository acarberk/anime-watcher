/** 404/410 from the push service: the browser dropped this subscription, delete the row */
export class SubscriptionGoneError extends Error {}

export interface Channel {
  /** subscription id for push channels, so results can be written back */
  id: string;
  kind: "push" | "ntfy" | "env";
  send: () => Promise<void>;
}

export interface DeliveryResult {
  delivered: number;
  succeededPush: string[];
  failed: { id: string; kind: Channel["kind"]; error: string }[];
  /** push subscriptions the browser dropped (404/410) */
  gone: string[];
}

/** Sends to every channel; an episode counts as delivered if at least one channel took it */
export async function deliver(channels: Channel[]): Promise<DeliveryResult> {
  const results = await Promise.allSettled(channels.map((c) => c.send()));
  const out: DeliveryResult = { delivered: 0, succeededPush: [], failed: [], gone: [] };
  results.forEach((r, i) => {
    const c = channels[i];
    if (r.status === "fulfilled") {
      out.delivered++;
      if (c.kind === "push") out.succeededPush.push(c.id);
    } else if (r.reason instanceof SubscriptionGoneError) {
      out.gone.push(c.id);
    } else {
      out.failed.push({ id: c.id, kind: c.kind, error: r.reason instanceof Error ? r.reason.message : String(r.reason) });
    }
  });
  return out;
}
