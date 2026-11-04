# anime-watcher

Takip ettiğin animelerin yeni bölümleri nyaa.si'de çıkınca bildirim gönderir. İngilizce altyazılı (`1_2`), en az 1080p, bölüm başına tek bildirim. GitHub Actions'ta 30 dakikada bir çalışır, state Supabase'de tutulur.

**Arayüz:** https://acarberk.github.io/anime-watcher/ — telefonda "Ana Ekrana Ekle" ile uygulama gibi kurulur (PWA). Her kullanıcı kendi listesini ve kendi ntfy topic'ini yönetir.

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
2. SQL Editor → `supabase/migrations/` altındaki dosyaları sırayla yapıştır → Run. (Supabase CLI kullanıyorsan: `supabase db push`.)
3. Project Settings → API: `Project URL` → `SUPABASE_URL`, `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`.
4. Auth → URL Configuration: Site URL ve Redirect URL olarak arayüz adresi (`https://<kullanıcı>.github.io/anime-watcher/`, redirect'te sonuna `**`).
5. `docs/index.html` içindeki Supabase URL ve publishable key'i kendi projeninkilerle değiştir.

Tüm tablolarda RLS açık. Arayüz publishable key ile çalışır; policy'ler her kullanıcıyı kendi satırlarıyla sınırlar. Cron service_role key ile her şeyi okur — bu key'i hiçbir yerde public etme.

**Yeni kayıtlar:** Auth → Sign In / Providers → "Allow new users to sign up" kapalı tutulur; başkalarını davet etmek bilinçli bir karar olmalı. Ücretsiz Supabase maili yalnızca organizasyon üyelerine ve saatte birkaç adet gönderir; başkalarına açmadan önce özel SMTP gerekir.

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

Normalde arayüzden: giriş yap → bildirim kanalı (ntfy topic) kaydet → anime ekle. "Test bildirimi" ile topic'i doğrula.

CLI (service_role ile, `.env` gerekir). CLI ile eklenen kayıtların kullanıcısı yoktur: env'deki kanallara (`NOTIFY_CHANNELS`, `NTFY_TOPIC`) bildirilir ve arayüzde görünmez.

```bash
pnpm watch:add "Frieren" --query "Sousou no Frieren"
pnpm watch:add "Dandadan" --query "Dandadan" --season 2 --groups SubsPlease,Erai-raws
pnpm watch:add "Frieren" --query "Sousou no Frieren" --regex "^\[SubsPlease\]" --from 5
pnpm watch:list
pnpm watch:remove <id>          # veya tam başlık: pnpm watch:remove "Frieren"
```

- Yeni eklenen kayıt (`seeded=false`) ilk taramada Nyaa'da şu an olan bölümleri sezon + bölüm bazında bildirimsiz görüldü sayar; böylece eski bölümler bildirilmez, yeni sezon yine bildirilir. Arayüzden de CLI'dan da aynı.
- `--from 5` / arayüzde "Şu bölümden itibaren: 5" → ilk tarama atlanır, 5. bölüm ve sonrası bildirilir (`min_episode = 4`).
- Durdurulan bir anime devam ettirilince tekrar ilk tarama yapılır; arada çıkan bölümler toplu bildirim olarak gelmez.
- Aynı Nyaa araması birden fazla kayıtta/kullanıcıda varsa her run'da tek istek atılır.
- `--query` verilmezse başlık arama terimi olarak kullanılır. Arama sonucunda alakasız seriler (mini anime, spin-off) çıkıyorsa `--regex` ile daralt.
- Gruplar aynı seriyi farklı numaralandırabilir (ör. SubsPlease `- 30`, Erai-raws `S3 - 06`). Çift bildirim alırsan `--groups` ile tek grup seç.
- Kullanıcının ntfy topic'i yoksa bölümleri bildirimsiz görüldü sayılır (topic sonradan girilince birikmiş bildirim yağmaz).

## Yerel çalıştırma

```bash
DRY_RUN=true pnpm start
```

PowerShell:

```powershell
$env:DRY_RUN='true'; pnpm start
```

Dry-run gerçek Nyaa'ya istek atar, ne bildireceğini loglar; bildirim göndermez, DB'ye yazmaz. Herhangi bir anime hata verirse diğerleri taranmaya devam eder, run sonunda exit code 1 döner.
