import { config } from "../config";
import type { Notification } from "./index";

// JSON publish instead of Title/Click headers: fetch rejects non-Latin-1 header values (🆕, ö)
export async function ntfy(n: Notification): Promise<void> {
  const res = await fetch(config.NTFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.NTFY_TOKEN && { Authorization: `Bearer ${config.NTFY_TOKEN}` }),
    },
    body: JSON.stringify({
      topic: config.NTFY_TOPIC,
      title: n.title,
      message: n.body,
      tags: ["tv"],
      click: n.url,
      priority: 3,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`ntfy HTTP ${res.status}: ${await res.text()}`);
}
