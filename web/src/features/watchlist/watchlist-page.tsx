import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAddAnime, useAiring, useDeleteAnime, useUpdateAnime, useWatchlist } from "./api";
import { AnimeEditor, type EditorState } from "./anime-editor";
import { toInsertRow, toUpdatePatch, type AnimeFormValues, type WatchEntry } from "./model";
import { WatchlistView } from "./watchlist-view";

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

export function WatchlistPage() {
  const list = useWatchlist();
  const airing = useAiring((list.data ?? []).flatMap((e) => (e.anilist_id ? [e.anilist_id] : [])));
  const add = useAddAnime();
  const update = useUpdateAnime();
  const remove = useDeleteAnime();
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirmDelete, setConfirmDelete] = useState<WatchEntry | null>(null);

  function submit(values: AnimeFormValues) {
    if (editor?.mode === "edit") {
      update.mutate(
        { id: editor.row.id, patch: toUpdatePatch(values, editor.row) },
        {
          onSuccess: () => {
            toast.success("Changes saved.");
            setEditor(null);
          },
          onError: (e) => toast.error(errorMessage(e)),
        },
      );
    } else {
      add.mutate(toInsertRow(values), {
        onSuccess: () => {
          toast.success(`${values.title} added`, { description: "New episodes will be notified from the next scan." });
          setEditor(null);
        },
        onError: (e) => toast.error(errorMessage(e)),
      });
    }
  }

  function toggle(e: WatchEntry) {
    // resuming re-seeds, so episodes released while paused don't arrive as a burst
    const patch = e.active ? { active: false } : { active: true, seeded: false };
    update.mutate(
      { id: e.id, patch },
      {
        onSuccess: () => toast(e.active ? `${e.title} paused` : `${e.title} resumed`),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <>
      <WatchlistView
        entries={list.data}
        loading={list.isPending}
        error={list.error}
        airing={airing.data}
        onRetry={() => list.refetch()}
        onAdd={() => setEditor({ mode: "add" })}
        onEdit={(row) => setEditor({ mode: "edit", row })}
        onToggle={toggle}
        onDelete={setConfirmDelete}
      />

      <AnimeEditor
        state={editor}
        submitting={add.isPending || update.isPending}
        onClose={() => setEditor(null)}
        onSubmit={submit}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll stop getting notifications for it. If you add it again later, only new episodes will notify.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const e = confirmDelete!;
                remove.mutate(e.id, {
                  onSuccess: () => toast(`${e.title} removed`),
                  onError: (err) => toast.error(errorMessage(err)),
                });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
