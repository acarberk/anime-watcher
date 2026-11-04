import { ChevronRightIcon, PencilLineIcon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { formatLabel, statusLabel, type AniMedia } from "@/lib/anilist";
import { useDebounced } from "@/lib/hooks";
import { useAnimeSearch } from "./api";
import { Cover } from "./cover";

function Result({ m, onPick }: { m: AniMedia; onPick: () => void }) {
  const title = m.title.english ?? m.title.romaji ?? "Untitled";
  const meta = [formatLabel(m.format), m.seasonYear, statusLabel(m.status), m.episodes && `${m.episodes} eps`]
    .filter(Boolean)
    .join(" · ");
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
      >
        <Cover src={m.coverImage.large} color={m.coverImage.color} title={title} className="w-12" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 leading-snug font-medium">{title}</span>
          {m.title.romaji && m.title.romaji !== title && (
            <span className="block truncate text-[0.8125rem] text-muted-foreground">{m.title.romaji}</span>
          )}
          <span className="block truncate text-xs text-muted-foreground">{meta}</span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}

export function AnimeSearch({ onPick, onManual }: { onPick: (m: AniMedia) => void; onManual: () => void }) {
  const [term, setTerm] = useState("");
  const debounced = useDebounced(term, 350);
  const { data, isFetching, isError, error } = useAnimeSearch(debounced);
  const ready = debounced.trim().length >= 3;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 bg-popover px-4 pt-4 pb-3 sm:px-6">
        <InputGroup className="h-12 rounded-xl md:h-11">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            type="search"
            enterKeyHint="search"
            placeholder="Search AniList, e.g. Frieren"
            aria-label="Search anime"
            className="[&::-webkit-search-cancel-button]:hidden"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            {isFetching ? (
              <Spinner />
            ) : (
              term && (
                <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setTerm("")}>
                  <XIcon />
                </InputGroupButton>
              )
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* fixed minimum height so the sheet doesn't jump while results come and go */}
      <div className="min-h-[50dvh] px-2 pb-2 sm:px-4 md:min-h-80" aria-live="polite">
        {!ready ? (
          <p className="px-2 py-10 text-center text-sm text-muted-foreground">Type at least 3 letters to search.</p>
        ) : isError ? (
          <p className="px-2 py-10 text-center text-sm text-muted-foreground">
            {error.message} You can still add it manually.
          </p>
        ) : data && data.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-muted-foreground">No results for “{debounced}”.</p>
        ) : (
          <ul className="grid gap-1">{data?.map((m) => <Result key={m.id} m={m} onPick={() => onPick(m)} />)}</ul>
        )}
      </div>

      <div className="pb-sheet border-t px-4 pt-3 sm:px-6">
        <Button variant="ghost" className="h-11 w-full text-muted-foreground md:h-9" onClick={onManual}>
          <PencilLineIcon /> Not on AniList? Add it manually
        </Button>
      </div>
    </div>
  );
}
