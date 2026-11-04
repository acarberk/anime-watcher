import {
  CalendarClockIcon,
  CircleCheckIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Airing } from "@/lib/anilist";
import { formatAiringTime, formatCountdown } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Cover } from "./cover";
import { health, type WatchEntry } from "./model";

function Chip({ tone, icon, children, title }: { tone: "muted" | "ok" | "warn" | "brand"; icon: ReactNode; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "ok" && "bg-success/12 text-success",
        tone === "warn" && "bg-warning/15 text-warning-foreground dark:text-warning",
        tone === "brand" && "bg-accent text-accent-foreground",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

const episodeLabel = (season: number, episode: number) => `${season > 1 ? `S${season} · ` : ""}Ep ${episode}`;

function StatusChip({ entry }: { entry: WatchEntry }) {
  switch (health(entry)) {
    case "paused":
      return <Chip tone="muted" icon={<PauseIcon />}>Paused</Chip>;
    case "pending":
      return (
        <Chip tone="muted" icon={<ClockIcon />} title="The next scan (within 30 minutes) marks everything already released as seen.">
          Waiting for first scan
        </Chip>
      );
    case "no-matches":
      return (
        <Chip tone="warn" icon={<TriangleAlertIcon />} title="The last scan found no 1080p English releases. Check the Nyaa search.">
          No matches on Nyaa
        </Chip>
      );
    default:
      return entry.lastSeen ? (
        <Chip tone="ok" icon={<CircleCheckIcon />}>Latest {episodeLabel(entry.lastSeen.season, entry.lastSeen.episode)}</Chip>
      ) : (
        <Chip tone="muted" icon={<ClockIcon />}>No episodes yet</Chip>
      );
  }
}

function AiringChip({ airing, now }: { airing?: Airing; now: number }) {
  const next = airing?.nextAiringEpisode;
  if (!next) return null;
  return (
    <Chip tone="brand" icon={<CalendarClockIcon />} title={`Airs ${formatAiringTime(next.airingAt)}`}>
      Ep {next.episode} {formatCountdown(next.airingAt - Math.floor(now / 1000))}
    </Chip>
  );
}

export function AnimeCard({
  entry,
  airing,
  now,
  onEdit,
  onToggle,
  onDelete,
}: {
  entry: WatchEntry;
  airing?: Airing;
  now: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = [
    entry.query !== entry.title && entry.query,
    entry.season && `Season ${entry.season}`,
    entry.groups?.join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn(
        "group relative flex h-full gap-3 rounded-2xl border bg-card p-3 transition-colors hover:border-primary/35 sm:gap-4 sm:p-4",
        !entry.active && "bg-card/60",
      )}
    >
      <Cover
        src={entry.cover_url}
        color={entry.cover_color}
        title={entry.title}
        className={cn("w-16 self-start sm:w-[4.5rem] xl:w-20", !entry.active && "opacity-50 grayscale")}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-1">
          <h3 className="line-clamp-2 flex-1 pt-0.5 leading-snug font-medium">
            {/* stretched button: the whole card opens the editor */}
            <button type="button" onClick={onEdit} className="text-left after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none after:focus-visible:ring-3 after:focus-visible:ring-ring/50">
              {entry.title}
            </button>
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-10 -mt-1 -mr-1 size-10 text-muted-foreground md:size-8" aria-label={`Actions for ${entry.title}`}>
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={onEdit}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggle}>
                {entry.active ? <PauseIcon /> : <PlayIcon />} {entry.active ? "Pause" : "Resume"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {meta && <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">{meta}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
          <StatusChip entry={entry} />
          {entry.active && <AiringChip airing={airing} now={now} />}
        </div>
      </div>
    </article>
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border bg-card p-3 sm:gap-4 sm:p-4" aria-hidden="true">
      <div className="aspect-[2/3] w-16 animate-pulse rounded-lg bg-muted sm:w-[4.5rem] xl:w-20" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-auto flex gap-1.5">
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
