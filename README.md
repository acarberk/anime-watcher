# anime-watcher

Sends a notification when a new episode of an anime you follow shows up on nyaa.si: English-translated (`1_2`), 1080p or better, one notification per episode. A GitHub Actions cron scans every 30 minutes; state lives in Supabase.

**Web app:** https://acarberk.github.io/anime-watcher/ — an installable PWA ("Add to Home Screen" on phones). Every user manages their own watchlist and their own ntfy topic.

## Repository layout

| Path | What |
|---|---|
| `src/` | Worker: Nyaa RSS fetch, title parsing, filtering, notifications (`pnpm start`) |
| `src/cli/` | Watchlist CLI (`watch:add`, `watch:list`, `watch:remove`) |
| `web/` | Web app: Vite + React + TypeScript + Tailwind + shadcn/ui, standalone package with its own lockfile |
| `supabase/migrations/` | Database schema, applied in order |
| `.github/workflows/check.yml` | The 30-minute scan |
| `.github/workflows/pages.yml` | Builds `web/` and deploys it to GitHub Pages |

## Setup

Node 24 and pnpm 10 (no pnpm installed? `corepack enable`, or prefix commands with `npx pnpm@10.18.0`).

```bash
pnpm install
cp .env.example .env   # fill in the values
pnpm test
```

Commit `pnpm-lock.yaml` (and `web/pnpm-lock.yaml`); CI installs with `--frozen-lockfile`.

## Supabase

