import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // served from https://acarberk.github.io/anime-watcher/
  base: "/anime-watcher/",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // new builds activate and the page reloads into them on their own; a missable "Reload" prompt kept users on stale builds
      registerType: "autoUpdate",
      // our own worker (src/sw.ts) so the Web Push handler is versioned with the app
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      // app shell only; Supabase/AniList responses are never cached
      injectManifest: { globPatterns: ["**/*.{js,css,html,png,svg,woff2}"] },
      includeAssets: ["apple-touch-icon.png", "badge-96.png"],
      manifest: {
        name: "Anime Watcher",
        short_name: "Anime Watcher",
        description: "Get notified the moment a new episode of the anime you follow is out.",
        lang: "en",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#0b0b12",
        theme_color: "#0b0b12",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
