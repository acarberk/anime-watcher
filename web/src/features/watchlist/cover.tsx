import { useState } from "react";
import { cn } from "@/lib/utils";

/** 2:3 poster; AniList's dominant color fills the frame while the image loads (or if there is none) */
export function Cover({
  src,
  color,
  title,
  className,
}: {
  src: string | null;
  color: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn("relative aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-muted", className)}
      style={color ? { backgroundColor: color } : undefined}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-white/90 mix-blend-luminosity">
          {initials}
        </span>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-black/10 ring-inset dark:ring-white/10" />
    </div>
  );
}
