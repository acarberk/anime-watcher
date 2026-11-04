import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// separate from vite.config so tests don't load the PWA/Tailwind plugins
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], env: { TZ: "UTC" } },
});
