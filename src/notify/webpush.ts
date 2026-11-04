import webpush from "web-push";
import { config } from "../config";
import { SubscriptionGoneError } from "../deliver";

export interface PushTarget {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** What the service worker's push handler receives */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string; // same tag replaces the earlier notification on the device instead of stacking
}

export const pushEnabled = !!(config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY);

// generateRequestDetails + fetch instead of sendNotification (node:https), so tests can intercept it like any other request
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<void> {
  const req = webpush.generateRequestDetails(
    { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
    JSON.stringify(payload),
    {
      vapidDetails: {
        subject: config.VAPID_SUBJECT,
        publicKey: config.VAPID_PUBLIC_KEY!,
        privateKey: config.VAPID_PRIVATE_KEY!,
      },
      TTL: 24 * 3600, // an episode alert older than a day isn't worth delivering
      urgency: "normal",
    },
  );
  const headers = { ...(req.headers as Record<string, string>) };
  delete headers["Content-Length"]; // fetch sets it from the body
  const res = await fetch(req.endpoint, {
    method: req.method,
    headers,
    body: req.body ? new Uint8Array(req.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404 || res.status === 410) throw new SubscriptionGoneError(`push subscription gone (${res.status})`);
  if (!res.ok) throw new Error(`push service HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
