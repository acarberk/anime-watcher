import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, InfoIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormRow } from "@/components/form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Cover } from "./cover";
import { animeFormSchema, POPULAR_GROUPS, toUpdatePatch, type AnimeFormInput, type AnimeFormValues, type WatchRow } from "./model";

function GroupPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const options = [...new Set([...POPULAR_GROUPS, ...value])];
  const toggle = (g: string) => onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g]);
  const addCustom = () => {
    const g = custom.trim();
    if (g && !value.includes(g)) onChange([...value, g]);
    setCustom("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Release groups">
        {options.map((g) => {
          const on = value.includes(g);
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(g)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                on ? "border-primary/50 bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {on && <CheckIcon className="size-3.5" />}
              {g}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          aria-label="Other release group"
          placeholder="Other group…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" className="h-11 md:h-10" onClick={addCustom} disabled={!custom.trim()}>
          <PlusIcon /> Add
        </Button>
      </div>
    </div>
  );
}

function StartOption({
  checked,
  onSelect,
  title,
  description,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors",
        checked ? "border-primary/60 bg-accent/50" : "hover:bg-muted/50",
      )}
    >
      <input type="radio" name="startMode" checked={checked} onChange={onSelect} className="mt-1 size-4 accent-[var(--primary)]" />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-[0.8125rem] text-muted-foreground">{description}</span>
        {children}
      </span>
    </label>
  );
}

export function AnimeForm({
  mode,
  defaultValues,
  original,
  submitting,
  onBack,
  onCancel,
  onSubmit,
}: {
  mode: "add" | "edit";
  defaultValues: AnimeFormInput;
  original?: WatchRow;
  submitting: boolean;
  onBack?: () => void;
  onCancel: () => void;
  onSubmit: (values: AnimeFormValues) => void;
}) {
  const form = useForm<AnimeFormInput, unknown, AnimeFormValues>({
    resolver: zodResolver(animeFormSchema),
    defaultValues,
  });
  const { errors } = form.formState;
  const [advanced, setAdvanced] = useState(
    () => !!(defaultValues.season || defaultValues.regex || defaultValues.groups?.length),
  );
  const startMode = form.watch("startMode");
  const values = form.watch();
  const cover = defaultValues.cover_url;

  // edit: warn when the change re-runs the first scan
  const parsed = original && animeFormSchema.safeParse(values);
  const reseeds = !!(original && parsed?.success && "seeded" in toUpdatePatch(parsed.data, original));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col">
      <div className="space-y-6 px-4 py-5 sm:px-6">
        {(cover || defaultValues.anilist_id) && (
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5">
            <Cover src={cover} color={defaultValues.cover_color} title={defaultValues.title || "?"} className="w-11" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{values.title || defaultValues.title}</p>
              <p className="text-xs text-muted-foreground">Linked to AniList · cover and airing times</p>
            </div>
            {onBack && (
              <Button type="button" variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeftIcon /> Change
              </Button>
            )}
          </div>
        )}

        <FieldGroup>
          <FormRow id="title" label="Name" hint="Shown in your notifications." error={errors.title?.message}>
            <Input id="title" aria-invalid={!!errors.title} autoComplete="off" {...form.register("title")} />
          </FormRow>
          <FormRow
            id="query"
            label="Nyaa search"
            hint={<>Searched together with “1080p”. Use the name release groups use, often the romaji title.</>}
            error={errors.query?.message}
          >
            <Input id="query" aria-invalid={!!errors.query} autoComplete="off" spellCheck={false} {...form.register("query")} />
          </FormRow>

          {mode === "add" && (
            <fieldset className="space-y-2.5">
              <legend className="mb-2 text-sm font-medium">Notify me about</legend>
              <StartOption
                checked={startMode === "new"}
                onSelect={() => form.setValue("startMode", "new")}
                title="New episodes only"
                description="Everything already on Nyaa is skipped. Recommended."
              />
              <StartOption
                checked={startMode === "from"}
                onSelect={() => form.setValue("startMode", "from")}
                title="Starting from an episode"
                description="Catch up from a specific episode, including ones already out."
              >
                {startMode === "from" && (
                  <span className="block pt-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="Episode number"
                      aria-label="Start from episode"
                      aria-invalid={!!errors.fromEpisode}
                      className="max-w-40"
                      {...form.register("fromEpisode")}
                    />
                    {errors.fromEpisode && <span className="mt-1 block text-sm text-destructive">{errors.fromEpisode.message}</span>}
                  </span>
                )}
              </StartOption>
            </fieldset>
          )}

          <div className="rounded-xl border">
            <button
              type="button"
              aria-expanded={advanced}
              onClick={() => setAdvanced((a) => !a)}
              className="flex h-12 w-full items-center justify-between px-3.5 text-sm font-medium"
            >
              Filters
              <span className="flex items-center gap-2 text-muted-foreground">
                {!advanced && (values.groups?.length || values.season || values.regex) ? (
                  <span className="text-xs">
                    {[values.season && `Season ${values.season}`, values.groups?.length && `${values.groups.length} group(s)`, values.regex && "regex"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
                <ChevronDownIcon className={cn("size-4 transition-transform", advanced && "rotate-180")} />
              </span>
            </button>
            {advanced && (
              <FieldGroup className="border-t p-3.5">
                <FormRow id="groups" label="Release groups" hint="Leave empty to accept any group.">
                  <Controller control={form.control} name="groups" render={({ field }) => <GroupPicker value={field.value} onChange={field.onChange} />} />
                </FormRow>
                <FormRow id="season" label="Season" hint="Only releases tagged with this season. Empty = all seasons." error={errors.season?.message}>
                  <Input id="season" type="number" inputMode="numeric" min={1} className="max-w-40" aria-invalid={!!errors.season} {...form.register("season")} />
                </FormRow>
                <FormRow id="regex" label="Title must match" hint="Regular expression, case-insensitive. E.g. ^\[SubsPlease\]" error={errors.regex?.message}>
                  <Input id="regex" spellCheck={false} autoComplete="off" className="font-mono text-sm" aria-invalid={!!errors.regex} {...form.register("regex")} />
                </FormRow>
              </FieldGroup>
            )}
          </div>

          {reseeds && (
            <p className="flex gap-2 rounded-xl bg-muted/60 p-3 text-[0.8125rem] text-muted-foreground">
              <InfoIcon className="mt-0.5 size-4 shrink-0" />
              The search changed, so the next scan quietly marks everything already released as seen. Only newer episodes will notify.
            </p>
          )}
        </FieldGroup>
      </div>

      <div className="pb-sheet sticky bottom-0 flex gap-2 border-t bg-popover px-4 pt-3 sm:justify-end sm:px-6">
        <Button type="button" variant="ghost" size="xl" className="flex-1 sm:flex-none" onClick={onCancel}>
          <XIcon className="sm:hidden" /> Cancel
        </Button>
        <Button type="submit" size="xl" className="flex-[2] sm:flex-none" disabled={submitting}>
          {submitting && <Spinner />}
          {mode === "add" ? "Add to watchlist" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
