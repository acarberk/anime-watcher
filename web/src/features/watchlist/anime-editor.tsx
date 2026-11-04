import { useState } from "react";
import { ResponsiveModal } from "@/components/responsive-modal";
import { prefillFromMedia } from "@/lib/anilist";
import { AnimeForm } from "./anime-form";
import { AnimeSearch } from "./anime-search";
import { emptyForm, rowToForm, type AnimeFormInput, type AnimeFormValues, type WatchRow } from "./model";

export type EditorState = { mode: "add" } | { mode: "edit"; row: WatchRow } | null;

/** Add: search AniList → details. Edit: details only. */
export function AnimeEditor({
  state,
  submitting,
  onClose,
  onSubmit,
}: {
  state: EditorState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: AnimeFormValues) => void;
}) {
  const [draft, setDraft] = useState<AnimeFormInput | null>(null);
  const open = state !== null;
  const editing = state?.mode === "edit";
  const close = () => {
    onClose();
    setTimeout(() => setDraft(null), 300); // after the close animation
  };

  const title = editing ? "Edit anime" : "Add anime";

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => !o && close()} title={title}>
      {editing ? (
        <AnimeForm
          key={state.row.id}
          mode="edit"
          defaultValues={rowToForm(state.row)}
          original={state.row}
          submitting={submitting}
          onCancel={close}
          onSubmit={onSubmit}
        />
      ) : draft ? (
        <AnimeForm
          mode="add"
          defaultValues={draft}
          submitting={submitting}
          onBack={() => setDraft(null)}
          onCancel={close}
          onSubmit={onSubmit}
        />
      ) : (
        open && (
          <AnimeSearch
            onPick={(m) => setDraft({ ...emptyForm, ...prefillFromMedia(m) })}
            onManual={() => setDraft({ ...emptyForm })}
          />
        )
      )}
    </ResponsiveModal>
  );
}
