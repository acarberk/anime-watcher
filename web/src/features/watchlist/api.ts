import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAiring, searchAnime } from "@/lib/anilist";
import { supabase } from "@/lib/supabase";
import { joinLastSeen, type SeenRow, type WatchEntry, type WatchRow } from "./model";

const KEY = ["watchlist"] as const;

export function useWatchlist() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<WatchEntry[]> => {
      const [w, s] = await Promise.all([
        supabase.from("watchlist").select("*").order("created_at", { ascending: false }),
        // ponytail: reads every seen row; fine for personal lists, switch to a max() view past ~1000 rows
        supabase.from("seen_episodes").select("watchlist_id, season, episode"),
      ]);
      if (w.error) throw w.error;
      if (s.error) throw s.error;
      return joinLastSeen(w.data as WatchRow[], s.data as SeenRow[]);
    },
  });
}

export type WatchInsert = Omit<WatchRow, "id" | "user_id" | "active" | "created_at" | "last_scanned_at" | "last_match_count">;

export function useAddAnime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: WatchInsert) => {
      const { error } = await supabase.from("watchlist").insert(row);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Optimistic: the list reflects the change immediately and rolls back on failure */
export function useUpdateAnime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<WatchRow> }) => {
      const { error } = await supabase.from("watchlist").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<WatchEntry[]>(KEY);
      qc.setQueryData<WatchEntry[]>(KEY, (rows) => rows?.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAnime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("watchlist").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<WatchEntry[]>(KEY);
      qc.setQueryData<WatchEntry[]>(KEY, (rows) => rows?.filter((r) => r.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(KEY, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Next-episode times for every AniList-linked row, in one request */
export function useAiring(ids: number[]) {
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  return useQuery({
    queryKey: ["airing", sorted],
    queryFn: ({ signal }) => fetchAiring(sorted, signal),
    enabled: sorted.length > 0,
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
    select: (media) => new Map(media.map((m) => [m.id, m])),
  });
}

export function useAnimeSearch(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: ["anilist-search", q.toLowerCase()],
    queryFn: ({ signal }) => searchAnime(q, signal),
    enabled: q.length >= 3,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
