import { isBrave, isIOS, isStandalone } from "./platform";

// Public half of the VAPID pair, injected at build time from the repo variable (pages.yml). Public by design.
export const VAPID_PUBLIC_KEY: string | undefined = import.meta.env.VITE_VAPID_PUBLIC_KEY || undefined;

/**
 * unconfigured  – the deployment has no VAPID key yet (only the ntfy route is offered)
 * needs-install – iOS: Web Push only exists in a Home Screen web app
 * unsupported   – this browser can't do Web Push
 * denied        – the user blocked notifications for the site
 * ready         – can ask for permission
 */
export type PushAvailability = "unconfigured" | "needs-install" | "unsupported" | "denied" | "ready";

export function pushAvailability(): PushAvailability {
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "ready";
}

export class PushError extends Error {
  constructor(
    readonly kind: "denied" | "dismissed" | "push-service" | "update-pending",
    message: string,
  ) {
    super(message);
  }
}

function base64UrlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  const reg = await navigator.serviceWorker.ready;
  // A waiting worker means this tab still runs the previous build's worker. Subscribing now could route the first
  // pushes to a worker without the push handler, so finish the update first.
  if (reg.waiting) throw new PushError("update-pending", "Finish the app update first.");
  return reg;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Must be called from a tap (iOS rejects permission prompts that aren't user-initiated) */
export async function subscribeThisDevice(): Promise<{ endpoint: string; p256dh: string; auth: string }> {
  const permission = await Notification.requestPermission();
  if (permission === "denied") throw new PushError("denied", "Notifications are blocked for this site.");
  if (permission !== "granted") throw new PushError("dismissed", "Notifications weren't allowed.");

  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY!) });
    } catch (e) {
      // Brave ships with Google's push service turned off; subscribe() then fails with AbortError
      if ((e as DOMException).name === "AbortError" || isBrave()) {
        throw new PushError("push-service", "This browser's push service is turned off.");
      }
      throw e;
    }
  }
  const json = sub.toJSON();
  return { endpoint: sub.endpoint, p256dh: json.keys!.p256dh, auth: json.keys!.auth };
}

/** Let the waiting worker take over and reload into it */
export async function activateUpdate() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg?.waiting) return location.reload();
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
  reg.waiting.postMessage({ type: "SKIP_WAITING" });
}

export async function unsubscribeThisDevice(): Promise<void> {
  await (await currentSubscription())?.unsubscribe();
}

/** Local notification through the service worker: proves permission + display, not delivery */
export async function showTestNotification() {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification("🆕 Frieren S2 — Episode 10", {
    body: "This is how new episodes will show up. 1080p · SubsPlease",
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    badge: `${import.meta.env.BASE_URL}badge-96.png`,
    tag: "test",
  });
}
