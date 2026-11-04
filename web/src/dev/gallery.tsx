// Dev-only screen gallery with fixture data, for design review without a signed-in account.
// Registered in the router only when import.meta.env.DEV, so it never ships.
import { useSearchParams } from "react-router";
import { AppShell } from "@/app/app-layout";
import { ResponsiveModal } from "@/components/responsive-modal";
import { SetupFlow } from "@/features/notifications/setup-flow";
import { SetupLayout } from "@/features/notifications/setup-page";
import { SettingsView } from "@/features/settings/settings-view";
import { AnimeForm } from "@/features/watchlist/anime-form";
import { AnimeSearch } from "@/features/watchlist/anime-search";
import { emptyForm, rowToForm, type WatchEntry } from "@/features/watchlist/model";
import { WatchlistView } from "@/features/watchlist/watchlist-view";
import type { Airing } from "@/lib/anilist";

const now = Math.floor(Date.now() / 1000);
const base = {
  title_regex: null,
  season: null,
  min_episode: 0,
  groups: null,
  active: true,
  seeded: true,
  user_id: "dev",
  last_scanned_at: new Date(Date.now() - 12 * 60_000).toISOString(),
  last_match_count: 4,
  created_at: "",
  lastSeen: null,
} satisfies Partial<WatchEntry>;

const cover = (id: string) => `https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/${id}`;

const ENTRIES: WatchEntry[] = [
  { ...base, id: "1", title: "HOTEL INHUMANS", query: "Hotel Inhumans", anilist_id: 199426, cover_url: cover("bx199426-0nBgTV9BrcJn.jpg"), cover_color: "#e45d78", groups: ["SubsPlease"], lastSeen: { season: 2, episode: 5 } },
  { ...base, id: "2", title: "Red River", query: "Sora wa Akai Kawa no Hotori", anilist_id: 207809, cover_url: cover("bx207809-cpS7CAyjN7iP.jpg"), cover_color: "#e4bb5d", lastSeen: { season: 1, episode: 18 } },
  { ...base, id: "3", title: "As a Reincarnated Aristocrat, I'll Use My Appraisal Skill to Rise in the World", query: "Tensei Kizoku, Kantei Skill de Nariagaru", anilist_id: 185756, cover_url: cover("bx185756-xPCl0RyQ7fXD.jpg"), cover_color: "#d6f1c9", lastSeen: { season: 3, episode: 6 } },
  { ...base, id: "4", title: "Nia Liston: The Merciless Maiden", query: "Kyouran Reijou Nia Liston", anilist_id: 206949, cover_url: cover("bx206949-4HYI3YuP0eLI.png"), cover_color: "#f15dbb", seeded: false, last_scanned_at: null, last_match_count: null },
  { ...base, id: "5", title: "DARK MACHINE THE ANIMATION", query: "Dark Machine", anilist_id: 179876, cover_url: cover("bx179876-Wg62CAzp5WQ1.jpg"), cover_color: "#286ba1", title_regex: "Dark Machine - The Animation", last_match_count: 0 },
  { ...base, id: "6", title: "The Cold Sato-san is Only Sweet to Me", query: "Shiotaiou no Satou-san ga Ore ni dake Amai", anilist_id: 209502, cover_url: cover("bx209502-C81oN8M4Smlo.jpg"), cover_color: "#f1bb50", lastSeen: { season: 1, episode: 5 } },
  { ...base, id: "7", title: "Frieren: Beyond Journey’s End", query: "Sousou no Frieren", anilist_id: 182255, cover_url: cover("bx182255-butzrqd4I0aC.jpg"), cover_color: "#5dc9f1", active: false, lastSeen: { season: 2, episode: 10 } },
  { ...base, id: "8", title: "Kaiju No. 8", query: "Kaiju No. 8", anilist_id: null, cover_url: null, cover_color: null, lastSeen: null },
];

const AIRING = new Map<number, Airing>(
  [
    [199426, 6, 2 * 86_400 + 4 * 3_600],
    [207809, 19, 4 * 86_400 + 2 * 3_600],
    [185756, 7, 2 * 86_400],
    [206949, 6, 3 * 86_400 + 20 * 3_600],
    [179876, 5, 5 * 3_600 + 40 * 60],
    [209502, 6, 19 * 60],
  ].map(([id, episode, inS]) => [id, { id, status: "RELEASING", nextAiringEpisode: { episode, airingAt: now + inS } }]),
);

const noop = () => {};
const wait = () => new Promise<void>((r) => setTimeout(r, 600));

export function Gallery() {
  const [params] = useSearchParams();
  const view = params.get("view") ?? "watchlist";
  const shell = (children: React.ReactNode) => <AppShell email="berk@example.com">{children}</AppShell>;
  const list = (p: Partial<React.ComponentProps<typeof WatchlistView>>) => (
    <WatchlistView entries={ENTRIES} loading={false} error={null} airing={AIRING} onRetry={noop} onAdd={noop} onEdit={noop} onToggle={noop} onDelete={noop} {...p} />
  );

  switch (view) {
    case "empty":
      return shell(list({ entries: [] }));
    case "loading":
      return shell(list({ entries: undefined, loading: true }));
    case "error":
      return shell(list({ entries: undefined, error: new Error("Failed to fetch") }));
    case "search":
      return shell(
        <>
          {list({})}
          <ResponsiveModal open onOpenChange={noop} title="Add anime">
            <AnimeSearch onPick={noop} onManual={noop} />
          </ResponsiveModal>
        </>,
      );
    case "add":
      return shell(
        <>
          {list({})}
          <ResponsiveModal open onOpenChange={noop} title="Notification settings">
            <AnimeForm
              mode="add"
              defaultValues={{ ...emptyForm, title: "HOTEL INHUMANS", query: "Hotel Inhumans", anilist_id: 199426, cover_url: ENTRIES[0].cover_url, cover_color: "#e45d78" }}
              submitting={false}
              onBack={noop}
              onCancel={noop}
              onSubmit={noop}
            />
          </ResponsiveModal>
        </>,
      );
    case "edit":
      return shell(
        <>
          {list({})}
          <ResponsiveModal open onOpenChange={noop} title="Edit anime">
            <AnimeForm mode="edit" defaultValues={rowToForm(ENTRIES[4])} original={ENTRIES[4]} submitting={false} onCancel={noop} onSubmit={noop} />
          </ResponsiveModal>
        </>,
      );
    case "setup-1":
    case "setup-2":
    case "setup-3":
      return (
        <SetupLayout>
          <SetupFlow initialStep={Number(view.at(-1)) as 1 | 2 | 3} onTest={wait} onFinish={noop} finishing={false} />
        </SetupLayout>
      );
    case "settings":
      return shell(
        <SettingsView
          email="berk@example.com"
          topic="anime-k3x9q2m7wfb4hz8p"
          install={{ state: "ios", install: noop }}
          onSaveTopic={wait}
          onTest={wait}
          onChangePassword={wait}
          onSignOut={noop}
        />,
      );
    default:
      return shell(list({}));
  }
}
