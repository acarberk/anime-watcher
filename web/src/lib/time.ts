/** "in 2d 4h", "in 3h 12m", "in 12m", "any minute now" */
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return "any minute now";
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  if (d) return `in ${d}d${h ? ` ${h}h` : ""}`;
  if (h) return `in ${h}h${m ? ` ${m}m` : ""}`;
  return `in ${m}m`;
}

const airingFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });

/** Local weekday + time, e.g. "Fri 18:30" */
export const formatAiringTime = (unixSeconds: number) => airingFormat.format(unixSeconds * 1000);

/** "2 hours ago" style, for "last scanned" */
export function formatRelative(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  if (s < 3_600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3_600)} h ago`;
  return `${Math.floor(s / 86_400)} d ago`;
}
