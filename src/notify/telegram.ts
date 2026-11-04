import { config } from "../config";
import type { Notification } from "./index";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function telegram(n: Notification): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.TELEGRAM_CHAT_ID,
      text: `<b>${escapeHtml(n.title)}</b>\n${escapeHtml(n.body)}`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "Open on Nyaa", url: n.url }]] },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`telegram HTTP ${res.status}: ${await res.text()}`);
}
