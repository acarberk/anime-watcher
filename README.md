# anime-watcher

Takip ettiğin animelerin yeni bölümleri nyaa.si'de çıkınca bildirim gönderir. İngilizce altyazılı (`1_2`), en az 1080p, bölüm başına tek bildirim. GitHub Actions'ta 30 dakikada bir çalışır, state Supabase'de tutulur.

## Kurulum

Node 24 ve pnpm 10 gerekir (pnpm yoksa `corepack enable` veya her komutta `npx pnpm@10.18.0`).

```bash
pnpm install
cp .env.example .env   # değerleri doldur
pnpm test
```

`pnpm-lock.yaml` dosyasını commit'le, CI `--frozen-lockfile` ile kurar.

## Supabase

1. [supabase.com](https://supabase.com)'da yeni proje aç.
2. SQL Editor → `supabase/migrations/0001_init.sql` içeriğini yapıştır → Run. (Supabase CLI kullanıyorsan: `supabase db push`.)
3. Project Settings → API: `Project URL` → `SUPABASE_URL`, `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`.

RLS açık ve policy yok; tablolara yalnızca service_role key erişir. Bu key'i hiçbir yerde public etme.

## ntfy

1. Telefona ntfy uygulamasını kur (iOS App Store / Google Play / F-Droid).
2. "Subscribe to topic" → tahmin edilemeyecek uzun bir isim gir (ör. `anime-7f3k9q2m1x`). ntfy.sh'ta topic'i bilen herkes okuyabilir/yazabilir.
3. Aynı ismi `NTFY_TOPIC` olarak ayarla. Self-hosted sunucu için `NTFY_URL`, erişim kontrolü varsa `NTFY_TOKEN`.

Telegram için (opsiyonel): @BotFather'dan bot aç → `TELEGRAM_BOT_TOKEN`; bota bir mesaj at, `https://api.telegram.org/bot<token>/getUpdates` çıktısındaki `chat.id` → `TELEGRAM_CHAT_ID`; `NOTIFY_CHANNELS=telegram` veya `ntfy,telegram`.

## GitHub

Repo → Settings → Secrets and variables → Actions:

| Tür | İsim | Zorunlu |
|---|---|---|
| Secret | `SUPABASE_URL` | evet |
| Secret | `SUPABASE_SERVICE_ROLE_KEY` | evet |
| Secret | `NTFY_TOPIC` | ntfy seçiliyse |
| Secret | `NTFY_TOKEN` | hayır |
| Secret | `TELEGRAM_BOT_TOKEN` | telegram seçiliyse |
| Secret | `TELEGRAM_CHAT_ID` | telegram seçiliyse |
| Variable | `NOTIFY_CHANNELS` | hayır (varsayılan `ntfy`) |
| Variable | `NTFY_URL` | hayır (varsayılan `https://ntfy.sh`) |

Elle çalıştırma: Actions → check → Run workflow (`dry_run` işaretlenirse bildirim gitmez, DB'ye yazılmaz).

**Not:** GitHub, 60 gün commit olmayan repolarda scheduled workflow'ları durdurur. Durursa Actions sekmesinden tekrar etkinleştir ya da ara sıra bir commit at.

## Watchlist yönetimi

```bash
pnpm watch:add "Frieren" --query "Sousou no Frieren"
pnpm watch:add "Dandadan" --query "Dandadan" --season 2 --groups SubsPlease,Erai-raws
pnpm watch:add "Frieren" --query "Sousou no Frieren" --regex "^\[SubsPlease\]" --from 5
pnpm watch:list
pnpm watch:remove <id>          # veya tam başlık: pnpm watch:remove "Frieren"
```

- `watch:add` Nyaa'yı bir kez tarar ve şu an mevcut bölümleri (sezon + bölüm bazında) `seen_episodes`'a yazar; böylece ilk run'da eski bölümler bildirilmez, yeni sezon yine bildirilir.
- `--from 5` → tarama yapılmaz, 5. bölüm ve sonrası bildirilir (`min_episode = 4`).
- `--query` verilmezse başlık arama terimi olarak kullanılır. Arama sonucunda alakasız seriler (mini anime, spin-off) çıkıyorsa `--regex` ile daralt.
- Gruplar aynı seriyi farklı numaralandırabilir (ör. SubsPlease `- 30`, Erai-raws `S3 - 06`). Çift bildirim alırsan `--groups` ile tek grup seç.
- Watchlist'i Supabase dashboard → Table Editor'dan da düzenleyebilirsin (`active=false` geçici durdurur).

## Yerel çalıştırma

```bash
DRY_RUN=true pnpm start
```

PowerShell:

```powershell
$env:DRY_RUN='true'; pnpm start
```

Dry-run gerçek Nyaa'ya istek atar, ne bildireceğini loglar; bildirim göndermez, DB'ye yazmaz. Herhangi bir anime hata verirse diğerleri taranmaya devam eder, run sonunda exit code 1 döner.
