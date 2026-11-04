import { PlusIcon, RotateCwIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Airing } from "@/lib/anilist";
import { useNow } from "@/lib/hooks";
import { AnimeCard, AnimeCardSkeleton } from "./anime-card";
import type { WatchEntry } from "./model";

type Filter = "all" | "active" | "paused";

export interface WatchlistViewProps {
  entries: WatchEntry[] | undefined;
  loading: boolean;
  error: Error | null;
  airing?: Map<number, Airing>;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (e: WatchEntry) => void;
  onToggle: (e: WatchEntry) => void;
  onDelete: (e: WatchEntry) => void;
}

function EmptyWatchlist({ onAdd }: { onAdd: () => void }) {
  return (
    <Empty className="bg-glow min-h-[60dvh] rounded-3xl border md:min-h-[28rem]">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-accent text-accent-foreground [&_svg:not([class*='size-'])]:size-7">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle className="text-lg">Your watchlist is empty</EmptyTitle>
        <EmptyDescription className="max-w-sm text-pretty">
          Search AniList and add the shows you're watching. When a new episode lands on Nyaa, it'll reach your phone.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="xl" onClick={onAdd}>
          <PlusIcon /> Add your first anime
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function WatchlistView({ entries, loading, error, airing, onRetry, onAdd, onEdit, onToggle, onDelete }: WatchlistViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const now = useNow();

  const counts = {
    all: entries?.length ?? 0,
    active: entries?.filter((e) => e.active).length ?? 0,
    paused: entries?.filter((e) => !e.active).length ?? 0,
  };
  const visible = entries?.filter((e) => filter === "all" || (filter === "active" ? e.active : !e.active)) ?? [];
  const hasEntries = !!entries?.length;

  return (
    <>
      <PageHeader
        title="Watchlist"
        description={hasEntries ? `${counts.active} active · Nyaa is checked every 30 minutes` : undefined}
        action={
          hasEntries && (
            <Button size="lg" className="hidden md:inline-flex" onClick={onAdd}>
              <PlusIcon /> Add anime
            </Button>
          )
        }
      />

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn't load your watchlist</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCwIcon /> Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : loading ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5" aria-busy="true" aria-label="Loading watchlist">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <AnimeCardSkeleton />
            </li>
          ))}
        </ul>
      ) : !hasEntries ? (
        <EmptyWatchlist onAdd={onAdd} />
      ) : (
        <>
          {counts.paused > 0 && (
            <ToggleGroup
              type="single"
              variant="outline"
              value={filter}
              onValueChange={(v) => v && setFilter(v as Filter)}
              className="mb-4"
              aria-label="Filter watchlist"
            >
              {(["all", "active", "paused"] as const).map((f) => (
                <ToggleGroupItem key={f} value={f} className="h-9 px-3 capitalize">
                  {f} <span className="text-muted-foreground tabular-nums">{counts[f]}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5">
            {visible.map((e) => (
              <li key={e.id}>
                <AnimeCard
                  entry={e}
                  airing={e.anilist_id ? airing?.get(e.anilist_id) : undefined}
                  now={now}
                  onEdit={() => onEdit(e)}
                  onToggle={() => onToggle(e)}
                  onDelete={() => onDelete(e)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* phones: floating add button above the tab bar */}
      {hasEntries && (
        <Button
          size="icon"
          onClick={onAdd}
          aria-label="Add anime"
          className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 size-14 rounded-2xl shadow-lg shadow-primary/30 md:hidden [&_svg:not([class*='size-'])]:size-6"
        >
          <PlusIcon />
        </Button>
      )}
    </>
  );
}
