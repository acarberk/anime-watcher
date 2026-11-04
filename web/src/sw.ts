/// <reference lib="WebWorker" />
// Service worker built with the app (vite-plugin-pwa injectManifest), so the push handler ships and updates with every
// release. Precaches the app shell only; Supabase/AniList responses are never cached.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | PrecacheEntry)[] };

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// client-side routes (deep links, installed app start) all load the shell
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

// the in-app "Reload" toast (registerType: prompt) asks the waiting worker to take over
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// Every push must show a notification: iOS revokes subscriptions whose pushes stay silent.
self.addEventListener("push", (event) => {
  let data: PushPayload = { title: "Anime Watcher", body: "" };
  try {
    data = { ...data, ...(event.data?.json() as PushPayload) };
  } catch {
    data.body = event.data?.text() ?? "";
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "icon-192.png",
      badge: "badge-96.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | null)?.url ?? self.registration.scope;
  event.waitUntil(self.clients.openWindow(url));
});