1. Create a project on [supabase.com](https://supabase.com).
2. SQL Editor → paste each file in `supabase/migrations/` in order → Run. (With the Supabase CLI: `supabase db push`.)
3. Project Settings → API Keys: project URL → `SUPABASE_URL`, secret / `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`.
4. Auth → URL Configuration: set the Site URL to the web app address and add `https://<user>.github.io/anime-watcher/**` as a redirect URL.
5. Put your project URL and publishable key in `web/src/lib/supabase.ts`.

RLS is on for every table. The web app runs with the publishable key and the policies limit every user to their own rows. The cron reads everything with the service_role key — never expose that key.

**Sign-ups:** keep Auth → Sign In / Providers → "Allow new users to sign up" off unless you deliberately invite people. Supabase's built-in mailer only sends to organization members and a few emails per hour; set up custom SMTP before opening sign-ups.

## Notifications

Users pick how alerts reach them in the app's setup screen:

- **Web Push (default):** "Allow notifications" in the browser; no extra app. Works in Chrome, Edge, Firefox and Safari on desktop and Android. On iPhone/iPad (iOS 16.4+) only from the Home Screen app, so setup walks the user through *Share → Add to Home Screen* first. Brave needs *Use Google services for push messaging* turned on; setup detects the failure and shows the steps. Every connected device is listed in Settings with its last delivery.
- **ntfy (optional):** a separate notifications app, see below.

One-time Web Push setup (generates the VAPID key pair; the private key goes straight into a repo secret and is never printed):

```bash
node scripts/setup-vapid.mjs
gh workflow run pages.yml
```

The script refuses to run a second time: subscriptions are bound to the public key, so regenerating it would disconnect every device. Until it has run, the app offers only the ntfy route and the cron logs `VAPID keys not set`.

A device that has never received anything gets a one-time welcome alert on the next scan, so a broken connection shows up within 30 minutes instead of at the next episode. Subscriptions the browser dropped (404/410) are deleted automatically; signing out disconnects the current browser.

### ntfy

1. Install the ntfy app (App Store / Google Play / F-Droid).
2. Subscribe to a long, unguessable topic name (e.g. `anime-7f3k9q2m1x`). On ntfy.sh anyone who knows a topic can read and publish to it.
3. Save the same topic in the web app (or as `NTFY_TOPIC` for CLI-added rows). For a self-hosted server set `NTFY_URL`, and `NTFY_TOKEN` if it requires auth.

Telegram (optional, CLI rows only): create a bot with @BotFather → `TELEGRAM_BOT_TOKEN`; message the bot, then take `chat.id` from `https://api.telegram.org/bot<token>/getUpdates` → `TELEGRAM_CHAT_ID`; set `NOTIFY_CHANNELS=telegram` or `ntfy,telegram`.

## GitHub

Repository → Settings → Secrets and variables → Actions:

| Type | Name | Required |
|---|---|---|
| Secret | `SUPABASE_URL` | yes |
| Secret | `SUPABASE_SERVICE_ROLE_KEY` | yes |
| Secret | `NTFY_TOPIC` | if ntfy is selected |
| Secret | `NTFY_TOKEN` | no |
| Secret | `TELEGRAM_BOT_TOKEN` | if telegram is selected |
| Secret | `TELEGRAM_CHAT_ID` | if telegram is selected |
| Variable | `NOTIFY_CHANNELS` | no (default `ntfy`) |
| Variable | `NTFY_URL` | no (default `https://ntfy.sh`) |
| Secret | `VAPID_PRIVATE_KEY` | for Web Push (set by `scripts/setup-vapid.mjs`) |
| Variable | `VAPID_PUBLIC_KEY` | for Web Push (set by `scripts/setup-vapid.mjs`) |

Settings → Pages → Source: **GitHub Actions** (the `pages` workflow deploys `web/`).

Manual scan: Actions → check → Run workflow (tick `dry_run` to send nothing and write nothing).

**Note:** GitHub pauses scheduled workflows in repositories with no commits for 60 days. If that happens, re-enable it from the Actions tab or push a commit.

## Managing the watchlist

Normally through the web app: sign in → save your notification channel (ntfy topic) → add anime. Use "Send test notification" to check the topic.

The CLI uses the service_role key (needs `.env`). Rows added through the CLI have no user: they are notified through the env channels (`NOTIFY_CHANNELS`, `NTFY_TOPIC`) and don't show up in the web app.

```bash
pnpm watch:add "Frieren" --query "Sousou no Frieren"
pnpm watch:add "Dandadan" --query "Dandadan" --season 2 --groups SubsPlease,Erai-raws
pnpm watch:add "Frieren" --query "Sousou no Frieren" --regex "^\[SubsPlease\]" --from 5
pnpm watch:list
pnpm watch:remove <id>          # or the exact title: pnpm watch:remove "Frieren"
```

- A new row (`seeded=false`) marks everything already on Nyaa as seen on its first scan, per season + episode, so old episodes aren't notified while a new season still is. Same for the web app and the CLI.
- `--from 5` (web app: "Start from episode 5") skips the first scan and notifies episode 5 and later (`min_episode = 4`).
- Resuming a paused anime re-runs the first scan, so episodes released while it was paused don't arrive as a burst.
- When several rows or users share a Nyaa search, each run fetches it once.
- Without `--query` the title is used as the search term. If the results include unrelated shows (mini anime, spin-offs), narrow them with `--regex`.
- Groups may number the same show differently (e.g. SubsPlease `- 30` vs Erai-raws `S3 - 06`). If you get duplicates, pick one group with `--groups`.
- If a user has no ntfy topic yet, their episodes are marked seen silently (so setting a topic later doesn't flood them).

## Running locally

```bash
DRY_RUN=true pnpm start
```

PowerShell:

```powershell
$env:DRY_RUN='true'; pnpm start
```

A dry run queries the real Nyaa and logs what it would send; it sends nothing and writes nothing. If one anime fails, the others are still scanned and the run exits with code 1.

Web app:

```bash
cd web
pnpm install
pnpm dev
```

`http://localhost:5173/anime-watcher/dev/gallery?view=…` renders every signed-in screen with fixture data (`watchlist`, `empty`, `loading`, `error`, `search`, `add`, `edit`, `setup-1..3`, `settings`) for design review without an account. It only exists in dev builds.

The layout is mobile-first: a bottom tab bar and floating add button on phones, top navigation from tablets up, and the watchlist grid grows from 1 to 5 columns. From 1920px wide the root font size steps up (17 → 20 → 24px), so 1440p and 4K monitors get a proportionally larger UI rather than a tiny one.
