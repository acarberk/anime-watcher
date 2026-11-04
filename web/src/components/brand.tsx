import { useId } from "react";
import { cn } from "@/lib/utils";

/** App mark: play triangle with a "new episode" dot, same as the PWA icon */
export function LogoMark({ className }: { className?: string }) {
  // per-instance id: a gradient defined inside a display:none copy (e.g. the desktop-only panel) breaks every other one
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <defs>
        {/* var() only resolves through style, not the stop-color attribute */}
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-2)" }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path d="M12.5 10.2v11.6L22 16z" fill="#fff" />
      <circle cx="22.6" cy="9.4" r="2.6" fill="#ffcc4d" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[1.0625rem]">Anime Watcher</span>
    </span>
  );
}
