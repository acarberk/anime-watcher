import { BellRingIcon, FilterIcon, LayersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand";

const FEATURES = [
  { icon: BellRingIcon, text: "One notification per episode, the moment it's out" },
  { icon: FilterIcon, text: "Only 1080p+ releases with English subtitles" },
  { icon: LayersIcon, text: "The best release when several groups put out the same episode" },
];

/** Lock-screen style stack: the latest notification in front, older ones peeking out behind it */
function NotificationPreview() {
  return (
    <div className="relative pb-5" aria-hidden="true">
      <div className="absolute inset-x-6 top-5 bottom-0 rounded-2xl border border-white/10 bg-white/6" />
      <div className="absolute inset-x-3 top-3 bottom-2.5 rounded-2xl border border-white/12 bg-white/8" />
      <div className="relative flex gap-3 rounded-2xl border border-white/15 bg-white/12 p-4 shadow-2xl shadow-black/25 backdrop-blur-md">
        <LogoMark className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3 text-xs text-white/70">
            <span>Anime Watcher</span>
            <span>now</span>
          </div>
          <p className="mt-0.5 truncate font-medium">🆕 Frieren S2 — Episode 10</p>
          <p className="truncate text-sm text-white/75">1080p · SubsPlease · 1.4 GiB · 312 seeder</p>
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[oklch(0.16_0.04_285)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="bg-brand absolute inset-0 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(40rem_28rem_at_20%_10%,rgb(255_255_255/0.18),transparent_70%)]" />
      <Logo className="relative" />
      <div className="relative max-w-md space-y-10">
        <h2 className="text-4xl leading-[1.15] font-semibold tracking-tight text-balance">
          New episodes, on your phone the moment they drop.
        </h2>
        <NotificationPreview />
        <ul className="space-y-3.5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[0.9375rem] text-white/90">
              <span className="grid size-8 place-items-center rounded-lg bg-white/12">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-sm text-white/60">Nyaa · 1080p+ · English subtitles</p>
    </aside>
  );
}

/** Phones get a compact version of the brand panel above the form (entry screens only) */
function MobileHero() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl p-5 pb-4 text-white lg:hidden">
      <div className="bg-brand absolute inset-0 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(24rem_14rem_at_10%_0%,rgb(255_255_255/0.2),transparent_70%)]" />
      <p className="relative mb-4 text-lg leading-snug font-semibold tracking-tight text-balance">
        New episodes, on your phone the moment they drop.
      </p>
      <div className="relative">
        <NotificationPreview />
      </div>
    </div>
  );
}

export function AuthLayout({
  title,
  description,
  icon,
  hero = false,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  hero?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />
      <main className="bg-glow pt-safe pb-safe flex flex-col px-5 lg:bg-none">
        <div className="flex h-16 items-center lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col py-4 sm:justify-center sm:py-8">
          {hero && <MobileHero />}
          <header className="mb-8 space-y-2">
            {icon && (
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground [&_svg]:size-6">
                {icon}
              </div>
            )}
            <h1 className="text-[1.625rem] leading-tight font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-[0.9375rem] text-pretty text-muted-foreground">{description}</p>}
          </header>
          {children}
          {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
